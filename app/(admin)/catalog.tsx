import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
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
import { useAdminCatalog, useAdminCatalogMutations } from '../../src/hooks/useAdminManagement';
import { useTheme } from '../../src/hooks/useTheme';
import { parseApiError } from '../../src/lib/error-parser';
import type { AdminCatalogInput, AdminCatalogItem, AdminCatalogKind } from '../../src/services/admin';

const RESOURCES: { key: AdminCatalogKind; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'categories', label: 'التصنيفات', icon: 'grid-outline' },
  { key: 'subcategories', label: 'التخصصات', icon: 'layers-outline' },
  { key: 'cities', label: 'المدن', icon: 'location-outline' },
  { key: 'providerTypes', label: 'أنواع المزودين', icon: 'briefcase-outline' },
];

const blankDraft: AdminCatalogInput = {
  name: '',
  name_ar: '',
  slug: '',
  code: '',
  category_id: undefined,
  search_name: '',
  icon: '',
  sort_order: 0,
  is_active: true,
};

function resourceTitle(kind: AdminCatalogKind) {
  return RESOURCES.find((resource) => resource.key === kind)?.label ?? '';
}

function draftFromItem(item?: AdminCatalogItem): AdminCatalogInput {
  if (!item) return blankDraft;
  return {
    name: item.name ?? '',
    name_ar: item.name_ar ?? '',
    slug: item.slug ?? '',
    code: item.code ?? '',
    category_id: item.category_id ?? undefined,
    search_name: item.search_name ?? '',
    icon: item.icon ?? '',
    sort_order: item.sort_order ?? 0,
    is_active: item.is_active,
  };
}

function compactInput(kind: AdminCatalogKind, draft: AdminCatalogInput): AdminCatalogInput {
  const base = {
    name: draft.name?.trim(),
    name_ar: draft.name_ar?.trim() || undefined,
    is_active: !!draft.is_active,
  };

  if (kind === 'providerTypes') {
    return {
      ...base,
      code: draft.code?.trim(),
      icon: draft.icon?.trim() || undefined,
      sort_order: Number(draft.sort_order ?? 0),
    };
  }

  if (kind === 'cities') {
    return {
      ...base,
      slug: draft.slug?.trim(),
      icon: draft.icon?.trim() || undefined,
    };
  }

  if (kind === 'subcategories') {
    return {
      ...base,
      category_id: Number(draft.category_id),
      slug: draft.slug?.trim(),
      search_name: draft.search_name?.trim() || undefined,
      sort_order: Number(draft.sort_order ?? 0),
    };
  }

  return {
    ...base,
    slug: draft.slug?.trim(),
    sort_order: Number(draft.sort_order ?? 0),
  };
}

export default function AdminCatalogScreen() {
  const { colors } = useTheme();
  const { alert, showAlert, hideAlert } = useRTLAlert();
  const [kind, setKind] = useState<AdminCatalogKind>('categories');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<AdminCatalogItem | null>(null);
  const [draft, setDraft] = useState<AdminCatalogInput>(blankDraft);

  const filters = useMemo(() => ({ search: query || undefined }), [query]);
  const { data, isLoading, isError, error, refetch, isRefetching } = useAdminCatalog(kind, filters);
  const { data: categoriesData } = useAdminCatalog('categories', {});
  const mutations = useAdminCatalogMutations(kind);
  const busy = mutations.create.isPending || mutations.update.isPending || mutations.remove.isPending;
  const modalOpen = editing !== null;

  const openCreate = () => {
    setEditing({ id: 0, name: '', is_active: true } as AdminCatalogItem);
    setDraft(blankDraft);
  };

  const openEdit = (item: AdminCatalogItem) => {
    setEditing(item);
    setDraft(draftFromItem(item));
  };

  const closeModal = () => {
    setEditing(null);
    setDraft(blankDraft);
  };

  const save = () => {
    if (!editing) return;
    const input = compactInput(kind, draft);
    if (!input.name || (kind !== 'providerTypes' && !input.slug) || (kind === 'providerTypes' && !input.code) || (kind === 'subcategories' && !input.category_id)) {
      showAlert('تنبيه', 'أكمل الحقول المطلوبة قبل الحفظ.', [{ text: 'حسناً' }]);
      return;
    }

    const callbacks = {
      onSuccess: closeModal,
      onError: (err: unknown) => showAlert('تعذر الحفظ', parseApiError(err).message, [{ text: 'حسناً' }]),
    };

    if (editing.id === 0) {
      mutations.create.mutate(input, callbacks);
    } else {
      mutations.update.mutate({ id: editing.id, input }, callbacks);
    }
  };

  const confirmDelete = (item: AdminCatalogItem) => {
    showAlert('حذف العنصر', `سيتم حذف «${item.localized_name || item.name}».`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: () => mutations.remove.mutate(item.id, {
          onError: (err) => showAlert('تعذر الحذف', parseApiError(err).message, [{ text: 'حسناً' }]),
        }),
      },
    ]);
  };

  const updateDraft = (patch: AdminCatalogInput) => setDraft((current) => ({ ...current, ...patch }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.headerDot, { color: colors.gold }]}>.</Text>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>الفهرس</Text>
      </View>

      <View style={styles.resourceRow}>
        {RESOURCES.map((resource) => {
          const active = kind === resource.key;
          return (
            <Pressable
              key={resource.key}
              onPress={() => {
                setKind(resource.key);
                setQuery('');
                setSearch('');
              }}
              style={[styles.resourceChip, { backgroundColor: active ? colors.primary : colors.surface, borderColor: active ? colors.primary : colors.border }]}
            >
              <Ionicons name={resource.icon} size={15} color={active ? colors.textOnPrimary : colors.textMuted} />
              <Text style={[styles.resourceText, { color: active ? colors.textOnPrimary : colors.textMuted }]}>{resource.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.searchBox, { backgroundColor: colors.surfaceAlt }]}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => setQuery(search.trim())}
          placeholder={`ابحث في ${resourceTitle(kind)}`}
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
          style={[styles.searchInput, { color: colors.textPrimary }]}
        />
        <Pressable onPress={openCreate} hitSlop={8}>
          <Ionicons name="add-circle" size={23} color={colors.primary} />
        </Pressable>
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : isError || !data ? (
        <ErrorView error={error} onRetry={refetch} />
      ) : (
        <FlatList
          data={data.items}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 120, gap: 12 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} colors={[colors.primary]} />}
          ListEmptyComponent={<EmptyState icon="albums-outline" title="لا توجد عناصر" message="أضف أول عنصر من زر + بالأعلى." />}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Pressable onPress={() => openEdit(item)} style={styles.cardBody}>
                <View style={[styles.iconBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                  <Ionicons name={item.is_active ? 'checkmark-circle-outline' : 'pause-circle-outline'} size={21} color={item.is_active ? colors.success : colors.textMuted} />
                </View>
                <View style={styles.cardText}>
                  <Text numberOfLines={1} style={[styles.cardTitle, { color: colors.textPrimary }]}>{item.localized_name || item.name}</Text>
                  <Text numberOfLines={1} style={[styles.cardMeta, { color: colors.textMuted }]}>
                    {[item.slug || item.code, item.category_name, item.profiles_count != null ? `${item.profiles_count} ملف` : null].filter(Boolean).join(' · ')}
                  </Text>
                </View>
              </Pressable>
              <Pressable onPress={() => confirmDelete(item)} disabled={busy} style={({ pressed }) => [styles.deleteBtn, { opacity: pressed || busy ? 0.55 : 1 }]}>
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </Pressable>
            </View>
          )}
        />
      )}

      <Modal visible={modalOpen} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surfaceElevated }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {editing?.id === 0 ? `إضافة ${resourceTitle(kind)}` : `تعديل ${resourceTitle(kind)}`}
            </Text>

            {kind === 'providerTypes' ? (
              <Field label="الكود" value={draft.code ?? ''} onChangeText={(value) => updateDraft({ code: value })} colors={colors} />
            ) : null}
            {kind === 'subcategories' ? (
              <View style={{ marginBottom: 10 }}>
                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>التصنيف</Text>
                <View style={styles.categoryChips}>
                  {(categoriesData?.items ?? []).map((category) => {
                    const active = Number(draft.category_id) === category.id;
                    return (
                      <Pressable
                        key={category.id}
                        onPress={() => updateDraft({ category_id: category.id })}
                        style={[styles.smallChip, { backgroundColor: active ? colors.primary : colors.surface, borderColor: active ? colors.primary : colors.border }]}
                      >
                        <Text style={[styles.smallChipText, { color: active ? colors.textOnPrimary : colors.textMuted }]}>{category.localized_name || category.name}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            <Field label="الاسم بالإنجليزية" value={draft.name ?? ''} onChangeText={(value) => updateDraft({ name: value })} colors={colors} />
            <Field label="الاسم بالعربية" value={draft.name_ar ?? ''} onChangeText={(value) => updateDraft({ name_ar: value })} colors={colors} />
            {kind !== 'providerTypes' ? <Field label="الرابط المختصر" value={draft.slug ?? ''} onChangeText={(value) => updateDraft({ slug: value })} colors={colors} autoCapitalize="none" /> : null}
            {kind === 'subcategories' ? <Field label="اسم البحث" value={draft.search_name ?? ''} onChangeText={(value) => updateDraft({ search_name: value })} colors={colors} /> : null}
            {kind === 'cities' || kind === 'providerTypes' ? <Field label="الأيقونة" value={draft.icon ?? ''} onChangeText={(value) => updateDraft({ icon: value })} colors={colors} /> : null}
            {kind === 'categories' || kind === 'subcategories' || kind === 'providerTypes' ? (
              <Field label="الترتيب" value={String(draft.sort_order ?? 0)} onChangeText={(value) => updateDraft({ sort_order: Number(value) || 0 })} colors={colors} keyboardType="number-pad" />
            ) : null}

            <View style={[styles.switchRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Switch value={!!draft.is_active} onValueChange={(value) => updateDraft({ is_active: value })} trackColor={{ true: colors.primary }} />
              <Text style={[styles.switchLabel, { color: colors.textPrimary }]}>نشط</Text>
            </View>

            <View style={styles.modalActions}>
              <Pressable onPress={closeModal} style={[styles.cancelBtn, { borderColor: colors.border }]}>
                <Text style={[styles.cancelText, { color: colors.textMuted }]}>إلغاء</Text>
              </Pressable>
              <Pressable onPress={save} disabled={busy} style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: busy ? 0.65 : 1 }]}>
                {busy ? <ActivityIndicator size="small" color={colors.textOnPrimary} /> : <Text style={[styles.saveText, { color: colors.textOnPrimary }]}>حفظ</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <RTLAlert alert={alert} onDismiss={hideAlert} />
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  colors,
  keyboardType,
  autoCapitalize = 'sentences',
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  colors: ReturnType<typeof useTheme>['colors'];
  keyboardType?: 'default' | 'number-pad';
  autoCapitalize?: 'none' | 'sentences';
}) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 10, flexDirection: 'row-reverse', alignItems: 'center' },
  headerTitle: { fontSize: 28, fontFamily: 'Cairo-Black' },
  headerDot: { fontSize: 28, fontFamily: 'Cairo-Black' },
  resourceRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, paddingBottom: 12 },
  resourceChip: { minHeight: 34, borderRadius: 999, borderWidth: 1, paddingHorizontal: 11, flexDirection: 'row-reverse', alignItems: 'center', gap: 5 },
  resourceText: { fontSize: 11, fontFamily: 'Cairo-Bold', writingDirection: 'rtl' },
  searchBox: { marginHorizontal: 20, minHeight: 46, borderRadius: 14, flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 14, gap: 8 },
  searchInput: { flex: 1, fontSize: 13, fontFamily: 'Cairo-SemiBold', textAlign: 'right', writingDirection: 'rtl', paddingVertical: 10 },
  card: { minHeight: 72, borderRadius: 18, borderWidth: 1, padding: 12, flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  cardBody: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', gap: 11 },
  iconBox: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cardText: { flex: 1, alignItems: 'flex-end' },
  cardTitle: { fontSize: 15, fontFamily: 'Cairo-Bold', writingDirection: 'rtl', textAlign: 'right' },
  cardMeta: { marginTop: 1, fontSize: 12, fontFamily: 'Cairo-Regular', writingDirection: 'rtl', textAlign: 'right' },
  deleteBtn: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet: { maxHeight: '88%', borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingBottom: 34 },
  modalTitle: { fontSize: 18, fontFamily: 'Cairo-Black', textAlign: 'right', writingDirection: 'rtl', marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontFamily: 'Cairo-Bold', textAlign: 'right', writingDirection: 'rtl', marginBottom: 6 },
  input: { minHeight: 46, borderRadius: 14, borderWidth: 1, paddingHorizontal: 13, fontSize: 14, fontFamily: 'Cairo-SemiBold', textAlign: 'right', writingDirection: 'rtl' },
  categoryChips: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 7 },
  smallChip: { minHeight: 32, borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  smallChipText: { fontSize: 11, fontFamily: 'Cairo-Bold', writingDirection: 'rtl' },
  switchRow: { minHeight: 50, borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  switchLabel: { fontSize: 14, fontFamily: 'Cairo-Bold', writingDirection: 'rtl' },
  modalActions: { marginTop: 16, flexDirection: 'row-reverse', gap: 10 },
  saveBtn: { flex: 1, minHeight: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontSize: 14, fontFamily: 'Cairo-Bold' },
  cancelBtn: { minHeight: 48, borderRadius: 14, borderWidth: 1, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 14, fontFamily: 'Cairo-Bold' },
});
