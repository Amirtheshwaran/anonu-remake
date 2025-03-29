const { db } = require('../config/db');

const usersRef = db.collection('users');

class User {
  static async createUser(userData) {
    try {
      const { id, ...rest } = userData;
      const docRef = id ? usersRef.doc(id) : usersRef.doc();
      await docRef.set({
        ...rest,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      return {
        id: docRef.id,
        ...rest
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async createAnonymousUser() {
    try {
      // Generate a unique anonymous ID
      const anonymousId = 'Anonymous' + Math.floor(100000 + Math.random() * 900000);
      
      const docRef = usersRef.doc();
      await docRef.set({
        anonymousId,
        isAnonymous: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      return {
        id: docRef.id,
        anonymousId,
        isAnonymous: true
      };
    } catch (error) {
      console.error('Error creating anonymous user:', error);
      throw error;
    }
  }

  static async getUserById(id) {
    try {
      const doc = await usersRef.doc(id).get();
      if (!doc.exists) {
        return null;
      }
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }

  static async getUserByAnonymousId(anonymousId) {
    try {
      const snapshot = await usersRef.where('anonymousId', '==', anonymousId).get();
      
      if (snapshot.empty) {
        return null;
      }
      
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('Error getting user by anonymous ID:', error);
      throw error;
    }
  }

  static async updateUser(id, updates) {
    try {
      const userRef = usersRef.doc(id);
      await userRef.update({
        ...updates,
        updatedAt: new Date()
      });
      
      const updatedUser = await userRef.get();
      
      return {
        id: updatedUser.id,
        ...updatedUser.data()
      };
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  static async deleteUser(id) {
    try {
      await usersRef.doc(id).delete();
      return { success: true };
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
}

module.exports = User;
