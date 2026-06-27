/**
 * Semantic color tokens.
 *
 * `lightColors` and `darkColors` MUST share the exact same keys so any component
 * can read `colors.bg`, `colors.textPrimary`, etc. via useTheme() and adapt to the
 * active scheme automatically. Never hardcode hex in screens — add a token here.
 *
 * Dark palette follows Material guidance: a dark navy (NOT pure black) as the base,
 * lighter surfaces to express elevation, desaturated-but-bright text for contrast,
 * and a brighter blue/gold (saturated brand colors glow better on dark).
 */

export interface ThemeColors {
  // Surfaces
  bg: string; // screen background
  surface: string; // cards
  surfaceAlt: string; // subtle insets: search bars, icon boxes
  surfaceElevated: string; // sheets, modals, tab bar
  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textDisabled: string;
  textOnPrimary: string; // text on a primary-colored fill
  // Lines
  border: string;
  borderStrong: string;
  // Brand
  primary: string;
  primarySoft: string; // primary tint background
  // Gold / mustard accent
  gold: string;
  goldSoft: string; // pill background
  goldBorder: string;
  goldText: string; // text on goldSoft
  goldActive: string; // active/pressed mustard background
  // Status
  success: string;
  successSoft: string; // success background
  error: string;
  errorSoft: string; // error background
  // Social platforms
  whatsapp: string;
  facebook: string;
  instagram: string;
  linkedin: string;
  github: string;
  star: string;
  // Effects
  overlayLight: string; // rgba(0,0,0,0.3)
  overlayMedium: string; // rgba(0,0,0,0.5)
  overlayHeavy: string; // rgba(0,0,0,0.7)
  overlay: string; // image scrims (medium)
  shadow: string;
}

export const lightColors: ThemeColors = {
  bg: '#F6F8FF',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F5F9',
  surfaceElevated: '#FFFFFF',

  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textDisabled: '#CBD5E1',
  textOnPrimary: '#FFFFFF',

  border: '#E8EEF8',
  borderStrong: '#CBD5E1',

  primary: '#1E40AF',
  primarySoft: 'rgba(30, 64, 175, 0.10)',

  gold: '#E1AD01',
  goldSoft: '#FFFBEB',
  goldBorder: '#FDE68A',
  goldText: '#92400E',
  goldActive: '#FEF3C7',

  success: '#10B981',
  successSoft: 'rgba(16, 185, 129, 0.10)',
  error: '#EF4444',
  errorSoft: 'rgba(239, 68, 68, 0.10)',
  whatsapp: '#25D366',
  facebook: '#1877F2',
  instagram: '#E1306C',
  linkedin: '#0A66C2',
  github: '#F1F5F9',
  star: '#E1AD01',

  overlayLight: 'rgba(0,0,0,0.3)',
  overlayMedium: 'rgba(0,0,0,0.5)',
  overlayHeavy: 'rgba(0,0,0,0.7)',
  overlay: 'rgba(0,0,0,0.45)',
  shadow: '#0F172A',
};

export const darkColors: ThemeColors = {
  bg: '#0B1120', // deep navy, not black
  surface: '#131C2E', // +1 elevation
  surfaceAlt: '#1B2740', // insets
  surfaceElevated: '#16203A', // sheets / tab bar

  textPrimary: '#F1F5F9',
  textSecondary: '#A8B4C8',
  textMuted: '#7C8AA5',
  textDisabled: '#4B5A75',
  textOnPrimary: '#FFFFFF',

  border: '#243149',
  borderStrong: '#33425E',

  primary: '#60A5FA', // brighter blue reads on dark
  primarySoft: 'rgba(96, 165, 250, 0.16)',

  gold: '#F0BE2C', // brighter mustard
  goldSoft: 'rgba(225, 173, 1, 0.14)',
  goldBorder: 'rgba(240, 190, 44, 0.35)',
  goldText: '#F0BE2C',
  goldActive: 'rgba(225, 173, 1, 0.24)',

  success: '#34D399',
  successSoft: 'rgba(52, 211, 153, 0.12)',
  error: '#F87171',
  errorSoft: 'rgba(248, 113, 113, 0.12)',
  whatsapp: '#25D366',
  facebook: '#1877F2',
  instagram: '#E1306C',
  linkedin: '#0A66C2',
  github: '#F1F5F9',
  star: '#F0BE2C',

  overlayLight: 'rgba(0,0,0,0.3)',
  overlayMedium: 'rgba(0,0,0,0.5)',
  overlayHeavy: 'rgba(0,0,0,0.7)',
  overlay: 'rgba(0,0,0,0.55)',
  shadow: '#000000',
};

/** Legacy flat export kept for any code still importing `colors`. Points at light. */
export const colors = {
  primary: lightColors.primary,
  primaryLight: '#EFF6FF',
  primaryMuted: lightColors.primarySoft,
  navy: lightColors.textPrimary,
  surface: lightColors.surface,
  white: '#FFFFFF',
  border: '#E2E8F0',
  textSecondary: '#64748B',
  textMuted: lightColors.textMuted,
  success: lightColors.success,
  warning: '#D4A017',
  error: lightColors.error,
  green: lightColors.whatsapp,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
} as const;

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  black: '900' as const,
};

/** Minimum recommended touch target size (44×44pt per Apple HIG). */
export const touchTarget = 44;
