import { useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  Image as RNImage,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PremiumButton } from '../../components/auth/premiumAuth';
import { ErrorView } from '../../components/ui/ErrorView';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { RTLAlert, useRTLAlert } from '../../components/ui/RTLAlert';
import { useCategories, useCities, useProviderTypes } from '../../src/hooks/useApi';
import { useMyProviderProfile, useUpdateProviderProfile } from '../../src/hooks/useProviderManagement';
import { useTheme } from '../../src/hooks/useTheme';
import { parseApiError } from '../../src/lib/error-parser';
import type { LocalImage } from '../../src/services/provider';
import type { ThemeColors } from '../../src/theme/tokens';

const ACCEPTED_PROFILE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const MAX_COVER_BYTES = 4 * 1024 * 1024;
const LOGO_EDITOR_FRAME = 240;
const LOGO_OUTPUT_SIZE = 512;
const COVER_EDITOR_WIDTH = 300;
const COVER_EDITOR_HEIGHT = 188;
const COVER_OUTPUT_WIDTH = 1280;
const COVER_OUTPUT_HEIGHT = 800;

type EditableImage = LocalImage & {
  width: number;
  height: number;
};

function getGestureTouches(event: { nativeEvent?: { touches?: Array<{ pageX: number; pageY: number }>; changedTouches?: Array<{ pageX: number; pageY: number }> } }) {
  return event.nativeEvent?.touches ?? event.nativeEvent?.changedTouches ?? [];
}

function getImageSize(uri: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    RNImage.getSize(uri, (width, height) => resolve({ width, height }), reject);
  });
}

async function cacheRemoteImageForEditing(uri: string) {
  if (!FileSystem.cacheDirectory) return uri;

  const dir = `${FileSystem.cacheDirectory}profile-logo-editor/`;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => undefined);
  const extension = uri.split('?')[0].match(/\.(jpe?g|png|webp)$/i)?.[1]?.toLowerCase() ?? 'png';
  const target = `${dir}logo-${Date.now()}.${extension === 'jpg' ? 'jpeg' : extension}`;
  const downloaded = await FileSystem.downloadAsync(uri, target);

  return downloaded.uri;
}

async function pickOne({
  aspect,
  maxSizeBytes,
  allowsEditing = true,
  onInvalid,
}: {
  aspect: [number, number];
  maxSizeBytes: number;
  allowsEditing?: boolean;
  onInvalid: (message: string) => void;
}): Promise<EditableImage | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing,
    aspect,
    quality: 0.85,
  });
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  const mimeType = asset.mimeType ?? 'image/jpeg';

  if (!ACCEPTED_PROFILE_IMAGE_TYPES.includes(mimeType)) {
    onInvalid('الصورة يجب أن تكون بصيغة JPG أو PNG أو WEBP.');
    return null;
  }

  if (asset.fileSize && asset.fileSize > maxSizeBytes) {
    const maxMb = Math.round(maxSizeBytes / 1024 / 1024);
    onInvalid(`حجم الصورة يجب ألا يتجاوز ${maxMb} ميجابايت.`);
    return null;
  }

  return {
    uri: asset.uri,
    name: asset.fileName ?? `image-${Date.now()}.jpg`,
    type: mimeType,
    width: asset.width,
    height: asset.height,
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

const CHIP_SCROLL_THRESHOLD = 6;

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
  const renderChip = (option: { value: T; label: string }) => {
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
  };

  // Long lists scroll horizontally (same pattern as the search filters);
  // short ones wrap so everything stays visible.
  if (options.length > CHIP_SCROLL_THRESHOLD) {
    return (
      <FlatList
        horizontal
        inverted
        showsHorizontalScrollIndicator={false}
        data={options}
        keyExtractor={(item) => String(item.value)}
        contentContainerStyle={styles.chipScrollRow}
        renderItem={({ item }) => renderChip(item)}
      />
    );
  }

  return <View style={styles.chipWrap}>{options.map(renderChip)}</View>;
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
  const [logoDraft, setLogoDraft] = useState<EditableImage | null>(null);
  const [logoEditorOpen, setLogoEditorOpen] = useState(false);
  const [logoZoom, setLogoZoom] = useState(1);
  const [logoOffsetX, setLogoOffsetX] = useState(0);
  const [logoOffsetY, setLogoOffsetY] = useState(0);
  const logoDragStart = useRef({ x: 0, y: 0 });
  const logoPinchStartDistance = useRef<number | null>(null);
  const logoPinchStartZoom = useRef(1);
  const [cover, setCover] = useState<LocalImage | null>(null);
  const [coverDraft, setCoverDraft] = useState<EditableImage | null>(null);
  const [coverEditorOpen, setCoverEditorOpen] = useState(false);
  const [coverZoom, setCoverZoom] = useState(1);
  const [coverOffsetX, setCoverOffsetX] = useState(0);
  const [coverOffsetY, setCoverOffsetY] = useState(0);
  const coverDragStart = useRef({ x: 0, y: 0 });
  const coverPinchStartDistance = useRef<number | null>(null);
  const coverPinchStartZoom = useRef(1);
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
            { text: 'حسناً' },
          ]);
        },
        onError: (err) => showAlert('تعذر الحفظ', parseApiError(err).message, [{ text: 'حسناً' }]),
      },
    );
  };

  const inputStyle = [styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }];
  const currentLogoUri = logoDraft?.uri ?? logo?.uri ?? profile.logo_url ?? undefined;
  const logoDraftBaseScale = logoDraft ? Math.max(LOGO_EDITOR_FRAME / logoDraft.width, LOGO_EDITOR_FRAME / logoDraft.height) : 1;
  const logoEditorRenderedWidth = logoDraft ? logoDraft.width * logoDraftBaseScale * logoZoom : 180;
  const logoEditorRenderedHeight = logoDraft ? logoDraft.height * logoDraftBaseScale * logoZoom : 180;
  const currentCoverUri = coverDraft?.uri ?? cover?.uri ?? profile.cover_url ?? undefined;
  const coverDraftBaseScale = coverDraft ? Math.max(COVER_EDITOR_WIDTH / coverDraft.width, COVER_EDITOR_HEIGHT / coverDraft.height) : 1;
  const coverEditorRenderedWidth = coverDraft ? coverDraft.width * coverDraftBaseScale * coverZoom : COVER_EDITOR_WIDTH;
  const coverEditorRenderedHeight = coverDraft ? coverDraft.height * coverDraftBaseScale * coverZoom : COVER_EDITOR_HEIGHT;

  const resetLogoEditorTransform = () => {
    setLogoZoom(1);
    setLogoOffsetX(0);
    setLogoOffsetY(0);
  };

  const resetCoverEditorTransform = () => {
    setCoverZoom(1);
    setCoverOffsetX(0);
    setCoverOffsetY(0);
  };

  const openLogoEditor = async () => {
    resetLogoEditorTransform();

    if (logo?.uri) {
      setLogoDraft({
        ...logo,
        width: 'width' in logo ? (logo as EditableImage).width : LOGO_OUTPUT_SIZE,
        height: 'height' in logo ? (logo as EditableImage).height : LOGO_OUTPUT_SIZE,
      });
      setLogoEditorOpen(true);
      return;
    }

    if (profile.logo_url) {
      try {
        const [{ width, height }, localUri] = await Promise.all([
          getImageSize(profile.logo_url),
          cacheRemoteImageForEditing(profile.logo_url),
        ]);
        setLogoDraft({
          uri: localUri,
          name: `logo-current-${profile.id}.png`,
          type: 'image/png',
          width,
          height,
        });
        setLogoEditorOpen(true);
      } catch {
        setLogoEditorOpen(true);
        void pickLogoDraft();
      }
      return;
    }

    setLogoEditorOpen(true);
    void pickLogoDraft();
  };

  const logoPanResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => Boolean(logoDraft),
        onMoveShouldSetPanResponder: (event, gestureState) =>
          Boolean(logoDraft) && (getGestureTouches(event).length >= 2 || Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2),
        onPanResponderGrant: (event) => {
          logoDragStart.current = { x: logoOffsetX, y: logoOffsetY };
          const touches = getGestureTouches(event);
          if (touches.length >= 2) {
            logoPinchStartDistance.current = Math.hypot(touches[0].pageX - touches[1].pageX, touches[0].pageY - touches[1].pageY);
            logoPinchStartZoom.current = logoZoom;
          }
        },
        onPanResponderMove: (event, gestureState) => {
          const touches = getGestureTouches(event);
          if (touches.length >= 2) {
            const distance = Math.hypot(touches[0].pageX - touches[1].pageX, touches[0].pageY - touches[1].pageY);
            if (!logoPinchStartDistance.current) {
              logoPinchStartDistance.current = distance;
              logoPinchStartZoom.current = logoZoom;
            }
            const nextZoom = logoPinchStartZoom.current * (distance / logoPinchStartDistance.current);
            setLogoZoom(Math.max(1, Math.min(3, Number(nextZoom.toFixed(2)))));
            return;
          }

          logoPinchStartDistance.current = null;
          setLogoOffsetX(Math.max(-LOGO_EDITOR_FRAME, Math.min(LOGO_EDITOR_FRAME, logoDragStart.current.x + gestureState.dx)));
          setLogoOffsetY(Math.max(-LOGO_EDITOR_FRAME, Math.min(LOGO_EDITOR_FRAME, logoDragStart.current.y + gestureState.dy)));
        },
        onPanResponderRelease: () => {
          logoPinchStartDistance.current = null;
        },
        onPanResponderTerminate: () => {
          logoPinchStartDistance.current = null;
        },
      });

  const pickLogoDraft = async () => {
    const picked = await pickOne({
      aspect: [1, 1],
      maxSizeBytes: MAX_LOGO_BYTES,
      allowsEditing: false,
      onInvalid: (message) => showAlert('تعذر اختيار الشعار', message, [{ text: 'حسناً' }]),
    });
    if (picked) {
      setLogoDraft(picked);
      resetLogoEditorTransform();
    }
  };

  const closeLogoEditor = () => {
    setLogoDraft(null);
    resetLogoEditorTransform();
    setLogoEditorOpen(false);
  };

  const saveLogoDraft = async () => {
    if (!logoDraft) return;
    const baseScale = Math.max(LOGO_EDITOR_FRAME / logoDraft.width, LOGO_EDITOR_FRAME / logoDraft.height);
    const renderedScale = baseScale * logoZoom;
    const cropSize = Math.min(logoDraft.width, logoDraft.height, LOGO_EDITOR_FRAME / renderedScale);
    const maxOriginX = logoDraft.width - cropSize;
    const maxOriginY = logoDraft.height - cropSize;
    const rawOriginX = (logoDraft.width - cropSize) / 2 - logoOffsetX / renderedScale;
    const rawOriginY = (logoDraft.height - cropSize) / 2 - logoOffsetY / renderedScale;
    const originX = Math.max(0, Math.min(maxOriginX, rawOriginX));
    const originY = Math.max(0, Math.min(maxOriginY, rawOriginY));

    try {
      const result = await ImageManipulator.manipulateAsync(
        logoDraft.uri,
        [
          {
            crop: {
              originX: Math.round(originX),
              originY: Math.round(originY),
              width: Math.round(cropSize),
              height: Math.round(cropSize),
            },
          },
          { resize: { width: LOGO_OUTPUT_SIZE, height: LOGO_OUTPUT_SIZE } },
        ],
        { compress: 0.92, format: ImageManipulator.SaveFormat.PNG },
      );
      setLogo({
        uri: result.uri,
        name: `logo-${Date.now()}.png`,
        type: 'image/png',
      });
    } catch {
      showAlert('تعذر تعديل الشعار', 'لم نتمكن من حفظ تعديل الصورة. حاول بصورة أخرى.', [{ text: 'حسناً' }]);
      return;
    }
    closeLogoEditor();
  };

  const openCoverEditor = async () => {
    resetCoverEditorTransform();

    if (cover?.uri) {
      setCoverDraft({
        ...cover,
        width: 'width' in cover ? (cover as EditableImage).width : COVER_OUTPUT_WIDTH,
        height: 'height' in cover ? (cover as EditableImage).height : COVER_OUTPUT_HEIGHT,
      });
      setCoverEditorOpen(true);
      return;
    }

    if (profile.cover_url) {
      try {
        const [{ width, height }, localUri] = await Promise.all([
          getImageSize(profile.cover_url),
          cacheRemoteImageForEditing(profile.cover_url),
        ]);
        setCoverDraft({
          uri: localUri,
          name: `cover-current-${profile.id}.png`,
          type: 'image/png',
          width,
          height,
        });
        setCoverEditorOpen(true);
      } catch {
        setCoverEditorOpen(true);
        void pickCoverDraft();
      }
      return;
    }

    setCoverEditorOpen(true);
    void pickCoverDraft();
  };

  const coverPanResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => Boolean(coverDraft),
        onMoveShouldSetPanResponder: (event, gestureState) =>
          Boolean(coverDraft) && (getGestureTouches(event).length >= 2 || Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2),
        onPanResponderGrant: (event) => {
          coverDragStart.current = { x: coverOffsetX, y: coverOffsetY };
          const touches = getGestureTouches(event);
          if (touches.length >= 2) {
            coverPinchStartDistance.current = Math.hypot(touches[0].pageX - touches[1].pageX, touches[0].pageY - touches[1].pageY);
            coverPinchStartZoom.current = coverZoom;
          }
        },
        onPanResponderMove: (event, gestureState) => {
          const touches = getGestureTouches(event);
          if (touches.length >= 2) {
            const distance = Math.hypot(touches[0].pageX - touches[1].pageX, touches[0].pageY - touches[1].pageY);
            if (!coverPinchStartDistance.current) {
              coverPinchStartDistance.current = distance;
              coverPinchStartZoom.current = coverZoom;
            }
            const nextZoom = coverPinchStartZoom.current * (distance / coverPinchStartDistance.current);
            setCoverZoom(Math.max(1, Math.min(3, Number(nextZoom.toFixed(2)))));
            return;
          }

          coverPinchStartDistance.current = null;
          setCoverOffsetX(Math.max(-COVER_EDITOR_WIDTH, Math.min(COVER_EDITOR_WIDTH, coverDragStart.current.x + gestureState.dx)));
          setCoverOffsetY(Math.max(-COVER_EDITOR_HEIGHT, Math.min(COVER_EDITOR_HEIGHT, coverDragStart.current.y + gestureState.dy)));
        },
        onPanResponderRelease: () => {
          coverPinchStartDistance.current = null;
        },
        onPanResponderTerminate: () => {
          coverPinchStartDistance.current = null;
        },
      });

  const pickCoverDraft = async () => {
    const picked = await pickOne({
      aspect: [8, 5],
      maxSizeBytes: MAX_COVER_BYTES,
      allowsEditing: false,
      onInvalid: (message) => showAlert('تعذر اختيار الغلاف', message, [{ text: 'حسناً' }]),
    });
    if (picked) {
      setCoverDraft(picked);
      resetCoverEditorTransform();
    }
  };

  const closeCoverEditor = () => {
    setCoverDraft(null);
    resetCoverEditorTransform();
    setCoverEditorOpen(false);
  };

  const saveCoverDraft = async () => {
    if (!coverDraft) return;
    const baseScale = Math.max(COVER_EDITOR_WIDTH / coverDraft.width, COVER_EDITOR_HEIGHT / coverDraft.height);
    const renderedScale = baseScale * coverZoom;
    const visibleWidth = COVER_EDITOR_WIDTH / renderedScale;
    const visibleHeight = COVER_EDITOR_HEIGHT / renderedScale;
    const coverRatio = COVER_OUTPUT_WIDTH / COVER_OUTPUT_HEIGHT;
    const visibleRatio = visibleWidth / visibleHeight;
    const rawCropWidth = visibleRatio > coverRatio ? visibleHeight * coverRatio : visibleWidth;
    const rawCropHeight = visibleRatio > coverRatio ? visibleHeight : visibleWidth / coverRatio;
    const cropWidth = Math.max(1, Math.min(coverDraft.width, rawCropWidth));
    const cropHeight = Math.max(1, Math.min(coverDraft.height, rawCropHeight));
    const maxOriginX = coverDraft.width - cropWidth;
    const maxOriginY = coverDraft.height - cropHeight;
    const rawOriginX = (coverDraft.width - cropWidth) / 2 - coverOffsetX / renderedScale;
    const rawOriginY = (coverDraft.height - cropHeight) / 2 - coverOffsetY / renderedScale;
    const originX = Math.max(0, Math.min(maxOriginX, rawOriginX));
    const originY = Math.max(0, Math.min(maxOriginY, rawOriginY));

    try {
      const result = await ImageManipulator.manipulateAsync(
        coverDraft.uri,
        [
          {
            crop: {
              originX: Math.round(originX),
              originY: Math.round(originY),
              width: Math.round(cropWidth),
              height: Math.round(cropHeight),
            },
          },
          { resize: { width: COVER_OUTPUT_WIDTH, height: COVER_OUTPUT_HEIGHT } },
        ],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG },
      );
      setCover({
        uri: result.uri,
        name: `cover-${Date.now()}.jpg`,
        type: 'image/jpeg',
      });
    } catch {
      showAlert('تعذر تعديل الغلاف', 'لم نتمكن من حفظ تعديل الغلاف. حاول بصورة أخرى.', [{ text: 'حسناً' }]);
      return;
    }
    closeCoverEditor();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <View style={styles.headerTitleRow}>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{asTab ? 'ملفي' : 'تعديل ملفي التجاري'}</Text>
              <Text style={[styles.headerTitle, { color: colors.gold }]}>.</Text>
            </View>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>حدّث المعلومات التي تظهر للعملاء</Text>
          </View>
          {!asTab ? (
            <Pressable onPress={() => router.replace('/(provider)/' as never)} hitSlop={10} style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="arrow-forward" size={24} color={colors.textPrimary} />
            </Pressable>
          ) : null}
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: asTab ? 140 : 40 }} showsVerticalScrollIndicator={false}>
          <SectionHeading title="الهوية البصرية" icon="images-outline" colors={colors} />

          <View style={[styles.mediaCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="تعديل الغلاف"
              onPress={openCoverEditor}
              style={styles.coverPick}
            >
              <Image
                source={{ uri: cover?.uri ?? profile.cover_url ?? undefined }}
                style={[styles.coverPreview, { backgroundColor: colors.surfaceAlt }]}
                contentFit="cover"
              />
              <View style={[styles.coverAction, { backgroundColor: colors.surface }]}>
                <Text style={[styles.coverActionText, { color: colors.primary }]}>تعديل الغلاف</Text>
              </View>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="تعديل الشعار أو الصورة الشخصية"
              onPress={openLogoEditor}
              style={[styles.logoPick, { borderColor: colors.surface }]}
            >
              <Image
                source={{ uri: logo?.uri ?? profile.logo_url ?? undefined }}
                style={[styles.logoPreview, { backgroundColor: colors.surfaceAlt }]}
                contentFit="cover"
              />
              <View style={[styles.logoBadge, { backgroundColor: colors.primary }]}>
                <Ionicons name="create" size={13} color={colors.textOnPrimary} />
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
            <TextInput value={mapUrl} onChangeText={setMapUrl} placeholder="https://maps.google.com/..." placeholderTextColor={colors.textMuted} style={[inputStyle, styles.mapUrlInput]} autoCapitalize="none" keyboardType="url" maxLength={255} />
          </Field>

          <View style={styles.saveActionWrap}>
            <PremiumButton
              title="حفظ التعديلات"
              loadingTitle="جاري الحفظ..."
              loading={updateProfile.isPending}
              icon="checkmark-circle-outline"
              onPress={submit}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={logoEditorOpen} transparent animationType="fade" onRequestClose={closeLogoEditor}>
        <View style={styles.logoEditorOverlay}>
          <View style={[styles.logoEditorSheet, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderStrong }]}>
            <View style={[styles.logoEditorHandle, { backgroundColor: colors.textDisabled }]} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="إغلاق تعديل الصورة"
              onPress={closeLogoEditor}
              hitSlop={8}
              style={({ pressed }) => [
                styles.logoEditorClose,
                { backgroundColor: colors.surfaceAlt, borderColor: colors.border, opacity: pressed ? 0.78 : 1 },
              ]}
            >
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </Pressable>
            <Text style={[styles.logoEditorTitle, { color: colors.textPrimary }]}>تعديل الصورة</Text>
            <Text style={[styles.logoEditorHint, { color: colors.textMuted }]}>اختر صورتك ثم عدّل الحجم والمكان داخل الدائرة.</Text>

            <View style={[styles.logoEditorPreview, { backgroundColor: colors.surfaceAlt }]}>
              <View style={styles.logoEditorPreviewClip} {...logoPanResponder.panHandlers}>
                {currentLogoUri ? (
                <Image
                  source={{ uri: currentLogoUri }}
                  style={[
                    styles.logoEditorImage,
                    logoDraft
                      ? {
                        width: logoEditorRenderedWidth,
                        height: logoEditorRenderedHeight,
                        transform: [{ translateX: logoOffsetX }, { translateY: logoOffsetY }],
                      }
                      : null,
                  ]}
                  contentFit="cover"
                />
              ) : (
                <Ionicons name="person-circle-outline" size={72} color={colors.textMuted} />
              )}
                <View pointerEvents="none" style={[styles.logoEditorCircleGuide, { borderColor: colors.primary }]} />
                <View pointerEvents="none" style={[styles.logoEditorCenterLineVertical, { backgroundColor: colors.borderStrong }]} />
                <View pointerEvents="none" style={[styles.logoEditorCenterLineHorizontal, { backgroundColor: colors.borderStrong }]} />
              </View>
            </View>

            <Pressable
                accessibilityRole="button"
                accessibilityLabel="اختيار شعار"
                onPress={pickLogoDraft}
                style={({ pressed }) => [
                  styles.logoEditorReplaceButton,
                  { backgroundColor: colors.surface, borderColor: colors.primary, opacity: pressed ? 0.78 : 1 },
                ]}
              >
                <Text style={[styles.logoEditorReplaceText, { color: colors.primary }]}>تغيير الصورة</Text>
            </Pressable>

            <View style={styles.logoEditorActions}>
              <PremiumButton
                title="حفظ الصورة"
                disabled={!logoDraft}
                onPress={saveLogoDraft}
                style={styles.logoEditorMainAction}
              />
              <Pressable
                accessibilityRole="button"
                onPress={closeLogoEditor}
                style={({ pressed }) => [
                  styles.logoEditorCancelButton,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Text style={[styles.logoEditorCancelText, { color: colors.textMuted }]}>إلغاء</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={coverEditorOpen} transparent animationType="fade" onRequestClose={closeCoverEditor}>
        <View style={styles.logoEditorOverlay}>
          <View style={[styles.logoEditorSheet, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderStrong }]}>
            <View style={[styles.logoEditorHandle, { backgroundColor: colors.textDisabled }]} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="إغلاق تعديل الغلاف"
              onPress={closeCoverEditor}
              hitSlop={8}
              style={({ pressed }) => [
                styles.logoEditorClose,
                { backgroundColor: colors.surfaceAlt, borderColor: colors.border, opacity: pressed ? 0.78 : 1 },
              ]}
            >
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </Pressable>
            <Text style={[styles.logoEditorTitle, { color: colors.textPrimary }]}>تعديل الغلاف</Text>
            <Text style={[styles.logoEditorHint, { color: colors.textMuted }]}>حرّك الصورة بإصبعك وكبّرها أو صغّرها باللمس داخل الإطار.</Text>

            <View style={[styles.coverEditorPreview, { backgroundColor: colors.surfaceAlt }]}>
              <View style={styles.coverEditorPreviewClip} {...coverPanResponder.panHandlers}>
                {currentCoverUri ? (
                  <Image
                    source={{ uri: currentCoverUri }}
                    style={[
                      styles.coverEditorImage,
                      coverDraft
                        ? {
                          width: coverEditorRenderedWidth,
                          height: coverEditorRenderedHeight,
                          transform: [{ translateX: coverOffsetX }, { translateY: coverOffsetY }],
                        }
                        : null,
                    ]}
                    contentFit="cover"
                  />
                ) : (
                  <Ionicons name="image-outline" size={64} color={colors.textMuted} />
                )}
                <View pointerEvents="none" style={[styles.coverEditorCenterLineVertical, { backgroundColor: colors.borderStrong }]} />
                <View pointerEvents="none" style={[styles.coverEditorCenterLineHorizontal, { backgroundColor: colors.borderStrong }]} />
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="اختيار غلاف جديد"
              onPress={pickCoverDraft}
              style={({ pressed }) => [
                styles.logoEditorReplaceButton,
                { backgroundColor: colors.surface, borderColor: colors.primary, opacity: pressed ? 0.78 : 1 },
              ]}
            >
              <Text style={[styles.logoEditorReplaceText, { color: colors.primary }]}>تغيير الغلاف</Text>
            </Pressable>

            <View style={styles.logoEditorActions}>
              <PremiumButton title="حفظ الغلاف" disabled={!coverDraft} onPress={saveCoverDraft} style={styles.logoEditorMainAction} />
              <Pressable
                accessibilityRole="button"
                onPress={closeCoverEditor}
                style={({ pressed }) => [
                  styles.logoEditorCancelButton,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Text style={[styles.logoEditorCancelText, { color: colors.textMuted }]}>إلغاء</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

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
  headerTitleRow: { flexDirection: 'row-reverse', alignItems: 'center' },
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
  mapUrlInput: { minHeight: 76, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 14, fontSize: 15, textAlign: 'center', textAlignVertical: 'center', writingDirection: 'ltr', includeFontPadding: false },
  multiline: { minHeight: 96, paddingTop: 12, textAlignVertical: 'top' },
  chipWrap: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  chipScrollRow: { gap: 8, paddingVertical: 4 },
  chip: { paddingHorizontal: 14, minHeight: 36, paddingVertical: 6, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontSize: 12, fontFamily: 'Cairo-Bold' },
  sectionHeadingRow: { marginTop: 26, flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  sectionIcon: { width: 32, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  switchRow: { marginTop: 10, minHeight: 74, borderRadius: 16, borderWidth: 1, paddingVertical: 12, paddingRight: 14, paddingLeft: 10, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  switchCopy: { flex: 1, alignItems: 'flex-end' },
  sectionHeading: { fontSize: 16, fontFamily: 'Cairo-Black', textAlign: 'right', writingDirection: 'rtl' },
  switchLabel: { fontSize: 14, fontFamily: 'Cairo-Bold' },
  switchHint: { marginTop: 2, fontSize: 11, fontFamily: 'Cairo-SemiBold', textAlign: 'right', writingDirection: 'rtl' },
  saveActionWrap: { marginTop: 34 },
  logoEditorOverlay: { flex: 1, backgroundColor: 'rgba(5,12,24,0.62)', justifyContent: 'center', paddingHorizontal: 24 },
  logoEditorSheet: { width: '100%', maxWidth: 430, alignSelf: 'center', borderRadius: 30, borderWidth: 1, paddingTop: 16, paddingHorizontal: 18, paddingBottom: 18, maxHeight: '93%' },
  logoEditorHandle: { alignSelf: 'center', width: 52, height: 6, borderRadius: 999, opacity: 0.62, marginBottom: 18 },
  logoEditorClose: { position: 'absolute', left: 18, top: 38, width: 46, height: 46, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', shadowColor: '#001733', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 4 },
  logoEditorTitle: { fontSize: 27, lineHeight: 38, fontFamily: 'Cairo-Black', textAlign: 'right', writingDirection: 'rtl' },
  logoEditorHint: { marginTop: 1, marginBottom: 16, fontSize: 13, lineHeight: 21, fontFamily: 'Cairo-SemiBold', textAlign: 'right', writingDirection: 'rtl' },
  logoEditorPreview: { width: LOGO_EDITOR_FRAME, height: LOGO_EDITOR_FRAME, borderRadius: 22, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  logoEditorPreviewClip: { width: '100%', height: '100%', borderRadius: 22, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logoEditorImage: { width: LOGO_EDITOR_FRAME, height: LOGO_EDITOR_FRAME },
  coverEditorPreview: { width: COVER_EDITOR_WIDTH, height: COVER_EDITOR_HEIGHT, borderRadius: 22, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  coverEditorPreviewClip: { width: '100%', height: '100%', borderRadius: 22, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  coverEditorImage: { width: COVER_EDITOR_WIDTH, height: COVER_EDITOR_HEIGHT },
  coverEditorCenterLineVertical: { position: 'absolute', width: 1, height: COVER_EDITOR_HEIGHT, opacity: 0.42 },
  coverEditorCenterLineHorizontal: { position: 'absolute', height: 1, width: COVER_EDITOR_WIDTH, opacity: 0.42 },
  logoEditorCircleGuide: { position: 'absolute', width: LOGO_EDITOR_FRAME - 14, height: LOGO_EDITOR_FRAME - 14, borderRadius: (LOGO_EDITOR_FRAME - 14) / 2, borderWidth: 2, opacity: 0.94 },
  logoEditorCenterLineVertical: { position: 'absolute', width: 1, height: LOGO_EDITOR_FRAME, opacity: 0.42 },
  logoEditorCenterLineHorizontal: { position: 'absolute', height: 1, width: LOGO_EDITOR_FRAME, opacity: 0.42 },
  logoEditorReplaceButton: { alignSelf: 'center', marginTop: 10, minHeight: 42, borderRadius: 999, borderWidth: 1.5, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', shadowColor: '#001733', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 },
  logoEditorReplaceText: { fontSize: 13, fontFamily: 'Cairo-Bold', textAlign: 'center', writingDirection: 'rtl' },
  logoEditorZoomCard: { width: '88%', maxWidth: 330, alignSelf: 'center', marginTop: 12, minHeight: 56, borderRadius: 15, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#001733', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2 },
  logoEditorZoomMiddle: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoEditorTool: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  logoEditorControlText: { marginBottom: 2, minWidth: 54, fontSize: 13, fontFamily: 'Cairo-Bold', textAlign: 'center', writingDirection: 'rtl' },
  logoEditorZoomTrack: { width: '100%', height: 4, borderRadius: 999 },
  logoEditorZoomFill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 999 },
  logoEditorZoomThumb: { position: 'absolute', top: -5, width: 14, height: 14, marginLeft: -7, borderRadius: 7 },
  logoEditorMoveGrid: { marginTop: 12, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', gap: 0 },
  logoEditorMoveMiddle: { marginTop: -2, marginBottom: -2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  logoEditorMoveButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, alignItems: 'center', justifyContent: 'center', shadowColor: '#001733', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  logoEditorMoveCenterButton: { width: 54, height: 54, borderRadius: 27, borderWidth: 1, alignItems: 'center', justifyContent: 'center', shadowColor: '#001733', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.16, shadowRadius: 10, elevation: 4 },
  logoEditorActions: { marginTop: 16, gap: 10 },
  logoEditorMainAction: { width: '100%' },
  logoEditorSecondaryActions: { gap: 10 },
  logoEditorSecondaryButton: { alignSelf: 'stretch', minHeight: 52, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  logoEditorSecondaryText: { fontSize: 15, fontFamily: 'Cairo-Bold', textAlign: 'center', writingDirection: 'rtl' },
  logoEditorCancelButton: { minHeight: 34, alignItems: 'center', justifyContent: 'center' },
  logoEditorCancelText: { fontSize: 14, fontFamily: 'Cairo-Bold', textAlign: 'center', writingDirection: 'rtl' },
});
