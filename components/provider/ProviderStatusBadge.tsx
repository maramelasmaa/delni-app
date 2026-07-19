import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';

type ProviderStatus = 'active' | 'incomplete' | 'hidden';

type Props = {
  isComplete: boolean;
  isDiscoverable: boolean;
};

export function resolveProviderStatus({ isComplete, isDiscoverable }: Props): ProviderStatus {
  if (!isComplete) return 'incomplete';
  if (!isDiscoverable) return 'hidden';
  return 'active';
}

export function ProviderStatusBadge({ isComplete, isDiscoverable }: Props) {
  const { colors } = useTheme();
  const status = resolveProviderStatus({ isComplete, isDiscoverable });
  const config = {
    active: {
      label: 'ظاهر للعملاء',
      icon: 'ellipse' as const,
      color: colors.success,
    },
    incomplete: {
      label: 'ملف غير مكتمل',
      icon: 'ellipse' as const,
      color: colors.goldText,
    },
    hidden: {
      label: 'غير ظاهر للعملاء',
      icon: 'ellipse' as const,
      color: colors.goldText,
    },
  }[status];

  return (
    <View
      accessibilityLabel={`حالة الملف: ${config.label}`}
      style={styles.badge}
    >
      <Ionicons name={config.icon} size={7} color={config.color} />
      <Text numberOfLines={1} style={[styles.label, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minHeight: 20,
    marginTop: 4,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-end',
  },
  label: {
    fontSize: 10.5,
    fontFamily: 'Cairo-Bold',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
