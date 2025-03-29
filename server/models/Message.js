const { db } = require('../config/db');
const admin = require('firebase-admin');

const messagesRef = db.collection('messages');
const conversationsRef = db.collection('conversations');

class Message {
  static async createMessage({ senderId, receiverId, text }) {
    try {
      const batch = db.batch();
      
      // Find or create conversation
      let conversationId;
      const conversationQuery1 = await conversationsRef
        .where('participants', 'array-contains', senderId)
        .where('participantsSet', 'array-contains', receiverId)
        .limit(1)
        .get();
      
      if (conversationQuery1.empty) {
        // Create new conversation
        const conversationRef = conversationsRef.doc();
        conversationId = conversationRef.id;
        
        batch.set(conversationRef, {
          participants: [senderId, receiverId],
          participantsSet: [senderId, receiverId], // For queries
          lastMessage: text,
          lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        conversationId = conversationQuery1.docs[0].id;
        
        // Update existing conversation
        batch.update(conversationsRef.doc(conversationId), {
          lastMessage: text,
          lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      
      // Create message
      const messageRef = messagesRef.doc();
      const newMessage = {
        conversationId,
        senderId,
        receiverId,
        text,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      batch.set(messageRef, newMessage);
      
      await batch.commit();
      
      return {
        id: messageRef.id,
        conversationId,
        ...newMessage,
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }

  static async getMessagesByConversationId(conversationId, { limit = 20, startAfter = null }) {
    try {
      let query = messagesRef
        .where('conversationId', '==', conversationId)
        .orderBy('createdAt', 'desc');
      
      if (startAfter) {
        const startAfterDoc = await messagesRef.doc(startAfter).get();
        if (startAfterDoc.exists) {
          query = query.startAfter(startAfterDoc);
        }
      }
      
      query = query.limit(limit);
      
      const snapshot = await query.get();
      
      const messages = [];
      snapshot.forEach(doc => {
        messages.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return messages;
    } catch (error) {
      console.error('Error getting messages by conversation ID:', error);
      throw error;
    }
  }

  static async getConversationById(id) {
    try {
      const doc = await conversationsRef.doc(id).get();
      
      if (!doc.exists) {
        return null;
      }
      
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('Error getting conversation by ID:', error);
      throw error;
    }
  }

  static async getConversationsByUserId(userId, { limit = 20, startAfter = null }) {
    try {
      let query = conversationsRef
        .where('participants', 'array-contains', userId)
        .orderBy('updatedAt', 'desc');
      
      if (startAfter) {
        const startAfterDoc = await conversationsRef.doc(startAfter).get();
        if (startAfterDoc.exists) {
          query = query.startAfter(startAfterDoc);
        }
      }
      
      query = query.limit(limit);
      
      const snapshot = await query.get();
      
      const conversations = [];
      snapshot.forEach(doc => {
        conversations.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return conversations;
    } catch (error) {
      console.error('Error getting conversations by user ID:', error);
      throw error;
    }
  }

  static async markMessagesAsRead(conversationId, userId) {
    try {
      const batch = db.batch();
      const snapshot = await messagesRef
        .where('conversationId', '==', conversationId)
        .where('receiverId', '==', userId)
        .where('read', '==', false)
        .get();
      
      if (snapshot.empty) {
        return { count: 0 };
      }
      
      let count = 0;
      snapshot.forEach(doc => {
        batch.update(doc.ref, { read: true });
        count++;
      });
      
      await batch.commit();
      
      return { count };
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  static async getUnreadMessageCount(userId) {
    try {
      const snapshot = await messagesRef
        .where('receiverId', '==', userId)
        .where('read', '==', false)
        .get();
      
      return snapshot.size;
    } catch (error) {
      console.error('Error getting unread message count:', error);
      throw error;
    }
  }
}

module.exports = Message;
