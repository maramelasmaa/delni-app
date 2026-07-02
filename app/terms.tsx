import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { InfoCard } from '../components/ui/InfoCard';
import { useTheme } from '../src/hooks/useTheme';
import type { ThemeColors } from '../src/theme/tokens';
import { rtlRow } from '../src/utils/rtl';

interface TermsCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  children: React.ReactNode;
  colors: ThemeColors;
}

function TermsCard({ icon, title, children, colors }: TermsCardProps) {
  return <InfoCard icon={icon} title={title} colors={colors}>{children}</InfoCard>;
}

function Bullet({ text, colors }: { text: string; colors: ThemeColors }) {
  return (
    <View style={{ ...rtlRow(), alignItems: 'flex-start', paddingHorizontal: 4 }}>
      <Ionicons name="ellipse" size={6} color={colors.primary} style={{ marginTop: 8, marginLeft: 8 }} />
      <Text style={{ flex: 1, textAlign: 'right', fontSize: 14, lineHeight: 24, color: colors.textSecondary, fontFamily: 'Cairo-Regular', writingDirection: 'rtl' }}>
        {text}
      </Text>
    </View>
  );
}

export default function TermsScreen() {
  const { colors } = useTheme();
  const body = { textAlign: 'right' as const, fontSize: 14, lineHeight: 28, color: colors.textSecondary, fontFamily: 'Cairo-Regular', writingDirection: 'rtl' as const };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
        {/* Intro Acceptance */}
        <View style={{ marginBottom: 20, paddingHorizontal: 8 }}>
          <Text style={{ textAlign: 'right', fontSize: 14, lineHeight: 24, color: colors.textMuted, fontFamily: 'Cairo-Regular', writingDirection: 'rtl', marginBottom: 4 }}>
            يرجى قراءة شروط الاستخدام بعناية قبل استخدام المنصة.
          </Text>
          <Text style={{ textAlign: 'right', fontSize: 14, fontFamily: 'Cairo-Bold', color: colors.primary, writingDirection: 'rtl' }}>
            يُعد استخدام منصة دلني موافقةً من المستخدم على الالتزام بهذه الشروط والأحكام.
          </Text>
        </View>

        <TermsCard icon="globe" title="طبيعة المنصة" colors={colors}>
          <Text style={body}>
            دلني منصة دليل إلكتروني، ولا تُعد طرفاً في أي اتفاق أو تعاقد أو تعامل يتم بين المستخدم ومقدم الخدمة.
          </Text>
        </TermsCard>

        <TermsCard icon="person" title="مسؤوليات المستخدم" colors={colors}>
          <View style={{ gap: 12 }}>
            {[
              { bold: 'الاستخدام القانوني:', text: 'يلتزم المستخدم باستخدام المنصة بطريقة قانونية ومسؤولة.' },
              { bold: 'المصداقية:', text: 'الامتناع عن تقديم بلاغات أو تقييمات مضللة أو غير صحيحة.' },
              { bold: 'حماية المنصة:', text: 'عدم القيام بأي تصرف من شأنه الإضرار بالمنصة أو تعطيل عملها.' },
              { bold: 'التواصل باحترام:', text: 'يلتزم المستخدمون بالتعامل مع مقدمي الخدمات بأسلوب محترم، ويُحظر توجيه أي تهديدات أو مضايقات أو رسائل مسيئة. وتحتفظ إدارة دلني بحق اتخاذ الإجراءات المناسبة بحق الحسابات المخالفة.' },
            ].map((item, idx) => (
              <View key={idx} style={{ ...rtlRow(), alignItems: 'flex-start', paddingHorizontal: 4 }}>
                <Ionicons name="ellipse" size={6} color={colors.primary} style={{ marginTop: 8, marginLeft: 8 }} />
                <Text style={{ flex: 1, textAlign: 'right', fontSize: 14, lineHeight: 24, color: colors.textSecondary, fontFamily: 'Cairo-Regular', writingDirection: 'rtl' }}>
                  <Text style={{ fontFamily: 'Cairo-Bold', color: colors.textPrimary }}>{item.bold} </Text>
                  {item.text}
                </Text>
              </View>
            ))}
          </View>
        </TermsCard>

        <TermsCard icon="briefcase" title="مسؤوليات مقدم الخدمة" colors={colors}>
          <Text style={[body, { marginBottom: 12, lineHeight: 24 }]}>يتحمل مقدم الخدمة وحده المسؤولية الكاملة عن:</Text>
          <View style={{ gap: 8 }}>
            {[
              'صحة ودقة المعلومات التي يقدمها ويعرضها على صفحته.',
              'جودة الخدمات التي يقدمها والتزامه بإنهاء العمل.',
              'جميع التعاملات والاتفاقات المبرمة التي تتم مع العملاء.',
            ].map((item, idx) => <Bullet key={idx} text={item} colors={colors} />)}
          </View>
        </TermsCard>

        <TermsCard icon="ban" title="المحتوى المحظور" colors={colors}>
          <Text style={[body, { marginBottom: 12, lineHeight: 24 }]}>يُمنع منعاً باتاً نشر أو مشاركة أي محتوى:</Text>
          <View style={{ gap: 8 }}>
            {[
              'مخالف للقوانين أو الأنظمة المعمول بها داخل الدولة.',
              'مضلل أو يتضمن معلومات غير صحيحة أو شهادات مزورة.',
              'ينتهك حقوق الآخرين الفكرية أو يمس بسمعتهم وكرامتهم.',
              'يتضمن إساءة أو ألفاظاً غير لائقة أو محتوى غير مناسب للعامة.',
            ].map((item, idx) => <Bullet key={idx} text={item} colors={colors} />)}
          </View>
        </TermsCard>

        <TermsCard icon="star" title="التقييمات والمراجعات" colors={colors}>
          <Text style={body}>
            تشجع دلني المستخدمين على تقديم تقييمات ومراجعات موضوعية وصادقة. كما تحتفظ المنصة بحق حذف أو إخفاء أي تقييم أو مراجعة تتضمن معلومات مضللة أو إساءة أو مخالفة لهذه الشروط.
          </Text>
        </TermsCard>

        <TermsCard icon="hammer" title="إدارة الحسابات والمحتوى" colors={colors}>
          <Text style={body}>
            تحتفظ دلني بحق تعديل أو تعليق أو حذف الحسابات أو المحتوى المخالف لهذه الشروط أو للقوانين النافذة، دون الإخلال بحقوقها القانونية الأخرى.
          </Text>
        </TermsCard>

        <TermsCard icon="card" title="الخدمات والميزات المدفوعة" colors={colors}>
          <Text style={body}>
            التطبيق لا يبيع خدمات رقمية أو اشتراكات للمستخدمين داخل تطبيق iOS. أي ترتيبات تجارية تخص ظهور أو ترويج مقدمي الخدمات تتم خارج التطبيق وبإدارة منفصلة عن تجربة مستخدم iOS.
          </Text>
        </TermsCard>

        <TermsCard icon="warning" title="التعاملات خارج المنصة" colors={colors}>
          <Text style={body}>
            تتم جميع الاتفاقات والمدفوعات والتعاملات التي تتم خارج منصة دلني على مسؤولية الأطراف المعنية وحدهم، ولا تتحمل المنصة أي مسؤولية عنها.
          </Text>
        </TermsCard>

        <Text style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: colors.textDisabled, fontFamily: 'Cairo-Regular' }}>آخر تحديث: يونيو 2026</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
