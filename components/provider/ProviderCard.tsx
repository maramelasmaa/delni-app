import React, { useState, useCallback, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Dimensions, Modal, Pressable, ScrollView, Text, TextInput, View, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StarRating } from '../../components/ui/StarRating';
import { ErrorView } from '../../components/ui/ErrorView';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useTheme } from '../../src/hooks/useTheme';
import { useProviderDetail } from '../../src/hooks/useProviderDetail';
import { useReviewModal } from '../../src/hooks/useReviewModal';
import { useReportModal } from '../../src/hooks/useReportModal';
import type { ThemeColors } from '../../src/theme/tokens';
import type { PortfolioItem } from '../../src/types';
import { buildSocialUrl, openExternalUrl } from '../../src/utils/links';
import { getAvatarTheme } from '../../src/utils/providerMappers';
import { formatArabicReviewCount, toEnglishNumbers } from '../../src/utils/numberFormatter';
import { rtlRow } from '../../src/utils/rtl';
import {
  SectionHeader,
  AboutSection,
  ServicesSection,
  PortfolioSection,
  CredentialsSection,
  ReviewCard,
  ReviewsSection,
} from './ProviderSections';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProviderScreen() {
  const { colors, isDark } = useTheme();
  const { slug, writeReview, reportReviewId } = useLocalSearchParams<{ slug: string; writeReview?: string; reportReviewId?: string }>();
  const scrollViewRef = useRef<ScrollView>(null);

  // Hooks for business logic
  const detail = useProviderDetail(slug as string);
  const reviewModal = useReviewModal(slug as string);
  const reportModal = useReportModal();

  // Custom alert state
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

  const handleReportReview = useCallback((reviewId: number) => {
    if (!detail.isAuthenticated) {
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
    reportModal.setReportReviewIdState(reviewId);
    reportModal.setShowReportModal(true);
  }, [detail.isAuthenticated, slug, showRTLAlert, reportModal]);

  React.useEffect(() => {
    if (writeReview === 'true' && detail.isAuthenticated && detail.provider) {
      if (!detail.provider.can_review) {
        showRTLAlert('تعذر كتابة تقييم', detail.provider.review_status_message ?? "", [{ text: 'حسناً', style: 'default' }]);
        router.setParams({ writeReview: undefined });
        return;
      }
      reviewModal.setShowReviewModal(true);
      const timer = setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 500);
      router.setParams({ writeReview: undefined });
      return () => clearTimeout(timer);
    }
  }, [writeReview, detail.isAuthenticated, detail.provider, reviewModal, showRTLAlert]);

  React.useEffect(() => {
    if (reportReviewId && detail.isAuthenticated && detail.provider) {
      const id = Number(reportReviewId);
      if (!isNaN(id)) {
        handleReportReview(id);
      }
    }
    router.setParams({ reportReviewId: undefined });
  }, [reportReviewId, detail.isAuthenticated, detail.provider, handleReportReview]);

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
  const [galleryItem, setGalleryItem] = useState<PortfolioItem | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const handleWriteReviewPress = useCallback(() => {
    if (!detail.provider?.can_review) {
      showRTLAlert('تعذر كتابة تقييم', detail.provider?.review_status_message ?? "", [{ text: 'حسناً', style: 'default' }]);
      return;
    }
    reviewModal.setShowReviewModal(true);
  }, [detail.provider?.can_review, detail.provider?.review_status_message, reviewModal, showRTLAlert]);

  if (detail.isLoading) return <LoadingSpinner />;
  if (detail.isError || !detail.provider || !detail.profile) return <ErrorView onRetry={detail.refetch} />;

  const profile = detail.profile;
  const HERO_HEIGHT = 250;
  const AVATAR_SIZE = 96;

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
  if (profile.worksRemotely) {
    specs.push({
      id: 'work',
      icon: 'desktop-outline',
      label: 'طبيعة العمل',
      value: 'عمل عن بُعد',
    });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['bottom']}>
      <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false}>

        {/* ═══ HERO SECTION WITH OVERLAY AVATAR ═══ */}
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
            colors={[colors.overlayMedium, colors.overlayLight, 'transparent']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 100 }}
          />

          {/* Navigation Controls (Strict RTL) */}
          <View style={{ position: 'absolute', top: insets.top + 12, left: 16, right: 16, ...rtlRow(), justifyContent: 'space-between', alignItems: 'center', zIndex: 30 }}>
            <Pressable
              onPress={() => router.canGoBack() ? router.back() : requestAnimationFrame(() => router.replace('/(tabs)/'))}
              style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }}
              hitSlop={8}
            >
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </Pressable>

            <Pressable
              onPress={detail.handleFavorite}
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

          {/* Avatar Overlay on Background - Centered */}
          <View style={{ position: 'absolute', top: '50%', left: '50%', marginTop: -AVATAR_SIZE / 2, marginLeft: -AVATAR_SIZE / 2, zIndex: 20 }}>
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
            marginTop: 20,
            marginHorizontal: 16,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 16,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.05,
            shadowRadius: 16,
            elevation: 4,
          }}
        >
          {/* Name & Type Header - Centered */}
          <View style={{ width: '100%', alignItems: 'center', paddingTop: 8 }}>
            <Text numberOfLines={2} style={{ fontSize: 21, fontFamily: 'Cairo-Black', color: colors.textPrimary, textAlign: 'center', writingDirection: 'rtl', lineHeight: 28 }}>
              {profile.name}
            </Text>

            {translatedType && (
              <Text style={{ fontSize: 13.5, fontFamily: 'Cairo-Bold', color: colors.primary, textAlign: 'center', writingDirection: 'rtl', marginTop: 2 }}>
                {translatedType} {profile.categoryName ? `• ${profile.categoryName}` : ''}
              </Text>
            )}

            {/* Rating block - Centered */}
            <View style={{ ...rtlRow(), alignItems: 'center', gap: 6, marginTop: 8, justifyContent: 'center' }}>
              <Ionicons name="star" size={14} color={colors.gold} />
              <Text style={{ fontFamily: 'Cairo-Bold', fontSize: 13, color: colors.textPrimary }}>
                {toEnglishNumbers(profile.rating > 0 ? profile.rating.toFixed(1) : '0.0')}
              </Text>
              <Text style={{ fontFamily: 'Cairo-Regular', fontSize: 12, color: colors.textMuted }}>
                ({formatArabicReviewCount(profile.reviewsCount)})
              </Text>
            </View>
          </View>

          {/* Quick Specs Dashboard Bar */}
          <View style={{
            ...rtlRow(),
            width: '100%',
            backgroundColor: colors.surfaceAlt,
            borderRadius: 18,
            paddingVertical: 10,
            paddingHorizontal: 8,
            marginTop: 12,
            alignItems: 'center',
            justifyContent: 'space-around',
          }}>
            {specs.map((spec, index) => (
              <React.Fragment key={spec.id}>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Ionicons name={spec.icon as keyof typeof Ionicons.glyphMap} size={16} color={colors.primary} style={{ marginBottom: 4 }} />
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
            <View style={{ ...rtlRow(), width: '100%', gap: 12, marginTop: 12 }}>
              {profile.whatsappUrl && (
                <Pressable
                  onPress={detail.handleWhatsApp}
                  style={{
                    flex: profile.phone ? 1 : undefined,
                    width: profile.phone ? undefined : '100%',
                    height: 48,
                    borderRadius: 14,
                    backgroundColor: colors.whatsapp,
                    ...rtlRow(),
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    shadowColor: colors.whatsapp,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 6,
                    elevation: 2,
                  }}
                >
                  <Ionicons name="logo-whatsapp" size={18} color={colors.textOnPrimary} />
                  <Text style={{ fontFamily: 'Cairo-Bold', fontSize: 13.5, color: colors.textOnPrimary }}>واتساب</Text>
                </Pressable>
              )}
              {profile.phone && (
                <Pressable
                  onPress={detail.handlePhone}
                  style={{
                    flex: profile.whatsappUrl ? 1 : undefined,
                    width: profile.whatsappUrl ? undefined : '100%',
                    height: 48,
                    borderRadius: 14,
                    backgroundColor: colors.primary,
                    ...rtlRow(),
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
            <View style={{ ...rtlRow(), justifyContent: 'center', alignItems: 'center', gap: 14, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderColor: colors.border, width: '100%' }}>
              {profile.socialLinks.map((item) => (
                <Pressable key={item.id} onPress={() => openExternalUrl(item.url)} style={({ pressed }) => ({ width: 38, height: 38, borderRadius: 10, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1, borderWidth: 1, borderColor: colors.border })}>
                  <Ionicons name={item.icon} size={18} color={item.color} />
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* ═══ CORE SECTIONS (About, Services, Portfolio, Credentials, Reviews) ═══ */}
        <View style={{ paddingHorizontal: 16, marginTop: 16, paddingBottom: 40 }}>
          {profile.about && <AboutSection about={profile.about} colors={colors} />}
          <ServicesSection services={profile.services} colors={colors} />
          <PortfolioSection projects={profile.projects} colors={colors} onImagePress={(item, idx) => { setGalleryItem(item); setGalleryIndex(idx); }} />
          <CredentialsSection credentials={profile.credentials} colors={colors} />
          <View style={{ marginTop: 4 }}>
            <ReviewsSection
              reviews={detail.allReviews}
              rating={profile.rating}
              reviewsCount={profile.reviewsCount}
              colors={colors}
              isDark={isDark}
              isAuthenticated={detail.isAuthenticated}
              canWriteReview={profile.canReview}
              reviewStatusMessage={profile.reviewStatusMessage}
              user={detail.user}
              onWriteReviewPress={handleWriteReviewPress}
              onUnauthenticatedWriteReview={handleUnauthenticatedWriteReview}
              onReportReview={handleReportReview}
              isFetching={detail.isFetchingReviews}
              hasMore={detail.hasMoreReviews}
              onLoadMore={() => detail.setReviewPage((p) => p + 1)}
            />
          </View>
        </View>
      </ScrollView>

      {/* ═══ PORTFOLIO IMAGE FULLSCREEN LIGHTBOX ═══ */}
      <Modal visible={galleryItem !== null} transparent animationType="fade" onRequestClose={() => setGalleryItem(null)}>
        <View style={{ flex: 1, backgroundColor: colors.overlayHeavy }}>
          <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
            <View style={{ position: 'absolute', top: insets.top + 16, left: 16, zIndex: 99 }}>
              <Pressable onPress={() => setGalleryItem(null)} style={{ height: 40, width: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: colors.overlayMedium }}>
                <Ionicons name="close" size={24} color={colors.textOnPrimary} />
              </Pressable>
            </View>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              {galleryItem?.images && galleryItem.images.length > 0 && (
                <Image source={{ uri: galleryItem.images[galleryIndex] }} style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 1.2 }} contentFit="contain" />
              )}
            </View>
            {galleryItem?.title ? (
              <Text style={{ textAlign: 'center', color: colors.textOnPrimary, fontFamily: 'Cairo-SemiBold', fontSize: 15, paddingVertical: 20, paddingHorizontal: 24, writingDirection: 'rtl' }}>
                {galleryItem.title}
              </Text>
            ) : null}
          </SafeAreaView>
        </View>
      </Modal>

      {/* ═══ CUSTOM REPORT MODAL ═══ */}
      <Modal visible={reportModal.showReportModal} transparent animationType="slide" onRequestClose={() => reportModal.setShowReportModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: colors.overlayMedium, justifyContent: 'flex-end' }}>
          <View style={{ width: '100%', backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, borderWidth: 1, borderColor: colors.border }}>
            <View style={{ ...rtlRow(), justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontFamily: 'Cairo-Bold', color: colors.textPrimary, textAlign: 'right' }}>الإبلاغ عن التقييم</Text>
              <Pressable onPress={() => reportModal.setShowReportModal(false)}>
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
                const isSelected = reportModal.reportReasonType === opt.type;
                return (
                  <Pressable key={opt.type} onPress={() => { reportModal.setReportReasonType(opt.type); reportModal.setReportError(''); }} style={{ ...rtlRow(), alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, backgroundColor: isSelected ? colors.primarySoft : 'transparent' }}>
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
              value={reportModal.customReportReason}
              onChangeText={(text) => { reportModal.setCustomReportReason(text); reportModal.setReportError(''); }}
              placeholder="اكتب تفاصيل البلاغ هنا... (10 أحرف على الأقل)"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              style={{ width: '100%', minHeight: 100, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, textAlign: 'right', fontFamily: 'Cairo-Regular', color: colors.textPrimary, backgroundColor: colors.surfaceAlt, marginBottom: 16 }}
            />

            {reportModal.reportError ? (
              <Text style={{ color: colors.error, fontFamily: 'Cairo-Bold', fontSize: 12, textAlign: 'right', marginBottom: 12 }}>{reportModal.reportError}</Text>
            ) : null}

            <View style={{ ...rtlRow(), gap: 12 }}>
              <Pressable onPress={reportModal.handleReportSubmit} style={{ flex: 1, backgroundColor: colors.primary, borderRadius: 14, height: 48, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 14, fontFamily: 'Cairo-Bold', color: colors.textOnPrimary }}>إرسال البلاغ</Text>
              </Pressable>
              <Pressable onPress={() => reportModal.setShowReportModal(false)} style={{ flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: 14, height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ fontSize: 14, fontFamily: 'Cairo-Bold', color: colors.textSecondary }}>إلغاء</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ═══ CUSTOM SYSTEM ALERTS MODAL ═══ */}
      <Modal visible={customAlert.visible} transparent animationType="fade" onRequestClose={() => setCustomAlert((prev) => ({ ...prev, visible: false }))}>
        <View style={{ flex: 1, backgroundColor: colors.overlayHeavy, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
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
      <Modal visible={reviewModal.showReviewModal} transparent animationType="slide" onRequestClose={() => reviewModal.setShowReviewModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
          <View style={{ ...rtlRow(), justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}>
            <Text style={{ fontSize: 18, fontFamily: 'Cairo-Black', color: colors.textPrimary }}>أضف تقييمك</Text>
            <Pressable onPress={() => reviewModal.setShowReviewModal(false)}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>
          <ScrollView style={{ flex: 1, paddingHorizontal: 16 }}>
            <Text style={{ marginBottom: 12, marginTop: 24, textAlign: 'right', fontSize: 14, fontFamily: 'Cairo-SemiBold', color: colors.textPrimary }}>تقييمك</Text>
            <View style={{ alignItems: 'center' }}>
              <StarRating value={reviewModal.reviewRating} size={40} interactive onChange={reviewModal.setReviewRating} />
            </View>
            <Text style={{ marginBottom: 8, marginTop: 20, textAlign: 'right', fontSize: 14, fontFamily: 'Cairo-SemiBold', color: colors.textPrimary }}>تعليقك (اختياري)</Text>
            <TextInput
              value={reviewModal.reviewComment}
              onChangeText={reviewModal.setReviewComment}
              placeholder="اكتب تجربتك بالتفصيل هنا..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={5}
              style={{ width: '100%', minHeight: 120, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, textAlign: 'right', fontFamily: 'Cairo-Regular', color: colors.textPrimary, backgroundColor: colors.surface }}
            />
            {reviewModal.reviewError ? (
              <Text style={{ color: colors.error, fontFamily: 'Cairo-Bold', fontSize: 13, textAlign: 'right', marginTop: 12 }}>{reviewModal.reviewError}</Text>
            ) : null}
          </ScrollView>
          <Pressable onPress={reviewModal.handleReviewSubmit} disabled={!reviewModal.reviewRating || reviewModal.isPending} style={{ marginHorizontal: 16, marginBottom: 16, alignItems: 'center', borderRadius: 16, paddingVertical: 16, backgroundColor: reviewModal.reviewRating ? colors.primary : colors.surfaceAlt }}>
            <Text style={{ fontFamily: 'Cairo-Bold', color: reviewModal.reviewRating ? colors.textOnPrimary : colors.textMuted }}>
              {reviewModal.isPending ? 'جاري الإرسال...' : 'إرسال التقييم'}
            </Text>
          </Pressable>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
