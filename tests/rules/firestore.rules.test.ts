import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import * as fs from 'fs';
import * as path from 'path';

describe('AnonU Firestore Security Rules', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    const rulesPath = path.resolve(__dirname, '../../firestore.rules');
    const rules = fs.readFileSync(rulesPath, 'utf8');

    testEnv = await initializeTestEnvironment({
      projectId: 'anonu-test-rules',
      firestore: {
        rules,
        host: '127.0.0.1',
        port: 8080,
      },
    });
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  beforeEach(async () => {
    if (testEnv) {
      await testEnv.clearFirestore();
    }
  });

  it('unauthenticated users cannot read posts', async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(unauthedDb.collection('posts').get());
  });

  it('signed-in users can read public posts', async () => {
    const authedDb = testEnv.authenticatedContext('user_123', { email_verified: true }).firestore();
    await assertSucceeds(authedDb.collection('posts').get());
  });

  it('regular users cannot read postAuthors private mapping', async () => {
    const authedDb = testEnv.authenticatedContext('user_123', { email_verified: true }).firestore();
    await assertFails(authedDb.collection('postAuthors').doc('post_1').get());
  });

  it('regular users cannot read commentAuthors private mapping', async () => {
    const authedDb = testEnv.authenticatedContext('user_123', { email_verified: true }).firestore();
    await assertFails(authedDb.collection('commentAuthors').doc('comment_1').get());
  });

  it('clients cannot create or update posts directly (server-only via Functions)', async () => {
    const authedDb = testEnv.authenticatedContext('user_123', { email_verified: true }).firestore();
    await assertFails(
      authedDb.collection('posts').doc('fake_post').set({
        content: 'Hacked direct post',
        authorUid: 'user_123',
      })
    );
  });

  it('clients cannot directly modify post score, counters, or isHidden', async () => {
    // Seed post via admin context
    await testEnv.withSecurityRulesDisabled(async (adminContext) => {
      await adminContext.firestore().collection('posts').doc('post_1').set({
        content: 'Original post',
        score: 5,
        upvotes: 5,
        downvotes: 0,
        isHidden: false,
      });
    });

    const authedDb = testEnv.authenticatedContext('user_123', { email_verified: true }).firestore();
    await assertFails(
      authedDb.collection('posts').doc('post_1').update({
        score: 9999,
        isHidden: true,
      })
    );
  });

  it('verified users can vote on a post in the votes subcollection', async () => {
    const authedDb = testEnv.authenticatedContext('user_123', { email_verified: true }).firestore();
    await assertSucceeds(
      authedDb.collection('posts').doc('post_1').collection('votes').doc('user_123').set({
        vote: true,
      })
    );
  });

  it('users cannot cast votes on behalf of another user UID', async () => {
    const authedDb = testEnv.authenticatedContext('user_123', { email_verified: true }).firestore();
    await assertFails(
      authedDb.collection('posts').doc('post_1').collection('votes').doc('other_user_456').set({
        vote: true,
      })
    );
  });

  it('unverified users cannot vote', async () => {
    const unverifiedDb = testEnv.authenticatedContext('user_unverified', { email_verified: false }).firestore();
    await assertFails(
      unverifiedDb.collection('posts').doc('post_1').collection('votes').doc('user_unverified').set({
        vote: true,
      })
    );
  });

  it('users cannot read other users poll votes in pollVotes subcollection', async () => {
    await testEnv.withSecurityRulesDisabled(async (adminContext) => {
      await adminContext.firestore().collection('posts').doc('post_1').collection('pollVotes').doc('other_user').set({
        optionIndex: 1,
      });
    });

    const authedDb = testEnv.authenticatedContext('user_123', { email_verified: true }).firestore();
    await assertFails(
      authedDb.collection('posts').doc('post_1').collection('pollVotes').doc('other_user').get()
    );
  });

  it('users can read their own poll vote in pollVotes subcollection', async () => {
    await testEnv.withSecurityRulesDisabled(async (adminContext) => {
      await adminContext.firestore().collection('posts').doc('post_1').collection('pollVotes').doc('user_123').set({
        optionIndex: 2,
      });
    });

    const authedDb = testEnv.authenticatedContext('user_123', { email_verified: true }).firestore();
    await assertSucceeds(
      authedDb.collection('posts').doc('post_1').collection('pollVotes').doc('user_123').get()
    );
  });

  it('users can read and edit their own private user account doc', async () => {
    const authedDb = testEnv.authenticatedContext('user_123', { email_verified: true }).firestore();
    await assertSucceeds(
      authedDb.collection('users').doc('user_123').set({
        email: 'user@university.edu',
        currentStreak: 2,
      })
    );
  });

  it('users CANNOT read another users private user account doc', async () => {
    await testEnv.withSecurityRulesDisabled(async (adminContext) => {
      await adminContext.firestore().collection('users').doc('secret_user').set({
        email: 'secret@university.edu',
        pseudonym: 'Secret Agent',
      });
    });

    const authedDb = testEnv.authenticatedContext('user_123', { email_verified: true }).firestore();
    await assertFails(
      authedDb.collection('users').doc('secret_user').get()
    );
  });

  it('users can read any public profile doc', async () => {
    await testEnv.withSecurityRulesDisabled(async (adminContext) => {
      await adminContext.firestore().collection('profiles').doc('student_a').set({
        displayName: 'Student A',
      });
    });

    const authedDb = testEnv.authenticatedContext('user_123', { email_verified: true }).firestore();
    await assertSucceeds(
      authedDb.collection('profiles').doc('student_a').get()
    );
  });

  it('clients cannot create notifications directly', async () => {
    const authedDb = testEnv.authenticatedContext('user_notif_creator', { email_verified: true }).firestore();
    await assertFails(
      authedDb.collection('notifications').add({
        recipientUid: 'target_user',
        message: 'Fake notification',
      })
    );
  });

  it('users can only read notifications intended for them', async () => {
    await testEnv.withSecurityRulesDisabled(async (adminContext) => {
      const adminDb = adminContext.firestore();
      await adminDb.collection('notifications').doc('notif_1').set({
        recipientUid: 'user_recipient_456',
        message: 'Your post was upvoted',
        isRead: false,
      });
      await adminDb.collection('notifications').doc('notif_2').set({
        recipientUid: 'other_user_789',
        message: 'Other alert',
        isRead: false,
      });
    });

    const authedDb = testEnv.authenticatedContext('user_recipient_456', { email_verified: true }).firestore();
    await assertSucceeds(
      authedDb.collection('notifications').doc('notif_1').get()
    );
    await assertFails(
      authedDb.collection('notifications').doc('notif_2').get()
    );
  });

  it('moderators can read reports, regular users cannot', async () => {
    await testEnv.withSecurityRulesDisabled(async (adminContext) => {
      const adminDb = adminContext.firestore();
      await adminDb.collection('reports').doc('report_1').set({
        reason: 'Spam',
        postId: 'post_1',
      });
    });

    const regularDb = testEnv.authenticatedContext('regular_user_999', { email_verified: true }).firestore();
    await assertFails(regularDb.collection('reports').doc('report_1').get());

    const modDb = testEnv.authenticatedContext('mod_user_888', { email_verified: true, isModerator: true, moderator: true }).firestore();
    await assertSucceeds(modDb.collection('reports').doc('report_1').get());
  });
});
