import { useCallback, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';

export interface RTLAlertButton {
  text: string;
  style?: 'cancel' | 'destructive' | 'default';
  onPress?: () => void;
}

export interface RTLAlertState {
  visible: boolean;
  title: string;
  message: string;
  buttons: RTLAlertButton[];
}

const INITIAL_STATE: RTLAlertState = { visible: false, title: '', message: '', buttons: [] };

/**
 * Shared themed RTL alert — the single source of truth for the app's confirm/info
 * dialogs. Adopts the richest of the previously copy-pasted variants (the account
 * screen's: contextual icon by title keyword, press feedback, cancel-first ordering,
 * destructive emphasis), so every screen gets the same polished dialog.
 *
 * Usage:
 *   const { alert, showAlert, hideAlert } = useRTLAlert();
 *   showAlert('عنوان', 'رسالة', [{ text: 'حسناً', style: 'default' }]);
 *   <RTLAlert alert={alert} onDismiss={hideAlert} />
 */
export function useRTLAlert() {
  const [alert, setAlert] = useState<RTLAlertState>(INITIAL_STATE);

  const showAlert = useCallback((title: string, message: string, buttons: RTLAlertButton[] = []) => {
    setAlert({ visible: true, title, message, buttons });
  }, []);

  const hideAlert = useCallback(() => {
    setAlert((prev) => ({ ...prev, visible: false }));
  }, []);

  return { alert, showAlert, hideAlert };
}

export function RTLAlert({ alert, onDismiss }: { alert: RTLAlertState; onDismiss: () => void }) {
  const { colors, isDark } = useTheme();
  // Alert option buttons: WHITE fill in dark mode, NAVY fill in light mode, with the
  // inverse text color. Both pairings are ~8.6:1 (WCAG AA needs 4.5:1). Avoids the
  // low-contrast combos (white on dark-mode's bright blue ≈2:1; navy on navy ≈1:1).
  const navyText = '#1E3A8A';
  const optionFill = isDark ? '#1E40AF' : '#F8FAFC';
  const optionTextColor = isDark ? '#FFFFFF' : navyText;
  const optionBorderColor = isDark ? colors.borderStrong : '#BFDBFE';
  const alertTitleColor = isDark ? '#FFFFFF' : navyText;
  const alertMessageColor = isDark ? '#FFFFFF' : '#1E40AF';

  return (
    <Modal visible={alert.visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
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
          {(() => {
            const t = alert.title || '';
            let iconName: keyof typeof Ionicons.glyphMap = 'information-circle-outline';
            let iconColor = colors.primary;
            let iconBg = colors.primarySoft;

            if (t.includes('حذف')) {
              iconName = 'trash-outline';
              iconColor = colors.error;
              iconBg = colors.errorSoft;
            } else if (t.includes('تسجيل الدخول')) {
              iconName = 'lock-closed-outline';
              iconColor = colors.primary;
              iconBg = colors.primarySoft;
            } else if (t.includes('تعذّر') || t.includes('تعذر') || t.includes('مسبقاً') || t.includes('خطأ') || t.includes('تنبيه')) {
              iconName = 'alert-circle-outline';
              iconColor = colors.gold;
              iconBg = colors.goldSoft;
            } else if (t.includes('تم') || t.includes('نجاح')) {
              iconName = 'checkmark-circle-outline';
              iconColor = colors.success;
              iconBg = colors.successSoft;
            }

            return (
              <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                <Ionicons name={iconName} size={36} color={iconColor} />
              </View>
            );
          })()}

          <Text style={{ fontSize: 20, fontFamily: 'Cairo-Black', color: alertTitleColor, textAlign: 'center', marginBottom: 14, lineHeight: 28 }}>
            {alert.title}
          </Text>

          <Text style={{ fontSize: 15, fontFamily: 'Cairo-Regular', color: alertMessageColor, textAlign: 'center', lineHeight: 24, marginBottom: 32, writingDirection: 'rtl' }}>
            {alert.message}
          </Text>

          <View style={{ width: '100%', flexDirection: 'row', gap: 12, justifyContent: 'space-between' }}>
            {(() => {
              const actionButtons = alert.buttons || [];

              if (actionButtons.length === 0) {
                return (
                  <Pressable
                    onPress={onDismiss}
                    style={({ pressed }) => ({
                      flex: 1,
                      height: 52,
                      borderRadius: 18,
                      backgroundColor: optionFill,
                      borderWidth: 1,
                      borderColor: optionBorderColor,
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: pressed ? 0.85 : 1,
                      transform: [{ scale: pressed ? 0.97 : 1 }],
                    })}
                  >
                    <Text style={{ fontSize: 15, fontFamily: 'Cairo-Bold', color: optionTextColor }}>حسناً</Text>
                  </Pressable>
                );
              }

              // Cancel first (left), then destructive/primary (right).
              const sortedButtons = [...actionButtons].sort((a, b) => {
                if (a.style === 'cancel' && b.style !== 'cancel') return -1;
                if (a.style !== 'cancel' && b.style === 'cancel') return 1;
                return 0;
              });

              return sortedButtons.map((btn, idx) => {
                const isCancel = btn.style === 'cancel';
                const isDestructive = btn.style === 'destructive';
                const fill = optionFill;

                return (
                  <Pressable
                    key={idx}
                    onPress={() => {
                      onDismiss();
                      btn.onPress?.();
                    }}
                    style={({ pressed }) => ({
                      flex: isDestructive ? 1.5 : 1,
                      height: 52,
                      borderRadius: 18,
                      backgroundColor: fill,
                      borderWidth: 1.5,
                      borderColor: optionBorderColor,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 12,
                      opacity: pressed ? 0.85 : 1,
                      transform: [{ scale: pressed ? 0.97 : 1 }],
                    })}
                  >
                    <Text
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      style={{
                        fontSize: 14,
                        fontFamily: 'Cairo-Bold',
                        color: optionTextColor,
                        textAlign: 'center',
                        writingDirection: 'rtl',
                      }}
                    >
                      {btn.text}
                    </Text>
                  </Pressable>
                );
              });
            })()}
          </View>
        </View>
      </View>
    </Modal>
  );
}
