import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { broadcastAnnouncement } from '../../src/services/notifications';
import { useTheme } from '../../src/hooks/useTheme';
import { showNativeAlert } from '../../src/utils/themedAlert';
import type { ThemeColors } from '../../src/theme/tokens';

export default function AdminNotificationsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');

  const mutation = useMutation({
    mutationFn: broadcastAnnouncement,
    onSuccess: (recipients) => {
      showNativeAlert('تم الإرسال ✅', `تم إرسال الإشعار إلى ${recipients} مستخدم.`);
      setTitle('');
      setBody('');
      setUrl('');
    },
    onError: () => {
      showNativeAlert('تعذر الإرسال', 'لم نتمكن من إرسال الإشعار. تحقق من الحقول وحاول مرة أخرى.');
    },
  });

  const canSubmit = title.trim().length > 0 && body.trim().length > 0 && !mutation.isPending;

  const submit = () => {
    if (!canSubmit) return;
    const trimmedUrl = url.trim();
    mutation.mutate({
      title: title.trim(),
      body: body.trim(),
      ...(trimmedUrl ? { url: trimmedUrl } : {}),
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>الإشعارات</Text>
              <Text style={[styles.headerTitle, { color: colors.gold }]}>.</Text>
            </View>
            <Text style={styles.headerSubtitle}>بث إعلان لجميع مستخدمي التطبيق</Text>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="megaphone" size={22} color={colors.primary} />
            <Text style={styles.infoText}>
              سيصل هذا الإشعار إلى جميع المستخدمين الذين فعّلوا إشعارات الإعلانات والأخبار.
            </Text>
          </View>

          <Text style={styles.label}>عنوان الإشعار</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="مثال: عروض جديدة في دلني 🎉"
            placeholderTextColor={colors.textDisabled}
            maxLength={100}
            textAlign="right"
          />

          <Text style={styles.label}>نص الإشعار</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={body}
            onChangeText={setBody}
            placeholder="اكتب نص الإشعار هنا..."
            placeholderTextColor={colors.textDisabled}
            maxLength={500}
            multiline
            numberOfLines={4}
            textAlign="right"
            textAlignVertical="top"
          />

          <Text style={styles.label}>رابط داخل التطبيق (اختياري)</Text>
          <TextInput
            style={styles.input}
            value={url}
            onChangeText={setUrl}
            placeholder="/top-rated أو /provider/اسم-المزود"
            placeholderTextColor={colors.textDisabled}
            maxLength={255}
            autoCapitalize="none"
            autoCorrect={false}
            textAlign="right"
          />
          <Text style={styles.hint}>
            عند الضغط على الإشعار سيفتح هذا المسار داخل التطبيق. يجب أن يبدأ بـ /
          </Text>

          <Pressable
            onPress={submit}
            disabled={!canSubmit}
            style={({ pressed }) => [
              styles.submitButton,
              {
                opacity: !canSubmit ? 0.5 : pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            {mutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.submitText}>إرسال للجميع</Text>
                <Ionicons name="send" size={18} color="#FFFFFF" />
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    scrollContent: {
      padding: 20,
      paddingBottom: 60,
    },
    header: { paddingHorizontal: 0, paddingBottom: 18, alignItems: 'flex-end' },
    titleRow: { flexDirection: 'row-reverse', alignItems: 'center' },
    headerTitle: { fontSize: 26, fontFamily: 'Cairo-Black' },
    headerSubtitle: { marginTop: 1, fontSize: 13, fontFamily: 'Cairo-SemiBold', color: colors.textMuted, textAlign: 'right', writingDirection: 'rtl' },
    infoCard: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      borderRadius: 18,
      borderWidth: 1,
      backgroundColor: colors.primarySoft,
      borderColor: colors.border,
      marginBottom: 20,
    },
    infoText: {
      flex: 1,
      fontSize: 13,
      fontFamily: 'Cairo-SemiBold',
      color: colors.textSecondary,
      textAlign: 'right',
      lineHeight: 20,
      writingDirection: 'rtl',
    },
    label: {
      fontSize: 14,
      fontFamily: 'Cairo-Bold',
      color: colors.textPrimary,
      textAlign: 'right',
      marginBottom: 8,
      writingDirection: 'rtl',
    },
    input: {
      borderWidth: 1,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 15,
      fontFamily: 'Cairo-Regular',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      color: colors.textPrimary,
      marginBottom: 16,
      writingDirection: 'rtl',
    },
    multiline: {
      minHeight: 110,
    },
    hint: {
      fontSize: 12,
      fontFamily: 'Cairo-Regular',
      color: colors.textMuted,
      textAlign: 'right',
      marginTop: -8,
      marginBottom: 24,
      writingDirection: 'rtl',
    },
    submitButton: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      paddingVertical: 15,
      borderRadius: 18,
      backgroundColor: colors.primary,
    },
    submitText: {
      fontSize: 16,
      fontFamily: 'Cairo-Bold',
      color: '#FFFFFF',
    },
  });
}
