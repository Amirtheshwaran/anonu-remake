const { validationResult } = require('express-validator');
const Message = require('../models/Message');
const User = require('../models/User');

exports.sendMessage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { receiverId, text } = req.body;
    
    // Check if receiver exists
    const receiver = await User.getUserById(receiverId);
    
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }
    
    const message = await Message.createMessage({
      senderId: req.user.id,
      receiverId,
      text
    });
    
    res.json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const { limit, startAfter } = req.query;
    
    const conversations = await Message.getConversationsByUserId(req.user.id, {
      limit: parseInt(limit) || 20,
      startAfter: startAfter || null
    });
    
    // Get user data for each conversation
    const enrichedConversations = await Promise.all(conversations.map(async (conversation) => {
      // Get the other participant (not the current user)
      const otherParticipantId = conversation.participants.find(id => id !== req.user.id);
      
      if (!otherParticipantId) {
        return conversation; // Fallback if something is wrong
      }
      
      try {
        const user = await User.getUserById(otherParticipantId);
        
        return {
          ...conversation,
          otherUser: user ? {
            id: user.id,
            anonymousId: user.anonymousId || user.username,
            isAnonymous: user.isAnonymous
          } : null
        };
      } catch (error) {
        console.error('Error getting user data for conversation:', error);
        return conversation;
      }
    }));
    
    res.json(enrichedConversations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit, startAfter } = req.query;
    
    // Check if conversation exists
    const conversation = await Message.getConversationById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    // Check if user is part of the conversation
    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to view this conversation' });
    }
    
    const messages = await Message.getMessagesByConversationId(conversationId, {
      limit: parseInt(limit) || 20,
      startAfter: startAfter || null
    });
    
    // Mark messages as read
    await Message.markMessagesAsRead(conversationId, req.user.id);
    
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Message.getUnreadMessageCount(req.user.id);
    
    res.json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.sendAnonymousMessage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { anonymousId, text } = req.body;
    
    // Try to find user by anonymousId
    const receiver = await User.getUserByAnonymousId(anonymousId);
    
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }
    
    const message = await Message.createMessage({
      senderId: req.user.id,
      receiverId: receiver.id,
      text
    });
    
    res.json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
