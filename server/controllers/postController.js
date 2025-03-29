const { validationResult } = require('express-validator');
const Post = require('../models/Post');
const User = require('../models/User');

exports.createPost = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, tags, isPublic, images } = req.body;
    
    // Get user data
    let anonymousId;
    if (req.user.isAnonymous) {
      anonymousId = req.user.anonymousId;
    } else {
      const user = await User.getUserById(req.user.id);
      anonymousId = user.username || `User${req.user.id.substring(0, 6)}`;
    }

    const newPost = await Post.createPost({
      userId: req.user.id,
      anonymousId,
      content,
      tags: tags || [],
      isPublic: isPublic !== false,
      images: images || []
    });

    res.json(newPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPosts = async (req, res) => {
  try {
    const { limit, startAfter, tags, sortBy } = req.query;
    
    const posts = await Post.getPosts({
      limit: parseInt(limit) || 10,
      startAfter: startAfter || null,
      tags: tags ? tags.split(',') : [],
      sortBy: sortBy || 'recent'
    });
    
    // Check if user has liked each post
    if (req.user) {
      const Like = require('../models/Like');
      
      for (let post of posts) {
        post.isLiked = await Like.checkIfUserLiked({
          postId: post.id,
          userId: req.user.id
        }).catch(() => false);
      }
    }
    
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPostById = async (req, res) => {
  try {
    const post = await Post.getPostById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if user has liked the post
    if (req.user) {
      const Like = require('../models/Like');
      
      post.isLiked = await Like.checkIfUserLiked({
        postId: post.id,
        userId: req.user.id
      }).catch(() => false);
    }
    
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if post exists
    const post = await Post.getPostById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if user owns the post
    if (post.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this post' });
    }
    
    const { content, tags, isPublic } = req.body;
    
    const updatedPost = await Post.updatePost(req.params.id, {
      content,
      tags,
      isPublic
    });
    
    res.json(updatedPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deletePost = async (req, res) => {
  try {
    // Check if post exists
    const post = await Post.getPostById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if user owns the post
    if (post.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }
    
    await Post.deletePost(req.params.id);
    
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.likePost = async (req, res) => {
  try {
    // Check if post exists
    const post = await Post.getPostById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    const Like = require('../models/Like');
    
    await Like.createLike({
      postId: req.params.id,
      userId: req.user.id
    });
    
    res.json({ message: 'Post liked successfully' });
  } catch (err) {
    // If user has already liked the post, send appropriate response
    if (err.message === 'User has already liked this post') {
      return res.status(400).json({ message: err.message });
    }
    
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.unlikePost = async (req, res) => {
  try {
    // Check if post exists
    const post = await Post.getPostById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    const Like = require('../models/Like');
    
    await Like.removeLike({
      postId: req.params.id,
      userId: req.user.id
    });
    
    res.json({ message: 'Post unliked successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.reportPost = async (req, res) => {
  try {
    // Check if post exists
    const post = await Post.getPostById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    await Post.reportPost(req.params.id);
    
    res.json({ message: 'Post reported successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTrendingTags = async (req, res) => {
  try {
    const { limit } = req.query;
    
    const tags = await Post.getTrendingTags(parseInt(limit) || 10);
    
    res.json(tags);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
