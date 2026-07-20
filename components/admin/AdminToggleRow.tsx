import { StyleSheet, Switch, Text, View } from 'react-native';
import type { useTheme } from '../../src/hooks/useTheme';

export function AdminToggleRow({
  label,
  value,
  onValueChange,
  colors,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={[styles.toggleRow, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: colors.primary }} />
      <Text style={[styles.toggleText, { color: colors.textPrimary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toggleRow: { minHeight: 52, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleText: { fontSize: 13.5, fontFamily: 'Cairo-Bold', writingDirection: 'rtl' },
});
