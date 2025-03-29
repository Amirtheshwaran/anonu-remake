const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const postController = require('../controllers/postController');
const commentController = require('../controllers/commentController');
const { auth, authOptional } = require('../middleware/auth');
const { validate, contentFilter } = require('../middleware/validation');

// @route   POST api/posts
// @desc    Create a post
// @access  Private
router.post(
  '/',
  [
    auth,
    check('content', 'Content is required').not().isEmpty(),
    validate,
    contentFilter
  ],
  postController.createPost
);

// @route   GET api/posts
// @desc    Get all posts
// @access  Public (with optional auth for liked status)
router.get('/', authOptional, postController.getPosts);

// @route   GET api/posts/:id
// @desc    Get post by ID
// @access  Public (with optional auth for liked status)
router.get('/:id', authOptional, postController.getPostById);

// @route   PUT api/posts/:id
// @desc    Update a post
// @access  Private
router.put(
  '/:id',
  [
    auth,
    check('content', 'Content is required').not().isEmpty(),
    validate,
    contentFilter
  ],
  postController.updatePost
);

// @route   DELETE api/posts/:id
// @desc    Delete a post
// @access  Private
router.delete('/:id', auth, postController.deletePost);

// @route   POST api/posts/:id/like
// @desc    Like a post
// @access  Private
router.post('/:id/like', auth, postController.likePost);

// @route   DELETE api/posts/:id/like
// @desc    Unlike a post
// @access  Private
router.delete('/:id/like', auth, postController.unlikePost);

// @route   POST api/posts/:id/report
// @desc    Report a post
// @access  Private
router.post('/:id/report', auth, postController.reportPost);

// @route   GET api/posts/tags/trending
// @desc    Get trending tags
// @access  Public
router.get('/tags/trending', postController.getTrendingTags);

// Comments Routes

// @route   POST api/posts/:postId/comments
// @desc    Create a comment
// @access  Private
router.post(
  '/:postId/comments',
  [
    auth,
    check('content', 'Content is required').not().isEmpty(),
    validate,
    contentFilter
  ],
  commentController.createComment
);

// @route   GET api/posts/:postId/comments
// @desc    Get all comments for a post
// @access  Public
router.get('/:postId/comments', commentController.getCommentsByPostId);

// @route   PUT api/posts/comments/:id
// @desc    Update a comment
// @access  Private
router.put(
  '/comments/:id',
  [
    auth,
    check('content', 'Content is required').not().isEmpty(),
    validate,
    contentFilter
  ],
  commentController.updateComment
);

// @route   DELETE api/posts/comments/:id
// @desc    Delete a comment
// @access  Private
router.delete('/comments/:id', auth, commentController.deleteComment);

// @route   POST api/posts/comments/:id/report
// @desc    Report a comment
// @access  Private
router.post('/comments/:id/report', auth, commentController.reportComment);

module.exports = router;
