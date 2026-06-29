# Notification Flow Diagram — Complete System Map

## SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DELNI NOTIFICATION SYSTEM                         │
└─────────────────────────────────────────────────────────────────────────┘

┌────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  BACKEND       │         │  EXPO PUSH       │         │  MOBILE APP     │
│  (Laravel)     │ ═════►  │  SERVICE         │ ═════►  │  (React Native) │
│                │         │                  │         │                 │
│ • DB: notifs   │         │ • Route to       │         │ • Receive push  │
│ • Admin panel  │         │   devices via    │         │ • Store state   │
│ • Flag review  │         │   tokens         │         │ • Fetch from DB │
│ • Broadcast    │         │                  │         │ • Display UI    │
└────────────────┘         └──────────────────┘         └─────────────────┘
       │                           │                            │
       │                           │                            │
       ▼                           ▼                            ▼
POST /auth/push-tokens      Notification arrives          NotificationBootstrap
POST /notifications/...     (3 states)                     (initializes on app open)
POST /admin/notif/...            │
                                  ├─ FOREGROUND ──────►  addNotificationReceivedListener()
                                  │                       ↓
                                  │                    incrementUnread()
                                  │                    refetch count
                                  │                    badge updates
                                  │
                                  ├─ BACKGROUND ──────►  User taps notification
                                  │                       ↓
                                  │                    addNotificationResponseReceivedListener()
                                  │                    resolveNotificationRoute()
                                  │                    router.push(route)
                                  │
                                  └─ COLD-START ──────►  App launches from notification
                                                         ↓
                                                    getLastNotificationResponseAsync()
                                                    resolveNotificationRoute()
                                                    Wait for auth first (FIX #4)
                                                    router.push(route)
```

---

## NOTIFICATION FLOW: ADMIN BROADCAST

```
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 1: BACKEND SENDS BROADCAST                                          │
└─────────────────────────────────────────────────────────────────────────┘

Admin Panel (Filament)
    │
    ├─► Submit Form: "Send to all users"
    │
    └─► POST /api/v1/admin/notifications/broadcast
        {
          "title": "تحديث تطبيق",
          "body": "توفر نسخة جديدة",
          "data": {
            "pathname": "/category/design"
          }
        }
            │
            ▼
        Laravel Controller
            │
            ├─► INSERT into notifications table (DB record for history)
            │
            └─► Queue Expo Job (broadcast to all devices)
                    │
                    ▼
                Expo Delivery Service
                    │
                    └─► For each device with push_token:
                        Send to Expo Gateway with token

┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 2: NOTIFICATION ARRIVES ON DEVICE                                   │
└─────────────────────────────────────────────────────────────────────────┘

                    Expo Gateway
                        │
                        ├─► Validate token
                        │
                        ├─► Route to FCM (Android) or APNs (iOS)
                        │
                        ▼
                    Device OS
                        │
                        ├─► Check app state:
                        │
                        ├─ IF APP FOREGROUND:
                        │     │
                        │     ├─► NotificationBootstrap.tsx:77
                        │     │   addNotificationReceivedListener fires
                        │     │
                        │     ├─► incrementUnread()
                        │     │   Badge: 0 ──► 1 ✓
                        │     │
                        │     ├─► unreadCountQuery.refetch()
                        │     │   Sync backend count
                        │     │
                        │     └─► User sees banner at top
                        │         No navigation yet
                        │
                        ├─ IF APP BACKGROUND/SUSPENDED:
                        │     │
                        │     └─► OS queues notification
                        │         User taps notification
                        │         │
                        │         ▼
                        │         App resumes
                        │         NotificationBootstrap.tsx:45
                        │         addNotificationResponseReceivedListener fires
                        │         │
                        │         ├─► resolveNotificationRoute(data)
                        │         │   pathname="/category/design" → return route
                        │         │
                        │         ├─► router.push("/category/design")
                        │         │
                        │         └─► unreadCountQuery.refetch()
                        │
                        └─ IF APP NOT RUNNING (COLD-START):
                              │
                              └─► User taps notification from lock screen
                                  │
                                  ▼
                                  App launches
                                  NotificationBootstrap.tsx:59-74
                                  getLastNotificationResponseAsync fires
                                  │
                                  ├─► Wait for user auth (FIX #4)
                                  │   if (!user) return  ← GUARD
                                  │
                                  ├─► resolveNotificationRoute()
                                  │   pathname="/category/design"
                                  │
                                  ├─► router.push("/category/design")
                                  │   Use requestAnimationFrame() to avoid race
                                  │
                                  └─► Category screen opens
                                      Badge shows unread count

┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 3: NOTIFICATION FETCHED FROM DB & MARKED READ                       │
└─────────────────────────────────────────────────────────────────────────┘

                    NotificationsScreen
                        │
                        ├─► GET /api/v1/notifications?page=1
                        │   Fetches list including broadcast notification
                        │
                        ├─► Renders in list (not special type, uses NotificationItem)
                        │
                        └─► User taps notification
                            │
                            ▼
                            NotificationItem.tsx:23-24
                            markRead.mutate(notification.id)
                            │
                            ├─► POST /api/v1/notifications/{id}/read
                            │
                            ├─► onSuccess fires:
                            │   decrementUnread()  ← FIX #1
                            │   Badge: 1 ──► 0 ✓ (INSTANT!)
                            │
                            └─► Invalidate queries
                                List updates
                                notification.read_at set
                                Visual indicator gone (no left border)
```

---

## NOTIFICATION FLOW: REVIEW FLAG DECISION

```
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 1: USER SUBMITS FLAG                                                │
└─────────────────────────────────────────────────────────────────────────┘

NotificationsScreen / ProviderCard
    │
    ├─► User taps "Report Review"
    │
    ├─► ReviewFlagModal.tsx
    │   Select reason, confirm
    │
    ├─► useFlagReview().mutate({reviewId, reason})
    │
    └─► POST /api/v1/reviews/{id}/flag
        {
          "reason": "تحرش"
        }
            │
            ▼
        Laravel ReportReviewController
            │
            ├─► Validate request
            │
            ├─► INSERT into review_reports table
            │
            └─► Send to admin queue

┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 2: ADMIN REVIEWS & DECIDES                                          │
└─────────────────────────────────────────────────────────────────────────┘

Filament Admin Panel
    │
    ├─► Go to Reviews section
    │
    ├─► Click on flagged review
    │
    ├─► Select: "Approve" or "Reject"
    │
    └─► Action fires ReviewFlagController
            │
            ├─► if (approved):
            │     Update review status
            │     Send BOTH:
            │       1. Database Notification
            │       2. Expo Push Notification
            │
            └─► Notification payload:
                {
                  type: "review_flag_decision",
                  title: "تقرير إساءة الاستخدام",
                  body: "تمت الموافقة على بلاغك",
                  decision: "approved",
                  reason: "تحرش مؤكد",
                  flagged_reason: "تحرش",
                  review_id: 123,
                  profile_id: 456,
                  profile_slug: "ali-designer",
                  pathname: "/notifications",  ← FORCES ROUTE
                  data: { ... }
                }

┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 3: PUSH ARRIVES & APP RESPONDS                                      │
└─────────────────────────────────────────────────────────────────────────┘

                    Expo Push arrives
                        │
                        ├─► type="review_flag_decision" ✓ Special type!
                        │
                        └─► [SAME as Broadcast: Foreground/Background/Cold-Start]
                            │
                            ├─► Foreground:
                            │     incrementUnread()
                            │     Badge: 0 ──► 1
                            │
                            ├─► Background/Resume:
                            │     addNotificationResponseReceivedListener()
                            │     resolveNotificationRoute()
                            │       → pathname="/notifications"
                            │       → Return route = "/(tabs)/notifications"
                            │     router.push("/(tabs)/notifications")
                            │
                            ├─► Cold-Start:
                            │     getLastNotificationResponseAsync()
                            │     Wait for auth
                            │     router.push("/(tabs)/notifications")
                            │
                            └─► User navigates to /notifications
                                Badge shows "1"

┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 4: DISPLAY IN NOTIFICATIONS SCREEN                                  │
└─────────────────────────────────────────────────────────────────────────┘

                NotificationsScreen
                        │
                        ├─► GET /api/v1/notifications?page=1
                        │   Fetches all notifications
                        │
                        ├─► For each notification:
                        │   renderNotification() checks:
                        │   │
                        │   if (item.type === 'review_flag_decision')
                        │     ├─► <FlagDecisionNotification /> ✓ SPECIAL UI
                        │     │   Shows:
                        │     │   - Title
                        │     │   - Body
                        │     │   - Status badge: "تمت الموافقة" (green)
                        │     │   - Reason: "تحرش مؤكد"
                        │     │   - Flagged reason: "تحرش"
                        │     │   - Left blue border (unread indicator)
                        │     │
                        │     └─► User taps notification ← FIX #3
                        │         │
                        │         ├─► handlePress() fires
                        │         │
                        │         ├─► if (!isRead)
                        │         │   markRead.mutate(notification.id)
                        │         │   │
                        │         │   └─► onSuccess:
                        │         │       decrementUnread()  ← FIX #1
                        │         │       Badge: 1 ──► 0 ✓
                        │         │       Border disappears
                        │         │
                        │         ├─► if (profile_slug)
                        │         │   router.push("/provider/ali-designer")
                        │         │   Optionally navigate to provider
                        │         │
                        │         └─► Notification marked read in DB
                        │
                        else
                          └─► <NotificationItem /> (generic rendering)
                              Same tap to mark read behavior

┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 5: BADGE UPDATES (WITH FIXES)                                       │
└─────────────────────────────────────────────────────────────────────────┘

                    Badge Updates
                        │
                        ├─► Increment (foreground receive):
                        │   NotificationBootstrap.tsx:79
                        │   incrementUnread() ✓ INSTANT
                        │
                        ├─► Decrement (mark single read):
                        │   useMarkNotificationRead().onSuccess:
                        │   decrementUnread() ✓ INSTANT (FIX #1)
                        │   Badge: 1 ──► 0 immediately
                        │   (Before: waited 30s for refetch)
                        │
                        ├─► Reset (mark all read):
                        │   useMarkAllNotificationsRead().onSuccess:
                        │   resetUnread() ✓ INSTANT (FIX #2)
                        │   Badge: 3 ──► 0 immediately
                        │   (Before: waited 30s)
                        │
                        └─► Badge visible on NotificationBadge component
                            Updates via Zustand store subscription
                            No network delay needed

┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 6: TOKEN REFRESH ON APP RESUME (FIX #5)                             │
└─────────────────────────────────────────────────────────────────────────┘

                    App Lifecycle
                        │
                        ├─► User brings app to foreground
                        │
                        ├─► AppState changes to 'active' ← FIX #5
                        │   NotificationBootstrap.tsx:new useEffect
                        │
                        ├─► registerForPushNotificationsAsync()
                        │   Request permissions (already granted, instant)
                        │   Get fresh Expo token
                        │
                        ├─► syncPushTokenToBackend()
                        │   POST /api/v1/auth/push-tokens
                        │   With fingerprint dedup:
                        │     Same user + same token = skip
                        │     Same user + new token = sync
                        │
                        └─► Token stays fresh
                            Even after weeks of usage
                            (Before: only synced at login)
```

---

## ROUTING DECISION TREE

```
                Notification Received
                        │
                        ▼
                resolveNotificationRoute()
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
    url?            pathname?       provider_slug?
     │                 │                 │
   YES              YES              YES
  uri→path         path→path        slug→/provider/slug
     │                 │                 │
     └────┬────────────┴─────────────────┘
          │
          ▼
        Return route (string)
          │
          ├─ /notifications
          ├─ /category/design
          ├─ /provider/ali
          ├─ /subcategory/ui-design
          └─ /some/custom/path
                  │
                  ▼
          router.push(route)
                  │
                  ├─ App foreground? → Navigate immediately
                  ├─ App background? → Resume + navigate
                  └─ App cold-start? → Open + wait for auth (FIX #4) + navigate
```

---

## CRITICAL FIXES AT A GLANCE

```
╔════════════════════════════════════════════════════════════════════════╗
║                          FIXES IMPLEMENTED                             ║
╚════════════════════════════════════════════════════════════════════════╝

FIX #1: Badge Decrement on Mark Read
  File: src/hooks/useApi.ts:useMarkNotificationRead()
  Change: Added decrementUnread() to onSuccess
  Impact: Badge updates INSTANTLY (was 30s delay)
  Status: ✅ DONE

FIX #2: Badge Reset on Mark All Read
  File: src/hooks/useApi.ts:useMarkAllNotificationsRead()
  Change: Added resetUnread() to onSuccess
  Impact: "Mark All" badge clears INSTANTLY (was 30s delay)
  Status: ✅ DONE

FIX #3: Flag Decision Tappable
  File: src/components/notifications/FlagDecisionNotification.tsx
  Change: Wrapped in Pressable, added handlePress()
  Impact: Can now tap to mark read + navigate to provider
  Status: ✅ DONE

FIX #4: Cold-Start Auth Race
  File: src/components/notifications/NotificationBootstrap.tsx
  Change: Guard cold-start navigation behind user check
  Impact: Safe navigation even when app opens from notification
  Status: ✅ DONE

FIX #5: Token Refresh on Resume
  File: src/components/notifications/NotificationBootstrap.tsx
  Change: Added AppState listener, refresh token on 'active'
  Impact: Tokens stay fresh over app lifetime (was only at login)
  Status: ✅ DONE

╔════════════════════════════════════════════════════════════════════════╗
║                    KNOWN REMAINING ISSUES                              ║
╚════════════════════════════════════════════════════════════════════════╝

ISSUE: No Toast on Detail Screen
  When user is on provider detail screen and notification arrives
  User doesn't see any indication (no banner)
  Only visible: badge increments on tab bar
  Fix: Requires Toast UI component (separate feature)

ISSUE: Permission Re-request Unavailable
  If user denies notifications, no settings UI to re-enable
  Fix: Requires settings screen with re-request button

ISSUE: Type System Not Extensible
  Only review_flag_decision has special rendering
  New notification types need code changes
  Fix: Plugin system for notification types (future enhancement)

╔════════════════════════════════════════════════════════════════════════╗
║                    PRODUCTION READINESS                                ║
╚════════════════════════════════════════════════════════════════════════╝

✅ No database migrations needed
✅ No backend API changes required
✅ No new npm dependencies added
✅ All changes client-side only
✅ Backward compatible with existing notifications
✅ Safe to deploy immediately
✅ No breaking changes

READY FOR DEPLOYMENT
```

---

## DEBUGGING COMMANDS

```bash
# Check logs in Expo console
__DEV__ && console.log('[notifications] ...')

# Trigger foreground test (in Expo console)
ExpoNotifications.presentNotificationAsync({
  title: 'Test',
  body: 'Foreground test'
})

# Check badge state (in Expo console)
useNotificationsStore.getState().unreadCount

# Verify token stored
AsyncStorage.getItem('delni_push_token_sync')

# Verify mutations firing
// Open React DevTools in browser
// Go to Queries → see notifications queries
// Go to Mutations → see markRead firing
```

---

**Complete notification system mapped and fixed!**
