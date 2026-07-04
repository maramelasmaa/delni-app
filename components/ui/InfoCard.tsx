import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import type { ThemeColors } from '../../src/theme/tokens';
import { radius, spacing } from '../../src/theme/tokens';
import { rtlRow } from '../../src/utils/rtl';

type InfoCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  children: ReactNode;
  colors: ThemeColors;
};

export function InfoCard({ icon, title, children, colors }: InfoCardProps) {
  return (
    <View
      style={{
        marginBottom: spacing.md,
        borderRadius: radius.xl,
        backgroundColor: colors.surface,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0,
        shadowRadius: 6,
        elevation: 0,
      }}
    >
      <View style={{ ...rtlRow(), alignItems: 'center', marginBottom: 14 }}>
        <View
          style={{
            height: 32,
            width: 32,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: radius.full,
            backgroundColor: colors.primarySoft,
            marginLeft: 8,
          }}
        >
          <Ionicons name={icon} size={18} color={colors.primary} />
        </View>
        <Text style={{ textAlign: 'right', fontSize: 16, fontFamily: 'Cairo-Bold', color: colors.textPrimary }}>
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}
