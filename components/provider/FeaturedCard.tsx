import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { memo, useCallback, useState } from 'react';
import { Pressable, Text, View, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../src/hooks/useTheme';
import { useToggleFavorite } from '../../src/hooks/useApi';
import { useAuthStore } from '../../src/store/auth';
import type { Provider } from '../../src/types';
import { getProviderCover, getProviderLogo } from '../../src/utils/imageFallback';

interface Props {
  provider: Provider;
}

const W = 240;
const H = 270;
const R = 20;
const COVER_H = 120;
const LOGO = 88;

const FeaturedCard = memo(function FeaturedCard({ provider }: Props) {
  const { colors } = useTheme();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const toggleFavorite = useToggleFavorite();
  const [isFavorited, setIsFavorited] = useState(!!provider.is_favorited);

  const rating = provider.rating_average ?? 0;
  const gold = colors.gold ?? '#EAB308';
  const surface = colors.surface ?? '#0F172A';
  const text = colors.textPrimary ?? '#F8FAFC';

  const go = useCallback(() => {
    router.push(`/provider/${provider.slug}`);
  }, [provider.slug]);

  const handleFavorite = useCallback(() => {
    if (!isAuthenticated) {
      router.push({ pathname: '/(auth)/login', params: { redirectTo: '/(tabs)/' } });
      return;
    }
    setIsFavorited(!isFavorited);
    toggleFavorite.mutate({ slug: provider.slug, isFavorited });
  }, [isAuthenticated, provider.slug, isFavorited, toggleFavorite]);

  return (
    <Pressable
      onPress={go}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: surface,
          borderColor: pressed ? gold : 'rgba(255,255,255,0.08)',
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View style={styles.coverWrap}>
        <Image
          source={{ uri: getProviderCover(provider.cover_url, provider.id) }}
          style={styles.cover}
          contentFit="cover"
        />

        <View style={styles.coverOverlay} />

        <View style={[styles.featuredBadge, { backgroundColor: gold }]}>
          <Text style={styles.featuredText}>مميز</Text>
          <Ionicons name="star" size={11} color="#0F172A" />
        </View>

        <Pressable
          onPress={handleFavorite}
          style={({ pressed }) => [
            styles.heartButton,
            {
              backgroundColor: isFavorited ? gold : 'rgba(0,0,0,0.3)',
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          hitSlop={12}
        >
          <Ionicons
            name={isFavorited ? 'heart' : 'heart-outline'}
            size={16}
            color={isFavorited ? '#0F172A' : '#FFFFFF'}
          />
        </Pressable>
      </View>

      <View style={styles.body}>
        <View
          style={[
            styles.logoWrap,
            {
              backgroundColor: surface,
              borderColor: gold,
            },
          ]}
        >
          <Image
            source={{ uri: getProviderLogo(provider.logo_url, provider.id) }}
            style={styles.logo}
            contentFit="contain"
          />
        </View>

        <Text numberOfLines={2} style={[styles.name, { color: text, maxWidth: 110 }]}>
          {provider.name}
        </Text>

        <View style={styles.metaRow}>
          {provider.category?.name && (
            <View style={[styles.badge, { backgroundColor: 'rgba(59,130,246,0.12)' }]}>
              <Ionicons name="briefcase-outline" size={10} color="#60A5FA" />
              <Text numberOfLines={1} style={[styles.badgeText, { color: '#60A5FA' }]}>
                {provider.category.name}
              </Text>
            </View>
          )}

          {rating > 0 && (
            <View style={[styles.badge, { backgroundColor: 'rgba(234,179,8,0.12)' }]}>
              <Ionicons name="star" size={10} color={gold} />
              <Text numberOfLines={1} style={[styles.badgeText, { color: gold }]}>
                {rating.toFixed(1)}
              </Text>
            </View>
          )}
        </View>

      </View>
    </Pressable>
  );
});

export { FeaturedCard };

const styles = StyleSheet.create({
  card: {
    width: W,
    height: H,
    borderRadius: R,
    borderWidth: 1,
    overflow: 'hidden',
    marginRight: 14,

    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,

    ...(Platform.OS === 'ios' && {
      borderCurve: 'continuous',
    }),
  },

  coverWrap: {
    height: COVER_H,
    width: '100%',
    overflow: 'hidden',
    borderTopLeftRadius: R,
    borderTopRightRadius: R,

    ...(Platform.OS === 'ios' && {
      borderCurve: 'continuous',
    }),
  },

  cover: {
    width: '100%',
    height: '100%',
  },

  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2,6,23,0.2)',
  },

  featuredBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },

  featuredText: {
    fontSize: 11,
    fontFamily: 'Cairo-Bold',
    color: '#0F172A',
    writingDirection: 'rtl',
  },

  heartButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  body: {
    height: H - COVER_H,
    position: 'relative',
    paddingHorizontal: 14,
    paddingTop: LOGO / 2 + 10,
    paddingBottom: 12,
  },

  logoWrap: {
    position: 'absolute',
    top: -LOGO / 2,
    right: 14,
    width: LOGO,
    height: LOGO,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 4,
    overflow: 'hidden',

    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,

    ...(Platform.OS === 'ios' && {
      borderCurve: 'continuous',
    }),
  },

  logo: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },

  name: {
    textAlign: 'right',
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Cairo-Bold',
    writingDirection: 'rtl',
    height: 36,
    marginBottom: 8,
  },

  metaRow: {
    height: 28,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },

  badge: {
    flex: 1,
    minWidth: 0,
    height: 28,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 9,
    borderRadius: 999,
    justifyContent: 'center',
  },

  badgeText: {
    flex: 1,
    textAlign: 'right',
    fontSize: 10,
    fontFamily: 'Cairo-Bold',
    writingDirection: 'rtl',
  },

});