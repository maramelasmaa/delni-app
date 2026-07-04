import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PremiumButton, PremiumField, usePremiumAuthColors } from '../../components/auth/premiumAuth';
import { useLogin } from '../../src/hooks/useAuth';
import { parseApiError } from '../../src/lib/error-parser';
import { isValidEmail, normalizeEmail } from '../../src/utils/authValidation';

export default function LoginScreen() {
  const C = usePremiumAuthColors();
  const { redirectTo, email: emailParam, reset } = useLocalSearchParams<{ redirectTo?: string; email?: string; reset?: string }>();
  const [email, setEmail] = useState(() => normalizeEmail(Array.isArray(emailParam) ? (emailParam[0] ?? '') : (emailParam ?? '')));
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const passwordRef = useRef<TextInput>(null);
  const login = useLogin();

  const handleLogin = async () => {
    setErrors({});
    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) return setErrors({ email: 'أدخل بريدًا إلكترونيًا صحيحًا' });
    if (!password) return setErrors({ password: 'أدخل كلمة المرور' });

    try {
      await login.mutateAsync({ email: normalizedEmail, password, redirectTo });
    } catch (err: unknown) {
      const parsed = parseApiError(err);
      setErrors(parsed.fieldErrors.email || parsed.fieldErrors.password ? parsed.fieldErrors : { general: parsed.message || 'البريد أو كلمة المرور غير صحيحة' });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 44, justifyContent: 'center' }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            <View style={{ alignItems: 'center', marginTop: 28, marginBottom: 44 }}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'flex-start' }}>
                <Text style={{ fontSize: 48, fontFamily: 'Cairo-Black', color: C.text }}>دلني</Text>
                <Text style={{ fontSize: 48, fontFamily: 'Cairo-Black', color: C.orange }}>.</Text>
              </View>
              <Text style={{ marginTop: 20, fontSize: 22, fontFamily: 'Cairo-Bold', color: C.text, textAlign: 'center' }}>تسجيل الدخول</Text>
            </View>

            {reset === '1' ? (
              <View style={{ marginBottom: 16, borderRadius: 14, backgroundColor: C.noticeBlueBg, borderWidth: 1, borderColor: C.noticeBlueBorder, paddingVertical: 12, paddingHorizontal: 14 }}>
                <Text style={{ textAlign: 'center', color: C.blue, fontFamily: 'Cairo-SemiBold', fontSize: 13.5, writingDirection: 'rtl' }}>تم تحديث كلمة المرور. يمكنك تسجيل الدخول الآن.</Text>
              </View>
            ) : null}

            {errors.general ? (
              <View style={{ marginBottom: 16, borderRadius: 14, backgroundColor: C.errorBg, borderWidth: 1, borderColor: C.errorBorder, paddingVertical: 12, paddingHorizontal: 14 }}>
                <Text style={{ textAlign: 'center', color: C.error, fontFamily: 'Cairo-SemiBold', fontSize: 13.5, writingDirection: 'rtl' }}>{errors.general}</Text>
              </View>
            ) : null}

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
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="done"
              inputRef={passwordRef}
              onSubmitEditing={handleLogin}
            />

            <Pressable
              onPress={() => requestAnimationFrame(() => router.push('/(auth)/forgot-password'))}
              hitSlop={6}
              style={{ alignSelf: 'flex-end', paddingVertical: 6, marginBottom: 8 }}
            >
              <Text style={{ color: C.blue, fontFamily: 'Cairo-SemiBold', fontSize: 13 }}>نسيت كلمة المرور؟</Text>
            </Pressable>

            {/* Primary CTA */}
            <View style={{ marginTop: 8 }}>
              <PremiumButton
                title="تسجيل الدخول"
                loadingTitle="جاري تسجيل الدخول..."
                loading={login.isPending}
                onPress={handleLogin}
              />
            </View>

            <View style={{ marginTop: 24, gap: 12 }}>
              <Pressable
                onPress={() => requestAnimationFrame(() => router.push({ pathname: '/(auth)/register', params: redirectTo ? { redirectTo } : undefined }))}
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
                  ليس لديك حساب؟ <Text style={{ color: C.blue, fontFamily: 'Cairo-Black' }}>أنشئ حسابًا</Text>
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
