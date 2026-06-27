import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../../src/hooks/useTheme';

interface Props {
  message?: string;
  onRetry?: () => void;
}

export function ErrorView({ message = 'حدث خطأ ما', onRetry }: Props) {
  const { colors, isDark } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, backgroundColor: colors.bg }}>
      <Text style={{ marginBottom: 16, textAlign: 'center', fontSize: 16, color: colors.error, fontFamily: 'Cairo-SemiBold', writingDirection: 'rtl' }}>
        {message}
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
