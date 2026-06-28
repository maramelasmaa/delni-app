import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useNotificationsStore } from '../../store/notifications';

interface Props {
  color: string;
  focused: boolean;
}

const NotificationBadge = memo(function NotificationBadge({ color, focused }: Props) {
  const { colors } = useTheme();
  const unreadCount = useNotificationsStore((s) => s.unreadCount);

  return (
    <View style={{ position: 'relative' }}>
      <Ionicons
        name={focused ? 'notifications' : 'notifications-outline'}
        size={22}
        color={color}
      />
      {unreadCount > 0 && (
        <View
          style={{
            position: 'absolute',
            top: -6,
            right: -6,
            backgroundColor: colors.error,
            borderRadius: 999,
            minWidth: 18,
            height: 18,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: colors.surfaceElevated,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontFamily: 'Cairo-Bold',
              color: '#FFFFFF',
              textAlign: 'center',
              lineHeight: 10,
              includeFontPadding: false,
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </View>
      )}
    </View>
  );
});

export { NotificationBadge };
