import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/hooks/useTheme';

export default function AboutScreen() {
  const { colors } = useTheme();

  const card = {
    marginBottom: 16,
    borderRadius: 24,
    backgroundColor: colors.surface,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 1,
  } as const;

  const cardTitleRow = { flexDirection: 'row-reverse' as const, alignItems: 'center' as const, marginBottom: 12 };
  const cardIcon = { height: 32, width: 32, alignItems: 'center' as const, justifyContent: 'center' as const, borderRadius: 999, backgroundColor: colors.primarySoft, marginLeft: 8 };
  const cardTitle = { textAlign: 'right' as const, fontSize: 16, fontFamily: 'Cairo-Bold', color: colors.textPrimary };
  const body = { textAlign: 'right' as const, fontSize: 14, lineHeight: 28, color: colors.textSecondary, fontFamily: 'Cairo-Regular', writingDirection: 'rtl' as const };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
        {/* Logo Container */}
        <View style={{ alignItems: 'center', paddingVertical: 32 }}>
          <View style={{ height: 80, width: 80, alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: colors.primarySoft, marginBottom: 16 }}>
            <Ionicons name="compass" size={44} color={colors.primary} />
          </View>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
            <Text style={{ fontSize: 30, fontFamily: 'Cairo-Black', color: colors.textPrimary }}>دلني</Text>
            <Text style={{ fontSize: 30, fontFamily: 'Cairo-Black', color: colors.gold }}>.</Text>
          </View>
          <Text style={{ marginTop: 6, fontSize: 12, fontFamily: 'Cairo-SemiBold', color: colors.textMuted }}>
            المنصة الأولى لمزودي الخدمات في ليبيا
          </Text>
        </View>

        {/* About Card */}
        <View style={card}>
          <View style={cardTitleRow}>
            <View style={cardIcon}>
              <Ionicons name="information-circle" size={18} color={colors.primary} />
            </View>
            <Text style={cardTitle}>من نحن</Text>
          </View>
          <Text style={body}>
            دلني منصة دليل إلكتروني تهدف إلى مساعدة المستخدمين في العثور على مقدمي الخدمات داخل ليبيا والتواصل معهم. ولا تقوم المنصة بتقديم الخدمات بنفسها، وإنما توفر وسيلة لعرض معلومات مقدمي الخدمات وتسهيل الوصول إليهم.
          </Text>
        </View>

        {/* App Info Card */}
        <View style={card}>
          <View style={cardTitleRow}>
            <View style={cardIcon}>
              <Ionicons name="sparkles" size={18} color={colors.primary} />
            </View>
            <Text style={cardTitle}>هدف المنصة</Text>
          </View>
          <Text style={[body, { marginBottom: 16 }]}>
            نسعى لتسهيل الوصول للمهنيين ومزودي الخدمات في مختلف التخصصات والمدن الليبية، وبناء بيئة تواصل موثوقة ومحترمة.
          </Text>

          <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16 }}>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} style={{ marginLeft: 8 }} />
              <Text style={{ textAlign: 'right', fontSize: 14, fontFamily: 'Cairo-Bold', color: colors.textPrimary }}>سهولة البحث والتواصل</Text>
            </View>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} style={{ marginLeft: 8 }} />
              <Text style={{ textAlign: 'right', fontSize: 14, fontFamily: 'Cairo-Bold', color: colors.textPrimary }}>تقييمات حقيقية وشفافة</Text>
            </View>
          </View>
        </View>

        <Text style={{ marginTop: 32, textAlign: 'center', fontSize: 12, color: colors.textDisabled, fontFamily: 'Cairo-Regular' }}>دلني v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
