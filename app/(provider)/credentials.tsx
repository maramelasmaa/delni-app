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
import { router } from 'expo-router';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorView } from '../../components/ui/ErrorView';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { RTLAlert, useRTLAlert } from '../../components/ui/RTLAlert';
import { useCredentialMutations, useMyCredentials } from '../../src/hooks/useProviderManagement';
import { useTheme } from '../../src/hooks/useTheme';
import { parseApiError } from '../../src/lib/error-parser';
import type { ProviderCredential } from '../../src/types';
import { openExternalUrl } from '../../src/utils/links';

interface FormState {
  id?: number;
  title: string;
  issuer: string;
  issue_date: string;
  verification_url: string;
  notes: string;
}

const EMPTY_FORM: FormState = { title: '', issuer: '', issue_date: '', verification_url: '', notes: '' };

export default function ProviderCredentialsScreen() {
  const { colors } = useTheme();
  const { alert, showAlert, hideAlert } = useRTLAlert();
  const { data: credentials, isLoading, isError, error, refetch, isRefetching } = useMyCredentials();
  const { create, update, remove } = useCredentialMutations();

  const [form, setForm] = useState<FormState | null>(null);

  if (isLoading) return <LoadingSpinner />;
  if (isError || !credentials) return <ErrorView error={error} onRetry={refetch} />;

  const saving = create.isPending || update.isPending;

  const submit = () => {
    if (!form) return;
    if (!form.title.trim() || !form.issuer.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(form.issue_date)) {
      showAlert('تنبيه', 'أكمل الاسم وجهة الإصدار والتاريخ بصيغة 2024-01-30.', [{ text: 'حسناً' }]);
      return;
    }

    const payload = {
      title: form.title.trim(),
      issuer: form.issuer.trim(),
      issue_date: form.issue_date,
      verification_url: form.verification_url.trim() || undefined,
      notes: form.notes.trim() || undefined,
    };

    const options = {
      onSuccess: () => setForm(null),
      onError: (err: unknown) => showAlert('تعذر الحفظ', parseApiError(err).message, [{ text: 'حسناً' }]),
    };

    if (form.id) {
      update.mutate({ id: form.id, ...payload }, options);
    } else {
      create.mutate(payload, options);
    }
  };

  const confirmDelete = (credential: ProviderCredential) => {
    showAlert('حذف الشهادة', `سيتم حذف «${credential.title}» نهائياً.`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: () =>
          remove.mutate(credential.id, {
            onError: (err) => showAlert('تعذر الحذف', parseApiError(err).message, [{ text: 'حسناً' }]),
          }),
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ padding: 4 }}>
          <Ionicons name="arrow-forward" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>شهاداتي وخبراتي</Text>
      </View>

      <FlatList
        data={credentials}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: 130, paddingHorizontal: 20, gap: 12 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} colors={[colors.primary]} />}
        ListEmptyComponent={
          <EmptyState icon="ribbon-outline" title="لا توجد شهادات" message="أضف شهاداتك وخبراتك لزيادة ثقة العملاء." />
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{item.title}</Text>
              <Text style={[styles.cardMeta, { color: colors.textMuted }]}>
                {item.issuer ?? ''}{item.issue_date ? ` · ${item.issue_date}` : ''}
              </Text>
              {item.notes ? <Text style={[styles.cardNotes, { color: colors.textMuted }]}>{item.notes}</Text> : null}
              {item.created_at ? (
                <Text style={[styles.createdAt, { color: colors.textMuted }]}>تاريخ الإضافة: {new Date(item.created_at).toLocaleDateString('ar-LY')}</Text>
              ) : null}
              {item.verification_url ? (
                <Pressable
                  accessibilityRole="link"
                  onPress={() => openExternalUrl(item.verification_url!, { errorMessage: 'تعذر فتح رابط التحقق.' })}
                  style={styles.verifyLink}
                >
                  <Ionicons name="open-outline" size={15} color={colors.primary} />
                  <Text style={[styles.verifyText, { color: colors.primary }]}>فتح رابط التحقق</Text>
                </Pressable>
              ) : null}
            </View>
            <View style={styles.cardActions}>
              <Pressable
                hitSlop={8}
                onPress={() =>
                  setForm({
                    id: item.id,
                    title: item.title,
                    issuer: item.issuer ?? '',
                    issue_date: item.issue_date ?? '',
                    verification_url: item.verification_url ?? '',
                    notes: item.notes ?? '',
                  })
                }
              >
                <Ionicons name="create-outline" size={20} color={colors.primary} />
              </Pressable>
              <Pressable hitSlop={8} onPress={() => confirmDelete(item)}>
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </Pressable>
            </View>
          </View>
        )}
      />

      <Pressable
        onPress={() => setForm({ ...EMPTY_FORM })}
        style={({ pressed }) => [styles.fab, { backgroundColor: colors.primary, opacity: pressed ? 0.86 : 1 }]}
      >
        <Ionicons name="add" size={22} color={colors.textOnPrimary} />
        <Text style={[styles.fabText, { color: colors.textOnPrimary }]}>شهادة جديدة</Text>
      </Pressable>

      <Modal visible={form !== null} animationType="slide" transparent onRequestClose={() => setForm(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surfaceElevated }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {form?.id ? 'تعديل الشهادة' : 'شهادة جديدة'}
            </Text>

            {form && (
              <>
                <TextInput value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} placeholder="اسم الشهادة أو الخبرة" placeholderTextColor={colors.textMuted} style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]} maxLength={255} />
                <TextInput value={form.issuer} onChangeText={(v) => setForm({ ...form, issuer: v })} placeholder="جهة الإصدار" placeholderTextColor={colors.textMuted} style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]} maxLength={255} />
                <TextInput value={form.issue_date} onChangeText={(v) => setForm({ ...form, issue_date: v })} placeholder="تاريخ الإصدار (2024-01-30)" placeholderTextColor={colors.textMuted} style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]} keyboardType="numbers-and-punctuation" maxLength={10} />
                <TextInput value={form.verification_url} onChangeText={(v) => setForm({ ...form, verification_url: v })} placeholder="رابط التحقق (اختياري)" placeholderTextColor={colors.textMuted} style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]} autoCapitalize="none" keyboardType="url" maxLength={500} />
                <TextInput value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} placeholder="ملاحظات إضافية (اختياري)" placeholderTextColor={colors.textMuted} style={[styles.input, styles.multiline, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]} multiline maxLength={500} />
              </>
            )}

            <View style={styles.modalActions}>
              <Pressable onPress={() => setForm(null)} style={({ pressed }) => [styles.cancelBtn, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}>
                <Text style={[styles.cancelText, { color: colors.textMuted }]}>إلغاء</Text>
              </Pressable>
              <Pressable onPress={submit} disabled={saving} style={({ pressed }) => [styles.saveBtn, { backgroundColor: colors.primary, opacity: saving || pressed ? 0.7 : 1 }]}>
                {saving ? <ActivityIndicator size="small" color={colors.textOnPrimary} /> : <Text style={[styles.saveText, { color: colors.textOnPrimary }]}>حفظ</Text>}
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
  header: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 22, fontFamily: 'Cairo-Black', writingDirection: 'rtl' },
  card: { borderRadius: 18, borderWidth: 1, padding: 14, flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  cardTitle: { fontSize: 15, fontFamily: 'Cairo-Bold', textAlign: 'right', writingDirection: 'rtl' },
  cardMeta: { marginTop: 2, fontSize: 12, fontFamily: 'Cairo-SemiBold', textAlign: 'right', writingDirection: 'rtl' },
  cardNotes: { marginTop: 7, fontSize: 12, lineHeight: 20, fontFamily: 'Cairo-Regular', textAlign: 'right', writingDirection: 'rtl' },
  createdAt: { marginTop: 5, fontSize: 11, fontFamily: 'Cairo-Regular', textAlign: 'right', writingDirection: 'rtl' },
  verifyLink: { marginTop: 8, minHeight: 34, flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  verifyText: { fontSize: 12, fontFamily: 'Cairo-Bold', writingDirection: 'rtl' },
  cardActions: { flexDirection: 'row-reverse', gap: 14 },
  fab: { position: 'absolute', bottom: 104, alignSelf: 'center', flexDirection: 'row-reverse', alignItems: 'center', gap: 6, paddingHorizontal: 18, height: 48, borderRadius: 999 },
  fabText: { fontSize: 14, fontFamily: 'Cairo-Bold' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet: { borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 22, paddingBottom: 40, gap: 10 },
  modalTitle: { fontSize: 19, fontFamily: 'Cairo-Black', textAlign: 'right', writingDirection: 'rtl', marginBottom: 4 },
  input: { minHeight: 50, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, fontSize: 14, fontFamily: 'Cairo-SemiBold', textAlign: 'right', writingDirection: 'rtl' },
  multiline: { minHeight: 84, paddingTop: 12, textAlignVertical: 'top' },
  modalActions: { marginTop: 10, flexDirection: 'row-reverse', gap: 10 },
  saveBtn: { flex: 1, minHeight: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontSize: 14, fontFamily: 'Cairo-Bold' },
  cancelBtn: { paddingHorizontal: 20, minHeight: 50, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 14, fontFamily: 'Cairo-Bold' },
});
