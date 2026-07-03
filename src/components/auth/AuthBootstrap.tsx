import { SplashScreen, Stack } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useMe } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/auth';
import { useTheme } from '../../hooks/useTheme';

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

  const meQuery = useMe({
    enabled: !isStoreLoading && !!token,
  });

  useEffect(() => {
    if (!isStoreLoading && !token) {
      finishBootstrap();
    }
  }, [finishBootstrap, isStoreLoading, token]);

  useEffect(() => {
    if (!token || isStoreLoading || hasHydrated) {
      return;
    }

    if (meQuery.isError) {
      const status = (meQuery.error as { response?: { status?: number } } | null)?.response?.status;

      if (status === 401) {
        clearAuth().finally(() => finishBootstrap());
        return;
      }

      finishBootstrap();
      return;
    }

    if (meQuery.isSuccess) {
      finishBootstrap();
    }
  }, [clearAuth, finishBootstrap, hasHydrated, isStoreLoading, meQuery.error, meQuery.isError, meQuery.isSuccess, token]);

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

