import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { InfoCard } from '../components/ui/InfoCard';
import { useTheme } from '../src/hooks/useTheme';
import type { ThemeColors } from '../src/theme/tokens';
import { rtlRow } from '../src/utils/rtl';

interface DisclaimerCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  children: React.ReactNode;
  colors: ThemeColors;
}

function DisclaimerCard({ icon, title, children, colors }: DisclaimerCardProps) {
  return <InfoCard icon={icon} title={title} colors={colors}>{children}</InfoCard>;
}

export default function DisclaimerScreen() {
  const { colors } = useTheme();
  const body = { textAlign: 'right' as const, fontSize: 14, lineHeight: 28, color: colors.textSecondary, fontFamily: 'Cairo-Regular', writingDirection: 'rtl' as const };

  const sections: { icon: keyof typeof Ionicons.glyphMap; title: string; text: string }[] = [
    { icon: 'business', title: 'طبيعة المنصة', text: 'تُعد دلني منصة دليل إلكتروني مستقلة، ولا تعمل بصفتها وكيلاً أو ممثلاً لأي مقدم خدمة مدرج على المنصة.' },
    { icon: 'shield', title: 'عدم ضمان جودة الخدمات', text: 'لا تقدم دلني أي ضمانات تتعلق بجودة الخدمات أو سلامتها أو نتائجها، وتبقى المسؤولية الكاملة عن الخدمات المقدمة على عاتق مقدمي الخدمات.' },
    { icon: 'checkmark-done-circle', title: 'دقة المعلومات', text: 'تبذل دلني جهوداً معقولة لضمان صحة المعلومات المنشورة وتحديثها، إلا أنها لا تضمن اكتمالها أو دقتها أو استمرار حداثتها.' },
    { icon: 'pencil', title: 'التقييمات والآراء', text: 'تعبر التقييمات والتعليقات المنشورة عن آراء أصحابها، ولا تمثل بالضرورة رأي أو موقف منصة دلني.' },
    { icon: 'pulse', title: 'توفر المنصة', text: 'تسعى دلني إلى توفير خدماتها بصورة مستمرة، إلا أنها لا تضمن خلو المنصة من الأعطال أو الانقطاعات أو المشكلات التقنية.' },
    { icon: 'skull', title: 'حدود المسؤولية', text: 'في الحدود التي يسمح بها القانون، لا تتحمل دلني أي مسؤولية عن الأضرار أو الخسائر المباشرة أو غير المباشرة أو التبعية الناتجة عن استخدام المنصة أو عن التعامل مع مقدمي الخدمات المدرجين فيها.' },
    { icon: 'help-buoy', title: 'عدم تقديم المشورة المهنية', text: 'جميع المعلومات المتاحة على منصة دلني مقدمة لأغراض التعريف والبحث فقط، ولا تشكل استشارة مهنية أو قانونية أو مالية أو طبية أو تقنية من أي نوع.' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
        {/* Intro */}
        <View style={{ marginBottom: 20, paddingHorizontal: 8 }}>
          <Text style={{ textAlign: 'right', fontSize: 14, lineHeight: 24, color: colors.textMuted, fontFamily: 'Cairo-Regular', writingDirection: 'rtl' }}>
            نرجو من جميع المستخدمين ومقدمي الخدمات قراءة إخلاء المسؤولية هذا لفهم حدود التزامات ومسؤوليات منصة دلني الإلكترونية.
          </Text>
        </View>

        {sections.map((s, idx) => (
          <DisclaimerCard key={idx} icon={s.icon} title={s.title} colors={colors}>
            <Text style={body}>{s.text}</Text>
          </DisclaimerCard>
        ))}

        <Text style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: colors.textDisabled, fontFamily: 'Cairo-Regular' }}>آخر تحديث: يونيو 2026</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
