import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ActivityIndicator, Dimensions, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import type { PortfolioItem, Review, ProviderCredential } from '../../src/types';
import type { ThemeColors } from '../../src/theme/tokens';
import { StarRating } from '../ui/StarRating';
import { formatRelativeTime, formatIssueDate } from '../../src/utils/date';
import { formatArabicReviewCount, toEnglishNumbers } from '../../src/utils/numberFormatter';
import { getServiceIcon, getAvatarTheme } from '../../src/utils/providerMappers';
import { useTheme } from '../../src/hooks/useTheme';
import { openExternalUrl } from '../../src/utils/links';
import { rtlRow } from '../../src/utils/rtl';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const SectionHeader = React.memo(({ title, colors }: { title: string; colors: ThemeColors }) => {
  return (
    <View style={{
      ...rtlRow(),
      alignItems: 'center',
      gap: 10,
      marginBottom: 16,
      width: '100%',
      paddingHorizontal: 4
    }}>
      <View style={{ width: 4, height: 20, backgroundColor: colors.primary, borderRadius: 4 }} />
      <Text style={{
        fontSize: 17,
        fontFamily: 'Cairo-Bold',
        color: colors.textPrimary,
        textAlign: 'right',
        writingDirection: 'rtl',
        lineHeight: Platform.select({ ios: 26, android: 24 })
      }}>
        {title}
      </Text>
    </View>
  );
});

interface AboutSectionProps {
  about: string | null;
  colors: ThemeColors;
}
export function AboutSection({ about, colors }: AboutSectionProps) {
  const [expanded, setExpanded] = useState(false);
  if (!about) return null;
  const shouldShowToggle = about.length > 180;

  return (
    <View style={{ marginBottom: 8, width: '100%' }}>
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
              gap: 4,
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
export function ServicesSection({ services, colors }: ServicesSectionProps) {
  if (!services || services.length === 0) return null;

  return (
    <View style={{ marginBottom: 8, width: '100%' }}>
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
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 16,
              paddingHorizontal: 12,
              paddingVertical: 12,
              shadowColor: colors.shadow,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0,
              shadowRadius: 4,
              elevation: 0,
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
export function PortfolioSection({ projects, colors, onImagePress }: PortfolioSectionProps) {
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
    <View style={{ marginBottom: 8, width: '100%' }}>
      <SectionHeader title="معرض الأعمال" colors={colors} />
      <ScrollView
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
                borderRadius: 20,
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
                      contentFit="contain"
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
                        {toEnglishNumbers(imageCount)} صور
                      </Text>
                    </View>
                  )}
                </View>
              )}
              <View style={{ padding: 16, alignItems: 'flex-end', width: '100%' }}>
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
                )}
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
export function CredentialsSection({ credentials, colors }: CredentialsSectionProps) {
  if (!credentials || credentials.length === 0) return null;
  return (
    <View style={{ marginBottom: 0, width: '100%' }}>
      <SectionHeader title="الشهادات والمؤهلات" colors={colors} />
      <View style={{ gap: 12, width: '100%' }}>
        {credentials.map((cred) => (
          <View
            key={cred.id}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 16,
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
              <View style={{ ...rtlRow(), alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
                <Text
                  style={{
                    fontFamily: 'Cairo-Regular',
                    fontSize: 13,
                    color: colors.textMuted,
                    textAlign: 'right',
                    writingDirection: 'rtl',
                  }}
                >
                  تاريخ الإصدار: {toEnglishNumbers(formatIssueDate(cred.issue_date))}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

export function ReviewCard({
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
        <View style={{ ...rtlRow(), alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <Text style={{ fontSize: 15, fontFamily: 'Cairo-Bold', color: colors.textPrimary, textAlign: 'right' }}>
            {review.user_name}
          </Text>
          <View style={{ ...rtlRow(), alignItems: 'center', gap: 10 }}>
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
        <View style={{ ...rtlRow(), marginTop: 2, marginBottom: 6 }}>
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

export function ReviewsSection({
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
          التقييمات ({toEnglishNumbers(reviewsCount)})
        </Text>
      </View>
      {reviewsCount > 0 && (
        <View
          style={{
            marginBottom: 14,
            borderRadius: 20,
            backgroundColor: colors.surface,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border,
            ...rtlRow(),
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ alignItems: 'center', width: '35%' }}>
            <Text style={{ fontSize: 36, fontFamily: 'Cairo-Black', color: colors.textPrimary, lineHeight: 46 }}>
              {toEnglishNumbers(rating.toFixed(1))}
            </Text>
            <StarRating value={rating} size={16} />
            <Text style={{ fontSize: 13, fontFamily: 'Cairo-SemiBold', color: colors.textMuted, marginTop: 4, textAlign: 'center' }}>
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
          <View style={{ marginBottom: 20, ...rtlRow(), alignItems: 'center' }}>
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
                marginBottom: 14,
                ...rtlRow(),
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
        <View style={{ marginBottom: 20, ...rtlRow(), alignItems: 'center' }}>
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
            alignItems: 'flex-end',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.primary,
            paddingVertical: 12,
            paddingHorizontal: 16,
          }}
        >
          <View style={{ ...rtlRow(), alignItems: 'center', gap: 6 }}>
            <Text style={{ fontFamily: 'Cairo-Bold', color: colors.primary, fontSize: 14 }}>
              عرض كل التقييمات ({reviews.length})
            </Text>
            <Ionicons name="chevron-down" size={16} color={colors.primary} />
          </View>
        </Pressable>
      )}
      {showAll && hasMore && (
        <Pressable
          onPress={onLoadMore}
          disabled={isFetching}
          style={{
            marginTop: 8,
            alignItems: 'flex-end',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.primary,
            paddingVertical: 12,
            paddingHorizontal: 16,
          }}
        >
          {isFetching ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <View style={{ ...rtlRow(), alignItems: 'center', gap: 6 }}>
              <Text style={{ fontFamily: 'Cairo-Bold', color: colors.primary, fontSize: 14 }}>
                تحميل المزيد من التقييمات
              </Text>
              <Ionicons name="chevron-down" size={16} color={colors.primary} />
            </View>
          )}
        </Pressable>
      )}
    </View>
  );
}
