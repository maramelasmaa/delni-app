import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../src/hooks/useTheme';

type Props = { mode: 'public' | 'admin'; compact?: boolean };

export function AdminModeSwitch({ mode, compact = false }: Props) {
  const { colors } = useTheme();
  const adminMode = mode === 'admin';
  const target = adminMode ? '/(tabs)/' : '/(admin)/';
  const label = adminMode ? 'العودة إلى التطبيق العام' : 'فتح لوحة الإدارة';
  const displayLabel = adminMode ? 'التطبيق العام' : 'لوحة الإدارة';

  return (
    <Pressable
      onPress={() => router.replace(target as never)}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="يبدل بين التطبيق العام ولوحة الإدارة"
      hitSlop={8}
      style={({ pressed }) => [
        styles.button,
        compact && styles.compactButton,
        {
          backgroundColor: colors.surface,
          borderColor: adminMode ? colors.goldBorder : colors.borderStrong,
          opacity: pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.94 : 1 }],
        },
      ]}
    >
      <Ionicons
        name={adminMode ? 'home-outline' : 'shield-checkmark-outline'}
        size={compact ? 20 : 23}
        color={adminMode ? colors.goldText : colors.primary}
      />
      <Text
        numberOfLines={1}
        style={[styles.label, compact && styles.compactLabel, { color: adminMode ? colors.goldText : colors.primary }]}
      >
        {displayLabel}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 42,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row-reverse',
    gap: 6,
  },
  compactButton: {
    minHeight: 38,
    paddingHorizontal: 9,
  },
  label: { fontSize: 12, fontFamily: 'Cairo-Bold', writingDirection: 'rtl' },
  compactLabel: { fontSize: 11 },
});
