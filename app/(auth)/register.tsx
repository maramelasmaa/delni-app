import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { AuthButton, AuthNotice, AuthScreen, AuthTextField } from '../../components/auth/AuthPrimitives';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { useRegister } from '../../src/hooks/useAuth';
import { useTheme } from '../../src/hooks/useTheme';
import { parseApiError } from '../../src/lib/error-parser';
import { isValidEmail, isValidName, isValidPassword, normalizeEmail, normalizeName } from '../../src/utils/authValidation';

export default function RegisterScreen() {
  const { colors } = useTheme();
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

  const handleRegister = async () => {
    setErrors({});
    const normalizedName = normalizeName(name);
    const normalizedEmail = normalizeEmail(email);

    if (!isValidName(normalizedName)) {
      setErrors({ name: 'أدخل اسمًا صحيحًا بدون أرقام أو رموز' });
      return;
    }
    if (!isValidEmail(normalizedEmail)) {
      setErrors({ email: 'أدخل بريدًا إلكترونيًا صحيحًا' });
      return;
    }
    if (!password) {
      setErrors({ password: 'أدخل كلمة المرور' });
      return;
    }
    if (!isValidPassword(password)) {
      setErrors({ password: 'استخدم 8 أحرف على الأقل مع حرف كبير وحرف صغير ورقم' });
      return;
    }
    if (password !== confirmation) {
      setErrors({ password_confirmation: 'كلمتا المرور غير متطابقتين' });
      return;
    }

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
    <AuthScreen title="إنشاء حساب" subtitle="استخدم اسمك الحقيقي وبريدًا يمكنك الوصول إليه">
      {errors.general ? <AuthNotice>{errors.general}</AuthNotice> : null}

      <AuthTextField
        value={name}
        onChangeText={setName}
        label="الاسم الكامل"
        error={errors.name}
        placeholder="أدخل اسمك الكامل"
        autoComplete="name"
        textContentType="name"
        autoCapitalize="words"
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
      />

      <AuthTextField
        ref={emailRef}
        value={email}
        onChangeText={setEmail}
        label="البريد الإلكتروني"
        error={errors.email}
        placeholder="أدخل بريدك الإلكتروني"
        keyboardType="email-address"
        inputMode="email"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />

      <PasswordInput
        ref={passwordRef}
        value={password}
        onChangeText={setPassword}
        label="كلمة المرور"
        error={errors.password}
        placeholder="أدخل كلمة المرور"
        placeholderTextColor={colors.textMuted}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        onSubmitEditing={() => confirmationRef.current?.focus()}
        containerStyle={{ marginBottom: 6 }}
      />
      {!errors.password ? (
        <Text style={{ marginBottom: 16, textAlign: 'right', fontSize: 12, lineHeight: 18, color: colors.textMuted, fontFamily: 'Cairo-Regular', writingDirection: 'rtl' }}>
          8 أحرف على الأقل، مع حرف كبير وحرف صغير ورقم.
        </Text>
      ) : null}

      <PasswordInput
        ref={confirmationRef}
        value={confirmation}
        onChangeText={setConfirmation}
        label="تأكيد كلمة المرور"
        error={errors.password_confirmation}
        placeholder="أعد إدخال كلمة المرور"
        placeholderTextColor={colors.textMuted}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="done"
        onSubmitEditing={handleRegister}
        containerStyle={{ marginBottom: 24 }}
      />

      <View style={{ width: '100%', gap: 12 }}>
        <AuthButton
          title="إنشاء حساب"
          loadingTitle="جاري إنشاء الحساب..."
          loading={register.isPending}
          onPress={handleRegister}
          colors={colors}
        />
        <AuthButton
          title="تصفح كضيف"
          onPress={() => requestAnimationFrame(() => router.replace('/(tabs)/'))}
          colors={colors}
        />
      </View>

      <Text style={{ marginTop: 16, textAlign: 'center', fontSize: 12, lineHeight: 20, color: colors.textMuted, fontFamily: 'Cairo-Regular', writingDirection: 'rtl' }}>
        بإنشاء الحساب، أنت توافق على{' '}
        <Text style={{ color: colors.primary }} onPress={() => requestAnimationFrame(() => router.push('/privacy'))}>
          سياسة الخصوصية
        </Text>
        {' '}و{' '}
        <Text style={{ color: colors.primary }} onPress={() => requestAnimationFrame(() => router.push('/terms'))}>
          شروط الاستخدام
        </Text>
      </Text>

      <Text style={{ marginTop: 18, textAlign: 'center', fontSize: 14, color: colors.textSecondary, fontFamily: 'Cairo-Regular', writingDirection: 'rtl' }}>
        لديك حساب؟{' '}
        <Text
          style={{ fontFamily: 'Cairo-Bold', color: colors.primary }}
          onPress={() => requestAnimationFrame(() => router.push({ pathname: '/(auth)/login', params: redirectTo ? { redirectTo } : undefined }))}
        >
          تسجيل الدخول
        </Text>
      </Text>
    </AuthScreen>
  );
}
