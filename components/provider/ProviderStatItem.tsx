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
      <View style={styles.textWrap}>
        <Text numberOfLines={1} style={[styles.value, { color: colors.textPrimary }]}>{value}</Text>
        <Text numberOfLines={1} style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    width: '48.5%',
    minHeight: 82,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    position: 'relative',
    justifyContent: 'center',
  },
  iconBox: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    marginRight: 46,
    alignItems: 'flex-end',
  },
  value: {
    fontSize: 18,
    lineHeight: 34,
    fontFamily: 'Cairo-Black',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  label: {
    fontSize: 11,
    lineHeight: 17,
    fontFamily: 'Cairo-SemiBold',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
