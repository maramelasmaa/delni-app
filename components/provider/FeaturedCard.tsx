import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { memo, useCallback } from 'react';
import { Pressable, Text, View, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../src/hooks/useTheme';
import { useToggleFavorite } from '../../src/hooks/useApi';
import { useAuthStore } from '../../src/store/auth';
import type { Provider } from '../../src/types';
import { getProviderCover } from '../../src/utils/imageFallback';
import { rtlRow } from '../../src/utils/rtl';
import { getOffersRemoteWork } from '../../src/utils/providerMappers';

interface Props {
  provider: Provider;
}

const W = 240;
const H = 300; 
const R = 24; // Smooth pill-curved corners
const COVER_H = 135; // Locked fixed height for the image layer

const FeaturedCard = memo(function FeaturedCard({ provider }: Props) {
  const { colors } = useTheme();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const toggleFavorite = useToggleFavorite();

  const rating = provider.rating_average ?? 0;
  const isFavorited = provider.is_favorited ?? false;
  const gold = colors.gold;
  const cardBg = colors.surface;
  const textMain = colors.textPrimary;

  const go = useCallback(() => {
    router.push(`/provider/${provider.slug}`);
  }, [provider.slug]);

  const handleFavorite = useCallback(() => {
    if (!isAuthenticated) {
      router.push({ pathname: '/(auth)/login', params: { redirectTo: '/(tabs)/' } });
      return;
    }
    toggleFavorite.mutate({ slug: provider.slug, isFavorited });
  }, [isAuthenticated, provider.slug, isFavorited, toggleFavorite]);

  return (
    <View style={styles.cardContainer}>
      <Pressable
        onPress={go}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: cardBg,
            borderColor: pressed ? gold : colors.border,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
        ]}
      >
        {/* Cover Image Wrap with Strict Fixed Dimensions */}
        <View style={styles.coverWrap}>
          <Image
            source={{ uri: getProviderCover(provider.cover_url, provider.id) }}
            style={styles.cover}
            contentFit="cover" // Centers and crops the photo seamlessly into the dimensions
            cachePolicy="memory-disk"
          />
          <View style={styles.topGradient} />

          {/* Featured Badge */}
          {provider.is_featured && (
            <View style={[styles.featuredBadge, { backgroundColor: gold }]}>
              <Ionicons name="sparkles" size={10} color={colors.goldText} />
              <Text style={[styles.featuredText, { color: colors.goldText }]}>مميز</Text>
            </View>
          )}

          {/* Favorite Button */}
          <Pressable
            onPress={handleFavorite}
            style={({ pressed }) => [
              styles.heartButton,
              {
                backgroundColor: isFavorited ? gold : colors.overlayMedium,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            hitSlop={12}
          >
            <Ionicons
              name={isFavorited ? 'heart' : 'heart-outline'}
              size={15}
              color={isFavorited ? colors.goldText : '#FFFFFF'}
            />
          </Pressable>
        </View>

        {/* Card Content Body */}
        <View style={styles.body}>
          
          {/* Category & Rating Row (Perfectly Aligned) */}
          <View style={styles.metaRow}>
            {rating > 0 ? (
              <View style={styles.ratingBadge}>
                <Text style={[styles.ratingCount, { color: colors.textMuted }]}>
                  ({provider.reviews_count})
                </Text>
                <Text style={[styles.ratingNumber, { color: colors.goldText }]}>
                  {rating.toFixed(1)}
                </Text>
                <View style={styles.starIconAlign}>
                  <Ionicons name="star" size={12} color={gold} />
                </View>
              </View>
            ) : <View />}

            {provider.category?.name && (
              <Text style={[styles.categoryTag, { color: colors.textSecondary, backgroundColor: colors.surfaceAlt }]}>
                {provider.category.name}
              </Text>
            )}
          </View>

          {/* Content Block */}
          <View style={styles.mainContent}>
            <Text numberOfLines={1} style={[styles.providerName, { color: textMain }]}>
              {provider.name}
            </Text>

            {provider.city?.name && (
              <View style={styles.locationRow}>
                <Text style={[styles.locationText, { color: colors.textMuted }]}>
                  {provider.city.name}
                </Text>
                <Ionicons name="location-outline" size={12} color={colors.textMuted} />
              </View>
            )}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Footer Metrics */}
          <View style={styles.footerRow}>
            {getOffersRemoteWork(provider) ? (
              <View style={styles.remoteBadge}>
                <Text style={styles.remoteText}>عن بعد</Text>
                <Ionicons name="laptop-outline" size={11} color={colors.success} />
              </View>
            ) : <View />}

            {provider.years_experience && (
              <View style={styles.experienceRow}>
                <Text style={[styles.experienceText, { color: colors.textMuted }]}>
                  خبرة {provider.years_experience} {provider.years_experience > 10 ? 'سنة' : 'سنوات'}
                </Text>
                <Ionicons name="ribbon-outline" size={12} color={colors.textMuted} />
              </View>
            )}
          </View>

        </View>
      </Pressable>
    </View>
  );
});

export { FeaturedCard };

const styles = StyleSheet.create({
  cardContainer: {
    paddingVertical: 8,
    paddingHorizontal: 6,
  },

  card: {
    width: W,
    height: H,
    borderRadius: R,
    borderWidth: 1,
    overflow: 'hidden',
    
    shadowColor: '#000',
    shadowOpacity: 0,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 0,

    ...(Platform.OS === 'ios' && {
      borderCurve: 'continuous',
    }),
  },

  coverWrap: {
    width: W,            // Locked to Card width
    height: COVER_H,     // Locked to Cover height
    position: 'relative',
    overflow: 'hidden',
    borderTopLeftRadius: R,
    borderTopRightRadius: R,
  },

  cover: {
    width: W,            // Enforces fixed width on the image node
    height: COVER_H,     // Enforces fixed height on the image node
    backgroundColor: '#F1F5F9',
  },

  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },

  featuredBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  featuredText: {
    fontSize: 9,
    fontFamily: 'Cairo-Bold',
    lineHeight: 13,
  },

  heartButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  body: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: 'space-between',
  },

  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  categoryTag: {
    fontSize: 9,
    fontFamily: 'Cairo-SemiBold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },

  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  ratingNumber: {
    fontSize: 12,
    fontFamily: 'Cairo-Bold',
    lineHeight: 14, 
    marginLeft: 3,  
    marginRight: 4, 
  },

  ratingCount: {
    fontSize: 10,
    fontFamily: 'Cairo-Regular',
    lineHeight: 14,
  },

  starIconAlign: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'android' ? 1 : 0, 
  },

  mainContent: {
    marginVertical: 2,
  },

  providerName: {
    fontSize: 14,
    fontFamily: 'Cairo-Bold',
    writingDirection: 'rtl',
    textAlign: 'right',
    lineHeight: 20,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 2,
  },

  locationText: {
    fontSize: 11,
    fontFamily: 'Cairo-Regular',
    lineHeight: 14,
  },

  divider: {
    height: 1,
    width: '100%',
    marginVertical: 2,
  },

  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  experienceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  experienceText: {
    fontSize: 10,
    fontFamily: 'Cairo-Medium',
    lineHeight: 14,
  },

  remoteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },

  remoteText: {
    fontSize: 9,
    fontFamily: 'Cairo-Medium',
    color: '#10B981',
    lineHeight: 13,
  },
});
