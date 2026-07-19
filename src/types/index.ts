export interface Banner {
  id: number;
  title: string | null;
  subtitle: string | null;
  image_url: string;
  link_type: 'none' | 'category' | 'provider' | 'url';
  link_value: string | null;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  is_admin: boolean;
  is_provider: boolean;
  created_at?: string;
}

export interface City {
  id: number;
  name: string;
  slug: string;
  discoverable_profiles_count?: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon_url?: string | null;
  providers_count?: number;
  subcategories_count?: number;
  subcategories?: Subcategory[];
}

export interface ProviderType {
  code: string;
  name: string;
}

export interface Subcategory {
  id: number;
  name: string;
  slug: string;
  category_id: number;
  icon_url?: string | null;
  providers_count?: number;
  category?: Category;
}

export interface PortfolioImageItem {
  id: number;
  url: string;
  alt?: string | null;
}

export interface PortfolioItem {
  id: number;
  title: string;
  short_description?: string;
  description?: string;
  link?: string;
  images: string[];
  // Owner-only fields (present when the provider fetches their own portfolio)
  is_active?: boolean;
  image_items?: PortfolioImageItem[];
}

export interface ProviderCredential {
  id: number;
  title: string;
  issuer?: string;
  verification_url?: string;
  issue_date?: string;
  notes?: string;
  created_at?: string;
}

export interface Review {
  id: number;
  rating: number;
  comment?: string;
  user_name: string;
  user_id: number;
  user_avatar?: string | null;
  status?: string;
  flagged_reason?: string | null;
  flag_response?: 'pending' | 'accepted' | 'rejected' | null;
  moderation_note?: string | null;
  can_flag?: boolean;
  created_at: string;
}

export interface Provider {
  id: number;
  slug: string;
  name: string;
  provider_type?: string | null;
  logo_url?: string | null;
  cover_url?: string | null;
  city?: City;
  category?: Category;
  subcategories?: Subcategory[];
  rating_average: number;
  reviews_count: number;
  is_featured?: boolean;
  whatsapp_url?: string | null;
  phone?: string | null;
  email?: string | null;
  is_favorited?: boolean;
  // Detail-only fields
  description?: string;
  portfolio_items?: PortfolioItem[];
  portfolio_images?: string[];
  credentials?: ProviderCredential[];
  years_experience?: number;
  website?: string | null;
  social_links?: {
    facebook?: string | null;
    instagram?: string | null;
    linkedin?: string | null;
    github?: string | null;
    map_url?: string | null;
  };
  offers_remote_work?: boolean;
  travels_to_cities?: boolean;
  can_review?: boolean;
  review_status_message?: string | null;
  service_area_note?: string | null;
  has_venue_calendar?: boolean;
  booked_dates?: string[];
  latest_user_review?: Review | null;
}

export interface ProviderDashboardStats {
  rating_average: number;
  reviews_count: number;
  approved_reviews_count: number;
  portfolio_items_count: number;
  portfolio_images_count: number;
  credentials_count: number;
  completion_percentage: number;
  is_complete: boolean;
  is_discoverable: boolean;
  provider_access_ends_at: string | null;
}

export interface ProviderDashboardData {
  profile: Provider;
  stats: ProviderDashboardStats;
  recent_reviews: Review[];
}

export interface AdminDashboardStats {
  users_count: number;
  providers_count: number;
  profiles_count: number;
  visible_profiles_count: number;
  complete_profiles_count: number;
  reviews_count: number;
  pending_reviews_count: number;
  approved_reviews_count: number;
  flagged_reviews_count: number;
  categories_count: number;
  cities_count: number;
}

export interface AdminDashboardData {
  stats: AdminDashboardStats;
  recent_providers: Provider[];
  recent_reviews: Review[];
}
export interface HomeStats {
  visible_providers_count: number;
  categories_count: number;
  cities_count: number;
  reviews_count: number;
}

export interface HomeData {
  stats: HomeStats;
  banners: Banner[];
  categories: Category[];
  featured_providers: Provider[];
  suggested_providers: Provider[];
}

export interface SearchFilters {
  keyword?: string;
  city?: string;
  city_id?: number;
  category?: string;
  category_id?: number;
  subcategory?: string;
  subcategory_id?: number;
  provider_type?: string;
  remote?: boolean;
  sort?: 'rating' | 'newest';
  page?: number;
  per_page?: number;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  has_more?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: PaginationMeta;
  errors?: Record<string, string[]>;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface ContactInfo {
  whatsapp?: string;
  phone?: string;
  email?: string;
  address?: string;
  facebook?: string;
}

export interface PaginatedData<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  is_admin: boolean;
  is_provider: boolean;
  is_active: boolean;
  is_suspended: boolean;
  security_flagged: boolean;
  suspension_reason?: string | null;
  suspended_at?: string | null;
  profile_slug?: string | null;
  business_name?: string | null;
  created_at?: string;
}

export interface AdminReview {
  id: number;
  rating: number;
  comment?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  user_name: string;
  provider_name?: string | null;
  provider_slug?: string | null;
  is_flagged: boolean;
  flagged_reason?: string | null;
  flagged_at?: string | null;
  flag_pending: boolean;
  moderation_note?: string | null;
  moderated_at?: string | null;
  created_at: string;
}

export interface ProviderProfileUpdateInput {
  business_name?: string;
  provider_type?: string;
  category_id?: number;
  subcategory_ids?: number[];
  city_id?: number;
  bio?: string;
  phone?: string;
  whatsapp?: string;
  experience_years?: number;
  offers_remote_work?: boolean;
  travels_to_cities?: boolean;
  website?: string;
  instagram_handle?: string;
  facebook_slug?: string;
  linkedin_slug?: string;
  github_username?: string;
  map_url?: string;
  service_area_note?: string;
}

export interface CredentialInput {
  title: string;
  issuer: string;
  issue_date: string;
  verification_url?: string;
  notes?: string;
}

export interface CategoryDetailData {
  category: Category;
  providers: Provider[];
  pagination: PaginationMeta;
}

export interface SubcategoryDetailData {
  subcategory: Subcategory;
  providers: Provider[];
  related_subcategories: Subcategory[];
  pagination: PaginationMeta;
}

