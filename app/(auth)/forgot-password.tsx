import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { AuthButton, AuthNotice, AuthScreen, AuthTextField } from '../../components/auth/AuthPrimitives';
import { useForgotPassword } from '../../src/hooks/useAuth';
import { useTheme } from '../../src/hooks/useTheme';
import { parseApiError } from '../../src/lib/error-parser';
import { isValidEmail, normalizeEmail } from '../../src/utils/authValidation';

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const forgot = useForgotPassword();

  const handleSubmit = async () => {
    setError('');
    setEmailError('');
    const normalizedEmail = normalizeEmail(email);

    if (!isValidEmail(normalizedEmail)) {
      setEmailError('أدخل بريدًا إلكترونيًا صحيحًا');
      return;
    }

    try {
      await forgot.mutateAsync(normalizedEmail);
      setSent(true);
    } catch (err: unknown) {
      setError(parseApiError(err).message);
    }
  };

  return (
    <AuthScreen
      title="استعادة كلمة المرور"
      subtitle="أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين"
      backTo="/(auth)/login"
    >
      {sent ? (
        <View>
          <AuthNotice type="success">
            تحقق من بريدك الإلكتروني. أرسلنا رابطًا لإعادة تعيين كلمة المرور.
          </AuthNotice>
          <AuthButton
            title="العودة لتسجيل الدخول"
            onPress={() => requestAnimationFrame(() => router.replace({ pathname: '/(auth)/login', params: { email: normalizeEmail(email) } }))}
            colors={colors}
          />
        </View>
      ) : (
        <>
          {error ? <AuthNotice>{error}</AuthNotice> : null}
          <AuthTextField
            value={email}
            onChangeText={setEmail}
            label="البريد الإلكتروني"
            error={emailError}
            placeholder="أدخل بريدك الإلكتروني"
            keyboardType="email-address"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="send"
            onSubmitEditing={handleSubmit}
            containerStyle={{ marginBottom: 24 }}
          />
          <AuthButton
            title="إرسال رابط إعادة التعيين"
            loadingTitle="جاري الإرسال..."
            loading={forgot.isPending}
            onPress={handleSubmit}
            colors={colors}
          />
        </>
      )}
    </AuthScreen>
  );
}
