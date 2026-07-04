# App Store Connect — دلني ليبيا (listing content)

Primary language: **Arabic**. Paste each block into the matching App Store Connect field.

---

## App Name (max 30)
```
دلني ليبيا
```

## Subtitle (max 30)
```
دليل مزوّدي الخدمات في ليبيا
```

## Promotional Text (max 170)
```
اكتشف أفضل مزوّدي الخدمات في مدينتك — من الصحة والتقنية إلى التصميم والتسويق. تصفّح، قارن التقييمات، وتواصل مباشرة بضغطة واحدة.
```

## Keywords (max 100, comma-separated, no spaces after commas)
```
خدمات,ليبيا,دليل,مزودي,تقييمات,طرابلس,بنغازي,صيانة,تصميم,تسويق,صحة,شركات,مستقل
```

## Description (max 4000)
```
دلني — دليلك الشامل لمزوّدي الخدمات في ليبيا

يساعدك تطبيق دلني على العثور على أفضل مزوّدي الخدمات في مدينتك بسهولة وسرعة. سواء كنت تبحث عن خدمات صحية، تقنية، تصميم، تسويق أو صيانة — يجمع لك دلني المزوّدين الموثوقين في مكان واحد.

المميزات:
• تصفّح حسب القسم والمدينة — اعثر على ما تحتاجه بالقرب منك.
• بحث ذكي — ابحث عن الخدمة أو مقدّم الخدمة مباشرة مع اقتراحات فورية.
• تقييمات ومراجعات حقيقية — اقرأ تجارب الآخرين قبل قرارك، وشارك تقييمك بكل شفافية.
• ملفات تعريفية مفصّلة — معلومات المزوّد، سنوات الخبرة، معرض الأعمال وطرق التواصل.
• تواصل مباشر — اتصل هاتفيًا أو راسل عبر واتساب بضغطة واحدة.
• المفضّلة — احفظ المزوّدين المفضّلين لديك للرجوع إليهم لاحقًا.
• الأعلى تقييمًا — اكتشف أفضل المزوّدين تقييمًا في كل قسم.
• تصفّح كضيف — استخدم التطبيق دون حساب، أو سجّل للاستفادة من كل الميزات.

دلني منصة دليل إلكتروني فقط، وليست طرفًا في أي تعامل أو اتفاق بين المستخدم ومقدّم الخدمة. تتم جميع التعاملات مباشرة بينك وبين مقدّم الخدمة.

حمّل دلني الآن وابدأ رحلتك في العثور على الخدمات التي تحتاجها.
```

---

## App Review Information

### Sign-In required: **YES**
```
Email:    reviewer-user@delni.ly
Password: AppReviewDemo2026!
```

### Notes (paste into "Notes")
```
Delni is a directory of service providers in Libya. Browsing works
without an account. The only user-generated content is star ratings and
text reviews.

DEMO ACCOUNTS (no 2FA / email / phone verification / CAPTCHA):
- App user:  reviewer-user@delni.ly  / AppReviewDemo2026!
- Moderator: reviewer-admin@delni.ly / ModeratorDemo2026!
  Backend moderation panel: https://delni.ly/cp/admin

CONTENT MODERATION (Guideline 1.2):
1. In the app, log in as reviewer-user@delni.ly.
2. Open "Apple Review Demo Provider" and tap Report on the existing
   review (or add a review, then report it).
3. Log into the moderation panel above as reviewer-admin@delni.ly.
4. Go to Reviews > filter "Unhandled flags" > Accept flag (hides the
   review) or Reject flag. Offensive words are also auto-filtered on
   submission, and abusive users can be suspended.

No in-app purchases. Any provider promotion arrangements happen outside
the app and are not part of the iOS experience.
Contact: support@delni.ly
```

---

## URLs (must be public web pages)
- **Support URL:** `https://delni.ly/support`  ← confirm this page exists
- **Marketing URL (optional):** `https://delni.ly`
- **Privacy Policy URL:** `https://delni.ly/privacy`  ← REQUIRED, must be live

## App Privacy (questionnaire)
Declare data collected: **Email address** (account), **Precise/Coarse Location**
(nearest-city suggestion, "while using"), **User Content** (reviews). Used for
app functionality; linked to the user's account; not used for tracking.

## Age Rating
Answer "None" to all mature-content questions → likely **4+**.

## Export Compliance
Already set in app.json (`usesNonExemptEncryption: false`) → no docs needed.

---

## Icon / Splash / Logo — status
- **App icon:** `assets/icon.png` — **1024×1024** ✓ (no transparency, no rounded corners — Apple rounds it)
- **Splash:** expo-splash-screen, white background, `splash-icon.png` 1024×1024 shown at 200px ✓
- **In-app animated splash:** `app/index.tsx` (blue gradient, "دلني." logo) — cosmetic, fine
- No separate iOS icon override needed (uses the 1024 icon)

## Screenshots (still needed — you provide)
- **6.5" iPhone** (1284×2778 or 2778×1284), at least 1, up to 10
- Capture from the running app: Home, Search results, a Provider profile,
  Top-Rated, and the Login screen. iPhone 15 Pro Max / simulator sizes work.
