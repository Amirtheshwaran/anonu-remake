# Changelog

All notable changes to AnonU will be documented in this file.

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
