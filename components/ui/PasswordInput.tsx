import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useState } from 'react';
import {
  Pressable,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../src/hooks/useTheme';

interface PasswordInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export const PasswordInput = forwardRef<TextInput, PasswordInputProps>(
  ({ label, error, containerStyle, style, value, ...props }, ref) => {
    const { colors } = useTheme();
    const [showPassword, setShowPassword] = useState(false);

    const hasValue = value !== undefined && value !== null && String(value).length > 0;

    return (
      <View style={[{ marginBottom: 16 }, containerStyle]}>
        {label ? (
          <Text
            style={{
              marginBottom: 6,
              textAlign: 'right',
              fontSize: 14,
              fontFamily: 'Cairo-SemiBold',
              color: colors.textPrimary,
            }}
          >
            {label}
          </Text>
        ) : null}

        <View
          style={{
            position: 'relative',
            borderRadius: 12,
            borderWidth: 1,
            backgroundColor: colors.surfaceAlt,
            borderColor: error ? colors.error : colors.border,
          }}
        >
          <TextInput
            ref={ref}
            value={value}
            secureTextEntry={!showPassword}
            textAlign="left"
            style={[
              {
                width: '100%',
                color: colors.textPrimary,
                fontFamily: 'Cairo-Regular',
                writingDirection: 'ltr',
                paddingLeft: 16,
                paddingRight: 44,
                paddingVertical: 12,
                fontSize: 14,
              },
              style,
            ]}
            {...props}
          />
          <Pressable
            onPress={() => setShowPassword((v) => !v)}
            hitSlop={8}
            style={{
              position: 'absolute',
              bottom: 0,
              right: 12,
              top: 0,
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={colors.textSecondary}
            />
          </Pressable>
        </View>

        {error ? (
          <Text
            style={{
              marginTop: 4,
              textAlign: 'right',
              fontSize: 12,
              color: colors.error,
              fontFamily: 'Cairo-Regular',
            }}
          >
            {error}
          </Text>
        ) : null}
      </View>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
