import { useColorScheme } from 'react-native';
import { useThemeStore } from '../store/theme';
import { darkColors, lightColors, type ThemeColors } from '../theme/tokens';

export type ColorScheme = 'light' | 'dark';

export interface Theme {
  colors: ThemeColors;
  scheme: ColorScheme;
  isDark: boolean;
}

/**
 * Resolves the active palette from the OS appearance + the user's saved preference.
 * 'system' → follow the OS; 'light'/'dark' → force that scheme.
 *
 * Usage:
 *   const { colors, isDark } = useTheme();
 *   <View style={{ backgroundColor: colors.bg }} />
 *
 * For memoized list items, build a StyleSheet factory keyed on `colors`:
 *   const styles = useMemo(() => makeStyles(colors), [colors]);
 */
export function useTheme(): Theme {
  const systemScheme = useColorScheme();
  const preference = useThemeStore((s) => s.preference);

  const scheme: ColorScheme =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;

  return {
    colors: scheme === 'dark' ? darkColors : lightColors,
    scheme,
    isDark: scheme === 'dark',
  };
}
