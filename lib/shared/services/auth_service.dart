import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/user_model.dart';
import 'pseudonym_service.dart';

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  Stream<User?> get authStateStream => _auth.authStateChanges();
  User? get currentUser => _auth.currentUser;

  Future<UserModel> signUp({
    required String email,
    required String password,
  }) async {
    // Validate university email (customize domain check as needed)
    if (!email.contains('@') || email.length < 6) {
      throw Exception('Please use a valid university email address.');
    }

    final cred = await _auth.createUserWithEmailAndPassword(
      email: email,
      password: password,
    );

    final uid = cred.user!.uid;
    final pseudonym = PseudonymService.generatePermanent(uid);

    final user = UserModel(
      uid: uid,
      email: email,
      pseudonym: pseudonym,
      postCount: 0,
      upvotesReceived: 0,
      currentStreak: 0,
      longestStreak: 0,
      votedPosts: [],
      joinedAt: DateTime.now(),
      isModerator: false,
    );

    await _db.collection('users').doc(uid).set(user.toFirestore());

    // Send email verification
    await cred.user!.sendEmailVerification();

    return user;
  }

  Future<UserModel> signIn({
    required String email,
    required String password,
  }) async {
    final cred = await _auth.signInWithEmailAndPassword(
      email: email,
      password: password,
    );

    return _ensureUserProfile(cred.user!);
  }

  Future<UserModel> signInAnonymously() async {
    final cred = await _auth.signInAnonymously();
    return _ensureUserProfile(cred.user!);
  }

  Future<void> signOut() => _auth.signOut();

  Future<void> resetPassword(String email) =>
      _auth.sendPasswordResetEmail(email: email);

  Stream<UserModel?> userStream(String uid) {
    return _db.collection('users').doc(uid).snapshots().map(
        (d) => d.exists ? UserModel.fromFirestore(d) : null);
  }

  Future<UserModel?> getUser(String uid) async {
    final doc = await _db.collection('users').doc(uid).get();
    return doc.exists ? UserModel.fromFirestore(doc) : null;
  }

  Future<void> updateProfile({
    String? displayName,
    String? avatarUrl,
  }) async {
    final uid = _auth.currentUser!.uid;
    final updates = <String, dynamic>{};
    if (displayName != null) updates['displayName'] = displayName;
    if (avatarUrl != null) updates['avatarUrl'] = avatarUrl;
    await _db.collection('users').doc(uid).update(updates);
  }

  Future<UserModel> _ensureUserProfile(User firebaseUser) async {
    final ref = _db.collection('users').doc(firebaseUser.uid);
    final doc = await ref.get();
    if (doc.exists) return UserModel.fromFirestore(doc);

    final user = UserModel(
      uid: firebaseUser.uid,
      email: firebaseUser.email ?? '',
      pseudonym: PseudonymService.generatePermanent(firebaseUser.uid),
      displayName: firebaseUser.displayName,
      avatarUrl: firebaseUser.photoURL,
      postCount: 0,
      upvotesReceived: 0,
      currentStreak: 0,
      longestStreak: 0,
      votedPosts: const [],
      joinedAt: DateTime.now(),
      isModerator: false,
    );
    await ref.set(user.toFirestore());
    return user;
  }

  Future<void> checkInMood(String uid, String mood) async {
    final userRef = _db.collection('users').doc(uid);
    final userDoc = await userRef.get();
    final user = UserModel.fromFirestore(userDoc);

    final now = DateTime.now();
    final lastCheckIn = user.lastMoodCheckIn;
    int newStreak = user.currentStreak;

    if (lastCheckIn != null) {
      final diff = now.difference(lastCheckIn).inDays;
      if (diff == 1) {
        newStreak += 1;
      } else if (diff > 1) {
        newStreak = 1; // streak broken
      }
      // diff == 0 means already checked in today, don't update streak
    } else {
      newStreak = 1;
    }

    final longestStreak = newStreak > user.longestStreak ? newStreak : user.longestStreak;

    final batch = _db.batch();
    batch.update(userRef, {
      'lastMood': mood,
      'lastMoodCheckIn': Timestamp.fromDate(now),
      'currentStreak': newStreak,
      'longestStreak': longestStreak,
    });

    batch.set(_db.collection('moodBoard').doc(), {
      'mood': mood,
      'createdAt': Timestamp.fromDate(now),
    });
    await batch.commit();
  }

  Stream<Map<String, int>> moodBoardStream() {
    final since = DateTime.now().subtract(const Duration(hours: 24));
    return _db
        .collection('moodBoard')
        .where('createdAt', isGreaterThan: Timestamp.fromDate(since))
        .snapshots()
        .map((snap) {
      final counts = <String, int>{};
      for (final doc in snap.docs) {
        final mood = doc.data()['mood'] as String;
        counts[mood] = (counts[mood] ?? 0) + 1;
      }
      return counts;
    });
  }
}
