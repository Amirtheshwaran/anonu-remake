const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const messageController = require('../controllers/messageController');
const { auth } = require('../middleware/auth');
const { validate, contentFilter } = require('../middleware/validation');

// @route   POST api/messages
// @desc    Send a message
// @access  Private
router.post(
  '/',
  [
    auth,
    check('receiverId', 'Receiver ID is required').not().isEmpty(),
    check('text', 'Message text is required').not().isEmpty(),
    validate,
    contentFilter
  ],
  messageController.sendMessage
);

// @route   GET api/messages/conversations
// @desc    Get all conversations
// @access  Private
router.get('/conversations', auth, messageController.getConversations);

// @route   GET api/messages/conversations/:conversationId
// @desc    Get messages in a conversation
// @access  Private
router.get('/conversations/:conversationId', auth, messageController.getMessages);

// @route   GET api/messages/unread
// @desc    Get unread message count
// @access  Private
router.get('/unread', auth, messageController.getUnreadCount);

// @route   POST api/messages/anonymous
// @desc    Send message to user by anonymous ID
// @access  Private
router.post(
  '/anonymous',
  [
    auth,
    check('anonymousId', 'Anonymous ID is required').not().isEmpty(),
    check('text', 'Message text is required').not().isEmpty(),
    validate,
    contentFilter
  ],
  messageController.sendAnonymousMessage
);

module.exports = router;
