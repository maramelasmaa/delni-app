import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  onPress?: () => void;
};

export function ProviderStatItem({ icon, label, value, accessibilityLabel, accessibilityHint, onPress }: Props) {
  const { colors } = useTheme();
  const content = (
    <>
      <View style={[styles.iconBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
        <Ionicons name={icon} size={17} color={colors.primary} />
      </View>
      <View style={styles.textWrap}>
        <View style={styles.valueRow}>
          <Text numberOfLines={1} style={[styles.value, { color: colors.textPrimary }]}>{value}</Text>
        </View>
        <Text numberOfLines={1} style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={accessibilityHint}
        onPress={onPress}
        style={({ pressed }) => [styles.item, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.82 : 1 }]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {content}
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
  valueRow: {
    height: 34,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  value: {
    fontSize: 18,
    lineHeight: 26,
    fontFamily: 'Cairo-Black',
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  label: {
    fontSize: 11,
    lineHeight: 17,
    fontFamily: 'Cairo-SemiBold',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
