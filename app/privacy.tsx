import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/hooks/useTheme';
import type { ThemeColors } from '../src/theme/tokens';

function SectionLabel({ children, colors }: { children: string; colors: ThemeColors }) {
  return (
    <Text style={{ textAlign: 'right', fontSize: 12, fontFamily: 'Cairo-Bold', color: colors.textMuted, marginBottom: 10, marginRight: 4, letterSpacing: 0.3 }}>
      {children}
    </Text>
  );
}

function GroupCard({ children, colors }: { children: React.ReactNode; colors: ThemeColors }) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 1,
        marginBottom: 16,
      }}
    >
      {children}
    </View>
  );
}

function Divider({ colors }: { colors: ThemeColors }) {
  return <View style={{ height: 1, backgroundColor: colors.border, marginRight: 16 }} />;
}

function Bullet({ text, colors }: { text: string; colors: ThemeColors }) {
  return (
    <View style={{ flexDirection: 'row-reverse', alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 8 }}>
      <Ionicons name="ellipse" size={6} color={colors.primary} style={{ marginTop: 8, marginRight: 8 }} />
      <Text style={{ flex: 1, textAlign: 'right', fontSize: 14, lineHeight: 22, color: colors.textSecondary, fontFamily: 'Cairo-Regular' }}>
        {text}
      </Text>
    </View>
  );
}

function BodyText({ text, colors }: { text: string; colors: ThemeColors }) {
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
      <Text style={{ textAlign: 'right', fontSize: 14, lineHeight: 22, color: colors.textSecondary, fontFamily: 'Cairo-Regular' }}>
        {text}
      </Text>
    </View>
  );
}

export default function PrivacyScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48, paddingTop: 16 }}>
        {/* Title */}
        <Text style={{ textAlign: 'right', fontSize: 18, fontFamily: 'Cairo-Bold', color: colors.textPrimary, marginBottom: 4 }}>
          سياسة الخصوصية
        </Text>
        <Text style={{ textAlign: 'right', fontSize: 12, color: colors.textMuted, fontFamily: 'Cairo-Regular', marginBottom: 24 }}>
          آخر تحديث: يونيو 2026
        </Text>

        {/* Intro */}
        <Text style={{ textAlign: 'right', fontSize: 14, lineHeight: 22, color: colors.textSecondary, fontFamily: 'Cairo-Regular', marginBottom: 24 }}>
          مرحباً بك في تطبيق دلني. نحن نقدّر خصوصيتك ونلتزم بحماية بيانات المستخدمين. توضح هذه السياسة كيفية جمع واستخدام وحماية البيانات عند استخدام تطبيقنا.
        </Text>

        {/* 1. البيانات التي نجمعها */}
        <SectionLabel colors={colors}>1. البيانات التي نجمعها</SectionLabel>
        <GroupCard colors={colors}>
          <Bullet text="البريد الإلكتروني: مطلوب للتسجيل والدخول واستعادة كلمة المرور" colors={colors} />
          <Divider colors={colors} />
          <Bullet text="الاسم الكامل: مطلوب لإنشاء ملف التعريف والعرض العام" colors={colors} />
          <Divider colors={colors} />
          <Bullet text="رقم الهاتف: اختياري، يُستخدم للتواصل المباشر مع مقدمي الخدمات" colors={colors} />
          <Divider colors={colors} />
          <Bullet text="المدينة: اختياري، لتصفية البحث عن مقدمي الخدمات المحليين" colors={colors} />
          <Divider colors={colors} />
          <Bullet text="التقييمات والتعليقات: بيانات عامة تكتبها أنت عن مقدمي الخدمات" colors={colors} />
          <Divider colors={colors} />
          <Bullet text="معرّف الجهاز ورمز الإشعارات: لإرسال الإشعارات" colors={colors} />
          <Divider colors={colors} />
          <Bullet text="سجل البحث والمشاهدة: تحسين توصياتك" colors={colors} />
          <Divider colors={colors} />
          <Bullet text="سجلات التطبيق والأخطاء: لتحسين الأداء والأمان" colors={colors} />
        </GroupCard>

        {/* 2. كيفية استخدام البيانات */}
        <SectionLabel colors={colors}>2. كيفية استخدام بيانات المستخدمين</SectionLabel>
        <GroupCard colors={colors}>
          <Bullet text="المصادقة والأمان: التحقق من هويتك وحماية حسابك" colors={colors} />
          <Divider colors={colors} />
          <Bullet text="تقديم الخدمات: السماح لك بالبحث وعرض مقدمي الخدمات" colors={colors} />
          <Divider colors={colors} />
          <Bullet text="تحسين التجربة: تحسين توصيات البحث بناءً على تفضيلاتك" colors={colors} />
          <Divider colors={colors} />
          <Bullet text="التواصل: إرسال إشعارات مهمة حول حسابك" colors={colors} />
          <Divider colors={colors} />
          <Bullet text="تحسين الخدمات: فهم كيفية استخدام التطبيق" colors={colors} />
          <Divider colors={colors} />
          <Bullet text="الامتثال القانوني: الامتثال للقوانين المعمول بها" colors={colors} />
        </GroupCard>

        {/* 3. مشاركة البيانات */}
        <SectionLabel colors={colors}>3. مشاركة البيانات</SectionLabel>
        <GroupCard colors={colors}>
          <Bullet text="مقدمو الخدمات: قد يرى معلومات الاتصال عند التواصل المباشر" colors={colors} />
          <Divider colors={colors} />
          <Bullet text="الموظفون: قد يراجعون البلاغات والمحتوى المخالف" colors={colors} />
          <Divider colors={colors} />
          <Bullet text="متطلبات قانونية: قد نفصح عن البيانات إذا أُجبرنا قانونياً" colors={colors} />
        </GroupCard>

        {/* 4. مدة الاحتفاظ بالبيانات */}
        <SectionLabel colors={colors}>4. مدة الاحتفاظ بالبيانات</SectionLabel>
        <GroupCard colors={colors}>
          <Bullet text="بيانات الحساب: حتى تحذف الحساب" colors={colors} />
          <Divider colors={colors} />
          <Bullet text="التقييمات والتعليقات: بشكل دائم" colors={colors} />
          <Divider colors={colors} />
          <Bullet text="سجلات البحث: حذف تلقائي بعد 90 يوماً" colors={colors} />
          <Divider colors={colors} />
          <Bullet text="رموز الإشعارات: عند إزالة التطبيق" colors={colors} />
          <Divider colors={colors} />
          <Bullet text="سجلات البلاغات: سنة واحدة على الأقل" colors={colors} />
        </GroupCard>

        {/* 5. حقوقك */}
        <SectionLabel colors={colors}>5. حقوقك</SectionLabel>
        <GroupCard colors={colors}>
          <Bullet text="الوصول: طلب نسخة من بيانات حسابك" colors={colors} />
          <Divider colors={colors} />
          <Bullet text="الحذف: حذف حسابك من الإعدادات" colors={colors} />
          <Divider colors={colors} />
          <Bullet text="التصحيح: تحديث معلومات ملفك في أي وقت" colors={colors} />
          <Divider colors={colors} />
          <Bullet text="عدم الملاحقة: لن نستخدم موقعك دون إذنك" colors={colors} />
        </GroupCard>

        {/* 6. أمان البيانات */}
        <SectionLabel colors={colors}>6. أمان البيانات</SectionLabel>
        <GroupCard colors={colors}>
          <BodyText text="نحن نستخدم تشفير HTTPS وأفضل الممارسات الأمنية لحماية بيانات المستخدمين. يتم تخزين كلمات المرور بشكل آمن." colors={colors} />
        </GroupCard>

        {/* 7. حماية الأطفال */}
        <SectionLabel colors={colors}>7. حماية الأطفال</SectionLabel>
        <GroupCard colors={colors}>
          <BodyText text="لا ينطبق تطبيق دلني على الأشخاص الذين تقل أعمارهم عن 13 سنة. نحن لا نجمع بيانات شخصية من الأطفال." colors={colors} />
        </GroupCard>

        {/* 8. الإشعارات */}
        <SectionLabel colors={colors}>8. الإشعارات</SectionLabel>
        <GroupCard colors={colors}>
          <Bullet text="قرارات البلاغات: قبول أو رفض بلاغك" colors={colors} />
          <Divider colors={colors} />
          <Bullet text="الإشعارات الإدارية المهمة" colors={colors} />
          <Divider colors={colors} />
          <Bullet text="التحديثات والميزات الجديدة" colors={colors} />
        </GroupCard>

        {/* 9. الروابط الخارجية */}
        <SectionLabel colors={colors}>9. الروابط الخارجية</SectionLabel>
        <GroupCard colors={colors}>
          <BodyText text="قد يحتوي التطبيق على روابط خارجية. نحن غير مسؤولين عن سياسات الخصوصية لتلك المواقع." colors={colors} />
        </GroupCard>

        {/* 10. تغييرات على السياسة */}
        <SectionLabel colors={colors}>10. تغييرات على السياسة</SectionLabel>
        <GroupCard colors={colors}>
          <BodyText text="قد نحدّث هذه السياسة من وقت لآخر. سيتم إخطارك بأي تغييرات مهمة." colors={colors} />
        </GroupCard>

        {/* 11. التواصل معنا */}
        <SectionLabel colors={colors}>11. التواصل معنا</SectionLabel>
        <GroupCard colors={colors}>
          <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
            <Text style={{ textAlign: 'right', fontSize: 13, fontFamily: 'Cairo-Bold', color: colors.textSecondary, marginBottom: 4 }}>
              privacy@delni.ly
            </Text>
            <Text style={{ textAlign: 'right', fontSize: 13, fontFamily: 'Cairo-Regular', color: colors.textSecondary }}>
              https://delni.ly
            </Text>
          </View>
        </GroupCard>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
