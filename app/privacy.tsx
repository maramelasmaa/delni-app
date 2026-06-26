import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/hooks/useTheme';
import type { ThemeColors } from '../src/theme/tokens';

interface PrivacySectionProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  children: React.ReactNode;
  colors: ThemeColors;
}

function PrivacyCard({ icon, title, children, colors }: PrivacySectionProps) {
  return (
    <View style={{ marginBottom: 16, borderRadius: 24, backgroundColor: colors.surface, padding: 24, borderWidth: 1, borderColor: colors.border, elevation: 1 }}>
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 14 }}>
        <View style={{ height: 32, width: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 999, backgroundColor: colors.primarySoft, marginLeft: 8 }}>
          <Ionicons name={icon} size={18} color={colors.primary} />
        </View>
        <Text style={{ textAlign: 'right', fontSize: 16, fontFamily: 'Cairo-Bold', color: colors.textPrimary }}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Bullet({ text, colors }: { text: string; colors: ThemeColors }) {
  return (
    <View style={{ flexDirection: 'row-reverse', alignItems: 'flex-start', paddingHorizontal: 4 }}>
      <Ionicons name="ellipse" size={6} color={colors.primary} style={{ marginTop: 8, marginLeft: 8 }} />
      <Text style={{ flex: 1, textAlign: 'right', fontSize: 14, lineHeight: 24, color: colors.textSecondary, fontFamily: 'Cairo-Regular', writingDirection: 'rtl' }}>
        {text}
      </Text>
    </View>
  );
}

export default function PrivacyScreen() {
  const { colors } = useTheme();
  const body = { textAlign: 'right' as const, fontSize: 14, lineHeight: 28, color: colors.textSecondary, fontFamily: 'Cairo-Regular', writingDirection: 'rtl' as const };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
        {/* Intro */}
        <View style={{ marginBottom: 20, paddingHorizontal: 8 }}>
          <Text style={{ textAlign: 'right', fontSize: 14, lineHeight: 24, color: colors.textMuted, fontFamily: 'Cairo-Regular', writingDirection: 'rtl' }}>
            نحن في دلني نولي خصوصيتك أهمية قصوى. توضح هذه السياسة البيانات التي نجمعها وكيفية معالجتها لحماية خصوصيتك وضمان تقديم تجربة استخدام آمنة ومميزة.
          </Text>
        </View>

        <PrivacyCard icon="copy" title="المعلومات التي نقوم بجمعها" colors={colors}>
          <Text style={[body, { marginBottom: 12, lineHeight: 24 }]}>قد نقوم بجمع ومعالجة بعض المعلومات، بما في ذلك:</Text>
          <View style={{ gap: 8 }}>
            {[
              'الاسم ورقم الهاتف والبريد الإلكتروني عند إنشاء حساب أو التواصل معنا.',
              'بيانات مقدمي الخدمات، مثل اسم النشاط، المدينة، الفئة، الوصف، الصور ووسائل التواصل.',
              'التقييمات والمراجعات والمحتوى الذي يقدمه المستخدمون.',
              'بيانات الاستخدام الأساسية، مثل الصفحات التي تمت زيارتها وعمليات البحث، بهدف تحسين أداء المنصة وتجربة المستخدم.',
            ].map((item, idx) => <Bullet key={idx} text={item} colors={colors} />)}
          </View>
        </PrivacyCard>

        <PrivacyCard icon="options" title="كيفية استخدام المعلومات" colors={colors}>
          <Text style={[body, { marginBottom: 12, lineHeight: 24 }]}>تُستخدم المعلومات التي يتم جمعها للأغراض التالية:</Text>
          <View style={{ gap: 8 }}>
            {[
              'عرض بيانات مقدمي الخدمات داخل المنصة.',
              'تحسين تجربة البحث والتصفح وتطوير خدمات المنصة.',
              'إدارة الحسابات والاشتراكات والمحتوى المنشور.',
              'التواصل مع المستخدمين أو مقدمي الخدمات عند الحاجة.',
              'مراجعة البلاغات والحد من إساءة استخدام المنصة.',
            ].map((item, idx) => <Bullet key={idx} text={item} colors={colors} />)}
          </View>
        </PrivacyCard>

        <PrivacyCard icon="share-social" title="مشاركة المعلومات" colors={colors}>
          <Text style={body}>
            لا تقوم دلني ببيع البيانات الشخصية للمستخدمين. وقد يتم عرض بعض المعلومات الخاصة بمقدمي الخدمات بشكل علني، باعتبار أن ذلك يمثل الغرض الأساسي من المنصة.
          </Text>
        </PrivacyCard>

        <PrivacyCard icon="shield-checkmark" title="حماية البيانات" colors={colors}>
          <Text style={body}>
            تلتزم دلني باتخاذ التدابير المعقولة والمناسبة لحماية البيانات والمحافظة على أمنها، مع الإقرار بأنه لا يمكن ضمان الحماية المطلقة لأي نظام إلكتروني.
          </Text>
        </PrivacyCard>

        <Text style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: colors.textDisabled, fontFamily: 'Cairo-Regular' }}>آخر تحديث: يونيو 2026</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
