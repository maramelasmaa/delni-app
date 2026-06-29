# Notification Testing Quick Start

## 5-Minute Verification

```bash
# Verify TypeScript compilation
npx tsc --noEmit

# Check critical fixes are in place
grep -n "decrementUnread()" src/hooks/useApi.ts  # Should have 2 matches
grep -n "resetUnread()" src/hooks/useApi.ts      # Should have 1 match
grep -n "useMarkNotificationRead" src/components/notifications/FlagDecisionNotification.tsx  # Should exist
```

## On-Device Testing (10 minutes per test)

### Test Scenario 1: Admin Broadcast → Badge Updates Instantly
```
Setup:
  1. Login to app
  2. Keep app in foreground
  3. Open notifications screen
  4. Note badge count

Action:
  1. Send POST /api/v1/admin/notifications/broadcast with:
     {
       "title": "Test 1",
       "body": "Admin broadcast",
       "data": {}
     }

Expected Results:
  ✓ OS notification banner appears (iOS top, Android notification shade)
  ✓ Badge increments instantly
  ✓ NO delay (used to be ~30s)

Verify with:
  - Badge visible on "الإشعارات" tab
  - Pull refresh notifications screen → new notification visible
```

### Test Scenario 2: Flag Decision Notification → Can Be Tapped
```
Setup:
  1. Login as User A
  2. Submit a review flag on any provider review
  3. Login as Admin in Filament
  4. Find the flagged review
  5. Click "Approve" flag decision

Action:
  1. Switch back to User A's app (foreground)

Expected Results:
  ✓ App navigates to /notifications screen automatically
  ✓ Badge increments
  ✓ New notification visible with:
    - Title: "تقرير إساءة الاستخدام"
    - Green "تمت الموافقة" badge
    - Reason displayed
    - Flagged reason displayed
  ✓ Can TAP notification to:
    - Mark as read (border disappears, badge decrements)
    - Navigate to provider profile

Verify:
  - Tap notification
  - Badge should INSTANTLY go from "1" to "0" (used to wait 30s)
  - Notification row background changes (unread indicator gone)
```

### Test Scenario 3: Cold-Start Safe Navigation
```
Setup:
  1. Logged out
  2. Force close app
  3. Have unread notifications on backend

Action:
  1. Send notification via API
  2. Tap notification on lock screen while app not running
  3. App opens

Expected Results:
  ✓ App doesn't crash
  ✓ App waits for auth to complete (doesn't navigate before user loads)
  ✓ Once authenticated, navigates to correct route
  ✓ Unread badge shows correct count

Verify:
  - No "Attempted to navigate before mounting" errors
  - Navigation succeeds after brief auth delay
```

### Test Scenario 4: Token Refresh on Resume
```
Setup:
  1. Login to app
  2. Verify token synced (check backend push_tokens table)

Action:
  1. Background app (home button)
  2. Wait 5 seconds
  3. Bring app to foreground

Expected Results:
  ✓ No new registration (fingerprint dedup prevents double-sync)
  ✓ Token validated/refreshed with backend
  ✓ Device ready to receive notifications again
  ✓ No console errors

Verify:
  - Check backend logs for token sync
  - Should show "already synced" or "same fingerprint"
  - Not "new registration"
```

## Backend API Calls for Testing

### Admin Broadcast Notification
```bash
curl -X POST https://delni.ly/api/v1/admin/notifications/broadcast \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "تحديث تطبيق",
    "body": "يوجد تحديث جديد متاح",
    "data": {
      "provider_slug": "provider-123"
    }
  }'
```

### Check Unread Count
```bash
curl -X GET https://delni.ly/api/v1/notifications/unread-count \
  -H "Authorization: Bearer USER_TOKEN"
```

### Fetch Notifications List
```bash
curl -X GET https://delni.ly/api/v1/notifications?page=1 \
  -H "Authorization: Bearer USER_TOKEN"
```

### Mark Notification as Read
```bash
curl -X POST https://delni.ly/api/v1/notifications/{notification_id}/read \
  -H "Authorization: Bearer USER_TOKEN"
```

### Mark All as Read
```bash
curl -X POST https://delni.ly/api/v1/notifications/read-all \
  -H "Authorization: Bearer USER_TOKEN"
```

## Console Debugging

Enable console logging to see notification flow:

```javascript
// In Expo Go console, search for:
[notifications]  // All notification logs

// Should see:
[notifications] Push token sync succeeded
[notifications] Registration failed (only if permission denied)
[notifications] Backend sync failed (only on network error)
[notifications] Token refresh on app resume failed (only if error)
```

## Breakpoint Checklist

If notifications don't work, check these in order:

1. **Permission Granted?**
   ```
   Test: registerForPushNotificationsAsync should return permissionGranted: true
   Check: Device Settings → App → Notifications → Allowed
   ```

2. **Token Registered?**
   ```
   Test: Backend should have entry in push_tokens table
   Check: DB query → SELECT * FROM push_tokens WHERE device_id = current_device
   ```

3. **Push Sent?**
   ```
   Test: Check Expo Push Service logs
   Check: Notification delivery status in Expo dashboard
   ```

4. **Notification Received?**
   ```
   Test: Console should log from Notifications.addNotificationReceivedListener
   Check: LogBox for [notifications] errors
   ```

5. **List Fetched?**
   ```
   Test: GET /notifications should return notification record
   Check: Network tab in Expo DevTools
   ```

## Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Badge doesn't decrement | Old code without fix | Redeploy latest |
| Can't tap flag decision | Old code without fix | Redeploy latest |
| Badge doesn't update for 30s | Normal behavior before fix | Redeploy |
| App crashes on cold-start tap | Auth race condition | Already fixed in code |
| No push notifications arrive | Token not synced | Check backend push_tokens table |
| Permission denied silently | User denied on install | Go to Settings → enable manually |
| Badge shows wrong count | Unread count query stale | Pull refresh on notifications screen |

## Manual Cache Clear

If state seems stuck, clear React Query cache:

```javascript
// In Expo console:
AsyncStorage.removeItem('@react-query')
AsyncStorage.removeItem('delni_push_token_sync')
// Then restart app
```

---

**All fixes deployed and ready for testing!**
