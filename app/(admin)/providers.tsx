import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import {
  FlatList,
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
import { useAdminProviders } from '../../src/hooks/useAdminManagement';
import { useTheme } from '../../src/hooks/useTheme';
import { getProviderLogo } from '../../src/utils/imageFallback';

export default function AdminProvidersScreen() {
  const { colors } = useTheme();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');

  const { data, isLoading, isError, error, refetch, isRefetching } = useAdminProviders({
    search: query || undefined,
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.headerDot, { color: colors.gold }]}>.</Text>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>المزودون</Text>
      </View>

      <View style={[styles.searchBox, { backgroundColor: colors.surfaceAlt }]}>
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
          data={data.providers}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 20, gap: 12, paddingTop: 12 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} colors={[colors.primary]} />}
          ListEmptyComponent={<EmptyState icon="briefcase-outline" title="لا توجد نتائج" message="جرب بحثاً مختلفاً." />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push({ pathname: '/provider/[slug]', params: { slug: item.slug } })}
              style={({ pressed }) => [styles.card, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.85 : 1 }]}
            >
              <Image source={{ uri: getProviderLogo(item.logo_url, item.id) }} style={styles.logo} contentFit="cover" />
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text numberOfLines={1} style={[styles.name, { color: colors.textPrimary }]}>{item.name}</Text>
                <Text numberOfLines={1} style={[styles.meta, { color: colors.textMuted }]}>
                  {item.category?.name ?? 'بدون فئة'} · {item.city?.name ?? 'بدون مدينة'}
                </Text>
                <Text style={[styles.meta, { color: colors.textMuted }]}>
                  ★ {item.rating_average?.toFixed?.(1) ?? item.rating_average} · {item.reviews_count} تقييم
                </Text>
              </View>
              <Ionicons name="chevron-back" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12, flexDirection: 'row-reverse', alignItems: 'center' },
  headerTitle: { fontSize: 28, fontFamily: 'Cairo-Black' },
  headerDot: { fontSize: 28, fontFamily: 'Cairo-Black' },
  searchBox: { marginHorizontal: 20, minHeight: 46, borderRadius: 14, flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 14, gap: 8 },
  searchInput: { flex: 1, fontSize: 13, fontFamily: 'Cairo-SemiBold', textAlign: 'right', writingDirection: 'rtl', paddingVertical: 10 },
  card: { borderRadius: 18, borderWidth: 1, padding: 12, flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  logo: { width: 52, height: 52, borderRadius: 16 },
  name: { fontSize: 15, fontFamily: 'Cairo-Bold', writingDirection: 'rtl' },
  meta: { marginTop: 1, fontSize: 12, fontFamily: 'Cairo-SemiBold', writingDirection: 'rtl' },
});
