# AnonU — Anonymous Campus Microblogging Platform

Flutter + Firebase. Dark theme. Per-post identity toggle. YikYak-style pseudonyms.

## Features

- **Per-post identity toggle** — post as "Cyan Kestrel" (anonymous) or your real name, per post
- **Hot / New / Top feed** — hot uses a time-decay score (HN-style)
- **Upvote / Downvote** — posts auto-hide at −5 score
- **Polls** with expiry times
- **Image upload** (up to 4 per post)
- **Time-limited posts** (1h / 6h / 12h / 24h / 48h)
- **Tags** with search
- **Reposts** (always anonymous)
- **Nested comments** with identity toggle
- **Campus Mood Board** — anonymous emoji check-ins with streak tracking
- **Notifications** — upvotes, comments, reposts
- **Report system** with moderator tools
- **Firestore security rules** — votes subcollection prevents de-anonymization

## Setup

### 1. Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project → **AnonU**
3. Enable **Authentication** → Email/Password
4. Enable **Firestore Database** → Start in production mode
5. Enable **Firebase Storage**
6. Enable **Firebase Messaging** (for push notifications)

### 2. Add Firebase to Flutter

```bash
dart pub global activate flutterfire_cli
flutterfire configure
```

This generates `lib/firebase_options.dart`. Then update `main.dart`:

```dart
import 'firebase_options.dart';

await Firebase.initializeApp(
  options: DefaultFirebaseOptions.currentPlatform,
);
```

### 3. Install dependencies

```bash
flutter pub get
```

### 4. Deploy Firestore rules

```bash
firebase deploy --only firestore:rules
```

### 5. Run

```bash
flutter run
```

## Firestore Data Model

```
/users/{uid}
  email, pseudonym, displayName?, avatarUrl?,
  postCount, upvotesReceived,
  currentStreak, longestStreak, lastMoodCheckIn?, lastMood?,
  joinedAt, isModerator

/posts/{postId}
  authorUid, identity, pseudonym, displayName?, avatarUrl?,
  content, type, tags[], imageUrls[],
  poll?: { options[], votes{}, endsAt },
  upvotes, downvotes, commentCount, repostCount,
  createdAt, expiresAt?,
  isHidden, isRepost, originalPostId?, originalAuthorPseudonym?

  /votes/{uid}          ← only readable by owner (prevents de-anon)
    isUpvote, uid

  /comments/{commentId}
    postId, authorUid, identity, pseudonym, displayName?,
    content, upvotes, downvotes, createdAt, parentCommentId?

  /pollVotes/{uid}      ← immutable after creation
    optionIndex

/moodBoard/{entryId}
  mood, createdAt        ← no uid stored in readable form

/notifications/{notifId}
  recipientUid, type, actorPseudonym, postId?, postPreview?,
  isRead, createdAt

/reports/{reportId}
  postId, reportedBy, reason, createdAt, resolved
```

## Privacy Architecture

- Users authenticate with email but posts are **architecturally decoupled** from their UID in public data
- Anonymous posts use a pseudonym generated from `hash(uid + postId)` — same user gets same pseudonym within a thread, different pseudonym across posts
- Vote subcollection is **only readable by the voter** — Firestore rules prevent any client from enumerating who voted on what
- Mood board stores only the emoji label, never the UID in a readable field
- Firestore security rules block any field updates that could re-link anonymous content to a user

## Recommended Next Steps

- Add **Firebase Cloud Functions** for:
  - Auto-hide posts at vote threshold (server-side)
  - Push notifications on upvote/comment
  - Scheduled cleanup of expired posts
- Add **Algolia or Typesense** for full-text search (current search is tag-based only)
- Add **image moderation** via Google Cloud Vision API
- Add **email domain allowlist** in Auth (restrict to your university domain)
