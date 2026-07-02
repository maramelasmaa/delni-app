import { Pressable, Text, View } from 'react-native';
import { parseApiError } from '../../src/lib/error-parser';
import { useTheme } from '../../src/hooks/useTheme';

interface Props {
  message?: string;
  error?: unknown;
  onRetry?: () => void;
}

export function ErrorView({ message, error, onRetry }: Props) {
  const { colors, isDark } = useTheme();
  const resolvedMessage = message ?? (error ? parseApiError(error).message : 'حدث خطأ ما، يرجى المحاولة مرة أخرى');
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, backgroundColor: colors.bg }}>
      <Text style={{ marginBottom: 16, textAlign: 'center', fontSize: 16, color: colors.error, fontFamily: 'Cairo-SemiBold', writingDirection: 'rtl' }}>
        {resolvedMessage}
      </Text>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => ({
            borderRadius: 12,
            backgroundColor: colors.primary,
            paddingHorizontal: 24,
            paddingVertical: 12,
            transform: [{ scale: pressed ? 0.97 : 1 }],
          })}
        >
          <Text style={{ fontFamily: 'Cairo-Bold', color: colors.textOnPrimary }}>حاول مجدداً</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
