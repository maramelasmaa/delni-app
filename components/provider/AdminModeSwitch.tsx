import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../src/hooks/useTheme';

type Props = { mode: 'public' | 'admin'; compact?: boolean };

export function AdminModeSwitch({ mode, compact = false }: Props) {
  const { colors } = useTheme();
  const adminMode = mode === 'admin';
  const target = adminMode ? '/(tabs)/' : '/(admin)/';
  const label = adminMode ? 'العودة إلى التطبيق العام' : 'فتح لوحة الإدارة';

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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 46,
    height: 46,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactButton: {
    width: 40,
    height: 40,
  },
});
