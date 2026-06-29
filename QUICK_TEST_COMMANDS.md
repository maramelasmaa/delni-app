# Quick Test Commands — Copy & Paste

## START HERE

```bash
# 1. Start dev server
cd c:\laragon\www\delni-app
npx expo start

# 2. Open device/simulator
# (scan QR or press 'a' for Android, 'i' for iOS)

# 3. Login to app
# (use any account)
```

---

## TEST 1: ADMIN BROADCAST (Foreground) ✅

```bash
# Send notification
curl -X POST https://delni.ly/api/v1/admin/notifications/broadcast \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Broadcast",
    "body": "Does badge update instantly?",
    "data": {"pathname": "/category/design"}
  }'

# On device:
# ✓ See banner at top
# ✓ Badge increments INSTANTLY (should be 1 second, not 30)
# ✓ Pull refresh → notification in list
# ✓ Tap notification → badge decrements INSTANTLY
```

---

## TEST 2: ADMIN BROADCAST (Background) ✅

```bash
# 1. Press home (background app)
# 2. Send notification
curl -X POST https://delni.ly/api/v1/admin/notifications/broadcast \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Background Test",
    "body": "Tap me",
    "data": {"provider_slug": "ali-designer"}
  }'

# 3. On device:
# ✓ Notification in notification shade
# ✓ Tap it
# ✓ App opens to /provider/ali-designer
# ✓ No crash
```

---

## TEST 3: FLAG DECISION (Approve) ✅

```bash
# 1. As User A (in app):
#    → Go to provider
#    → Long-press a review
#    → Tap "Report Review"
#    → Select "تحرش"
#    → Send

# 2. As Admin (backend):
curl -X POST https://delni.ly/api/v1/admin/flag-review/REVIEW_ID/approve \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json"

# (Or use Filament, go to Reviews, click Approve)

# 3. On User A's device:
# ✓ Banner appears
# ✓ Badge increments
# ✓ Auto-navigates to /notifications
# ✓ Green badge "تمت الموافقة"
# ✓ Shows reason
# ✓ Can tap to mark read
```

---

## TEST 4: FLAG DECISION (Reject) ✅

```bash
# Same as Test 3 but:
curl -X POST https://delni.ly/api/v1/admin/flag-review/REVIEW_ID/reject \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "No violation"}'

# On device:
# ✓ Red badge "تم الرفض" (instead of green)
# ✓ Shows rejection reason
```

---

## TEST 5: COLD-START Navigation ✅

```bash
# 1. Force close app (swipe it away on iOS, or use Android app switcher)
# 2. Send notification
curl -X POST https://delni.ly/api/v1/admin/notifications/broadcast \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Cold Start Test",
    "body": "Open from notification",
    "data": {"pathname": "/category/design"}
  }'

# 3. On device:
# ✓ Tap notification on lock screen/notification center
# ✓ App opens and loads
# ✓ Navigates to /category/design
# ✓ No "Attempted to navigate before mounting" error
```

---

## TEST 6: Mark All Read ✅

```bash
# 1. Send 3 broadcasts (use Test 1 command 3 times)
# 2. Badge shows "3"
# 3. On notifications screen:
#    Tap "اقرأ الكل" button

# ✓ Badge goes 3 → 0 INSTANTLY (not 30 seconds)
# ✓ All notifications lose blue border
```

---

## TEST 7: Badge Persistence ✅

```bash
# 1. Send 2 notifications
# 2. Badge shows "2"
# 3. Force close app completely
# 4. Reopen app

# ✓ Badge shows "2"
# ✓ Navigate to notifications → see 2 notifications
```

---

## DEBUGGING COMMANDS

```bash
# Check push token synced
curl -X GET https://delni.ly/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
# Should return user object

# Check unread count
curl -X GET https://delni.ly/api/v1/notifications/unread-count \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
# Should return: {"unread_count": N}

# Check notifications list
curl -X GET https://delni.ly/api/v1/notifications?page=1 \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
# Should return paginated notifications

# Mark notification read
curl -X POST https://delni.ly/api/v1/notifications/NOTIFICATION_ID/read \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
# Should succeed

# Mark all read
curl -X POST https://delni.ly/api/v1/notifications/read-all \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
# Should succeed
```

---

## CONSOLE DEBUGGING (Expo)

```javascript
// Search Expo logs for:
[notifications]

// Should see:
[notifications] Registration succeeded
[notifications] Push token sync succeeded
[notifications] Foreground notification received
[notifications] Backend sync failed  (only if error)

// Check badge value:
// (No direct command, but look at tab bar icon)

// Force refresh:
// Press 'r' in Expo terminal
```

---

## DATABASE QUERIES

```sql
-- Check push token
SELECT * FROM push_tokens 
WHERE user_id = YOUR_USER_ID 
ORDER BY created_at DESC LIMIT 1;

-- Check notifications
SELECT id, type, title, body, read_at, created_at 
FROM notifications 
WHERE user_id = YOUR_USER_ID 
ORDER BY created_at DESC LIMIT 5;

-- Check flag decisions
SELECT * FROM review_reports 
WHERE user_id = YOUR_USER_ID 
ORDER BY created_at DESC LIMIT 1;

-- See admin broadcast reach
SELECT COUNT(*) as device_count FROM push_tokens 
WHERE (deleted_at IS NULL OR deleted_at > NOW());
```

---

## EXPECTED BEHAVIOR CHECKLIST

```
Test 1: Foreground Broadcast
  [ ] Banner appears
  [ ] Badge increments INSTANTLY
  [ ] No notification list update (just banner)

Test 2: Background Broadcast
  [ ] Notification in notification center
  [ ] Tap navigates to route
  [ ] App opens to correct screen

Test 3: Flag Approve
  [ ] Auto-navigates to /notifications
  [ ] Green badge "تمت الموافقة"
  [ ] Reason displayed
  [ ] Can tap to mark read

Test 4: Flag Reject
  [ ] Red badge "تم الرفض"
  [ ] Reason displayed
  [ ] Otherwise same as Test 3

Test 5: Cold-Start
  [ ] App opens from notification
  [ ] Navigates after auth loads
  [ ] No navigation error

Test 6: Mark All
  [ ] Badge 3 → 0 INSTANTLY
  [ ] All notifications lose blue border

Test 7: Persistence
  [ ] Badge survives app close
  [ ] Notifications list matches badge count

Test 8: Device Resume
  [ ] No console errors
  [ ] App ready to receive notifications
  [ ] No duplicate token registrations

All 8 checked = ✅ READY FOR PRODUCTION
```

---

## TROUBLESHOOTING QUICK REFERENCE

| Problem | Check | Fix |
|---------|-------|-----|
| Badge doesn't update for 30s | FIX #1 deployed? | Redeploy src/hooks/useApi.ts |
| Can't tap flag decision | FIX #3 deployed? | Redeploy FlagDecisionNotification.tsx |
| Cold-start crashes | FIX #4 deployed? | Redeploy NotificationBootstrap.tsx |
| Mark all doesn't work | FIX #2 deployed? | Redeploy src/hooks/useApi.ts |
| No notifications arrive | Logged in? | Login first |
| No notifications arrive | Push token synced? | Check DB, restart app |
| Weird badge count | Cache stale? | Pull refresh on notifications |
| App crashes on open | Auth error? | Check console logs |
| Nothing loads | API down? | Check backend status |

---

## YOUR FIRST TEST (Right Now!)

```bash
# Copy-paste this exact flow:

# Step 1: Start dev server (if not running)
cd c:\laragon\www\delni-app
npx expo start

# Step 2: Open device (scan QR or 'a'/'i')
# Step 3: Login in app

# Step 4: Send this notification (modify TOKEN!)
curl -X POST https://delni.ly/api/v1/admin/notifications/broadcast \
  -H "Authorization: Bearer REPLACE_WITH_YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Does it work?",
    "body": "If you see this, notifications work!",
    "data": {}
  }'

# Step 5: On device, keep app in foreground and look for:
# → Notification banner at top
# → Badge on "الإشعارات" tab shows "1"
# → If badge updates INSTANTLY (1-2 seconds), FIX #1 ✅ works

# Step 6: Tap notification in list
# → Badge goes from "1" to "0" INSTANTLY
# → If it's instant, FIX #1 ✅ is working
# → If it waits 30 seconds, FIX #1 ❌ needs redeployment
```

---

**You got this! 🚀**

Start with the "YOUR FIRST TEST" section above. Takes 5 minutes. Report back!
