import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { useTheme } from '../../src/hooks/useTheme';
import type { AdminCatalogItem } from '../../src/services/admin';

export function AdminOptionChips({
  label,
  items,
  selectedValue,
  onSelect,
  colors,
  getValue = (item) => item.id,
}: {
  label: string;
  items: AdminCatalogItem[];
  selectedValue: string | number | null;
  onSelect: (value: string | number) => void;
  colors: ReturnType<typeof useTheme>['colors'];
  getValue?: (item: AdminCatalogItem) => string | number;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>{label}</Text>
      <View style={styles.chips}>
        {items.map((item) => {
          const value = getValue(item);
          const active = String(selectedValue ?? '') === String(value);
          return (
            <Pressable
              key={`${label}-${item.id}`}
              onPress={() => onSelect(value)}
              style={[styles.chip, { backgroundColor: active ? colors.primary : colors.bg, borderColor: active ? colors.primary : colors.border }]}
            >
              <Text numberOfLines={1} style={[styles.chipText, { color: active ? colors.textOnPrimary : colors.textMuted }]}>
                {item.localized_name || item.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldWrap: { gap: 7 },
  fieldLabel: { fontSize: 12.5, fontFamily: 'Cairo-Bold', textAlign: 'right', writingDirection: 'rtl' },
  chips: { direction: 'rtl', flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { maxWidth: '100%', minHeight: 34, borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  chipText: { maxWidth: 180, fontSize: 11.5, fontFamily: 'Cairo-Bold', textAlign: 'center', writingDirection: 'rtl' },
});
