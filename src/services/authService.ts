import { auth, firestore, functions } from './firebase';
import { UserModel } from '../types/user';

export const authService = {
  getCurrentUser() {
    return auth().currentUser;
  },

  onAuthStateChanged(callback: (user: any) => void) {
    return auth().onAuthStateChanged(callback);
  },

  async signIn(email: string, pass: string) {
    return auth().signInWithEmailAndPassword(email, pass);
  },

  async signUp(email: string, pass: string) {
    const cred = await auth().createUserWithEmailAndPassword(email, pass);
    if (cred.user) {
      await cred.user.sendEmailVerification();
    }
    return cred;
  },

  async signInAnonymously() {
    return auth().signInAnonymously();
  },

  async signOut() {
    return auth().signOut();
  },

  async sendPasswordResetEmail(email: string) {
    return auth().sendPasswordResetEmail(email);
  },

  async getUser(uid: string): Promise<UserModel | null> {
    const userDoc = await firestore().collection('users').doc(uid).get();
    if (!userDoc.exists) return null;

    const userData = userDoc.data() || {};
    const profileDoc = await firestore().collection('profiles').doc(uid).get();
    const profileData = profileDoc.exists ? profileDoc.data() || {} : {};

    return {
      uid,
      email: userData.email || '',
      pseudonym: userData.pseudonym || 'Campus Member',
      displayName: profileData.displayName || null,
      avatarUrl: profileData.avatarUrl || null,
      currentStreak: userData.currentStreak || 0,
      longestStreak: userData.longestStreak || 0,
      postCount: userData.postCount || 0,
      upvotesReceived: userData.upvotesReceived || 0,
      lastMood: userData.lastMood || null,
      lastMoodDate: userData.lastMoodDate || null,
      isModerator: userData.isModerator || false,
      createdAt: userData.createdAt ? userData.createdAt.toDate() : new Date(),
    };
  },

  async updatePublicProfile(uid: string, displayName?: string | null, avatarUrl?: string | null) {
    const updateData: Record<string, any> = {
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };
    if (displayName !== undefined) updateData.displayName = displayName;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    return firestore().collection('profiles').doc(uid).set(updateData, { merge: true });
  },

  async checkInMood(mood: string) {
    const checkInFn = functions().httpsCallable('checkInMood');
    const result = await checkInFn({ mood });
    return result.data as { success: boolean; currentStreak: number; longestStreak: number };
  },
};
