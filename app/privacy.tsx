import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/hooks/useTheme';
import type { ThemeColors } from '../src/theme/tokens';
import { rtlRow } from '../src/utils/rtl';

interface PrivacyCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  children: React.ReactNode;
  colors: ThemeColors;
}

function PrivacyCard({ icon, title, children, colors }: PrivacyCardProps) {
  return (
    <View style={{ marginBottom: 16, borderRadius: 24, backgroundColor: colors.surface, padding: 24, borderWidth: 1, borderColor: colors.border, elevation: 1 }}>
      <View style={{ ...rtlRow(), alignItems: 'center', marginBottom: 14 }}>
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
    <View style={{ ...rtlRow(), alignItems: 'flex-start', paddingHorizontal: 4 }}>
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
        <View style={{ marginBottom: 20, paddingHorizontal: 8 }}>
          <Text style={{ textAlign: 'right', fontSize: 14, lineHeight: 24, color: colors.textMuted, fontFamily: 'Cairo-Regular', writingDirection: 'rtl', marginBottom: 4 }}>
            تطبيق دلني يحترم خصوصيتك ويشرح هنا فقط البيانات التي يدعمها التطبيق الحالي وطريقة استخدامها.
          </Text>
        </View>

        <PrivacyCard icon="lock-closed" title="1. أنواع البيانات التي نعالجها" colors={colors}>
          <View style={{ gap: 8 }}>
            {[
              'الاسم والبريد الإلكتروني وكلمة المرور عند إنشاء الحساب أو تسجيل الدخول.',
              'المدينة التي تختارها يدويًا لتحسين نتائج البحث حسب المدينة.',
              'موقع الجهاز أثناء استخدام التطبيق فقط إذا منحت إذن الموقع لاكتشاف أقرب مدينة لك.',
              'التقييمات والتعليقات والبلاغات التي ترسلها داخل التطبيق.',
              'المفضلة المحفوظة داخل حسابك إذا كنت مسجلاً الدخول.',
            ].map((item, idx) => <Bullet key={idx} text={item} colors={colors} />)}
          </View>
        </PrivacyCard>

        <PrivacyCard icon="settings" title="2. لماذا نستخدم هذه البيانات" colors={colors}>
          <View style={{ gap: 8 }}>
            {[
              'تسجيل الدخول وإدارة الحساب واستعادة كلمة المرور.',
              'عرض مقدمي الخدمات وتصفية النتائج حسب المدينة والتخصص.',
              'تمكين كتابة التقييمات والإبلاغ عن المحتوى غير المناسب.',
              'حماية المنصة من الإساءة والاحتيال والمحتوى المخالف.',
            ].map((item, idx) => <Bullet key={idx} text={item} colors={colors} />)}
          </View>
        </PrivacyCard>

        <PrivacyCard icon="share-social" title="3. مع من قد نشارك البيانات" colors={colors}>
          <View style={{ gap: 8 }}>
            {[
              'فريق الإدارة والمشرفون قد يراجعون التقييمات والبلاغات عند الحاجة إلى الإشراف أو الدعم.',
              'قد نفصح عن البيانات إذا طُلب منا ذلك قانونيًا من جهة مختصة.',
              'عند تواصلك مباشرة مع مقدم الخدمة عبر الهاتف أو واتساب، تتم مشاركة معلومات الاتصال التي تختار استخدامها عبر تلك الخدمة الخارجية.',
              'لا نبيع البيانات الشخصية لأطراف ثالثة.',
            ].map((item, idx) => <Bullet key={idx} text={item} colors={colors} />)}
          </View>
        </PrivacyCard>

        <PrivacyCard icon="calendar" title="4. مدة الاحتفاظ" colors={colors}>
          <View style={{ gap: 8 }}>
            {[
              'بيانات الحساب تُحفظ ما دام الحساب نشطًا، ثم تُزال وفق إجراءات الحذف المعتمدة لدينا.',
              'التقييمات والبلاغات قد تُحفظ لمدة لازمة للإشراف والامتثال والسجل التشغيلي.',
            ].map((item, idx) => <Bullet key={idx} text={item} colors={colors} />)}
          </View>
        </PrivacyCard>

        <PrivacyCard icon="person" title="5. حقوقك" colors={colors}>
          <View style={{ gap: 8 }}>
            {[
              'يمكنك تحديث اسمك وبريدك الإلكتروني من داخل التطبيق.',
              'يمكنك حذف حسابك من شاشة الحساب داخل التطبيق.',
              'يمكنك إيقاف إذن الموقع من إعدادات جهازك في أي وقت.',
              'يمكنك التواصل معنا عبر صفحة "تواصل معنا" لطلبات الخصوصية أو الدعم.',
            ].map((item, idx) => <Bullet key={idx} text={item} colors={colors} />)}
          </View>
        </PrivacyCard>

        <PrivacyCard icon="shield" title="6. الأمان" colors={colors}>
          <Text style={body}>
            نستخدم اتصالات HTTPS لحماية البيانات أثناء النقل بين التطبيق والخوادم. كما نحاول قصر الوصول إلى البيانات على ما يلزم لتشغيل الخدمة والإشراف عليها.
          </Text>
        </PrivacyCard>

        <PrivacyCard icon="location" title="7. الموقع" colors={colors}>
          <View style={{ gap: 8 }}>
            {[
              'إذن الموقع اختياري ويُستخدم فقط أثناء استعمالك للتطبيق للمساعدة في اقتراح المدينة الأقرب.',
              'يمكنك رفض هذا الإذن دون منعك من تصفح التطبيق كضيف.',
            ].map((item, idx) => <Bullet key={idx} text={item} colors={colors} />)}
          </View>
        </PrivacyCard>

        <PrivacyCard icon="alert-circle" title="8. تحديثات السياسة" colors={colors}>
          <Text style={body}>
            قد نقوم بتحديث هذه السياسة عند تغير التطبيق أو أساليب المعالجة. وعند وجود تغيير جوهري سنعرض نسخة محدثة داخل التطبيق أو عبر قنوات الدعم المناسبة.
          </Text>
        </PrivacyCard>

        <Text style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: colors.textDisabled, fontFamily: 'Cairo-Regular' }}>آخر تحديث: يونيو 2026</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
