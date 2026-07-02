import { Image } from 'expo-image';
import { router } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, FlatList, Pressable, Text, View, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useTheme } from '../../src/hooks/useTheme';
import { openExternalUrl } from '../../src/utils/links';
import type { Banner } from '../../src/types';
import { usePrefetchImages } from '../../src/hooks/useImagePrefetch';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 40;
const BANNER_RATIO = 2;
const CARD_HEIGHT = Math.round(CARD_WIDTH / BANNER_RATIO);
const GAP = 12;
const STRIDE = CARD_WIDTH + GAP;
const AUTO_SCROLL_INTERVAL = 4000;

interface Props {
  banners: Banner[];
}

type CarouselBanner = Banner & {
  _carouselKey: string;
  _realIndex: number;
};

const BannerCarousel = memo(function BannerCarousel({ banners }: Props) {
  const { colors } = useTheme();
  const flatListRef = useRef<FlatList<CarouselBanner>>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const realCount = banners.length;
  usePrefetchImages(banners.map((banner) => banner.image_url), { cachePolicy: 'memory-disk', limit: 6 });
  
  // Create a 3x padded array to allow seamless infinite scrolling left and right
  const data = useMemo<CarouselBanner[]>(() => {
    if (realCount <= 1) {
      return banners.map((b, i) => ({ ...b, _carouselKey: `${b.id}-${i}`, _realIndex: i }));
    }
    // [Group A] [Group B (Main)] [Group C]
    const triple = [...banners, ...banners, ...banners];
    return triple.map((banner, index) => ({
      ...banner,
      _carouselKey: `${banner.id}-${index}`,
      _realIndex: index % realCount,
    }));
  }, [banners, realCount]);

  // Start at the beginning of the middle group (Group B)
  const initialIndex = realCount;
  const [activeIndex, setActiveIndex] = useState(0);
  const currentIndexRef = useRef(initialIndex);

  const startTimer = useCallback(() => {
    if (realCount <= 1) return;
    stopTimer();
    
    timerRef.current = setInterval(() => {
      const nextIndex = currentIndexRef.current + 1;
      flatListRef.current?.scrollToOffset({
        offset: nextIndex * STRIDE,
        animated: true,
      });
    }, AUTO_SCROLL_INTERVAL);
  }, [realCount]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Handle endless loop reset silently when scrolling stops
  const handleScrollReset = useCallback((xOffset: number) => {
    if (realCount <= 1) return;

    const exactIndex = xOffset / STRIDE;
    let currentIdx = Math.round(exactIndex);
    
    // If user drifts into Group A or Group C, snap them silently back to Group B
    if (currentIdx < realCount) {
      currentIdx = currentIdx + realCount;
      flatListRef.current?.scrollToOffset({ offset: currentIdx * STRIDE, animated: false });
    } else if (currentIdx >= realCount * 2) {
      currentIdx = currentIdx - realCount;
      flatListRef.current?.scrollToOffset({ offset: currentIdx * STRIDE, animated: false });
    }

    currentIndexRef.current = currentIdx;
    setActiveIndex(currentIdx % realCount);
  }, [realCount]);

  const onMomentumScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    handleScrollReset(e.nativeEvent.contentOffset.x);
    startTimer();
  }, [handleScrollReset, startTimer]);

  const onScrollBeginDrag = useCallback(() => {
    stopTimer();
  }, [stopTimer]);

  useEffect(() => {
    startTimer();
    return () => stopTimer();
  }, [startTimer, stopTimer]);

  const handlePress = useCallback((banner: Banner) => {
    if (!banner.link_value) return;
    if (banner.link_type === 'category') {
      router.push({ pathname: '/category/[slug]', params: { slug: banner.link_value } });
    } else if (banner.link_type === 'provider') {
      router.push(`/provider/${banner.link_value}`);
    } else if (banner.link_type === 'url') {
      openExternalUrl(banner.link_value);
    }
  }, []);

  const scrollToDot = useCallback((index: number) => {
    if (realCount === 0) return;
    stopTimer();
    const targetIndex = realCount + index; // Target layout mapping to Group B
    currentIndexRef.current = targetIndex;
    setActiveIndex(index);
    flatListRef.current?.scrollToOffset({ offset: targetIndex * STRIDE, animated: true });
    startTimer();
  }, [realCount, startTimer, stopTimer]);

  if (banners.length === 0) return null;

  return (
    <View className="mb-6">
      <FlatList
        ref={flatListRef}
        data={data}
        horizontal
        inverted
        showsHorizontalScrollIndicator={false}
        snapToInterval={STRIDE}
        snapToAlignment="start"
        decelerationRate="fast"
        scrollEventThrottle={16}
        disableIntervalMomentum
        getItemLayout={(_, index) => ({ length: STRIDE, offset: STRIDE * index, index })}
        initialScrollIndex={realCount > 1 ? initialIndex : 0}
        onMomentumScrollEnd={onMomentumScrollEnd}
        onScrollBeginDrag={onScrollBeginDrag}
        contentContainerStyle={{ paddingHorizontal: 20, gap: GAP }}
        renderItem={({ item }) => <BannerItem banner={item} onPress={handlePress} />}
        keyExtractor={(item) => item._carouselKey}
      />

      {realCount > 1 ? (
        // flex-row or flex-row-reverse matches native system engine setup
        <View className="mt-3 flex-row items-center justify-center gap-1.5">
          {banners.map((_, i) => (
            <Pressable key={i} onPress={() => scrollToDot(i)} hitSlop={6}>
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
});

const BannerItem = memo(function BannerItem({ banner, onPress }: { banner: Banner; onPress: (b: Banner) => void }) {
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
        cachePolicy="memory-disk"
        priority="high"
        recyclingKey={`banner-${banner.id}`}
      />
      {banner.title || banner.subtitle ? (
        <View className="absolute bottom-0 left-0 right-0 px-4 py-3" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
          {banner.title && (
            <Text className="text-right text-base font-cairo-bold text-white" numberOfLines={1}>
              {banner.title}
            </Text>
          )}
          {banner.subtitle && (
            <Text className="mt-0.5 text-right text-xs font-cairo-semibold text-white/80" numberOfLines={1}>
              {banner.subtitle}
            </Text>
          )}
        </View>
      ) : null}
    </Pressable>
  );
});

export { BannerCarousel };
