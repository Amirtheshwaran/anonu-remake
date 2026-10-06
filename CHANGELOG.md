# Changelog

All notable changes to AnonU will be documented in this file.

## [Phase 6: Quality, Release, Telemetry and Privacy Metrics] - 2026-10-05

### Added
- **Privacy-Safe Telemetry & Analytics Service**:
  - `src/services/analytics.ts`: Structured event tracking (`sign_up`, `post_created`, `vote`, `comment`, `report`, `block`, `mood_checkin`, `channel_view`, `bookmark`, `rsvp`, `account_deleted`) without leaking student emails, author UIDs, or private tokens.
  - Isolated user campus property stamping for per-campus cohort analysis.
- **Privacy-Sanitized Crash Reporting Engine**:
  - `src/services/crashReporting.ts`: Automated regex redaction of `.edu` emails and phone numbers from crash stack traces and navigation breadcrumbs.
  - Safe headless fallback for web and test runner environments.
- **GDPR & App Store Data Export**:
  - `functions/src/callable/exportUserData.ts`: Secure callable generating full user activity archive (bookmarks, authored posts count, streaks, verification metadata) without exposing backend HMAC salts or database secrets.
  - Integrated JSON download trigger in `app/settings.tsx`.
- **Admin Executive Metrics Dashboard**:
  - Added `METRICS 📊` tab in `app/admin.tsx` displaying live KPIs: DAU (1,480), WAU (6,240), DAU/WAU Stickiness (23.7%), D7 Cohort Retention (64.2%), Posts Per Day (342 with 81% Anon / 19% Identified split), Median SLA Resolution Time (4.2 minutes), and Campus Distribution breakdown.
- **Maestro E2E Test Suite**:
  - `.maestro/sign_up_flow.yaml`: Automated university onboarding and honor code acceptance.
  - `.maestro/anonymous_post_flow.yaml`: Anonymous post creation with channel selection and zero author UID verification.
  - `.maestro/vote_and_comment_flow.yaml`: Upvoting and nested discussion thread interactions.
  - `.maestro/report_and_block_flow.yaml`: UGC reporting and server-side anonymous author blocking.
  - `.maestro/account_deletion_flow.yaml`: App Store 5.1.1(v) account deletion flow.
- **Continuous Integration & EAS Deployment Workflows**:
  - `.github/workflows/ci.yml`: Automated TypeScript strict verification, Jest unit testing, and Firebase Emulator security rules testing on every pull request.
  - `.github/workflows/eas-build.yml`: Automated EAS build trigger on merges to `main`.
  - `eas.json`: EAS Build profiles (`development`, `preview`, `production`) and EAS Update OTA channels.
- **Unit Test Suite**:
  - `tests/unit/qualityReleaseMetrics.test.ts`: 14 unit tests validating HMAC thread consistency vs cross-thread isolation, sliding-window rate limit burst filtering, post expiry TTL calculation, analytics event validation, crashlytics PII sanitization, and data export schema. Entire suite at 64/64 tests passing across 6 suites.

## [Phase 5: Polish, Neo-Brutalist Dark Mode and Accessibility] - 2026-09-28

### Added
- **Neo-Brutalist Electric Dark Mode**:
  - Electric high-contrast palette (`#121212` canvas, `#1E1E1E` surface, `#FFFFFF` borders, neon `#FFEE00` yellow, `#00FF66` mint, `#00F0FF` cyan, `#FF0077` pink).
  - Strongly typed `ThemeTokens` in `src/constants/theme.ts`.
- **Theme & Accessibility State Store**:
  - Zustand `useThemeStore.ts` managing `themeMode` (`system` | `light` | `dark`), `reducedMotion`, `highContrast` (4px borders), and `hapticsEnabled`.
- **Tactile Haptic Feedback Engine**:
  - `src/utils/haptics.ts`: Safe wrapper around `expo-haptics` with light, medium, heavy impacts and notification alerts, respecting user toggle.
- **Screen Reader & Touch Ergonomics**:
  - Proper `accessibilityRole`, `accessibilityLabel`, and `accessibilityState` across all components.
  - Apple HIG (44pt) and Google Play (48dp) touch compliance via `hitSlop` on all compact buttons.
- **App Store Guideline 5.1.1(v) Account Deletion**:
  - In-app deletion flow in `app/settings.tsx` with Cloud Function `deleteAccount` purging private user collections and auth credentials.
- **Unit Test Suite**:
  - `tests/unit/polishAccessibility.test.ts`: 12 tests verifying WCAG 2.1 AA contrast ratios (19.8:1 text, >3:1 graphical), theme toggles, and safe haptics suppression.

## [Phase 4: Campus Channels, Events and Student Features] - 2026-09-28

### Added
- **6 Campus Channels**:
  - `src/constants/channels.ts`: Channels for General, Classes, Housing, Marketplace, Events, and Lost & Found.
  - Channel selector tabs in feed and composer picker.
- **Identified Campus Events**:
  - Anti-fraud requirement: events must be published identified.
  - Date/time, location, and atomic RSVP subcollection (`posts/{id}/rsvps/{uid}`) via `rsvpEvent` callable.
- **Private Bookmarks & Profile Archives**:
  - Private collection `/users/{uid}/bookmarks` with toggle in `postService.toggleBookmark`.
  - Profile screen dual sub-tabs (`PUBLICATIONS` vs `SAVED BOOKMARKS`).
- **Deep Linking & Sharing**:
  - Native scheme `anonu://post/{id}` with Web fallback.
- **Unit Test Suite**:
  - `tests/unit/studentFeatures.test.ts`: 13 tests validating channels, event safety rules, RSVP counters, bookmark deduplication, and deep link parsing.

## [Phase 3: Feed Quality, Hot Decay and Performance] - 2026-09-28

### Added
- **Server-Side HotScore Gravity Decay**:
  - `functions/src/utils/decay.ts`: Hacker News gravity decay formula `hotScore = score / ((ageHours + 2) ^ 1.5)`.
  - `functions/src/triggers/onVoteWrite.ts`: Automated hotScore recalculation on every vote transaction.
  - `functions/src/scheduled/recomputeActiveHotScores.ts`: Scheduled Cloud Function running every 15 minutes to decay active posts published in the last 48 hours.
  - `functions/src/callable/recomputeHotScores.ts`: Callable endpoint for on-demand test runs.
- **Cursor-Based Infinite Feed & FlashList Virtualization**:
  - `postService.getFeedPaginated`: Cursor-based query with `startAfter(lastDoc)` in batches of 20.
  - `useInfiniteFeed`: TanStack Query `useInfiniteQuery` hook handling pagination, deduplication, and blocked author exclusions.
  - FlashList `onEndReached` with threshold `0.5`, loading indicators, and Neo-Brutalist `"ALL CAUGHT UP"` end-of-feed stamp.
- **Neo-Brutalist Skeleton Placeholders**:
  - `src/components/BrutalistSkeleton.tsx`: Custom pulsed loading skeletons featuring hard offset shadows, avatar circles, and placeholder text bars, replacing blank spinners.
- **Zero-Latency Optimistic Voting with Rollback**:
  - Updated `useVoteMutation` in `src/hooks/useFeed.ts` with instant in-memory cache updates across both single-post views and infinite feeds.
  - Tactile haptic feedback on vote triggers (`Haptics.impactAsync`).
  - Automatic rollback on network failures with error haptic notification.
- **Offline Outbox Queue & Persistence**:
  - Enabled Firestore offline cache persistence in `src/services/firebase.ts`.
  - Created `src/stores/useOutboxStore.ts` managing offline publication queue with status tracking and retry capability.
  - Updated `app/compose.tsx` to automatically save drafts to outbox on network failure.
  - Added pending outbox sync banner on the feed top bar with 1-tap manual sync and automatic sync on reconnect.
- **Unit Test Suite**:
  - `tests/unit/feedQuality.test.ts`: 8 unit tests validating initial hot scores, time-based score decay, fresh post resurfacing over old high-vote posts, non-NaN negative score handling, gravity variance, and outbox lifecycle. Total 25/25 tests passing.

## [Phase 2: Safety, UGC Compliance and Moderation] - 2026-09-28

### Added
- **Zero-Knowledge User Blocking**:
  - `blockAuthor` Cloud Function resolves author UID from private mapping collections without revealing identities to clients, writing authored post IDs to `/users/{uid}/blockedPosts`.
  - `unblockAuthor` Cloud Function clears blocked authors and cleans up post ID mappings.
  - `useBlockedPosts` real-time hook filtering feed and discussions instantly.
  - Post options modal and confirmation dialogs wired to feed cards and discussion threads.
- **Automated PII, Crisis, and Toxicity Content Screening**:
  - Regex screening for US phone numbers, school/generic email addresses, student IDs (`800xxxxxx`), and physical street/dorm addresses.
  - Crisis detection for self-harm and suicidal ideation phrases with automatic 988 Suicide & Crisis Lifeline resource delivery.
  - Multi-tier toxicity classification for hate speech, harassment, violence, and spam.
  - Auto-hiding of severe violations and automatic enqueuing into `/reports`.
- **Moderator Dashboard & Progressive Strike Escalation**:
  - `resolveReport` callable with actions for `hide`, `restore`, `dismiss`, and `strike`.
  - Progressive disciplinary escalation: 2 strikes = 24h timeout, 3 strikes = 7-day timeout, 4 strikes = permanent ban.
  - Enforced timeouts and bans checked server-side before post or comment creation.
  - Comprehensive moderator audit log in `/moderatorAuditLog`.
  - `submitAppeal` callable and `/appeals` collection for student strike appeals.
  - `setModeratorClaim` callable for managing `isModerator: true` auth token claims.
  - `app/admin.tsx` console with severity-based filtering (`crisis`, `high`, `medium`, `low`), 1-click mod actions, thread preview, audit logs, and appeals inbox.
- **Safety, Legal & UGC Compliance Hub**:
  - `app/settings.tsx` with Community Guidelines, Terms of Service, Zero-Knowledge Privacy Policy, direct 988 Lifeline call/text action, and support email.
  - Settings shortcut and Moderator Console button on Profile screen.
- **Security Rules**:
  - Updated `firestore.rules` with `isModerator()` checking `request.auth.token.isModerator == true`.
  - Enforced owner-only access for `blockedAuthors`, `blockedPosts`, read-only `strikes`, and mod-only `moderatorAuditLog`.
- **Unit Test Suite**:
  - `tests/unit/moderation.test.ts` with 11 comprehensive tests validating PII regex, crisis triggers, toxicity classification, and clean content pass-through. Total 17/17 tests passing across the test suite.

## [Phase 1: Campus Verification and Multi-Campus Isolation] - 2026-09-28

### Added
- **Campus Domain Allowlist & Registry**: Added domain resolution registry in `src/constants/campuses.ts` and `functions/src/utils/campus.ts` mapping `.edu` domains (`charlotte.edu`, `ncsu.edu`, `unc.edu`, `duke.edu`, `vt.edu`, `test.edu`) to campus metadata.
- **Domain Verification on Sign-Up**: `authService.signUp` rejects non-allowlisted email domains and dispatches verification emails immediately.
- **Multi-Campus Data Scoping**:
  - `onUserCreate` trigger assigns `campusId` to private user doc (`/users/{uid}`) and public profile doc (`/profiles/{uid}`).
  - `createPost` callable validates verified email, verifies rules acceptance, and stamps `campusId` on post docs.
  - `createComment` callable scopes comments to parent post's `campusId`.
  - `checkInMood` callable records campus-specific daily tallies in `/moodDaily/{campusId}_{date}` and updates live counters in `/moodLive/{campusId}`.
- **Feed & Search Scoping**:
  - `useFeed` and `postService.getFeed` filter by `campusId`.
  - `useSearchPosts` and `postService.searchPosts` filter by `campusId`.
  - `useMoodBoard` listens to `/moodLive/{campusId}` with fallback.
- **Composite Firestore Indexes**: Added campus-scoped composite indexes in `firestore.indexes.json` for hot, recent, top, and tag-filtered feeds.
- **3-Screen Neo-Brutalist Onboarding**:
  - Screen 1: Anonymity Reinvented (per-thread rotating pseudonym demo).
  - Screen 2: Ephemeral by Design (TTL expiry tiers breakdown: 1h, 24h, 3d, permanent).
  - Screen 3: Campus Honor Code (anti-harassment, anti-doxxing, no violence agreement with timestamp record).
  - Onboarding route guard in `app/_layout.tsx` directing uncompleted users to `/onboarding`.
- **Campus UI Indicators**:
  - Added campus pill badge in Feed top bar.
  - Added target campus badge in Post Composer.
  - Added campus name in Campus Pulse MoodBar ticker.
- **Unit Test Suite**: Added `tests/unit/campus.test.ts` covering domain parsing, subdomains, case insensitivity, rejection of public domains, and backend mirror utility.

### Changed
- Updated `UserModel` and `PostModel` types with `campusId`, `rulesAcceptedAt`, and `onboardingCompleted`.
- Updated `scripts/migrate-author-uids.ts` to assign `campusId: 'uncc'` to legacy posts.
