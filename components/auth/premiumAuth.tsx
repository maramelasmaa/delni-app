import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, type RefObject } from 'react';
import {
  ActivityIndicator,
  Pressable,
  type StyleProp,
  Text,
  TextInput,
  type KeyboardTypeOptions,
  type TextInputProps,
  type ViewStyle,
  View,
} from 'react-native';
import { useTheme } from '../../src/hooks/useTheme';

const AUTH_COLOR_SCHEMES = {
  light: {
    bg: '#F6F8FC',
    card: '#FFFFFF',
    cardFocus: '#FFFFFF',
    border: 'rgba(18,58,111,0.14)',
    orange: '#E1AD01',
    orangeLight: '#F5CB3A',
    onAccent: '#FFFFFF',
    blue: '#123A6F',
    text: '#123A6F',
    inputText: '#123A6F',
    text2: 'rgba(18,58,111,0.70)',
    text3: 'rgba(18,58,111,0.48)',
    error: '#DC2626',
    iconBg: 'rgba(18,58,111,0.07)',
    outlineBlue: 'rgba(18,58,111,0.42)',
    outlineMuted: 'rgba(18,58,111,0.18)',
    noticeBlueBg: 'rgba(18,58,111,0.10)',
    noticeBlueBorder: 'rgba(18,58,111,0.24)',
    errorBg: 'rgba(220,38,38,0.10)',
    errorBorder: 'rgba(220,38,38,0.26)',
    shadow: '#123A6F',
  },
  dark: {
    bg: '#071A33',
    card: '#0E2A4D',
    cardFocus: '#123A6F',
    border: 'rgba(245,203,58,0.18)',
    orange: '#E1AD01',
    orangeLight: '#F5CB3A',
    onAccent: '#FFFFFF',
    blue: '#F5CB3A',
    text: '#F8FAFC',
    inputText: '#F8FAFC',
    text2: 'rgba(248,250,252,0.74)',
    text3: 'rgba(248,250,252,0.52)',
    error: '#F87171',
    iconBg: 'rgba(245,203,58,0.12)',
    outlineBlue: 'rgba(245,203,58,0.46)',
    outlineMuted: 'rgba(248,250,252,0.22)',
    noticeBlueBg: 'rgba(245,203,58,0.12)',
    noticeBlueBorder: 'rgba(245,203,58,0.30)',
    errorBg: 'rgba(248,113,113,0.14)',
    errorBorder: 'rgba(248,113,113,0.34)',
    shadow: '#E1AD01',
  },
} as const;

export const PREMIUM_COLORS = AUTH_COLOR_SCHEMES.light;

export function usePremiumAuthColors() {
  const { isDark } = useTheme();
  return isDark ? AUTH_COLOR_SCHEMES.dark : AUTH_COLOR_SCHEMES.light;
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  icon: keyof typeof Ionicons.glyphMap;
  error?: string;
  password?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
  importantForAutofill?: TextInputProps['importantForAutofill'];
  returnKeyType?: TextInputProps['returnKeyType'];
  onSubmitEditing?: () => void;
  inputRef?: RefObject<TextInput | null>;
};

export function PremiumField({
  label, value, onChangeText, placeholder, icon, error, password,
  keyboardType, autoComplete, textContentType, importantForAutofill, returnKeyType, onSubmitEditing, inputRef,
}: FieldProps) {
  const C = usePremiumAuthColors();
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);
  const borderColor = error ? C.error : focused ? C.orange : C.border;

  return (
    <View style={{ marginBottom: 22 }}>
      <Text style={{ textAlign: 'right', color: C.text, fontFamily: 'Cairo-Bold', fontSize: 14, marginBottom: 9, writingDirection: 'rtl' }}>
        {label}
      </Text>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: 58,
          borderRadius: 18,
          borderWidth: 1.5,
          borderColor,
          backgroundColor: C.card,
          paddingHorizontal: 10,
          direction: 'ltr',
        }}
      >
        <Pressable
          disabled={!password}
          onPress={() => password && setShow((s) => !s)}
          hitSlop={8}
          accessibilityRole={password ? 'button' : undefined}
          accessibilityLabel={password ? 'إظهار كلمة المرور' : undefined}
          style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: C.iconBg, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name={password ? (show ? 'eye-off-outline' : 'eye-outline') : icon} size={18} color={focused ? C.orange : C.text2} />
        </Pressable>

        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={C.text3}
          secureTextEntry={password && !show}
          keyboardType={keyboardType}
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
          autoCorrect={false}
          autoComplete={autoComplete}
          textContentType={textContentType}
          importantForAutofill={importantForAutofill}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          enablesReturnKeyAutomatically
          textAlign="right"
          cursorColor={C.inputText}
          selectionColor={C.orange}
          style={{
            flex: 1,
            height: '100%',
            color: C.inputText,
            fontFamily: 'Cairo-SemiBold',
            fontSize: 15,
            direction: 'rtl',
            writingDirection: 'rtl',
            textAlign: 'right',
            paddingLeft: 10,
            paddingRight: 14,
            includeFontPadding: false,
          }}
        />
      </View>

      {error ? (
        <Text style={{ textAlign: 'right', color: C.error, fontFamily: 'Cairo-Regular', fontSize: 12, marginTop: 6, writingDirection: 'rtl' }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export function PremiumButton({
  title, loadingTitle, loading = false, disabled, onPress, icon, style,
}: {
  title: string;
  loadingTitle?: string;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
}) {
  const C = usePremiumAuthColors();
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [{ opacity: disabled && !loading ? 0.5 : pressed ? 0.9 : 1 }, style]}
    >
      <LinearGradient
        colors={[C.orangeLight, C.orange]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: '100%',
          height: 58,
          borderRadius: 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingHorizontal: 18,
          shadowColor: C.orange,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0,
          shadowRadius: 12,
          elevation: 0,
        }}
      >
        {loading ? <ActivityIndicator size="small" color={C.onAccent} /> : icon ? <Ionicons name={icon} size={18} color={C.onAccent} /> : null}
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.82}
          style={{ color: C.onAccent, fontFamily: 'Cairo-Bold', fontSize: 16, writingDirection: 'rtl' }}
        >
          {loading ? loadingTitle ?? title : title}
        </Text>
      </LinearGradient>
    </Pressable>
  );
}

export function OutlineButton({
  title, onPress, tone = 'blue', icon, style,
}: {
  title: string;
  onPress: () => void;
  tone?: 'blue' | 'muted';
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
}) {
  const C = usePremiumAuthColors();
  const isBlue = tone === 'blue';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        {
          height: 58,
          borderRadius: 20,
          borderWidth: 1.5,
          borderColor: isBlue ? C.outlineBlue : C.outlineMuted,
          backgroundColor: 'transparent',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: pressed ? 0.85 : 1,
          shadowColor: C.shadow,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0,
          shadowRadius: 6,
          elevation: 0,
        },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={18} color={isBlue ? C.blue : C.text2} /> : null}
      <Text style={{ color: isBlue ? C.blue : C.text2, fontFamily: 'Cairo-Bold', fontSize: 16, writingDirection: 'rtl' }}>
        {title}
      </Text>
    </Pressable>
  );
}
