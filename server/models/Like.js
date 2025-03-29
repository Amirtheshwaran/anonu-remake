const { db } = require('../config/db');
const admin = require('firebase-admin');

const likesRef = db.collection('likes');
const postsRef = db.collection('posts');

class Like {
  static async createLike({ postId, userId }) {
    try {
      // Check if like already exists
      const existingLike = await likesRef
        .where('postId', '==', postId)
        .where('userId', '==', userId)
        .get();
      
      if (!existingLike.empty) {
        throw new Error('User has already liked this post');
      }
      
      const batch = db.batch();
      
      // Create like document
      const likeRef = likesRef.doc();
      const newLike = {
        postId,
        userId,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      batch.set(likeRef, newLike);
      
      // Increment like count in post
      const postRef = postsRef.doc(postId);
      batch.update(postRef, {
        likes: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      await batch.commit();
      
      return {
        id: likeRef.id,
        ...newLike,
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Error creating like:', error);
      throw error;
    }
  }

  static async removeLike({ postId, userId }) {
    try {
      const snapshot = await likesRef
        .where('postId', '==', postId)
        .where('userId', '==', userId)
        .get();
      
      if (snapshot.empty) {
        throw new Error('Like not found');
      }
      
      const batch = db.batch();
      
      // Delete like document
      const likeDoc = snapshot.docs[0];
      batch.delete(likeDoc.ref);
      
      // Decrement like count in post
      const postRef = postsRef.doc(postId);
      batch.update(postRef, {
        likes: admin.firestore.FieldValue.increment(-1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      await batch.commit();
      
      return { success: true };
    } catch (error) {
      console.error('Error removing like:', error);
      throw error;
    }
  }

  static async checkIfUserLiked({ postId, userId }) {
    try {
      const snapshot = await likesRef
        .where('postId', '==', postId)
        .where('userId', '==', userId)
        .limit(1)
        .get();
      
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking if user liked post:', error);
      throw error;
    }
  }

  static async getLikesByPostId(postId, { limit = 20, startAfter = null }) {
    try {
      let query = likesRef
        .where('postId', '==', postId)
        .orderBy('createdAt', 'desc');
      
      if (startAfter) {
        const startAfterDoc = await likesRef.doc(startAfter).get();
        if (startAfterDoc.exists) {
          query = query.startAfter(startAfterDoc);
        }
      }
      
      query = query.limit(limit);
      
      const snapshot = await query.get();
      
      const likes = [];
      snapshot.forEach(doc => {
        likes.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return likes;
    } catch (error) {
      console.error('Error getting likes by post ID:', error);
      throw error;
    }
  }
}

module.exports = Like;
