import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorView } from '../../components/ui/ErrorView';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { RTLAlert, useRTLAlert } from '../../components/ui/RTLAlert';
import {
  useAdminProviderReports,
  useAdminProviders,
  useResolveProviderReport,
} from '../../src/hooks/useAdminManagement';
import { useTheme } from '../../src/hooks/useTheme';
import { parseApiError } from '../../src/lib/error-parser';
import type { Provider } from '../../src/types';
import { getProviderLogo } from '../../src/utils/imageFallback';

export default function AdminProvidersScreen() {
  const { colors } = useTheme();
  const { alert, showAlert, hideAlert } = useRTLAlert();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [reportsProvider, setReportsProvider] = useState<Provider | null>(null);

  const {
    data,
    providers,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAdminProviders({
    search: query || undefined,
  });

  const reportsOpen = reportsProvider !== null;
  const reportsQuery = useAdminProviderReports(reportsProvider?.id, reportsOpen);
  const resolveReport = useResolveProviderReport();

  const closeReports = () => setReportsProvider(null);

  const decideReport = (reportId: number, decision: 'resolve' | 'dismiss') => {
    if (!reportsProvider) return;
    resolveReport.mutate(
      { userId: reportsProvider.id, reportId, decision },
      { onError: (err) => showAlert('تعذر التنفيذ', parseApiError(err).message, [{ text: 'حسنا' }]) },
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.push('/(admin)/provider-form')}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="add" size={20} color={colors.textOnPrimary} />
        </Pressable>
        <View style={styles.titleWrap}>
          <View style={styles.titleRow}>
            <Text style={[styles.headerDot, { color: colors.gold }]}>.</Text>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>المزودون</Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>إدارة ملفات مقدمي الخدمة</Text>
        </View>
      </View>

      <View style={[styles.searchBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => setQuery(search.trim())}
          returnKeyType="search"
          placeholder="ابحث باسم النشاط أو المالك"
          placeholderTextColor={colors.textMuted}
          style={[styles.searchInput, { color: colors.textPrimary }]}
        />
        {query ? (
          <Pressable onPress={() => { setSearch(''); setQuery(''); }} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : isError || !data ? (
        <ErrorView error={error} onRetry={refetch} />
      ) : (
        <FlatList
          data={providers}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 20, gap: 12, paddingTop: 12 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} colors={[colors.primary]} />}
          ListEmptyComponent={<EmptyState icon="briefcase-outline" title="لا توجد نتائج" message="جرب بحثا مختلفا أو أضف مزودا جديدا." />}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.4}
          ListFooterComponent={isFetchingNextPage ? (
            <View style={{ paddingVertical: 16 }}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Image source={{ uri: getProviderLogo(item.logo_url, item.id) }} style={styles.logo} contentFit="cover" />
              <View style={styles.cardText}>
                <Text numberOfLines={1} style={[styles.name, { color: colors.textPrimary }]}>{item.name}</Text>
                <Text numberOfLines={1} style={[styles.meta, { color: colors.textMuted }]}>
                  {item.category?.name ?? 'بدون فئة'} · {item.city?.name ?? 'بدون مدينة'}
                </Text>
                <Text style={[styles.meta, { color: colors.textMuted }]}>
                  ★ {item.rating_average?.toFixed?.(1) ?? item.rating_average} · {item.reviews_count} تقييم
                </Text>
              </View>
              <View style={styles.actions}>
                {item.open_reports_count ? (
                  <Pressable
                    onPress={() => setReportsProvider(item)}
                    style={({ pressed }) => [styles.iconAction, { backgroundColor: colors.errorSoft, opacity: pressed ? 0.75 : 1 }]}
                  >
                    <Ionicons name="flag" size={16} color={colors.error} />
                    <View style={[styles.reportBadge, { backgroundColor: colors.error }]}>
                      <Text style={styles.reportBadgeText}>{item.open_reports_count}</Text>
                    </View>
                  </Pressable>
                ) : null}
                <Pressable
                  onPress={() => router.push({ pathname: '/(admin)/provider-form', params: { id: String(item.id) } })}
                  style={({ pressed }) => [styles.iconAction, { backgroundColor: colors.surfaceAlt, opacity: pressed ? 0.75 : 1 }]}
                >
                  <Ionicons name="create-outline" size={18} color={colors.primary} />
                </Pressable>
                <Pressable
                  onPress={() => router.push({ pathname: '/provider/[slug]', params: { slug: item.slug } })}
                  style={({ pressed }) => [styles.iconAction, { backgroundColor: colors.surfaceAlt, opacity: pressed ? 0.75 : 1 }]}
                >
                  <Ionicons name="eye-outline" size={18} color={colors.textMuted} />
                </Pressable>
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={reportsOpen} animationType="slide" transparent onRequestClose={closeReports}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              بلاغات {reportsProvider?.name}
            </Text>

            {reportsQuery.isLoading ? (
              <LoadingSpinner />
            ) : reportsQuery.isError || !reportsQuery.data ? (
              <ErrorView error={reportsQuery.error} onRetry={reportsQuery.refetch} />
            ) : reportsQuery.data.length === 0 ? (
              <EmptyState icon="flag-outline" title="لا توجد بلاغات مفتوحة" message="" />
            ) : (
              <FlatList
                data={reportsQuery.data}
                keyExtractor={(report) => String(report.id)}
                style={{ maxHeight: 380 }}
                contentContainerStyle={{ gap: 10 }}
                renderItem={({ item: report }) => (
                  <View style={[styles.reportCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.reportReason, { color: colors.textPrimary }]}>{report.reason}</Text>
                    <Text style={[styles.reportMeta, { color: colors.textMuted }]}>{report.created_at}</Text>
                    <View style={styles.reportActions}>
                      <Pressable
                        onPress={() => decideReport(report.id, 'resolve')}
                        disabled={resolveReport.isPending}
                        style={[styles.reportActionBtn, { backgroundColor: colors.goldSoft }]}
                      >
                        <Text style={[styles.reportActionText, { color: colors.goldText }]}>معالجة</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => decideReport(report.id, 'dismiss')}
                        disabled={resolveReport.isPending}
                        style={[styles.reportActionBtn, { backgroundColor: colors.surfaceAlt }]}
                      >
                        <Text style={[styles.reportActionText, { color: colors.textPrimary }]}>تجاهل</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              />
            )}

            <Pressable onPress={closeReports} style={[styles.cancelBtn, { borderColor: colors.border, marginTop: 14 }]}>
              <Text style={[styles.cancelText, { color: colors.textMuted }]}>إغلاق</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <RTLAlert alert={alert} onDismiss={hideAlert} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleWrap: { alignItems: 'flex-end' },
  titleRow: { flexDirection: 'row-reverse', alignItems: 'center' },
  headerTitle: { fontSize: 26, fontFamily: 'Cairo-Black' },
  headerDot: { fontSize: 26, fontFamily: 'Cairo-Black' },
  headerSubtitle: { marginTop: 1, fontSize: 13, fontFamily: 'Cairo-SemiBold', textAlign: 'right', writingDirection: 'rtl' },
  addBtn: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  searchBox: { marginHorizontal: 20, minHeight: 46, borderRadius: 14, borderWidth: 1, flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 14, gap: 8 },
  searchInput: { flex: 1, fontSize: 13, fontFamily: 'Cairo-SemiBold', textAlign: 'right', writingDirection: 'rtl', paddingVertical: 10 },
  card: { borderRadius: 18, borderWidth: 1, padding: 12, flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  logo: { width: 52, height: 52, borderRadius: 16 },
  cardText: { flex: 1, alignItems: 'flex-end' },
  name: { fontSize: 15, fontFamily: 'Cairo-Bold', writingDirection: 'rtl' },
  meta: { marginTop: 1, fontSize: 12, fontFamily: 'Cairo-SemiBold', writingDirection: 'rtl' },
  actions: { gap: 8 },
  iconAction: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  reportBadge: { position: 'absolute', top: -4, left: -4, minWidth: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  reportBadgeText: { fontSize: 9, fontFamily: 'Cairo-Bold', color: '#fff' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet: { maxHeight: '80%', borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 1, padding: 20, paddingBottom: 34 },
  modalTitle: { fontSize: 18, fontFamily: 'Cairo-Black', textAlign: 'right', writingDirection: 'rtl', marginBottom: 14 },
  reportCard: { borderRadius: 16, borderWidth: 1, padding: 12, gap: 6, alignItems: 'flex-end' },
  reportReason: { fontSize: 13, fontFamily: 'Cairo-SemiBold', textAlign: 'right', writingDirection: 'rtl' },
  reportMeta: { fontSize: 11, fontFamily: 'Cairo-Regular', textAlign: 'right', writingDirection: 'rtl' },
  reportActions: { flexDirection: 'row-reverse', gap: 8, marginTop: 4 },
  reportActionBtn: { paddingHorizontal: 14, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  reportActionText: { fontSize: 12, fontFamily: 'Cairo-Bold' },
  cancelBtn: { minHeight: 48, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 14, fontFamily: 'Cairo-Bold' },
});
