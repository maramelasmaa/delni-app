# Testing Notifications — Step-by-Step Practical Guide

## PREREQUISITES (10 min setup)

### 1. Start Expo Dev Server
```bash
cd c:\laragon\www\delni-app
npx expo start

# You should see:
# ▶ Choose an option: press 'a' for Android, 'i' for iOS, 'w' for web, 'c' to clear, or 'q' to quit.
```

### 2. Open App on Device
**Option A: Expo Go App (Easiest)**
- Android: Open Expo Go app → Scan QR code
- iOS: Open Expo Go app → Scan QR code
- Or manually enter: `192.168.31.24` in Expo Go

**Option B: iOS Simulator**
```bash
# In same terminal, press 'i'
# Simulator opens automatically
```

**Option C: Android Emulator**
```bash
# In same terminal, press 'a'
# Emulator opens automatically
```

### 3. Login to App
- Email: any registered user account
- Password: your password

**Note**: You MUST be logged in for notifications to work (push token only syncs after login)

### 4. Get Your Device's Push Token
```bash
# In Expo DevTools (browser), go to Logs
# Search for: [notifications]
# Should see: "Push token sync succeeded"
# Or manually check database:

SELECT * FROM push_tokens 
WHERE user_id = YOUR_USER_ID 
ORDER BY created_at DESC LIMIT 1;
```

---

## TEST 1: ADMIN BROADCAST — FOREGROUND (5 min)

**Goal**: Send notification while app is open → badge increments instantly

### Setup
1. App open in foreground
2. Navigate to Notifications screen (Notifications tab)
3. Note current badge number (e.g., "0")

### Send Notification
```bash
# Via curl (replace YOUR_ADMIN_TOKEN)
curl -X POST https://delni.ly/api/v1/admin/notifications/broadcast \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test 1: Foreground",
    "body": "This is a test broadcast",
    "data": {
      "pathname": "/category/design"
    }
  }'

# Via Laravel Tinker (if you have backend access)
# Go to: http://localhost:8000/tinker
# Run:
Notification::send(auth()->user(), new BroadcastNotification([
  'title' => 'Test 1',
  'body' => 'Foreground test',
  'data' => ['pathname' => '/category/design']
]));
```

### What You Should See (INSTANTLY)
- ✅ Notification banner appears at top of screen
- ✅ Badge increments (0 → 1) **immediately** (THIS IS FIX #1)
- ✅ Notification tab shows badge "1"
- ✅ Pull refresh → notification appears in list

### If Badge Takes 30+ Seconds
❌ **FIX #1 NOT WORKING** — Redeploy latest code

### Verify in List
```
1. Pull refresh on notifications screen
2. New notification appears with:
   - Title: "Test 1: Foreground"
   - Body: "This is a test broadcast"
   - Blue left border (unread indicator)
3. Tap notification
4. Badge decrements to 0 **immediately** (THIS IS FIX #1)
```

---

## TEST 2: ADMIN BROADCAST — BACKGROUND (10 min)

**Goal**: Send notification while app in background → tap navigates

### Setup
1. App open, logged in
2. Press home button (background app, keep it suspended)
3. **DO NOT close app completely**

### Send Notification (with route data)
```bash
curl -X POST https://delni.ly/api/v1/admin/notifications/broadcast \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test 2: Background",
    "body": "Tap this notification",
    "data": {
      "provider_slug": "ali-designer"
    }
  }'
```

### What You Should See
- ✅ **iOS**: Notification appears in notification center (pull down from top)
- ✅ **Android**: Notification appears in notification shade (pull down from top)
- ✅ Badge should show "1" when you see it

### Tap Notification
- ✅ App comes to foreground
- ✅ **Navigates to provider detail: `/provider/ali-designer`**
- ✅ Badge incremented
- ✅ No crash

### Alternative: Route to Notifications Screen
```bash
# Send with pathname="/notifications" instead
curl -X POST https://delni.ly/api/v1/admin/notifications/broadcast \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test 2b: Broadcast",
    "body": "Open notifications screen",
    "data": {
      "pathname": "/notifications"
    }
  }'
```

Then tap notification:
- ✅ Routes to notifications tab instead
- ✅ Notification visible in list
- ✅ No blink/delay

---

## TEST 3: REVIEW FLAG DECISION — APPROVE (15 min)

**Goal**: User flags review → Admin approves → User gets special notification

### Step 1: Submit Review Flag (As User A)
1. Open app as User A (logged in)
2. Go to any provider detail
3. Scroll to reviews section
4. Long-press any review → tap "Report Review"
5. Select reason: "تحرش" (Harassment)
6. Tap "Send"

**Verify**: Flag submitted (check DB)
```sql
SELECT * FROM review_reports 
WHERE review_id = THAT_REVIEW_ID 
ORDER BY created_at DESC LIMIT 1;
-- Should see: status = 'pending' or similar
```

### Step 2: Admin Approves Flag (As Admin)
1. Login to Filament (or use API)
2. Go to Reviews section
3. Find the flagged review
4. Click "Approve" (or use API)

```bash
# Via API (if available)
curl -X POST https://delni.ly/api/v1/admin/flag-review/REVIEW_ID/approve \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

### Step 3: User A Receives Notification
**On User A's device (keep in foreground)**:
- ✅ Notification banner appears
- ✅ Badge increments to "1"
- ✅ **App AUTOMATICALLY navigates to /notifications screen**
- ✅ New notification visible with:
  - Title: "تقرير إساءة الاستخدام"
  - Body: "تمت الموافقة على بلاغك"
  - **Green badge: "تمت الموافقة"**
  - Reason: (the reason you selected)
  - Flagged reason: "تحرش"

### Step 4: Tap Flag Decision Notification (THIS IS FIX #3)
- ✅ Notification marked as read
- ✅ Blue left border disappears
- ✅ Badge decrements to "0" **immediately** (THIS IS FIX #1)
- ✅ Optionally navigates to provider (tap)

---

## TEST 4: REVIEW FLAG DECISION — REJECT (10 min)

Same as Test 3, but:

```bash
# Admin rejects instead of approves
curl -X POST https://delni.ly/api/v1/admin/flag-review/REVIEW_ID/reject \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "لا توجد إساءة استخدام"}'
```

**User A's notification changes**:
- Badge: **Red "تم الرفض"** (instead of green)
- Body: "تم رفض بلاغك"
- Everything else same

---

## TEST 5: COLD-START NAVIGATION (10 min)

**Goal**: App not running → notification tapped → app opens safely

### Setup
1. On device, force close app completely
2. Don't open it yet

### Send Notification
```bash
curl -X POST https://delni.ly/api/v1/admin/notifications/broadcast \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test 5: Cold Start",
    "body": "Tap me before opening app",
    "data": {
      "pathname": "/category/design"
    }
  }'
```

### Tap Notification (App Not Running Yet)
- ✅ App launches from notification
- ✅ Splash screen shows
- ✅ Auth loads (pause ~2-3 seconds)
- ✅ **App navigates to /category/design** (FIX #4)
- ✅ No crash about "attempted to navigate before mounting"
- ✅ Badge shows correct unread count

### What NOT to See
❌ "Attempted to navigate before mounting Root Layout" error
❌ Navigation fails
❌ Wrong route opens

---

## TEST 6: MARK ALL READ (5 min)

**Goal**: "Mark All" button decrements badge instantly

### Setup
1. App open, notifications screen visible
2. Have 3+ unread notifications (send multiple broadcasts)
3. Badge shows "3"

### Tap "اقرأ الكل" Button
- ✅ Badge goes "3" → "0" **immediately** (THIS IS FIX #2)
- ✅ All notifications lose blue left border
- ✅ No waiting, no delay

### If Badge Takes 30+ Seconds
❌ **FIX #2 NOT WORKING** — Redeploy latest code

---

## TEST 7: BADGE PERSISTENCE AFTER RESTART (5 min)

**Goal**: Badge survives app restart with correct count

### Setup
1. Send 2 notifications while app open
2. Badge shows "2"
3. **Force close app completely**

### Restart App
- ✅ App opens
- ✅ Splash screen shows
- ✅ Auth loads
- ✅ Badge shows "2" (matches backend unread count)
- ✅ Navigate to notifications screen
- ✅ 2 notifications visible

---

## TEST 8: TOKEN REFRESH ON RESUME (10 min)

**Goal**: Token refreshed when app comes to foreground

### Setup
1. App logged in
2. Check database for push_token entry
   ```sql
   SELECT * FROM push_tokens 
   WHERE user_id = YOUR_USER_ID 
   ORDER BY created_at DESC LIMIT 1;
   -- Note the created_at timestamp
   ```

### Test Resume
1. Background app (home button)
2. Wait 5 seconds
3. Bring app to foreground
4. Open Expo console

### Verify in Console
- ✅ Search for: `[notifications]`
- ✅ Should NOT see "Backend sync failed"
- ✅ App continues to work
- ✅ Device ready to receive notifications

### Check Database (Advanced)
```sql
SELECT * FROM push_tokens 
WHERE user_id = YOUR_USER_ID 
ORDER BY created_at DESC LIMIT 2;
-- Should show same token as before (FIX #5 deduped it)
-- OR new token if Expo regenerated one
-- Either way: no crash, no errors
```

---

## TEST 9: PERMISSION DENIAL GRACEFUL DEGRADATION (5 min)

**Goal**: App works even if user denies notifications

### On Fresh Install (Optional)
1. Delete app completely
2. Reinstall from Expo
3. When OS asks for permission → tap "Don't Allow"

### App Behavior
- ✅ App launches normally
- ✅ Can login, browse, favorite
- ✅ Notifications tab exists but shows "0"
- ✅ No crash or error
- ✅ Database notifications still visible if user navigates to list

### Limitation
- ❌ Push notifications won't arrive (expected)
- ℹ️ To fix: User must go to Settings → enable notifications

---

## TEST 10: PAGINATION & LOAD MORE (5 min)

**Goal**: Infinite scroll works correctly

### Setup
1. Send 30+ notifications (use loop)
2. Open notifications screen

### Test Pagination
1. Scroll down to bottom
2. Should load more automatically
3. Badge count should match total unread (not just visible)
4. Pull refresh resets to page 1

### Verify
- ✅ No duplicates across pages
- ✅ All notifications accounted for
- ✅ Loading indicator shows during fetch

---

## DEBUGGING: If Something Doesn't Work

### Check 1: Verify You're Logged In
```javascript
// In Expo console, type:
localStorage.getItem('delni_auth_token')
// Should return a token string, not null
```

### Check 2: Verify Badge State
```javascript
// In Expo console:
AsyncStorage.getItem('notifications')  // or similar
// Should show unread count
```

### Check 3: Check Logs
```javascript
// Search Expo console for:
[notifications]

// Should see:
[notifications] Push token sync succeeded
[notifications] Foreground notification received
[notifications] Backend sync failed (only if error)
```

### Check 4: Verify Push Token on Backend
```sql
SELECT * FROM push_tokens 
WHERE user_id = YOUR_USER_ID 
ORDER BY created_at DESC LIMIT 1;

-- Should show:
-- - token: (Expo token string)
-- - provider: 'expo'
-- - device_name: (your device)
-- - created_at: recently
```

### Check 5: Verify Notification Sent
```sql
SELECT * FROM notifications 
WHERE user_id = YOUR_USER_ID 
ORDER BY created_at DESC LIMIT 1;

-- Should show:
-- - type: 'review_flag_decision' or similar
-- - title: (your test title)
-- - body: (your test body)
-- - read_at: null (if not marked read yet)
```

### Check 6: View Expo Push Dashboard
1. Go to: https://expo.dev/notifications
2. Select your project
3. See push delivery status
4. Check if token shows "valid"

### Check 7: Rebuild If Nothing Works
```bash
# Stop Expo
# Clear cache
rm -rf node_modules/.cache

# Restart
npx expo start --clear

# On device, press 'r' to reload
```

---

## QUICK REFERENCE: What to Look For

| Test | What You're Checking | Success Looks Like |
|------|---------------------|-------------------|
| 1. Foreground | Instant badge | Badge goes 0→1 immediately, no delay |
| 2. Background | Navigation works | App opens to correct route |
| 3. Flag Approve | Special UI | Green badge, shows reason |
| 4. Flag Reject | Different status | Red badge, shows reason |
| 5. Cold-start | Safe navigation | Auth completes before nav |
| 6. Mark all | Instant reset | Badge 3→0 immediately |
| 7. Restart | Persistence | Badge survives app close |
| 8. Resume | Token refresh | No errors in console |
| 9. Denied perms | Graceful | App works, just no push |
| 10. Pagination | Infinite scroll | Load more works, no dupes |

---

## COMMON MISTAKES

| Mistake | Why It Fails | Fix |
|---------|------------|-----|
| Not logged in | No push token synced | Login first |
| App closed completely | Token sync fails | Keep app suspended, don't force close |
| Wrong backend URL | Notification doesn't send | Verify API_BASE_URL in constants |
| Network disconnected | Notifications won't deliver | Check WiFi connection |
| Old token in DB | Notifications go nowhere | Clear push_tokens table, restart app |
| Using simulator without permissions | Can't test real push | Use physical device |
| Not checking console | Errors hidden | Always open Expo logs |
| Waiting 30s for badge | Didn't deploy fixes | Redeploy latest code |

---

## EXAMPLE: Full Test Session (30 min)

```
[10:00] Start Expo dev server
[10:02] Open app on device, login
[10:03] Navigate to Notifications screen
[10:05] Send Test 1 (broadcast foreground) → Badge increments
[10:07] Background app, send Test 2 (broadcast background) → Tap, navigate
[10:09] Test 3: Submit flag as User A
[10:12] Login as Admin, approve flag
[10:13] Check User A device → Notification arrived, tapped it
[10:15] Send Test 5 (cold-start)
[10:17] Force close, tap notification → App opens safely
[10:20] Restart app → Badge persistent
[10:22] Mark all read → Badge resets instantly
[10:24] Check console → [notifications] logs clean
[10:25] Test pagination → Load more works
[10:27] All tests pass ✅
[10:30] Celebrate 🎉
```

---

## YOU'RE READY!

Pick any test above and run it. Start with Test 1 (easiest). Report back if you hit issues!
