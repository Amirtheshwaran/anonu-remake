import * as admin from 'firebase-admin';

interface MigrationStats {
  postsExamined: number;
  postsMigrated: number;
  commentsExamined: number;
  commentsMigrated: number;
  pollVotesMigrated: number;
  profilesCreated: number;
}

export async function runMigration(options: { dryRun?: boolean } = {}) {
  const isDryRun = options.dryRun !== false;
  console.log(`\n======================================================`);
  console.log(`Starting AnonU Author UID & Privacy Data Migration`);
  console.log(`Mode: ${isDryRun ? 'DRY RUN (No changes will be written)' : 'LIVE EXECUTION'}`);
  console.log(`======================================================\n`);

  if (!admin.apps.length) {
    admin.initializeApp();
  }

  const db = admin.firestore();
  const stats: MigrationStats = {
    postsExamined: 0,
    postsMigrated: 0,
    commentsExamined: 0,
    commentsMigrated: 0,
    pollVotesMigrated: 0,
    profilesCreated: 0,
  };

  const now = admin.firestore.Timestamp.now();

  // 1. Migrate Posts
  console.log('--- Step 1: Scanning Posts ---');
  const postsSnap = await db.collection('posts').get();
  stats.postsExamined = postsSnap.size;

  for (const postDoc of postsSnap.docs) {
    const postData = postDoc.data();
    const postId = postDoc.id;
    const authorUid = postData.authorUid;
    const isAnonymous = postData.identity !== 'identified';
    const poll = postData.poll;

    let needsUpdate = false;
    const postUpdates: Record<string, any> = {};

    if (authorUid) {
      needsUpdate = true;
      stats.postsMigrated++;

      if (!isDryRun) {
        // Write to private mapping
        await db.collection('postAuthors').doc(postId).set({
          uid: authorUid,
          createdAt: postData.createdAt || now,
          migratedAt: now,
        });

        // Prepare post updates
        postUpdates.authorUid = admin.firestore.FieldValue.delete();
        if (!isAnonymous) {
          postUpdates.authorProfileId = authorUid;
        } else {
          postUpdates.authorProfileId = null;
        }
      }
    }

    // Migrate poll.userVotes if present
    if (poll && poll.userVotes && typeof poll.userVotes === 'object') {
      const userVotesMap = poll.userVotes as Record<string, any>;
      const userVoteEntries = Object.entries(userVotesMap);

      if (userVoteEntries.length > 0) {
        needsUpdate = true;
        stats.pollVotesMigrated += userVoteEntries.length;

        if (!isDryRun) {
          for (const [voterUid, opt] of userVoteEntries) {
            const optIndex = typeof opt === 'number' ? opt : parseInt(String(opt), 10) || 0;
            await db
              .collection('posts')
              .doc(postId)
              .collection('pollVotes')
              .doc(voterUid)
              .set({
                optionIndex: optIndex,
                migratedAt: now,
              });
          }
          postUpdates['poll.userVotes'] = admin.firestore.FieldValue.delete();
        }
      }
    }

    if (needsUpdate && !isDryRun) {
      await db.collection('posts').doc(postId).update(postUpdates);
    }
  }
  console.log(`Posts checked: ${stats.postsExamined}, Posts with authorUid/poll migrated: ${stats.postsMigrated}`);

  // 2. Migrate Comments
  console.log('\n--- Step 2: Scanning Comments ---');
  const commentsSnap = await db.collection('comments').get();
  stats.commentsExamined = commentsSnap.size;

  for (const commentDoc of commentsSnap.docs) {
    const commentData = commentDoc.data();
    const commentId = commentDoc.id;
    const authorUid = commentData.authorUid;
    const isAnonymous = commentData.identity !== 'identified';

    if (authorUid) {
      stats.commentsMigrated++;

      if (!isDryRun) {
        // Write to private comment author mapping
        await db.collection('commentAuthors').doc(commentId).set({
          uid: authorUid,
          postId: commentData.postId || '',
          createdAt: commentData.createdAt || now,
          migratedAt: now,
        });

        const commentUpdates: Record<string, any> = {
          authorUid: admin.firestore.FieldValue.delete(),
          authorProfileId: !isAnonymous ? authorUid : null,
        };

        await db.collection('comments').doc(commentId).update(commentUpdates);
      }
    }
  }
  console.log(`Comments checked: ${stats.commentsExamined}, Comments with authorUid migrated: ${stats.commentsMigrated}`);

  // 3. Migrate Users into Split Profiles
  console.log('\n--- Step 3: Scanning Users for Split Profiles ---');
  const usersSnap = await db.collection('users').get();

  for (const userDoc of usersSnap.docs) {
    const userData = userDoc.data();
    const uid = userDoc.id;

    const profileRef = db.collection('profiles').doc(uid);
    const profileSnap = await profileRef.get();

    if (!profileSnap.exists) {
      stats.profilesCreated++;

      if (!isDryRun) {
        await profileRef.set({
          displayName: userData.displayName || null,
          avatarUrl: userData.avatarUrl || null,
          createdAt: userData.createdAt || now,
        });
      }
    }
  }
  console.log(`Users scanned: ${usersSnap.size}, New public profiles created: ${stats.profilesCreated}`);

  console.log(`\n======================================================`);
  console.log(`Migration Summary (${isDryRun ? 'DRY RUN' : 'COMPLETED'})`);
  console.log(`------------------------------------------------------`);
  console.log(`Posts Migrated:       ${stats.postsMigrated} / ${stats.postsExamined}`);
  console.log(`Comments Migrated:    ${stats.commentsMigrated} / ${stats.commentsExamined}`);
  console.log(`Poll Votes Migrated:  ${stats.pollVotesMigrated}`);
  console.log(`Profiles Created:     ${stats.profilesCreated}`);
  console.log(`======================================================\n`);

  return stats;
}

const isMain = process.argv[1]?.includes('migrate-author-uids');
if (isMain) {
  const isLive = process.argv.includes('--live');
  runMigration({ dryRun: !isLive }).then(() => process.exit(0)).catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}
