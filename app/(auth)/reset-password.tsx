import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Text, TextInput } from 'react-native';
import { AuthButton, AuthNotice, AuthScreen } from '../../components/auth/AuthPrimitives';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { useResetPassword } from '../../src/hooks/useAuth';
import { useTheme } from '../../src/hooks/useTheme';
import { parseApiError } from '../../src/lib/error-parser';
import { isValidEmail, isValidPassword, normalizeEmail } from '../../src/utils/authValidation';

export default function ResetPasswordScreen() {
  const { colors } = useTheme();
  const { token, email } = useLocalSearchParams<{ token: string; email: string }>();
  const emailValue = normalizeEmail(Array.isArray(email) ? (email[0] ?? '') : (email ?? ''));
  const tokenValue = Array.isArray(token) ? (token[0] ?? '') : (token ?? '');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const confirmationRef = useRef<TextInput>(null);
  const reset = useResetPassword();
  const isLinkInvalid = !tokenValue || !isValidEmail(emailValue);

  const handleReset = async () => {
    setError('');
    if (isLinkInvalid) {
      setError('رابط إعادة التعيين غير صالح. اطلب رابطًا جديدًا.');
      return;
    }
    if (!password) {
      setError('أدخل كلمة المرور الجديدة');
      return;
    }
    if (!isValidPassword(password)) {
      setError('استخدم 8 أحرف على الأقل مع حرف كبير وحرف صغير ورقم');
      return;
    }
    if (password !== confirmation) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }

    try {
      await reset.mutateAsync({ token: tokenValue, email: emailValue, password, password_confirmation: confirmation });
      requestAnimationFrame(() => {
        router.replace({ pathname: '/(auth)/login', params: { email: emailValue, reset: '1' } });
      });
    } catch (err: unknown) {
      setError(parseApiError(err).message);
    }
  };

  return (
    <AuthScreen
      title="إعادة تعيين كلمة المرور"
      subtitle="اختر كلمة مرور جديدة لحسابك"
      backTo="/(auth)/login"
    >
      {error ? <AuthNotice>{error}</AuthNotice> : null}

      {isLinkInvalid ? (
        <AuthButton
          title="طلب رابط جديد"
          onPress={() => requestAnimationFrame(() => router.replace('/(auth)/forgot-password'))}
          colors={colors}
        />
      ) : (
        <>
          <PasswordInput
            value={password}
            onChangeText={setPassword}
            label="كلمة المرور الجديدة"
            placeholder="أدخل كلمة المرور الجديدة"
            placeholderTextColor={colors.textMuted}
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="next"
            onSubmitEditing={() => confirmationRef.current?.focus()}
            containerStyle={{ marginBottom: 6 }}
          />
          {!error ? (
            <Text style={{ marginBottom: 16, textAlign: 'right', fontSize: 12, lineHeight: 18, color: colors.textMuted, fontFamily: 'Cairo-Regular', writingDirection: 'rtl' }}>
              8 أحرف على الأقل، مع حرف كبير وحرف صغير ورقم.
            </Text>
          ) : null}
          <PasswordInput
            ref={confirmationRef}
            value={confirmation}
            onChangeText={setConfirmation}
            label="تأكيد كلمة المرور"
            placeholder="أعد إدخال كلمة المرور"
            placeholderTextColor={colors.textMuted}
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="done"
            onSubmitEditing={handleReset}
            containerStyle={{ marginBottom: 24 }}
          />

          <AuthButton
            title="حفظ كلمة المرور"
            loadingTitle="جاري الحفظ..."
            loading={reset.isPending}
            onPress={handleReset}
            colors={colors}
          />
        </>
      )}
    </AuthScreen>
  );
}
