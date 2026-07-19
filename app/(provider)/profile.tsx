import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ErrorView } from '../../components/ui/ErrorView';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useProviderDashboard } from '../../src/hooks/useProviderDashboard';
import { useTheme } from '../../src/hooks/useTheme';
import type { ThemeColors } from '../../src/theme/tokens';
import { getProviderLogo } from '../../src/utils/imageFallback';

type ProviderRoute = '/(provider)/profile-edit' | '/(provider)/portfolio' | '/(provider)/credentials' | '/(provider)/reviews';

function InfoLine({ icon, label, value, colors }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; colors: ThemeColors }) {
  return (
    <View style={[styles.infoLine, { borderColor: colors.border }]}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <View style={{ flex: 1, alignItems: 'flex-end' }}>
        <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{label}</Text>
        <Text numberOfLines={2} style={[styles.infoValue, { color: colors.textPrimary }]}>{value}</Text>
      </View>
    </View>
  );
}

function ManageRow({ icon, title, subtitle, route, colors }: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string; route: ProviderRoute; colors: ThemeColors }) {
  return (
    <Pressable onPress={() => router.push(route as never)} style={({ pressed }) => [styles.managePressable, { opacity: pressed ? 0.86 : 1 }]}>
      <View style={[styles.manageRow, { borderColor: colors.border }]}>
        <Ionicons name="chevron-back" size={16} color={colors.textMuted} />
        <View style={styles.manageText}>
          <Text numberOfLines={1} style={[styles.manageTitle, { color: colors.textPrimary }]}>{title}</Text>
          <Text numberOfLines={2} style={[styles.manageSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
        </View>
        <View style={[styles.manageIcon, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <Ionicons name={icon} size={21} color={colors.primary} />
        </View>
      </View>
    </Pressable>
  );
}

export default function ProviderProfileScreen() {
  const { colors } = useTheme();
  const { data, isLoading, isError, error, refetch, isRefetching } = useProviderDashboard();

  if (isLoading) return <LoadingSpinner />;
  if (isError || !data) return <ErrorView error={error} onRetry={refetch} />;

  const profile = data.profile;
  const stats = data.stats;
  const logo = getProviderLogo(profile.logo_url, profile.id);
  const subcategoryNames = profile.subcategories?.map((item) => item.name).join('، ') || 'لم تحدد بعد';
  const remoteText = profile.offers_remote_work ? 'متاح عن بعد' : 'غير مفعل';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} colors={[colors.primary]} />}
        contentContainerStyle={{ paddingBottom: 116 }}
      >
        <View style={styles.header}>
          <Text style={[styles.headerDot, { color: colors.gold }]}>.</Text>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>ملفي التجاري</Text>
        </View>

        <View style={[styles.identity, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Image source={{ uri: logo }} style={styles.logo} contentFit="cover" />
          <Text numberOfLines={2} style={[styles.name, { color: colors.textPrimary }]}>{profile.name}</Text>
          <Text numberOfLines={1} style={[styles.meta, { color: colors.textMuted }]}>{profile.category?.name || 'بدون فئة'} · {profile.city?.name || 'بدون مدينة'}</Text>
          <View style={[styles.progressShell, { backgroundColor: colors.surfaceAlt }]}>
            <View style={[styles.progressFill, { width: `${stats.completion_percentage}%`, backgroundColor: colors.gold }]} />
          </View>
          <Text style={[styles.progressText, { color: colors.textMuted }]}>اكتمال الملف {stats.completion_percentage}%</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <InfoLine icon="briefcase-outline" label="الفئة" value={profile.category?.name || 'لم تحدد بعد'} colors={colors} />
          <InfoLine icon="pricetags-outline" label="التخصصات" value={subcategoryNames} colors={colors} />
          <InfoLine icon="location-outline" label="المدينة" value={profile.city?.name || 'لم تحدد بعد'} colors={colors} />
          <InfoLine icon="call-outline" label="رقم الهاتف" value={profile.phone || 'لم يضف بعد'} colors={colors} />
          <InfoLine icon="logo-whatsapp" label="واتساب" value={profile.whatsapp_url ? 'مفعل' : 'لم يضف بعد'} colors={colors} />
          <InfoLine icon="laptop-outline" label="الخدمة عن بعد" value={remoteText} colors={colors} />
        </View>

        <View style={[styles.bioCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>الوصف</Text>
          <Text style={[styles.bio, { color: colors.textMuted }]}>{profile.description || 'أضف وصفا واضحا لخدماتك حتى يعرف العملاء لماذا يختارونك.'}</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionKicker, { color: colors.gold }]}>إدارة الملف</Text>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>لوحة التحكم</Text>
        </View>

        <View style={[styles.manageCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ManageRow icon="create-outline" title="تعديل بيانات الملف" subtitle="حدث الاسم والوصف ومعلومات التواصل" route="/(provider)/profile-edit" colors={colors} />
          <ManageRow icon="images-outline" title="الأعمال والمعرض" subtitle="رتب أعمالك وصور المشاريع" route="/(provider)/portfolio" colors={colors} />
          <ManageRow icon="ribbon-outline" title="الشهادات والخبرات" subtitle="أضف شهاداتك واعتماداتك" route="/(provider)/credentials" colors={colors} />
          <ManageRow icon="chatbubbles-outline" title="التقييمات" subtitle="راجع تقييمات العملاء" route="/(provider)/reviews" colors={colors} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12, flexDirection: 'row-reverse', alignItems: 'center' },
  headerTitle: { fontSize: 28, fontFamily: 'Cairo-Black', textAlign: 'right', writingDirection: 'rtl' },
  headerDot: { fontSize: 28, fontFamily: 'Cairo-Black' },
  identity: { marginHorizontal: 20, borderRadius: 20, borderWidth: 1, padding: 18, alignItems: 'center' },
  logo: { width: 86, height: 86, borderRadius: 24 },
  name: { marginTop: 12, fontSize: 21, lineHeight: 30, fontFamily: 'Cairo-Black', textAlign: 'center', writingDirection: 'rtl' },
  meta: { marginTop: 2, fontSize: 13, fontFamily: 'Cairo-SemiBold', textAlign: 'center', writingDirection: 'rtl' },
  progressShell: { width: '100%', height: 9, borderRadius: 999, marginTop: 18, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },
  progressText: { marginTop: 7, fontSize: 12, fontFamily: 'Cairo-Bold', textAlign: 'center', writingDirection: 'rtl' },
  card: { marginHorizontal: 20, marginTop: 16, borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  infoLine: { minHeight: 64, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  infoLabel: { fontSize: 11, fontFamily: 'Cairo-SemiBold', textAlign: 'right', writingDirection: 'rtl' },
  infoValue: { marginTop: 1, fontSize: 14, fontFamily: 'Cairo-Bold', textAlign: 'right', writingDirection: 'rtl' },
  bioCard: { marginHorizontal: 20, marginTop: 16, borderRadius: 20, borderWidth: 1, padding: 16 },
  sectionHeader: { marginTop: 26, marginBottom: 12, paddingHorizontal: 20, alignItems: 'flex-end' },
  sectionKicker: { fontSize: 12, fontFamily: 'Cairo-Bold', textAlign: 'right', writingDirection: 'rtl' },
  sectionTitle: { fontSize: 18, fontFamily: 'Cairo-Black', textAlign: 'right', writingDirection: 'rtl' },
  bio: { marginTop: 6, fontSize: 13, lineHeight: 23, fontFamily: 'Cairo-Regular', textAlign: 'right', writingDirection: 'rtl' },
  manageCard: { marginHorizontal: 20, borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  managePressable: { minHeight: 76 },
  manageRow: { minHeight: 76, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  manageText: { flex: 1, alignItems: 'flex-end' },
  manageIcon: { width: 46, height: 46, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  manageTitle: { fontSize: 15, fontFamily: 'Cairo-Bold', textAlign: 'right', writingDirection: 'rtl' },
  manageSubtitle: { marginTop: 2, fontSize: 12, lineHeight: 18, fontFamily: 'Cairo-Regular', textAlign: 'right', writingDirection: 'rtl' },
});
