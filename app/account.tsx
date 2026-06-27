import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMe, useUpdateProfile, useChangePassword, useDeleteAccount } from '../src/hooks/useAuth';
import { useTheme } from '../src/hooks/useTheme';
import { useAuthStore } from '../src/store/auth';
import type { ThemeColors } from '../src/theme/tokens';

function extractError(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } };
  if (!e.response) return 'فشل الاتصال';
  const data = e.response.data;
  if (data?.errors) return Object.values(data.errors)[0]?.[0] ?? fallback;
  return data?.message ?? fallback;
}

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

function SectionLabel({ children, colors }: { children: string; colors: ThemeColors }) {
  return (
    <Text style={{ textAlign: 'right', fontSize: 12, fontFamily: 'Cairo-Bold', color: colors.textMuted, marginBottom: 10, marginRight: 4, letterSpacing: 0.3 }}>
      {children}
    </Text>
  );
}

function GroupCard({ children, colors }: { children: React.ReactNode; colors: ThemeColors }) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 1,
      }}
    >
      {children}
    </View>
  );
}

function Divider({ colors }: { colors: ThemeColors }) {
  return <View style={{ height: 1, backgroundColor: colors.border, marginRight: 16 }} />;
}

/** Inline-editable row inside a grouped card. Stacked label + value; save pill on change. */
function FieldRow({
  label,
  initialValue,
  placeholder,
  keyboardType,
  onSave,
  colors,
  isDark,
}: {
  label: string;
  initialValue: string;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  onSave: (value: string) => Promise<unknown>;
  colors: ThemeColors;
  isDark: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const dirty = value.trim() !== initialValue.trim() && value.trim() !== '';

  const save = async () => {
    setError('');
    setSaving(true);
    try {
      await onSave(value.trim());
    } catch (err) {
      setError(extractError(err, 'لم نتمكن من الحفظ'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ textAlign: 'right', fontSize: 11, fontFamily: 'Cairo-SemiBold', color: colors.textMuted, marginBottom: 1 }}>
            {label}
          </Text>
          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder={placeholder}
            placeholderTextColor={colors.textMuted}
            keyboardType={keyboardType}
            autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
            autoCorrect={false}
            textAlign="right"
            style={{ color: colors.textPrimary, fontFamily: 'Cairo-Bold', fontSize: 15.5, writingDirection: 'rtl', paddingVertical: Platform.OS === 'ios' ? 4 : 2 }}
          />
        </View>

        {dirty ? (
          <Pressable
            onPress={save}
            hitSlop={8}
            style={({ pressed }) => ({
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 999,
              backgroundColor: '#1E40AF',
              transform: [{ scale: pressed ? 0.96 : 1 }],
              opacity: saving ? 0.7 : 1,
            })}
          >
            <Text style={{ color: isDark ? '#FFFFFF' : '#000000', fontFamily: 'Cairo-Bold', fontSize: 12.5 }}>
              {saving ? '...' : 'حفظ'}
            </Text>
          </Pressable>
        ) : (
          <Ionicons name="create-outline" size={17} color={colors.textDisabled} />
        )}
      </View>
      {error ? <Text style={{ marginTop: 6, textAlign: 'right', fontSize: 12, color: colors.error, fontFamily: 'Cairo-Regular' }}>{error}</Text> : null}
    </View>
  );
}

function PasswordSection({ colors, isDark }: { colors: ThemeColors; isDark: boolean }) {
  const changePassword = useChangePassword();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const input = {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 10,
    textAlign: 'right' as const,
    color: colors.textPrimary,
    fontFamily: 'Cairo-Regular',
    fontSize: 14,
    writingDirection: 'rtl' as const,
  };

  const submit = async () => {
    setError('');
    if (!current) return setError('أدخل كلمتك الحالية');
    if (!passwordRegex.test(next)) return setError('8 أحرف: حروف كبيرة وصغيرة ورقم');
    if (next === current) return setError('كلمتك الجديدة يجب أن تختلف عن الحالية');
    if (next !== confirm) return setError('كلمات المرور غير متطابقة');
    try {
      await changePassword.mutateAsync({ current_password: current, password: next, password_confirmation: confirm });
      setDone(true);
      setCurrent(''); setNext(''); setConfirm('');
      setTimeout(() => { setOpen(false); setDone(false); }, 1200);
    } catch (err) {
      setError(extractError(err, 'فشل تغيير كلمتك'));
    }
  };

  return (
    <GroupCard colors={colors}>
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, gap: 12 }}>
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 12, flex: 1 }}>
          <View style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceAlt }}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.primary} />
          </View>
          <View>
            <Text style={{ textAlign: 'right', fontSize: 15, fontFamily: 'Cairo-Bold', color: colors.textPrimary }}>كلمتك</Text>
            <Text style={{ textAlign: 'right', fontSize: 11, fontFamily: 'Cairo-Regular', color: colors.textMuted, marginTop: 1 }}>••••••••</Text>
          </View>
        </View>
        <Pressable
          onPress={() => { setOpen((v) => !v); setError(''); }}
          hitSlop={8}
          style={({ pressed }) => ({ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: open ? colors.surfaceAlt : colors.primarySoft, transform: [{ scale: pressed ? 0.96 : 1 }] })}
        >
          <Text style={{ color: open ? colors.textSecondary : isDark ? '#60A5FA' : '#1E40AF', fontFamily: 'Cairo-Bold', fontSize: 12.5 }}>{open ? 'إلغاء' : 'تغيير'}</Text>
        </Pressable>
      </View>

      {open ? (
        <View style={{ paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 4 }}>
          {done ? (
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 }}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={{ textAlign: 'center', color: colors.success, fontFamily: 'Cairo-Bold', fontSize: 14 }}>تم تغيير كلمتك بنجاح</Text>
            </View>
          ) : (
            <>
              <TextInput value={current} onChangeText={setCurrent} placeholder="كلمتك الحالية" placeholderTextColor={colors.textMuted} secureTextEntry textAlign="right" style={input} />
              <TextInput value={next} onChangeText={setNext} placeholder="كلمتك الجديدة" placeholderTextColor={colors.textMuted} secureTextEntry textAlign="right" style={input} />
              <TextInput value={confirm} onChangeText={setConfirm} placeholder="أعد كتابة كلمتك" placeholderTextColor={colors.textMuted} secureTextEntry textAlign="right" style={input} />
              {error ? <Text style={{ marginTop: 8, textAlign: 'right', color: colors.error, fontFamily: 'Cairo-Regular', fontSize: 12 }}>{error}</Text> : null}
              <Pressable
                onPress={submit}
                disabled={changePassword.isPending}
                style={({ pressed }) => ({ marginTop: 16, marginHorizontal: -16, paddingHorizontal: 16, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colors.primary, opacity: changePassword.isPending ? 0.65 : pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] })}
              >
                <Text style={{ color: isDark ? '#FFFFFF' : '#000000', fontFamily: 'Cairo-Bold', fontSize: 15, fontWeight: '700' }}>{changePassword.isPending ? 'جاري الحفظ...' : 'حفظ كلمتك'}</Text>
              </Pressable>
            </>
          )}
        </View>
      ) : null}
    </GroupCard>
  );
}

export default function AccountScreen() {
  const { colors, isDark } = useTheme();
  const storeUser = useAuthStore((s) => s.user);
  const { data: meUser } = useMe();
  const user = meUser ?? storeUser;
  const updateProfile = useUpdateProfile();
  const deleteAccount = useDeleteAccount();

  // One restrained entrance: fade + slight rise (native driver, ease-out).
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(14)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 340, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 340, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [fade, rise]);

  const [customAlert, setCustomAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons: Array<{ text: string; style?: 'cancel' | 'destructive' | 'default'; onPress?: () => void }>;
  }>({ visible: false, title: '', message: '', buttons: [] });

  const showRTLAlert = useCallback((
    title: string,
    message: string,
    buttons: Array<{ text: string; style?: 'cancel' | 'destructive' | 'default'; onPress?: () => void }>,
  ) => {
    setCustomAlert({ visible: true, title, message, buttons });
  }, []);

  const confirmDelete = () => {
    showRTLAlert(
      'حذف حسابك نهائياً',
      'لا يمكن استرجاع هذا الإجراء بعد تنفيذه. سيتم حذف جميع بيانات حسابك وملفك الشخصي من النظام.',
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'نعم، احذف حسابي', style: 'destructive', onPress: () => deleteAccount.mutate() },
      ],
    );
  };

  const initial = user?.name ? user.name.trim().charAt(0).toUpperCase() : 'U';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['bottom']}>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fade, transform: [{ translateY: rise }] }}>
            {/* Identity hero */}
            <View style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 28 }}>
              <View
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: 28,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.goldSoft,
                  borderWidth: 1,
                  borderColor: colors.goldBorder,
                }}
              >
                <Text style={{ fontSize: 36, fontFamily: 'Cairo-Black', color: colors.goldText }}>{initial}</Text>
              </View>
              <Text style={{ marginTop: 14, fontSize: 21, fontFamily: 'Cairo-Black', color: colors.textPrimary }} numberOfLines={1}>
                {user?.name ?? ''}
              </Text>
              {user?.email ? (
                <Text style={{ marginTop: 3, fontSize: 13, fontFamily: 'Cairo-Regular', color: colors.textMuted }} numberOfLines={1}>
                  {user.email}
                </Text>
              ) : null}
            </View>

            {/* Personal info */}
            <SectionLabel colors={colors}>المعلومات الشخصية</SectionLabel>
            <GroupCard colors={colors}>
              {user?.name && (
                <>
                  <FieldRow label="اسمك" initialValue={user.name} placeholder="اسمك" onSave={(v) => updateProfile.mutateAsync({ name: v })} colors={colors} isDark={isDark} />
                  {user?.email && <Divider colors={colors} />}
                </>
              )}
              {user?.email && (
                <FieldRow label="بريدك الإلكتروني" initialValue={user.email} placeholder="بريدك الإلكتروني" keyboardType="email-address" onSave={(v) => updateProfile.mutateAsync({ email: v })} colors={colors} isDark={isDark} />
              )}
            </GroupCard>

            {/* Security */}
            <View style={{ height: 24 }} />
            <SectionLabel colors={colors}>الأمان</SectionLabel>
            <PasswordSection colors={colors} isDark={isDark} />

            {/* Danger */}
            <View style={{ height: 28 }} />
            <SectionLabel colors={colors}>حذف الحساب</SectionLabel>
            <GroupCard colors={colors}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, gap: 12 }}>
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 12, flex: 1 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? 'rgba(248,113,113,0.12)' : 'rgba(239,68,68,0.08)' }}>
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </View>
                  <View>
                    <Text style={{ textAlign: 'right', fontSize: 15, fontFamily: 'Cairo-Bold', color: colors.textPrimary }}>حذف الحساب</Text>
                    <Text style={{ textAlign: 'right', fontSize: 11, fontFamily: 'Cairo-Regular', color: colors.textMuted, marginTop: 1 }}>حذف حسابك ولا يمكن التراجع عن هذا</Text>
                  </View>
                </View>
                <Pressable
                  onPress={confirmDelete}
                  hitSlop={8}
                  style={({ pressed }) => ({
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: isDark ? 'rgba(248,113,113,0.18)' : 'rgba(239,68,68,0.12)',
                    transform: [{ scale: pressed ? 0.96 : 1 }]
                  })}
                >
                  <Text style={{ color: isDark ? '#F87171' : '#DC2626', fontFamily: 'Cairo-Bold', fontSize: 12.5 }}>حذف</Text>
                </Pressable>
              </View>
            </GroupCard>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Custom RTL Alert Modal */}
      <Modal
        visible={customAlert.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setCustomAlert((prev) => ({ ...prev, visible: false }))}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View
            style={{
              width: '90%',
              maxWidth: 380,
              backgroundColor: colors.surface,
              borderRadius: 32,
              paddingTop: 36,
              paddingHorizontal: 28,
              paddingBottom: 28,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              shadowColor: colors.shadow,
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.18,
              shadowRadius: 24,
              elevation: 12,
            }}
          >
            {(() => {
              const t = customAlert.title || '';
              let iconName: keyof typeof Ionicons.glyphMap = 'information-circle-outline';
              let iconColor = colors.primary;
              let iconBg = colors.primarySoft;
              let shouldBeDestructive = false;

              if (t.includes('حذف')) {
                iconName = 'trash-outline';
                iconColor = colors.error;
                iconBg = isDark ? 'rgba(248, 113, 113, 0.18)' : 'rgba(239, 68, 68, 0.12)';
                shouldBeDestructive = true;
              } else if (t.includes('تسجيل الدخول')) {
                iconName = 'lock-closed-outline';
                iconColor = colors.primary;
                iconBg = colors.primarySoft;
              } else if (t.includes('تعذّر') || t.includes('مسبقاً') || t.includes('خطأ')) {
                iconName = 'alert-circle-outline';
                iconColor = colors.gold;
                iconBg = colors.goldSoft;
              } else if (t.includes('تم') || t.includes('نجاح')) {
                iconName = 'checkmark-circle-outline';
                iconColor = colors.success;
                iconBg = isDark ? 'rgba(52, 211, 153, 0.18)' : 'rgba(16, 185, 129, 0.12)';
              }

              return (
                <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                  <Ionicons name={iconName} size={36} color={iconColor} />
                </View>
              );
            })()}

            <Text style={{ fontSize: 20, fontFamily: 'Cairo-Black', color: colors.textPrimary, textAlign: 'center', marginBottom: 14, lineHeight: 28 }}>
              {customAlert.title}
            </Text>

            <Text style={{ fontSize: 15, fontFamily: 'Cairo-Regular', color: colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 32, writingDirection: 'rtl' }}>
              {customAlert.message}
            </Text>

            <View style={{ width: '100%', flexDirection: 'row', gap: 12, justifyContent: 'space-between' }}>
              {(() => {
                const actionButtons = customAlert.buttons || [];

                if (actionButtons.length === 0) {
                  return (
                    <Pressable
                      onPress={() => setCustomAlert((prev) => ({ ...prev, visible: false }))}
                      style={({ pressed }) => ({
                        flex: 1,
                        height: 52,
                        borderRadius: 18,
                        backgroundColor: '#1E40AF',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: pressed ? 0.85 : 1,
                        transform: [{ scale: pressed ? 0.97 : 1 }],
                      })}
                    >
                      <Text style={{ fontSize: 15, fontFamily: 'Cairo-Bold', color: isDark ? '#FFFFFF' : '#000000' }}>حسناً</Text>
                    </Pressable>
                  );
                }

                const sortedButtons = [...actionButtons].sort((a, b) => {
                  // Cancel first (left), then destructive/primary (right)
                  if (a.style === 'cancel' && b.style !== 'cancel') return -1;
                  if (a.style !== 'cancel' && b.style === 'cancel') return 1;
                  return 0;
                });

                return sortedButtons.map((btn, idx) => {
                  const isCancel = btn.style === 'cancel';
                  const isDestructive = btn.style === 'destructive';

                  return (
                    <Pressable
                      key={idx}
                      onPress={() => {
                        setCustomAlert((prev) => ({ ...prev, visible: false }));
                        btn.onPress?.();
                      }}
                      style={({ pressed }) => ({
                        flex: isDestructive ? 1.5 : 1,
                        height: 52,
                        borderRadius: 18,
                        backgroundColor: isCancel ? colors.surfaceAlt : isDestructive ? colors.error : colors.primary,
                        borderWidth: isCancel ? 1.5 : 0,
                        borderColor: isCancel ? colors.borderStrong : undefined,
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: pressed ? 0.85 : 1,
                        transform: [{ scale: pressed ? 0.97 : 1 }],
                      })}
                    >
                      <Text style={{ fontSize: 14, fontFamily: 'Cairo-Bold', color: isDestructive ? isDark ? '#FFFFFF' : '#000000' : isCancel ? colors.textPrimary : isDark ? '#FFFFFF' : '#000000' }}>
                        {btn.text}
                      </Text>
                    </Pressable>
                  );
                });
              })()}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
