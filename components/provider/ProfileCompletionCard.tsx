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
  const message = isComplete
    ? 'ملفك التجاري مكتمل وجاهز للعرض.'
    : 'أكمل البيانات الناقصة لتحسين ظهور ملفك للعملاء.';

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
      <View style={styles.headerRow}>
        <View style={[styles.iconBox, { backgroundColor: isComplete ? colors.successSoft : colors.goldSoft }]}>
          <Ionicons name={isComplete ? 'checkmark' : 'sparkles-outline'} size={18} color={isComplete ? colors.success : colors.goldText} />
        </View>
        <View style={styles.textWrap}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>اكتمال الملف التجاري</Text>
          <Text numberOfLines={1} style={[styles.message, { color: colors.textMuted }]}>{message}</Text>
        </View>
        <View style={styles.valueWrap}>
          <Text style={[styles.percent, { color: isComplete ? colors.success : colors.primary }]}>{value}%</Text>
          {!isComplete ? <Ionicons name="chevron-back" size={15} color={colors.textMuted} /> : null}
        </View>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: colors.surfaceAlt }]}>
        <View style={[styles.progressFill, { width: `${value}%`, backgroundColor: isComplete ? colors.success : colors.gold }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 14,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percent: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Cairo-Black',
    textAlign: 'center',
  },
  valueWrap: {
    minWidth: 46,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  textWrap: {
    flex: 1,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 14,
    fontFamily: 'Cairo-Black',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  message: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 17,
    fontFamily: 'Cairo-Regular',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 10,
    alignItems: 'flex-end',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
});
