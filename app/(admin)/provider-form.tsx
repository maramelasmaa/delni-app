import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PremiumButton } from '../../components/auth/premiumAuth';
import { AdminField } from '../../components/admin/AdminField';
import { AdminOptionChips } from '../../components/admin/AdminOptionChips';
import { AdminSection } from '../../components/admin/AdminSection';
import { AdminToggleRow } from '../../components/admin/AdminToggleRow';
import { ErrorView } from '../../components/ui/ErrorView';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { RTLAlert, useRTLAlert } from '../../components/ui/RTLAlert';
import {
  useAdminCatalog,
  useAdminProvider,
  useAdminProviderMutations,
} from '../../src/hooks/useAdminManagement';
import { useTheme } from '../../src/hooks/useTheme';
import { parseApiError } from '../../src/lib/error-parser';
import type { AdminProviderInput } from '../../src/services/admin';
import type { AdminProviderDetail } from '../../src/types';

const emptyDraft: AdminProviderInput = {
  name: '',
  email: '',
  phone: '',
  is_active: true,
  is_suspended: false,
  business_name: '',
  provider_type: '',
  category_id: null,
  subcategory_id: null,
  city_id: null,
  bio: '',
  profile_phone: '',
  whatsapp: '',
  offers_remote_work: false,
  travels_to_cities: false,
  service_area_note: '',
  map_url: '',
  website: '',
  instagram_handle: '',
  facebook_slug: '',
  linkedin_slug: '',
  github_username: '',
  experience_years: null,
  provider_access_ends_at: '',
  has_venue_calendar: false,
  homepage_featured: false,
  homepage_featured_until: '',
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function draftFromProvider(provider?: AdminProviderDetail): AdminProviderInput {
  if (!provider) return emptyDraft;

  const profile = provider.profile;

  return {
    name: provider.name ?? '',
    email: provider.email ?? '',
    phone: provider.phone ?? '',
    is_active: provider.is_active,
    is_suspended: provider.is_suspended,
    business_name: profile?.business_name ?? '',
    provider_type: profile?.provider_type ?? '',
    category_id: profile?.category_id ?? null,
    subcategory_id: profile?.subcategory_id ?? null,
    city_id: profile?.city_id ?? null,
    bio: profile?.bio ?? '',
    profile_phone: profile?.phone ?? '',
    whatsapp: profile?.whatsapp ?? '',
    offers_remote_work: !!profile?.offers_remote_work,
    travels_to_cities: !!profile?.travels_to_cities,
    service_area_note: profile?.service_area_note ?? '',
    map_url: profile?.map_url ?? '',
    website: profile?.website ?? '',
    instagram_handle: profile?.instagram_handle ?? '',
    facebook_slug: profile?.facebook_slug ?? '',
    linkedin_slug: profile?.linkedin_slug ?? '',
    github_username: profile?.github_username ?? '',
    experience_years: profile?.experience_years ?? null,
    provider_access_ends_at: profile?.provider_access_ends_at?.slice(0, 10) ?? '',
    has_venue_calendar: !!profile?.has_venue_calendar,
    homepage_featured: !!profile?.homepage_featured,
    homepage_featured_until: profile?.homepage_featured_until ?? '',
  };
}

function cleanDraft(draft: AdminProviderInput): AdminProviderInput {
  const trim = (value?: string | null) => {
    const next = value?.trim();
    return next ? next : undefined;
  };

  return {
    name: draft.name.trim(),
    email: draft.email.trim(),
    phone: trim(draft.phone),
    password: trim(draft.password),
    is_active: !!draft.is_active,
    is_suspended: !!draft.is_suspended,
    business_name: trim(draft.business_name),
    provider_type: trim(draft.provider_type),
    category_id: draft.category_id ? Number(draft.category_id) : undefined,
    subcategory_id: draft.subcategory_id ? Number(draft.subcategory_id) : undefined,
    city_id: draft.city_id ? Number(draft.city_id) : undefined,
    bio: trim(draft.bio),
    profile_phone: trim(draft.profile_phone),
    whatsapp: trim(draft.whatsapp),
    offers_remote_work: !!draft.offers_remote_work,
    travels_to_cities: !!draft.travels_to_cities,
    service_area_note: trim(draft.service_area_note),
    map_url: trim(draft.map_url),
    website: trim(draft.website),
    instagram_handle: trim(draft.instagram_handle),
    facebook_slug: trim(draft.facebook_slug),
    linkedin_slug: trim(draft.linkedin_slug),
    github_username: trim(draft.github_username),
    experience_years: draft.experience_years != null ? Number(draft.experience_years) : undefined,
    provider_access_ends_at: trim(draft.provider_access_ends_at),
    has_venue_calendar: !!draft.has_venue_calendar,
    homepage_featured: !!draft.homepage_featured,
    homepage_featured_until: draft.homepage_featured ? trim(draft.homepage_featured_until) : undefined,
  };
}

export default function AdminProviderFormScreen() {
  const { colors } = useTheme();
  const { alert, showAlert, hideAlert } = useRTLAlert();
  const params = useLocalSearchParams<{ id?: string }>();
  const providerId = params.id ? Number(params.id) : undefined;
  const isEditing = !!providerId;
  const [draft, setDraft] = useState<AdminProviderInput>(emptyDraft);
  const [marketSectionOpen, setMarketSectionOpen] = useState(false);

  const providerQuery = useAdminProvider(providerId);
  const categoriesQuery = useAdminCatalog('categories', {});
  const subcategoriesQuery = useAdminCatalog('subcategories', {
    category_id: draft.category_id ? Number(draft.category_id) : undefined,
  });
  const citiesQuery = useAdminCatalog('cities', {});
  const providerTypesQuery = useAdminCatalog('providerTypes', {});
  const mutations = useAdminProviderMutations();

  // Save/update drives the bottom bar button; secondary actions get their own
  // busy flag so tapping "extend access" etc. no longer disables Save.
  const saveBusy = mutations.create.isPending || mutations.update.isPending || mutations.remove.isPending;
  const secondaryBusy =
    mutations.extendAccess.isPending || mutations.clearSecurityFlag.isPending || mutations.onboardingLink.isPending;

  const catalogLoading =
    categoriesQuery.isLoading || subcategoriesQuery.isLoading || citiesQuery.isLoading || providerTypesQuery.isLoading;
  const catalogError =
    categoriesQuery.isError || subcategoriesQuery.isError || citiesQuery.isError || providerTypesQuery.isError;
  const retryCatalog = () => {
    categoriesQuery.refetch();
    subcategoriesQuery.refetch();
    citiesQuery.refetch();
    providerTypesQuery.refetch();
  };

  useEffect(() => {
    if (providerQuery.data) setDraft(draftFromProvider(providerQuery.data));
  }, [providerQuery.data]);

  const title = isEditing ? 'تعديل مزود' : 'إضافة مزود';
  const visibleSubcategories = useMemo(() => subcategoriesQuery.items ?? [], [subcategoriesQuery.items]);

  const updateDraft = (patch: Partial<AdminProviderInput>) => setDraft((current) => ({ ...current, ...patch }));

  const validate = (): string | null => {
    if (!draft.name.trim() || !draft.email.trim()) {
      return 'اسم المزود والبريد الإلكتروني مطلوبان.';
    }
    if (!EMAIL_PATTERN.test(draft.email.trim())) {
      return 'صيغة البريد الإلكتروني غير صحيحة.';
    }
    if (draft.provider_access_ends_at && !DATE_PATTERN.test(draft.provider_access_ends_at.trim())) {
      return 'صيغة تاريخ انتهاء صلاحية الظهور غير صحيحة (YYYY-MM-DD).';
    }
    if (draft.homepage_featured && draft.homepage_featured_until && !DATE_PATTERN.test(draft.homepage_featured_until.trim())) {
      return 'صيغة تاريخ «مميز حتى» غير صحيحة (YYYY-MM-DD).';
    }
    return null;
  };

  const save = () => {
    const validationError = validate();
    if (validationError) {
      showAlert('تنبيه', validationError, [{ text: 'حسنا' }]);
      return;
    }

    const input = cleanDraft(draft);

    const callbacks = {
      onSuccess: (saved: AdminProviderDetail) => {
        if (saved.setup_url) {
          showAlert('تم إنشاء المزود', saved.setup_url, [{ text: 'حسنا', onPress: () => router.back() }]);
        } else {
          router.back();
        }
      },
      onError: (err: unknown) => showAlert('تعذر الحفظ', parseApiError(err).message, [{ text: 'حسنا' }]),
    };

    if (isEditing && providerId) {
      mutations.update.mutate({ id: providerId, input }, callbacks);
    } else {
      mutations.create.mutate(input, callbacks);
    }
  };

  const confirmDelete = () => {
    if (!providerId) return;
    showAlert('حذف المزود', 'سيتم حذف حساب المزود وملفه.', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: () => mutations.remove.mutate(providerId, {
          onSuccess: () => router.back(),
          onError: (err) => showAlert('تعذر الحذف', parseApiError(err).message, [{ text: 'حسنا' }]),
        }),
      },
    ]);
  };

  const extendAccess = (days: number) => {
    if (!providerId) return;
    mutations.extendAccess.mutate({ id: providerId, days }, {
      onSuccess: (provider) => {
        setDraft(draftFromProvider(provider));
        showAlert('تم التمديد', `تم تمديد صلاحية المزود ${days} يوما بنجاح.`, [{ text: 'حسنا' }]);
      },
      onError: (err) => showAlert('تعذر التمديد', parseApiError(err).message, [{ text: 'حسنا' }]),
    });
  };

  const generateLink = () => {
    if (!providerId) return;
    mutations.onboardingLink.mutate(providerId, {
      onSuccess: (data) => showAlert('رابط الإعداد', data.setup_url, [{ text: 'حسنا' }]),
      onError: (err) => showAlert('تعذر إنشاء الرابط', parseApiError(err).message, [{ text: 'حسنا' }]),
    });
  };

  const clearFlag = () => {
    if (!providerId) return;
    mutations.clearSecurityFlag.mutate(providerId, {
      onSuccess: (provider) => {
        setDraft(draftFromProvider(provider));
        showAlert('تم التحديث', 'تم مسح علامة الأمان عن هذا المزود.', [{ text: 'حسنا' }]);
      },
      onError: (err) => showAlert('تعذر تحديث الحالة', parseApiError(err).message, [{ text: 'حسنا' }]),
    });
  };

  if (isEditing && providerQuery.isLoading) return <LoadingSpinner />;
  if (isEditing && (providerQuery.isError || !providerQuery.data)) {
    return <ErrorView error={providerQuery.error} onRetry={providerQuery.refetch} />;
  }
  if (catalogLoading) return <LoadingSpinner />;
  if (catalogError) {
    return <ErrorView error={categoriesQuery.error ?? subcategoriesQuery.error ?? citiesQuery.error ?? providerTypesQuery.error} onRetry={retryCatalog} />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="chevron-forward" size={20} color={colors.textPrimary} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={[styles.kicker, { color: colors.gold }]}>لوحة الإدارة</Text>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{title}</Text>
          </View>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 130, gap: 14 }}
        >
          <AdminSection title="الحساب">
            <AdminField label="اسم المسؤول/المالك" value={draft.name} onChangeText={(value) => updateDraft({ name: value })} colors={colors} />
            <AdminField label="البريد الإلكتروني" value={draft.email} onChangeText={(value) => updateDraft({ email: value })} colors={colors} autoCapitalize="none" keyboardType="email-address" />
            <AdminField label="هاتف الحساب" value={draft.phone ?? ''} onChangeText={(value) => updateDraft({ phone: value })} colors={colors} keyboardType="phone-pad" />
            <AdminField label={isEditing ? 'كلمة مرور جديدة' : 'كلمة المرور'} value={draft.password ?? ''} onChangeText={(value) => updateDraft({ password: value })} colors={colors} secureTextEntry />
            <AdminToggleRow label="الحساب نشط" value={!!draft.is_active} onValueChange={(value) => updateDraft({ is_active: value })} colors={colors} />
            <AdminToggleRow label="موقوف" value={!!draft.is_suspended} onValueChange={(value) => updateDraft({ is_suspended: value })} colors={colors} />
          </AdminSection>

          <AdminSection title="الملف">
            <AdminField label="اسم النشاط" value={draft.business_name ?? ''} onChangeText={(value) => updateDraft({ business_name: value })} colors={colors} />
            <AdminOptionChips
              label="نوع المزود"
              items={providerTypesQuery.items ?? []}
              selectedValue={draft.provider_type ?? ''}
              getValue={(item) => item.code ?? ''}
              onSelect={(value) => updateDraft({ provider_type: String(value) })}
              colors={colors}
            />
            <AdminOptionChips label="المدينة" items={citiesQuery.items ?? []} selectedValue={draft.city_id ?? null} onSelect={(value) => updateDraft({ city_id: Number(value) })} colors={colors} />
            <AdminOptionChips
              label="التصنيف"
              items={categoriesQuery.items ?? []}
              selectedValue={draft.category_id ?? null}
              onSelect={(value) => updateDraft({ category_id: Number(value), subcategory_id: null })}
              colors={colors}
            />
            <AdminOptionChips label="التخصص" items={visibleSubcategories} selectedValue={draft.subcategory_id ?? null} onSelect={(value) => updateDraft({ subcategory_id: Number(value) })} colors={colors} />
            <AdminField label="نبذة" value={draft.bio ?? ''} onChangeText={(value) => updateDraft({ bio: value })} colors={colors} multiline />
            <AdminField label="هاتف الملف" value={draft.profile_phone ?? ''} onChangeText={(value) => updateDraft({ profile_phone: value })} colors={colors} keyboardType="phone-pad" />
            <AdminField label="واتساب" value={draft.whatsapp ?? ''} onChangeText={(value) => updateDraft({ whatsapp: value })} colors={colors} keyboardType="phone-pad" />
            <AdminToggleRow label="يقدم الخدمة عن بعد" value={!!draft.offers_remote_work} onValueChange={(value) => updateDraft({ offers_remote_work: value })} colors={colors} />
            <AdminToggleRow label="ينتقل بين المدن" value={!!draft.travels_to_cities} onValueChange={(value) => updateDraft({ travels_to_cities: value })} colors={colors} />
            <AdminToggleRow label="تفعيل تقويم الحجز" value={!!draft.has_venue_calendar} onValueChange={(value) => updateDraft({ has_venue_calendar: value })} colors={colors} />
          </AdminSection>

          <View style={[styles.collapsibleSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Pressable onPress={() => setMarketSectionOpen((open) => !open)} style={styles.collapsibleHeader}>
              <Ionicons name={marketSectionOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>السوق والروابط</Text>
            </Pressable>
            {marketSectionOpen ? (
              <View style={{ gap: 10 }}>
                <AdminField label="انتهاء صلاحية الظهور YYYY-MM-DD" value={draft.provider_access_ends_at ?? ''} onChangeText={(value) => updateDraft({ provider_access_ends_at: value })} colors={colors} autoCapitalize="none" />
                <AdminToggleRow label="مميز في الرئيسية" value={!!draft.homepage_featured} onValueChange={(value) => updateDraft({ homepage_featured: value })} colors={colors} />
                {draft.homepage_featured ? (
                  <AdminField label="مميز حتى YYYY-MM-DD" value={draft.homepage_featured_until ?? ''} onChangeText={(value) => updateDraft({ homepage_featured_until: value })} colors={colors} autoCapitalize="none" />
                ) : null}
                <AdminField label="الموقع" value={draft.website ?? ''} onChangeText={(value) => updateDraft({ website: value })} colors={colors} autoCapitalize="none" keyboardType="url" />
                <AdminField label="الخريطة" value={draft.map_url ?? ''} onChangeText={(value) => updateDraft({ map_url: value })} colors={colors} autoCapitalize="none" keyboardType="url" />
                <AdminField label="Instagram" value={draft.instagram_handle ?? ''} onChangeText={(value) => updateDraft({ instagram_handle: value })} colors={colors} autoCapitalize="none" />
                <AdminField label="Facebook" value={draft.facebook_slug ?? ''} onChangeText={(value) => updateDraft({ facebook_slug: value })} colors={colors} autoCapitalize="none" />
                <AdminField label="LinkedIn" value={draft.linkedin_slug ?? ''} onChangeText={(value) => updateDraft({ linkedin_slug: value })} colors={colors} autoCapitalize="none" />
                <AdminField label="ملاحظات نطاق الخدمة" value={draft.service_area_note ?? ''} onChangeText={(value) => updateDraft({ service_area_note: value })} colors={colors} multiline />
              </View>
            ) : null}
          </View>

          {isEditing ? (
            <AdminSection title="إجراءات">
              <View style={styles.actionRow}>
                {[30, 90, 365].map((days) => (
                  <Pressable key={days} onPress={() => extendAccess(days)} disabled={secondaryBusy} style={[styles.actionBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                    <Text style={[styles.actionText, { color: colors.textPrimary }]}>+{days}</Text>
                  </Pressable>
                ))}
              </View>
              <Pressable onPress={generateLink} disabled={secondaryBusy} style={[styles.wideAction, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <Ionicons name="link-outline" size={18} color={colors.primary} />
                <Text style={[styles.wideActionText, { color: colors.textPrimary }]}>إنشاء رابط الإعداد</Text>
              </Pressable>
              {providerQuery.data?.security_flagged ? (
                <Pressable onPress={clearFlag} disabled={secondaryBusy} style={[styles.wideAction, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
                  <Text style={[styles.wideActionText, { color: colors.textPrimary }]}>مسح علامة الأمان</Text>
                </Pressable>
              ) : null}
              <Pressable onPress={confirmDelete} disabled={saveBusy} style={[styles.deleteBtn, { borderColor: colors.error }]}>
                <Ionicons name="trash-outline" size={18} color={colors.error} />
                <Text style={[styles.deleteText, { color: colors.error }]}>حذف المزود</Text>
              </Pressable>
            </AdminSection>
          ) : null}
        </ScrollView>

        <View style={[styles.bottomBar, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <PremiumButton title="حفظ" loadingTitle="جاري الحفظ..." loading={saveBusy} onPress={save} />
        </View>
      </KeyboardAvoidingView>
      <RTLAlert alert={alert} onDismiss={hideAlert} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  kicker: { fontSize: 12, fontFamily: 'Cairo-Bold', textAlign: 'right', writingDirection: 'rtl' },
  headerTitle: { fontSize: 25, fontFamily: 'Cairo-Black', textAlign: 'right', writingDirection: 'rtl' },
  sectionTitle: { fontSize: 17, fontFamily: 'Cairo-Black', textAlign: 'right', writingDirection: 'rtl' },
  collapsibleSection: { borderRadius: 18, borderWidth: 1, padding: 14, gap: 10 },
  collapsibleHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  actionRow: { flexDirection: 'row-reverse', gap: 8 },
  actionBtn: { flex: 1, minHeight: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontSize: 13, fontFamily: 'Cairo-Bold' },
  wideAction: { minHeight: 46, borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8 },
  wideActionText: { fontSize: 13, fontFamily: 'Cairo-Bold', writingDirection: 'rtl' },
  deleteBtn: { minHeight: 46, borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8 },
  deleteText: { fontSize: 13, fontFamily: 'Cairo-Bold', writingDirection: 'rtl' },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopWidth: 1, paddingHorizontal: 20, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 28 : 16 },
  saveBtn: { minHeight: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontSize: 15, fontFamily: 'Cairo-Bold' },
});
