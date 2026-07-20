import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import type { AdminCatalogItem, AdminProviderInput } from '../../src/services/admin';
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

  const providerQuery = useAdminProvider(providerId);
  const { data: categoriesData } = useAdminCatalog('categories', {});
  const { data: subcategoriesData } = useAdminCatalog('subcategories', {
    category_id: draft.category_id ? Number(draft.category_id) : undefined,
  });
  const { data: citiesData } = useAdminCatalog('cities', {});
  const { data: providerTypesData } = useAdminCatalog('providerTypes', {});
  const mutations = useAdminProviderMutations();

  const busy =
    mutations.create.isPending ||
    mutations.update.isPending ||
    mutations.remove.isPending ||
    mutations.extendAccess.isPending ||
    mutations.clearSecurityFlag.isPending ||
    mutations.onboardingLink.isPending;

  useEffect(() => {
    if (providerQuery.data) setDraft(draftFromProvider(providerQuery.data));
  }, [providerQuery.data]);

  const title = isEditing ? 'تعديل مزود' : 'إضافة مزود';
  const visibleSubcategories = useMemo(() => subcategoriesData?.items ?? [], [subcategoriesData?.items]);

  const updateDraft = (patch: Partial<AdminProviderInput>) => setDraft((current) => ({ ...current, ...patch }));

  const save = () => {
    const input = cleanDraft(draft);
    if (!input.name || !input.email) {
      showAlert('تنبيه', 'اسم المزود والبريد الإلكتروني مطلوبان.', [{ text: 'حسنا' }]);
      return;
    }

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
      onSuccess: (provider) => setDraft(draftFromProvider(provider)),
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
      onSuccess: (provider) => setDraft(draftFromProvider(provider)),
      onError: (err) => showAlert('تعذر تحديث الحالة', parseApiError(err).message, [{ text: 'حسنا' }]),
    });
  };

  if (isEditing && providerQuery.isLoading) return <LoadingSpinner />;
  if (isEditing && (providerQuery.isError || !providerQuery.data)) {
    return <ErrorView error={providerQuery.error} onRetry={providerQuery.refetch} />;
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
          <Section title="الحساب">
            <Field label="اسم المسؤول/المالك" value={draft.name} onChangeText={(value) => updateDraft({ name: value })} colors={colors} />
            <Field label="البريد الإلكتروني" value={draft.email} onChangeText={(value) => updateDraft({ email: value })} colors={colors} autoCapitalize="none" keyboardType="email-address" />
            <Field label="هاتف الحساب" value={draft.phone ?? ''} onChangeText={(value) => updateDraft({ phone: value })} colors={colors} keyboardType="phone-pad" />
            <Field label={isEditing ? 'كلمة مرور جديدة' : 'كلمة المرور'} value={draft.password ?? ''} onChangeText={(value) => updateDraft({ password: value })} colors={colors} secureTextEntry />
            <ToggleRow label="الحساب نشط" value={!!draft.is_active} onValueChange={(value) => updateDraft({ is_active: value })} colors={colors} />
            <ToggleRow label="موقوف" value={!!draft.is_suspended} onValueChange={(value) => updateDraft({ is_suspended: value })} colors={colors} />
          </Section>

          <Section title="الملف">
            <Field label="اسم النشاط" value={draft.business_name ?? ''} onChangeText={(value) => updateDraft({ business_name: value })} colors={colors} />
            <OptionChips
              label="نوع المزود"
              items={providerTypesData?.items ?? []}
              selectedValue={draft.provider_type ?? ''}
              getValue={(item) => item.code ?? ''}
              onSelect={(value) => updateDraft({ provider_type: String(value) })}
              colors={colors}
            />
            <OptionChips label="المدينة" items={citiesData?.items ?? []} selectedValue={draft.city_id ?? null} onSelect={(value) => updateDraft({ city_id: Number(value) })} colors={colors} />
            <OptionChips
              label="التصنيف"
              items={categoriesData?.items ?? []}
              selectedValue={draft.category_id ?? null}
              onSelect={(value) => updateDraft({ category_id: Number(value), subcategory_id: null })}
              colors={colors}
            />
            <OptionChips label="التخصص" items={visibleSubcategories} selectedValue={draft.subcategory_id ?? null} onSelect={(value) => updateDraft({ subcategory_id: Number(value) })} colors={colors} />
            <Field label="نبذة" value={draft.bio ?? ''} onChangeText={(value) => updateDraft({ bio: value })} colors={colors} multiline />
            <Field label="هاتف الملف" value={draft.profile_phone ?? ''} onChangeText={(value) => updateDraft({ profile_phone: value })} colors={colors} keyboardType="phone-pad" />
            <Field label="واتساب" value={draft.whatsapp ?? ''} onChangeText={(value) => updateDraft({ whatsapp: value })} colors={colors} keyboardType="phone-pad" />
            <ToggleRow label="يقدم الخدمة عن بعد" value={!!draft.offers_remote_work} onValueChange={(value) => updateDraft({ offers_remote_work: value })} colors={colors} />
            <ToggleRow label="ينتقل بين المدن" value={!!draft.travels_to_cities} onValueChange={(value) => updateDraft({ travels_to_cities: value })} colors={colors} />
            <ToggleRow label="تفعيل تقويم الحجز" value={!!draft.has_venue_calendar} onValueChange={(value) => updateDraft({ has_venue_calendar: value })} colors={colors} />
          </Section>

          <Section title="السوق والروابط">
            <Field label="انتهاء صلاحية الظهور YYYY-MM-DD" value={draft.provider_access_ends_at ?? ''} onChangeText={(value) => updateDraft({ provider_access_ends_at: value })} colors={colors} autoCapitalize="none" />
            <ToggleRow label="مميز في الرئيسية" value={!!draft.homepage_featured} onValueChange={(value) => updateDraft({ homepage_featured: value })} colors={colors} />
            {draft.homepage_featured ? (
              <Field label="مميز حتى YYYY-MM-DD" value={draft.homepage_featured_until ?? ''} onChangeText={(value) => updateDraft({ homepage_featured_until: value })} colors={colors} autoCapitalize="none" />
            ) : null}
            <Field label="الموقع" value={draft.website ?? ''} onChangeText={(value) => updateDraft({ website: value })} colors={colors} autoCapitalize="none" keyboardType="url" />
            <Field label="الخريطة" value={draft.map_url ?? ''} onChangeText={(value) => updateDraft({ map_url: value })} colors={colors} autoCapitalize="none" keyboardType="url" />
            <Field label="Instagram" value={draft.instagram_handle ?? ''} onChangeText={(value) => updateDraft({ instagram_handle: value })} colors={colors} autoCapitalize="none" />
            <Field label="Facebook" value={draft.facebook_slug ?? ''} onChangeText={(value) => updateDraft({ facebook_slug: value })} colors={colors} autoCapitalize="none" />
            <Field label="LinkedIn" value={draft.linkedin_slug ?? ''} onChangeText={(value) => updateDraft({ linkedin_slug: value })} colors={colors} autoCapitalize="none" />
            <Field label="ملاحظات نطاق الخدمة" value={draft.service_area_note ?? ''} onChangeText={(value) => updateDraft({ service_area_note: value })} colors={colors} multiline />
          </Section>

          {isEditing ? (
            <Section title="إجراءات">
              <View style={styles.actionRow}>
                {[30, 90, 365].map((days) => (
                  <Pressable key={days} onPress={() => extendAccess(days)} disabled={busy} style={[styles.actionBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                    <Text style={[styles.actionText, { color: colors.textPrimary }]}>+{days}</Text>
                  </Pressable>
                ))}
              </View>
              <Pressable onPress={generateLink} disabled={busy} style={[styles.wideAction, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <Ionicons name="link-outline" size={18} color={colors.primary} />
                <Text style={[styles.wideActionText, { color: colors.textPrimary }]}>إنشاء رابط الإعداد</Text>
              </Pressable>
              {providerQuery.data?.security_flagged ? (
                <Pressable onPress={clearFlag} disabled={busy} style={[styles.wideAction, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
                  <Text style={[styles.wideActionText, { color: colors.textPrimary }]}>مسح علامة الأمان</Text>
                </Pressable>
              ) : null}
              <Pressable onPress={confirmDelete} disabled={busy} style={[styles.deleteBtn, { borderColor: colors.error }]}>
                <Ionicons name="trash-outline" size={18} color={colors.error} />
                <Text style={[styles.deleteText, { color: colors.error }]}>حذف المزود</Text>
              </Pressable>
            </Section>
          ) : null}
        </ScrollView>

        <View style={[styles.bottomBar, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Pressable onPress={save} disabled={busy} style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: busy ? 0.7 : 1 }]}>
            {busy ? <ActivityIndicator size="small" color={colors.textOnPrimary} /> : <Text style={[styles.saveText, { color: colors.textOnPrimary }]}>حفظ</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
      <RTLAlert alert={alert} onDismiss={hideAlert} />
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
      {children}
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  colors,
  keyboardType,
  autoCapitalize = 'sentences',
  multiline = false,
  secureTextEntry = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  colors: ReturnType<typeof useTheme>['colors'];
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'url';
  autoCapitalize?: 'none' | 'sentences';
  multiline?: boolean;
  secureTextEntry?: boolean;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        secureTextEntry={secureTextEntry}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, multiline && styles.textArea, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.bg }]}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onValueChange,
  colors,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={[styles.toggleRow, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: colors.primary }} />
      <Text style={[styles.toggleText, { color: colors.textPrimary }]}>{label}</Text>
    </View>
  );
}

function OptionChips({
  label,
  items,
  selectedValue,
  onSelect,
  colors,
  getValue = (item) => item.id,
}: {
  label: string;
  items: AdminCatalogItem[];
  selectedValue: string | number | null;
  onSelect: (value: string | number) => void;
  colors: ReturnType<typeof useTheme>['colors'];
  getValue?: (item: AdminCatalogItem) => string | number;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>{label}</Text>
      <View style={styles.chips}>
        {items.map((item) => {
          const value = getValue(item);
          const active = String(selectedValue ?? '') === String(value);
          return (
            <Pressable
              key={`${label}-${item.id}`}
              onPress={() => onSelect(value)}
              style={[styles.chip, { backgroundColor: active ? colors.primary : colors.bg, borderColor: active ? colors.primary : colors.border }]}
            >
              <Text numberOfLines={1} style={[styles.chipText, { color: active ? colors.textOnPrimary : colors.textMuted }]}>
                {item.localized_name || item.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  kicker: { fontSize: 12, fontFamily: 'Cairo-Bold', textAlign: 'right', writingDirection: 'rtl' },
  headerTitle: { fontSize: 25, fontFamily: 'Cairo-Black', textAlign: 'right', writingDirection: 'rtl' },
  section: { borderRadius: 18, borderWidth: 1, padding: 14, gap: 10 },
  sectionTitle: { fontSize: 17, fontFamily: 'Cairo-Black', textAlign: 'right', writingDirection: 'rtl', marginBottom: 2 },
  fieldWrap: { gap: 6 },
  fieldLabel: { fontSize: 12, fontFamily: 'Cairo-Bold', textAlign: 'right', writingDirection: 'rtl' },
  input: { minHeight: 46, borderRadius: 14, borderWidth: 1, paddingHorizontal: 13, fontSize: 13, fontFamily: 'Cairo-SemiBold', textAlign: 'right', writingDirection: 'rtl' },
  textArea: { minHeight: 92, paddingTop: 12 },
  toggleRow: { minHeight: 48, borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleText: { fontSize: 13, fontFamily: 'Cairo-Bold', writingDirection: 'rtl' },
  chips: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 7 },
  chip: { maxWidth: '100%', minHeight: 32, borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  chipText: { maxWidth: 180, fontSize: 11, fontFamily: 'Cairo-Bold', writingDirection: 'rtl' },
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
