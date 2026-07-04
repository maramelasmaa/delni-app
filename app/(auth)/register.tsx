import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PremiumButton, PremiumField, usePremiumAuthColors } from '../../components/auth/premiumAuth';
import { useRegister } from '../../src/hooks/useAuth';
import { parseApiError } from '../../src/lib/error-parser';
import { isValidEmail, isValidName, isValidPassword, normalizeEmail, normalizeName } from '../../src/utils/authValidation';

export default function RegisterScreen() {
  const C = usePremiumAuthColors();
  const { redirectTo } = useLocalSearchParams<{ redirectTo?: string }>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmationRef = useRef<TextInput>(null);
  const register = useRegister();

  const formValid = useMemo(
    () =>
      isValidName(normalizeName(name)) &&
      isValidEmail(normalizeEmail(email)) &&
      isValidPassword(password) &&
      confirmation.length > 0 &&
      password === confirmation,
    [name, email, password, confirmation],
  );

  const handleRegister = async () => {
    setErrors({});
    const normalizedName = normalizeName(name);
    const normalizedEmail = normalizeEmail(email);

    if (!isValidName(normalizedName)) return setErrors({ name: 'أدخل اسمًا صحيحًا بدون أرقام أو رموز' });
    if (!isValidEmail(normalizedEmail)) return setErrors({ email: 'أدخل بريدًا إلكترونيًا صحيحًا' });
    if (!password) return setErrors({ password: 'أدخل كلمة المرور' });
    if (!isValidPassword(password)) return setErrors({ password: 'استخدم 8 أحرف على الأقل مع حرف كبير وحرف صغير ورقم' });
    if (password !== confirmation) return setErrors({ password_confirmation: 'كلمتا المرور غير متطابقتين' });

    try {
      await register.mutateAsync({
        name: normalizedName,
        email: normalizedEmail,
        password,
        password_confirmation: confirmation,
        redirectTo,
      });
    } catch (err: unknown) {
      const parsed = parseApiError(err);
      setErrors(Object.keys(parsed.fieldErrors).length ? parsed.fieldErrors : { general: parsed.message });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 44 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            <View style={{ alignItems: 'center', marginTop: 24, marginBottom: 40 }}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'flex-start' }}>
                <Text style={{ fontSize: 48, fontFamily: 'Cairo-Black', color: C.text }}>دلني</Text>
                <Text style={{ fontSize: 48, fontFamily: 'Cairo-Black', color: C.orange }}>.</Text>
              </View>
              <Text style={{ marginTop: 20, fontSize: 22, fontFamily: 'Cairo-Bold', color: C.text, textAlign: 'center' }}>إنشاء حساب جديد</Text>
            </View>

            {errors.general ? (
              <View style={{ marginBottom: 16, borderRadius: 14, backgroundColor: C.errorBg, borderWidth: 1, borderColor: C.errorBorder, paddingVertical: 12, paddingHorizontal: 14 }}>
                <Text style={{ textAlign: 'center', color: C.error, fontFamily: 'Cairo-SemiBold', fontSize: 13.5, writingDirection: 'rtl' }}>{errors.general}</Text>
              </View>
            ) : null}

            <PremiumField
              label="الاسم الكامل"
              value={name}
              onChangeText={setName}
              placeholder="أدخل اسمك الكامل"
              icon="person-outline"
              error={errors.name}
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
            />

            <PremiumField
              label="البريد الإلكتروني"
              value={email}
              onChangeText={setEmail}
              placeholder="أدخل بريدك الإلكتروني"
              icon="mail-outline"
              error={errors.email}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              inputRef={emailRef}
              onSubmitEditing={() => passwordRef.current?.focus()}
            />

            <PremiumField
              label="كلمة المرور"
              value={password}
              onChangeText={setPassword}
              placeholder="أدخل كلمة المرور"
              icon="lock-closed-outline"
              error={errors.password}
              password
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="next"
              inputRef={passwordRef}
              onSubmitEditing={() => confirmationRef.current?.focus()}
            />

            <View
              style={{
                marginTop: -6,
                marginBottom: 16,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: C.outlineMuted,
                backgroundColor: C.iconBg,
                paddingHorizontal: 12,
                paddingVertical: 10,
                gap: 7,
              }}
            >
              <Text style={{ color: C.text, fontSize: 12.5, fontFamily: 'Cairo-Bold', textAlign: 'right', writingDirection: 'rtl' }}>
                يجب أن تحتوي كلمة المرور على:
              </Text>

              {['8 أحرف أو أكثر', 'حرف كبير وحرف صغير بالإنجليزية', 'رقم واحد على الأقل'].map((rule) => (
                <View key={rule} style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.orange }} />
                  <Text style={{ flex: 1, color: C.text2, fontSize: 12.5, lineHeight: 20, fontFamily: 'Cairo-SemiBold', textAlign: 'right', writingDirection: 'rtl' }}>
                    {rule}
                  </Text>
                </View>
              ))}
            </View>

            <PremiumField
              label="تأكيد كلمة المرور"
              value={confirmation}
              onChangeText={setConfirmation}
              placeholder="أعد إدخال كلمة المرور"
              icon="lock-closed-outline"
              error={errors.password_confirmation}
              password
              autoComplete="off"
              textContentType="none"
              importantForAutofill="no"
              returnKeyType="done"
              inputRef={confirmationRef}
              onSubmitEditing={handleRegister}
            />

            {/* Primary CTA — orange gradient */}
            <View style={{ marginTop: 8 }}>
              <PremiumButton
                title="إنشاء حساب"
                loadingTitle="جاري إنشاء الحساب..."
                loading={register.isPending}
                disabled={!formValid}
                onPress={handleRegister}
              />
            </View>

            <View style={{ marginTop: 22, gap: 12 }}>
              <Text style={{ textAlign: 'center', fontSize: 13.5, lineHeight: 25, color: C.text2, fontFamily: 'Cairo-SemiBold', writingDirection: 'rtl' }}>
                بإنشاء الحساب فإنك توافق على{' '}
                <Text style={{ color: C.blue, fontFamily: 'Cairo-Bold' }} onPress={() => requestAnimationFrame(() => router.push('/terms'))}>
                  الشروط والأحكام
                </Text>
                {' '}و{' '}
                <Text style={{ color: C.blue, fontFamily: 'Cairo-Bold' }} onPress={() => requestAnimationFrame(() => router.push('/privacy'))}>
                  سياسة الخصوصية
                </Text>
              </Text>

              <Pressable
                onPress={() => requestAnimationFrame(() => router.push({ pathname: '/(auth)/login', params: redirectTo ? { redirectTo } : undefined }))}
                hitSlop={8}
                style={({ pressed }) => ({
                  minHeight: 48,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: C.outlineMuted,
                  backgroundColor: C.iconBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 16,
                  opacity: pressed ? 0.82 : 1,
                })}
              >
                <Text style={{ textAlign: 'center', color: C.text2, fontFamily: 'Cairo-SemiBold', fontSize: 14.5, writingDirection: 'rtl' }}>
                  لديك حساب؟ <Text style={{ color: C.blue, fontFamily: 'Cairo-Black' }}>تسجيل الدخول</Text>
                </Text>
              </Pressable>

              <Pressable
                onPress={() => requestAnimationFrame(() => router.replace('/(tabs)/'))}
                hitSlop={8}
                style={({ pressed }) => ({
                  minHeight: 48,
                  borderRadius: 16,
                  alignSelf: 'center',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 16,
                  opacity: pressed ? 0.78 : 1,
                })}
              >
                <Text style={{ color: C.text, fontFamily: 'Cairo-Black', fontSize: 15.5, textAlign: 'center', writingDirection: 'rtl' }}>المتابعة كضيف</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
