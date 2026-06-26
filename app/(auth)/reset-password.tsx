import { router, useLocalSearchParams } from 'expo-router';
// NOTE: also see the matching email template in the Laravel repo: resources/views/emails/reset-password.blade.php
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/hooks/useTheme';
import { useResetPassword } from '../../src/hooks/useAuth';
import { PasswordInput } from '../../components/ui/PasswordInput';

export default function ResetPasswordScreen() {
  const { colors } = useTheme();
  const { token, email } = useLocalSearchParams<{ token: string; email: string }>();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const reset = useResetPassword();

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

  const handleReset = async () => {
    setError('');
    if (!password) { setError('كلمة المرور مطلوبة'); return; }
    if (!passwordRegex.test(password)) {
      setError('كلمة المرور: 8 أحرف على الأقل، تشمل حرفاً كبيراً وصغيراً ورقماً');
      return;
    }
    if (password !== confirmation) { setError('كلمات المرور غير متطابقة'); return; }
    try {
      await reset.mutateAsync({ token: token ?? '', email: email ?? '', password, password_confirmation: confirmation });
      // On success, send the user to login with their email prefilled.
      router.replace({ pathname: '/(auth)/login', params: { email: email ?? '', reset: '1' } });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'حدث خطأ، حاول مجدداً');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
          <Text style={{ marginBottom: 8, textAlign: 'center', fontSize: 24, fontFamily: 'Cairo-Black', color: colors.textPrimary }}>إعادة تعيين كلمة المرور</Text>
          <Text style={{ marginBottom: 32, textAlign: 'center', fontSize: 14, color: colors.textMuted, fontFamily: 'Cairo-Regular' }}>أدخل كلمة المرور الجديدة</Text>

          {error ? (
            <View style={{ marginBottom: 16, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.12)', padding: 12 }}>
              <Text style={{ textAlign: 'center', fontSize: 14, color: colors.error, fontFamily: 'Cairo-SemiBold' }}>{error}</Text>
            </View>
          ) : null}

          <PasswordInput
            value={password}
            onChangeText={setPassword}
            placeholder="كلمة المرور الجديدة"
            placeholderTextColor={colors.textMuted}
            autoComplete="new-password"
            textContentType="newPassword"
            containerStyle={{ marginBottom: 16 }}
          />
          <PasswordInput
            value={confirmation}
            onChangeText={setConfirmation}
            placeholder="تأكيد كلمة المرور"
            placeholderTextColor={colors.textMuted}
            autoComplete="new-password"
            textContentType="newPassword"
            containerStyle={{ marginBottom: 24 }}
          />

          <Pressable
            onPress={handleReset}
            disabled={reset.isPending}
            style={{ alignItems: 'center', borderRadius: 16, backgroundColor: colors.primary, paddingVertical: 16 }}
          >
            <Text style={{ fontFamily: 'Cairo-Bold', color: colors.textOnPrimary }}>
              {reset.isPending ? 'جارٍ التعيين...' : 'تعيين كلمة المرور'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
