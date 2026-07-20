import React, { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { PremiumButton } from '../../components/auth/premiumAuth';
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

const toYMD = (d: Date) => {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

const parseYMD = (s: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : new Date();
};

export default function ProviderCredentialsScreen() {
  const { colors } = useTheme();
  const { alert, showAlert, hideAlert } = useRTLAlert();
  const { data: credentials, isLoading, isError, error, refetch, isRefetching } = useMyCredentials();
  const { create, update, remove } = useCredentialMutations();

  const [form, setForm] = useState<FormState | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  if (isLoading) return <LoadingSpinner />;
  if (isError || !credentials) return <ErrorView error={error} onRetry={refetch} />;

  const saving = create.isPending || update.isPending;

  const submit = () => {
    if (!form) return;
    if (!form.title.trim() || !form.issuer.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(form.issue_date)) {
      showAlert('تنبيه', 'أكمل الاسم وجهة الإصدار والتاريخ بصيغة YYYY-MM-DD.', [{ text: 'حسناً' }]);
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>شهاداتي وخبراتي</Text>
          <Text style={[styles.headerTitle, { color: colors.gold }]}>.</Text>
        </View>
        <Pressable onPress={() => router.replace('/(provider)/' as never)} hitSlop={12} style={styles.backButton}>
          <Ionicons name="arrow-forward" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>

      {/* List */}
      <FlatList
        data={credentials}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl 
            refreshing={isRefetching} 
            onRefresh={refetch} 
            tintColor={colors.primary} 
            colors={[colors.primary]} 
          />
        }
        ListEmptyComponent={
          <EmptyState icon="ribbon-outline" title="لا توجد شهادات" message="أضف شهاداتك وخبراتك لزيادة ثقة العملاء." />
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{item.title}</Text>
              
              <Text style={[styles.cardMeta, { color: colors.textMuted }]}>
                {item.issuer ?? ''}{item.issue_date ? ` · ${item.issue_date}` : ''}
              </Text>
              
              {item.notes ? (
                <Text style={[styles.cardNotes, { color: colors.textMuted }]}>{item.notes}</Text>
              ) : null}
              
              {item.created_at ? (
                <Text style={[styles.createdAt, { color: colors.textMuted }]}>
                  تاريخ الإضافة: {new Date(item.created_at).toLocaleDateString('ar-LY')}
                </Text>
              ) : null}
              
              {item.verification_url ? (
                <Pressable
                  accessibilityRole="link"
                  onPress={() => openExternalUrl(item.verification_url!, { errorMessage: 'تعذر فتح رابط التحقق.' })}
                  style={styles.verifyLink}
                >
                  <Text style={[styles.verifyText, { color: colors.primary }]}>فتح رابط التحقق</Text>
                  <Ionicons name="open-outline" size={14} color={colors.primary} />
                </Pressable>
              ) : null}
            </View>

            {/* Actions Panel */}
            <View style={styles.cardActions}>
              <Pressable
                hitSlop={10}
                style={[styles.actionIcon, { backgroundColor: colors.primarySoft, borderColor: colors.borderStrong }]}
                onPress={() => {
                  setShowDatePicker(false);
                  setForm({
                    id: item.id,
                    title: item.title,
                    issuer: item.issuer ?? '',
                    issue_date: item.issue_date ?? '',
                    verification_url: item.verification_url ?? '',
                    notes: item.notes ?? '',
                  });
                }}
              >
                <Ionicons name="create-outline" size={18} color={colors.primary} />
              </Pressable>
              
              <Pressable 
                hitSlop={10} 
                style={[styles.actionIcon, { backgroundColor: colors.primarySoft, borderColor: colors.borderStrong }]}
                onPress={() => confirmDelete(item)}
              >
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </Pressable>
            </View>
          </View>
        )}
      />

      {/* Floating Action Button (FAB) */}
      <View style={styles.fabWrap}>
        <PremiumButton
          title="إضافة شهادة جديدة"
          icon="add"
          onPress={() => {
            setShowDatePicker(false);
            setForm({ ...EMPTY_FORM });
          }}
        />
      </View>

      {/* Bottom Sheet Form Modal */}
      <Modal visible={form !== null} animationType="slide" transparent onRequestClose={() => setForm(null)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalSheet, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderStrong }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="إغلاق"
              onPress={() => setForm(null)}
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
                {form?.id ? 'تعديل الشهادة' : 'إضافة شهادة جديدة'}
              </Text>
            </View>

            {form && (
              <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.formContainer} style={styles.modalFields}>
                <TextInput 
                  value={form.title} 
                  onChangeText={(v) => setForm({ ...form, title: v })} 
                  placeholder="اسم الشهادة أو الخبرة" 
                  placeholderTextColor={colors.textMuted} 
                  style={[styles.input, { color: colors.textPrimary, borderColor: colors.borderStrong, backgroundColor: colors.surface }]} 
                  maxLength={255} 
                />
                <TextInput 
                  value={form.issuer} 
                  onChangeText={(v) => setForm({ ...form, issuer: v })} 
                  placeholder="جهة الإصدار" 
                  placeholderTextColor={colors.textMuted} 
                  style={[styles.input, { color: colors.textPrimary, borderColor: colors.borderStrong, backgroundColor: colors.surface }]} 
                  maxLength={255} 
                />
                <Pressable
                  onPress={() => setShowDatePicker(true)}
                  style={[styles.input, styles.dateField, { borderColor: colors.borderStrong, backgroundColor: colors.surface }]}
                >
                  <Text
                    style={[
                      styles.dateFieldText,
                      { color: form.issue_date ? colors.textPrimary : colors.textMuted },
                    ]}
                  >
                    {form.issue_date || 'تاريخ الإصدار'}
                  </Text>
                  <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
                </Pressable>

                {showDatePicker && (
                  <DateTimePicker
                    value={parseYMD(form.issue_date)}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    maximumDate={new Date()}
                    onChange={(event, date) => {
                      if (Platform.OS === 'android') setShowDatePicker(false);
                      if (event.type !== 'dismissed' && date) {
                        setForm((prev) => (prev ? { ...prev, issue_date: toYMD(date) } : prev));
                      }
                    }}
                  />
                )}
                {showDatePicker && Platform.OS === 'ios' && (
                  <Pressable
                    onPress={() => setShowDatePicker(false)}
                    style={[styles.dateDoneBtn, { backgroundColor: colors.primarySoft }]}
                  >
                    <Text style={[styles.dateDoneText, { color: colors.textPrimary }]}>تم</Text>
                  </Pressable>
                )}
                <TextInput 
                  value={form.verification_url} 
                  onChangeText={(v) => setForm({ ...form, verification_url: v })} 
                  placeholder="رابط التحقق (اختياري)" 
                  placeholderTextColor={colors.textMuted} 
                  style={[styles.input, { color: colors.textPrimary, borderColor: colors.borderStrong, backgroundColor: colors.surface }]} 
                  autoCapitalize="none" 
                  keyboardType="url" 
                  maxLength={500} 
                />
                <TextInput 
                  value={form.notes} 
                  onChangeText={(v) => setForm({ ...form, notes: v })} 
                  placeholder="ملاحظات إضافية (اختياري)" 
                  placeholderTextColor={colors.textMuted} 
                  style={[styles.input, styles.multiline, { color: colors.textPrimary, borderColor: colors.borderStrong, backgroundColor: colors.surface }]} 
                  multiline 
                  maxLength={500} 
                />
              </ScrollView>
            )}

            <View style={styles.modalActions}>
              <PremiumButton
                title="حفظ الشهادة"
                loadingTitle="جاري الحفظ..."
                loading={saving}
                onPress={submit}
                style={styles.saveBtn}
              />
              <Pressable
                accessibilityRole="button"
                onPress={() => setForm(null)}
                style={({ pressed }) => [
                  styles.cancelBtn,
                  { backgroundColor: colors.surfaceAlt, borderColor: colors.borderStrong, opacity: pressed ? 0.78 : 1 },
                ]}
              >
                <Text style={[styles.cancelText, { color: colors.textPrimary }]}>إلغاء</Text>
              </Pressable>
            </View>
          </View>

          {/* iOS can't present a sibling modal above this one — nest the alert here */}
          <RTLAlert alert={alert} onDismiss={hideAlert} />
        </KeyboardAvoidingView>
      </Modal>

      {form === null && <RTLAlert alert={alert} onDismiss={hideAlert} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { 
    paddingHorizontal: 20, 
    paddingTop: 16, 
    paddingBottom: 16, 
    flexDirection: 'row-reverse', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  headerTitle: { fontSize: 20, fontFamily: 'Cairo-Black', writingDirection: 'rtl' },
  headerTitleRow: { flexDirection: 'row-reverse', alignItems: 'center' },
  backButton: { padding: 4 },
  listContainer: { paddingBottom: 140, paddingHorizontal: 20, gap: 14 },
  
  // Card Styling
  card: { 
    borderRadius: 16, 
    borderWidth: 1, 
    padding: 16, 
    flexDirection: 'row-reverse', 
    alignItems: 'flex-start', 
    gap: 16 
  },
  cardContent: { flex: 1, alignItems: 'flex-end' },
  cardTitle: { fontSize: 16, fontFamily: 'Cairo-Bold', textAlign: 'right', writingDirection: 'rtl', marginBottom: 2 },
  cardMeta: { fontSize: 13, fontFamily: 'Cairo-SemiBold', textAlign: 'right', writingDirection: 'rtl' },
  cardNotes: { marginTop: 8, fontSize: 13, lineHeight: 22, fontFamily: 'Cairo-Regular', textAlign: 'right', writingDirection: 'rtl' },
  createdAt: { marginTop: 6, fontSize: 11, fontFamily: 'Cairo-Regular', textAlign: 'right', writingDirection: 'rtl' },
  verifyLink: { marginTop: 10, flexDirection: 'row-reverse', alignItems: 'center', gap: 6, alignSelf: 'flex-end' },
  verifyText: { fontSize: 13, fontFamily: 'Cairo-Bold', writingDirection: 'rtl' },
  cardActions: { flexDirection: 'column', gap: 10, justifyContent: 'center' },
  actionIcon: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  
  // FAB Button
  fabWrap: { position: 'absolute', bottom: 30, left: 20, right: 20 },

  // Modal Styling
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  modalSheet: { height: '78%', borderTopLeftRadius: 30, borderTopRightRadius: 30, borderWidth: 1, paddingHorizontal: 24, paddingTop: 14, paddingBottom: Platform.OS === 'ios' ? 34 : 28 },
  sheetCloseButton: { position: 'absolute', top: 14, left: 24, zIndex: 2, width: 40, height: 40, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  sheetHandle: { alignSelf: 'center', width: 52, height: 6, borderRadius: 999, opacity: 0.7, marginBottom: 18 },
  modalHeader: { alignItems: 'flex-end', marginBottom: 18, paddingLeft: 48 },
  modalTitle: { fontSize: 24, fontFamily: 'Cairo-Black', textAlign: 'right', writingDirection: 'rtl' },
  modalFields: { flexGrow: 0 },
  formContainer: { gap: 12, paddingBottom: 2 },
  input: { minHeight: 54, borderRadius: 16, borderWidth: 1.5, paddingHorizontal: 16, fontSize: 14, fontFamily: 'Cairo-SemiBold', textAlign: 'right', writingDirection: 'rtl' },
  multiline: { minHeight: 90, paddingTop: 12, textAlignVertical: 'top' },
  dateField: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  dateFieldText: { fontSize: 14, fontFamily: 'Cairo-SemiBold', textAlign: 'right', writingDirection: 'rtl' },
  dateDoneBtn: { alignSelf: 'center', paddingHorizontal: 28, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  dateDoneText: { fontSize: 14, fontFamily: 'Cairo-Bold' },
  modalActions: { marginTop: 38, gap: 14 },
  saveBtn: { width: '100%' },
  cancelBtn: { width: '100%', minHeight: 58, borderRadius: 20, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 16, fontFamily: 'Cairo-Bold', textAlign: 'center', writingDirection: 'rtl' },
});
