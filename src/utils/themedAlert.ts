import { Alert, Appearance } from 'react-native';
import type { AlertButton, AlertOptions } from 'react-native';

export function showNativeAlert(
  title: string,
  message?: string,
  buttons: AlertButton[] = [{ text: 'حسناً' }],
  options?: AlertOptions,
) {
  Alert.alert(title, message, buttons, {
    ...options,
    userInterfaceStyle: Appearance.getColorScheme() === 'dark' ? 'dark' : 'light',
  } as AlertOptions);
}
