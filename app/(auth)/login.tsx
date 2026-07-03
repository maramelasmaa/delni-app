import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { AuthButton, AuthLink, AuthNotice, AuthScreen, AuthTextField } from '../../components/auth/AuthPrimitives';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { useLogin } from '../../src/hooks/useAuth';
import { useTheme } from '../../src/hooks/useTheme';
import { parseApiError } from '../../src/lib/error-parser';
import { isValidEmail, normalizeEmail } from '../../src/utils/authValidation';

export default function LoginScreen() {
  const { colors } = useTheme();
  const { redirectTo, email: emailParam, reset } = useLocalSearchParams<{ redirectTo?: string; email?: string; reset?: string }>();
  const [email, setEmail] = useState(() => normalizeEmail(Array.isArray(emailParam) ? (emailParam[0] ?? '') : (emailParam ?? '')));
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const passwordRef = useRef<TextInput>(null);
  const login = useLogin();

  const handleLogin = async () => {
    setErrors({});
    const normalizedEmail = normalizeEmail(email);

    if (!isValidEmail(normalizedEmail)) {
      setErrors({ email: 'أدخل بريدًا إلكترونيًا صحيحًا' });
      return;
    }
    if (!password) {
      setErrors({ password: 'أدخل كلمة المرور' });
      return;
    }

    try {
      await login.mutateAsync({ email: normalizedEmail, password, redirectTo });
    } catch (err: unknown) {
      const parsed = parseApiError(err);
      setErrors(parsed.fieldErrors.email || parsed.fieldErrors.password ? parsed.fieldErrors : { general: parsed.message || 'البريد أو كلمة المرور غير صحيحة' });
    }
  };

  return (
    <AuthScreen title="تسجيل الدخول" subtitle="أدخل بيانات حسابك للمتابعة">
      {reset === '1' ? (
        <AuthNotice type="success">تم تحديث كلمة المرور. يمكنك تسجيل الدخول الآن.</AuthNotice>
      ) : null}

      {errors.general ? <AuthNotice>{errors.general}</AuthNotice> : null}

      <AuthTextField
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
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="done"
        onSubmitEditing={handleLogin}
        containerStyle={{ marginBottom: 8 }}
      />

      <AuthLink align="right" onPress={() => requestAnimationFrame(() => router.push('/(auth)/forgot-password'))}>
        نسيت كلمة المرور؟
      </AuthLink>

      <View style={{ width: '100%', gap: 12, marginTop: 18 }}>
        <AuthButton
          title="تسجيل الدخول"
          loadingTitle="جاري تسجيل الدخول..."
          loading={login.isPending}
          onPress={handleLogin}
          colors={colors}
          variant="primary"
          icon="person-outline"
        />
        <AuthButton
          title="إنشاء حساب جديد"
          onPress={() => requestAnimationFrame(() => router.push({ pathname: '/(auth)/register', params: redirectTo ? { redirectTo } : undefined }))}
          colors={colors}
          variant="secondary"
          icon="person-add-outline"
        />
      </View>

      {/* Divider */}
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 12, marginTop: 20, marginBottom: 6 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        <Text style={{ fontSize: 12, color: colors.textMuted, fontFamily: 'Cairo-SemiBold' }}>أو</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      </View>

      <AuthButton
        title="المتابعة كضيف"
        onPress={() => requestAnimationFrame(() => router.replace('/(tabs)/'))}
        colors={colors}
        variant="ghost"
        icon="compass-outline"
      />
    </AuthScreen>
  );
}
