import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorView } from '../../components/ui/ErrorView';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { RTLAlert, useRTLAlert } from '../../components/ui/RTLAlert';
import { useAdminUserMutations, useAdminUsers } from '../../src/hooks/useAdminManagement';
import { useTheme } from '../../src/hooks/useTheme';
import { parseApiError } from '../../src/lib/error-parser';
import type { AdminUser } from '../../src/types';

const FILTERS = [
  { key: 'all', label: 'الكل' },
  { key: 'providers', label: 'المزودون' },
  { key: 'suspended', label: 'الموقوفون' },
] as const;

type FilterKey = (typeof FILTERS)[number]['key'];

export default function AdminUsersScreen() {
  const { colors } = useTheme();
  const { alert, showAlert, hideAlert } = useRTLAlert();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');

  const { data, isLoading, isError, error, refetch, isRefetching } = useAdminUsers({
    search: query || undefined,
    role: filter === 'providers' ? 'provider' : undefined,
    suspended: filter === 'suspended' ? true : undefined,
  });
  const { suspend, reinstate } = useAdminUserMutations();

  // Reason entry modal state: which action + which user.
  const [reasonTarget, setReasonTarget] = useState<{ user: AdminUser; action: 'suspend' | 'reinstate' } | null>(null);
  const [reason, setReason] = useState('');

  const pending = suspend.isPending || reinstate.isPending;

  const submitReason = () => {
    if (!reasonTarget) return;
    if (reason.trim().length < 10) {
      showAlert('تنبيه', 'اكتب سبباً واضحاً (10 أحرف على الأقل).', [{ text: 'حسناً' }]);
      return;
    }
    const mutation = reasonTarget.action === 'suspend' ? suspend : reinstate;
    mutation.mutate(
      { id: reasonTarget.user.id, reason: reason.trim() },
      {
        onSuccess: () => {
          setReasonTarget(null);
          setReason('');
        },
        onError: (err) => showAlert('تعذر التنفيذ', parseApiError(err).message, [{ text: 'حسناً' }]),
      },
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.headerDot, { color: colors.gold }]}>.</Text>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>المستخدمون</Text>
      </View>

      <View style={[styles.searchBox, { backgroundColor: colors.surfaceAlt }]}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => setQuery(search.trim())}
          returnKeyType="search"
          placeholder="ابحث بالاسم أو البريد أو الهاتف"
          placeholderTextColor={colors.textMuted}
          style={[styles.searchInput, { color: colors.textPrimary }]}
        />
        {query ? (
          <Pressable onPress={() => { setSearch(''); setQuery(''); }} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[styles.chip, { backgroundColor: active ? colors.primary : colors.surface, borderColor: active ? colors.primary : colors.border }]}
            >
              <Text style={[styles.chipText, { color: active ? colors.textOnPrimary : colors.textMuted }]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : isError || !data ? (
        <ErrorView error={error} onRetry={refetch} />
      ) : (
        <FlatList
          data={data.users}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 20, gap: 12, paddingTop: 4 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} colors={[colors.primary]} />}
          ListEmptyComponent={<EmptyState icon="people-outline" title="لا توجد نتائج" message="جرب بحثاً أو فلتراً مختلفاً." />}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <View style={styles.nameRow}>
                  {item.is_suspended ? (
                    <View style={[styles.badge, { backgroundColor: colors.errorSoft }]}>
                      <Text style={[styles.badgeText, { color: colors.error }]}>موقوف</Text>
                    </View>
                  ) : null}
                  {item.is_provider ? (
                    <View style={[styles.badge, { backgroundColor: colors.goldSoft }]}>
                      <Text style={[styles.badgeText, { color: colors.goldText }]}>مزود</Text>
                    </View>
                  ) : null}
                  <Text style={[styles.name, { color: colors.textPrimary }]}>{item.name}</Text>
                </View>
                <Text style={[styles.meta, { color: colors.textMuted }]}>{item.email}</Text>
                {item.business_name ? (
                  <Text style={[styles.meta, { color: colors.textMuted }]}>{item.business_name}</Text>
                ) : null}
              </View>

              {!item.is_admin && (
                <Pressable
                  disabled={pending}
                  onPress={() => {
                    setReason('');
                    setReasonTarget({ user: item, action: item.is_suspended ? 'reinstate' : 'suspend' });
                  }}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    {
                      backgroundColor: item.is_suspended ? colors.goldSoft : colors.errorSoft,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.actionText, { color: item.is_suspended ? colors.goldText : colors.error }]}>
                    {item.is_suspended ? 'إعادة تفعيل' : 'إيقاف'}
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        />
      )}

      <Modal visible={reasonTarget !== null} animationType="slide" transparent onRequestClose={() => setReasonTarget(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surfaceElevated }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {reasonTarget?.action === 'suspend' ? `إيقاف ${reasonTarget?.user.name}` : `إعادة تفعيل ${reasonTarget?.user.name}`}
            </Text>
            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder="اكتب سبب القرار (يُحفظ في السجل)"
              placeholderTextColor={colors.textMuted}
              style={[styles.reasonInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
              multiline
              maxLength={1000}
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setReasonTarget(null)} style={({ pressed }) => [styles.cancelBtn, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}>
                <Text style={[styles.cancelText, { color: colors.textMuted }]}>إلغاء</Text>
              </Pressable>
              <Pressable
                onPress={submitReason}
                disabled={pending}
                style={({ pressed }) => [styles.saveBtn, { backgroundColor: reasonTarget?.action === 'suspend' ? colors.error : colors.primary, opacity: pending || pressed ? 0.7 : 1 }]}
              >
                {pending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[styles.saveText, { color: '#fff' }]}>تأكيد</Text>
                )}
              </Pressable>
            </View>
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
  searchBox: { marginHorizontal: 20, minHeight: 46, borderRadius: 14, flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 14, gap: 8 },
  searchInput: { flex: 1, fontSize: 13, fontFamily: 'Cairo-SemiBold', textAlign: 'right', writingDirection: 'rtl', paddingVertical: 10 },
  filterRow: { flexDirection: 'row-reverse', gap: 8, paddingHorizontal: 20, paddingVertical: 12 },
  chip: { paddingHorizontal: 14, height: 34, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontSize: 12, fontFamily: 'Cairo-Bold' },
  card: { borderRadius: 18, borderWidth: 1, padding: 14, flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  nameRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  name: { fontSize: 15, fontFamily: 'Cairo-Bold', writingDirection: 'rtl' },
  meta: { marginTop: 2, fontSize: 12, fontFamily: 'Cairo-SemiBold', textAlign: 'right' },
  badge: { paddingHorizontal: 8, height: 22, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 10, fontFamily: 'Cairo-Bold' },
  actionBtn: { paddingHorizontal: 14, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontSize: 12, fontFamily: 'Cairo-Bold' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet: { borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 22, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontFamily: 'Cairo-Black', textAlign: 'right', writingDirection: 'rtl', marginBottom: 12 },
  reasonInput: { minHeight: 96, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingTop: 12, fontSize: 14, fontFamily: 'Cairo-SemiBold', textAlign: 'right', writingDirection: 'rtl', textAlignVertical: 'top' },
  modalActions: { marginTop: 16, flexDirection: 'row-reverse', gap: 10 },
  saveBtn: { flex: 1, minHeight: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontSize: 14, fontFamily: 'Cairo-Bold' },
  cancelBtn: { paddingHorizontal: 20, minHeight: 50, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 14, fontFamily: 'Cairo-Bold' },
});
