import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppModeSegmentedControl } from '../../components/provider/AppModeSegmentedControl';
import { useLogout } from '../../src/hooks/useAuth';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/auth';
import type { ThemeColors } from '../../src/theme/tokens';

type SettingsRoute = '/account';

function MenuRow({ icon, label, subtitle, color, onPress, colors, danger = false }: { icon: keyof typeof Ionicons.glyphMap; label: string; subtitle: string; color: string; onPress: () => void; colors: ThemeColors; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.86 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] })}>
      <View style={[styles.menuRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="chevron-back" size={16} color={colors.textMuted} />
        <View style={styles.menuText}>
          <Text numberOfLines={1} style={[styles.menuLabel, { color: danger ? colors.error : colors.textPrimary }]}>{label}</Text>
          <Text numberOfLines={2} style={[styles.menuSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
        </View>
        <View style={[styles.menuIcon, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
      </View>
    </Pressable>
  );
}

function ProviderLink({ icon, label, subtitle, route, color, colors }: { icon: keyof typeof Ionicons.glyphMap; label: string; subtitle: string; route: SettingsRoute; color: string; colors: ThemeColors }) {
  return <MenuRow icon={icon} label={label} subtitle={subtitle} color={color} onPress={() => router.push(route as never)} colors={colors} />;
}

export default function ProviderSettingsScreen() {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 116 }}>
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <AppModeSegmentedControl mode="provider" compact />
            <View style={styles.headerTitleRow}>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>إعدادات مقدم الخدمة</Text>
              <Text style={[styles.headerTitle, { color: colors.gold }]}>.</Text>
            </View>
          </View>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>كل ما يخص حسابك وملفك داخل التطبيق</Text>
        </View>

        {user ? (
          <View style={[styles.identity, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.avatar, { backgroundColor: colors.goldSoft, borderColor: colors.goldBorder }]}>
              <Text style={[styles.avatarText, { color: colors.goldText }]}>{user.name ? user.name.charAt(0).toUpperCase() : 'P'}</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text numberOfLines={1} style={[styles.name, { color: colors.textPrimary }]}>{user.name}</Text>
              <Text numberOfLines={1} style={[styles.email, { color: colors.textMuted }]}>{user.email}</Text>
            </View>
          </View>
        ) : null}

        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>الحساب</Text>
        <ProviderLink icon="person-outline" label="المعلومات الشخصية" subtitle="تعديل الاسم والبريد وكلمة المرور" route="/account" color={colors.primary} colors={colors} />

        <MenuRow icon="log-out-outline" label={logout.isPending ? 'جاري تسجيل الخروج...' : 'تسجيل الخروج'} subtitle="الخروج من حساب مقدم الخدمة" color={colors.error} danger onPress={() => { if (!logout.isPending) logout.mutate(); }} colors={colors} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  headerTopRow: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  headerTitleRow: { flexDirection: 'row-reverse', alignItems: 'center', flexShrink: 1 },
  headerTitle: { fontSize: 26, lineHeight: 36, fontFamily: 'Cairo-Black', textAlign: 'right', writingDirection: 'rtl' },
  headerSubtitle: { marginTop: 4, fontSize: 14, fontFamily: 'Cairo-SemiBold', textAlign: 'right', writingDirection: 'rtl' },
  identity: { marginHorizontal: 16, marginBottom: 22, padding: 12, borderRadius: 20, borderWidth: 1, flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  avatar: { width: 54, height: 54, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 22, fontFamily: 'Cairo-Black' },
  name: { fontSize: 16, fontFamily: 'Cairo-Bold', textAlign: 'right', writingDirection: 'rtl' },
  email: { marginTop: 2, fontSize: 12, fontFamily: 'Cairo-Regular', textAlign: 'right' },
  sectionTitle: { paddingHorizontal: 24, marginTop: 8, marginBottom: 12, fontSize: 12, fontFamily: 'Cairo-Bold', textAlign: 'right', writingDirection: 'rtl' },
  menuRow: { marginHorizontal: 16, marginBottom: 12, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  menuText: { flex: 1, marginRight: 16, marginLeft: 12, alignItems: 'flex-end' },
  menuLabel: { fontSize: 16, fontFamily: 'Cairo-Bold', textAlign: 'right', writingDirection: 'rtl' },
  menuSubtitle: { marginTop: 2, fontSize: 12, lineHeight: 18, fontFamily: 'Cairo-Regular', textAlign: 'right', writingDirection: 'rtl' },
  menuIcon: { width: 52, height: 52, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
