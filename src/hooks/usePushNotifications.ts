import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import {
  getExpoPushToken,
  getNotificationPermissions,
  notificationsAreAllowed,
  requestNotificationPermissions,
} from '../lib/pushNotifications';
import { registerDevice } from '../services/notifications';
import { useAuthStore } from '../store/auth';

let registeredPushToken: string | null = null;

/** Token registered with the backend for this session, if any (used on logout). */
export function getRegisteredPushToken(): string | null {
  return registeredPushToken;
}

export async function registerCurrentDeviceForPushNotifications(): Promise<string | null> {
  const pushToken = await getExpoPushToken();
  if (!pushToken) return null;

  await registerDevice({
    token: pushToken,
    platform: Platform.OS === 'ios' ? 'ios' : 'android',
    device_name: Device.modelName,
  });
  registeredPushToken = pushToken;

  return pushToken;
}

export async function requestPushNotificationsDuringOnboarding(): Promise<void> {
  const existingPermissions = await getNotificationPermissions();

  if (notificationsAreAllowed(existingPermissions)) {
    await registerCurrentDeviceForPushNotifications();
    return;
  }

  if (existingPermissions.status !== Notifications.PermissionStatus.UNDETERMINED) return;

  const requestedPermissions = await requestNotificationPermissions();
  if (!notificationsAreAllowed(requestedPermissions)) return;

  await registerCurrentDeviceForPushNotifications();
}

function openNotificationUrl(data: unknown) {
  const url = (data as { url?: string } | null)?.url;
  // Only in-app absolute paths; reject protocol-relative and scheme-like values.
  if (typeof url === 'string' && url.startsWith('/') && !url.startsWith('//')) {
    router.push(url as never);
  }
}

/**
 * Registers the device for push notifications once the user is authenticated
 * and routes notification taps to their target screen.
 */
export function usePushNotifications() {
  const token = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const registeredForUser = useRef<string | null>(null);

  useEffect(() => {
    if (!hasHydrated || !token) {
      registeredForUser.current = null;
      return;
    }
    if (registeredForUser.current === token) return;

    let cancelled = false;

    (async () => {
      // Register silently when permission already exists. New permission is
      // requested only after signup or from the notification settings action.
      const pushToken = await registerCurrentDeviceForPushNotifications();
      if (!pushToken || cancelled) return;

      registeredForUser.current = token;
    })().catch(() => {
      // Best effort — retried on next auth change or app restart.
    });

    return () => {
      cancelled = true;
    };
  }, [hasHydrated, token]);

  useEffect(() => {
    // Notification tapped while the app was running (foreground/background).
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      openNotificationUrl(response.notification.request.content.data);
    });

    // Notification that launched the app from a killed state.
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        openNotificationUrl(response.notification.request.content.data);
      }
    });

    return () => {
      responseSub.remove();
    };
  }, []);
}
