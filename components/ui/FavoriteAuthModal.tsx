import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, Text, View } from 'react-native';
import type { ThemeColors } from '../../src/theme/tokens';

interface FavoriteAuthModalProps {
  visible: boolean;
  colors: ThemeColors;
  onConfirm: () => void;
  onDismiss: () => void;
}

export function FavoriteAuthModal({
  visible,
  colors,
  onConfirm,
  onDismiss,
}: FavoriteAuthModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}
      >
        <View
          style={{
            width: '90%',
            maxWidth: 380,
            backgroundColor: colors.surface,
            borderRadius: 32,
            paddingTop: 36,
            paddingHorizontal: 28,
            paddingBottom: 28,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0,
            shadowRadius: 24,
            elevation: 0,
          }}
        >
          {/* Icon */}
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: 'rgba(225, 173, 1, 0.15)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
            }}
          >
            <Ionicons name="heart-outline" size={36} color={colors.gold} />
          </View>

          {/* Title */}
          <Text
            style={{
              fontSize: 20,
              fontFamily: 'Cairo-Black',
              color: colors.textPrimary,
              textAlign: 'center',
              marginBottom: 14,
              lineHeight: 28,
            }}
          >
            إضافة إلى المفضلة
          </Text>

          {/* Message */}
          <Text
            style={{
              fontSize: 15,
              fontFamily: 'Cairo-Regular',
              color: colors.textSecondary,
              textAlign: 'center',
              lineHeight: 24,
              marginBottom: 32,
              writingDirection: 'rtl',
            }}
          >
            يرجى تسجيل الدخول لإضافة المفضلة ومتابعة خدماتك المفضلة.
          </Text>

          {/* Buttons */}
          <View style={{ width: '100%', flexDirection: 'row', gap: 12, justifyContent: 'space-between' }}>
            {/* Cancel Button - Left Side */}
            <Pressable
              onPress={onDismiss}
              style={({ pressed }) => ({
                flex: 1,
                height: 52,
                borderRadius: 18,
                backgroundColor: colors.surfaceAlt,
                borderWidth: 1.5,
                borderColor: colors.borderStrong,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              })}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: 'Cairo-Bold',
                  color: colors.textPrimary,
                }}
              >
                إلغاء
              </Text>
            </Pressable>

            {/* Login Button - Right Side */}
            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => ({
                flex: 1.5,
                height: 52,
                borderRadius: 18,
                backgroundColor: colors.gold,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              })}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: 'Cairo-Bold',
                  color: colors.textOnPrimary,
                }}
              >
                تسجيل الدخول
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
