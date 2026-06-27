import { router, useLocalSearchParams } from 'expo-router';
// NOTE: also see the matching email template in the Laravel repo: resources/views/emails/reset-password.blade.php
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/hooks/useTheme';
import { useResetPassword } from '../../src/hooks/useAuth';
import { PasswordInput } from '../../components/ui/PasswordInput';

export default function ResetPasswordScreen() {
  const { colors, isDark } = useTheme();
  const { token, email } = useLocalSearchParams<{ token: string; email: string }>();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const reset = useResetPassword();

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

  const handleReset = async () => {
    setError('');
    if (!password) { setError('أدخل كلمتك'); return; }
    if (!passwordRegex.test(password)) {
      setError('8 أحرف: حروف كبيرة وصغيرة ورقم');
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
          <Text style={{ marginBottom: 8, textAlign: 'center', fontSize: 24, fontFamily: 'Cairo-Black', color: colors.textPrimary }}>إعادة تعيين كلمتك</Text>
          <Text style={{ marginBottom: 32, textAlign: 'center', fontSize: 14, color: colors.textMuted, fontFamily: 'Cairo-Regular' }}>أدخل كلمتك الجديدة</Text>

          {error ? (
            <View style={{ marginBottom: 16, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.12)', padding: 12 }}>
              <Text style={{ textAlign: 'center', fontSize: 14, color: colors.error, fontFamily: 'Cairo-SemiBold' }}>{error}</Text>
            </View>
          ) : null}

          <PasswordInput
            value={password}
            onChangeText={setPassword}
            placeholder="كلمتك الجديدة"
            placeholderTextColor={colors.textMuted}
            autoComplete="new-password"
            textContentType="newPassword"
            containerStyle={{ marginBottom: 16 }}
          />
          <PasswordInput
            value={confirmation}
            onChangeText={setConfirmation}
            placeholder="أعد كتابة كلمتك"
            placeholderTextColor={colors.textMuted}
            autoComplete="new-password"
            textContentType="newPassword"
            containerStyle={{ marginBottom: 24 }}
          />

          <Pressable
            onPress={handleReset}
            disabled={reset.isPending}
            style={{ alignItems: 'center', borderRadius: 16, backgroundColor: '#1E40AF', paddingVertical: 16, opacity: reset.isPending ? 0.7 : 1 }}
          >
            <Text style={{ fontFamily: 'Cairo-Bold', fontSize: 16, color: isDark ? '#FFFFFF' : '#000000' }}>
              {reset.isPending ? 'جاري التعيين...' : 'حفظ كلمتك'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
