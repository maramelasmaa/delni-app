import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../../src/hooks/useTheme';
import { CategoryIcon } from './CategoryIcon';

interface Props {
  title: string;
  subtitle?: string;
  iconUrl?: string | null;
  iconName: keyof typeof Ionicons.glyphMap;
  selected?: boolean;
  /** Neutral tone (e.g. "عرض الكل") — surface icon instead of the gold accent. */
  neutral?: boolean;
  onPress: () => void;
  disabled?: boolean;
}

/**
 * Compact, premium horizontal category card. Self-contained (reads theme tokens),
 * RTL-safe (centered text + writingDirection), and resilient to long Arabic names
 * (2-line clamp). Renders backend SVG icons via CategoryIcon with an Ionicon fallback.
 */
export const CategoryCard = memo(function CategoryCard({
  title,
  subtitle,
  iconUrl,
  iconName,
  selected = false,
  neutral = false,
  onPress,
  disabled = false,
}: Props) {
  const { colors, isDark } = useTheme();

  // Define styling strictly based on the user's targeted dark theme carousel specs
  const cardBg = selected ? colors.goldSoft : isDark ? 'rgba(255, 255, 255, 0.04)' : colors.surfaceAlt;
  const cardBorder = selected ? colors.gold : isDark ? 'rgba(255, 255, 255, 0.08)' : colors.border;
  const iconBg = selected ? colors.goldSoft : isDark ? 'rgba(255, 255, 255, 0.05)' : colors.surfaceAlt;
  const iconBorder = selected ? colors.gold : isDark ? 'rgba(255, 255, 255, 0.08)' : colors.border;
  const iconColor = selected ? colors.gold : colors.textMuted;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ selected, disabled }}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 156,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: cardBg,
        borderWidth: 1,
        borderColor: cardBorder,
        opacity: disabled ? 0.5 : 1,
        transform: [{ scale: pressed ? 0.97 : 1 }],
      })}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: 'center',
          backgroundColor: iconBg,
          borderWidth: 1,
          borderColor: iconBorder,
          marginBottom: 8,
          overflow: 'hidden',
        }}
      >
        <CategoryIcon iconUrl={iconUrl} fallbackName={iconName} size={24} color={iconColor} />
      </View>

      <Text
        numberOfLines={2}
        style={{
          textAlign: 'center',
          writingDirection: 'rtl',
          fontSize: 13,
          lineHeight: 17,
          fontFamily: 'Cairo-Bold',
          color: colors.textPrimary,
          width: '100%',
        }}
      >
        {title}
      </Text>

      {subtitle ? (
        <Text
          numberOfLines={1}
          style={{
            textAlign: 'center',
            writingDirection: 'rtl',
            fontSize: 11,
            lineHeight: 15,
            fontFamily: 'Cairo-SemiBold',
            color: colors.textMuted,
            marginTop: 2,
            width: '100%',
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </Pressable>
  );
});

