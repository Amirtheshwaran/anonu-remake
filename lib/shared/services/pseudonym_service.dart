import 'dart:math';
import 'package:anonu/core/constants/constants.dart';

class PseudonymService {
  static final Random _random = Random();

  /// Generates a deterministic pseudonym from a UID + postId combo.
  /// Same user always gets same pseudonym within a post thread,
  /// but different pseudonym across different posts.
  static String generateForPost(String uid, String postId) {
    final seed = uid.hashCode ^ postId.hashCode;
    final r = Random(seed);
    final adj = AnonUConstants.adjectives[r.nextInt(AnonUConstants.adjectives.length)];
    final animal = AnonUConstants.animals[r.nextInt(AnonUConstants.animals.length)];
    return '$adj $animal';
  }

  /// Generates a permanent pseudonym for a user (stored in their profile).
  static String generatePermanent(String uid) {
    final seed = uid.hashCode;
    final r = Random(seed);
    final adj = AnonUConstants.adjectives[r.nextInt(AnonUConstants.adjectives.length)];
    final animal = AnonUConstants.animals[r.nextInt(AnonUConstants.animals.length)];
    return '$adj $animal';
  }

  /// Random one for display purposes only
  static String generateRandom() {
    final adj = AnonUConstants.adjectives[_random.nextInt(AnonUConstants.adjectives.length)];
    final animal = AnonUConstants.animals[_random.nextInt(AnonUConstants.animals.length)];
    return '$adj $animal';
  }
}
