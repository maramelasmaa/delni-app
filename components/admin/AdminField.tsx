import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import type { useTheme } from '../../src/hooks/useTheme';

export function AdminField({
  label,
  value,
  onChangeText,
  colors,
  keyboardType,
  autoCapitalize = 'sentences',
  multiline = false,
  secureTextEntry = false,
  containerStyle,
  inputStyle,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  colors: ReturnType<typeof useTheme>['colors'];
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'url' | 'number-pad';
  autoCapitalize?: 'none' | 'sentences';
  multiline?: boolean;
  secureTextEntry?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}) {
  return (
    <View style={[styles.fieldWrap, containerStyle]}>
      <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        secureTextEntry={secureTextEntry}
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          multiline && styles.textArea,
          { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.bg },
          inputStyle,
        ]}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fieldWrap: { gap: 7 },
  fieldLabel: { fontSize: 12.5, fontFamily: 'Cairo-Bold', textAlign: 'right', writingDirection: 'rtl' },
  input: { minHeight: 50, borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 14, fontSize: 14, fontFamily: 'Cairo-SemiBold', textAlign: 'right', writingDirection: 'rtl' },
  textArea: { minHeight: 96, paddingTop: 13 },
});
