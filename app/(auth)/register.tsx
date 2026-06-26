import { Ionicons } from '@expo/vector-icons';
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
import { useRegister } from '../../src/hooks/useAuth';
import { PasswordInput } from '../../components/ui/PasswordInput';

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

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // Matches backend: min 8 chars, at least one uppercase, one lowercase, one digit
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

  const handleRegister = async () => {
    setErrors({});
    if (!name.trim()) {
      setErrors({ name: 'الاسم مطلوب' });
      return;
    }
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrors({ email: 'أدخل بريداً إلكترونياً صالحاً' });
      return;
    }
    if (!password) {
      setErrors({ password: 'كلمة المرور مطلوبة' });
      return;
    }
    if (!passwordRegex.test(password)) {
      setErrors({ password: 'كلمة المرور: 8 أحرف على الأقل، تشمل حرفاً كبيراً وصغيراً ورقماً' });
      return;
    }
    if (password !== confirmation) {
      setErrors({ password_confirmation: 'كلمات المرور غير متطابقة' });
      return;
    }
    try {
      await register.mutateAsync({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        password_confirmation: confirmation,
        redirectTo,
      });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } };
      if (!axiosErr.response) {
        setErrors({ general: 'تعذّر الاتصال بالخادم، تحقق من اتصالك بالإنترنت' });
        return;
      }
      const data = axiosErr.response.data;
      if (data?.errors) {
        const mapped: Record<string, string> = {};
        for (const [k, v] of Object.entries(data.errors)) mapped[k] = v[0];
        setErrors(mapped);
      } else {
        setErrors({ general: data?.message ?? 'حدث خطأ، حاول مجدداً' });
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

  const label = { marginBottom: 6, textAlign: 'right' as const, fontSize: 14, fontFamily: 'Cairo-SemiBold', color: colors.textPrimary };
  const errorText = { marginTop: 4, textAlign: 'right' as const, fontSize: 12, color: colors.error, fontFamily: 'Cairo-Regular' };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header Back Button */}
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8, paddingTop: 12 }}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/')} hitSlop={8} style={{ marginLeft: 12 }}>
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
          <View style={{ flex: 1, paddingHorizontal: 24, paddingBottom: 32 }}>
            {/* Header */}
            <View style={{ marginBottom: 24, alignItems: 'center' }}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
                <Text style={{ fontSize: 36, fontFamily: 'Cairo-Black', color: colors.textPrimary }}>دلني</Text>
                <Text style={{ fontSize: 36, fontFamily: 'Cairo-Black', color: colors.gold }}>.</Text>
              </View>
              <Text style={{ marginTop: 4, fontSize: 14, color: colors.textMuted, fontFamily: 'Cairo-SemiBold' }}>إنشاء حساب جديد</Text>
            </View>

            {errors.general ? (
              <View style={{ marginBottom: 16, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.12)', padding: 12 }}>
                <Text style={{ textAlign: 'center', fontSize: 14, color: colors.error, fontFamily: 'Cairo-SemiBold' }}>{errors.general}</Text>
              </View>
            ) : null}

            {/* Full name */}
            <View style={{ marginBottom: 16 }}>
              <Text style={label}>الاسم الكامل</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="أحمد محمد"
                placeholderTextColor={colors.textMuted}
                autoComplete="name"
                textContentType="name"
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
                style={inputStyle(!!errors.name)}
              />
              {errors.name ? <Text style={errorText}>{errors.name}</Text> : null}
            </View>

            {/* Email */}
            <View style={{ marginBottom: 16 }}>
              <Text style={label}>البريد الإلكتروني</Text>
              <TextInput
                ref={emailRef}
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
              {errors.email ? <Text style={errorText}>{errors.email}</Text> : null}
            </View>

            {/* Password */}
            <PasswordInput
              ref={passwordRef}
              value={password}
              onChangeText={setPassword}
              label="كلمة المرور"
              error={errors.password}
              placeholder="8 أحرف على الأقل"
              placeholderTextColor={colors.textMuted}
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="next"
              onSubmitEditing={() => confirmationRef.current?.focus()}
            />

            {/* Confirm password */}
            <PasswordInput
              ref={confirmationRef}
              value={confirmation}
              onChangeText={setConfirmation}
              label="تأكيد كلمة المرور"
              error={errors.password_confirmation}
              placeholder="أعد كتابة كلمة المرور"
              placeholderTextColor={colors.textMuted}
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="done"
              onSubmitEditing={handleRegister}
              containerStyle={{ marginBottom: 24 }}
            />

            <Pressable
              onPress={handleRegister}
              disabled={register.isPending}
              style={{ alignItems: 'center', borderRadius: 16, backgroundColor: colors.primary, paddingVertical: 16, opacity: register.isPending ? 0.7 : 1 }}
            >
              <Text style={{ fontSize: 16, fontFamily: 'Cairo-Bold', color: colors.textOnPrimary }}>
                {register.isPending ? 'جارٍ التسجيل...' : 'إنشاء الحساب'}
              </Text>
            </Pressable>

            {/* Continue as Guest */}
            <Pressable
              onPress={() => router.replace('/(tabs)/')}
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
                تصفح كزائر
              </Text>
            </Pressable>

            {/* Privacy policy — required by App Store 5.1.1 before data collection */}
            <Text style={{ marginTop: 16, textAlign: 'center', fontSize: 12, color: colors.textMuted, fontFamily: 'Cairo-Regular', writingDirection: 'rtl' }}>
              بالتسجيل أنت توافق على{' '}
              <Text style={{ color: colors.primary }} onPress={() => router.push('/privacy')}>
                سياسة الخصوصية
              </Text>
              {' '}و{' '}
              <Text style={{ color: colors.primary }} onPress={() => router.push('/terms')}>
                شروط الاستخدام
              </Text>
            </Text>

            <Pressable
              onPress={() => router.push({ pathname: '/(auth)/login', params: redirectTo ? { redirectTo } : undefined })}
              style={{ marginTop: 16, alignItems: 'center', paddingVertical: 8 }}
            >
              <Text style={{ fontSize: 14, color: colors.textSecondary, fontFamily: 'Cairo-Regular' }}>
                لديك حساب؟{' '}
                <Text style={{ fontFamily: 'Cairo-Bold', color: colors.primary }}>تسجيل الدخول</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
