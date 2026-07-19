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
    ? 'بيانات نشاطك الأساسية مكتملة.'
    : 'أكمل البيانات الناقصة لتحسين ظهور ملفك للعملاء.';

  return (
    <View
      accessibilityLabel={`اكتمال الملف ${value} بالمئة`}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.percent, { color: colors.textPrimary }]}>{value}%</Text>
        <View style={styles.textWrap}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>اكتمال البيانات</Text>
          <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text>
        </View>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: colors.surfaceAlt }]}>
        <View style={[styles.progressFill, { width: `${value}%`, backgroundColor: isComplete ? colors.success : colors.gold }]} />
      </View>
      {!isComplete ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="إكمال بيانات الملف التجاري"
          onPress={onCompletePress}
          style={({ pressed }) => [styles.action, { backgroundColor: colors.primary, opacity: pressed ? 0.86 : 1 }]}
        >
          <Ionicons name="create-outline" size={17} color={colors.textOnPrimary} />
          <Text style={[styles.actionText, { color: colors.textOnPrimary }]}>إكمال البيانات</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  percent: {
    minWidth: 56,
    fontSize: 24,
    fontFamily: 'Cairo-Black',
    textAlign: 'left',
  },
  textWrap: {
    flex: 1,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Cairo-Black',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  message: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 19,
    fontFamily: 'Cairo-Regular',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 14,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  action: {
    alignSelf: 'flex-end',
    minHeight: 42,
    marginTop: 14,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  actionText: {
    fontSize: 13,
    fontFamily: 'Cairo-Bold',
    writingDirection: 'rtl',
  },
});
