import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/hooks/useTheme';
import { useForgotPassword } from '../../src/hooks/useAuth';

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const forgot = useForgotPassword();

  const handleSubmit = async () => {
    setError('');
    if (!email.trim()) { setError('البريد الإلكتروني مطلوب'); return; }
    try {
      await forgot.mutateAsync(email.trim());
      setSent(true);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'حدث خطأ، حاول مجدداً');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header Back Button */}
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8, paddingTop: 12 }}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={{ marginLeft: 12 }}>
          <Ionicons name="arrow-forward" size={22} color={colors.textPrimary} />
        </Pressable>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 80 }}>
          <Text style={{ marginBottom: 8, textAlign: 'center', fontSize: 24, fontFamily: 'Cairo-Black', color: colors.textPrimary }}>نسيت كلمة المرور؟</Text>
          <Text style={{ marginBottom: 32, textAlign: 'center', fontSize: 14, color: colors.textMuted, fontFamily: 'Cairo-Regular' }}>
            سنرسل لك رابط إعادة التعيين على بريدك الإلكتروني
          </Text>

          {sent ? (
            <View style={{ borderRadius: 16, backgroundColor: 'rgba(16,185,129,0.12)', padding: 24 }}>
              <Text style={{ textAlign: 'center', fontSize: 14, fontFamily: 'Cairo-SemiBold', color: colors.success }}>
                تم إرسال رابط إعادة التعيين! تحقق من بريدك الإلكتروني.
              </Text>
            </View>
          ) : (
            <>
              {error ? (
                <View style={{ marginBottom: 16, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.12)', padding: 12 }}>
                  <Text style={{ textAlign: 'center', fontSize: 14, color: colors.error, fontFamily: 'Cairo-SemiBold' }}>{error}</Text>
                </View>
              ) : null}
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="البريد الإلكتروني"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={{
                  marginBottom: 16,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: error ? colors.error : colors.border,
                  backgroundColor: colors.surfaceAlt,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  textAlign: 'right',
                  color: colors.textPrimary,
                  fontFamily: 'Cairo-Regular',
                  writingDirection: 'rtl',
                }}
              />
              <Pressable
                onPress={handleSubmit}
                disabled={forgot.isPending}
                style={{ alignItems: 'center', borderRadius: 16, backgroundColor: colors.primary, paddingVertical: 16 }}
              >
                <Text style={{ fontFamily: 'Cairo-Bold', color: colors.textOnPrimary }}>
                  {forgot.isPending ? 'جارٍ الإرسال...' : 'إرسال'}
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
