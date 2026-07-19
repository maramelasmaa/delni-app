import { Ionicons } from '@expo/vector-icons';
import { Redirect, router, Tabs } from 'expo-router';
import { Platform, Pressable, View } from 'react-native';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/auth';

const TAB_ICON_SIZE = 22;

export default function ProviderTabsLayout() {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  if (hasHydrated && !isAuthenticated) return <Redirect href="/(auth)/login" />;
  if (hasHydrated && user && !user.is_provider) return <Redirect href="/(tabs)/" />;

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surfaceElevated,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 70,
          paddingBottom: Platform.OS === 'ios' ? 26 : 10,
          paddingTop: 8,
          elevation: 0,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0,
          shadowRadius: 12,
        },
        tabBarItemStyle: {
          minHeight: 52,
          paddingHorizontal: 2,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          lineHeight: 14,
          fontFamily: 'Cairo-Bold',
          writingDirection: 'rtl',
        },
      }}
    >
      <Tabs.Screen name="settings" options={{ title: 'الإعدادات', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'settings' : 'settings-outline'} size={TAB_ICON_SIZE} color={color} /> }} />
      <Tabs.Screen name="reviews" options={{ title: 'التقييمات', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'star' : 'star-outline'} size={TAB_ICON_SIZE} color={color} /> }} />
      <Tabs.Screen
        name="public"
        options={{
          title: 'انتقال',
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: colors.gold,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: Platform.OS === 'ios' ? 18 : 16,
                shadowColor: colors.shadow,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0,
                shadowRadius: 10,
                elevation: 0,
                borderWidth: 3,
                borderColor: focused ? colors.gold : colors.border,
              }}
            >
              <Ionicons name="swap-horizontal-outline" size={25} color="#FFFFFF" />
            </View>
          ),
          tabBarButton: ({ ref: _ref, ...props }) => (
            <Pressable
              {...props}
              accessibilityRole="button"
              accessibilityLabel="العودة إلى التطبيق العام"
              onPress={() => router.replace('/(tabs)/' as never)}
            />
          ),
        }}
      />
      <Tabs.Screen name="portfolio" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ title: 'ملفي', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'create' : 'create-outline'} size={TAB_ICON_SIZE} color={color} /> }} />
      <Tabs.Screen name="index" options={{ title: 'لوحة التحكم', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'grid' : 'grid-outline'} size={TAB_ICON_SIZE} color={color} /> }} />
      <Tabs.Screen name="profile-edit" options={{ href: null }} />
      <Tabs.Screen name="credentials" options={{ href: null }} />
    </Tabs>
  );
}
