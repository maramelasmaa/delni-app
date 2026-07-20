import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PremiumButton } from '../../components/auth/premiumAuth';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorView } from '../../components/ui/ErrorView';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { RTLAlert, useRTLAlert } from '../../components/ui/RTLAlert';
import { useMyPortfolio, usePortfolioMutations } from '../../src/hooks/useProviderManagement';
import { useTheme } from '../../src/hooks/useTheme';
import { parseApiError } from '../../src/lib/error-parser';
import type { LocalImage } from '../../src/services/provider';
import type { PortfolioItem } from '../../src/types';

const MAX_IMAGES = 4;
const MAX_ITEMS = 2;

async function pickImages(limit: number): Promise<LocalImage[]> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: limit,
    quality: 0.85,
  });
  if (result.canceled) return [];
  return result.assets.map((asset, i) => ({
    uri: asset.uri,
    name: asset.fileName ?? `image-${Date.now()}-${i}.jpg`,
    type: asset.mimeType ?? 'image/jpeg',
    alt: '',
  }));
}

export default function ProviderPortfolioScreen() {
  const { colors } = useTheme();
  const { alert, showAlert, hideAlert } = useRTLAlert();
  const { data: items, isLoading, isError, error, refetch, isRefetching } = useMyPortfolio();
  const { create, update, remove } = usePortfolioMutations();

  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<PortfolioItem | null>(null);
  const [title, setTitle] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [images, setImages] = useState<LocalImage[]>([]);
  const [removeImageIds, setRemoveImageIds] = useState<number[]>([]);
  const [imageAlts, setImageAlts] = useState<Record<number, string>>({});

  if (isLoading) return <LoadingSpinner />;
  if (isError || !items) return <ErrorView error={error} onRetry={refetch} />;

  const resetForm = () => {
    setEditing(null);
    setTitle('');
    setIsActive(true);
    setImages([]);
    setRemoveImageIds([]);
    setImageAlts({});
    setFormVisible(false);
  };

  const openEdit = (item: PortfolioItem) => {
    setEditing(item);
    setTitle(item.title);
    setIsActive(item.is_active !== false);
    setImages([]);
    setRemoveImageIds([]);
    setImageAlts(
      Object.fromEntries((item.image_items ?? []).map((image) => [image.id, image.alt ?? ''])),
    );
    setFormVisible(true);
  };

  // Images the item keeps if the form is saved now.
  const keptExisting = (editing?.image_items ?? []).filter((img) => !removeImageIds.includes(img.id));
  const totalImages = keptExisting.length + images.length;

  const submit = () => {
    if (!title.trim()) {
      showAlert('تنبيه', 'اكتب اسم المشروع أولاً.', [{ text: 'حسناً' }]);
      return;
    }
    if (totalImages === 0) {
      showAlert('تنبيه', 'أضف صورة واحدة على الأقل.', [{ text: 'حسناً' }]);
      return;
    }

    const options = {
      onSuccess: resetForm,
      onError: (err: unknown) => showAlert('تعذر الحفظ', parseApiError(err).message, [{ text: 'حسناً' }]),
    };

    if (editing) {
      update.mutate(
        {
          id: editing.id,
          title: title.trim(),
          is_active: isActive,
          newImages: images,
          removeImageIds,
          imageAlts,
        },
        options,
      );
    } else {
      create.mutate({ title: title.trim(), is_active: isActive, images }, options);
    }
  };

  const confirmDelete = (item: PortfolioItem) => {
    showAlert('حذف المشروع', `سيتم حذف «${item.title}» وكل صوره نهائياً.`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: () =>
          remove.mutate(item.id, {
            onError: (err) => showAlert('تعذر الحذف', parseApiError(err).message, [{ text: 'حسناً' }]),
          }),
      },
    ]);
  };

  const canAdd = items.length < MAX_ITEMS;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>أعمالي</Text>
          <Text style={[styles.headerDot, { color: colors.gold }]}>.</Text>
        </View>
        <Pressable onPress={() => router.replace('/(provider)/' as never)} hitSlop={12} style={styles.backButton}>
          <Ionicons name="arrow-forward" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: 150, paddingHorizontal: 20, gap: 14 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} colors={[colors.primary]} />}
        ListEmptyComponent={
          <EmptyState
            icon="images-outline"
            title="لا توجد مشاريع بعد"
            message="أضف نماذج من أعمالك لزيادة ثقة العملاء بك."
          />
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {item.images[0] ? (
              <Image source={{ uri: item.images[0] }} style={styles.cardImage} contentFit="cover" />
            ) : null}
            <View style={styles.cardFooter}>
              <View style={styles.cardBody}>
                <Text numberOfLines={1} style={[styles.cardTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                <Text style={[styles.cardMeta, { color: colors.textMuted }]}>
                  {item.images.length} صور{item.is_active === false ? ' · مخفي' : ''}
                </Text>
              </View>
              <View style={styles.cardActions}>
                <Pressable
                  onPress={() => openEdit(item)}
                  style={({ pressed }) => [styles.actionIcon, { backgroundColor: colors.primarySoft, borderColor: colors.borderStrong, opacity: pressed ? 0.6 : 1 }]}
                  hitSlop={8}
                >
                  <Ionicons name="create-outline" size={18} color={colors.primary} />
                </Pressable>
                <Pressable
                  onPress={() => confirmDelete(item)}
                  disabled={remove.isPending}
                  style={({ pressed }) => [styles.actionIcon, { backgroundColor: colors.primarySoft, borderColor: colors.borderStrong, opacity: pressed ? 0.6 : 1 }]}
                  hitSlop={8}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </Pressable>
              </View>
            </View>
          </View>
        )}
      />

      <View style={[styles.bottomBar, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
        <PremiumButton
          title="مشروع جديد"
          icon="add"
          onPress={() => {
            if (!canAdd) {
              showAlert('الحد الأقصى', 'يمكنك إضافة مشروعين كحد أقصى. احذف مشروعاً لإضافة آخر.', [{ text: 'حسناً' }]);
              return;
            }
            setFormVisible(true);
          }}
        />
      </View>

      <Modal visible={formVisible} animationType="slide" transparent onRequestClose={resetForm}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderStrong }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="إغلاق"
              onPress={resetForm}
              hitSlop={10}
              style={({ pressed }) => [
                styles.sheetCloseButton,
                { backgroundColor: colors.surfaceAlt, borderColor: colors.border, opacity: pressed ? 0.78 : 1 },
              ]}
            >
              <Ionicons name="close" size={22} color={colors.textPrimary} />
            </Pressable>
            <View style={[styles.sheetHandle, { backgroundColor: colors.textMuted }]} />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {editing ? 'تعديل المشروع' : 'مشروع جديد'}
              </Text>
            </View>
            <ScrollView
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>اسم المشروع (مثال: تشطيب فيلا سكنية)</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="اكتب اسم المشروع"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { color: colors.textPrimary, borderColor: colors.borderStrong, backgroundColor: colors.surface }]}
              maxLength={255}
            />

            <View style={styles.switchRow}>
              <Switch value={isActive} onValueChange={setIsActive} trackColor={{ true: colors.primary }} />
              <View style={styles.switchCopy}>
                <Text style={[styles.switchLabel, { color: colors.textPrimary }]}>مرئي للعملاء</Text>
                <Text style={[styles.switchHint, { color: colors.textMuted }]}>سيظهر المشروع للعملاء في ملفك الشخصي</Text>
              </View>
            </View>

            {keptExisting.length > 0 && (
              <View style={styles.imageEditorList}>
                {keptExisting.map((img) => (
                  <View key={img.id} style={styles.imageEditorRow}>
                    <View style={styles.thumbWrap}>
                      <Image source={{ uri: img.url }} style={styles.thumb} contentFit="cover" />
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="حذف الصورة"
                        onPress={() => setRemoveImageIds((prev) => [...prev, img.id])}
                        style={styles.thumbRemove}
                      >
                        <Ionicons name="close" size={12} color="#fff" />
                      </Pressable>
                    </View>
                    <TextInput
                      value={imageAlts[img.id] ?? ''}
                      onChangeText={(alt) => setImageAlts((previous) => ({ ...previous, [img.id]: alt }))}
                      placeholder="وصف مختصر للصورة (اختياري)"
                      placeholderTextColor={colors.textMuted}
                      maxLength={255}
                      style={[styles.altInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
                    />
                  </View>
                ))}
              </View>
            )}

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>إضافة صور ({MAX_IMAGES} كحد أقصى)</Text>
            <Pressable
              onPress={async () => {
                const picked = await pickImages(MAX_IMAGES - totalImages);
                setImages((prev) => [...prev, ...picked].slice(0, MAX_IMAGES - keptExisting.length));
              }}
              disabled={totalImages >= MAX_IMAGES}
              style={({ pressed }) => [styles.pickBtn, { borderColor: colors.borderStrong, backgroundColor: colors.surface, opacity: pressed ? 0.7 : totalImages >= MAX_IMAGES ? 0.55 : 1 }]}
            >
              <View style={[styles.pickIconBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <Ionicons name="images-outline" size={32} color={colors.textPrimary} />
                <View style={[styles.pickIconBadge, { backgroundColor: colors.primary }]}>
                  <Ionicons name="add" size={13} color={colors.textOnPrimary} />
                </View>
              </View>
              <Text style={[styles.pickText, { color: colors.textPrimary }]}>اضغط لإضافة صور</Text>
              <Text style={[styles.pickHint, { color: colors.textMuted }]}>الحد الأقصى لكل صورة 5 ميجابايت</Text>
            </Pressable>

            {images.length > 0 && (
              <View style={styles.imageEditorList}>
                {images.map((img, i) => (
                  <View key={img.uri} style={styles.imageEditorRow}>
                    <View style={styles.thumbWrap}>
                      <Image source={{ uri: img.uri }} style={styles.thumb} contentFit="cover" />
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="حذف الصورة"
                        onPress={() => setImages((previous) => previous.filter((_, index) => index !== i))}
                        style={styles.thumbRemove}
                      >
                        <Ionicons name="close" size={12} color="#fff" />
                      </Pressable>
                    </View>
                    <TextInput
                      value={img.alt ?? ''}
                      onChangeText={(alt) => setImages((previous) => previous.map((image, index) => (
                        index === i ? { ...image, alt } : image
                      )))}
                      placeholder="وصف مختصر للصورة (اختياري)"
                      placeholderTextColor={colors.textMuted}
                      maxLength={255}
                      style={[styles.altInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
                    />
                  </View>
                ))}
              </View>
            )}

            <View style={styles.modalActions}>
              <PremiumButton
                title="حفظ المشروع"
                loadingTitle="جاري الحفظ..."
                loading={create.isPending || update.isPending}
                onPress={submit}
                style={styles.saveBtn}
              />
              <Pressable
                accessibilityRole="button"
                onPress={resetForm}
                style={({ pressed }) => [
                  styles.cancelBtn,
                  { backgroundColor: colors.surfaceAlt, borderColor: colors.borderStrong, opacity: pressed ? 0.78 : 1 },
                ]}
              >
                <Text style={[styles.cancelText, { color: colors.textPrimary }]}>إلغاء</Text>
              </Pressable>
            </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <RTLAlert alert={alert} onDismiss={hideAlert} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  headerTitleRow: { flexDirection: 'row-reverse', alignItems: 'center' },
  headerTitle: { fontSize: 28, fontFamily: 'Cairo-Black' },
  headerDot: { fontSize: 28, fontFamily: 'Cairo-Black' },
  backButton: { padding: 4 },
  card: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  cardImage: { width: '100%', height: 170 },
  cardBody: { flex: 1, padding: 14, alignItems: 'flex-end' },
  cardTitle: { fontSize: 16, fontFamily: 'Cairo-Bold', textAlign: 'right', writingDirection: 'rtl' },
  cardMeta: { marginTop: 2, fontSize: 12, fontFamily: 'Cairo-SemiBold' },
  cardFooter: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, paddingLeft: 14 },
  cardActions: { flexDirection: 'row-reverse', gap: 10 },
  actionIcon: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopWidth: 1, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  modalSheet: { height: '78%', borderTopLeftRadius: 30, borderTopRightRadius: 30, borderWidth: 1, paddingHorizontal: 24, paddingTop: 14, paddingBottom: Platform.OS === 'ios' ? 34 : 28 },
  sheetCloseButton: { position: 'absolute', top: 14, left: 24, zIndex: 2, width: 40, height: 40, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  modalScrollContent: { flexGrow: 1, paddingBottom: 2 },
  sheetHandle: { alignSelf: 'center', width: 52, height: 6, borderRadius: 999, opacity: 0.7, marginBottom: 18 },
  modalHeader: { alignItems: 'flex-end', marginBottom: 18, paddingLeft: 48 },
  modalTitle: { fontSize: 24, fontFamily: 'Cairo-Black', textAlign: 'right', writingDirection: 'rtl' },
  inputLabel: { marginBottom: 8, fontSize: 13, fontFamily: 'Cairo-Bold', textAlign: 'right', writingDirection: 'rtl' },
  input: { minHeight: 58, borderRadius: 16, borderWidth: 1.5, paddingHorizontal: 16, fontSize: 15, fontFamily: 'Cairo-SemiBold', textAlign: 'right', writingDirection: 'rtl' },
  switchRow: { marginTop: 20, marginBottom: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 18 },
  switchCopy: { flex: 1, alignItems: 'flex-end' },
  switchLabel: { fontSize: 16, fontFamily: 'Cairo-Bold', textAlign: 'right', writingDirection: 'rtl' },
  switchHint: { marginTop: 3, fontSize: 12, fontFamily: 'Cairo-SemiBold', textAlign: 'right', writingDirection: 'rtl' },
  pickBtn: { width: '100%', marginTop: 4, minHeight: 150, borderRadius: 22, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 18 },
  pickIconBox: { width: 72, height: 72, borderRadius: 22, borderWidth: 1, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  pickIconBadge: { position: 'absolute', right: -1, bottom: -1, width: 24, height: 24, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  pickText: { fontSize: 17, fontFamily: 'Cairo-Bold', textAlign: 'center', writingDirection: 'rtl' },
  pickHint: { fontSize: 12, fontFamily: 'Cairo-SemiBold', textAlign: 'center', writingDirection: 'rtl' },
  thumbRow: { marginTop: 12, flexDirection: 'row-reverse', gap: 10, flexWrap: 'wrap' },
  imageEditorList: { marginTop: 12, gap: 10 },
  imageEditorRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  thumbWrap: { width: 64, height: 64 },
  thumb: { width: 64, height: 64, borderRadius: 12 },
  thumbRemove: { position: 'absolute', top: -4, left: -4, backgroundColor: '#d43f3f', borderRadius: 999, padding: 3 },
  altInput: { flex: 1, minHeight: 46, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, fontSize: 12, fontFamily: 'Cairo-SemiBold', textAlign: 'right', writingDirection: 'rtl' },
  modalActions: { marginTop: 38, gap: 14 },
  saveBtn: { width: '100%' },
  cancelBtn: { width: '100%', minHeight: 58, borderRadius: 20, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 16, fontFamily: 'Cairo-Bold', textAlign: 'center', writingDirection: 'rtl' },
});
