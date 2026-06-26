import '../global.css';
import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { I18nManager } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colorScheme as nwColorScheme } from 'nativewind';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthBootstrap } from '../src/components/auth/AuthBootstrap';
import { queryClient } from '../src/lib/queryClient';
import { useAuthStore } from '../src/store/auth';
import { useCityStore } from '../src/store/city';
import { useThemeStore } from '../src/store/theme';
import { useTheme } from '../src/hooks/useTheme';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Cairo_400Regular,
  Cairo_600SemiBold,
  Cairo_700Bold,
  Cairo_900Black,
} from '@expo-google-fonts/cairo';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const loadToken = useAuthStore((s) => s.loadToken);
  const isLoading = useAuthStore((s) => s.isLoading);
  const hydrateCity = useCityStore((s) => s.hydrate);
  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const themeHydrated = useThemeStore((s) => s.hasHydrated);
  const preference = useThemeStore((s) => s.preference);
  const { colors, isDark } = useTheme();

  // Keep NativeWind's dark: variant in sync with our store so className-based
  // screens follow the same System/Light/Dark choice as token-based screens.
  useEffect(() => {
    nwColorScheme.set(preference);
  }, [preference]);

  const [fontsLoaded] = useFonts({
    'Cairo-Regular': Cairo_400Regular,
    'Cairo-SemiBold': Cairo_600SemiBold,
    'Cairo-Bold': Cairo_700Bold,
    'Cairo-Black': Cairo_900Black,
  });

  useEffect(() => {
    // This app is hand-mirrored for Arabic: every row uses `flexDirection: 'row-reverse'`,
    // horizontal lists use `inverted`, and text uses `textAlign: 'right'` / `writingDirection: 'rtl'`.
    // That manual mirroring is only correct on an LTR base (I18nManager.isRTL === false).
    // Forcing RTL made the OS auto-flip horizontal layouts too, double-flipping everything
    // back to left-to-right (filters/carousels started from the left). So we pin LTR here
    // and let the explicit per-component mirroring do the work. Takes effect after a reload.
    I18nManager.allowRTL(false);
    I18nManager.forceRTL(false);
    loadToken();
    hydrateCity();
    hydrateTheme();
  }, [loadToken, hydrateCity, hydrateTheme]);

  useEffect(() => {
    if (fontsLoaded && !isLoading && themeHydrated) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isLoading, themeHydrated]);

  if (!fontsLoaded || isLoading || !themeHydrated) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
        <SafeAreaProvider>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <AuthBootstrap />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
