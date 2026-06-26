import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '../../src/hooks/useTheme';

export function LoadingSpinner() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
