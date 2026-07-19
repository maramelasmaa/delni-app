import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, type ReactNode } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdminModeSwitch } from '../../components/provider/AdminModeSwitch';
import { AppModeSegmentedControl } from '../../components/provider/AppModeSegmentedControl';
import { useLogout } from '../../src/hooks/useAuth';
import { registerCurrentDeviceForPushNotifications } from '../../src/hooks/usePushNotifications';
import { useTheme } from '../../src/hooks/useTheme';
import {
  getNotificationPermissions,
  notificationsAreAllowed,
  requestNotificationPermissions,
} from '../../src/lib/pushNotifications';
import { useAuthStore } from '../../src/store/auth';
import { useThemeStore, type ThemePreference } from '../../src/store/theme';
import type { ThemeColors } from '../../src/theme/tokens';
import { showNativeAlert } from '../../src/utils/themedAlert';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
  colors: ThemeColors;
  isLast?: boolean;
}

const getIconStyles = (color: string, colors: ThemeColors) => {
  const isDark = colors.bg === '#0B1120';

  if (color === colors.primary) {
    return {
      bg: colors.primarySoft,
      border: isDark ? 'rgba(96, 165, 250, 0.30)' : 'rgba(30, 64, 175, 0.20)',
    };
  }

  if (color === colors.gold || color === colors.star) {
    return {
      bg: colors.goldSoft,
      border: colors.goldBorder,
    };
  }

  if (color === colors.success) {
    return {
      bg: isDark ? 'rgba(52, 211, 153, 0.14)' : 'rgba(16, 185, 129, 0.08)',
      border: isDark ? 'rgba(52, 211, 153, 0.30)' : 'rgba(16, 185, 129, 0.20)',
    };
  }

  if (color === colors.error) {
    return {
      bg: isDark ? 'rgba(248, 113, 113, 0.14)' : 'rgba(239, 68, 68, 0.08)',
      border: isDark ? 'rgba(248, 113, 113, 0.30)' : 'rgba(239, 68, 68, 0.20)',
    };
  }

  if (color === '#8B5CF6' || color === '#A78BFA') {
    return {
      bg: isDark ? 'rgba(167, 139, 250, 0.14)' : 'rgba(139, 92, 246, 0.08)',
      border: isDark ? 'rgba(167, 139, 250, 0.30)' : 'rgba(139, 92, 246, 0.20)',
    };
  }

  return {
    bg: colors.surfaceAlt,
    border: colors.border,
  };
};

function MenuItem({
  icon,
  iconColor,
  label,
  subtitle,
  onPress,
  danger = false,
  colors,
  isLast = false,
}: MenuItemProps) {
  const iconStyles = getIconStyles(iconColor, colors);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        transform: [{ scale: pressed ? 0.98 : 1 }],
        opacity: pressed ? 0.95 : 1,
      })}
    >
      <View
        style={[
          styles.menuRowCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            shadowColor: colors.shadow,
          },
        ]}
      >
        <Ionicons name="chevron-back" size={16} color={colors.textMuted} />

        <View style={styles.menuTextWrap}>
          <Text
            style={[
              styles.menuLabel,
              {
                color: danger ? colors.error : colors.textPrimary,
              },
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
          {subtitle ? (
            <Text
              style={[
                styles.menuSubtitle,
                {
                  color: colors.textMuted,
                },
              ]}
              numberOfLines={2}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View
          style={[
            styles.menuIconBox,
            {
              backgroundColor: iconStyles.bg,
              borderColor: iconStyles.border,
            },
          ]}
        >
          <Ionicons name={icon} size={22} color={iconColor} />
        </View>
      </View>
    </Pressable>
  );
}

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'light', label: 'الوضع الفاتح', icon: 'sunny' },
  { value: 'system', label: 'النظام', icon: 'phone-portrait' },
  { value: 'dark', label: 'الوضع الداكن', icon: 'moon' },
];

function ThemeToggle({ colors }: { colors: ThemeColors }) {
  const preference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);

  return (
    <View style={styles.themeToggleRow}>
      {THEME_OPTIONS.map((opt) => {
        const active = preference === opt.value;

        return (
          <Pressable
            key={opt.value}
            onPress={() => setPreference(opt.value)}
            style={({ pressed }) => ({
              flex: 1,
              alignItems: 'center',
              transform: [{ scale: pressed ? 0.95 : 1 }],
            })}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: active ? colors.primarySoft : colors.surfaceAlt,
                borderWidth: 1.5,
                borderColor: active ? colors.primary : colors.border,
                shadowColor: active ? colors.primary : 'transparent',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: active ? 0.15 : 0,
                shadowRadius: 4,
                elevation: active ? 3 : 0,
              }}
            >
              <Ionicons
                name={opt.icon}
                size={22}
                color={active ? colors.primary : colors.textSecondary}
              />
            </View>

            <Text
              style={{
                fontSize: 12,
                fontFamily: active ? 'Cairo-Bold' : 'Cairo-SemiBold',
                color: active ? colors.textPrimary : colors.textMuted,
                marginTop: 8,
                textAlign: 'center',
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SectionBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.sectionBlock}>
      <Text style={styles.staticSectionHeader}>{title}</Text>
      {children}
    </View>
  );
}

function ProfileRow({
  icon,
  iconColor,
  iconBackground,
  iconBorder,
  title,
  subtitle,
  onPress,
  colors,
  letter,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBackground: string;
  iconBorder: string;
  title: string;
  subtitle: string;
  onPress?: () => void;
  colors: ThemeColors;
  letter?: string;
}) {
  const content = (
    <View
      style={[
        styles.menuRowCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowColor: colors.shadow,
        },
      ]}
    >
      <Ionicons name="chevron-back" size={16} color={colors.textMuted} />

      <View style={styles.menuTextWrap}>
        <Text style={[styles.menuLabel, { color: colors.textPrimary }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.menuSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>

      <View
        style={[
          styles.profileAvatarBox,
          {
            backgroundColor: iconBackground,
            borderColor: iconBorder,
          },
        ]}
      >
        {letter ? (
          <Text style={{ fontSize: 20, color: iconColor, fontFamily: 'Cairo-Black' }}>{letter}</Text>
        ) : (
          <Ionicons name={icon ?? 'person'} size={24} color={iconColor} />
        )}
      </View>
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        transform: [{ scale: pressed ? 0.98 : 1 }],
        opacity: pressed ? 0.95 : 1,
      })}
    >
      {content}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { colors } = useTheme();
  const themedStyles = useMemo(() => makeStyles(colors), [colors]);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useLogout();
  const isDark = colors.bg === '#0B1120';

  const handleNotificationsPress = async () => {
    try {
      let permissions = await getNotificationPermissions();
      const wasAlreadyAllowed = notificationsAreAllowed(permissions);
      const couldAskOnEntry = permissions.canAskAgain;

      if (!wasAlreadyAllowed && permissions.canAskAgain) {
        permissions = await requestNotificationPermissions();
      }

      if (notificationsAreAllowed(permissions)) {
        await registerCurrentDeviceForPushNotifications().catch(() => null);

        if (wasAlreadyAllowed) {
          await Linking.openSettings();
        }
        return;
      }

      if (!couldAskOnEntry) {
        await Linking.openSettings();
      }
    } catch {
      showNativeAlert('تعذر فتح الإشعارات', 'حاول مرة أخرى أو افتح إعدادات الهاتف.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={themedStyles.scrollContent}
      >
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>الإعدادات</Text>
            <Text style={[styles.headerTitle, { color: colors.gold }]}>.</Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            معلومات الحساب والتطبيق
          </Text>
        </View>

        {isAuthenticated && user ? (
          <ProfileRow
            title={user.name}
            subtitle={user.email}
            iconColor={colors.goldText}
            iconBackground={colors.goldSoft}
            iconBorder={colors.goldBorder}
            colors={colors}
            letter={user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            onPress={() => router.push('/account')}
          />
        ) : (
          <ProfileRow
            title="تسجيل الدخول"
            subtitle="سجل دخولك للوصول إلى ميزات أكثر"
            icon="person"
            iconColor={colors.primary}
            iconBackground={colors.primarySoft}
            iconBorder={isDark ? 'rgba(96, 165, 250, 0.30)' : 'rgba(30, 64, 175, 0.20)'}
            colors={colors}
            onPress={() => router.push('/(auth)/login')}
          />
        )}



        {isAuthenticated && user?.is_admin ? (
          <SectionBlock title={String.fromCharCode(0x0627, 0x0644, 0x0625, 0x062F, 0x0627, 0x0631, 0x0629)}>
            <View style={{ marginHorizontal: 16, marginBottom: 12 }}>
              <AdminModeSwitch mode="public" />
            </View>
          </SectionBlock>
        ) : null}

        {isAuthenticated && user?.is_provider ? (
          <SectionBlock title={String.fromCharCode(0x0645, 0x0642, 0x062F, 0x0645, 0x0020, 0x0627, 0x0644, 0x062E, 0x062F, 0x0645, 0x0629)}>
            <View style={{ marginHorizontal: 16, marginBottom: 12 }}>
              <AppModeSegmentedControl />
            </View>
          </SectionBlock>
        ) : null}
        <SectionBlock title="المظهر">
          <View style={[themedStyles.card, themedStyles.themeCard]}>
            <ThemeToggle colors={colors} />
          </View>
        </SectionBlock>

        <SectionBlock title="التطبيق">
          {isAuthenticated ? (
            <MenuItem
              icon="notifications"
              iconColor={colors.gold}
              label="الإشعارات"
              subtitle="السماح بإشعارات دلني من إعدادات الهاتف"
              onPress={handleNotificationsPress}
              colors={colors}
            />
          ) : null}
          <MenuItem
            icon="information-circle"
            iconColor={colors.primary}
            label="من نحن"
            subtitle="تعرف علينا أكثر"
            onPress={() => router.push('/about')}
            colors={colors}
          />
          <MenuItem
            icon="call"
            iconColor={colors.primary}
            label="تواصل معنا"
            subtitle="نحن هنا لمساعدتك"
            onPress={() => router.push('/contact')}
            colors={colors}
            isLast
          />
        </SectionBlock>

        <SectionBlock title="الشروط والسياسات">
          <MenuItem
            icon="lock-closed"
            iconColor="#8B5CF6"
            label="سياسة الخصوصية"
            subtitle="كيف نحمي بياناتك"
            onPress={() => router.push('/privacy')}
            colors={colors}
          />
          <MenuItem
            icon="document-text"
            iconColor={colors.gold}
            label="الشروط والأحكام"
            subtitle="شروط استخدام التطبيق"
            onPress={() => router.push('/terms')}
            colors={colors}
          />
          <MenuItem
            icon="shield-checkmark"
            iconColor={colors.primary}
            label="إخلاء المسؤولية"
            subtitle="تنويه هام"
            onPress={() => router.push('/disclaimer')}
            colors={colors}
            isLast
          />
        </SectionBlock>

        {isAuthenticated ? (
          <SectionBlock title="الحساب">
            <MenuItem
              icon="log-out"
              iconColor={colors.error}
              label={logout.isPending ? 'جاري تسجيل الخروج...' : 'تسجيل الخروج'}
              subtitle={logout.isPending ? 'يرجى الانتظار لحظة' : 'الخروج من حسابك الحالي'}
              danger
              onPress={() => {
                if (!logout.isPending) logout.mutate();
              }}
              colors={colors}
              isLast
            />
          </SectionBlock>
        ) : null}

        <Text style={[styles.versionText, { color: colors.textDisabled }]}>دلني v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  headerTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Cairo-Black',
  },
  headerSubtitle: {
    textAlign: 'right',
    marginTop: 4,
    fontSize: 15,
    fontFamily: 'Cairo-SemiBold',
  },
  sectionBlock: {
    marginTop: 6,
  },
  staticSectionHeader: {
    paddingHorizontal: 24,
    marginBottom: 12,
    fontSize: 12,
    fontFamily: 'Cairo-Bold',
    textAlign: 'right',
    color: '#94A3B8',
  },
  themeToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 4,
    gap: 10,
  },
  profileAvatarBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  menuItem: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  menuRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // Match the category provider row exactly (ProviderRowCard).
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 22,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  menuIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  menuTextWrap: {
    flex: 1,
    marginRight: 16,
    marginLeft: 12,
    alignItems: 'flex-end',
  },
  menuLabel: {
    fontSize: 16,
    fontFamily: 'Cairo-Bold',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  menuSubtitle: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: 'Cairo-Regular',
    textAlign: 'right',
    lineHeight: 18,
    writingDirection: 'rtl',
  },
  versionText: {
    marginTop: 30,
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Cairo-Regular',
  },
});

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    scrollContent: {
      paddingBottom: 132,
    },
    card: {
      marginHorizontal: 16,
      marginBottom: 12,
      backgroundColor: colors.surface,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 2,
      overflow: 'hidden',
    },
    themeCard: {
      paddingHorizontal: 20,
      paddingVertical: 18,
    },
  });
}


