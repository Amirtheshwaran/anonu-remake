# AnonU

AnonU is a Flutter/Firebase campus microblog app. The idea is simple: students can post anonymously or under their own name on a post-by-post basis, browse campus posts, vote, comment, repost, answer polls, and check in on a shared mood board.

This started as an InkognitoApp project and is being rebuilt into AnonU.

## What is in the app

- Email/password auth through Firebase
- Anonymous posting with generated pseudonyms
- Optional real-name posting
- Hot, New, and Top feeds
- Upvotes and downvotes
- Poll posts with expiry times
- Image posts, up to 4 images
- Post expiry options: 1h, 6h, 12h, 24h, or 48h
- Tags and tag search
- Reposts
- Nested comments
- Campus mood board with streaks
- Notifications for post activity
- Reports and basic moderator tooling
- Firestore and Storage rules

## Running it locally

Install dependencies:

```bash
flutter pub get
```

Configure Firebase for your project:

```bash
dart pub global activate flutterfire_cli
flutterfire configure
```

That should generate `lib/firebase_options.dart`.

Run the app:

```bash
flutter run
```

For web:

```bash
flutter run -d chrome
```

## Firebase setup

In Firebase, enable:

- Authentication: Email/Password
- Firestore Database
- Firebase Storage
- Firebase Messaging, if push notifications are being used

Then deploy the rules:

```bash
firebase deploy --only firestore:rules,storage
```

## Main collections

```text
/users/{uid}
/posts/{postId}
/posts/{postId}/votes/{uid}
/posts/{postId}/comments/{commentId}
/posts/{postId}/pollVotes/{uid}
/moodBoard/{entryId}
/notifications/{notifId}
/reports/{reportId}
```

Votes live in a subcollection so users can update their own vote without exposing the full voter list to other clients. Mood board entries do not store a readable user id.

## Notes

Anonymous posts still have to be tied to an authenticated account internally so voting, reports, moderation, and abuse prevention can work. The important part is that public-facing post data uses pseudonyms instead of exposing the user's account identity.

Full-text search, production push notification fanout, scheduled cleanup for expired posts, and image moderation are better handled with backend services such as Cloud Functions and a search provider.
