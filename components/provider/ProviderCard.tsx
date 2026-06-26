import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
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
  let coverUrl: string | null = null;
  let coverBlur = false;
  if (
    provider.cover_url &&
    !provider.cover_url.includes('placeholder') &&
    !provider.cover_url.includes('default') &&
    provider.cover_url.trim() !== "" &&
    !provider.cover_url.includes('localhost:8000')
  ) {
    coverUrl = provider.cover_url;
  } else if (
    provider.portfolio_items &&
    provider.portfolio_items.length > 0 &&
    provider.portfolio_items[0].images &&
    provider.portfolio_items[0].images.length > 0
  ) {
    coverUrl = provider.portfolio_items[0].images[0];
  } else if (
    provider.logo_url &&
    !provider.logo_url.includes('placeholder') &&
    !provider.logo_url.includes('default') &&
    provider.logo_url.trim() !== "" &&
    !provider.logo_url.includes('localhost:8000')
  ) {
    coverUrl = provider.logo_url;
    coverBlur = true;
  }

  let avatarUrl: string | null = null;
  if (
    provider.logo_url &&
    !provider.logo_url.includes('placeholder') &&
    !provider.logo_url.includes('default') &&
    provider.logo_url.trim() !== "" &&
    !provider.logo_url.includes('localhost:8000')
  ) {
    avatarUrl = provider.logo_url;
  }

  let categoryName: string | null = null;
  if (provider.category?.name) {
    categoryName = provider.category.name;
  } else if (provider.subcategories && provider.subcategories.length > 0) {
    categoryName = provider.subcategories[0].name;
  }

  const cityName = provider.city?.name || null;
  const whatsappUrl = provider.whatsapp_url || null;
  const phone = provider.phone || null;
  const anyProvider = provider as any;
  const email = anyProvider.email || null;

  const socialLinks: Array<{ id: string; icon: keyof typeof Ionicons.glyphMap; color: string; url: string }> = [];
  if (provider.website) {
    const webUrl = buildSocialUrl('website', provider.website);
    if (webUrl) socialLinks.push({ id: 'website', icon: 'globe-outline', color: '#60A5FA', url: webUrl });
  }
  const rawSocials = provider.social_links || {};
  if (rawSocials.facebook) {
    const fbUrl = buildSocialUrl('facebook', rawSocials.facebook);
    if (fbUrl) socialLinks.push({ id: 'facebook', icon: 'logo-facebook', color: '#1877F2', url: fbUrl });
  }
  if (rawSocials.instagram) {
    const instUrl = buildSocialUrl('instagram', rawSocials.instagram);
    if (instUrl) socialLinks.push({ id: 'instagram', icon: 'logo-instagram', color: '#E1306C', url: instUrl });
  }
  if (rawSocials.linkedin) {
    const liUrl = buildSocialUrl('linkedin', rawSocials.linkedin);
    if (liUrl) socialLinks.push({ id: 'linkedin', icon: 'logo-linkedin', color: '#0A66C2', url: liUrl });
  }
  if (rawSocials.github) {
    const ghUrl = buildSocialUrl('github', rawSocials.github);
    if (ghUrl) socialLinks.push({ id: 'github', icon: 'logo-github', color: '#F1F5F9', url: ghUrl });
  }
  const mapUrl = (rawSocials as any).map_url || anyProvider.map_url;
  if (mapUrl) {
    socialLinks.push({ id: 'map', icon: 'map-outline', color: '#34D399', url: mapUrl });
  }

  const yearsExp = (provider.years_experience !== undefined && provider.years_experience !== null) ? provider.years_experience : null;

  return {
    id: provider.id,
    slug: provider.slug,
    name: provider.name,
    providerType: provider.provider_type || null,
    coverUrl,
    coverBlur,
    avatarUrl,
    categoryName,
    cityName,
    rating: provider.rating_average ?? 0,
    reviewsCount: provider.reviews_count ?? 0,
    whatsappUrl,
    phone,
    email,
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
    worksRemotely: !!(provider as any).offers_remote_work,
    serviceAreaNote: provider.service_area_note || null,
    isFeatured: !!provider.is_featured,
    isFavorited: !!provider.is_favorited,
    canReview: !!provider.can_review,
    reviewStatusMessage: provider.review_status_message || null,
  };
}

function getAvatarTheme(isDark: boolean) {
  return { bg: isDark ? '#1F2937' : '#F3F4F6', text: isDark ? '#F9FAFB' : '#111827' };
}

interface AboutSectionProps {
  about: string;
  colors: ThemeColors;
}
function AboutSection({ about, colors }: AboutSectionProps) {
  return (
    <View style={{ marginBottom: 28 }}>
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <View style={{ width: 4, height: 20, backgroundColor: colors.primary, borderRadius: 2 }} />
        <Text style={{ fontSize: 16, fontFamily: 'Cairo-Black', color: colors.textPrimary }}>عن</Text>
      </View>
      <Text style={{ fontSize: 13, fontFamily: 'Cairo-Regular', color: colors.textSecondary, lineHeight: 24, textAlign: 'right', writingDirection: 'rtl' }}>
        {about}
      </Text>
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
    <View style={{ marginBottom: 28 }}>
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <View style={{ width: 4, height: 20, backgroundColor: colors.primary, borderRadius: 2 }} />
        <Text style={{ fontSize: 16, fontFamily: 'Cairo-Black', color: colors.textPrimary }}>الخدمات</Text>
      </View>
      <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 }}>
        {services.map((svc) => (
          <View key={svc.id} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: colors.primarySoft }}>
            <Text style={{ fontFamily: 'Cairo-SemiBold', fontSize: 12, color: colors.primary }}>{svc.name}</Text>
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
  if (!projects || projects.length === 0) return null;
  return (
    <View style={{ marginBottom: 28 }}>
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <View style={{ width: 4, height: 20, backgroundColor: colors.primary, borderRadius: 2 }} />
        <Text style={{ fontSize: 16, fontFamily: 'Cairo-Black', color: colors.textPrimary }}>المشاريع</Text>
      </View>
      <View style={{ gap: 16 }}>
        {projects.map((project) => (
          <View key={project.id} style={{ backgroundColor: colors.surface, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
            {project.images && project.images.length > 0 && (
              <Pressable onPress={() => onImagePress(project, 0)}>
                <Image source={{ uri: project.images[0] }} style={{ width: '100%', height: 200 }} contentFit="cover" />
              </Pressable>
            )}
            <View style={{ padding: 12 }}>
              <Text style={{ fontFamily: 'Cairo-Bold', fontSize: 14, color: colors.textPrimary, marginBottom: 4 }}>{project.title}</Text>
              {project.short_description && (
                <Text style={{ fontFamily: 'Cairo-Regular', fontSize: 12, color: colors.textSecondary, lineHeight: 18 }}>
                  {project.short_description}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
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
    <View style={{ marginBottom: 28 }}>
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <View style={{ width: 4, height: 20, backgroundColor: colors.primary, borderRadius: 2 }} />
        <Text style={{ fontSize: 16, fontFamily: 'Cairo-Black', color: colors.textPrimary }}>الشهادات والمؤهلات</Text>
      </View>
      <View style={{ gap: 12 }}>
        {credentials.map((cred) => (
          <View key={cred.id} style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontFamily: 'Cairo-Bold', fontSize: 13, color: colors.textPrimary, marginBottom: 2 }}>{cred.title}</Text>
            {cred.issuer && (
              <Text style={{ fontFamily: 'Cairo-Regular', fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>من: {cred.issuer}</Text>
            )}
            {cred.issue_date && (
              <Text style={{ fontFamily: 'Cairo-Regular', fontSize: 11, color: colors.textMuted }}>
                التاريخ: {formatIssueDate(cred.issue_date)}
              </Text>
            )}
          </View>
        ))}
      </View>
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
  const HERO_HEIGHT = 220;
  const AVATAR_SIZE = 96;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['bottom']}>
      <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false}>

        {/* ═══ HERO SECTION ═══ */}
        <View style={{ position: 'relative', width: '100%', height: HERO_HEIGHT, backgroundColor: colors.surface }}>
          {profile.coverUrl ? (
            <Image
              source={{ uri: profile.coverUrl }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              blurRadius={profile.coverBlur ? 25 : 0}
            />
          ) : (
            <LinearGradient colors={[colors.surfaceAlt, colors.bg]} style={{ width: '100%', height: '100%' }} />
          )}

          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.1)', 'transparent']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 90 }}
          />

          {/* Top Navigation Control Bar (Strict RTL) */}
          <View style={{ position: 'absolute', top: insets.top + 8, left: 16, right: 16, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', zIndex: 30 }}>
            {/* Back Button (Stays on the right side for RTL Layout) */}
            <Pressable
              onPress={() => router.back()}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' }}
              hitSlop={8}
            >
              <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
            </Pressable>

            {/* Favorite Button (Stays on the left side for RTL Layout) */}
            <Pressable
              onPress={handleFavorite}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' }}
              hitSlop={8}
            >
              <Ionicons
                name={profile.isFavorited ? 'heart' : 'heart-outline'}
                size={22}
                color={profile.isFavorited ? '#EF4444' : '#FFFFFF'}
              />
            </Pressable>
          </View>
        </View>

        {/* ═══ MAIN CARD PROFILE CONTAINER ═══ */}
        <View style={{ backgroundColor: colors.surface, marginTop: -40, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 20, paddingBottom: 24, borderWidth: 1, borderColor: colors.border, borderBottomWidth: 0 }}>

          {/* Protruding Avatar Right-Aligned */}
          <View style={{ flexDirection: 'row-reverse', marginTop: -(AVATAR_SIZE / 2), marginBottom: 16 }}>
            <View style={{ width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: 24, borderWidth: 4, borderColor: colors.surface, backgroundColor: colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 8, overflow: 'hidden' }}>
              {profile.avatarUrl ? (
                <Image source={{ uri: profile.avatarUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              ) : (
                <View style={{ flex: 1, backgroundColor: getAvatarTheme(isDark).bg, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontFamily: 'Cairo-Bold', fontSize: 28, color: getAvatarTheme(isDark).text }}>
                    {profile.name.charAt(0)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Profile Basic Info Header */}
          <View style={{ alignItems: 'flex-end', width: '100%' }}>
            <Text numberOfLines={2} style={{ fontSize: 24, fontFamily: 'Cairo-Black', color: colors.textPrimary, textAlign: 'right', writingDirection: 'rtl', marginBottom: 4 }}>
              {profile.name}
            </Text>

            {profile.providerType && (
              <Text style={{ fontSize: 13, fontFamily: 'Cairo-Medium', color: colors.textMuted, textAlign: 'right', writingDirection: 'rtl', marginBottom: 12 }}>
                {profile.providerType}
              </Text>
            )}
          </View>

          {/* Premium Flexible Badges Row (Strict RTL Scroll) */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, paddingVertical: 4 }} style={{ marginVertical: 12, width: '100%' }}>
            {profile.categoryName && (
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: colors.primarySoft }}>
                <Ionicons name="briefcase-outline" size={14} color={colors.primary} />
                <Text style={{ fontFamily: 'Cairo-Bold', fontSize: 12, color: colors.primary }}>{profile.categoryName}</Text>
              </View>
            )}

            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: colors.goldSoft }}>
              <Ionicons name="star" size={14} color={colors.gold} />
              <Text style={{ fontFamily: 'Cairo-Bold', fontSize: 12, color: colors.gold }}>
                {profile.rating > 0 ? profile.rating.toFixed(1) : '0.0'}
              </Text>
            </View>

            {profile.cityName && (
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border }}>
                <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                <Text style={{ fontFamily: 'Cairo-SemiBold', fontSize: 12, color: colors.textSecondary }}>{profile.cityName}</Text>
              </View>
            )}

            {profile.yearsExperienceText && (
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border }}>
                <Ionicons name="ribbon-outline" size={14} color={colors.textSecondary} />
                <Text style={{ fontFamily: 'Cairo-SemiBold', fontSize: 12, color: colors.textSecondary }}>{profile.yearsExperienceText}</Text>
              </View>
            )}

            {profile.worksRemotely && (
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: 'rgba(16, 185, 129, 0.1)', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                <Ionicons name="desktop-outline" size={14} color={colors.success || '#10B981'} />
                <Text style={{ fontFamily: 'Cairo-SemiBold', fontSize: 12, color: colors.success || '#10B981' }}>يقدم عمل عن بعد</Text>
              </View>
            )}
          </ScrollView>

          {/* Premium Contact Actions Bar */}
          {(profile.phone || profile.whatsappUrl) && (
            <View style={{ flexDirection: 'row-reverse', width: '100%', gap: 12, marginTop: 16, justifyContent: 'center' }}>
              {profile.whatsappUrl && (
                <Pressable onPress={handleWhatsApp} style={{ flex: 1, height: 48, borderRadius: 14, backgroundColor: '#25D366', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#25D366', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 3 }}>
                  <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
                  <Text style={{ fontFamily: 'Cairo-Bold', fontSize: 14, color: '#FFFFFF' }}>واتساب</Text>
                </Pressable>
              )}
              {profile.phone && (
                <Pressable onPress={handlePhone} style={{ flex: 1, height: 48, borderRadius: 14, backgroundColor: colors.primary, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 3 }}>
                  <Ionicons name="call" size={18} color={colors.textOnPrimary} />
                  <Text style={{ fontFamily: 'Cairo-Bold', fontSize: 14, color: colors.textOnPrimary }}>اتصال هاتفي</Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Social Icons Strip Row */}
          {profile.socialLinks.length > 0 && (
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderColor: colors.border }}>
              {profile.socialLinks.map((item) => (
                <Pressable key={item.id} onPress={() => openExternalUrl(item.url)} style={({ pressed }) => ({ width: 42, height: 42, borderRadius: 12, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1, borderWidth: 1, borderColor: colors.border })}>
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* ═══ CONDITIONAL CORE CONTENT SECTIONS ═══ */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 32 }}>
          {profile.about && <AboutSection about={profile.about} colors={colors} />}
          <ServicesSection services={profile.services} colors={colors} />
          <PortfolioSection projects={profile.projects} colors={colors} onImagePress={(item, idx) => { setGalleryItem(item); setGalleryIndex(idx); }} />
          <CredentialsSection credentials={profile.credentials} colors={colors} />
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

      {/* ═══ REVIEWS SECTION (Original Design Left Intact but Forced to Strict RTL Container Flow) ═══ */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 40, marginTop: 12 }}>
        <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, width: '100%' }}>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 4, height: 20, backgroundColor: colors.primary, borderRadius: 2 }} />
            <Text style={{ fontSize: 18, fontFamily: 'Cairo-Black', color: colors.textPrimary, textAlign: 'right' }}>
              آراء وتقييمات العملاء
            </Text>
          </View>

          {profile.canReview ? (
            <Pressable onPress={handleWriteReviewPress} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: colors.primarySoft }}>
              <Text style={{ fontFamily: 'Cairo-Bold', fontSize: 13, color: colors.primary }}>كتابة تقييم</Text>
            </Pressable>
          ) : (
            isAuthenticated && profile.reviewStatusMessage && (
              <Text style={{ fontSize: 11, fontFamily: 'Cairo-Medium', color: colors.textMuted, maxWidth: '50%', textAlign: 'left' }}>
                {profile.reviewStatusMessage}
              </Text>
            )
          )}
          {!isAuthenticated && (
            <Pressable onPress={handleUnauthenticatedWriteReview} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ fontFamily: 'Cairo-Bold', fontSize: 13, color: colors.textSecondary }}>كتابة تقييم</Text>
            </Pressable>
          )}
        </View>

        {allReviews.length === 0 ? (
          <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, width: '100%' }}>
            <Ionicons name="chatbubbles-outline" size={32} color={colors.textMuted} style={{ marginBottom: 8 }} />
            <Text style={{ fontFamily: 'Cairo-SemiBold', fontSize: 14, color: colors.textMuted, textAlign: 'center' }}>
              لا توجد تقييمات لهذا المزود بعد. كن أول من يشارك تجربته!
            </Text>
          </View>
        ) : (
          <View style={{ width: '100%' }}>
            {allReviews.map((review, index) => {
              const isOwner = user && user.id === review.user_id;
              const avatarBg = isDark ? '#374151' : '#E5E7EB';
              return (
                <View key={review.id} style={{ borderBottomWidth: index < allReviews.length - 1 ? 1 : 0, borderBottomColor: colors.border, paddingVertical: 16 }}>
                  {/* Header Row: Avatar, Name/Time/Flag */}
                  <View style={{ flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                    {/* Avatar */}
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: avatarBg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {review.user_avatar ? (
                        <Image source={{ uri: review.user_avatar }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                      ) : (
                        <Text style={{ fontFamily: 'Cairo-Bold', fontSize: 16, color: colors.primary }}>
                          {review.user_name ? review.user_name.charAt(0) : 'م'}
                        </Text>
                      )}
                    </View>

                    {/* Name, Time, Flag */}
                    <View style={{ flex: 1, alignItems: 'flex-end', gap: 4 }}>
                      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <Text style={{ fontSize: 14, fontFamily: 'Cairo-Bold', color: colors.textPrimary }}>
                          {review.user_name}
                        </Text>
                        {!isOwner && (
                          <Pressable
                            onPress={() => handleReportReview(review.id)}
                            style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 4, padding: 4 }}
                            hitSlop={8}
                          >
                            <Ionicons name="flag-outline" size={13} color={colors.textMuted} />
                            <Text style={{ fontFamily: 'Cairo-Medium', fontSize: 10, color: colors.textMuted }}>إبلاغ</Text>
                          </Pressable>
                        )}
                      </View>
                      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontSize: 11, color: colors.textMuted, fontFamily: 'Cairo-Regular' }}>
                          {formatRelativeTime(review.created_at)}
                        </Text>
                        {isOwner && (
                          <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                            <Text style={{ fontFamily: 'Cairo-Bold', fontSize: 9, color: '#10B981' }}>تقييمك</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Rating */}
                  <View style={{ marginLeft: 54, marginBottom: 8 }}>
                    <StarRating value={review.rating} size={13} />
                  </View>

                  {/* Comment */}
                  {review.comment ? (
                    <Text style={{ fontSize: 13, fontFamily: 'Cairo-Regular', color: colors.textSecondary, lineHeight: 22, textAlign: 'right', writingDirection: 'rtl', marginLeft: 54 }}>
                      {review.comment}
                    </Text>
                  ) : null}
                </View>
              );
            })}

            {/* Load More Review Triggers */}
            {hasMoreReviews && (
              <Pressable
                onPress={() => setReviewPage((prev) => prev + 1)}
                disabled={isFetchingReviews}
                style={{
                  width: '100%',
                  height: 48,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 8
                }}
              >
                {isFetchingReviews ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={{ fontFamily: 'Cairo-Bold', fontSize: 13, color: colors.primary }}>عرض المزيد من التقييمات</Text>
                )}
              </Pressable>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}