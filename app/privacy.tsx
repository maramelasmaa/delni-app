import { ScrollView, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
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

export default function PrivacyScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48, paddingTop: 16 }}>
        {/* Title */}
        <Text style={{ textAlign: 'right', fontSize: 18, fontFamily: 'Cairo-Bold', color: colors.textPrimary, marginBottom: 4 }}>
          سياسة الخصوصية
        </Text>
        <Text style={{ textAlign: 'right', fontSize: 12, fontFamily: 'Cairo-Regular', color: colors.textMuted, marginBottom: 24 }}>
          آخر تحديث: يونيو 2026
        </Text>

        {/* Intro */}
        <Text style={{ textAlign: 'right', fontSize: 14, lineHeight: 22, color: colors.textSecondary, fontFamily: 'Cairo-Regular', marginBottom: 24 }}>
          تطبيق دلني يحترم خصوصيتك ويلتزم بحماية بيانات المستخدمين وفقاً لأعلى معايير الأمان والخصوصية. تصف هذه السياسة أنواع البيانات التي نجمعها، وكيفية استخدامنا لها، وحقوقك فيما يتعلق ببيانات الحساب الشخصية.
        </Text>

        {/* 1. أنواع البيانات المجمعة */}
        <SectionLabel colors={colors}>1. أنواع البيانات المجمعة</SectionLabel>
        <GroupCard colors={colors}>
          <Bullet text="بيانات الحساب: البريد الإلكتروني وكلمة المرور والاسم الكامل ورقم الهاتف (اختياري)." colors={colors} />
          <Divider colors={colors} />
          <Bullet text="بيانات الموقع: اختيار المدينة يدويًا لتصفية البحث عن مقدمي الخدمات المحليين. يمكن استخدام GPS إذا وافقت على الإذن." colors={colors} />
          <Divider colors={colors} />
          <Bullet text="محتوى المستخدم: التقييمات والتعليقات والمراجعات التي تكتبها عن مقدمي الخدمات." colors={colors} />
          <Divider colors={colors} />
          <Bullet text="معرّفات الجهاز: رمز الإشعارات (push token) لإرسال الإشعارات والتنبيهات عبر الهاتف." colors={colors} />
          <Divider colors={colors} />
          <Bullet text="سجل الأنشطة: الفئات والمقدمون الذين بحثت عنهم وعرضت ملفاتهم الشخصية والمفضلات المحفوظة." colors={colors} />
          <Divider colors={colors} />
          <Bullet text="بيانات الجهاز: نوع النظام والإصدار والمعرّف الفريد للجهاز (UUID) للأغراض التشخيصية." colors={colors} />
          <Divider colors={colors} />
          <Bullet text="سجلات الأخطاء: معلومات التعطل والأخطاء لتحسين استقرار التطبيق وأداؤه." colors={colors} />
        </GroupCard>

        {/* 2. أسباب معالجة البيانات */}
        <SectionLabel colors={colors}>2. أسباب معالجة البيانات</SectionLabel>
        <GroupCard colors={colors}>
          <Bullet text="إنشاء وإدارة الحسابات: المصادقة والتحقق من الهوية وتمكين استعادة كلمة المرور المفقودة." colors={colors} />
          <Divider colors={colors} />
          <Bullet text="توفير الخدمات: البحث والتصفية والعرض والاتصال بمقدمي الخدمات والتنقل داخل التطبيق." colors={colors} />
          <Divider colors={colors} />
          <Bullet text="الإشعارات والاتصالات: إرسال إشعارات بشأن قرارات البلاغات وتحديثات الحساب والإشعارات الإدارية." colors={colors} />
          <Divider colors={colors} />
          <Bullet text="تحسين الخدمة: تحليل نمط الاستخدام وسلوك المستخدم لتحسين ميزات التطبيق والبحث والتوصيات." colors={colors} />
          <Divider colors={colors} />
          <Bullet text="الأمان والحماية: منع الاحتيال والاستخدام المسيء والبلاغات والمحتوى غير المناسب." colors={colors} />
          <Divider colors={colors} />
          <Bullet text="الالتزام القانوني: الامتثال للقوانين والأنظمة الليبية والدولية القابلة للتطبيق." colors={colors} />
        </GroupCard>

        {/* 3. مع من نشارك البيانات */}
        <SectionLabel colors={colors}>3. مع من نشارك البيانات</SectionLabel>
        <GroupCard colors={colors}>
          <Bullet text="مقدمو الخدمات: لا يتم الكشف عن هويتك تلقائياً. عند تواصلك المباشر (WhatsApp أو الهاتف)، يمكن لمقدم الخدمة رؤية رقم الهاتف الذي توفره." colors={colors} />
          <Divider colors={colors} />
          <Bullet text="فريق دلني: الموظفون والمسؤولون قد يراجعون البلاغات والمحتوى المخالف لسياسة الاستخدام." colors={colors} />
          <Divider colors={colors} />
          <Bullet text="الإجراءات القانونية: قد نفصح عن البيانات إذا أُلزمنا بأمر قضائي أو متطلب حكومي رسمي." colors={colors} />
          <Divider colors={colors} />
          <Bullet text="عدم البيع: لا نبيع أو نؤجر أو نتاجر ببيانات المستخدمين الشخصية لأي طرف ثالث مقابل مكسب مالي." colors={colors} />
        </GroupCard>

        {/* 4. مدة الاحتفاظ بالبيانات */}
        <SectionLabel colors={colors}>4. مدة الاحتفاظ بالبيانات</SectionLabel>
        <GroupCard colors={colors}>
          <Bullet text="بيانات الحساب: نحتفظ بها طالما الحساب نشط. عند الحذف، تُحذف جميع البيانات الشخصية خلال 30 يوماً." colors={colors} />
          <Divider colors={colors} />
          <Bullet text="التقييمات والتعليقات: تُحفظ بشكل دائم (بدون ربط بهويتك بعد حذف الحساب) لأنها جزء من تاريخ الخدمة العام." colors={colors} />
          <Divider colors={colors} />
          <Bullet text="سجل البحث والأنشطة: يُحذف تلقائياً بعد 90 يوم من آخر نشاط." colors={colors} />
          <Divider colors={colors} />
          <Bullet text="رموز الإشعارات: تُحذف عند إزالة التطبيق أو عند إلغاء الإذن من إعدادات الجهاز." colors={colors} />
          <Divider colors={colors} />
          <Bullet text="سجلات البلاغات: نحتفظ بها سنة واحدة على الأقل لأغراض التدقيق والامتثال." colors={colors} />
        </GroupCard>

        {/* 5. حقوقك */}
        <SectionLabel colors={colors}>5. حقوقك</SectionLabel>
        <GroupCard colors={colors}>
          <Bullet text="الوصول: يحق لك طلب نسخة من جميع البيانات الشخصية المرتبطة بحسابك بصيغة قابلة للقراءة." colors={colors} />
          <Divider colors={colors} />
          <Bullet text="الحذف: يمكنك حذف حسابك وجميع بيانات الملف الشخصي من قسم الحساب > حذف الحساب في أي وقت." colors={colors} />
          <Divider colors={colors} />
          <Bullet text="تصحيح البيانات: يمكنك تحديث اسمك وبريدك الإلكتروني ورقم هاتفك ومدينتك من إعدادات الحساب." colors={colors} />
          <Divider colors={colors} />
          <Bullet text="اعتراض المعالجة: يمكنك رفض الإشعارات الإدارية والبحثية (لن تؤثر على الإشعارات الحرجة)." colors={colors} />
          <Divider colors={colors} />
          <Bullet text="عدم تتبع الموقع: لن نستخدم GPS الخاص بك دون إذن صريح وواضح منك أولاً." colors={colors} />
        </GroupCard>

        {/* 6. أمان البيانات */}
        <SectionLabel colors={colors}>6. أمان البيانات</SectionLabel>
        <GroupCard colors={colors}>
          <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
            <Text style={{ textAlign: 'right', fontSize: 14, lineHeight: 22, color: colors.textSecondary, fontFamily: 'Cairo-Regular' }}>
              نستخدم تشفير TLS/SSL (HTTPS) لحماية البيانات أثناء النقل بين جهازك والخوادم. كلمات المرور تُخزن في شكل مجزأ (hashed) ولا يمكننا قراءتها. جميع الاتصالات بـ delni.ly تحمل شهادة SSL صحيحة.
            </Text>
          </View>
        </GroupCard>

        {/* 7. حماية الأطفال */}
        <SectionLabel colors={colors}>7. حماية الأطفال</SectionLabel>
        <GroupCard colors={colors}>
          <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
            <Text style={{ textAlign: 'right', fontSize: 14, lineHeight: 22, color: colors.textSecondary, fontFamily: 'Cairo-Regular' }}>
              تطبيق دلني موجه للبالغين فقط (+13 سنة). لا نقبل عن قصد تسجيل أو معالجة بيانات من قُصّر. إذا اكتشفنا حساب نشطه قاصر، سنحذفه فوراً وجميع بيانات المستخدم المرتبطة به.
            </Text>
          </View>
        </GroupCard>

        {/* 8. الإشعارات والاتصالات */}
        <SectionLabel colors={colors}>8. الإشعارات والاتصالات</SectionLabel>
        <GroupCard colors={colors}>
          <Bullet text="إشعارات قرار البلاغ: إذا أبلغت عن محتوى أو مستخدم، ستتلقى إشعار بقرار الفريق (قبول أو رفض)." colors={colors} />
          <Divider colors={colors} />
          <Bullet text="إشعارات الحساب: تحديثات الأمان وإعادة تعيين كلمة المرور والتغييرات المهمة." colors={colors} />
          <Divider colors={colors} />
          <Bullet text="الرسائل الإدارية: التحديثات المتعلقة بالخدمة والسياسات والأخبار الهامة." colors={colors} />
          <Bullet text="يمكنك تعطيل معظم الإشعارات من إعدادات جهازك، لكن الإشعارات الأمنية ستبقى نشطة." colors={colors} />
        </GroupCard>

        {/* 9. الروابط الخارجية والخدمات */}
        <SectionLabel colors={colors}>9. الروابط الخارجية والخدمات</SectionLabel>
        <GroupCard colors={colors}>
          <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
            <Text style={{ textAlign: 'right', fontSize: 14, lineHeight: 22, color: colors.textSecondary, fontFamily: 'Cairo-Regular' }}>
              التطبيق قد يحتوي على روابط إلى WhatsApp و Facebook و Google Maps والمواقع الخارجية الأخرى. عند الضغط على هذه الروابط، ستغادر تطبيق دلني وتخضع لسياسات الخصوصية الخاصة بتلك المواقع. نحن غير مسؤولين عن ممارسات الخصوصية لديهم.
            </Text>
          </View>
        </GroupCard>

        {/* 10. التغييرات على هذه السياسة */}
        <SectionLabel colors={colors}>10. التغييرات على السياسة</SectionLabel>
        <GroupCard colors={colors}>
          <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
            <Text style={{ textAlign: 'right', fontSize: 14, lineHeight: 22, color: colors.textSecondary, fontFamily: 'Cairo-Regular' }}>
              قد نحدّث هذه السياسة في أي وقت لعكس التغييرات في ممارسات الخصوصية أو التطبيق أو القوانين. إذا أجرينا تغييرات جوهرية، سيتم إخطارك عبر البريد الإلكتروني أو إشعار بارز داخل التطبيق قبل الدخول حيز التنفيذ.
            </Text>
          </View>
        </GroupCard>

        {/* 11. التواصل بشأن الخصوصية */}
        <SectionLabel colors={colors}>11. التواصل بشأن الخصوصية</SectionLabel>
        <GroupCard colors={colors}>
          <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
            <Text style={{ textAlign: 'right', fontSize: 14, lineHeight: 22, color: colors.textSecondary, fontFamily: 'Cairo-Regular', marginBottom: 12 }}>
              إذا كان لديك أسئلة أو مخاوف أو طلبات تتعلق ببيانات الخصوصية الشخصية، يرجى الاتصال بفريق الدعم والخصوصية لدينا.
            </Text>
            <Pressable
              onPress={() => router.push('/contact')}
              style={({ pressed }) => ({
                flexDirection: 'row-reverse',
                alignItems: 'center',
                paddingHorizontal: 0,
                paddingVertical: 4,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ textAlign: 'right', fontSize: 15, fontFamily: 'Cairo-Bold', color: colors.primary }}>
                اتصل بنا الآن
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.primary} style={{ marginRight: 8 }} />
            </Pressable>
          </View>
        </GroupCard>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
