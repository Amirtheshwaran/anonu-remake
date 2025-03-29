const { db } = require('../config/db');
const admin = require('firebase-admin');

const commentsRef = db.collection('comments');
const postsRef = db.collection('posts');

class Comment {
  static async createComment({ postId, userId, anonymousId, content }) {
    try {
      const batch = db.batch();
      
      // Create new comment
      const commentRef = commentsRef.doc();
      const newComment = {
        postId,
        userId,
        anonymousId,
        content,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        isRemoved: false,
        reports: 0
      };
      
      batch.set(commentRef, newComment);
      
      // Increment comment count in post
      const postRef = postsRef.doc(postId);
      batch.update(postRef, {
        comments: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      await batch.commit();
      
      return {
        id: commentRef.id,
        ...newComment,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  }

  static async getCommentsByPostId(postId, { limit = 20, startAfter = null }) {
    try {
      let query = commentsRef
        .where('postId', '==', postId)
        .where('isRemoved', '==', false)
        .orderBy('createdAt', 'desc');
      
      if (startAfter) {
        const startAfterDoc = await commentsRef.doc(startAfter).get();
        if (startAfterDoc.exists) {
          query = query.startAfter(startAfterDoc);
        }
      }
      
      query = query.limit(limit);
      
      const snapshot = await query.get();
      
      const comments = [];
      snapshot.forEach(doc => {
        comments.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return comments;
    } catch (error) {
      console.error('Error getting comments by post ID:', error);
      throw error;
    }
  }

  static async getCommentById(id) {
    try {
      const doc = await commentsRef.doc(id).get();
      
      if (!doc.exists) {
        return null;
      }
      
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('Error getting comment by ID:', error);
      throw error;
    }
  }

  static async updateComment(id, updates) {
    try {
      await commentsRef.doc(id).update({
        ...updates,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      const updatedComment = await commentsRef.doc(id).get();
      
      return {
        id: updatedComment.id,
        ...updatedComment.data()
      };
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  }

  static async deleteComment(id) {
    try {
      const commentDoc = await commentsRef.doc(id).get();
      
      if (!commentDoc.exists) {
        throw new Error('Comment not found');
      }
      
      const batch = db.batch();
      
      // Mark comment as removed
      batch.update(commentsRef.doc(id), {
        isRemoved: true,
        content: '[This comment has been removed]',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Decrement comment count in post
      const postId = commentDoc.data().postId;
      const postRef = postsRef.doc(postId);
      batch.update(postRef, {
        comments: admin.firestore.FieldValue.increment(-1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      await batch.commit();
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }

  static async reportComment(id) {
    try {
      await commentsRef.doc(id).update({
        reports: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error reporting comment:', error);
      throw error;
    }
  }
}

module.exports = Comment;
