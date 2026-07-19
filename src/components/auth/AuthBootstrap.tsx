import { SplashScreen, Stack } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useMe } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/auth';
import { useTheme } from '../../hooks/useTheme';
import { usePushNotifications } from '../../hooks/usePushNotifications';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore duplicate calls during fast refresh.
});

export function AuthBootstrap() {
  const { colors } = useTheme();
  const token = useAuthStore((s) => s.token);
  const isStoreLoading = useAuthStore((s) => s.isLoading);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const finishBootstrap = useAuthStore((s) => s.finishBootstrap);

  usePushNotifications();

  const meQuery = useMe({
    enabled: !isStoreLoading && !!token,
  });

  useEffect(() => {
    if (isStoreLoading) return;
    if (hasHydrated) return;

    // No token: proceed immediately
    if (!token) {
      finishBootstrap();
      return;
    }

    // Has token: proceed immediately without waiting for /me to complete.
    // Validate user in background; if 401, clear auth.
    finishBootstrap();

    // Async: validate the token in background. If it fails, clear auth.
    if (meQuery.isError && !meQuery.isLoading) {
      const status = (meQuery.error as { response?: { status?: number } } | null)?.response?.status;
      if (status === 401) {
        clearAuth().catch(() => {});
      }
    }
  }, [isStoreLoading, hasHydrated, token, clearAuth, meQuery.isError, meQuery.isLoading, meQuery.error]);

  useEffect(() => {
    if (hasHydrated) {
      SplashScreen.hideAsync().catch(() => {
        // Ignore hide races during fast refresh.
      });
    }
  }, [hasHydrated]);

  if (!hasHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.textPrimary, fontFamily: 'Cairo-Bold' },
        headerTintColor: colors.primary,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Protected guard={!token}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>

      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(provider)" options={{ headerShown: false }} />
      <Stack.Screen name="(admin)" options={{ headerShown: false }} />
      <Stack.Screen
        name="provider/[slug]"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="category/[slug]"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="subcategory/[slug]"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="account"
        options={{ headerShown: true, headerTitle: 'المعلومات الشخصية', headerBackTitle: ' ' }}
      />
      <Stack.Screen
        name="admin-broadcast"
        options={{ headerShown: true, headerTitle: 'إرسال إشعار عام', headerBackTitle: ' ' }}
      />
      <Stack.Screen
        name="about"
        options={{ headerShown: true, headerTitle: 'من نحن', headerBackTitle: ' ' }}
      />
      <Stack.Screen
        name="contact"
        options={{ headerShown: true, headerTitle: 'تواصل معنا', headerBackTitle: ' ' }}
      />
      <Stack.Screen
        name="privacy"
        options={{ headerShown: true, headerTitle: 'سياسة الخصوصية', headerBackTitle: ' ' }}
      />
      <Stack.Screen
        name="terms"
        options={{ headerShown: true, headerTitle: 'الشروط والأحكام', headerBackTitle: ' ' }}
      />
      <Stack.Screen
        name="disclaimer"
        options={{ headerShown: true, headerTitle: 'إخلاء المسؤولية', headerBackTitle: ' ' }}
      />
    </Stack>
  );
}

