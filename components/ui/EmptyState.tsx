import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../../src/hooks/useTheme';

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon = 'search-outline', title, message, actionLabel, onAction }: Props) {
  const { colors, isDark } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 64 }}>
      <View
        style={{
          marginBottom: 16,
          height: 80,
          width: 80,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 999,
          backgroundColor: colors.surfaceAlt,
        }}
      >
        <Ionicons name={icon} size={36} color={colors.textMuted} />
      </View>
      <Text style={{ marginBottom: 8, textAlign: 'center', fontSize: 18, fontFamily: 'Cairo-Bold', color: colors.textPrimary, writingDirection: 'rtl' }}>
        {title}
      </Text>
      {message ? (
        <Text style={{ textAlign: 'center', fontSize: 14, fontFamily: 'Cairo-Regular', color: colors.textSecondary, writingDirection: 'rtl' }}>
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => ({
            marginTop: 24,
            borderRadius: 12,
            backgroundColor: colors.primary,
            paddingHorizontal: 32,
            paddingVertical: 12,
            transform: [{ scale: pressed ? 0.97 : 1 }],
          })}
        >
          <Text style={{ fontFamily: 'Cairo-Bold', color: colors.textOnPrimary }}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
