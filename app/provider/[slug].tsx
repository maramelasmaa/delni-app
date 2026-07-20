import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Dimensions, FlatList, Modal, Pressable, ScrollView, Text, TextInput, View, KeyboardAvoidingView, Platform } from 'react-native';
import type { ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StarRating } from '../../components/ui/StarRating';
import { ErrorView } from '../../components/ui/ErrorView';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useProvider, useProviderReviews, useToggleFavorite, useSubmitReview, useFlagReview } from '../../src/hooks/useApi';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/auth';
import type { ThemeColors } from '../../src/theme/tokens';
import type { PortfolioItem, Review, Provider, ProviderCredential } from '../../src/types';
import { buildSocialUrl, openExternalUrl } from '../../src/utils/links';
import { formatRelativeTime, formatIssueDate } from '../../src/utils/date';
import { formatArabicReviewCount } from '../../src/utils/numberFormatter';
import { rtlRow, rtlText } from '../../src/utils/rtl';
import { getProviderTypeLabel, getProviderTypeIcon } from '../../src/utils/providerTypes';
import { getAvatarTheme } from '../../src/utils/providerMappers';
import { RTLAlert, useRTLAlert } from '../../components/ui/RTLAlert';
import { mergeUniqueById } from '../../src/utils/searchFilters';
import { parseReportError, REPORT_MESSAGES } from '../../src/lib/report-errors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MappedProvider {
  id: number;
  slug: string;
  name: string;
  providerType: string | null;
  coverUrl: string | null;
  coverBlur: boolean;
  avatarUrl: string | null;
  categoryName: string | null;
  cityName: string | null;
  rating: number;
  reviewsCount: number;
  whatsappUrl: string | null;
  phone: string | null;
  email: string | null;
  socialLinks: Array<{ id: string; icon: keyof typeof Ionicons.glyphMap; color: string; url: string }>;
  about: string | null;
  services: Array<{ id: number; name: string; slug: string }> | null;
  projects: PortfolioItem[] | null;
  credentials: ProviderCredential[] | null;
  yearsExperience: number | null;
  serviceAreaNote: string | null;
  yearsExperienceText: string | null;
  worksRemotely: boolean;
  travelsToCities: boolean;
  mapUrl: string | null;
  isFeatured: boolean;
  isFavorited: boolean;
  canReview: boolean;
  reviewStatusMessage: string | null;
}

function mapProviderProfile(provider: Provider): MappedProvider {
  const anyProvider = provider as any;

  let coverUrl: string | null = null;
  let coverBlur = false;

  const isValidUrl = (url?: string | null) =>
    url && !url.includes('placeholder') && !url.includes('default') && url.trim() !== "" && !url.includes('localhost:8000');

  if (isValidUrl(provider.cover_url)) {
    coverUrl = provider.cover_url!;
  } else if (provider.portfolio_items?.[0]?.images?.[0]) {
    coverUrl = provider.portfolio_items[0].images[0];
  } else if (isValidUrl(provider.logo_url)) {
    coverUrl = provider.logo_url!;
    coverBlur = true;
  }

  const avatarUrl = isValidUrl(provider.logo_url) ? provider.logo_url! : null;
  const categoryName = provider.category?.name || provider.subcategories?.[0]?.name || null;
  const yearsExp = provider.years_experience ?? null;

  const socialLinks: MappedProvider['socialLinks'] = [];
  if (provider.website) {
    const webUrl = buildSocialUrl('website', provider.website);
    if (webUrl) socialLinks.push({ id: 'website', icon: 'globe-outline', color: '#60A5FA', url: webUrl });
  }

  const rawSocials = provider.social_links || {};
  const platforms: Array<{ key: 'facebook' | 'instagram' | 'linkedin' | 'github'; icon: keyof typeof Ionicons.glyphMap; color: string }> = [
    { key: 'facebook', icon: 'logo-facebook', color: '#1877F2' },
    { key: 'instagram', icon: 'logo-instagram', color: '#E1306C' },
    { key: 'linkedin', icon: 'logo-linkedin', color: '#0A66C2' },
    { key: 'github', icon: 'logo-github', color: '#F1F5F9' },
  ];

  platforms.forEach(({ key, icon, color }) => {
    const value = rawSocials[key];
    if (value) {
      const url = buildSocialUrl(key, value);
      if (url) socialLinks.push({ id: key, icon, color, url });
    }
  });

  // The map link now lives in the dedicated Location card, not the socials row.
  const mapUrl = (rawSocials as any).map_url || anyProvider.map_url || null;

  return {
    id: provider.id,
    slug: provider.slug,
    name: provider.name,
    providerType: provider.provider_type || null,
    coverUrl,
    coverBlur,
    avatarUrl,
    categoryName,
    cityName: provider.city?.name || null,
    rating: provider.rating_average ?? 0,
    reviewsCount: provider.reviews_count ?? 0,
    whatsappUrl: provider.whatsapp_url || null,
    phone: provider.phone || null,
    email: anyProvider.email || null,
    socialLinks,
    about: provider.description || null,
    services: provider.subcategories || null,
    projects: provider.portfolio_items || null,
    credentials: provider.credentials || null,
    yearsExperience: yearsExp,
    yearsExperienceText: (() => {
      if (yearsExp === null || yearsExp <= 0) return null;
      if (yearsExp === 1) return 'سنة خبرة';
      if (yearsExp === 2) return 'سنتين خبرة';
      if (yearsExp >= 3 && yearsExp <= 10) return `${yearsExp} سنوات خبرة`;
      return `${yearsExp} سنة خبرة`;
    })(),
    worksRemotely: !!anyProvider.offers_remote_work,
    travelsToCities: !!anyProvider.travels_to_cities,
    mapUrl,
    serviceAreaNote: provider.service_area_note || null,
    isFeatured: !!provider.is_featured,
    isFavorited: !!provider.is_favorited,
    canReview: !!provider.can_review,
    reviewStatusMessage: provider.review_status_message || null,
  };
}

// getAvatarTheme now lives in src/utils/providerMappers (single source of truth).

function getServiceIcon(serviceName: string | undefined): keyof typeof Ionicons.glyphMap {
  if (!serviceName) return 'construct-outline';
  const lower = serviceName.toLowerCase();
  if (lower.includes('شعار') || lower.includes('لوجو')) return 'color-palette-outline';
  if (lower.includes('تصوير') || lower.includes('كاميرا') || lower.includes('فيديو')) return 'camera-outline';
  if (lower.includes('هوية') || lower.includes('بصري')) return 'document-text-outline';
  if (lower.includes('إعلان') || lower.includes('تسويق') || lower.includes('سوشيال')) return 'megaphone-outline';
  if (lower.includes('مطبوع') || lower.includes('طباعة')) return 'print-outline';
  if (lower.includes('برمج') || lower.includes('موقع') || lower.includes('تطبيق')) return 'code-slash-outline';
  if (lower.includes('تصميم') || lower.includes('رسم')) return 'brush-outline';
  return 'construct-outline';
}

function SectionHeader({ title, colors }: { title: string; colors: ThemeColors }) {
  return (
    <View style={{ ...rtlRow(), alignItems: 'center', gap: 8, marginBottom: 12, width: '100%' }}>
      <View style={{ width: 4, height: 18, backgroundColor: colors.primary, borderRadius: 2 }} />
      <Text style={{ fontSize: 17, fontFamily: 'Cairo-Bold', color: colors.textPrimary, textAlign: 'right', writingDirection: 'rtl' }}>
        {title}
      </Text>
    </View>
  );
}

interface AboutSectionProps {
  about: string | null;
  colors: ThemeColors;
}
function AboutSection({ about, colors }: AboutSectionProps) {
  const [expanded, setExpanded] = useState(false);
  if (!about) return null;
  const shouldShowToggle = about.length > 180;

  return (
    <View style={{ marginBottom: 16, width: '100%' }}>
      <SectionHeader title="نبذة عنا" colors={colors} />
      <View
        style={{
          borderRadius: 20,
          backgroundColor: colors.surface,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0,
          shadowRadius: 8,
          elevation: 0,
        }}
      >
        <Text
          numberOfLines={expanded ? undefined : 4}
          style={{
            textAlign: 'right',
            fontSize: 14,
            lineHeight: 24,
            color: colors.textSecondary,
            fontFamily: 'Cairo-Regular',
            writingDirection: 'rtl',
          }}
        >
          {about}
        </Text>
        {shouldShowToggle && (
          <Pressable
            onPress={() => setExpanded(!expanded)}
            style={{
              marginTop: 10,
              alignSelf: 'flex-end',
              ...rtlRow(),
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Text style={{ fontFamily: 'Cairo-Bold', fontSize: 13, color: colors.primary }}>
              {expanded ? 'عرض أقل' : 'عرض المزيد'}
            </Text>
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={colors.primary}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

interface LocationSectionProps {
  cityName: string | null;
  mapUrl: string | null;
  serviceAreaNote: string | null;
  colors: ThemeColors;
}

function getProfileRowSurface(colors: ThemeColors): ViewStyle {
  return {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0,
    shadowRadius: 4,
    elevation: 0,
  };
}
function LocationSection({ cityName, mapUrl, serviceAreaNote, colors }: LocationSectionProps) {
  if (!cityName && !mapUrl && !serviceAreaNote) return null;

  return (
    <View style={{ marginBottom: 16, width: '100%' }}>
      <SectionHeader title="الموقع" colors={colors} />
      <View style={{ ...getProfileRowSurface(colors), overflow: 'hidden' }}>
        <Pressable
          accessibilityRole={mapUrl ? 'link' : undefined}
          accessibilityLabel={mapUrl ? 'فتح موقع مقدم الخدمة على الخريطة' : undefined}
          disabled={!mapUrl}
          onPress={() => openExternalUrl(mapUrl, { errorMessage: 'تعذر فتح الخريطة.' })}
          style={({ pressed }) => ({
            position: 'relative',
            justifyContent: 'center',
            width: '100%',
            minHeight: 102,
            paddingHorizontal: 12,
            paddingVertical: 12,
            opacity: pressed ? 0.78 : 1,
          })}
        >
          <View
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: [{ translateY: -16 }],
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: colors.primarySoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="location-outline" size={16} color={colors.primary} />
          </View>

          <View style={{ marginRight: 54, marginLeft: mapUrl ? 28 : 0, alignItems: 'flex-end' }}>
            <Text
              numberOfLines={1}
              style={{ fontSize: 13, fontFamily: 'Cairo-Bold', color: colors.textPrimary, textAlign: 'right', writingDirection: 'rtl' }}
            >
              {cityName || 'موقع مقدم الخدمة'}
            </Text>
            <Text
              numberOfLines={2}
              style={{ marginTop: 2, fontSize: 12, lineHeight: 18, fontFamily: 'Cairo-Regular', color: colors.textMuted, textAlign: 'right', writingDirection: 'rtl' }}
            >
              {serviceAreaNote || (mapUrl ? 'فتح الموقع على الخريطة' : 'منطقة تقديم الخدمة')}
            </Text>
          </View>

          {mapUrl ? (
            <View
              style={{
                position: 'absolute',
                left: 4,
                top: '50%',
                transform: [{ translateY: -16 }],
                width: 32,
                height: 32,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="chevron-back" size={18} color={colors.textMuted} />
            </View>
          ) : null}
        </Pressable>
      </View>
    </View>
  );
}

interface ServicesSectionProps {
  services: Array<{ id: number; name: string; slug: string }> | null;
  colors: ThemeColors;
}
function ServicesSection({ services, colors }: ServicesSectionProps) {
  if (!services || services.length === 0) return null;

  return (
    <View style={{ marginBottom: 16, width: '100%' }}>
      <SectionHeader title="الخدمات المقدمة" colors={colors} />
      <View style={{ ...rtlRow(), flexWrap: 'wrap', gap: 10, width: '100%' }}>
        {services.map((svc) => (
          <View
            key={svc.id}
            style={{
              ...rtlRow(),
              alignItems: 'center',
              gap: 10,
              width: '48%',
              flexGrow: 1,
              minWidth: 140,
              ...getProfileRowSurface(colors),
              paddingHorizontal: 12,
              paddingVertical: 12,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors.primarySoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name={getServiceIcon(svc.name)} size={16} color={colors.primary} />
            </View>
            <Text
              numberOfLines={2}
              style={{
                fontFamily: 'Cairo-Bold',
                fontSize: 13,
                color: colors.textPrimary,
                textAlign: 'right',
                writingDirection: 'rtl',
                flex: 1,
              }}
            >
              {svc.name}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

interface PortfolioSectionProps {
  projects: PortfolioItem[] | null;
  colors: ThemeColors;
  onImagePress: (item: PortfolioItem, index: number) => void;
}
function PortfolioSection({ projects, colors, onImagePress }: PortfolioSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  if (!projects || projects.length === 0) return null;

  const cardWidth = SCREEN_WIDTH - 32;
  const gapSize = 12;

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: false });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleScroll = (event: any) => {
    const xOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(xOffset / (cardWidth + gapSize));
    const boundedIndex = Math.max(0, Math.min(projects.length - 1, index));
    setActiveIndex(boundedIndex);
  };

  return (
    <View style={{ marginBottom: 16, width: '100%' }}>
      <SectionHeader title="معرض الأعمال" colors={colors} />
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + gapSize}
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          ...rtlRow(),
          gap: gapSize,
        }}
        style={{ width: '100%' }}
      >
        {projects.map((project, idx) => {
          const imageCount = project.images?.length || 0;
          return (
            <View
              key={project.id || idx}
              style={{
                width: cardWidth,
                borderRadius: 18,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                overflow: 'hidden',
                shadowColor: colors.shadow,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0,
                shadowRadius: 8,
                elevation: 0,
              }}
            >
              {project.images?.[0] && (
                <View style={{ position: 'relative', width: '100%', height: 200 }}>
                  <Pressable onPress={() => onImagePress(project, 0)} style={{ width: '100%', height: '100%' }}>
                    <Image
                      source={{ uri: project.images[0] }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                    />
                  </Pressable>
                  {imageCount > 1 && (
                    <View
                      style={{
                        position: 'absolute',
                        bottom: 12,
                        left: 12,
                        backgroundColor: 'rgba(0,0,0,0.65)',
                        borderRadius: 12,
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        ...rtlRow(),
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Ionicons name="images-outline" size={13} color="#FFFFFF" />
                      <Text style={{ color: '#FFFFFF', fontFamily: 'Cairo-Bold', fontSize: 11 }}>
                        {imageCount} صور
                      </Text>
                    </View>
                  )}
                </View>
              )}
              <View style={{ padding: 14, alignItems: 'flex-end', width: '100%' }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Cairo-Bold',
                    color: colors.textPrimary,
                    textAlign: 'right',
                    writingDirection: 'rtl',
                  }}
                >
                  {project.title}
                </Text>
                {project.short_description ? (
                  <Text
                    numberOfLines={3}
                    style={{
                      marginTop: 6,
                      fontSize: 13,
                      fontFamily: 'Cairo-Regular',
                      color: colors.textSecondary,
                      textAlign: 'right',
                      writingDirection: 'rtl',
                      lineHeight: 20,
                    }}
                  >
                    {project.short_description}
                  </Text>
                ) : null}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {projects.length > 1 && (
        <View
          style={{
            ...rtlRow(),
            justifyContent: 'center',
            alignItems: 'center',
            gap: 6,
            marginTop: 10,
          }}
        >
          {projects.map((_, idx) => {
            const isActive = activeIndex === idx;
            return (
              <View
                key={idx}
                style={{
                  width: isActive ? 18 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: isActive ? colors.primary : colors.borderStrong,
                }}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

interface CredentialsSectionProps {
  credentials: ProviderCredential[] | null;
  colors: ThemeColors;
}
function CredentialsSection({ credentials, colors }: CredentialsSectionProps) {
  if (!credentials || credentials.length === 0) return null;
  return (
    <View style={{ marginBottom: 12, width: '100%' }}>
      <SectionHeader title="الشهادات والمؤهلات" colors={colors} />
      <View style={{ gap: 10, width: '100%' }}>
        {credentials.map((cred) => (
          <View
            key={cred.id}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 14,
              padding: 14,
              borderWidth: 1,
              borderColor: colors.border,
              borderRightWidth: 4,
              borderRightColor: colors.gold,
              shadowColor: colors.shadow,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0,
              shadowRadius: 4,
              elevation: 0,
            }}
          >
            <Text
              style={{
                fontFamily: 'Cairo-Bold',
                fontSize: 13.5,
                color: colors.textPrimary,
                textAlign: 'right',
                writingDirection: 'rtl',
                marginBottom: 4,
              }}
            >
              {cred.title}
            </Text>
            {cred.issuer ? (
              <Text
                style={{
                  fontFamily: 'Cairo-SemiBold',
                  fontSize: 13,
                  color: colors.textSecondary,
                  textAlign: 'right',
                  writingDirection: 'rtl',
                  marginBottom: 2,
                }}
              >
                جهة الإصدار: {cred.issuer}
              </Text>
            ) : null}
            {cred.issue_date ? (
              <View style={{ ...rtlRow(), alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
                <Text
                  style={{
                    fontFamily: 'Cairo-Regular',
                    fontSize: 12,
                    color: colors.textMuted,
                    textAlign: 'right',
                    writingDirection: 'rtl',
                  }}
                >
                  تاريخ الإصدار: {formatIssueDate(cred.issue_date)}
                </Text>
              </View>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

function ReviewCard({
  review,
  colors,
  onReport,
  isLast,
}: {
  review: Review;
  colors: ThemeColors;
  onReport: (reviewId: number) => void;
  isLast?: boolean;
}) {
  const { isDark } = useTheme();
  const avatarTheme = getAvatarTheme(review.user_name, isDark);
  const initial = (review.user_name || 'U').trim().charAt(0).toUpperCase();
  return (
    <View
      style={{
        ...rtlRow(),
        paddingBottom: 12,
        marginBottom: 12,
        borderBottomWidth: isLast ? 0 : 1,
        borderColor: colors.border,
        width: '100%',
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: avatarTheme.bg,
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: 12
        }}
      >
        <Text style={{ fontFamily: 'Cairo-Bold', fontSize: 18, color: avatarTheme.text }}>
          {initial}
        </Text>
      </View>

      <View style={{ flex: 1, alignItems: 'flex-end' }}>
        <View style={{ ...rtlRow(), alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <Text style={{ fontSize: 14, fontFamily: 'Cairo-Bold', color: colors.textPrimary, textAlign: 'right' }}>
            {review.user_name}
          </Text>
          <View style={{ ...rtlRow(), alignItems: 'center', gap: 10 }}>
            <Text style={{ fontSize: 11.5, color: colors.textMuted, fontFamily: 'Cairo-Regular' }}>
              {formatRelativeTime(review.created_at)}
            </Text>
            <Pressable
              onPress={() => onReport(review.id)}
              hitSlop={12}
              style={({ pressed }) => ({
                padding: 4,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Ionicons name="flag-outline" size={16} color={colors.textMuted} />
            </Pressable>
          </View>
        </View>
        <View style={{ ...rtlRow(), marginTop: 2, marginBottom: 4 }}>
          <StarRating value={review.rating} size={13} />
        </View>
        {review.comment ? (
          <Text
            style={{
              textAlign: 'right',
              fontSize: 13,
              color: colors.textSecondary,
              fontFamily: 'Cairo-Regular',
              writingDirection: 'rtl',
              lineHeight: 20,
              width: '100%'
            }}
          >
            {review.comment}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function ReviewsSection({
  reviews,
  rating,
  reviewsCount,
  colors,
  isDark,
  isAuthenticated,
  canWriteReview,
  reviewStatusMessage,
  user,
  onWriteReviewPress,
  onUnauthenticatedWriteReview,
  onReportReview,
  isFetching,
  hasMore,
  onLoadMore,
}: {
  reviews: Review[];
  rating: number;
  reviewsCount: number;
  colors: ThemeColors;
  isDark: boolean;
  isAuthenticated: boolean;
  canWriteReview: boolean;
  reviewStatusMessage: string | null;
  user: any;
  onWriteReviewPress: () => void;
  onUnauthenticatedWriteReview: () => void;
  onReportReview: (reviewId: number) => void;
  isFetching: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const displayedReviews = showAll ? reviews : reviews.slice(0, 3);
  return (
    <View style={{ width: '100%', marginTop: 0 }}>
      <View style={{ ...rtlRow(), alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <View style={{ width: 14, height: 3, backgroundColor: colors.gold, borderRadius: 2 }} />
        <Text style={{ fontSize: 17, fontFamily: 'Cairo-Bold', color: colors.textPrimary, textAlign: 'right' }}>
          التقييمات ({reviewsCount})
        </Text>
      </View>
      {reviewsCount > 0 && (
        <View
          style={{
            marginBottom: 12,
            borderRadius: 18,
            backgroundColor: colors.surface,
            padding: 14,
            borderWidth: 1,
            borderColor: colors.border,
            ...rtlRow(),
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ alignItems: 'center', width: '35%' }}>
            <Text style={{ fontSize: 32, fontFamily: 'Cairo-Bold', color: colors.textPrimary, lineHeight: 40 }}>
              {rating.toFixed(1)}
            </Text>
            <StarRating value={rating} size={16} />
            <Text style={{ fontSize: 12, fontFamily: 'Cairo-Regular', color: colors.textMuted, marginTop: 4, textAlign: 'center' }}>
              بناءً على {formatArabicReviewCount(reviewsCount)}
            </Text>
          </View>
          <View style={{ width: '60%', gap: 4 }}>
            {[5, 4, 3, 2, 1].map((stars) => {
              let weight = 0.1;
              if (stars === Math.round(rating)) weight = 0.8;
              else if (stars === Math.round(rating) - 1) weight = 0.4;
              else if (stars === Math.round(rating) + 1) weight = 0.2;
              return (
                <View key={stars} style={{ ...rtlRow(), alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 13, fontFamily: 'Cairo-Bold', color: colors.textSecondary, width: 14 }}>
                    {stars}
                  </Text>
                  <View style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.surfaceAlt, overflow: 'hidden' }}>
                    <View style={{ width: `${weight * 100}%`, height: '100%', borderRadius: 4, backgroundColor: colors.gold }} />
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}
      {isAuthenticated ? (
        canWriteReview ? (
          <View style={{ marginBottom: 12, ...rtlRow(), alignItems: 'center' }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: getAvatarTheme(user?.name || '?', isDark).bg,
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: 10
              }}
            >
              <Text style={{ fontFamily: 'Cairo-Bold', fontSize: 16, color: getAvatarTheme(user?.name || '?', isDark).text }}>
                {((user?.name || '?').trim().charAt(0).toUpperCase())}
              </Text>
            </View>
            <Pressable 
              onPress={onWriteReviewPress}
              style={{
                flex: 1,
                ...rtlRow(),
                alignItems: 'center',
                justifyContent: 'space-between',
                borderRadius: 18,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surface,
                paddingHorizontal: 14,
                paddingVertical: 10,
              }}
            >
              <Text style={{ fontSize: 13, fontFamily: 'Cairo-Regular', color: colors.textMuted }}>
                شارك الآخرين تجربتك، أضف تقييماً...
              </Text>
              <Ionicons name="create-outline" size={18} color={colors.textMuted} />
            </Pressable>
          </View>
        ) : (
          reviewStatusMessage ? (
            <View
              style={{
                marginBottom: 12,
                ...rtlRow(),
                alignItems: 'center',
                gap: 10,
                borderRadius: 14,
                backgroundColor: colors.surfaceAlt,
                paddingHorizontal: 14,
                paddingVertical: 10
              }}
            >
              <Ionicons name="information-circle-outline" size={22} color={colors.textSecondary} />
              <Text style={{ flex: 1, textAlign: 'right', fontSize: 13, color: colors.textSecondary, fontFamily: 'Cairo-Regular', writingDirection: 'rtl', lineHeight: 19 }}>
                {reviewStatusMessage}
              </Text>
            </View>
          ) : null
        )
      ) : (
        <View style={{ marginBottom: 12, ...rtlRow(), alignItems: 'center' }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.surfaceAlt,
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 10
            }}
          >
            <Ionicons name="person-outline" size={18} color={colors.textMuted} />
          </View>
          <Pressable
            onPress={onUnauthenticatedWriteReview}
            style={{
              flex: 1,
              ...rtlRow(),
              alignItems: 'center',
              justifyContent: 'space-between',
              borderRadius: 18,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surfaceAlt,
              paddingHorizontal: 14,
              paddingVertical: 10,
            }}
          >
            <Text style={{ fontSize: 13, fontFamily: 'Cairo-Regular', color: colors.textSecondary }}>
              سجل دخولك لكتابة تقييم...
            </Text>
            <Ionicons name="log-in-outline" size={18} color={colors.textSecondary} />
          </Pressable>
        </View>
      )}
      {displayedReviews.length === 0 && !isFetching ? (
        <Text style={{ textAlign: 'center', fontSize: 14, color: colors.textMuted, fontFamily: 'Cairo-Regular', marginVertical: 16 }}>
          لا توجد تقييمات بعد
        </Text>
      ) : (
        displayedReviews.map((review, index) => (
          <ReviewCard
            key={review.id}
            review={review}
            colors={colors}
            onReport={onReportReview}
            isLast={index === displayedReviews.length - 1}
          />
        ))
      )}
      {reviews.length > 3 && !showAll && (
        <Pressable
          onPress={() => setShowAll(true)}
          style={{
            marginTop: 6,
            alignItems: 'flex-end',
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.primary,
            paddingVertical: 10,
            paddingHorizontal: 16,
          }}
        >
          <View style={{ ...rtlRow(), alignItems: 'center', gap: 6 }}>
            <Text style={{ fontFamily: 'Cairo-Bold', color: colors.primary, fontSize: 13 }}>
              عرض كل التقييمات ({reviews.length})
            </Text>
            <Ionicons name="chevron-down" size={15} color={colors.primary} />
          </View>
        </Pressable>
      )}
      {showAll && hasMore && (
        <Pressable
          onPress={onLoadMore}
          disabled={isFetching}
          style={{
            marginTop: 6,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.primary,
            paddingVertical: 10,
            paddingHorizontal: 16,
            alignItems: 'flex-end',
          }}
        >
          {isFetching ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <View style={{ ...rtlRow(), alignItems: 'center', gap: 6 }}>
              <Text style={{ fontFamily: 'Cairo-Bold', color: colors.primary, fontSize: 13 }}>
                تحميل المزيد من التقييمات
              </Text>
              <Ionicons name="chevron-down" size={15} color={colors.primary} />
            </View>
          )}
        </Pressable>
      )}
    </View>
  );
}

export default function ProviderScreen() {
  const { colors, isDark } = useTheme();
  const { slug, writeReview, reportReviewId } = useLocalSearchParams<{ slug: string; writeReview?: string; reportReviewId?: string }>();
  const { data: provider, isLoading, isError, error, refetch } = useProvider(slug);
  const [reviewPage, setReviewPage] = useState(1);
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const { data: reviewsData, isFetching: isFetchingReviews } = useProviderReviews(slug, reviewPage);

  useEffect(() => {
    setReviewPage(1);
  }, [slug]);

  useEffect(() => {
    const fresh = reviewsData?.data;
    if (!fresh) return;
    setAllReviews((prev) =>
      reviewPage === 1 ? fresh : mergeUniqueById(prev, fresh)
    );
  }, [reviewsData?.data, reviewPage]);

  const toggleFavorite = useToggleFavorite();
  const submitReview = useSubmitReview();
  const flagReview = useFlagReview();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const scrollViewRef = useRef<ScrollView>(null);

  const { alert, showAlert: showRTLAlert, hideAlert } = useRTLAlert();

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReviewIdState, setReportReviewIdState] = useState<number | null>(null);
  const [reportReasonType, setReportReasonType] = useState<'offensive' | 'misleading' | 'spam' | 'other'>('offensive');
  const [customReportReason, setCustomReportReason] = useState("");
  const [reportError, setReportError] = useState("");

  const handleReportSubmit = useCallback(() => {
    if (!reportReviewIdState) {
      setReportError('تعذر تحديد التقييم المراد الإبلاغ عنه. أغلق النافذة وحاول مرة أخرى.');
      return;
    }
    const label = reportReasonType === 'offensive' ? 'محتوى مسيء أو غير لائق' :
                  reportReasonType === 'misleading' ? 'معلومات مضللة أو كاذبة' :
                  reportReasonType === 'spam' ? 'رسائل مزعجة (سبام)' : 'سبب آخر';
    const combinedReason = customReportReason.trim() ? `${label}: ${customReportReason.trim()}` : `تم الإبلاغ من مستخدم التطبيق - ${label}`;

    if (combinedReason.length < 10) {
      setReportError('تفاصيل البلاغ يجب أن تكون 10 أحرف على الأقل.');
      return;
    }
    if (reportReasonType === 'other' && !customReportReason.trim()) {
      setReportError('يرجى كتابة تفاصيل السبب الآخر.');
      return;
    }

    flagReview.mutate(
      { reviewId: reportReviewIdState, reason: combinedReason },
      {
        onSuccess: () => {
          setShowReportModal(false);
          setReportReviewIdState(null);
          setCustomReportReason("");
          setReportReasonType('offensive');
          setReportError("");
          showRTLAlert('تم الإبلاغ', 'شكراً لك. سيراجع فريقنا هذا التقييم.', [{ text: 'حسناً', style: 'default' }]);
        },
        onError: (error) => {
          setReportError(parseReportError(error));
        }
      }
    );
  }, [reportReviewIdState, reportReasonType, customReportReason, flagReview, showRTLAlert]);

  const handleReportReview = useCallback((reviewId: number) => {
    if (!isAuthenticated) {
      showRTLAlert(
        'تسجيل الدخول مطلوب',
        'يجب عليك تسجيل الدخول لتتمكن من الإبلاغ عن هذا التقييم. هل تريد الانتقال إلى صفحة تسجيل الدخول؟',
        [
          { text: 'إلغاء', style: 'cancel' },
          {
            text: 'تسجيل الدخول',
            onPress: () => router.push({
              pathname: '/(auth)/login',
              params: { redirectTo: `/provider/${String(slug)}?reportReviewId=${reviewId}` },
            }),
          },
        ],
      );
      return;
    }
    const review = allReviews.find((item) => item.id === reviewId);
    if (review?.user_id === user?.id) {
      showRTLAlert('لا يمكن إرسال البلاغ', REPORT_MESSAGES.ownReview, [{ text: 'حسناً', style: 'default' }]);
      return;
    }
    setReportError('');
    setReportReviewIdState(reviewId);
    setShowReportModal(true);
  }, [allReviews, isAuthenticated, slug, showRTLAlert, user?.id]);

  useEffect(() => {
    if (writeReview === 'true' && isAuthenticated && provider) {
      if (!provider.can_review) {
        showRTLAlert('تعذر كتابة تقييم', provider.review_status_message ?? "", [{ text: 'حسناً', style: 'default' }]);
        router.setParams({ writeReview: undefined });
        return;
      }
      setShowReviewModal(true);
      const timer = setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 500);
      router.setParams({ writeReview: undefined });
      return () => clearTimeout(timer);
    }
  }, [writeReview, isAuthenticated, provider, showRTLAlert]);

  useEffect(() => {
    if (reportReviewId && isAuthenticated && provider) {
      const id = Number(reportReviewId);
      if (!isNaN(id)) {
        handleReportReview(id);
      }
    }
    router.setParams({ reportReviewId: undefined });
  }, [reportReviewId, isAuthenticated, provider, handleReportReview]);

  const handleUnauthenticatedWriteReview = useCallback(() => {
    showRTLAlert(
      'تسجيل الدخول مطلوب',
      'يجب عليك تسجيل الدخول لتتمكن من كتابة تقييم. هل تريد الانتقال إلى صفحة تسجيل الدخول؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تسجيل الدخول',
          onPress: () => router.push({
            pathname: '/(auth)/login',
            params: { redirectTo: `/provider/${String(slug)}?writeReview=true` },
          }),
        },
      ],
    );
  }, [slug, showRTLAlert]);

  const insets = useSafeAreaInsets();
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [galleryItem, setGalleryItem] = useState<PortfolioItem | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const reviewPagination = reviewsData?.pagination;
  const hasMoreReviews = reviewPagination ? reviewPagination.current_page < reviewPagination.last_page : false;

  const handleFavorite = useCallback(() => {
    if (!isAuthenticated) {
      router.push({ pathname: '/(auth)/login', params: { redirectTo: `/provider/${String(slug)}` } });
      return;
    }
    if (provider) {
      toggleFavorite.mutate({ slug: String(slug), isFavorited: !!provider.is_favorited });
    }
  }, [isAuthenticated, slug, provider, toggleFavorite]);

  const handleWhatsApp = useCallback(() => {
    if (provider?.whatsapp_url) {
      openExternalUrl(provider.whatsapp_url, { errorMessage: 'تعذر فتح واتساب، تأكد من تثبيت التطبيق.' });
    }
  }, [provider?.whatsapp_url]);

  const handlePhone = useCallback(() => {
    if (provider?.phone) {
      openExternalUrl(`tel:${provider.phone}`, { errorMessage: 'تعذر إجراء الاتصال.' });
    }
  }, [provider?.phone]);

  const handleReviewSubmit = useCallback(() => {
    if (!provider?.can_review) return;
    setReviewError("");
    submitReview.mutate(
      { slug: String(slug), rating: reviewRating, comment: reviewComment },
      {
        onSuccess: () => {
          setShowReviewModal(false);
          setReviewRating(0);
          setReviewComment("");
          setReviewError("");
        },
        onError: (err: unknown) => {
          const axiosErr = err as { response?: { data?: { message?: string } } };
          setReviewError(axiosErr?.response?.data?.message || 'حدث خطأ أثناء إرسال التقييم، حاول مجدداً.');
        }
      }
    );
  }, [provider?.can_review, slug, reviewRating, reviewComment, submitReview]);

  const handleWriteReviewPress = useCallback(() => {
    if (!provider?.can_review) {
      showRTLAlert('تعذر كتابة تقييم', provider?.review_status_message ?? "", [{ text: 'حسناً', style: 'default' }]);
      return;
    }
    setShowReviewModal(true);
  }, [provider?.can_review, provider?.review_status_message, showRTLAlert]);

  if (isLoading) return <LoadingSpinner />;
  if (isError || !provider) return <ErrorView error={error} onRetry={refetch} />;

  const profile = mapProviderProfile(provider);
  const HERO_HEIGHT = 250;
  const AVATAR_SIZE = 140;

  // Provider/service type → Arabic label + icon, from the single shared source
  // (src/utils/providerTypes) so it matches the API, search and category filters.
  const typeMeta = profile.providerType
    ? {
        label: getProviderTypeLabel(profile.providerType) ?? profile.providerType,
        icon: getProviderTypeIcon(profile.providerType),
      }
    : null;

  const specs = [];
  if (profile.yearsExperienceText) {
    specs.push({
      id: 'exp',
      icon: 'ribbon-outline',
      label: 'الخبرة',
      value: profile.yearsExperienceText,
    });
  }
  if (profile.worksRemotely) {
    specs.push({
      id: 'work',
      icon: 'desktop-outline',
      label: 'طبيعة العمل',
      value: 'عمل عن بُعد',
    });
  }
  if (profile.travelsToCities) {
    specs.push({
      id: 'travel',
      icon: 'car-outline',
      label: 'نطاق الخدمة',
      value: 'يتنقل بين المدن',
    });
  }
  if (typeMeta) {
    specs.push({
      id: 'type',
      icon: typeMeta.icon,
      label: 'النوع',
      value: typeMeta.label,
    });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['bottom']}>
      <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false}>

        {/* ═══ HERO SECTION WITH CENTERED AVATAR ═══ */}
        <View style={{ position: 'relative', width: '100%', height: HERO_HEIGHT, backgroundColor: colors.surface }}>
          {profile.coverUrl ? (
            <Image
              source={{ uri: profile.coverUrl }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              blurRadius={profile.coverBlur ? 25 : 0}
            />
          ) : (
            <LinearGradient
              colors={isDark ? ['#1e293b', '#0f172a'] : ['#3b82f6', '#1d4ed8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: '100%', height: '100%' }}
            />
          )}

          <LinearGradient
            colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.15)', 'transparent']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 100 }}
          />

          {/* Navigation Controls */}
          <View style={{ position: 'absolute', top: insets.top + 12, left: 16, right: 16, ...rtlRow(), justifyContent: 'space-between', alignItems: 'center', zIndex: 30 }}>
            <Pressable
              onPress={() => router.canGoBack() ? router.back() : requestAnimationFrame(() => router.replace('/(tabs)/'))}
              style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }}
              hitSlop={8}
            >
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </Pressable>

            <Pressable
              onPress={handleFavorite}
              style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }}
              hitSlop={8}
            >
              <Ionicons
                name={profile.isFavorited ? 'heart' : 'heart-outline'}
                size={20}
                color={profile.isFavorited ? colors.gold : '#FFFFFF'}
              />
            </Pressable>
          </View>

          {/* Avatar Overlapping Hero & Card */}
          <View style={{ position: 'absolute', bottom: -AVATAR_SIZE / 2, left: '50%', marginLeft: -AVATAR_SIZE / 2, zIndex: 20 }}>
            <View
              style={{
                width: AVATAR_SIZE,
                height: AVATAR_SIZE,
                borderRadius: AVATAR_SIZE / 2,
                borderWidth: 4,
                borderColor: colors.surface,
                backgroundColor: colors.surface,
                shadowColor: colors.shadow,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0,
                shadowRadius: 12,
                elevation: 0,
                overflow: 'hidden',
              }}
            >
              {profile.avatarUrl ? (
                <Image
                  source={{ uri: profile.avatarUrl }}
                  style={{ width: '100%', height: '100%', borderRadius: AVATAR_SIZE / 2 }}
                  contentFit="contain"
                />
              ) : (
                <View style={{ flex: 1, backgroundColor: getAvatarTheme(profile.name, isDark).bg, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontFamily: 'Cairo-Bold', fontSize: 32, color: getAvatarTheme(profile.name, isDark).text }}>
                    {profile.name.trim().charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* ═══ MAIN PROFILE INFO CARD ═══ */}
        <View
          style={{
            backgroundColor: colors.surface,
            marginTop: AVATAR_SIZE / 2 + 4,
            marginHorizontal: 16,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 16,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0,
            shadowRadius: 16,
            elevation: 0,
          }}
        >
          {/* Name & Info - Centered */}
          <View style={{ width: '100%', alignItems: 'center', gap: 8 }}>
            <Text numberOfLines={2} style={{ fontSize: 19, fontFamily: 'Cairo-Bold', color: colors.textPrimary, textAlign: 'center', writingDirection: 'rtl', lineHeight: 26 }}>
              {profile.name}
            </Text>

            {/* City, category, rating, and featured badges */}
            <View style={{ ...rtlRow(), alignItems: 'center', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
              {profile.cityName && (
                <View style={{ backgroundColor: colors.surfaceAlt, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9, ...rtlRow(), alignItems: 'center', gap: 4 }}>
                  <Ionicons name="location-outline" size={11} color={colors.textSecondary} />
                  <Text style={{ fontSize: 11, fontFamily: 'Cairo-Bold', color: colors.textSecondary }}>
                    {profile.cityName}
                  </Text>
                </View>
              )}

              {profile.categoryName && (
                <View style={{ backgroundColor: 'rgba(59,130,246,0.12)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9 }}>
                  <Text style={{ fontSize: 11, fontFamily: 'Cairo-Bold', color: colors.primary }}>
                    {profile.categoryName}
                  </Text>
                </View>
              )}

              {profile.rating > 0 && (
                <View style={{ backgroundColor: 'rgba(234,179,8,0.12)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9, ...rtlRow(), alignItems: 'center', gap: 3 }}>
                  <Ionicons name="star" size={11} color={colors.gold} />
                  <Text style={{ fontFamily: 'Cairo-Bold', fontSize: 11, color: colors.gold }}>
                    {profile.rating.toFixed(1)}
                  </Text>
                </View>
              )}

              {profile.isFeatured && (
                <View style={{ backgroundColor: 'rgba(234,179,8,0.18)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9, ...rtlRow(), alignItems: 'center', gap: 4 }}>
                  <Ionicons name="sparkles" size={11} color={colors.gold} />
                  <Text style={{ fontSize: 11, fontFamily: 'Cairo-Bold', color: colors.gold }}>
                    مميز
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Quick Specs Dashboard Bar */}
          {specs.length > 0 ? (
            <View style={{
              ...rtlRow(),
              width: '100%',
              backgroundColor: colors.surfaceAlt,
              borderRadius: 16,
              paddingVertical: 14,
              paddingHorizontal: 14,
              marginTop: 16,
              alignItems: 'center',
              justifyContent: 'space-around',
            }}>
              {specs.map((spec, index) => (
                <React.Fragment key={spec.id}>
                  <View style={{ alignItems: 'center', flex: 1, paddingHorizontal: 6, gap: 2 }}>
                    <Ionicons name={spec.icon as keyof typeof Ionicons.glyphMap} size={16} color={colors.primary} style={{ marginBottom: 4 }} />
                    <Text numberOfLines={1} style={{ fontFamily: 'Cairo-Bold', fontSize: 12, color: colors.textPrimary, textAlign: 'center' }}>
                      {spec.value}
                    </Text>
                    <Text style={{ fontFamily: 'Cairo-Regular', fontSize: 10, color: colors.textMuted, textAlign: 'center', marginTop: 1 }}>
                      {spec.label}
                    </Text>
                  </View>
                  {index < specs.length - 1 && (
                    <View style={{ width: 1, height: 26, backgroundColor: colors.border }} />
                  )}
                </React.Fragment>
              ))}
            </View>
          ) : null}

          {/* Action Call & WhatsApp Buttons */}
          {(profile.phone || profile.whatsappUrl) && (
            <View style={{ ...rtlRow(), width: '100%', gap: 10, marginTop: 16 }}>
              {profile.whatsappUrl && (
                <Pressable
                  onPress={handleWhatsApp}
                  style={{
                    flex: profile.phone ? 1 : undefined,
                    width: profile.phone ? undefined : '100%',
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: '#25D366',
                    ...rtlRow(),
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    shadowColor: '#25D366',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0,
                    shadowRadius: 6,
                    elevation: 0,
                  }}
                >
                  <Ionicons name="logo-whatsapp" size={22} color="#FFFFFF" />
                  <Text style={{ fontFamily: 'Cairo-Bold', fontSize: 13.5, color: '#FFFFFF' }}>واتساب</Text>
                </Pressable>
              )}
              {profile.phone && (
                <Pressable
                  onPress={handlePhone}
                  style={{
                    flex: profile.whatsappUrl ? 1 : undefined,
                    width: profile.whatsappUrl ? undefined : '100%',
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: colors.primary,
                    ...rtlRow(),
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0,
                    shadowRadius: 6,
                    elevation: 0,
                  }}
                >
                  <Ionicons name="call" size={20} color={colors.textOnPrimary} />
                  <Text style={{ fontFamily: 'Cairo-Bold', fontSize: 13.5, color: colors.textOnPrimary }}>اتصال هاتفي</Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Social Links Row */}
          {profile.socialLinks.length > 0 && (
            <View style={{ ...rtlRow(), justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderColor: colors.border, width: '100%', flexWrap: 'wrap' }}>
              {profile.socialLinks.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => openExternalUrl(item.url)}
                  accessibilityRole="button"
                  hitSlop={6}
                  style={({ pressed }) => ({
                    width: 50,
                    height: 50,
                    borderRadius: 14,
                    backgroundColor: colors.surfaceAlt,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: pressed ? 0.7 : 1,
                    borderWidth: 1,
                    borderColor: colors.border,
                    transform: [{ scale: pressed ? 0.94 : 1 }],
                  })}
                >
                  <Ionicons name={item.icon} size={25} color={item.color} />
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* ═══ CORE SECTIONS (About, Services, Portfolio, Credentials) ═══ */}
        <View style={{ paddingHorizontal: 16, marginTop: 18 }}>
          {profile.about && <AboutSection about={profile.about} colors={colors} />}
          <LocationSection
            cityName={profile.cityName}
            mapUrl={profile.mapUrl}
            serviceAreaNote={profile.serviceAreaNote}
            colors={colors}
          />
          <ServicesSection services={profile.services} colors={colors} />
          <PortfolioSection projects={profile.projects} colors={colors} onImagePress={(item, idx) => { setGalleryItem(item); setGalleryIndex(idx); }} />
          <CredentialsSection credentials={profile.credentials} colors={colors} />
        </View>

        {/* ═══ REVIEWS SECTION (Pasted Old Design) ═══ */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 28, marginTop: 0 }}>
          <ReviewsSection
            reviews={allReviews}
            rating={profile.rating}
            reviewsCount={profile.reviewsCount}
            colors={colors}
            isDark={isDark}
            isAuthenticated={isAuthenticated}
            canWriteReview={profile.canReview}
            reviewStatusMessage={profile.reviewStatusMessage}
            user={user}
            onWriteReviewPress={handleWriteReviewPress}
            onUnauthenticatedWriteReview={handleUnauthenticatedWriteReview}
            onReportReview={handleReportReview}
            isFetching={isFetchingReviews}
            hasMore={hasMoreReviews}
            onLoadMore={() => setReviewPage((p) => p + 1)}
          />
        </View>
      </ScrollView>

      {/* ═══ PORTFOLIO IMAGE FULLSCREEN LIGHTBOX ═══ */}
      <Modal visible={galleryItem !== null} transparent animationType="fade" onRequestClose={() => setGalleryItem(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.96)' }}>
          <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
            <View style={{ position: 'absolute', top: insets.top + 16, right: 16, zIndex: 99 }}>
              <Pressable onPress={() => setGalleryItem(null)} style={{ height: 40, width: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)' }}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </Pressable>
            </View>
            <View style={{ flex: 1, justifyContent: 'center' }}>
              {galleryItem?.images && galleryItem.images.length > 0 && (
                <FlatList
                  data={galleryItem.images}
                  keyExtractor={(uri, idx) => `${idx}-${uri}`}
                  horizontal
                  inverted
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  initialScrollIndex={galleryIndex}
                  getItemLayout={(_, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
                  onMomentumScrollEnd={(e) => {
                    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                    setGalleryIndex(Math.max(0, Math.min((galleryItem.images?.length ?? 1) - 1, idx)));
                  }}
                  style={{ flexGrow: 0 }}
                  renderItem={({ item: uri }) => (
                    <View style={{ width: SCREEN_WIDTH, justifyContent: 'center', alignItems: 'center' }}>
                      <Image source={{ uri }} style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 1.2 }} contentFit="contain" />
                    </View>
                  )}
                />
              )}
            </View>
            {galleryItem?.images && galleryItem.images.length > 1 ? (
              <Text style={{ textAlign: 'center', color: 'rgba(255,255,255,0.8)', fontFamily: 'Cairo-Bold', fontSize: 13, paddingTop: 12 }}>
                {galleryIndex + 1} / {galleryItem.images.length}
              </Text>
            ) : null}
            {galleryItem?.title ? (
              <Text style={{ textAlign: 'center', color: '#FFFFFF', fontFamily: 'Cairo-SemiBold', fontSize: 15, paddingVertical: 20, paddingHorizontal: 24, writingDirection: 'rtl' }}>
                {galleryItem.title}
              </Text>
            ) : null}
          </SafeAreaView>
        </View>
      </Modal>

      {/* ═══ CUSTOM REPORT MODAL ═══ */}
      <Modal visible={showReportModal} transparent animationType="slide" onRequestClose={() => setShowReportModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ width: '100%', backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, borderWidth: 1, borderColor: colors.border }}>
            <View style={{ ...rtlRow(), justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontFamily: 'Cairo-Bold', color: colors.textPrimary, textAlign: 'right' }}>الإبلاغ عن التقييم</Text>
              <Pressable onPress={() => setShowReportModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View style={{ gap: 8, marginBottom: 20 }}>
              {(
                [
                  { type: 'offensive' as const, label: 'محتوى مسيء أو غير لائق' },
                  { type: 'misleading' as const, label: 'معلومات مضللة أو كاذبة' },
                  { type: 'spam' as const, label: 'رسائل مزعجة (سبام)' },
                  { type: 'other' as const, label: 'سبب آخر (اكتبه بالأسفل)' }
                ] as const
              ).map((opt) => {
                const isSelected = reportReasonType === opt.type;
                return (
                  <Pressable key={opt.type} onPress={() => { setReportReasonType(opt.type); setReportError(''); }} style={{ ...rtlRow(), alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, backgroundColor: isSelected ? colors.primarySoft : 'transparent' }}>
                    <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: isSelected ? colors.primary : colors.border, alignItems: 'center', justifyContent: 'center' }}>
                      {isSelected && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary }} />}
                    </View>
                    <Text style={{ fontSize: 14, fontFamily: 'Cairo-SemiBold', color: colors.textPrimary, flex: 1, textAlign: 'right' }}>{opt.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={{ fontSize: 13, fontFamily: 'Cairo-Bold', color: colors.textSecondary, textAlign: 'right', marginBottom: 8 }}>تفاصيل البلاغ</Text>
            <TextInput
              value={customReportReason}
              onChangeText={(text) => { setCustomReportReason(text); setReportError(''); }}
              placeholder="اكتب تفاصيل البلاغ هنا... (10 أحرف على الأقل)"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              style={{ width: '100%', minHeight: 100, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, textAlign: 'right', fontFamily: 'Cairo-Regular', color: colors.textPrimary, backgroundColor: colors.surfaceAlt, marginBottom: 16 }}
            />

            {reportError ? (
              <Text style={{ color: colors.error, fontFamily: 'Cairo-Bold', fontSize: 12, textAlign: 'right', marginBottom: 12 }}>{reportError}</Text>
            ) : null}

            <View style={{ ...rtlRow(), gap: 12 }}>
              <Pressable onPress={handleReportSubmit} style={{ flex: 1, backgroundColor: colors.primary, borderRadius: 14, height: 48, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 14, fontFamily: 'Cairo-Bold', color: colors.textOnPrimary }}>إرسال البلاغ</Text>
              </Pressable>
              <Pressable onPress={() => setShowReportModal(false)} style={{ flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: 14, height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ fontSize: 14, fontFamily: 'Cairo-Bold', color: isDark ? '#FFFFFF' : colors.textSecondary }}>إلغاء</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ═══ CUSTOM SYSTEM ALERTS MODAL (shared) ═══ */}
      <RTLAlert alert={alert} onDismiss={hideAlert} />

      {/* ═══ REVIEW ACTION WINDOW MODAL ═══ */}
      <Modal visible={showReviewModal} transparent animationType="slide" onRequestClose={() => setShowReviewModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
          <View style={{ ...rtlRow(), justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 24, paddingBottom: 14, borderBottomWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}>
            <View style={{ alignItems: 'flex-end', flex: 1, paddingLeft: 12 }}>
              <Text style={{ fontSize: 18, fontFamily: 'Cairo-Black', color: colors.textPrimary, textAlign: 'right' }}>قيّم الخدمة</Text>
              <Text style={{ marginTop: 2, fontSize: 12, fontFamily: 'Cairo-Regular', color: colors.textMuted, textAlign: 'right' }}>أضف عدد النجوم ثم اكتب تجربتك إن أحببت</Text>
            </View>
            <Pressable
              onPress={() => setShowReviewModal(false)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="إغلاق"
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: pressed ? colors.surfaceAlt : 'transparent',
              })}
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>
          <ScrollView style={{ flex: 1, paddingHorizontal: 16 }}>
            <Text style={{ marginBottom: 12, marginTop: 24, textAlign: 'right', fontSize: 14, fontFamily: 'Cairo-SemiBold', color: colors.textPrimary }}>تقييمك</Text>
            <View style={{ alignItems: 'center' }}>
              <StarRating value={reviewRating} size={40} interactive onChange={setReviewRating} />
              <Text style={{ marginTop: 10, fontSize: 13, fontFamily: 'Cairo-SemiBold', color: reviewRating ? colors.primary : colors.textMuted, textAlign: 'center' }}>
                {reviewRating ? `تقييمك: ${reviewRating} من 5` : 'اضغط على النجوم لإضافة التقييم'}
              </Text>
            </View>
            <Text style={{ marginBottom: 8, marginTop: 20, textAlign: 'right', fontSize: 14, fontFamily: 'Cairo-SemiBold', color: colors.textPrimary }}>تعليقك (اختياري)</Text>
            <TextInput
              value={reviewComment}
              onChangeText={setReviewComment}
              placeholder="اكتب تجربتك بالتفصيل هنا..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={5}
              style={{ width: '100%', minHeight: 120, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, textAlign: 'right', fontFamily: 'Cairo-Regular', color: colors.textPrimary, backgroundColor: colors.surface }}
            />
            {reviewError ? (
              <Text style={{ color: colors.error, fontFamily: 'Cairo-Bold', fontSize: 13, textAlign: 'right', marginTop: 12 }}>{reviewError}</Text>
            ) : null}
          </ScrollView>
          <Pressable onPress={handleReviewSubmit} disabled={!reviewRating || submitReview.isPending} style={{ marginHorizontal: 16, marginBottom: 16, alignItems: 'center', borderRadius: 16, paddingVertical: 16, backgroundColor: reviewRating ? colors.primary : colors.surfaceAlt }}>
            <Text style={{ fontFamily: 'Cairo-Bold', color: isDark ? '#FFFFFF' : reviewRating ? '#FFFFFF' : colors.textSecondary }}>
              {submitReview.isPending ? 'جاري الإرسال...' : reviewRating ? 'إرسال التقييم' : 'اختر التقييم أولاً'}
            </Text>
          </Pressable>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
