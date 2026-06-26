import { Ionicons } from '@expo/vector-icons';
import type { Provider, PortfolioItem, ProviderCredential } from '../types';

export interface MappedProvider {
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

export function mapProviderProfile(provider: Provider): MappedProvider {
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

  const { buildSocialUrl } = require('./links');
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

export function getAvatarTheme(name: string, isDark: boolean) {
  const cleanName = name?.trim() || 'U';
  const colorsList = isDark
    ? [
        { bg: 'rgba(235, 94, 40, 0.15)', text: '#EB5E28' },
        { bg: 'rgba(74, 115, 232, 0.15)', text: '#4A73E8' },
        { bg: 'rgba(38, 166, 154, 0.15)', text: '#26A69A' },
        { bg: 'rgba(156, 39, 176, 0.15)', text: '#9C27B0' },
        { bg: 'rgba(233, 30, 99, 0.15)', text: '#E91E63' },
        { bg: 'rgba(76, 175, 80, 0.15)', text: '#4CAF50' },
      ]
    : [
        { bg: '#FFEBE5', text: '#EB5E28' },
        { bg: '#EBF0FF', text: '#4A73E8' },
        { bg: '#E0F2F1', text: '#00695C' },
        { bg: '#F3E5F5', text: '#6A1B9A' },
        { bg: '#FCE4EC', text: '#C2185B' },
        { bg: '#E8F5E9', text: '#2E7D32' },
      ];

  const sum = Array.from(cleanName).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colorsList[sum % colorsList.length];
}

export function getServiceIcon(serviceName?: string): keyof typeof Ionicons.glyphMap {
  if (!serviceName) return 'construct-outline';
  const lower = serviceName.toLowerCase();

  const rules: Array<{ keywords: string[]; icon: keyof typeof Ionicons.glyphMap }> = [
    { keywords: ['شعار', 'لوجو'], icon: 'color-palette-outline' },
    { keywords: ['تصوير', 'كاميرا', 'فيديو'], icon: 'camera-outline' },
    { keywords: ['هوية', 'بصري'], icon: 'document-text-outline' },
    { keywords: ['إعلان', 'تسويق', 'سوشيال'], icon: 'megaphone-outline' },
    { keywords: ['مطبوع', 'طباعة'], icon: 'print-outline' },
    { keywords: ['برمج', 'موقع', 'تطبيق'], icon: 'code-slash-outline' },
    { keywords: ['تصميم', 'رسم'], icon: 'brush-outline' },
  ];

  const match = rules.find(rule => rule.keywords.some(keyword => lower.includes(keyword)));
  return match ? match.icon : 'construct-outline';
}
