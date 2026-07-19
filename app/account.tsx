import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RTLAlert, useRTLAlert } from '../components/ui/RTLAlert';
import { useChangePassword, useDeleteAccount, useMe, useUpdateProfile } from '../src/hooks/useAuth';
import { useTheme } from '../src/hooks/useTheme';
import { useAuthStore } from '../src/store/auth';
import type { ThemeColors } from '../src/theme/tokens';
import { isValidEmail, isValidName, normalizeEmail, normalizeName } from '../src/utils/authValidation';
import { rtlRow } from '../src/utils/rtl';

function extractError(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } };
  if (!e.response) return 'فشل الاتصال بالخادم';
  const data = e.response.data;
  if (data?.errors) return Object.values(data.errors)[0]?.[0] ?? fallback;
  return data?.message ?? fallback;
}

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

function SectionLabel({ children, colors }: { children: string; colors: ThemeColors }) {
  return (
    <Text style={{ textAlign: 'right', fontSize: 12, fontFamily: 'Cairo-Bold', color: colors.textMuted, marginBottom: 10, marginRight: 4 }}>
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
      }}
    >
      {children}
    </View>
  );
}

function Divider({ colors }: { colors: ThemeColors }) {
  return <View style={{ height: 1, backgroundColor: colors.border, marginRight: 16 }} />;
}

function FieldRow({
  label,
  initialValue,
  placeholder,
  keyboardType,
  type = 'text',
  onSave,
  colors,
}: {
  label: string;
  initialValue: string;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  type?: 'name' | 'email' | 'text';
  onSave: (value: string) => Promise<unknown>;
  colors: ThemeColors;
}) {
  const [value, setValue] = useState(initialValue);
  const [baseline, setBaseline] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setValue(initialValue);
    setBaseline(initialValue);
    setError('');
    setSaved(false);
  }, [initialValue]);

  const normalizedValue = type === 'email' ? normalizeEmail(value) : type === 'name' ? normalizeName(value) : value.trim();
  const dirty = normalizedValue !== baseline.trim() && normalizedValue !== '';
  const canSave = dirty && !saving;

  const save = async () => {
    if (!canSave) return;
    setError('');
    setSaved(false);

    if (type === 'name' && !isValidName(normalizedValue)) {
      setError('أدخل اسماً صحيحاً بدون أرقام أو رموز.');
      return;
    }

    if (type === 'email' && !isValidEmail(normalizedValue)) {
      setError('أدخل بريداً إلكترونياً صحيحاً.');
      return;
    }

    setSaving(true);
    try {
      await onSave(normalizedValue);
      setValue(normalizedValue);
      setBaseline(normalizedValue);
      setSaved(true);
    } catch (err) {
      setError(extractError(err, 'لم نتمكن من حفظ التغيير.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
      <View style={{ ...rtlRow(), alignItems: 'center', gap: 12 }}>
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
            autoComplete={type === 'email' ? 'email' : type === 'name' ? 'name' : undefined}
            autoCorrect={false}
            inputMode={type === 'email' ? 'email' : undefined}
            returnKeyType="done"
            onSubmitEditing={save}
            textAlign="right"
            cursorColor={colors.primary}
            selectionColor={colors.primary}
            style={{ minHeight: 38, color: colors.textPrimary, fontFamily: 'Cairo-Bold', fontSize: 15.5, writingDirection: 'rtl', paddingVertical: Platform.OS === 'ios' ? 4 : 2 }}
          />
        </View>

        <Pressable
          onPress={save}
          disabled={!canSave}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSave, busy: saving }}
          accessibilityLabel={`حفظ ${label}`}
          hitSlop={8}
          style={({ pressed }) => ({
            minWidth: 82,
            minHeight: 36,
            paddingHorizontal: 14,
            paddingVertical: 7,
            borderRadius: 999,
            backgroundColor: canSave ? '#DBEAFE' : colors.surfaceAlt,
            borderWidth: 1,
            borderColor: canSave ? '#1E3A8A' : colors.border,
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ scale: pressed && canSave ? 0.96 : 1 }],
            opacity: saving ? 0.78 : 1,
          })}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#1E3A8A" />
          ) : (
            <Text style={{ color: canSave ? '#1E3A8A' : colors.textMuted, fontFamily: 'Cairo-Bold', fontSize: 13 }}>
              {dirty ? 'حفظ' : saved ? 'تم الحفظ' : 'محفوظ'}
            </Text>
          )}
        </Pressable>
      </View>

      {saved && !dirty ? (
        <View style={{ ...rtlRow(), alignItems: 'center', gap: 5, marginTop: 6 }}>
          <Ionicons name="checkmark-circle" size={14} color={colors.success} />
          <Text style={{ textAlign: 'right', fontSize: 12, color: colors.success, fontFamily: 'Cairo-SemiBold' }}>
            تم حفظ التغيير
          </Text>
        </View>
      ) : null}
      {error ? <Text style={{ marginTop: 6, textAlign: 'right', fontSize: 12, color: colors.error, fontFamily: 'Cairo-Regular' }}>{error}</Text> : null}
    </View>
  );
}

function PasswordSection({ colors }: { colors: ThemeColors }) {
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
    if (!current) return setError('أدخل كلمة المرور الحالية.');
    if (!passwordRegex.test(next)) return setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل وتحتوي على حرف كبير وحرف صغير ورقم.');
    if (next === current) return setError('كلمة المرور الجديدة يجب أن تختلف عن الحالية.');
    if (next !== confirm) return setError('كلمتا المرور غير متطابقتين.');

    try {
      await changePassword.mutateAsync({ current_password: current, password: next, password_confirmation: confirm });
      setDone(true);
      setCurrent('');
      setNext('');
      setConfirm('');
      setTimeout(() => {
        setOpen(false);
        setDone(false);
      }, 1200);
    } catch (err) {
      setError(extractError(err, 'فشل تغيير كلمة المرور.'));
    }
  };

  return (
    <GroupCard colors={colors}>
      <View style={{ ...rtlRow(), alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, gap: 12 }}>
        <View style={{ ...rtlRow(), alignItems: 'center', gap: 12, flex: 1 }}>
          <View style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceAlt }}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.primary} />
          </View>
          <View>
            <Text style={{ textAlign: 'right', fontSize: 15, fontFamily: 'Cairo-Bold', color: colors.textPrimary }}>كلمة المرور</Text>
            <Text style={{ textAlign: 'right', fontSize: 11, fontFamily: 'Cairo-Regular', color: colors.textMuted, marginTop: 1 }}>••••••••</Text>
          </View>
        </View>
        <Pressable
          onPress={() => {
            setOpen((v) => !v);
            setError('');
          }}
          hitSlop={8}
          style={({ pressed }) => ({ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: open ? colors.surfaceAlt : colors.primarySoft, transform: [{ scale: pressed ? 0.96 : 1 }] })}
        >
          <Text style={{ color: open ? colors.textSecondary : colors.primary, fontFamily: 'Cairo-Bold', fontSize: 12.5 }}>{open ? 'إلغاء' : 'تغيير'}</Text>
        </Pressable>
      </View>

      {open ? (
        <View style={{ paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 4 }}>
          {done ? (
            <View style={{ ...rtlRow(), alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 }}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={{ textAlign: 'center', color: colors.success, fontFamily: 'Cairo-Bold', fontSize: 14 }}>تم تغيير كلمة المرور بنجاح</Text>
            </View>
          ) : (
            <>
              <TextInput value={current} onChangeText={setCurrent} placeholder="أدخل كلمة المرور الحالية" placeholderTextColor={colors.textMuted} secureTextEntry textAlign="right" style={input} />
              <TextInput value={next} onChangeText={setNext} placeholder="أدخل كلمة المرور الجديدة" placeholderTextColor={colors.textMuted} secureTextEntry textAlign="right" style={input} />
              <TextInput value={confirm} onChangeText={setConfirm} placeholder="أعد إدخال كلمة المرور الجديدة" placeholderTextColor={colors.textMuted} secureTextEntry textAlign="right" style={input} />
              {error ? <Text style={{ marginTop: 8, textAlign: 'right', color: colors.error, fontFamily: 'Cairo-Regular', fontSize: 12 }}>{error}</Text> : null}
              <Pressable
                onPress={submit}
                disabled={changePassword.isPending}
                style={({ pressed }) => ({ marginTop: 16, paddingHorizontal: 16, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#DBEAFE', borderWidth: 1, borderColor: '#1E3A8A', opacity: changePassword.isPending ? 0.65 : pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] })}
              >
                <Text style={{ color: '#1E3A8A', fontFamily: 'Cairo-Bold', fontSize: 15 }}>{changePassword.isPending ? 'جاري الحفظ...' : 'حفظ كلمة المرور'}</Text>
              </Pressable>
            </>
          )}
        </View>
      ) : null}
    </GroupCard>
  );
}

export default function AccountScreen() {
  const { colors } = useTheme();
  const storeUser = useAuthStore((s) => s.user);
  const meQuery = useMe();
  const meUser = meQuery.data;
  const user = meUser ?? storeUser;
  const updateProfile = useUpdateProfile();
  const deleteAccount = useDeleteAccount();
  const { alert, showAlert, hideAlert } = useRTLAlert();

  const confirmDelete = () => {
    showAlert(
      'حذف حسابك نهائياً',
      'لا يمكن استرجاع هذا الإجراء بعد تنفيذه. سيتم حذف حسابك وبياناتك من النظام.',
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'نعم، احذف حسابي', style: 'destructive', onPress: () => deleteAccount.mutate() },
      ],
    );
  };

  const initial = user?.name ? user.name.trim().charAt(0).toUpperCase() : 'U';
  const isLoadingUser = !user && meQuery.isLoading;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View>
            <View style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 28 }}>
              <View style={{ width: 84, height: 84, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.goldSoft, borderWidth: 1, borderColor: colors.goldBorder }}>
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

            <SectionLabel colors={colors}>المعلومات الشخصية</SectionLabel>
            {isLoadingUser ? (
              <GroupCard colors={colors}>
                <View style={{ paddingVertical: 26, alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={{ marginTop: 10, color: colors.textMuted, fontFamily: 'Cairo-SemiBold', fontSize: 13, textAlign: 'center' }}>
                    جاري تحميل بيانات الحساب...
                  </Text>
                </View>
              </GroupCard>
            ) : user ? (
              <GroupCard colors={colors}>
                <FieldRow label="الاسم الكامل" initialValue={user.name ?? ''} placeholder="أدخل اسمك الكامل" type="name" onSave={(v) => updateProfile.mutateAsync({ name: v })} colors={colors} />
                <Divider colors={colors} />
                <FieldRow label="البريد الإلكتروني" initialValue={user.email ?? ''} placeholder="أدخل بريدك الإلكتروني" keyboardType="email-address" type="email" onSave={(v) => updateProfile.mutateAsync({ email: v })} colors={colors} />
              </GroupCard>
            ) : meQuery.isError ? (
              <GroupCard colors={colors}>
                <View style={{ padding: 18, alignItems: 'center' }}>
                  <Ionicons name="cloud-offline-outline" size={24} color={colors.error} />
                  <Text style={{ marginTop: 8, color: colors.textPrimary, fontFamily: 'Cairo-Bold', fontSize: 14, textAlign: 'center' }}>
                    تعذر تحميل معلومات الحساب
                  </Text>
                  <Pressable
                    onPress={() => meQuery.refetch()}
                    accessibilityRole="button"
                    accessibilityLabel="إعادة تحميل معلومات الحساب"
                    style={({ pressed }) => ({
                      marginTop: 12,
                      minHeight: 40,
                      paddingHorizontal: 18,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: colors.primary,
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    <Text style={{ color: '#FFFFFF', fontFamily: 'Cairo-Bold', fontSize: 13 }}>إعادة المحاولة</Text>
                  </Pressable>
                </View>
              </GroupCard>
            ) : (
              <GroupCard colors={colors}>
                <View style={{ padding: 18 }}>
                  <Text style={{ color: colors.textPrimary, fontFamily: 'Cairo-Bold', fontSize: 15, textAlign: 'right', writingDirection: 'rtl' }}>
                    سجل الدخول لعرض معلوماتك الشخصية.
                  </Text>
                </View>
              </GroupCard>
            )}

            <View style={{ height: 24 }} />
            <SectionLabel colors={colors}>الأمان</SectionLabel>
            <PasswordSection colors={colors} />

            <View style={{ height: 28 }} />
            <SectionLabel colors={colors}>حذف الحساب</SectionLabel>
            <GroupCard colors={colors}>
              <View style={{ ...rtlRow(), alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, gap: 12 }}>
                <View style={{ ...rtlRow(), alignItems: 'center', gap: 12, flex: 1 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.errorSoft }}>
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ textAlign: 'right', fontSize: 15, fontFamily: 'Cairo-Bold', color: colors.textPrimary }}>حذف الحساب</Text>
                    <Text style={{ textAlign: 'right', fontSize: 11, fontFamily: 'Cairo-Regular', color: colors.textMuted, marginTop: 1 }}>حذف حسابك نهائياً من دلني</Text>
                  </View>
                </View>
                <Pressable onPress={confirmDelete} hitSlop={8} style={({ pressed }) => ({ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.errorSoft, transform: [{ scale: pressed ? 0.96 : 1 }] })}>
                  <Text style={{ color: colors.error, fontFamily: 'Cairo-Bold', fontSize: 12.5 }}>حذف</Text>
                </Pressable>
              </View>
            </GroupCard>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <RTLAlert alert={alert} onDismiss={hideAlert} />

      <Modal visible={deleteAccount.isPending} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.55)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ width: '86%', maxWidth: 340, borderRadius: 24, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 24, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.error} />
            <Text style={{ marginTop: 16, fontSize: 16, fontFamily: 'Cairo-Bold', color: colors.textPrimary, textAlign: 'center' }}>
              جاري حذف الحساب...
            </Text>
            <Text style={{ marginTop: 8, fontSize: 13, fontFamily: 'Cairo-Regular', color: colors.textSecondary, textAlign: 'center', lineHeight: 22 }}>
              يرجى الانتظار حتى تكتمل العملية.
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
