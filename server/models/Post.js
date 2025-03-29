const { db } = require('../config/db');
const admin = require('firebase-admin');

const postsRef = db.collection('posts');

class Post {
  static async createPost({ userId, anonymousId, content, tags = [], isPublic = true, images = [] }) {
    try {
      const docRef = postsRef.doc();
      
      const newPost = {
        userId,
        anonymousId,
        content,
        tags,
        isPublic,
        images,
        likes: 0,
        comments: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        reports: 0,
        isRemoved: false
      };
      
      await docRef.set(newPost);
      
      return {
        id: docRef.id,
        ...newPost,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  static async getPostById(id) {
    try {
      const doc = await postsRef.doc(id).get();
      
      if (!doc.exists) {
        return null;
      }
      
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('Error getting post by ID:', error);
      throw error;
    }
  }

  static async getPosts({ limit = 10, startAfter = null, tags = [], sortBy = 'recent' }) {
    try {
      let query = postsRef.where('isRemoved', '==', false);
      
      // Filter by tags if provided
      if (tags && tags.length > 0) {
        query = query.where('tags', 'array-contains-any', tags);
      }
      
      // Apply sorting
      switch (sortBy) {
        case 'popular':
          query = query.orderBy('likes', 'desc');
          break;
        case 'comments':
          query = query.orderBy('comments', 'desc');
          break;
        case 'recent':
        default:
          query = query.orderBy('createdAt', 'desc');
      }
      
      // Apply pagination
      if (startAfter) {
        const startAfterDoc = await postsRef.doc(startAfter).get();
        if (startAfterDoc.exists) {
          query = query.startAfter(startAfterDoc);
        }
      }
      
      // Limit the number of results
      query = query.limit(limit);
      
      // Execute the query
      const snapshot = await query.get();
      
      // Return posts array
      const posts = [];
      snapshot.forEach(doc => {
        posts.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return posts;
    } catch (error) {
      console.error('Error getting posts:', error);
      throw error;
    }
  }

  static async updatePost(id, updates) {
    try {
      const postRef = postsRef.doc(id);
      
      await postRef.update({
        ...updates,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      const updatedPost = await postRef.get();
      
      return {
        id: updatedPost.id,
        ...updatedPost.data()
      };
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  }

  static async deletePost(id) {
    try {
      await postsRef.doc(id).update({
        isRemoved: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }

  static async hardDeletePost(id) {
    try {
      await postsRef.doc(id).delete();
      return { success: true };
    } catch (error) {
      console.error('Error hard deleting post:', error);
      throw error;
    }
  }

  static async reportPost(id) {
    try {
      await postsRef.doc(id).update({
        reports: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error reporting post:', error);
      throw error;
    }
  }

  static async getTrendingTags(limit = 10) {
    try {
      // Get all posts from the last 7 days
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const snapshot = await postsRef
        .where('createdAt', '>=', oneWeekAgo)
        .orderBy('createdAt', 'desc')
        .get();
      
      // Count occurrences of each tag
      const tagCounts = {};
      
      snapshot.forEach(doc => {
        const post = doc.data();
        if (post.tags && Array.isArray(post.tags)) {
          post.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      });
      
      // Convert to array and sort
      const sortedTags = Object.entries(tagCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
      
      return sortedTags;
    } catch (error) {
      console.error('Error getting trending tags:', error);
      throw error;
    }
  }
}

module.exports = Post;
