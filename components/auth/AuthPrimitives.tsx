import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { forwardRef, type ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  type StyleProp,
  type TextInputProps,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/hooks/useTheme';
import type { ThemeColors } from '../../src/theme/tokens';

export function AuthScreen({
  title,
  subtitle,
  children,
  backTo = '/(tabs)/',
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  backTo?: string;
}) {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8, paddingTop: 12 }}>
        <Pressable
          onPress={() => router.canGoBack() ? router.back() : requestAnimationFrame(() => router.replace(backTo as never))}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="رجوع"
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.75 : 1,
          })}
        >
          <Ionicons name="arrow-forward" size={22} color={colors.textPrimary} />
        </Pressable>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 32, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ width: '100%', maxWidth: 420, alignSelf: 'center' }}>
            <View style={{ marginBottom: 28, alignItems: 'center' }}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
                <Text style={{ fontSize: 36, fontFamily: 'Cairo-Black', color: colors.textPrimary }}>دلني</Text>
                <Text style={{ fontSize: 36, fontFamily: 'Cairo-Black', color: colors.gold }}>.</Text>
              </View>
              <Text style={{ marginTop: 4, fontSize: 15, lineHeight: 24, color: colors.textPrimary, fontFamily: 'Cairo-Bold', textAlign: 'center' }}>
                {title}
              </Text>
              {subtitle ? (
                <Text style={{ marginTop: 6, fontSize: 13, lineHeight: 22, color: colors.textMuted, fontFamily: 'Cairo-Regular', textAlign: 'center', writingDirection: 'rtl' }}>
                  {subtitle}
                </Text>
              ) : null}
            </View>

            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export const AuthTextField = forwardRef<TextInput, TextInputProps & {
  label: string;
  error?: string;
  containerStyle?: object;
}>(({ label, error, containerStyle, style, ...props }, ref) => {
  const { colors } = useTheme();

  return (
    <View style={[{ marginBottom: 16 }, containerStyle]}>
      <Text style={{ marginBottom: 6, textAlign: 'right', fontSize: 14, fontFamily: 'Cairo-SemiBold', color: colors.textPrimary }}>
        {label}
      </Text>
      <TextInput
        ref={ref}
        placeholderTextColor={colors.textMuted}
        textAlign="right"
        selectionColor={colors.primary}
        style={[
          {
            height: 48,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: error ? colors.error : colors.border,
            backgroundColor: colors.surfaceAlt,
            paddingHorizontal: 16,
            paddingVertical: 0,
            textAlign: 'right',
            color: colors.textPrimary,
            fontFamily: 'Cairo-Regular',
            fontSize: 14,
            writingDirection: 'rtl',
            includeFontPadding: false,
          },
          style,
        ]}
        accessibilityLabel={label}
        accessibilityHint={error || props.placeholder}
        {...props}
      />
      {error ? <FieldError message={error} /> : null}
    </View>
  );
});

AuthTextField.displayName = 'AuthTextField';

export function FieldError({ message }: { message: string }) {
  const { colors } = useTheme();
  return (
    <Text style={{ marginTop: 4, textAlign: 'right', fontSize: 12, lineHeight: 18, color: colors.error, fontFamily: 'Cairo-Regular', writingDirection: 'rtl' }}>
      {message}
    </Text>
  );
}

export function AuthNotice({
  type = 'error',
  children,
}: {
  type?: 'error' | 'success';
  children: ReactNode;
}) {
  const { colors } = useTheme();
  const isSuccess = type === 'success';
  return (
    <View style={{ marginBottom: 16, borderRadius: 12, backgroundColor: isSuccess ? colors.successSoft : colors.errorSoft, padding: 12 }}>
      <Text style={{ textAlign: 'center', fontSize: 14, lineHeight: 22, color: isSuccess ? colors.success : colors.error, fontFamily: 'Cairo-SemiBold', writingDirection: 'rtl' }}>
        {children}
      </Text>
    </View>
  );
}

export function AuthButton({
  title,
  loadingTitle,
  loading = false,
  onPress,
  disabled,
  colors,
  style,
  variant = 'primary',
  icon,
}: {
  title: string;
  loadingTitle?: string;
  loading?: boolean;
  onPress: () => void;
  disabled?: boolean;
  colors: ThemeColors;
  style?: StyleProp<ViewStyle>;
  /** primary = filled CTA, secondary = outlined, ghost = quiet text button */
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const { isDark } = useTheme();
  const isDisabled = disabled || loading;

  // Visual weight per variant: all clearly FILLED with a defining border, ranked by
  // color. Fills are chosen to read as solid against the #F6F8FF page (the old
  // primarySoft/surfaceAlt tints were too close to the background and looked empty).
  const palette = {
    primary: {
      backgroundColor: isDisabled ? colors.borderStrong : colors.primary,
      foregroundColor: isDisabled ? colors.textMuted : colors.textOnPrimary,
      borderColor: isDisabled ? colors.borderStrong : colors.primary,
      elevated: !isDisabled,
    },
    secondary: {
      backgroundColor: isDisabled ? colors.surfaceAlt : isDark ? 'rgba(96,165,250,0.22)' : '#DBEAFE',
      foregroundColor: isDisabled ? colors.textMuted : colors.primary,
      borderColor: isDisabled ? colors.border : colors.primary,
      elevated: false,
    },
    ghost: {
      backgroundColor: isDisabled ? colors.surfaceAlt : isDark ? colors.surfaceAlt : '#E2E8F0',
      foregroundColor: isDisabled ? colors.textMuted : colors.textSecondary,
      borderColor: colors.borderStrong,
      elevated: false,
    },
  }[variant];

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        {
          alignSelf: 'stretch',
          width: '100%',
          height: 48,
          borderRadius: 14,
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
          borderWidth: 1.5,
          flexDirection: 'row-reverse',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingHorizontal: 16,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: palette.elevated ? 0.1 : 0,
          shadowRadius: 6,
          elevation: palette.elevated ? 2 : 0,
          opacity: isDisabled ? 0.76 : pressed ? 0.86 : 1,
          transform: [
            { scale: pressed && !isDisabled ? 0.985 : 1 },
          ],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.foregroundColor} />
      ) : icon ? (
        <Ionicons name={icon} size={18} color={palette.foregroundColor} />
      ) : null}

      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.78}
        style={{
          fontSize: 13.5,
          lineHeight: 21,
          fontFamily: 'Cairo-Bold',
          color: palette.foregroundColor,
          textAlign: 'center',
          writingDirection: 'rtl',
          includeFontPadding: false,
        }}
      >
        {loading ? loadingTitle ?? title : title}
      </Text>
    </Pressable>
  );
}

export function AuthLink({
  children,
  onPress,
  align = 'center',
}: {
  children: ReactNode;
  onPress: () => void;
  align?: 'center' | 'right';
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        alignSelf: align === 'right' ? 'flex-end' : 'center',
        paddingVertical: 8,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <Text style={{ fontSize: 14, color: colors.primary, fontFamily: 'Cairo-SemiBold', textAlign: align }}>
        {children}
      </Text>
    </Pressable>
  );
}
