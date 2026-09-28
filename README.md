# AnonU 🎭

> **The uncensored, zero-dox campus microblog for university students.**  
> Post anonymously when you need to rant about midterms. Post under your real name when you're hosting an event. No fake clout, no algorithm manipulation, just real campus pulse.

<br/>

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-0.76-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo-SDK_52-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Firebase-Auth%20%7C%20Firestore%20%7C%20Storage%20%7C%20Functions-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/Style-Neo--Brutalism-FFE600?style=for-the-badge&logoColor=black" alt="Neo-Brutalism" />
  <img src="https://img.shields.io/badge/License-MIT-00F090?style=for-the-badge&logoColor=black" alt="MIT License" />
</p>

---

## Why I Built This

Most campus social apps either get ruined by ads or turn into toxic cesspools because there is no balance between freedom of expression and accountability.

AnonU is built around a simple premise: **you control your identity on every single post.**

- Need to vent about a terrible dorm situation or ask an embarrassing freshman question? Flip on your **Anonymous Mask** (`Cyan Kestrel`, `Solar Badger`, etc.). Your real identity is never exposed to other students or in public database records.
- Selling football tickets, looking for a roommate, or running a club hackathon? Flip on your **Verified Profile** so classmates can identify you and reach out directly.

The entire interface is crafted with a **Neo-Brutalist** design language — bold 3px black borders, stark contrast, hard zero-blur offset shadows, vibrant pop accents (`#FFE600` yellow, `#00F090` mint, `#00E5FF` cyan, `#FF5A1F` orange), and tactile physical press feedback.

---

## How Anonymity Works in AnonU

Privacy in AnonU is enforced by cryptographic and database architecture rather than client-side promises.

```text
CLIENT                          CLOUD FUNCTIONS (2nd Gen)              FIRESTORE
┌─────────────────────────┐     ┌───────────────────────────────┐     ┌───────────────────────────────┐
│ Post Composer           │     │ - Enforce verified .edu token │     │ posts/{id}                    │
│ - Strips EXIF metadata  │────▶│ - Rate-limit per user UID     │────▶│ (NO authorUid present)        │
│ - Calls createPost()    │     │ - HMAC-SHA256(uid + postId)   │     │                               │
└─────────────────────────┘     │ - Atomic batch write          │     │ postAuthors/{id}              │
                                └───────────────────────────────┘     │ (Strictly private mapping)    │
                                                                      └───────────────────────────────┘
```

1. **Zero `authorUid` in Public Documents**:
   Public documents (`posts/{id}` and `comments/{id}`) do not contain user UIDs. When a post is created anonymously, an unforgeable server mapping is recorded in private collections (`postAuthors/{id}` and `commentAuthors/{id}`). Only Cloud Functions and the author themselves (to display their own archive) can ever query this mapping. Other students inspecting network payloads or Firestore documents cannot retrieve the author's UID.

2. **Cryptographic Server Pseudonyms**:
   Pseudonyms are generated server-side using `HMAC-SHA256(uid + ":" + postId, secretSalt)`. Because the secret salt lives exclusively on the server, third parties cannot reverse-engineer or correlate pseudonyms across different posts. A user has a consistent mask within a single thread, but appears under completely different pseudonyms on other threads.

3. **Split User Profiles**:
   User accounts are partitioned into two distinct collections:
   - `users/{uid}`: Strictly private (owner-only access in security rules). Stores university email, permanent mask, streaks, and check-in history.
   - `profiles/{uid}`: Publicly readable. Stores verified display name and avatar photo for identified publications.

4. **Write-Locked Counters & Score Calculation**:
   Clients cannot edit post scores, upvotes, downvotes, comment counts, or `isHidden` status directly. Users write only their vote choice to subcollection `posts/{postId}/votes/{uid}`. A Firestore trigger updates post counters atomically via `FieldValue.increment()` and recalculates Hacker-News-style hot decay scores (`score / ((ageHours + 2) ^ 1.8)`).

5. **Private Poll Subcollections**:
   Voter choices are not stored on public post documents. Votes are cast into private subcollections (`posts/{postId}/pollVotes/{uid}`), where rules prevent users from reading other voters' records. Option tallies are incremented atomically on the server.

6. **Server-Side Alerts**:
   Direct client writes to `notifications` are blocked in security rules. Cloud Functions automatically generate activity notifications for votes, comments, replies, and reposts. If the triggering action is anonymous, actor identity fields are omitted.

7. **Metadata Sanitization & Storage Staging**:
   Post photo attachments are processed through `expo-image-manipulator` on the device to strip EXIF GPS coordinates and camera metadata before being uploaded to temporary staging paths.

8. **Verified Campus Email Guard & Multi-Campus Isolation**:
   - Sign-ups are restricted strictly to validated university domains (`charlotte.edu`, `ncsu.edu`, `unc.edu`, `vt.edu`, `duke.edu`, etc.).
   - The user's `campusId` is derived deterministically from their verified email domain.
   - All feeds, trending search topics, live mood pulses, and channels are partitioned per-campus. Students only see and interact with their own university community.
   - All write operations (`createPost`, `createComment`, `vote`, `report`) require an authenticated Firebase token with `email_verified == true`.
   - 3-Screen Onboarding walks new students through thread-based anonymity, expiring posts, and requires explicit agreement to Campus Community Rules (stamped with a timestamp on the user's private record).

9. **Zero-Knowledge User Blocking**:
   App Store and Google Play require user blocking for user-generated content applications. In an anonymous system, revealing an author's identity or linking their posts across feeds would destroy privacy. AnonU implements server-side author resolution: calling `blockAuthor({ postId })` maps the author's internal UID to their authored publications and writes them to the blocker's private subcollection (`/users/{uid}/blockedPosts`). The blocker never learns the author's identity, the author is not notified, and all publications/replies by that author are instantly filtered from feeds and threads.

10. **Automated PII, Crisis, and Toxicity Content Screening**:
   Every post and reply passes through server-side automated screening in Cloud Functions before committing to Firestore:
   - **PII / Anti-Doxxing Regex**: Identifies student ID numbers (`800xxxxxx`), university/personal emails, phone numbers, and physical dorm addresses, auto-hiding high-risk doxxing posts.
   - **Crisis Support (988 Lifeline)**: Flags self-harm signals and returns immediate supportive resources (988 Suicide & Crisis Lifeline) without penalizing students.
   - **Toxicity & Threats**: Classifies hate speech, harassment, threats, and spam, auto-hiding dangerous posts and routing them to the moderator queue.

11. **Moderator Console, Progressive Strike Escalation & Appeals**:
   Verified moderators (`request.auth.token.isModerator == true`) access an in-app and web console (`app/admin.tsx`) with severity-sorted queues (`crisis`, `high`, `medium`, `low`), full thread context, and 1-click actions:
   - **Progressive Discipline**: Strike 1 (Warning), Strike 2 (24-hour timeout), Strike 3 (7-day timeout), Strike 4 (Permanent ban). Enforced server-side on all write requests.
   - **Appeals Workflow**: Students can submit strike appeals, reviewed directly in the moderator console.
   - **Audit Logging**: Every action (`hide`, `restore`, `dismiss`, `strike`) is immutably recorded in `/moderatorAuditLog`.

---

## Features

- **Segmented Campus Feeds**: Hot, New, and Top feeds powered by `@shopify/flash-list` for smooth 60fps scrolling.
- **Campus Mood Board**: Live community vibe ticker and daily mood check-in sheet with streak counter.
- **Polls & Image Attachments**: Multi-option brutalist progress polls and 1-4 photo grids with fullscreen pinch-to-zoom viewer.
- **Self-Destructing Posts (TTL)**: Posts with expiration limits (1h, 6h, 12h, 24h, 48h, or Never). Scheduled Cloud Functions purge expired posts and remove attached images from storage.
- **Nested Discussion Threads**: Full conversation tree with visual branch lines, quick reply indicators, and sticky composer.
- **Campus Alerts**: Real-time notification feed with type stickers for upvotes, comments, replies, and reposts.
- **Tag Explorer & Search**: Instant tag filtering and keyword search with trending campus topic chips.
- **Moderator Queue**: Integrated incident report panel for campus moderators with instant review and post hiding.

---

## Project Structure

```text
anonu-remake/
├── app/                               # Expo Router file-based navigation
│   ├── (tabs)/
│   │   ├── _layout.tsx                # Bottom tab bar with Neo-Brutalist tabs & alert badge
│   │   ├── index.tsx                  # Feed (Hot / New / Top + MoodBar + FlashList)
│   │   ├── alerts.tsx                 # Campus Alerts (Notifications list + Mark Read)
│   │   └── profile.tsx                # Profile (Mask, stats, own posts, mod queue)
│   ├── _layout.tsx                    # Root layout: QueryClient, Auth listener, Theme
│   ├── auth.tsx                       # Auth screen (Sign in, Sign up, Guest, Password reset)
│   ├── compose.tsx                    # Post composer (Anon/Identified, Poll, Images, TTL)
│   ├── post/
│   │   └── [id].tsx                   # Post thread with nested comments & quick reply
│   └── search.tsx                     # Search screen (Tags, keywords, trending topics)
├── src/
│   ├── components/                    # Neo-Brutalist UI components
│   │   ├── BrutalistCard.tsx          # Card with hard zero-blur offset shadow
│   │   ├── BrutalistButton.tsx        # Tactile press-down translation animation
│   │   ├── BrutalistBadge.tsx         # Pill badge (#tag, ANON, VERIFIED, EXP)
│   │   ├── BrutalistTextField.tsx     # High-contrast input field with hard shadow
│   │   ├── BrutalistDialog.tsx        # Neo-brutalist alert and confirmation modal
│   │   ├── VoteBar.tsx                # Score counter, up/down arrows, haptic feedback
│   │   ├── TagChip.tsx                # Campus hashtag chip
│   │   ├── PollWidget.tsx             # Animated progress bars & voting action
│   │   ├── ImageGrid.tsx              # Brutalist image grid & fullscreen modal viewer
│   │   ├── PostCard.tsx               # Full post card with author, tags, content, actions
│   │   ├── MoodBar.tsx                # Live campus vibes ticker + check-in trigger
│   │   └── MoodCheckInSheet.tsx       # Bottom sheet for daily mood selection (6 moods)
│   ├── constants/
│   │   ├── theme.ts                   # Color tokens (bgCream, popYellow, popMint, popPink, etc.)
│   │   └── config.ts                  # Constants (maxPostLength 280, moods, TTL options)
│   ├── hooks/                         # TanStack Query & Mutation hooks
│   │   ├── useFeed.ts                 # Feed queries & voting mutations
│   │   ├── usePost.ts                 # Single post, comments, poll voting, repost mutations
│   │   ├── useMood.ts                 # Campus mood board stream & check-in mutation
│   │   ├── useNotifications.ts        # Alerts query, unread count badge, mark-as-read
│   │   └── useSearch.ts               # Search queries
│   ├── stores/                        # Zustand stores for local UI state
│   │   ├── useAuthStore.ts            # Local auth state & session flags
│   │   └── useUIStore.ts              # Active feed tab, unread alert counts
│   ├── services/                      # Firebase client SDK wrappers
│   │   ├── firebase.ts                # React Native Firebase initialization & emulator hooks
│   │   ├── authService.ts             # Auth methods & public profile management
│   │   ├── postService.ts             # Post querying & Cloud Function invocations
│   │   └── pseudonymService.ts        # Local pseudonym display & color mapping
│   └── types/
│       ├── post.ts                    # PostModel, PollData, PostIdentity, PostType
│       └── user.ts                    # UserModel, PublicProfile, NotificationModel
├── functions/                         # Cloud Functions for Firebase (2nd Gen, TypeScript)
│   ├── src/
│   │   ├── callable/                  # createPost, createComment, checkInMood, votePoll, etc.
│   │   ├── triggers/                  # onVoteWrite, onUserCreate
│   │   ├── scheduled/                 # cleanupExpiredPosts
│   │   └── utils/                     # pseudonym HMAC, rate limiting
│   ├── package.json
│   └── tsconfig.json
├── scripts/
│   ├── migrate-author-uids.ts         # Production data migration script (with --dry-run)
│   └── seed-emulator.ts               # Local emulator mock data seeder
├── tests/
│   └── rules/
│       └── firestore.rules.test.ts    # @firebase/rules-unit-testing test suite
├── firestore.rules                    # Hardened Firestore security rules
├── storage.rules                      # Hardened Firebase Storage rules
├── firestore.indexes.json             # Composite indexes for feeds, search, and alerts
├── app.json                           # Expo app configuration
└── package.json
```

---

## Getting Started

### 1. Prerequisites
- **Node.js**: v20 or v22 LTS
- **npm** or **yarn**
- **Firebase CLI**: `npm install -g firebase-tools`
- **Expo CLI**: `npx expo`

### 2. Install Dependencies
```bash
# Install app dependencies
npm install

# Install Cloud Functions dependencies
cd functions
npm install
npm run build
cd ..
```

### 3. Local Emulator Workflow

To test security rules and run the app against local emulators:

```bash
# Start Firebase Local Emulators (Auth, Firestore, Functions, Storage, UI)
npx firebase emulators:start

# Seed test data in emulator (optional)
npm run seed:emulator

# Run security rules unit tests
npm run test:rules
```

### 4. Running Data Migration

To migrate existing production databases where posts or comments contain `authorUid`:

```bash
# Run dry-run (logs all changes without writing to database)
npm run migrate:dry

# Execute live migration (only when verified)
npm run migrate:live
```

### 5. Launch the App

```bash
# Start Expo development server
npx expo start

# Run on Android development build
npx expo run:android

# Run on iOS development build
npx expo run:ios
```

---

## License

MIT License. Built for university campus communities.
