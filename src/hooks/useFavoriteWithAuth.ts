import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { useAuthStore } from '../store/auth';

export interface FavoriteAuthConfig {
  redirectPath?: string;
  redirectParams?: Record<string, any>;
}

export function useFavoriteWithAuth(config?: FavoriteAuthConfig) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [showAuthAlert, setShowAuthAlert] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [pendingProviderSlug, setPendingProviderSlug] = useState<string | null>(null);

  const handleFavoritePress = useCallback(
    (action: () => void, providerSlug?: string) => {
      if (!isAuthenticated) {
        setPendingAction(() => action);
        setPendingProviderSlug(providerSlug || null);
        setShowAuthAlert(true);
        return;
      }
      action();
    },
    [isAuthenticated],
  );

  const handleConfirmLogin = useCallback(() => {
    setShowAuthAlert(false);
    // If provider slug is available, redirect to provider detail after login
    // Otherwise use the default redirect path
    const redirectPath = pendingProviderSlug
      ? `/provider/${pendingProviderSlug}`
      : (config?.redirectPath || '/');
    const params = config?.redirectParams || {};

    requestAnimationFrame(() => {
      router.push({
        pathname: '/(auth)/login',
        params: { redirectTo: redirectPath, ...params },
      });
    });
    setPendingAction(null);
    setPendingProviderSlug(null);
  }, [config, pendingProviderSlug]);

  const handleDismiss = useCallback(() => {
    setShowAuthAlert(false);
    setPendingAction(null);
    setPendingProviderSlug(null);
  }, []);

  return {
    showAuthAlert,
    handleFavoritePress,
    handleConfirmLogin,
    handleDismiss,
  };
}
