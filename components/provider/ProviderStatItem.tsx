import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
};

export function ProviderStatItem({ icon, label, value }: Props) {
  const { colors } = useTheme();

  return (
    <View style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.iconBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
        <Ionicons name={icon} size={17} color={colors.primary} />
      </View>
      <Text numberOfLines={1} style={[styles.value, { color: colors.textPrimary }]}>{value}</Text>
      <Text numberOfLines={1} style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    width: '48.5%',
    minHeight: 96,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    alignItems: 'flex-end',
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    marginTop: 8,
    fontSize: 20,
    fontFamily: 'Cairo-Black',
    textAlign: 'right',
  },
  label: {
    fontSize: 11.5,
    fontFamily: 'Cairo-SemiBold',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
