import { Ionicons } from '@expo/vector-icons';
import { router, useSegments } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/auth';

type AppMode = 'public' | 'provider';

type Props = {
  mode?: AppMode;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

function useCurrentMode(explicitMode?: AppMode): AppMode {
  const segments = useSegments();
  return useMemo(() => {
    if (explicitMode) return explicitMode;
    return segments[0] === '(provider)' ? 'provider' : 'public';
  }, [explicitMode, segments]);
}

export function AppModeSegmentedControl({ mode, compact = false, style }: Props) {
  const { colors } = useTheme();
  const user = useAuthStore((state) => state.user);
  const activeMode = useCurrentMode(mode);
  const [switching, setSwitching] = useState(false);
  const lockRef = useRef(false);
  const nextMode: AppMode = activeMode === 'provider' ? 'public' : 'provider';
  const target = nextMode === 'provider' ? '/(provider)/' : '/(tabs)/';
  const label = nextMode === 'provider' ? 'فتح لوحة مقدم الخدمة' : 'العودة إلى التطبيق العام';

  const handleSwitch = useCallback(() => {
    if (lockRef.current || (nextMode === 'provider' && !user?.is_provider)) return;

    lockRef.current = true;
    setSwitching(true);
    requestAnimationFrame(() => {
      router.replace(target as never);
      setTimeout(() => {
        lockRef.current = false;
        setSwitching(false);
      }, 650);
    });
  }, [nextMode, target, user?.is_provider]);

  if (!user?.is_provider) return null;

  return (
    <Pressable
      onPress={handleSwitch}
      disabled={switching}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="يبدل بين التطبيق العام ولوحة مقدم الخدمة"
      accessibilityState={{ busy: switching, disabled: switching }}
      hitSlop={8}
      style={({ pressed }) => [
        styles.button,
        compact && styles.compactButton,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderStrong,
          opacity: switching ? 0.68 : pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.94 : 1 }],
        },
        style,
      ]}
    >
      {switching ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <>
          <Ionicons
            name={nextMode === 'provider' ? 'briefcase-outline' : 'phone-portrait-outline'}
            size={compact ? 20 : 23}
            color={colors.primary}
          />
          <View pointerEvents="none" style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Ionicons name="swap-horizontal" size={10} color={colors.textOnPrimary} />
          </View>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 46,
    height: 46,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactButton: {
    width: 40,
    height: 40,
  },
  badge: {
    position: 'absolute',
    right: 3,
    bottom: 3,
    width: 17,
    height: 17,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
