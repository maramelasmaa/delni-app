import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useState, useEffect } from 'react';
import {
  FlatList,
  Pressable,
  Text,
  View,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../src/hooks/useTheme';
import {
  useNotifications,
  useNotificationUnreadCount,
  useMarkAllNotificationsRead,
} from '../../src/hooks/useApi';
import { useNotificationsStore } from '../../src/store/notifications';
import { NotificationItem } from '../../src/components/notifications/NotificationItem';
import { FlagDecisionNotification } from '../../src/components/notifications/FlagDecisionNotification';
import type { Notification, PaginatedData } from '../../src/types';

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);

  // Fetch notifications and unread count
  const notifications = useNotifications(page);
  const unreadCountQuery = useNotificationUnreadCount();
  const markAllRead = useMarkAllNotificationsRead();

  // Accumulate all notifications across pages
  const allNotifications = useMemo(() => {
    const accumulated: Notification[] = [];
    for (let p = 1; p <= page; p++) {
      const cached = qc.getQueryData<PaginatedData<Notification>>(['notifications', p]);
      if (cached?.data) {
        accumulated.push(...cached.data);
      }
    }
    return accumulated;
  }, [page, qc]);

  // Sync unread count to store
  const setUnreadCount = useNotificationsStore((s) => s.setUnreadCount);
  const storeUnreadCount = useNotificationsStore((s) => s.unreadCount);

  // Update store when query data changes (deferred to after render)
  useEffect(() => {
    if (unreadCountQuery.data !== undefined && unreadCountQuery.data !== storeUnreadCount) {
      setUnreadCount(unreadCountQuery.data);
    }
  }, [unreadCountQuery.data, storeUnreadCount, setUnreadCount]);

  const handleMarkAllRead = useCallback(() => {
    if ((unreadCountQuery.data ?? 0) > 0) {
      markAllRead.mutate();
    }
  }, [unreadCountQuery.data, markAllRead]);

  const handleRefresh = useCallback(() => {
    setPage(1);
    notifications.refetch();
    unreadCountQuery.refetch();
  }, [notifications, unreadCountQuery]);

  const handleLoadMore = useCallback(() => {
    if (
      notifications.data?.pagination &&
      notifications.data.pagination.current_page < notifications.data.pagination.last_page
    ) {
      setPage((p) => p + 1);
    }
  }, [notifications.data?.pagination]);

  const renderNotification = useCallback(
    ({ item }: { item: Notification }) => {
      // Special rendering for flag decisions
      if (item.type === 'review_flag_decision') {
        return <FlagDecisionNotification notification={item} />;
      }

      return <NotificationItem notification={item} />;
    },
    []
  );

  const isLoading = notifications.isLoading && page === 1;
  const unreadCount = unreadCountQuery.data ?? 0;
  const hasUnread = unreadCount > 0;
  const hasMorePages =
    notifications.data &&
    notifications.data.pagination.current_page < notifications.data.pagination.last_page;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.bg }}
      edges={['top', 'left', 'right']}
    >
      {/* Header with Mark All Read Button */}
      <View
        style={{
          flexDirection: 'row-reverse',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
          <Text
            style={{
              fontSize: 18,
              fontFamily: 'Cairo-Bold',
              color: colors.textPrimary,
            }}
          >
            الإشعارات
          </Text>
          {hasUnread && (
            <View
              style={{
                backgroundColor: colors.primary,
                borderRadius: 999,
                minWidth: 24,
                height: 24,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: 'Cairo-Bold',
                  color: colors.textOnPrimary,
                }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>

        {hasUnread && (
          <Pressable
            onPress={handleMarkAllRead}
            disabled={markAllRead.isPending}
            style={{
              opacity: markAllRead.isPending ? 0.6 : 1,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'Cairo-SemiBold',
                color: colors.primary,
              }}
            >
              اقرأ الكل
            </Text>
          </Pressable>
        )}
      </View>

      {/* Notifications List */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : allNotifications.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
          }}
        >
          <Ionicons name="notifications-off-outline" size={48} color={colors.textMuted} />
          <Text
            style={{
              marginTop: 16,
              fontSize: 16,
              fontFamily: 'Cairo-SemiBold',
              color: colors.textPrimary,
              textAlign: 'center',
            }}
          >
            لا توجد إشعارات
          </Text>
          <Text
            style={{
              marginTop: 8,
              fontSize: 13,
              fontFamily: 'Cairo-Regular',
              color: colors.textMuted,
              textAlign: 'center',
            }}
          >
            ستظهر الإشعارات هنا عند وجود تحديثات جديدة
          </Text>
        </View>
      ) : (
        <FlatList
          data={allNotifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            flexGrow: 1,
          }}
          refreshControl={
            <RefreshControl
              refreshing={notifications.isRefetching}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            hasMorePages && notifications.isFetching ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 16 }} />
            ) : null
          }
          scrollEnabled
        />
      )}
    </SafeAreaView>
  );
}
