import { Ionicons } from '@expo/vector-icons';
import { rtlRow } from '../../src/utils/rtl';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/hooks/useTheme';
import { useLogin } from '../../src/hooks/useAuth';
import { PasswordInput } from '../../components/ui/PasswordInput';

export default function LoginScreen() {
  const { colors } = useTheme();
  const { redirectTo } = useLocalSearchParams<{ redirectTo?: string }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const passwordRef = useRef<TextInput>(null);
  const login = useLogin();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleLogin = async () => {
    setErrors({});
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrors({ email: 'أدخل بريدك الإلكتروني' });
      return;
    }
    if (!password) {
      setErrors({ password: 'أدخل كلمتك' });
      return;
    }
    try {
      await login.mutateAsync({ email: email.trim().toLowerCase(), password, redirectTo });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } };
      if (!axiosErr.response) {
        setErrors({ general: 'فشل الاتصال. تحقق من اتصالك بالإنترنت' });
        return;
      }
      const data = axiosErr.response.data;
      if (data?.errors) {
        const mapped: Record<string, string> = {};
        for (const [k, v] of Object.entries(data.errors)) mapped[k] = v[0];
        setErrors(mapped);
      } else {
        setErrors({ general: data?.message ?? 'البريد أو كلمة المرور غير صحيحة' });
      }
    }
  };

  const inputStyle = (hasError: boolean) => ({
    borderRadius: 12,
    borderWidth: 1,
    borderColor: hasError ? colors.error : colors.border,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 16,
    paddingVertical: 12,
    textAlign: 'right' as const,
    color: colors.textPrimary,
    fontFamily: 'Cairo-Regular',
    writingDirection: 'rtl' as const,
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header Back Button */}
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8, paddingTop: 12 }}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : requestAnimationFrame(() => router.replace('/(tabs)/'))} hitSlop={8} style={{ marginLeft: 12 }}>
          <Ionicons name="arrow-forward" size={22} color={colors.textPrimary} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 32 }}>
            {/* Header */}
            <View style={{ marginBottom: 32, alignItems: 'center' }}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
                <Text style={{ fontSize: 36, fontFamily: 'Cairo-Black', color: colors.textPrimary }}>دلني</Text>
                <Text style={{ fontSize: 36, fontFamily: 'Cairo-Black', color: colors.gold }}>.</Text>
              </View>
              <Text style={{ marginTop: 4, fontSize: 14, color: colors.textMuted, fontFamily: 'Cairo-SemiBold' }}>تسجيل الدخول</Text>
            </View>

            {errors.general ? (
              <View style={{ marginBottom: 16, borderRadius: 12, backgroundColor: colors.errorSoft, padding: 12 }}>
                <Text style={{ textAlign: 'center', fontSize: 14, color: colors.error, fontFamily: 'Cairo-SemiBold' }}>{errors.general}</Text>
              </View>
            ) : null}

            {/* Email */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ marginBottom: 6, textAlign: 'right', fontSize: 14, fontFamily: 'Cairo-SemiBold', color: colors.textPrimary }}>
                بريدك الإلكتروني
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="example@email.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                style={inputStyle(!!errors.email)}
              />
              {errors.email ? (
                <Text style={{ marginTop: 4, textAlign: 'right', fontSize: 12, color: colors.error, fontFamily: 'Cairo-Regular' }}>{errors.email}</Text>
              ) : null}
            </View>

            {/* Password */}
            <PasswordInput
              ref={passwordRef}
              value={password}
              onChangeText={setPassword}
              label="كلمتك"
              error={errors.password}
              placeholder="كلمتك"
              placeholderTextColor={colors.textMuted}
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              containerStyle={{ marginBottom: 8 }}
            />

            <Pressable
              onPress={() => requestAnimationFrame(() => router.push('/(auth)/forgot-password'))}
              style={{ marginBottom: 24, alignSelf: 'flex-end' }}
            >
              <Text style={{ fontSize: 14, color: colors.primary, fontFamily: 'Cairo-SemiBold' }}>نسيت كلمة المرور؟</Text>
            </Pressable>

            <Pressable
              onPress={handleLogin}
              disabled={login.isPending}
              style={{ alignItems: 'center', borderRadius: 16, backgroundColor: colors.primary, paddingVertical: 16, opacity: login.isPending ? 0.7 : 1 }}
            >
              <Text style={{ fontSize: 16, fontFamily: 'Cairo-Bold', color: colors.textOnPrimary }}>
                {login.isPending ? 'جاري الدخول...' : 'تسجيل الدخول'}
              </Text>
            </Pressable>

            {/* Continue as Guest */}
            <Pressable
              onPress={() => requestAnimationFrame(() => router.replace('/(tabs)/'))}
              style={{
                alignItems: 'center',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                paddingVertical: 16,
                marginTop: 12,
              }}
            >
              <Text style={{ fontSize: 16, fontFamily: 'Cairo-Bold', color: colors.textPrimary }}>
                تصفح كضيف
              </Text>
            </Pressable>

            <Pressable
              onPress={() => requestAnimationFrame(() => router.push({ pathname: '/(auth)/register', params: redirectTo ? { redirectTo } : undefined }))}
              style={{ marginTop: 16, alignItems: 'center', paddingVertical: 8 }}
            >
              <Text style={{ fontSize: 14, color: colors.textSecondary, fontFamily: 'Cairo-Regular' }}>
                ليس لديك حساب؟{' '}
                <Text style={{ fontFamily: 'Cairo-Bold', color: colors.primary }}>سجل الآن</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
