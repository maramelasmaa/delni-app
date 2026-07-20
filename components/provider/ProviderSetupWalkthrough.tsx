import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../src/hooks/useTheme';
import type { ThemeColors } from '../../src/theme/tokens';

type SetupRoute = '/(provider)/profile-edit' | '/(provider)/portfolio' | '/(provider)/credentials';

type Step = {
  key: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: SetupRoute;
  done: boolean;
  optional?: boolean;
};

type Props = {
  isProfileComplete: boolean;
  portfolioItemsCount: number;
  credentialsCount: number;
};

const ORDINALS = ['الخطوة الأولى', 'الخطوة الثانية', 'الخطوة الثالثة', 'الخطوة الرابعة'];

function StepRow({ step, index, isActive, isLocked, isLast, colors }: { step: Step; index: number; isActive: boolean; isLocked: boolean; isLast: boolean; colors: ThemeColors }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={step.title}
      accessibilityState={{ checked: step.done, disabled: isLocked }}
      disabled={isLocked}
      onPress={() => router.push(step.route as never)}
      style={({ pressed }) => ({ opacity: isLocked ? 0.45 : pressed ? 0.78 : 1 })}
    >
      <View style={styles.stepRow}>
        {!isLocked ? <Ionicons name="chevron-back" size={16} color={colors.textMuted} style={styles.stepChevron} /> : null}
        <View style={styles.stepIndicatorColumn}>
          <View
            style={[styles.stepCircle, {
              backgroundColor: step.done ? colors.gold : isActive ? colors.primary : colors.surfaceAlt,
              borderColor: step.done ? colors.gold : isActive ? colors.primary : colors.border,
            }]}
          >
            {step.done ? (
              <Ionicons name="checkmark" size={14} color="#123A6F" />
            ) : isLocked ? (
              <Ionicons name="lock-closed" size={12} color={colors.textMuted} />
            ) : (
              <Text style={[styles.stepNumber, { color: isActive ? colors.textOnPrimary : colors.textMuted }]}>{index + 1}</Text>
            )}
          </View>
          {!isLast ? <View style={[styles.stepConnector, { backgroundColor: step.done ? colors.gold : colors.border }]} /> : null}
        </View>

        <View style={styles.stepBody}>
          <Text style={[styles.stepOrdinal, { color: step.done ? colors.goldText : isActive ? colors.goldText : colors.textMuted }]}>
            {ORDINALS[index] ?? `الخطوة ${index + 1}`}
          </Text>
          <View style={styles.stepTitleRow}>
            <Text style={[styles.stepTitle, { color: step.done ? colors.textMuted : colors.textPrimary }]}>{step.title}</Text>
            {step.optional ? (
              <View style={[styles.optionalPill, { backgroundColor: colors.surfaceAlt }]}>
                <Text style={[styles.optionalText, { color: colors.textMuted }]}>اختياري</Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.stepSubtitle, { color: colors.textMuted }]}>{step.subtitle}</Text>
          {isActive && !step.done ? (
            <View style={[styles.stepCta, { backgroundColor: colors.primary }]}>
              <Text style={[styles.stepCtaText, { color: colors.textOnPrimary }]}>ابدأ الآن</Text>
              <Ionicons name="arrow-back" size={13} color={colors.textOnPrimary} />
            </View>
          ) : null}
        </View>

        <View style={[styles.stepIcon, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <Ionicons name={step.icon} size={18} color={step.done ? colors.gold : colors.primary} />
        </View>
      </View>
    </Pressable>
  );
}

export function ProviderSetupWalkthrough({ isProfileComplete, portfolioItemsCount, credentialsCount }: Props) {
  const { colors } = useTheme();

  const steps: Step[] = [
    {
      key: 'profile',
      title: 'أكمل بيانات ملفك',
      subtitle: 'الاسم والتصنيف والوصف وطرق التواصل حتى يتعرف عليك العملاء',
      icon: 'person-circle-outline',
      route: '/(provider)/profile-edit',
      done: isProfileComplete,
    },
    {
      key: 'portfolio',
      title: 'أضف أعمالك ومشاريعك',
      subtitle: 'صور أعمالك السابقة هي أول ما يقنع العميل بالتواصل معك',
      icon: 'images-outline',
      route: '/(provider)/portfolio',
      done: portfolioItemsCount > 0,
    },
    {
      key: 'credentials',
      title: 'أضف شهاداتك وخبراتك',
      subtitle: 'الشهادات والاعتمادات تزيد ثقة العملاء بملفك',
      icon: 'ribbon-outline',
      route: '/(provider)/credentials',
      done: credentialsCount > 0,
      optional: true,
    },
  ];

  const setupDone = isProfileComplete && portfolioItemsCount > 0;
  const doneCount = steps.filter((s) => s.done).length;
  const activeIndex = steps.findIndex((s) => !s.done);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: setupDone ? colors.border : colors.goldBorder }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.progressPill, { backgroundColor: colors.goldSoft }]}>
          <Text style={[styles.progressText, { color: colors.goldText }]}>{doneCount} من {steps.length}</Text>
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            {setupDone ? 'ملفك جاهز' : 'جهّز ملفك خطوة بخطوة'}
          </Text>
          <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
            {setupDone
              ? 'حدّث بياناتك وأعمالك باستمرار ليبقى ملفك جذاباً للعملاء'
              : 'أكمل هذه الخطوات ليظهر ملفك للعملاء ويبدأ التواصل معك'}
          </Text>
        </View>
      </View>

      <View style={styles.steps}>
        {steps.map((step, index) => (
          <StepRow
            key={step.key}
            step={step}
            index={index}
            isActive={index === activeIndex}
            isLocked={!step.done && activeIndex !== -1 && index > activeIndex}
            isLast={index === steps.length - 1}
            colors={colors}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardHeaderText: {
    flex: 1,
    alignItems: 'flex-end',
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Cairo-Black',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  cardSubtitle: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 19,
    fontFamily: 'Cairo-Regular',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  progressPill: {
    paddingHorizontal: 10,
    height: 26,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontSize: 11,
    fontFamily: 'Cairo-Bold',
    writingDirection: 'rtl',
  },
  steps: {
    marginTop: 14,
  },
  stepRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 10,
    position: 'relative',
  },
  stepIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndicatorColumn: {
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepConnector: {
    width: 2,
    flex: 1,
    minHeight: 18,
    marginVertical: 3,
    borderRadius: 1,
  },
  stepNumber: {
    fontSize: 12,
    fontFamily: 'Cairo-Bold',
    includeFontPadding: false,
  },
  stepBody: {
    flex: 1,
    alignItems: 'flex-end',
    paddingBottom: 16,
    paddingLeft: 22,
  },
  stepChevron: {
    position: 'absolute',
    left: 0,
    top: 10,
  },
  stepOrdinal: {
    fontSize: 10.5,
    fontFamily: 'Cairo-Bold',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 1,
  },
  stepTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  stepTitle: {
    fontSize: 14,
    fontFamily: 'Cairo-Bold',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  optionalPill: {
    paddingHorizontal: 8,
    height: 20,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionalText: {
    fontSize: 10,
    fontFamily: 'Cairo-Bold',
    writingDirection: 'rtl',
  },
  stepSubtitle: {
    marginTop: 1,
    fontSize: 11.5,
    lineHeight: 18,
    fontFamily: 'Cairo-Regular',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  stepCta: {
    minHeight: 32,
    marginTop: 8,
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  stepCtaText: {
    fontSize: 12,
    fontFamily: 'Cairo-Bold',
    writingDirection: 'rtl',
  },
});
