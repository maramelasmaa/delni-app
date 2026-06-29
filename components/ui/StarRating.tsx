import { Ionicons } from '@expo/vector-icons';
import { rtlRow } from '../../src/utils/rtl';
import { Pressable, View } from 'react-native';
import { useTheme } from '../../src/hooks/useTheme';

interface Props {
  value: number;
  max?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export function StarRating({ value, max = 5, size = 16, interactive = false, onChange }: Props) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row-reverse' }}>
      {Array.from({ length: max }, (_, i) => {
        const star = i + 1;
        const filled = star <= value;
        return (
          <Pressable
            key={star}
            disabled={!interactive}
            onPress={() => onChange?.(star)}
            hitSlop={interactive ? 8 : 0}
          >
            <Ionicons
               name={filled ? 'star' : 'star-outline'}
               size={size}
               color={filled ? colors.star : colors.textDisabled}
             />
          </Pressable>
        );
      })}
    </View>
  );
}
