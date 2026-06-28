import { ScrollView, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../src/hooks/useTheme';
import type { ThemeColors } from '../src/theme/tokens';

function PrivacyCard({ icon, title, children, colors }: { icon: keyof typeof Ionicons.glyphMap; title: string; children: React.ReactNode; colors: ThemeColors }) {
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
    <View style={{ flexDirection: 'row-reverse', alignItems: 'flex-start', paddingHorizontal: 4, marginBottom: 8 }}>
      <Ionicons name="ellipse" size={6} color={colors.primary} style={{ marginTop: 8, marginLeft: 8 }} />
      <Text style={{ flex: 1, textAlign: 'right', fontSize: 14, lineHeight: 22, color: colors.textSecondary, fontFamily: 'Cairo-Regular', writingDirection: 'rtl' }}>
        {text}
      </Text>
    </View>
  );
}

export default function PrivacyScreen() {
  const { colors } = useTheme();
  const body = { textAlign: 'right' as const, fontSize: 14, lineHeight: 22, color: colors.textSecondary, fontFamily: 'Cairo-Regular', writingDirection: 'rtl' as const };
  const title = { textAlign: 'right' as const, fontSize: 20, fontFamily: 'Cairo-Bold', color: colors.textPrimary, marginBottom: 12, writingDirection: 'rtl' as const };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-forward" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 18, fontFamily: 'Cairo-Bold', color: colors.textPrimary }}>
          سياسة الخصوصية
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
        {/* Intro */}
        <Text style={title}>سياسة الخصوصية</Text>
        <Text style={{ ...body, marginBottom: 24, fontSize: 12, color: colors.textMuted }}>آخر تحديث: يونيو 2026</Text>
        <Text style={[body, { marginBottom: 20 }]}>مرحباً بك في تطبيق دلني. نحن نقدّر خصوصيتك ونلتزم بحماية بيانات المستخدمين. توضح هذه السياسة كيفية جمع واستخدام وحماية بيانات المستخدمين عند استخدام تطبيقنا.</Text>

        {/* 1. البيانات التي نجمعها */}
        <PrivacyCard icon="copy" title="١. البيانات التي نجمعها" colors={colors}>
          <Text style={[body, { marginBottom: 12 }]}>قد نقوم بجمع ومعالجة البيانات التالية:</Text>
          <Bullet text="البريد الإلكتروني: مطلوب للتسجيل والدخول واستعادة كلمة المرور" colors={colors} />
          <Bullet text="الاسم الكامل: مطلوب لإنشاء ملف التعريف والعرض العام" colors={colors} />
          <Bullet text="رقم الهاتف: اختياري، يُستخدم للتواصل المباشر مع مقدمي الخدمات" colors={colors} />
          <Bullet text="المدينة: اختياري، لتصفية البحث عن مقدمي الخدمات المحليين" colors={colors} />
          <Bullet text="التقييمات والتعليقات: بيانات عامة تكتبها أنت عن مقدمي الخدمات" colors={colors} />
          <Bullet text="معرّف الجهاز ورمز الإشعارات: لإرسال الإشعارات عبر البريد الإلكتروني والهاتف" colors={colors} />
          <Bullet text="سجل البحث والمشاهدة: الفئات والمقدمون الذين بحثت عنهم أو عرضتهم" colors={colors} />
          <Bullet text="سجلات التطبيق والأخطاء: لتحسين الأداء والأمان" colors={colors} />
        </PrivacyCard>

        {/* 2. كيفية استخدام البيانات */}
        <PrivacyCard icon="options" title="٢. كيفية استخدام بيانات المستخدمين" colors={colors}>
          <Text style={[body, { marginBottom: 12 }]}>نستخدم بيانات المستخدمين للأغراض التالية:</Text>
          <Bullet text="المصادقة والأمان: التحقق من هويتك وحماية حسابك من الوصول غير المصرح" colors={colors} />
          <Bullet text="تقديم الخدمات: السماح لك بالبحث وعرض مقدمي الخدمات والتواصل معهم" colors={colors} />
          <Bullet text="تحسين التجربة: تحسين توصيات البحث بناءً على تفضيلاتك" colors={colors} />
          <Bullet text="التواصل: إرسال إشعارات حول قرارات البلاغات والإشعارات المهمة" colors={colors} />
          <Bullet text="تحسين الخدمات: فهم كيفية استخدام التطبيق لتحسين الميزات والأداء" colors={colors} />
          <Bullet text="الامتثال القانوني: الامتثال للقوانين الليبية والدولية المعمول بها" colors={colors} />
        </PrivacyCard>

        {/* 3. مشاركة البيانات */}
        <PrivacyCard icon="share-social" title="٣. مشاركة البيانات" colors={colors}>
          <Text style={[body, { marginBottom: 12 }]}>لا نبيع أو نشارك بيانات المستخدمين الشخصية مع جهات خارجية. ومع ذلك:</Text>
          <Bullet text="مقدمو الخدمات: قد يرى مقدمو الخدمات معلومات الاتصال الخاصة بك عند التواصل المباشر" colors={colors} />
          <Bullet text="الموظفون: موظفو دلني قد يراجعون البلاغات والمحتوى المخالف للسياسة" colors={colors} />
          <Bullet text="متطلبات قانونية: قد نفصح عن البيانات إذا أُجبرنا بأمر قضائي أو قانوني" colors={colors} />
        </PrivacyCard>

        {/* 4. مدة الاحتفاظ بالبيانات */}
        <PrivacyCard icon="calendar" title="٤. مدة الاحتفاظ بالبيانات" colors={colors}>
          <Bullet text="بيانات الحساب: يتم الاحتفاظ بها حتى حذف حسابك من الإعدادات" colors={colors} />
          <Bullet text="التقييمات والتعليقات: يتم الاحتفاظ بها بشكل دائم (محتوى عام بدون اسم بعد الحذف)" colors={colors} />
          <Bullet text="سجلات البحث: حذف تلقائي بعد ٩٠ يوماً" colors={colors} />
          <Bullet text="رموز الإشعارات: حذف عند إزالة التطبيق من جهازك" colors={colors} />
          <Bullet text="سجلات البلاغات: الاحتفاظ بها لمدة سنة واحدة على الأقل لأغراض التدقيق" colors={colors} />
        </PrivacyCard>

        {/* 5. حقوقك */}
        <PrivacyCard icon="shield-checkmark" title="٥. حقوقك" colors={colors}>
          <Bullet text="الوصول: يمكنك طلب نسخة من بيانات حسابك بالكامل" colors={colors} />
          <Bullet text="الحذف: يمكنك حذف حسابك وجميع البيانات المرتبطة به من قائمة الإعدادات" colors={colors} />
          <Bullet text="التصحيح: يمكنك تحديث معلومات ملف تعريفك في أي وقت" colors={colors} />
          <Bullet text="عدم الملاحقة: لن نستخدم بيانات موقعك دون إذنك الصريح" colors={colors} />
        </PrivacyCard>

        {/* 6. أمان البيانات */}
        <PrivacyCard icon="lock-closed" title="٦. أمان البيانات" colors={colors}>
          <Text style={body}>نحن نستخدم تشفير HTTPS وأفضل الممارسات الأمنية لحماية بيانات المستخدمين أثناء النقل والتخزين. يتم تخزين كلمات المرور بشكل آمن ولا يمكننا رؤيتها. ومع ذلك، لا يمكن لأي نظام أن يضمن أماناً بنسبة ١٠٠%.</Text>
        </PrivacyCard>

        {/* 7. الأطفال */}
        <PrivacyCard icon="shield" title="٧. حماية الأطفال" colors={colors}>
          <Text style={body}>لا ينطبق تطبيق دلني على الأشخاص الذين تقل أعمارهم عن ١٣ سنة. نحن لا نجمع عن قصد بيانات شخصية من الأطفال. إذا اكتشفنا أن طفلاً قد سجل، سنحذف حسابه على الفور.</Text>
        </PrivacyCard>

        {/* 8. الإشعارات */}
        <PrivacyCard icon="notifications" title="٨. الإشعارات" colors={colors}>
          <Text style={[body, { marginBottom: 12 }]}>قد نرسل إشعارات عبر البريد الإلكتروني أو الهاتف بشأن:</Text>
          <Bullet text="قرارات البلاغات (قبول أو رفض بلاغك عن محتوى غير مناسب)" colors={colors} />
          <Bullet text="الإشعارات الإدارية المهمة من دلني" colors={colors} />
          <Bullet text="التحديثات والميزات الجديدة" colors={colors} />
          <Text style={[body, { marginTop: 12 }]}>يمكنك تعطيل الإشعارات من إعدادات جهازك أو من تطبيق دلني في أي وقت.</Text>
        </PrivacyCard>

        {/* 9. الروابط الخارجية */}
        <PrivacyCard icon="open" title="٩. الروابط الخارجية" colors={colors}>
          <Text style={body}>قد يحتوي التطبيق على روابط لمواقع خارجية (WhatsApp وFacebook وGoogleMaps وغيرها). نحن غير مسؤولين عن سياسات الخصوصية لتلك المواقع. يرجى مراجعة سياساتهم الخاصة قبل مشاركة البيانات.</Text>
        </PrivacyCard>

        {/* 10. تغييرات على السياسة */}
        <PrivacyCard icon="alert" title="١٠. تغييرات على السياسة" colors={colors}>
          <Text style={body}>قد نحدّث هذه السياسة من وقت لآخر. سيتم إخطارك بأي تغييرات مهمة عبر البريد الإلكتروني أو إشعار داخل التطبيق.</Text>
        </PrivacyCard>

        {/* 11. التواصل معنا */}
        <PrivacyCard icon="mail" title="١١. التواصل معنا" colors={colors}>
          <Text style={[body, { marginBottom: 12 }]}>إذا كان لديك أي أسئلة أو مخاوف بشأن خصوصيتك، يرجى التواصل معنا:</Text>
          <Text style={{ ...body, fontFamily: 'Cairo-Bold', marginBottom: 4 }}>البريد الإلكتروني:</Text>
          <Text style={{ ...body, marginBottom: 12 }}>privacy@delni.ly</Text>
          <Text style={{ ...body, fontFamily: 'Cairo-Bold', marginBottom: 4 }}>الموقع:</Text>
          <Text style={body}>https://delni.ly</Text>
        </PrivacyCard>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
