import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import {
  ActivityIndicator,
  FlatList,
  Modal,
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
        <Text style={[styles.headerDot, { color: colors.gold }]}>.</Text>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>أعمالي</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: 130, paddingHorizontal: 20, gap: 14 }}
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
            <View style={styles.cardBody}>
              <Text numberOfLines={1} style={[styles.cardTitle, { color: colors.textPrimary }]}>{item.title}</Text>
              <Text style={[styles.cardMeta, { color: colors.textMuted }]}>
                {item.images.length} صور{item.is_active === false ? ' · مخفي' : ''}
              </Text>
            </View>
            <Pressable
              onPress={() => openEdit(item)}
              style={({ pressed }) => [styles.editBtn, { opacity: pressed ? 0.6 : 1 }]}
              hitSlop={8}
            >
              <Ionicons name="create-outline" size={20} color="#fff" />
            </Pressable>
            <Pressable
              onPress={() => confirmDelete(item)}
              disabled={remove.isPending}
              style={({ pressed }) => [styles.deleteBtn, { opacity: pressed ? 0.6 : 1 }]}
              hitSlop={8}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </Pressable>
          </View>
        )}
      />

      <Pressable
        onPress={() => {
          if (!canAdd) {
            showAlert('الحد الأقصى', 'يمكنك إضافة مشروعين كحد أقصى. احذف مشروعاً لإضافة آخر.', [{ text: 'حسناً' }]);
            return;
          }
          setFormVisible(true);
        }}
        style={({ pressed }) => [styles.fab, { backgroundColor: colors.primary, opacity: pressed ? 0.86 : 1 }]}
      >
        <Ionicons name="add" size={22} color={colors.textOnPrimary} />
        <Text style={[styles.fabText, { color: colors.textOnPrimary }]}>مشروع جديد</Text>
      </Pressable>

      <Modal visible={formVisible} animationType="slide" transparent onRequestClose={resetForm}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surfaceElevated }]}> 
            <ScrollView
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}> 
              {editing ? 'تعديل المشروع' : 'مشروع جديد'}
            </Text>

            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="اسم المشروع (مثال: تشطيب فيلا سكنية)"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
              maxLength={255}
            />

            <View style={styles.switchRow}>
              <Switch value={isActive} onValueChange={setIsActive} trackColor={{ true: colors.primary }} />
              <Text style={[styles.switchLabel, { color: colors.textPrimary }]}>مرئي للعملاء</Text>
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

            <Pressable
              onPress={async () => {
                const picked = await pickImages(MAX_IMAGES - totalImages);
                setImages((prev) => [...prev, ...picked].slice(0, MAX_IMAGES - keptExisting.length));
              }}
              disabled={totalImages >= MAX_IMAGES}
              style={({ pressed }) => [styles.pickBtn, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
            >
              <Ionicons name="image-outline" size={19} color={colors.primary} />
              <Text style={[styles.pickText, { color: colors.textPrimary }]}>
                إضافة صور ({totalImages}/{MAX_IMAGES})
              </Text>
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
              <Pressable onPress={resetForm} style={({ pressed }) => [styles.cancelBtn, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}>
                <Text style={[styles.cancelText, { color: colors.textMuted }]}>إلغاء</Text>
              </Pressable>
              <Pressable
                onPress={submit}
                disabled={create.isPending || update.isPending}
                style={({ pressed }) => [styles.saveBtn, { backgroundColor: colors.primary, opacity: create.isPending || update.isPending || pressed ? 0.7 : 1 }]}
              >
                {create.isPending || update.isPending ? (
                  <ActivityIndicator size="small" color={colors.textOnPrimary} />
                ) : (
                  <Text style={[styles.saveText, { color: colors.textOnPrimary }]}>حفظ المشروع</Text>
                )}
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
  header: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12, flexDirection: 'row-reverse', alignItems: 'center' },
  headerTitle: { fontSize: 28, fontFamily: 'Cairo-Black' },
  headerDot: { fontSize: 28, fontFamily: 'Cairo-Black' },
  card: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  cardImage: { width: '100%', height: 170 },
  cardBody: { padding: 14, alignItems: 'flex-end' },
  cardTitle: { fontSize: 16, fontFamily: 'Cairo-Bold', textAlign: 'right', writingDirection: 'rtl' },
  cardMeta: { marginTop: 2, fontSize: 12, fontFamily: 'Cairo-SemiBold' },
  deleteBtn: { position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 999, padding: 8 },
  editBtn: { position: 'absolute', top: 10, left: 54, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 999, padding: 8 },
  fab: { position: 'absolute', bottom: 104, alignSelf: 'center', flexDirection: 'row-reverse', alignItems: 'center', gap: 6, paddingHorizontal: 18, height: 48, borderRadius: 999 },
  fabText: { fontSize: 14, fontFamily: 'Cairo-Bold' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet: { maxHeight: '90%', borderTopLeftRadius: 26, borderTopRightRadius: 26 },
  modalScrollContent: { padding: 22, paddingBottom: 40 },
  modalTitle: { fontSize: 19, fontFamily: 'Cairo-Black', textAlign: 'right', writingDirection: 'rtl', marginBottom: 14 },
  input: { minHeight: 50, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, fontSize: 14, fontFamily: 'Cairo-SemiBold', textAlign: 'right', writingDirection: 'rtl' },
  switchRow: { marginTop: 14, flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  switchLabel: { fontSize: 14, fontFamily: 'Cairo-Bold' },
  pickBtn: { marginTop: 14, minHeight: 48, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8 },
  pickText: { fontSize: 13, fontFamily: 'Cairo-Bold' },
  thumbRow: { marginTop: 12, flexDirection: 'row-reverse', gap: 10, flexWrap: 'wrap' },
  imageEditorList: { marginTop: 12, gap: 10 },
  imageEditorRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  thumbWrap: { width: 64, height: 64 },
  thumb: { width: 64, height: 64, borderRadius: 12 },
  thumbRemove: { position: 'absolute', top: -4, left: -4, backgroundColor: '#d43f3f', borderRadius: 999, padding: 3 },
  altInput: { flex: 1, minHeight: 46, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, fontSize: 12, fontFamily: 'Cairo-SemiBold', textAlign: 'right', writingDirection: 'rtl' },
  modalActions: { marginTop: 20, flexDirection: 'row-reverse', gap: 10 },
  saveBtn: { flex: 1, minHeight: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontSize: 14, fontFamily: 'Cairo-Bold' },
  cancelBtn: { paddingHorizontal: 20, minHeight: 50, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 14, fontFamily: 'Cairo-Bold' },
});
