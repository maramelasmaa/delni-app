import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../src/hooks/useTheme';

type Props = { mode: 'public' | 'admin'; compact?: boolean };

export function AdminModeSwitch({ mode, compact = false }: Props) {
  const { colors } = useTheme();
  const adminMode = mode === 'admin';
  const target = adminMode ? '/(tabs)/' : '/(admin)/';

  return (
    <Pressable
      onPress={() => router.replace(target as never)}
      accessibilityRole="button"
      accessibilityLabel={adminMode ? 'الانتقال إلى التطبيق العام' : 'الانتقال إلى لوحة الإدارة'}
      hitSlop={8}
      style={({ pressed }) => [
        styles.shell,
        compact && styles.compact,
        {
          backgroundColor: adminMode ? colors.goldSoft : colors.primarySoft,
          borderColor: adminMode ? colors.goldBorder : colors.borderStrong,
          opacity: pressed ? 0.84 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <Ionicons name={adminMode ? 'phone-portrait-outline' : 'shield-checkmark-outline'} size={compact ? 17 : 20} color={adminMode ? colors.goldText : colors.primary} />
      <View style={styles.textWrap}>
        <Text numberOfLines={1} style={[styles.title, compact && styles.compactTitle, { color: adminMode ? colors.goldText : colors.primary }]}> 
          {adminMode ? 'التطبيق العام' : 'لوحة الإدارة'}
        </Text>
        {!compact ? (
          <Text numberOfLines={1} style={[styles.subtitle, { color: colors.textMuted }]}> 
            {adminMode ? 'العودة لتجربة العملاء' : 'متابعة حالة المنصة بسرعة'}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shell: { minHeight: 54, borderRadius: 18, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  compact: { minHeight: 42, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  textWrap: { flexShrink: 1, alignItems: 'flex-end' },
  title: { fontSize: 14, fontFamily: 'Cairo-Bold', textAlign: 'right', writingDirection: 'rtl' },
  compactTitle: { fontSize: 12.5 },
  subtitle: { marginTop: 1, fontSize: 11.5, fontFamily: 'Cairo-Regular', textAlign: 'right', writingDirection: 'rtl' },
});
