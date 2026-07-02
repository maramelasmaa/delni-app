import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFavorites, useToggleFavorite } from '../../src/hooks/useApi';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/auth';
import { ProviderRowCard } from '../../components/provider/ProviderRowCard';
import { FavoriteAuthModal } from '../../components/ui/FavoriteAuthModal';
import { useFavoriteWithAuth } from '../../src/hooks/useFavoriteWithAuth';
import { usePrefetchImages } from '../../src/hooks/useImagePrefetch';
import type { ThemeColors } from '../../src/theme/tokens';
import type { Provider } from '../../src/types';
import { getProviderLogo } from '../../src/utils/imageFallback';

/** Shared empty/CTA card so the not-signed-in and empty states stay identical. */
function EmptyCard({
  colors,
  title,
  message,
  actionLabel,
  onAction,
}: {
  colors: ThemeColors;
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <View
      style={{
        marginHorizontal: 16,
        backgroundColor: colors.surface,
        borderRadius: 24,
        padding: 28,
        alignItems: 'center',
        marginTop: 8,
        borderWidth: 1,
        borderColor: colors.border,
        elevation: 2,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      }}
    >
      <View
        style={{
          width: 70,
          height: 70,
          borderRadius: 35,
          backgroundColor: colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Ionicons name="heart-outline" size={32} color={colors.primary} />
      </View>
      <Text style={{ fontSize: 16, color: colors.textPrimary, fontFamily: 'Cairo-Bold', textAlign: 'center', marginBottom: 8 }}>
        {title}
      </Text>
      <Text
        style={{
          fontSize: 13,
          color: colors.textMuted,
          fontFamily: 'Cairo-Regular',
          textAlign: 'center',
          paddingHorizontal: 16,
          lineHeight: 22,
          marginBottom: 24,
          writingDirection: 'rtl',
        }}
      >
        {message}
      </Text>
      <Pressable
        onPress={onAction}
        style={({ pressed }) => ({
          width: '100%',
          paddingVertical: 14,
          borderRadius: 16,
          backgroundColor: colors.primary,
          alignItems: 'center',
          transform: [{ scale: pressed ? 0.97 : 1 }],
          opacity: pressed ? 0.9 : 1,
        })}
      >
        <Text style={{ color: colors.textOnPrimary, fontSize: 14, fontFamily: 'Cairo-Bold' }}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

export default function FavoritesScreen() {
  const { colors, isDark } = useTheme();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data, isLoading, isError, refetch } = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const { showAuthAlert, handleFavoritePress, handleConfirmLogin, handleDismiss } = useFavoriteWithAuth({
    redirectPath: '/(tabs)/favorites',
  });

  const providers: Provider[] = data?.data ?? [];

  usePrefetchImages(
    providers.slice(0, 8).map((provider) => getProviderLogo(provider.logo_url, provider.id)),
    { cachePolicy: 'memory-disk', limit: 8 },
  );

  const handleUnfavorite = useCallback(
    (slug: string) => {
      handleFavoritePress(() => {
        toggleFavorite.mutate({ slug, isFavorited: true });
      }, slug);
    },
    [handleFavoritePress, toggleFavorite],
  );

  const renderProviderItem = useCallback(
    ({ item: p }: { item: Provider }) => (
      <View style={{ marginHorizontal: 16, marginVertical: 0 }}>
        <ProviderRowCard provider={p} onFavoritePress={(slug) => handleUnfavorite(slug)} />
      </View>
    ),
    [handleUnfavorite],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <FlatList
        data={isAuthenticated ? providers : []}
        keyExtractor={(p) => `fav-${p.id}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 28, gap: 12 }}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={9}
        removeClippedSubviews
        ListHeaderComponent={
          <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 }}>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
              <Text style={{ fontSize: 28, fontFamily: 'Cairo-Black', color: colors.textPrimary }}>المفضلة</Text>
              <Text style={{ fontSize: 28, fontFamily: 'Cairo-Black', color: colors.gold }}>.</Text>
            </View>
            <Text
              style={{ textAlign: 'right', fontSize: 15, fontFamily: 'Cairo-SemiBold', color: colors.textMuted, marginTop: 4 }}
            >
              {isAuthenticated && providers.length > 0
                ? `تتابع ${providers.length} من مقدمي الخدمات`
                : 'مقدمي الخدمات المفضلين لديك'}
            </Text>
          </View>
        }
        ListEmptyComponent={() => {
          if (isLoading && isAuthenticated) {
            return (
              <View style={{ paddingVertical: 80, alignItems: 'center' }}>
                <Text style={{ color: colors.textMuted, fontFamily: 'Cairo-SemiBold', fontSize: 14 }}>
                  جاري التحميل...
                </Text>
              </View>
            );
          }
          if (isError && isAuthenticated) {
            return (
              <View
                style={{
                  marginHorizontal: 16,
                  backgroundColor: colors.surface,
                  borderRadius: 24,
                  padding: 24,
                  alignItems: 'center',
                  marginTop: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ color: colors.error, fontFamily: 'Cairo-SemiBold', fontSize: 14, marginBottom: 16 }}>
                  فشل تحميل المفضلة
                </Text>
                <Pressable
                  onPress={() => refetch()}
                  style={({ pressed }) => ({
                    backgroundColor: colors.primary,
                    paddingHorizontal: 24,
                    paddingVertical: 10,
                    borderRadius: 12,
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                    opacity: pressed ? 0.9 : 1,
                  })}
                >
                  <Text style={{ color: colors.textOnPrimary, fontFamily: 'Cairo-Bold', fontSize: 13 }}>إعادة المحاولة</Text>
                </Pressable>
              </View>
            );
          }

          if (!isAuthenticated) {
            return (
              <EmptyCard
                colors={colors}
                title="تسجيل الدخول مطلوب"
                message="حفظ مقدمي الخدمات المفضلين لديك للوصول إليهم بسهولة"
                actionLabel="تسجيل الدخول"
                onAction={() => router.push('/(auth)/login')}
              />
            );
          }

          return (
            <EmptyCard
              colors={colors}
              title="مفضلتك فارغة"
              message="ابدأ بحفظ مقدمي الخدمات المفضلين"
              actionLabel="اكتشف الخدمات"
              onAction={() => router.push('/(tabs)/')}
            />
          );
        }}
        renderItem={renderProviderItem}
      />

      {/* Favorite Auth Modal */}
      <FavoriteAuthModal
        visible={showAuthAlert}
        colors={colors}
        onConfirm={handleConfirmLogin}
        onDismiss={handleDismiss}
      />
    </SafeAreaView>
  );
}
