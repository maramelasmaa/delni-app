import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../src/hooks/useTheme';

export function AdminSection({ title, children }: { title: string; children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.sectionHeading}>
        <View style={[styles.sectionMarker, { backgroundColor: colors.gold }]} />
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 12 },
  sectionHeading: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 2 },
  sectionMarker: { width: 4, height: 16, borderRadius: 2 },
  sectionTitle: { fontSize: 16, fontFamily: 'Cairo-Black', textAlign: 'right', writingDirection: 'rtl' },
});
