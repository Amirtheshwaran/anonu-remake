const { validationResult } = require('express-validator');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const User = require('../models/User');

exports.createComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content } = req.body;
    const { postId } = req.params;
    
    // Check if post exists
    const post = await Post.getPostById(postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Get user data for anonymousId
    let anonymousId;
    if (req.user.isAnonymous) {
      anonymousId = req.user.anonymousId;
    } else {
      const user = await User.getUserById(req.user.id);
      anonymousId = user.username || `User${req.user.id.substring(0, 6)}`;
    }
    
    const newComment = await Comment.createComment({
      postId,
      userId: req.user.id,
      anonymousId,
      content
    });
    
    res.json(newComment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getCommentsByPostId = async (req, res) => {
  try {
    const { postId } = req.params;
    const { limit, startAfter } = req.query;
    
    // Check if post exists
    const post = await Post.getPostById(postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    const comments = await Comment.getCommentsByPostId(postId, {
      limit: parseInt(limit) || 20,
      startAfter: startAfter || null
    });
    
    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { content } = req.body;
    
    // Check if comment exists
    const comment = await Comment.getCommentById(id);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Check if user owns the comment
    if (comment.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this comment' });
    }
    
    const updatedComment = await Comment.updateComment(id, { content });
    
    res.json(updatedComment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if comment exists
    const comment = await Comment.getCommentById(id);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Check if user owns the comment
    if (comment.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }
    
    await Comment.deleteComment(id);
    
    res.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.reportComment = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if comment exists
    const comment = await Comment.getCommentById(id);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    await Comment.reportComment(id);
    
    res.json({ message: 'Comment reported successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
