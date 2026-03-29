# QA Report: sync-plate-frontend

**Date:** 2026-03-29
**URL:** http://localhost:3099
**Mode:** Full (report-only)
**Duration:** ~8 minutes
**Pages Visited:** 3 (Login, Sign Up, Forgot Password)
**Screenshots:** 10
**Framework:** React 19 (Create React App) + Supabase + Tailwind CSS

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 2 |
| Medium | 2 |
| Low | 2 |

**Health Score: 68/100**

The auth flow works well: clean design, proper error handling, good mobile responsiveness. Two high-severity issues stand out: the OpenAI API key exposed in client-side code (security risk) and the duplicate Supabase client files (maintenance hazard). Deeper pages (Profile Setup, Household Setup, Dashboard) could not be tested due to Supabase email rate limiting blocking account creation.

---

## Top 3 Things to Fix

1. **HIGH: OpenAI API key exposed in client-side bundle** — any user can extract it from devtools. Move to a backend proxy.
2. **HIGH: Duplicate Supabase client files** — `src/supabaseClient.js` and `src/lib/supabaseClient.js` contain identical code. One should be deleted.
3. **MEDIUM: Default CRA page title and meta description** — "React App" and "Web site created using create-react-app" are still in `public/index.html`.

---

## Issues

### ISSUE-001: OpenAI API key exposed in client-side code
**Severity:** High
**Category:** Security

**Description:**
`src/lib/openaiClient.js` creates an OpenAI client using `process.env.REACT_APP_OPENAI_API_KEY`. Create React App inlines all `REACT_APP_*` variables into the JavaScript bundle at build time. This means the OpenAI API key is visible to anyone who opens browser devtools or reads the deployed JS bundle.

OpenAI API keys should never be exposed client-side. API calls should be proxied through a backend or serverless function (e.g., Supabase Edge Function).

**Evidence:** Found via source grep. No screenshot needed — this is a code-level security issue.

---

### ISSUE-002: Duplicate Supabase client files
**Severity:** High
**Category:** Functional

**Description:**
Two Supabase client files exist with identical code:
- `src/supabaseClient.js`
- `src/lib/supabaseClient.js`

`App.js` imports from `src/lib/supabaseClient.js`. `Dashboard.jsx` uses `process.env.REACT_APP_SUPABASE_ANON_KEY` directly in headers (line 545-546). The orphaned `src/supabaseClient.js` creates confusion about which is canonical and risks someone importing the wrong one.

---

### ISSUE-003: Default CRA page title and meta description
**Severity:** Medium
**Category:** Content

**Description:**
`public/index.html` still has CRA defaults:
- Line 27: `<title>React App</title>` — should be "Sync-Plate"
- Line 10: `<meta name="description" content="Web site created using create-react-app" />` — should describe the app

This affects SEO, browser tabs, and bookmarks. Every user sees "React App" in their browser tab.

**Evidence:** screenshots/landing.png (browser tab shows "React App")

**Repro:**
1. Open http://localhost:3099
2. Look at browser tab title
3. See: "React App" instead of "Sync-Plate"

---

### ISSUE-004: Default CRA favicon and PWA icons
**Severity:** Medium
**Category:** Visual / Branding

**Description:**
The app uses the default CRA React logo for:
- `public/favicon.ico` (3.8KB — standard CRA size)
- `public/logo192.png` (5.3KB)
- `public/logo512.png` (9.6KB)

The app has a custom icon (rose/pink utensils icon) rendered inline via lucide-react, but this doesn't match the favicon. Users see the React logo in their browser tab, bookmarks, and PWA installs.

---

### ISSUE-005: ESLint warnings — unused variables in FoodInput.jsx
**Severity:** Low
**Category:** Code quality

**Description:**
The dev server compilation output shows:
```
src/components/FoodInput.jsx
  Line 24:10:  'servingsB' is assigned a value but never used     no-unused-vars
  Line 24:21:  'setServingsB' is assigned a value but never used  no-unused-vars
```

Unused state variables suggest incomplete or dead code.

---

### ISSUE-006: Form state persists across Login/Signup toggle
**Severity:** Low
**Category:** UX

**Description:**
When switching between Login and Sign Up views, the email and password fields retain their values. While this could be intentional (saves re-typing), the password field carrying over from a failed login to signup (or vice versa) is unexpected. The error state is properly cleared on toggle, but form data isn't.

**Evidence:** screenshots/signup-page.png — shows email/password from login attempt still populated in signup form.

**Repro:**
1. Enter "test@example.com" / "password123" on login
2. Click "Don't have an account? Sign up"
3. See: email and password fields still contain the login values

---

## What Works Well

- **Auth flow design** — Clean, polished gradient background. Card-based form with proper spacing. Icons in input fields add visual clarity without clutter.
- **Error handling** — `friendlyError()` translates technical Supabase errors into human-readable messages. Rate limiting, invalid credentials, unconfirmed email all have custom messages.
- **Mobile responsiveness** — Tested at 375x812 (iPhone) and 768x1024 (iPad). Both look great with proper scaling and no overflow.
- **Loading states** — Button text changes to "Loading..." / "Sending..." with disabled state during async operations.
- **Form validation** — Native HTML5 validation (`required`, `type="email"`, `minLength={6}`) catches basic input errors before hitting the API.
- **Accessibility** — Proper `<label>` elements for all inputs, `lang="en"` on root element, semantic heading structure.

---

## Console Health

| Page | Errors | Notes |
|------|--------|-------|
| Landing (Login) | 0 | Clean |
| Sign Up (invalid email) | 1 | `400` from Supabase — expected for invalid email format |
| Sign Up (rate limited) | 1 | `429` from Supabase — expected rate limiting |

No unexpected console errors. All errors are Supabase API responses from intentional testing.

---

## Pages Not Tested

The following pages could not be reached because account creation requires email confirmation and the Supabase instance rate-limited further signup attempts:

- **ProfileSetup** (`src/components/ProfileSetup.jsx`) — shown after first login, no profile exists
- **HouseholdSetup** (`src/components/HouseholdSetup.jsx`) — shown after profile creation
- **Dashboard** (`src/components/Dashboard.jsx`) — main app interface with food tracking
- **FoodInput** (`src/components/FoodInput.jsx`) — food entry form
- **WeeklyView** (`src/components/WeeklyView.jsx`) — weekly calorie overview
- **GroceryList** (`src/components/GroceryList.jsx`) — grocery management
- **RebalanceModal** (`src/components/RebalanceModal.jsx`) — meal rebalancing feature

To test these pages, provide valid Supabase credentials for an existing account or temporarily disable email confirmation in the Supabase dashboard.

---

## Health Score Breakdown

| Category | Score | Weight | Weighted |
|----------|-------|--------|----------|
| Console | 100 | 15% | 15.0 |
| Links | 100 | 10% | 10.0 |
| Visual | 85 | 10% | 8.5 |
| Functional | 55 | 20% | 11.0 |
| UX | 72 | 15% | 10.8 |
| Performance | 100 | 10% | 10.0 |
| Content | 60 | 5% | 3.0 |
| Accessibility | 95 | 15% | 14.3 |
| **Total** | | | **68** |

Notes:
- Visual deducted for default favicon/icons (-15)
- Functional deducted for duplicate client (-15), security issue (-15), unused vars (-3), incomplete page coverage (-12)
- UX deducted for form state persistence (-3), limited testable surface (-25)
- Content deducted for default title/description (-25), no .env.example (-15)
- Accessibility deducted for missing page-specific title updates (-5)

---

## Notes

- No test framework detected beyond the default `App.test.js`. Run `/qa` to bootstrap a test suite.
- The app is a meal planning / grocery management tool for couples, with Supabase auth, household management, food input, weekly calorie views, grocery lists, and a "rebalance" feature.
- `Dashboard.jsx` directly uses `process.env.REACT_APP_SUPABASE_ANON_KEY` in fetch headers (lines 545-546) instead of using the Supabase client, which is a code smell.

---

*Generated by gstack /qa-only*
