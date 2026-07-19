import { useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
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
import { useCategories, useCities, useProviderTypes } from '../../src/hooks/useApi';
import { useMyProviderProfile, useUpdateProviderProfile } from '../../src/hooks/useProviderManagement';
import { useTheme } from '../../src/hooks/useTheme';
import { parseApiError } from '../../src/lib/error-parser';
import type { LocalImage } from '../../src/services/provider';
import type { ThemeColors } from '../../src/theme/tokens';

async function pickOne(aspect: [number, number]): Promise<LocalImage | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect,
    quality: 0.85,
  });
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  return {
    uri: asset.uri,
    name: asset.fileName ?? `image-${Date.now()}.jpg`,
    type: asset.mimeType ?? 'image/jpeg',
  };
}

function Field({ label, colors, children }: { label: string; colors: ThemeColors; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>{label}</Text>
      {children}
    </View>
  );
}

function SectionHeading({
  title,
  icon,
  colors,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  colors: ThemeColors;
}) {
  return (
    <View style={styles.sectionHeadingRow}>
      <View style={[styles.sectionIcon, { backgroundColor: colors.surfaceAlt }]}>
        <Ionicons name={icon} size={17} color={colors.primary} />
      </View>
      <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>{title}</Text>
    </View>
  );
}

function ChipSelect<T extends string | number>({
  options,
  selected,
  onSelect,
  colors,
  multi = false,
}: {
  options: { value: T; label: string }[];
  selected: T[];
  onSelect: (value: T) => void;
  colors: ThemeColors;
  multi?: boolean;
}) {
  return (
    <View style={styles.chipWrap}>
      {options.map((option) => {
        const active = selected.includes(option.value);
        return (
          <Pressable
            key={String(option.value)}
            onPress={() => onSelect(option.value)}
            style={[styles.chip, { backgroundColor: active ? colors.primary : colors.surface, borderColor: active ? colors.primary : colors.border }]}
          >
            <Text style={[styles.chipText, { color: active ? colors.textOnPrimary : colors.textPrimary }]}>
              {option.label}{multi && active ? ' ✓' : ''}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ProviderProfileEditScreen({ asTab = false }: { asTab?: boolean }) {
  const { colors } = useTheme();
  const { alert, showAlert, hideAlert } = useRTLAlert();
  const { data: profile, isLoading, isError, error, refetch } = useMyProviderProfile();
  const { data: cities } = useCities();
  const { data: providerTypes } = useProviderTypes();
  const { data: categories } = useCategories();
  const updateProfile = useUpdateProviderProfile();

  const [businessName, setBusinessName] = useState('');
  const [providerType, setProviderType] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [subcategoryIds, setSubcategoryIds] = useState<number[]>([]);
  const [cityId, setCityId] = useState<number | null>(null);
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [offersRemote, setOffersRemote] = useState(false);
  const [travelsToCities, setTravelsToCities] = useState(false);
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [mapUrl, setMapUrl] = useState('');
  const [logo, setLogo] = useState<LocalImage | null>(null);
  const [cover, setCover] = useState<LocalImage | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!profile || hydrated) return;
    setBusinessName(profile.name ?? '');
    setProviderType(profile.provider_type ?? '');
    setCategoryId(profile.category?.id ?? null);
    setSubcategoryIds(profile.subcategories?.map((s) => s.id) ?? []);
    setCityId(profile.city?.id ?? null);
    setBio(profile.description ?? '');
    setPhone(profile.phone ?? '');
    setWhatsapp(profile.whatsapp_url?.replace('https://wa.me/', '') ?? '');
    setExperienceYears(profile.years_experience != null ? String(profile.years_experience) : '');
    setOffersRemote(!!profile.offers_remote_work);
    setTravelsToCities(!!profile.travels_to_cities);
    setWebsite(profile.website ?? '');
    setInstagram(profile.social_links?.instagram ?? '');
    setFacebook(profile.social_links?.facebook ?? '');
    setLinkedin(profile.social_links?.linkedin ?? '');
    setGithub(profile.social_links?.github ?? '');
    setMapUrl(profile.social_links?.map_url ?? '');
    setHydrated(true);
  }, [profile, hydrated]);

  const selectedCategory = useMemo(
    () => categories?.find((c) => c.id === categoryId),
    [categories, categoryId],
  );

  if (isLoading) return <LoadingSpinner />;
  if (isError || !profile) return <ErrorView error={error} onRetry={refetch} />;

  const submit = () => {
    if (!phone.trim() || !whatsapp.trim()) {
      showAlert('تنبيه', 'رقم الهاتف وواتساب مطلوبان.', [{ text: 'حسناً' }]);
      return;
    }

    const parsedExperience = experienceYears ? Number(experienceYears) : undefined;
    if (parsedExperience !== undefined && (parsedExperience < 0 || parsedExperience > 100)) {
      showAlert('تنبيه', 'سنوات الخبرة يجب أن تكون بين 0 و100.', [{ text: 'حسناً' }]);
      return;
    }

    updateProfile.mutate(
      {
        input: {
          business_name: businessName.trim() || undefined,
          provider_type: providerType || undefined,
          category_id: categoryId ?? undefined,
          subcategory_ids: subcategoryIds,
          city_id: cityId ?? undefined,
          bio: bio.trim() || undefined,
          phone: phone.trim(),
          whatsapp: whatsapp.trim(),
          experience_years: parsedExperience,
          offers_remote_work: offersRemote,
          travels_to_cities: travelsToCities,
          website: website.trim() || undefined,
          instagram_handle: instagram.trim() || undefined,
          facebook_slug: facebook.trim() || undefined,
          linkedin_slug: linkedin.trim() || undefined,
          github_username: github.trim() || undefined,
          map_url: mapUrl.trim() || undefined,
        },
        images: {
          logo: logo ?? undefined,
          cover: cover ?? undefined,
        },
      },
      {
        onSuccess: () => {
          showAlert('تم الحفظ', 'تم تحديث ملفك بنجاح.', [
            { text: 'حسناً', onPress: asTab ? undefined : () => router.back() },
          ]);
        },
        onError: (err) => showAlert('تعذر الحفظ', parseApiError(err).message, [{ text: 'حسناً' }]),
      },
    );
  };

  const inputStyle = [styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{asTab ? 'ملفي' : 'تعديل ملفي التجاري'}</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>حدّث المعلومات التي تظهر للعملاء</Text>
          </View>
          {!asTab ? (
            <Pressable onPress={() => router.back()} hitSlop={10} style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="arrow-forward" size={24} color={colors.textPrimary} />
            </Pressable>
          ) : null}
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
          <SectionHeading title="الهوية البصرية" icon="images-outline" colors={colors} />

          <View style={[styles.mediaCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Pressable onPress={async () => setCover((await pickOne([8, 5])) ?? cover)} style={styles.coverPick}>
              <Image
                source={{ uri: cover?.uri ?? profile.cover_url ?? undefined }}
                style={[styles.coverPreview, { backgroundColor: colors.surfaceAlt }]}
                contentFit="cover"
              />
              <View style={[styles.coverAction, { backgroundColor: colors.surface }]}>
                <Ionicons name="camera-outline" size={15} color={colors.primary} />
                <Text style={[styles.coverActionText, { color: colors.primary }]}>تغيير الغلاف</Text>
              </View>
            </Pressable>

            <Pressable onPress={async () => setLogo((await pickOne([1, 1])) ?? logo)} style={[styles.logoPick, { borderColor: colors.surface }]}>
              <Image
                source={{ uri: logo?.uri ?? profile.logo_url ?? undefined }}
                style={[styles.logoPreview, { backgroundColor: colors.surfaceAlt }]}
                contentFit="cover"
              />
              <View style={[styles.logoBadge, { backgroundColor: colors.primary }]}>
                <Ionicons name="camera" size={13} color={colors.textOnPrimary} />
              </View>
            </Pressable>
          </View>

          <SectionHeading title="المعلومات الأساسية" icon="business-outline" colors={colors} />

          <Field label="اسم النشاط التجاري" colors={colors}>
            <TextInput value={businessName} onChangeText={setBusinessName} placeholder="مثال: الأمان للصيانة" placeholderTextColor={colors.textMuted} style={inputStyle} maxLength={500} />
          </Field>

          <Field label="نوع النشاط" colors={colors}>
            <ChipSelect
              options={(providerTypes ?? []).map((t) => ({ value: t.code, label: t.name }))}
              selected={providerType ? [providerType] : []}
              onSelect={setProviderType}
              colors={colors}
            />
          </Field>

          <Field label="التصنيف الرئيسي" colors={colors}>
            <ChipSelect
              options={(categories ?? []).map((c) => ({ value: c.id, label: c.name }))}
              selected={categoryId != null ? [categoryId] : []}
              onSelect={(id) => {
                if (id !== categoryId) setSubcategoryIds([]);
                setCategoryId(id);
              }}
              colors={colors}
            />
          </Field>

          {selectedCategory?.subcategories?.length ? (
            <Field label="التخصصات (يمكن اختيار أكثر من واحد)" colors={colors}>
              <ChipSelect
                multi
                options={selectedCategory.subcategories.map((s) => ({ value: s.id, label: s.name }))}
                selected={subcategoryIds}
                onSelect={(id) =>
                  setSubcategoryIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
                }
                colors={colors}
              />
            </Field>
          ) : null}

          <Field label="المدينة" colors={colors}>
            <ChipSelect
              options={(cities ?? []).map((c) => ({ value: c.id, label: c.name }))}
              selected={cityId != null ? [cityId] : []}
              onSelect={setCityId}
              colors={colors}
            />
          </Field>

          <Field label="نبذة عن النشاط" colors={colors}>
            <TextInput value={bio} onChangeText={setBio} placeholder="اكتب نبذة قصيرة عن خدماتك" placeholderTextColor={colors.textMuted} style={[...inputStyle, styles.multiline]} multiline maxLength={500} />
          </Field>

          <SectionHeading title="معلومات التواصل" icon="call-outline" colors={colors} />

          <Field label="رقم الهاتف" colors={colors}>
            <TextInput value={phone} onChangeText={setPhone} placeholder="+218912345678" placeholderTextColor={colors.textMuted} style={inputStyle} keyboardType="phone-pad" maxLength={20} />
          </Field>

          <Field label="واتساب (مفتاح الدولة ثم الرقم، بدون +)" colors={colors}>
            <TextInput value={whatsapp} onChangeText={setWhatsapp} placeholder="218912345678" placeholderTextColor={colors.textMuted} style={inputStyle} keyboardType="phone-pad" maxLength={15} />
          </Field>

          <Field label="سنوات الخبرة" colors={colors}>
            <TextInput value={experienceYears} onChangeText={setExperienceYears} placeholder="5" placeholderTextColor={colors.textMuted} style={inputStyle} keyboardType="number-pad" maxLength={3} />
          </Field>

          <SectionHeading title="طريقة تقديم الخدمة" icon="options-outline" colors={colors} />

          <View style={[styles.switchRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.switchCopy}>
              <Text style={[styles.switchLabel, { color: colors.textPrimary }]}>تقديم خدمات عن بعد</Text>
              <Text style={[styles.switchHint, { color: colors.textMuted }]}>تظهر للعملاء كخدمة يمكن تنفيذها أونلاين</Text>
            </View>
            <Switch value={offersRemote} onValueChange={setOffersRemote} trackColor={{ true: colors.primary }} />
          </View>

          <View style={[styles.switchRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.switchCopy}>
              <Text style={[styles.switchLabel, { color: colors.textPrimary }]}>يتنقل بين المدن</Text>
              <Text style={[styles.switchHint, { color: colors.textMuted }]}>فعّلها إذا كنت تقبل طلبات خارج مدينتك</Text>
            </View>
            <Switch value={travelsToCities} onValueChange={setTravelsToCities} trackColor={{ true: colors.primary }} />
          </View>

          <SectionHeading title="الروابط (اختياري)" icon="link-outline" colors={colors} />

          <Field label="الموقع الإلكتروني" colors={colors}>
            <TextInput value={website} onChangeText={setWebsite} placeholder="https://example.com" placeholderTextColor={colors.textMuted} style={inputStyle} autoCapitalize="none" keyboardType="url" maxLength={255} />
          </Field>

          <Field label="إنستاجرام" colors={colors}>
            <TextInput value={instagram} onChangeText={setInstagram} placeholder="https://instagram.com/..." placeholderTextColor={colors.textMuted} style={inputStyle} autoCapitalize="none" keyboardType="url" maxLength={255} />
          </Field>

          <Field label="فيسبوك" colors={colors}>
            <TextInput value={facebook} onChangeText={setFacebook} placeholder="https://facebook.com/..." placeholderTextColor={colors.textMuted} style={inputStyle} autoCapitalize="none" keyboardType="url" maxLength={255} />
          </Field>

          <Field label="لينكد إن" colors={colors}>
            <TextInput value={linkedin} onChangeText={setLinkedin} placeholder="https://linkedin.com/..." placeholderTextColor={colors.textMuted} style={inputStyle} autoCapitalize="none" keyboardType="url" maxLength={255} />
          </Field>

          <Field label="جيتهاب" colors={colors}>
            <TextInput value={github} onChangeText={setGithub} placeholder="https://github.com/..." placeholderTextColor={colors.textMuted} style={inputStyle} autoCapitalize="none" keyboardType="url" maxLength={255} />
          </Field>

          <Field label="رابط موقعك على الخريطة" colors={colors}>
            <TextInput value={mapUrl} onChangeText={setMapUrl} placeholder="https://maps.google.com/..." placeholderTextColor={colors.textMuted} style={inputStyle} autoCapitalize="none" keyboardType="url" maxLength={255} />
          </Field>

          <Pressable
            onPress={submit}
            disabled={updateProfile.isPending}
            style={({ pressed }) => [styles.saveBtn, { backgroundColor: colors.primary, opacity: updateProfile.isPending || pressed ? 0.7 : 1 }]}
          >
            {updateProfile.isPending ? (
              <ActivityIndicator size="small" color={colors.textOnPrimary} />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={19} color={colors.textOnPrimary} />
                <Text style={[styles.saveText, { color: colors.textOnPrimary }]}>حفظ التعديلات</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <RTLAlert alert={alert} onDismiss={hideAlert} />
    </SafeAreaView>
  );
}

export default function ProviderProfileEditRoute() {
  return <ProviderProfileEditScreen />;
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12, minHeight: 78, justifyContent: 'center' },
  headerCopy: { alignItems: 'flex-end', paddingLeft: 56 },
  headerTitle: { fontSize: 22, fontFamily: 'Cairo-Black', writingDirection: 'rtl' },
  headerSubtitle: { marginTop: 2, fontSize: 12, fontFamily: 'Cairo-SemiBold', writingDirection: 'rtl' },
  backButton: { position: 'absolute', left: 20, top: 22, width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  mediaCard: { minHeight: 190, borderRadius: 18, borderWidth: 1, padding: 8, marginTop: 12, marginBottom: 20 },
  coverPick: { minHeight: 132, borderRadius: 14, overflow: 'hidden' },
  logoPick: { position: 'absolute', right: 22, bottom: 14, width: 78, height: 78, borderRadius: 24, borderWidth: 4 },
  logoPreview: { width: '100%', height: '100%', borderRadius: 20 },
  coverPreview: { width: '100%', height: 132 },
  coverAction: { position: 'absolute', top: 10, left: 10, minHeight: 34, borderRadius: 999, paddingHorizontal: 12, flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  coverActionText: { fontSize: 12, fontFamily: 'Cairo-Bold', writingDirection: 'rtl' },
  logoBadge: { position: 'absolute', left: -2, bottom: -2, borderRadius: 999, padding: 6 },
  fieldLabel: { fontSize: 12, fontFamily: 'Cairo-Bold', textAlign: 'right', writingDirection: 'rtl', marginBottom: 6 },
  input: { minHeight: 50, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, fontSize: 14, fontFamily: 'Cairo-SemiBold', textAlign: 'right', writingDirection: 'rtl' },
  multiline: { minHeight: 96, paddingTop: 12, textAlignVertical: 'top' },
  chipWrap: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, height: 36, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontSize: 12, fontFamily: 'Cairo-Bold' },
  sectionHeadingRow: { marginTop: 26, flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  sectionIcon: { width: 32, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  switchRow: { marginTop: 10, minHeight: 74, borderRadius: 16, borderWidth: 1, paddingVertical: 12, paddingRight: 14, paddingLeft: 10, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  switchCopy: { flex: 1, alignItems: 'flex-end' },
  sectionHeading: { fontSize: 16, fontFamily: 'Cairo-Black', textAlign: 'right', writingDirection: 'rtl' },
  switchLabel: { fontSize: 14, fontFamily: 'Cairo-Bold' },
  switchHint: { marginTop: 2, fontSize: 11, fontFamily: 'Cairo-SemiBold', textAlign: 'right', writingDirection: 'rtl' },
  saveBtn: { marginTop: 24, minHeight: 52, borderRadius: 16, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveText: { fontSize: 15, fontFamily: 'Cairo-Bold' },
});
