import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Show notifications as banners even while the app is in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function ensureAndroidNotificationChannel() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('default', {
    name: 'الإشعارات',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    sound: 'default',
  });
}

export function notificationsAreAllowed(
  permissions: Notifications.NotificationPermissionsStatus,
): boolean {
  if (permissions.granted) return true;

  return (
    permissions.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED ||
    permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL ||
    permissions.ios?.status === Notifications.IosAuthorizationStatus.EPHEMERAL
  );
}

export async function getNotificationPermissions() {
  return Notifications.getPermissionsAsync();
}

export async function requestNotificationPermissions() {
  await ensureAndroidNotificationChannel();

  return Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });
}

export async function getExpoPushToken(): Promise<string | null> {
  // Push tokens only exist on physical devices; simulators return garbage.
  if (!Device.isDevice) return null;

  await ensureAndroidNotificationChannel();

  const permissions = await getNotificationPermissions();
  if (!notificationsAreAllowed(permissions)) return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

  if (!projectId) return null;

  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data;
  } catch {
    return null;
  }
}
