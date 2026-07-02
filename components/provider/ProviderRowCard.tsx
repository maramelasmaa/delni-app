import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { memo, useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../ui/Avatar';
import { useTheme } from '../../src/hooks/useTheme';
import type { ThemeColors } from '../../src/theme/tokens';
import type { Provider } from '../../src/types';
import { rtlRow } from '../../src/utils/rtl';

interface Props {
  provider: Provider;
  rank?: number;
  onFavoritePress: (slug: string, isFavorited: boolean) => void;
}

const ProviderRowCard = memo(function ProviderRowCard({ provider, rank, onFavoritePress }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const handlePress = useCallback(() => {
    router.push(`/provider/${provider.slug}`);
  }, [provider.slug]);

  const isFav = provider.is_favorited ?? false;

  const handleFavorite = useCallback(() => {
    onFavoritePress(provider.slug, isFav);
  }, [provider.slug, isFav, onFavoritePress]);

  const rating = provider.rating_average ?? 0;

  return (
    <Pressable onPress={handlePress} style={({ pressed }) => [styles.wrapper, pressed && styles.wrapperPressed]}>
      <View style={styles.card}>
        <View style={styles.cardInner}>
        <View style={styles.topSection}>
          <View style={styles.thumbWrap}>
            <View style={styles.thumb}>
              <Avatar
                logoUrl={provider.logo_url}
                name={provider.name}
                id={provider.id}
                size={76}
                radius={18}
                recyclingKey={`row-${provider.id}`}
              />
            </View>

            {provider.is_featured && rank === undefined ? (
              <View style={styles.featuredBadge}>
                <Ionicons name="sparkles" size={10} color="#0F172A" />
                <Text style={styles.featuredText}>مميز</Text>
              </View>
            ) : null}

            {rank !== undefined ? (
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>{rank}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.titleWrap}>
            <Text style={styles.name} numberOfLines={2}>
              {provider.name}
            </Text>
          </View>

          <View style={styles.favoriteWrap}>
            <Pressable onPress={handleFavorite} hitSlop={10} style={styles.favoriteButton}>
              <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={24} color={colors.gold} />
            </Pressable>
          </View>
        </View>

        <View style={styles.bottomStrip}>
          {provider.city ? (
            <View style={styles.pill}>
              <Ionicons name="location-outline" size={13} color={colors.textMuted} />
              <Text style={styles.pillText}>{provider.city.name}</Text>
            </View>
          ) : null}

          {provider.category ? (
            <View style={styles.pill}>
              <Text style={styles.pillText}>{provider.category.name}</Text>
            </View>
          ) : null}

          <View style={styles.pill}>
            <Ionicons name="star" size={13} color={colors.gold} />
            <Text style={styles.pillText}>{rating > 0 ? rating.toFixed(1) : '—'}</Text>
          </View>
        </View>
        </View>
      </View>
    </Pressable>
  );
});

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrapper: {
      paddingHorizontal: 2,
    },
    wrapperPressed: {
      transform: [{ scale: 0.992 }],
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 26,
      overflow: 'visible',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.05,
      shadowRadius: 12,
      elevation: 2,
    },
    cardInner: {
      backgroundColor: colors.surface,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    topSection: {
      minHeight: 110,
      ...rtlRow(),
      alignItems: 'center',
      paddingHorizontal: 18,
      paddingVertical: 14,
      backgroundColor: colors.surface,
    },
    thumbWrap: {
      position: 'relative',
    },
    thumb: {
      width: 70,
      height: 70,
      borderRadius: 18,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
    },
    featuredBadge: {
      position: 'absolute',
      top: -8,
      right: 2,
      ...rtlRow(),
      alignItems: 'center',
      gap: 2,
      backgroundColor: colors.gold,
      borderRadius: 999,
      paddingHorizontal: 9,
      paddingVertical: 3,
      zIndex: 20,
    },
    featuredText: {
      fontSize: 10,
      fontFamily: 'Cairo-Bold',
      color: '#0F172A',
    },
    rankBadge: {
      position: 'absolute',
      top: -6,
      right: -6,
      minWidth: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
      backgroundColor: colors.primary,
      borderWidth: 1.5,
      borderColor: colors.surface,
    },
    rankText: {
      fontSize: 9,
      color: colors.textOnPrimary,
      fontFamily: 'Cairo-Black',
    },
    titleWrap: {
      flex: 1,
      marginHorizontal: 12,
      alignItems: 'flex-end',
      justifyContent: 'center',
    },
    name: {
      fontSize: 15,
      lineHeight: 24,
      color: colors.textPrimary,
      fontFamily: 'Cairo-Bold',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    favoriteWrap: {
      width: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    favoriteButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bottomStrip: {
      ...rtlRow(),
      alignItems: 'center',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surfaceAlt,
    },
    pill: {
      ...rtlRow(),
      alignItems: 'center',
      gap: 5,
      backgroundColor: colors.primarySoft,
      borderRadius: 18,
      paddingHorizontal: 12,
      paddingVertical: 7,
      minHeight: 32,
    },
    pillText: {
      fontSize: 12,
      color: colors.primary,
      fontFamily: 'Cairo-Bold',
      textAlign: 'center',
    },
  });
}

export { ProviderRowCard };
