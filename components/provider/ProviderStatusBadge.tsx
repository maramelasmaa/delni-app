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
      label: 'نشط',
      icon: 'checkmark-circle' as const,
      color: colors.success,
      backgroundColor: colors.successSoft,
      borderColor: colors.success,
    },
    incomplete: {
      label: 'ملف غير مكتمل',
      icon: 'alert-circle-outline' as const,
      color: colors.goldText,
      backgroundColor: colors.goldSoft,
      borderColor: colors.goldBorder,
    },
    hidden: {
      label: 'غير ظاهر للعملاء',
      icon: 'eye-off-outline' as const,
      color: colors.goldText,
      backgroundColor: colors.goldSoft,
      borderColor: colors.goldBorder,
    },
  }[status];

  return (
    <View
      accessibilityLabel={`حالة الملف: ${config.label}`}
      style={[styles.badge, { backgroundColor: config.backgroundColor, borderColor: config.borderColor }]}
    >
      <Ionicons name={config.icon} size={14} color={config.color} />
      <Text numberOfLines={1} style={[styles.label, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minHeight: 30,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-end',
  },
  label: {
    fontSize: 11.5,
    fontFamily: 'Cairo-Bold',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
