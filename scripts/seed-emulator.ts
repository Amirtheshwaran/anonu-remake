import * as admin from 'firebase-admin';

export async function seedLegacyData() {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  const db = admin.firestore();
  console.log('Seeding legacy test data in Firestore emulator...');

  const now = admin.firestore.Timestamp.now();

  // 1. Legacy User (un-split, contains private + public info)
  await db.collection('users').doc('user_student_1').set({
    uid: 'user_student_1',
    email: 'student1@university.edu',
    pseudonym: 'Amber Badger',
    displayName: 'Alex Student',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
    currentStreak: 5,
    longestStreak: 12,
    postCount: 3,
    upvotesReceived: 18,
    createdAt: now,
  });

  await db.collection('users').doc('user_student_2').set({
    uid: 'user_student_2',
    email: 'student2@university.edu',
    pseudonym: 'Cyan Kestrel',
    displayName: null,
    avatarUrl: null,
    currentStreak: 1,
    longestStreak: 3,
    postCount: 1,
    upvotesReceived: 4,
    createdAt: now,
  });

  // 2. Legacy Anonymous Post (has authorUid!)
  await db.collection('posts').doc('post_legacy_anon_1').set({
    authorUid: 'user_student_1', // VULNERABILITY TO BE MIGRATED
    identity: 'anonymous',
    pseudonym: 'Amber Badger',
    content: 'Finals week in the science library is absolute madness right now.',
    type: 'text',
    tags: ['academics', 'study'],
    imageUrls: [],
    upvotes: 12,
    downvotes: 1,
    score: 11,
    hotScore: 4.5,
    commentCount: 1,
    repostCount: 0,
    createdAt: now,
    isHidden: false,
    isRepost: false,
  });

  // 3. Legacy Identified Post (has authorUid!)
  await db.collection('posts').doc('post_legacy_identified_2').set({
    authorUid: 'user_student_1', // VULNERABILITY TO BE MIGRATED
    identity: 'identified',
    pseudonym: 'Amber Badger',
    displayName: 'Alex Student',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
    content: 'CS club meeting this Thursday in Hall 302! Free pizza.',
    type: 'text',
    tags: ['events', 'campus-life'],
    imageUrls: [],
    upvotes: 20,
    downvotes: 0,
    score: 20,
    hotScore: 8.2,
    commentCount: 0,
    repostCount: 0,
    createdAt: now,
    isHidden: false,
    isRepost: false,
  });

  // 4. Legacy Poll Post (has authorUid and poll.userVotes!)
  await db.collection('posts').doc('post_legacy_poll_3').set({
    authorUid: 'user_student_2', // VULNERABILITY TO BE MIGRATED
    identity: 'anonymous',
    pseudonym: 'Cyan Kestrel',
    content: 'Which campus dining hall has the best coffee?',
    type: 'poll',
    tags: ['food', 'campus-life'],
    imageUrls: [],
    poll: {
      options: ['North Commons', 'Student Center', 'Library Cafe'],
      votes: { '0': 3, '1': 8, '2': 5 },
      userVotes: { // VULNERABILITY TO BE MIGRATED INTO SUBCOLLECTION
        user_student_1: 1,
        user_student_2: 0,
      },
      endsAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 86400000)),
    },
    upvotes: 16,
    downvotes: 0,
    score: 16,
    hotScore: 6.1,
    commentCount: 0,
    repostCount: 0,
    createdAt: now,
    isHidden: false,
    isRepost: false,
  });

  // 5. Legacy Comment (has authorUid!)
  await db.collection('comments').doc('comment_legacy_1').set({
    postId: 'post_legacy_anon_1',
    authorUid: 'user_student_2', // VULNERABILITY TO BE MIGRATED
    identity: 'anonymous',
    pseudonym: 'Cyan Kestrel',
    content: '3rd floor quiet area still has a few tables open.',
    upvotes: 4,
    downvotes: 0,
    createdAt: now,
  });

  console.log('Legacy test data successfully seeded!');
}

const isMain = process.argv[1]?.includes('seed-emulator');
if (isMain) {
  seedLegacyData().then(() => process.exit(0)).catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
}
