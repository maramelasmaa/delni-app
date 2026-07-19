import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { router, useSegments } from 'expo-router';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/auth';

type AppMode = 'public' | 'provider';

type Props = {
  mode?: AppMode;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

const MODE_OPTIONS: { mode: AppMode; label: string; target: '/(tabs)/' | '/(provider)/'; accessibilityLabel: string }[] = [
  { mode: 'public', label: 'عام', target: '/(tabs)/', accessibilityLabel: 'الانتقال إلى التطبيق العام' },
  { mode: 'provider', label: 'مقدم خدمة', target: '/(provider)/', accessibilityLabel: 'الانتقال إلى لوحة مقدم الخدمة' },
];

function useCurrentMode(explicitMode?: AppMode): AppMode {
  const segments = useSegments();
  return useMemo(() => {
    if (explicitMode) return explicitMode;
    return segments[0] === '(provider)' ? 'provider' : 'public';
  }, [explicitMode, segments]);
}

export function AppModeSegmentedControl({ mode, compact = false, style }: Props) {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const activeMode = useCurrentMode(mode);
  const [switchingTo, setSwitchingTo] = useState<AppMode | null>(null);
  const lockRef = useRef(false);
  const canUseProviderMode = !!user?.is_provider;

  const handleSelect = useCallback((nextMode: AppMode) => {
    if (nextMode === activeMode || lockRef.current) return;
    if (nextMode === 'provider' && !canUseProviderMode) return;

    const option = MODE_OPTIONS.find((item) => item.mode === nextMode);
    if (!option) return;

    lockRef.current = true;
    setSwitchingTo(nextMode);
    requestAnimationFrame(() => {
      router.replace(option.target as never);
      setTimeout(() => {
        lockRef.current = false;
        setSwitchingTo(null);
      }, 650);
    });
  }, [activeMode, canUseProviderMode]);

  return (
    <View
      accessibilityLabel="تبديل وضع التطبيق"
      style={[
        styles.container,
        compact && styles.compactContainer,
        { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
        style,
      ]}
    >
      {MODE_OPTIONS.map((option) => {
        const active = option.mode === activeMode;
        const disabled = switchingTo !== null || (option.mode === 'provider' && !canUseProviderMode);
        const loading = switchingTo === option.mode;

        return (
          <Pressable
            key={option.mode}
            onPress={() => handleSelect(option.mode)}
            disabled={disabled || active}
            accessibilityRole="button"
            accessibilityLabel={option.accessibilityLabel}
            accessibilityState={{ selected: active, disabled }}
            hitSlop={6}
            style={({ pressed }) => [
              styles.segment,
              compact && styles.compactSegment,
              {
                backgroundColor: active ? colors.primary : 'transparent',
                opacity: disabled && !active ? 0.48 : pressed ? 0.82 : 1,
                transform: [{ scale: pressed && !active ? 0.98 : 1 }],
              },
            ]}
          >
            {loading ? <ActivityIndicator size="small" color={active ? colors.textOnPrimary : colors.primary} /> : null}
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
              style={[
                styles.label,
                compact && styles.compactLabel,
                { color: active ? colors.textOnPrimary : colors.textPrimary },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 48,
    borderRadius: 999,
    borderWidth: 1,
    padding: 4,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  compactContainer: {
    minHeight: 42,
    padding: 3,
  },
  segment: {
    minHeight: 40,
    minWidth: 96,
    flex: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row-reverse',
    gap: 6,
  },
  compactSegment: {
    minHeight: 34,
    minWidth: 72,
    paddingHorizontal: 10,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Cairo-Bold',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  compactLabel: {
    fontSize: 12,
  },
});
