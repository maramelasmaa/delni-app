import { Ionicons } from '@expo/vector-icons';
import { Redirect, router, Tabs } from 'expo-router';
import { Platform, Pressable, Text, View } from 'react-native';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/auth';

const TAB_ICON_SIZE = 22;

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
      <Tabs.Screen name="settings" options={{ title: 'الإعدادات', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'settings' : 'settings-outline'} size={TAB_ICON_SIZE} color={color} /> }} />
      <Tabs.Screen name="notifications" options={{ title: 'الإشعارات', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'megaphone' : 'megaphone-outline'} size={TAB_ICON_SIZE} color={color} /> }} />
      <Tabs.Screen
        name="switch"
        options={{
          title: 'انتقال',
          tabBarLabel: ({ color }) => (
            <Text style={{ marginTop: 6, color, fontSize: 10, lineHeight: 14, fontFamily: 'Cairo-Bold', writingDirection: 'rtl' }}>
              انتقال
            </Text>
          ),
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
      <Tabs.Screen name="reviews" options={{ title: 'التقييمات', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'star' : 'star-outline'} size={TAB_ICON_SIZE} color={color} /> }} />
      <Tabs.Screen name="index" options={{ title: 'الإحصاءات', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'stats-chart' : 'stats-chart-outline'} size={TAB_ICON_SIZE} color={color} /> }} />
    </Tabs>
  );
}
