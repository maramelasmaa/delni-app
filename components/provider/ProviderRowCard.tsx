import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { memo, useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../ui/Avatar';
import { useTheme } from '../../src/hooks/useTheme';
import type { ThemeColors } from '../../src/theme/tokens';
import type { Provider } from '../../src/types';

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
  const reviewCount = provider.reviews_count ?? 0;

  return (
    <Pressable onPress={handlePress} style={({ pressed }) => [styles.wrapper, pressed && styles.wrapperPressed]}>
      <View style={styles.card}>
        
        {/* ─── Top Half (Content & Direct Actions) ─── */}
        <View style={styles.topHalf}>
          {/* Avatar (Right) */}
          <View style={styles.avatarZone}>
            <View style={styles.avatarRing}>
              <Avatar
                logoUrl={provider.logo_url}
                name={provider.name}
                id={provider.id}
                size={60}
                radius={16}
                recyclingKey={`row-${provider.id}`}
              />
            </View>
            {rank !== undefined ? (
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>{rank}</Text>
              </View>
            ) : null}
          </View>

          {/* Info (Middle) */}
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={2}>
              {provider.name}
            </Text>
            {provider.category ? (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{provider.category.name}</Text>
              </View>
            ) : null}
          </View>

          {/* Actions (Left) */}
          <View style={styles.actions}>
            <Pressable onPress={handleFavorite} hitSlop={10}>
              <Ionicons
                name={isFav ? 'heart' : 'heart-outline'}
                size={22}
                color={isFav ? colors.gold : colors.textMuted}
              />
            </Pressable>
          </View>
        </View>

        {/* ─── Bottom Half (Metadata Bar) ─── */}
        <View style={styles.bottomRow}>
          {/* City Location (Right) */}
          {provider.city ? (
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={12} color={colors.textMuted} />
              <Text style={styles.metaText}>{provider.city.name}</Text>
            </View>
          ) : null}

          {/* Divider Dot */}
          {provider.city ? <Text style={styles.dotDivider}>•</Text> : null}

          {/* Rating (Middle) */}
          <View style={styles.metaItem}>
            <Ionicons name="star" size={12} color={colors.gold} />
            <Text style={styles.metaText}>
              {rating > 0 ? `${rating.toFixed(1)} (${reviewCount} تقييم)` : 'لا تقييمات'}
            </Text>
          </View>


        </View>

      </View>
    </Pressable>
  );
});

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrapper: {
    },
    wrapperPressed: {
      transform: [{ scale: 0.985 }],
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
    },
    topHalf: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    // ─── Avatar ───
    avatarZone: {
      position: 'relative',
    },
    avatarRing: {
      borderRadius: 18,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },

    rankBadge: {
      position: 'absolute',
      top: -6,
      right: -6,
      minWidth: 20,
      height: 20,
      paddingHorizontal: 4,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
      backgroundColor: colors.primary,
      borderWidth: 1.5,
      borderColor: colors.surface,
      zIndex: 10,
    },
    rankText: {
      fontSize: 9,
      color: colors.textOnPrimary,
      fontFamily: 'Cairo-Black',
    },
    // ─── Info ───
    info: {
      flex: 1,
      marginHorizontal: 12,
      alignItems: 'flex-end',
    },
    name: {
      textAlign: 'right',
      fontSize: 15,
      color: colors.textPrimary,
      fontFamily: 'Cairo-Bold',
      writingDirection: 'rtl',
      lineHeight: 22,
    },
    categoryBadge: {
      backgroundColor: colors.primarySoft,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
      marginTop: 8,
      alignSelf: 'flex-end',
    },
    categoryText: {
      fontSize: 11,
      fontFamily: 'Cairo-Bold',
      color: colors.primary,
    },
    // ─── Actions ───
    actions: {
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      width: 32,
    },
    actionPressed: {
      transform: [{ scale: 0.90 }],
    },
    // ─── Bottom Half ───
    bottomRow: {
      height: 40,
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingHorizontal: 16,
      backgroundColor: colors.surfaceAlt,
    },
    metaItem: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 4,
    },
    metaText: {
      fontSize: 11,
      fontFamily: 'Cairo-SemiBold',
      color: colors.textSecondary,
    },
    dotDivider: {
      fontSize: 10,
      color: colors.borderStrong,
    },
  });
}

export { ProviderRowCard };
