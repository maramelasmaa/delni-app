import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Dimensions, Modal, Pressable, ScrollView, Text, TextInput, View, KeyboardAvoidingView, Platform } from 'react-native';
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

  const mapUrl = (rawSocials as any).map_url || anyProvider.map_url;
  if (mapUrl) {
    socialLinks.push({ id: 'map', icon: 'map-outline', color: '#34D399', url: mapUrl });
  }

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
    serviceAreaNote: provider.service_area_note || null,
    isFeatured: !!provider.is_featured,
    isFavorited: !!provider.is_favorited,
    canReview: !!provider.can_review,
    reviewStatusMessage: provider.review_status_message || null,
  };
}

function getAvatarTheme(name: string, isDark: boolean) {
  const cleanName = name?.trim() || 'U';
  const colorsList = isDark ? [
    { bg: 'rgba(235, 94, 40, 0.15)', text: '#EB5E28' },
    { bg: 'rgba(74, 115, 232, 0.15)', text: '#4A73E8' },
    { bg: 'rgba(38, 166, 154, 0.15)', text: '#26A69A' },
    { bg: 'rgba(156, 39, 176, 0.15)', text: '#9C27B0' },
    { bg: 'rgba(233, 30, 99, 0.15)', text: '#E91E63' },
    { bg: 'rgba(76, 175, 80, 0.15)', text: '#4CAF50' },
  ] : [
    { bg: '#FFEBE5', text: '#EB5E28' },
    { bg: '#EBF0FF', text: '#4A73E8' },
    { bg: '#E0F2F1', text: '#00695C' },
    { bg: '#F3E5F5', text: '#6A1B9A' },
    { bg: '#FCE4EC', text: '#C2185B' },
    { bg: '#E8F5E9', text: '#2E7D32' },
  ];
  let sum = 0;
  for (let i = 0; i < cleanName.length; i++) {
    sum += cleanName.charCodeAt(i);
  }
  return colorsList[sum % colorsList.length];
}

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
    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 16, width: '100%' }}>
      <View style={{ width: 4, height: 18, backgroundColor: colors.primary, borderRadius: 2 }} />
      <Text style={{ fontSize: 16, fontFamily: 'Cairo-Black', color: colors.textPrimary, textAlign: 'right', writingDirection: 'rtl' }}>
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
    <View style={{ marginBottom: 36, width: '100%' }}>
      <SectionHeader title="نبذة عنا" colors={colors} />
      <View
        style={{
          borderRadius: 20,
          backgroundColor: colors.surface,
          padding: 18,
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.02,
          shadowRadius: 8,
          elevation: 1,
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
              marginTop: 14,
              alignSelf: 'flex-start',
              flexDirection: 'row-reverse',
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

interface ServicesSectionProps {
  services: Array<{ id: number; name: string; slug: string }> | null;
  colors: ThemeColors;
}
function ServicesSection({ services, colors }: ServicesSectionProps) {
  if (!services || services.length === 0) return null;

  return (
    <View style={{ marginBottom: 36, width: '100%' }}>
      <SectionHeader title="الخدمات المقدمة" colors={colors} />
      <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 12, width: '100%' }}>
        {services.map((svc) => (
          <View
            key={svc.id}
            style={{
              flexDirection: 'row-reverse',
              alignItems: 'center',
              gap: 12,
              width: '48%',
              flexGrow: 1,
              minWidth: 140,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 16,
              paddingHorizontal: 14,
              paddingVertical: 14,
              shadowColor: colors.shadow,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.02,
              shadowRadius: 4,
              elevation: 1,
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
                fontSize: 12.5,
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
  if (!projects || projects.length === 0) return null;

  const cardWidth = SCREEN_WIDTH - 32;
  const gapSize = 12;

  const handleScroll = (event: any) => {
    const xOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(xOffset / (cardWidth + gapSize));
    const boundedIndex = Math.max(0, Math.min(projects.length - 1, index));
    setActiveIndex(boundedIndex);
  };

  return (
    <View style={{ marginBottom: 36, width: '100%' }}>
      <SectionHeader title="معرض الأعمال" colors={colors} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + gapSize}
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          flexDirection: 'row-reverse',
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
                borderRadius: 20,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                overflow: 'hidden',
                shadowColor: colors.shadow,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.03,
                shadowRadius: 8,
                elevation: 2,
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
                        flexDirection: 'row-reverse',
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
              <View style={{ padding: 18, alignItems: 'flex-end', width: '100%' }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: 'Cairo-Bold',
                    color: colors.textPrimary,
                    textAlign: 'right',
                    writingDirection: 'rtl',
                  }}
                >
                  {project.title}
                </Text>
                {project.short_description && (
                  <Text
                    numberOfLines={3}
                    style={{
                      marginTop: 10,
                      fontSize: 13.5,
                      fontFamily: 'Cairo-Regular',
                      color: colors.textSecondary,
                      textAlign: 'right',
                      writingDirection: 'rtl',
                      lineHeight: 21,
                    }}
                  >
                    {project.short_description}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {projects.length > 1 && (
        <View
          style={{
            flexDirection: 'row-reverse',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 6,
            marginTop: 14,
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
    <View style={{ marginBottom: 36, width: '100%' }}>
      <SectionHeader title="الشهادات والمؤهلات" colors={colors} />
      <View style={{ gap: 14, width: '100%' }}>
        {credentials.map((cred) => (
          <View
            key={cred.id}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 18,
              borderWidth: 1,
              borderColor: colors.border,
              borderRightWidth: 4,
              borderRightColor: colors.gold,
              shadowColor: colors.shadow,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.02,
              shadowRadius: 4,
              elevation: 1,
            }}
          >
            <Text
              style={{
                fontFamily: 'Cairo-Bold',
                fontSize: 14,
                color: colors.textPrimary,
                textAlign: 'right',
                writingDirection: 'rtl',
                marginBottom: 4,
              }}
            >
              {cred.title}
            </Text>
            {cred.issuer && (
              <Text
                style={{
                  fontFamily: 'Cairo-SemiBold',
                  fontSize: 12.5,
                  color: colors.textSecondary,
                  textAlign: 'right',
                  writingDirection: 'rtl',
                  marginBottom: 2,
                }}
              >
                جهة الإصدار: {cred.issuer}
              </Text>
            )}
            {cred.issue_date && (
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
                <Text
                  style={{
                    fontFamily: 'Cairo-Regular',
                    fontSize: 11,
                    color: colors.textMuted,
                    textAlign: 'right',
                    writingDirection: 'rtl',
                  }}
                >
                  تاريخ الإصدار: {formatIssueDate(cred.issue_date)}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

function ReviewCard({ review, colors, onReport, isLast }: { review: Review; colors: ThemeColors; onReport: (reviewId: number) => void; isLast?: boolean }) {
  const { isDark } = useTheme();
  const avatarTheme = getAvatarTheme(review.user_name, isDark);
  const initial = (review.user_name || 'U').trim().charAt(0).toUpperCase();
  return (
    <View
      style={{
        flexDirection: 'row-reverse',
        paddingBottom: 16,
        marginBottom: 16,
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
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <Text style={{ fontSize: 15, fontFamily: 'Cairo-Bold', color: colors.textPrimary, textAlign: 'right' }}>
            {review.user_name}
          </Text>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
            <Text style={{ fontSize: 12, color: colors.textMuted, fontFamily: 'Cairo-Regular' }}>
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
        <View style={{ flexDirection: 'row-reverse', marginTop: 2, marginBottom: 6 }}>
          <StarRating value={review.rating} size={13} />
        </View>
        {review.comment ? (
          <Text
            style={{
              textAlign: 'right',
              fontSize: 14,
              color: colors.textSecondary,
              fontFamily: 'Cairo-Regular',
              writingDirection: 'rtl',
              lineHeight: 22,
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
    <View style={{ width: '100%', marginTop: 28 }}>
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <View style={{ width: 14, height: 3, backgroundColor: colors.gold, borderRadius: 2 }} />
        <Text style={{ fontSize: 16, fontFamily: 'Cairo-Bold', color: colors.textPrimary, textAlign: 'right' }}>
          التقييمات ({reviewsCount})
        </Text>
      </View>
      {reviewsCount > 0 && (
        <View
          style={{
            marginBottom: 20,
            borderRadius: 20,
            backgroundColor: colors.surface,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border,
            flexDirection: 'row-reverse',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ alignItems: 'center', width: '35%' }}>
            <Text style={{ fontSize: 36, fontFamily: 'Cairo-Black', color: colors.textPrimary, lineHeight: 46 }}>
              {rating.toFixed(1)}
            </Text>
            <StarRating value={rating} size={16} />
            <Text style={{ fontSize: 13, fontFamily: 'Cairo-SemiBold', color: colors.textMuted, marginTop: 4, textAlign: 'center' }}>
              بناءً على {reviewsCount} تقييم
            </Text>
          </View>
          <View style={{ width: '60%', gap: 4 }}>
            {[5, 4, 3, 2, 1].map((stars) => {
              let weight = 0.1;
              if (stars === Math.round(rating)) weight = 0.8;
              else if (stars === Math.round(rating) - 1) weight = 0.4;
              else if (stars === Math.round(rating) + 1) weight = 0.2;
              return (
                <View key={stars} style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
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
          <View style={{ marginBottom: 20, flexDirection: 'row-reverse', alignItems: 'center' }}>
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
                flexDirection: 'row-reverse',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderRadius: 24,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surface,
                paddingHorizontal: 16,
                paddingVertical: 12,
              }}
            >
              <Text style={{ fontSize: 15, fontFamily: 'Cairo-Regular', color: colors.textMuted }}>
                شارك الآخرين تجربتك، أضف تقييماً...
              </Text>
              <Ionicons name="create-outline" size={18} color={colors.textMuted} />
            </Pressable>
          </View>
        ) : (
          reviewStatusMessage ? (
            <View
              style={{
                marginBottom: 20,
                flexDirection: 'row-reverse',
                alignItems: 'center',
                gap: 10,
                borderRadius: 16,
                backgroundColor: colors.surfaceAlt,
                paddingHorizontal: 16,
                paddingVertical: 12
              }}
            >
              <Ionicons name="information-circle-outline" size={22} color={colors.textSecondary} />
              <Text style={{ flex: 1, textAlign: 'right', fontSize: 14, color: colors.textSecondary, fontFamily: 'Cairo-Regular', writingDirection: 'rtl', lineHeight: 20 }}>
                {reviewStatusMessage}
              </Text>
            </View>
          ) : null
        )
      ) : (
        <View style={{ marginBottom: 20, flexDirection: 'row-reverse', alignItems: 'center' }}>
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
              flexDirection: 'row-reverse',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderRadius: 24,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surfaceAlt,
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}
          >
            <Text style={{ fontSize: 15, fontFamily: 'Cairo-SemiBold', color: colors.textSecondary }}>
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
            marginTop: 8,
            alignItems: 'center',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.primary,
            paddingVertical: 12,
          }}
        >
          <Text style={{ fontFamily: 'Cairo-Bold', color: colors.primary, fontSize: 14 }}>
            عرض كل التقييمات ({reviews.length})
          </Text>
        </Pressable>
      )}
      {showAll && hasMore && (
        <Pressable
          onPress={onLoadMore}
          disabled={isFetching}
          style={{
            marginTop: 8,
            alignItems: 'center',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.primary,
            paddingVertical: 12,
          }}
        >
          {isFetching ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={{ fontFamily: 'Cairo-Bold', color: colors.primary, fontSize: 14 }}>
              تحميل المزيد من التقييمات
            </Text>
          )}
        </Pressable>
      )}
    </View>
  );
}

export default function ProviderScreen() {
  const { colors, isDark } = useTheme();
  const { slug, writeReview, reportReviewId } = useLocalSearchParams<{ slug: string; writeReview?: string; reportReviewId?: string }>();
  const { data: provider, isLoading, isError, refetch } = useProvider(slug);
  const [reviewPage, setReviewPage] = useState(1);
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const prevSlugRef = useRef(slug);
  const { data: reviewsData, isFetching: isFetchingReviews } = useProviderReviews(slug, reviewPage);

  if (prevSlugRef.current !== slug) {
    prevSlugRef.current = slug;
    setReviewPage(1);
    setAllReviews([]);
  }

  useEffect(() => {
    const fresh = reviewsData?.data;
    if (!fresh?.length) return;
    setAllReviews((prev) =>
      reviewPage === 1 ? fresh : [...prev, ...fresh.filter((r) => !prev.some((x) => x.id === r.id))]
    );
  }, [reviewsData?.data, reviewPage]);

  const toggleFavorite = useToggleFavorite();
  const submitReview = useSubmitReview();
  const flagReview = useFlagReview();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const scrollViewRef = useRef<ScrollView>(null);

  const [customAlert, setCustomAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons: Array<{ text: string; style?: 'cancel' | 'destructive' | 'default'; onPress?: () => void }>;
  }>({
    visible: false,
    title: "",
    message: "",
    buttons: [],
  });

  const showRTLAlert = useCallback((
    title: string,
    message: string,
    buttons: Array<{ text: string; style?: 'cancel' | 'destructive' | 'default'; onPress?: () => void }>
  ) => {
    setCustomAlert({ visible: true, title, message, buttons });
  }, []);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReviewIdState, setReportReviewIdState] = useState<number | null>(null);
  const [reportReasonType, setReportReasonType] = useState<'offensive' | 'misleading' | 'spam' | 'other'>('offensive');
  const [customReportReason, setCustomReportReason] = useState("");
  const [reportError, setReportError] = useState("");

  const handleReportSubmit = useCallback(() => {
    if (!reportReviewIdState) return;
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
        onError: () => {
          setReportError('تعذر إرسال البلاغ، يرجى المحاولة مجدداً.');
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
    setReportReviewIdState(reviewId);
    setShowReportModal(true);
  }, [isAuthenticated, slug, showRTLAlert]);

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
  if (isError || !provider) return <ErrorView onRetry={refetch} />;

  const profile = mapProviderProfile(provider);
  const HERO_HEIGHT = 250;
  const AVATAR_SIZE = 140;

  const translatedType = (() => {
    if (!profile.providerType) return null;
    const t = profile.providerType.toLowerCase().trim();
    if (t === 'individual') return 'مستقل';
    if (t === 'company') return 'شركة';
    if (t === 'agency') return 'وكالة';
    return profile.providerType;
  })();

  const specs = [];
  if (profile.cityName) {
    specs.push({
      id: 'city',
      icon: 'location-outline',
      label: 'المدينة',
      value: profile.cityName,
    });
  }
  if (profile.yearsExperienceText) {
    specs.push({
      id: 'exp',
      icon: 'ribbon-outline',
      label: 'الخبرة',
      value: profile.yearsExperienceText,
    });
  }
  specs.push({
    id: 'work',
    icon: 'desktop-outline',
    label: 'طبيعة العمل',
    value: profile.worksRemotely ? 'عمل عن بعد' : 'عمل حضوري',
  });

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
          <View style={{ position: 'absolute', top: insets.top + 12, left: 16, right: 16, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', zIndex: 30 }}>
            <Pressable
              onPress={() => router.back()}
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
                borderRadius: 24,
                borderWidth: 4,
                borderColor: colors.surface,
                backgroundColor: colors.surface,
                shadowColor: colors.shadow,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 8,
                overflow: 'hidden',
              }}
            >
              {profile.avatarUrl ? (
                <Image source={{ uri: profile.avatarUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
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
            marginTop: AVATAR_SIZE / 2 + 8,
            marginHorizontal: 16,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 20,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.05,
            shadowRadius: 16,
            elevation: 4,
          }}
        >
          {/* Name & Info - Centered */}
          <View style={{ width: '100%', alignItems: 'center', gap: 12 }}>
            <Text numberOfLines={2} style={{ fontSize: 20, fontFamily: 'Cairo-Black', color: colors.textPrimary, textAlign: 'center', writingDirection: 'rtl', lineHeight: 28 }}>
              {profile.name}
            </Text>

            {/* Type & Category & Rating Badges - Same Line */}
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {translatedType && (
                <View style={{ backgroundColor: colors.primarySoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
                  <Text style={{ fontSize: 11, fontFamily: 'Cairo-Bold', color: colors.primary }}>
                    {translatedType}
                  </Text>
                </View>
              )}

              {profile.categoryName && (
                <View style={{ backgroundColor: 'rgba(59,130,246,0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
                  <Text style={{ fontSize: 11, fontFamily: 'Cairo-SemiBold', color: colors.primary }}>
                    {profile.categoryName}
                  </Text>
                </View>
              )}

              {profile.rating > 0 && (
                <View style={{ backgroundColor: 'rgba(234,179,8,0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, flexDirection: 'row-reverse', alignItems: 'center', gap: 3 }}>
                  <Ionicons name="star" size={11} color={colors.gold} />
                  <Text style={{ fontFamily: 'Cairo-Bold', fontSize: 11, color: colors.gold }}>
                    {profile.rating.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Quick Specs Dashboard Bar */}
          <View style={{
            flexDirection: 'row-reverse',
            width: '100%',
            backgroundColor: colors.surfaceAlt,
            borderRadius: 18,
            paddingVertical: 18,
            paddingHorizontal: 12,
            marginTop: 24,
            alignItems: 'center',
            justifyContent: 'space-around',
          }}>
            {specs.map((spec, index) => (
              <React.Fragment key={spec.id}>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Ionicons name={spec.icon as any} size={16} color={colors.primary} style={{ marginBottom: 4 }} />
                  <Text numberOfLines={1} style={{ fontFamily: 'Cairo-Bold', fontSize: 12.5, color: colors.textPrimary, textAlign: 'center' }}>
                    {spec.value}
                  </Text>
                  <Text style={{ fontFamily: 'Cairo-Regular', fontSize: 10, color: colors.textMuted, textAlign: 'center', marginTop: 2 }}>
                    {spec.label}
                  </Text>
                </View>
                {index < specs.length - 1 && (
                  <View style={{ width: 1, height: 26, backgroundColor: colors.border }} />
                )}
              </React.Fragment>
            ))}
          </View>

          {/* Action Call & WhatsApp Buttons */}
          {(profile.phone || profile.whatsappUrl) && (
            <View style={{ flexDirection: 'row-reverse', width: '100%', gap: 14, marginTop: 24 }}>
              {profile.whatsappUrl && (
                <Pressable
                  onPress={handleWhatsApp}
                  style={{
                    flex: profile.phone ? 1 : undefined,
                    width: profile.phone ? undefined : '100%',
                    height: 48,
                    borderRadius: 14,
                    backgroundColor: '#25D366',
                    flexDirection: 'row-reverse',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    shadowColor: '#25D366',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 6,
                    elevation: 2,
                  }}
                >
                  <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
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
                    borderRadius: 14,
                    backgroundColor: colors.primary,
                    flexDirection: 'row-reverse',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 6,
                    elevation: 2,
                  }}
                >
                  <Ionicons name="call" size={16} color={colors.textOnPrimary} />
                  <Text style={{ fontFamily: 'Cairo-Bold', fontSize: 13.5, color: colors.textOnPrimary }}>اتصال هاتفي</Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Social Links Row */}
          {profile.socialLinks.length > 0 && (
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 18, marginTop: 24, paddingTop: 20, borderTopWidth: 1, borderColor: colors.border, width: '100%' }}>
              {profile.socialLinks.map((item) => (
                <Pressable key={item.id} onPress={() => openExternalUrl(item.url)} style={({ pressed }) => ({ width: 38, height: 38, borderRadius: 10, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1, borderWidth: 1, borderColor: colors.border })}>
                  <Ionicons name={item.icon} size={18} color={item.color} />
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* ═══ CORE SECTIONS (About, Services, Portfolio, Credentials) ═══ */}
        <View style={{ paddingHorizontal: 16, marginTop: 32 }}>
          {profile.about && <AboutSection about={profile.about} colors={colors} />}
          <ServicesSection services={profile.services} colors={colors} />
          <PortfolioSection projects={profile.projects} colors={colors} onImagePress={(item, idx) => { setGalleryItem(item); setGalleryIndex(idx); }} />
          <CredentialsSection credentials={profile.credentials} colors={colors} />
        </View>

        {/* ═══ REVIEWS SECTION (Pasted Old Design) ═══ */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 40, marginTop: 32 }}>
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
            <View style={{ position: 'absolute', top: insets.top + 16, left: 16, zIndex: 99 }}>
              <Pressable onPress={() => setGalleryItem(null)} style={{ height: 40, width: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)' }}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </Pressable>
            </View>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              {galleryItem?.images && galleryItem.images.length > 0 && (
                <Image source={{ uri: galleryItem.images[galleryIndex] }} style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 1.2 }} contentFit="contain" />
              )}
            </View>
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
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontFamily: 'Cairo-Bold', color: colors.textPrimary, textAlign: 'right' }}>الإبلاغ عن التقييم</Text>
              <Pressable onPress={() => setShowReportModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View style={{ gap: 8, marginBottom: 20 }}>
              {[
                { type: 'offensive', label: 'محتوى مسيء أو غير لائق' },
                { type: 'misleading', label: 'معلومات مضللة أو كاذبة' },
                { type: 'spam', label: 'رسائل مزعجة (سبام)' },
                { type: 'other', label: 'سبب آخر (اكتبه بالأسفل)' }
              ].map((opt) => {
                const isSelected = reportReasonType === opt.type;
                return (
                  <Pressable key={opt.type} onPress={() => { setReportReasonType(opt.type as any); setReportError(''); }} style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, backgroundColor: isSelected ? colors.primarySoft : 'transparent' }}>
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

            <View style={{ flexDirection: 'row-reverse', gap: 12 }}>
              <Pressable onPress={handleReportSubmit} style={{ flex: 1, backgroundColor: colors.primary, borderRadius: 14, height: 48, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 14, fontFamily: 'Cairo-Bold', color: colors.textOnPrimary }}>إرسال البلاغ</Text>
              </Pressable>
              <Pressable onPress={() => setShowReportModal(false)} style={{ flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: 14, height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ fontSize: 14, fontFamily: 'Cairo-Bold', color: colors.textSecondary }}>إلغاء</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ═══ CUSTOM SYSTEM ALERTS MODAL ═══ */}
      <Modal visible={customAlert.visible} transparent animationType="fade" onRequestClose={() => setCustomAlert((prev) => ({ ...prev, visible: false }))}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ width: '90%', maxWidth: 360, backgroundColor: colors.surface, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontFamily: 'Cairo-Bold', color: colors.textPrimary, marginBottom: 12, textAlign: 'center' }}>{customAlert.title}</Text>
            <Text style={{ fontSize: 14, fontFamily: 'Cairo-SemiBold', color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 24, writingDirection: 'rtl' }}>{customAlert.message}</Text>
            <View style={{ width: '100%', flexDirection: customAlert.buttons.length === 2 ? 'row-reverse' : 'column', gap: 10 }}>
              {customAlert.buttons.length === 0 ? (
                <Pressable onPress={() => setCustomAlert((prev) => ({ ...prev, visible: false }))} style={{ width: '100%', height: 44, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: colors.textOnPrimary, fontFamily: 'Cairo-Bold', fontSize: 14 }}>حسناً</Text>
                </Pressable>
              ) : (
                customAlert.buttons.map((btn, idx) => {
                  const isCancel = btn.style === 'cancel';
                  return (
                    <Pressable key={idx} onPress={() => { setCustomAlert((prev) => ({ ...prev, visible: false })); btn.onPress?.(); }} style={{ flex: customAlert.buttons.length === 2 ? 1 : undefined, width: '100%', height: 44, borderRadius: 12, backgroundColor: isCancel ? colors.surfaceAlt : colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: isCancel ? 1 : 0, borderColor: colors.border }}>
                      <Text style={{ fontFamily: 'Cairo-Bold', fontSize: 14, color: isCancel ? colors.textSecondary : colors.textOnPrimary }}>{btn.text}</Text>
                    </Pressable>
                  );
                })
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* ═══ REVIEW ACTION WINDOW MODAL ═══ */}
      <Modal visible={showReviewModal} transparent animationType="slide" onRequestClose={() => setShowReviewModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}>
            <Text style={{ fontSize: 18, fontFamily: 'Cairo-Black', color: colors.textPrimary }}>أضف تقييمك</Text>
            <Pressable onPress={() => setShowReviewModal(false)}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>
          <ScrollView style={{ flex: 1, paddingHorizontal: 16 }}>
            <Text style={{ marginBottom: 12, marginTop: 24, textAlign: 'right', fontSize: 14, fontFamily: 'Cairo-SemiBold', color: colors.textPrimary }}>تقييمك</Text>
            <View style={{ alignItems: 'center' }}>
              <StarRating value={reviewRating} size={40} interactive onChange={setReviewRating} />
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
            <Text style={{ fontFamily: 'Cairo-Bold', color: reviewRating ? colors.textOnPrimary : colors.textMuted }}>
              {submitReview.isPending ? 'جاري الإرسال...' : 'إرسال التقييم'}
            </Text>
          </Pressable>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}