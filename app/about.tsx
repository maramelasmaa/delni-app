import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { InfoCard } from '../components/ui/InfoCard';
import { useTheme } from '../src/hooks/useTheme';
import { rtlRow } from '../src/utils/rtl';

export default function AboutScreen() {
  const { colors } = useTheme();
  const [aboutExpanded, setAboutExpanded] = useState(false);

  const body = { textAlign: 'right' as const, fontSize: 14, lineHeight: 28, color: colors.textSecondary, fontFamily: 'Cairo-Regular', writingDirection: 'rtl' as const };
  const aboutText = 'دلني منصة دليل إلكتروني تهدف إلى مساعدة المستخدمين في العثور على مقدمي الخدمات داخل ليبيا والتواصل معهم. ولا تقوم المنصة بتقديم الخدمات بنفسها، وإنما توفر وسيلة لعرض معلومات مقدمي الخدمات وتسهيل الوصول إليهم. نعمل على تنظيم البحث حسب المدن والتخصصات والتقييمات حتى يصل المستخدم إلى الخيارات المناسبة بسرعة ووضوح.';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
        {/* Logo Container */}
        <View style={{ alignItems: 'center', paddingVertical: 32 }}>
          <View style={{ height: 80, width: 80, alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: colors.primarySoft, marginBottom: 16 }}>
            <Ionicons name="compass" size={44} color={colors.primary} />
          </View>
          <View style={{ ...rtlRow(), alignItems: 'center' }}>
            <Text style={{ fontSize: 30, fontFamily: 'Cairo-Black', color: colors.textPrimary }}>دلني</Text>
            <Text style={{ fontSize: 30, fontFamily: 'Cairo-Black', color: colors.gold }}>.</Text>
          </View>
          <Text style={{ marginTop: 6, fontSize: 12, fontFamily: 'Cairo-SemiBold', color: colors.textMuted }}>
            المنصة الأولى لمقدمي الخدمات في ليبيا
          </Text>
        </View>

        {/* About Card */}
        <InfoCard icon="information-circle" title="من نحن" colors={colors}>
          <Text numberOfLines={aboutExpanded ? undefined : 3} style={body}>
            {aboutText}
          </Text>
          <Pressable
            onPress={() => setAboutExpanded((value) => !value)}
            accessibilityRole="button"
            accessibilityLabel={aboutExpanded ? 'عرض نص أقل' : 'عرض النص بالكامل'}
            style={({ pressed }) => ({
              marginTop: 10,
              alignSelf: 'flex-end',
              ...rtlRow(),
              alignItems: 'center',
              gap: 4,
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <Text style={{ fontFamily: 'Cairo-Bold', fontSize: 13, color: colors.primary }}>
              {aboutExpanded ? 'عرض أقل' : 'عرض المزيد'}
            </Text>
            <Ionicons name={aboutExpanded ? 'chevron-up' : 'chevron-down'} size={14} color={colors.primary} />
          </Pressable>
        </InfoCard>

        {/* App Info Card */}
        <InfoCard icon="sparkles" title="هدف المنصة" colors={colors}>
          <Text style={[body, { marginBottom: 16 }]}>
            نسعى لتسهيل الوصول للمهنيين ومقدمي الخدمات في مختلف التخصصات والمدن الليبية، وبناء بيئة تواصل موثوقة ومحترمة.
          </Text>

          <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16 }}>
            <View style={{ ...rtlRow(), alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} style={{ marginLeft: 8 }} />
              <Text style={{ textAlign: 'right', fontSize: 14, fontFamily: 'Cairo-Bold', color: colors.textPrimary }}>ابحث وتواصل بسهولة</Text>
            </View>
            <View style={{ ...rtlRow(), alignItems: 'center' }}>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} style={{ marginLeft: 8 }} />
              <Text style={{ textAlign: 'right', fontSize: 14, fontFamily: 'Cairo-Bold', color: colors.textPrimary }}>تقييمات موثوقة وحقيقية</Text>
            </View>
          </View>
        </InfoCard>

        <Text style={{ marginTop: 32, textAlign: 'center', fontSize: 12, color: colors.textDisabled, fontFamily: 'Cairo-Regular' }}>دلني v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
