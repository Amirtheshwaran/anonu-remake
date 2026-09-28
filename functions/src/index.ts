import * as admin from 'firebase-admin';

admin.initializeApp();

export { createPost } from './callable/createPost';
export { createComment } from './callable/createComment';
export { checkInMood } from './callable/checkInMood';
export { votePoll } from './callable/votePoll';
export { repostPost } from './callable/repostPost';
export { resolveReport } from './callable/resolveReport';
export { onVoteWrite } from './triggers/onVoteWrite';
export { onUserCreate } from './triggers/onUserCreate';
export { cleanupExpiredPosts } from './scheduled/cleanupExpiredPosts';
