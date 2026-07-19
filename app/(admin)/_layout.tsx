import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/auth';

export default function AdminTabsLayout() {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  if (hasHydrated && !isAuthenticated) return <Redirect href="/(auth)/login" />;
  if (hasHydrated && user && !user.is_admin) return <Redirect href="/(tabs)/" />;

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
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 26 : 10,
          paddingTop: 8,
          elevation: 0,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0,
          shadowRadius: 12,
        },
        tabBarLabelStyle: { fontSize: 10, fontFamily: 'Cairo-Bold' },
      }}
    >
      <Tabs.Screen name="settings" options={{ title: 'الإعدادات', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'settings' : 'settings-outline'} size={22} color={color} /> }} />
      <Tabs.Screen name="providers" options={{ title: 'المزودون', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'briefcase' : 'briefcase-outline'} size={22} color={color} /> }} />
      <Tabs.Screen name="catalog" options={{ title: 'الفهرس', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'albums' : 'albums-outline'} size={22} color={color} /> }} />
      <Tabs.Screen name="reviews" options={{ title: 'التقييمات', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'star' : 'star-outline'} size={22} color={color} /> }} />
      <Tabs.Screen name="users" options={{ title: 'المستخدمون', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'people' : 'people-outline'} size={22} color={color} /> }} />
      <Tabs.Screen name="index" options={{ title: 'الإدارة', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'shield-checkmark' : 'shield-checkmark-outline'} size={22} color={color} /> }} />
    </Tabs>
  );
}
