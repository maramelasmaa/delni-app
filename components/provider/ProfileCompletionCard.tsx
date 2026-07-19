import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';

type Props = {
  percentage: number;
  isComplete: boolean;
  onCompletePress: () => void;
};

function clampPercentage(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function ProfileCompletionCard({ percentage, isComplete, onCompletePress }: Props) {
  const { colors } = useTheme();
  const value = clampPercentage(percentage);
  const label = isComplete ? 'الملف جاهز للعرض' : 'أكمل بيانات الملف';

  return (
    <Pressable
      accessibilityRole={isComplete ? undefined : 'button'}
      accessibilityLabel={`اكتمال الملف ${value} بالمئة`}
      accessibilityHint={isComplete ? undefined : 'يفتح صفحة إكمال بيانات الملف التجاري'}
      disabled={isComplete}
      onPress={onCompletePress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.82 : 1,
        },
      ]}
    >
      <View style={[styles.iconBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
        <Ionicons name={isComplete ? 'checkmark' : 'sparkles-outline'} size={17} color={colors.primary} />
      </View>
      <View style={styles.textWrap}>
        <View style={styles.valueRow}>
          <Text numberOfLines={1} style={[styles.value, { color: colors.textPrimary }]}>{value}%</Text>
        </View>
        <Text numberOfLines={1} style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
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
