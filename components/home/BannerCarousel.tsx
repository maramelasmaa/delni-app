import { Image } from 'expo-image';
import { router } from 'expo-router';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, Pressable, Text, View } from 'react-native';
import { useTheme } from '../../src/hooks/useTheme';
import { openExternalUrl } from '../../src/utils/links';
import type { Banner } from '../../src/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 40;
// Locked banner aspect ratio (2:1). MUST match the Filament upload crop ratio
// so every banner renders identically regardless of the source image's pixels.
const BANNER_RATIO = 2;
const CARD_HEIGHT = Math.round(CARD_WIDTH / BANNER_RATIO);
const GAP = 12;
const STRIDE = CARD_WIDTH + GAP;
const AUTO_SCROLL_INTERVAL = 4000;

interface Props {
  banners: Banner[];
}

function BannerCarousel({ banners }: Props) {
  const { colors } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeIndexRef = useRef(0);

  // Since the list is inverted, index 0 is at offset 0 (on the right)
  // and offset increases as we scroll to the left.
  const getOffset = useCallback((index: number): number => index * STRIDE, []);

  // Keep activeIndex in sync while user manually scrolls
  const onScroll = useCallback(
    (e: { nativeEvent: { contentOffset: { x: number } } }) => {
      const x = e.nativeEvent.contentOffset.x;
      const raw = x / STRIDE;
      const idx = Math.max(0, Math.min(Math.round(raw), banners.length - 1));
      if (idx !== activeIndexRef.current) {
        activeIndexRef.current = idx;
        setActiveIndex(idx);
      }
    },
    [banners.length],
  );

  useEffect(() => {
    if (banners.length <= 1) return;

    timerRef.current = setInterval(() => {
      const curr = activeIndexRef.current;
      const next = (curr + 1) % banners.length;
      activeIndexRef.current = next;
      setActiveIndex(next);

      const isLooping = next === 0 && curr === banners.length - 1;
      if (isLooping) {
        // Jump back to index 0 (which is offset 0 on the right) without animation
        flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
      } else {
        flatListRef.current?.scrollToOffset({ offset: getOffset(next), animated: true });
      }
    }, AUTO_SCROLL_INTERVAL);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [banners.length, getOffset]);

  const handlePress = useCallback((banner: Banner) => {
    if (!banner.link_value) return;
    if (banner.link_type === 'category' && banner.link_value) {
      router.push({
        pathname: '/category/[slug]',
        params: { slug: banner.link_value },
      });
    }
    else if (banner.link_type === 'provider') router.push(`/provider/${banner.link_value}`);
    else if (banner.link_type === 'url') openExternalUrl(banner.link_value);
  }, []);

  const scrollToIndex = useCallback(
    (i: number) => {
      flatListRef.current?.scrollToOffset({ offset: getOffset(i), animated: true });
      activeIndexRef.current = i;
      setActiveIndex(i);
    },
    [getOffset],
  );

  if (banners.length === 0) return null;

  return (
    <View className="mb-6">
      <FlatList
        ref={flatListRef}
        data={banners}
        horizontal
        inverted
        showsHorizontalScrollIndicator={false}
        snapToInterval={STRIDE}
        snapToAlignment="start"
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={onScroll}
        contentContainerStyle={{ paddingHorizontal: 20, gap: GAP }}
        renderItem={({ item }) => (
          <BannerItem banner={item} onPress={handlePress} />
        )}
        keyExtractor={(item) => item.id.toString()}
      />

      {banners.length > 1 ? (
        <View className="mt-3 flex-row-reverse items-center justify-center gap-1.5">
          {banners.map((_, i) => (
            <Pressable key={i} onPress={() => scrollToIndex(i)} hitSlop={6}>
              <View
                style={{
                  height: 6,
                  borderRadius: 999,
                  width: i === activeIndex ? 20 : 6,
                  backgroundColor: i === activeIndex ? colors.primary : colors.borderStrong,
                }}
              />
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const BannerItem = memo(function BannerItem({
  banner,
  onPress,
}: {
  banner: Banner;
  onPress: (b: Banner) => void;
}) {
  const isClickable = banner.link_type !== 'none' && !!banner.link_value;

  return (
    <Pressable
      onPress={() => isClickable && onPress(banner)}
      disabled={!isClickable}
      style={{ width: CARD_WIDTH }}
      className="overflow-hidden rounded-2xl"
    >
      <Image
        source={{ uri: banner.image_url }}
        style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
        contentFit="cover"
        recyclingKey={`banner-${banner.id}`}
      />

      {banner.title || banner.subtitle ? (
        <View
          className="absolute bottom-0 left-0 right-0 px-4 py-3"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
        >
          {banner.title ? (
            <Text className="text-right text-base font-cairo-bold text-white" numberOfLines={1}>
              {banner.title}
            </Text>
          ) : null}
          {banner.subtitle ? (
            <Text className="mt-0.5 text-right text-xs font-cairo-semibold text-white/80" numberOfLines={1}>
              {banner.subtitle}
            </Text>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
});

export { BannerCarousel };
