const jwt = require('jsonwebtoken');
const { admin } = require('../config/db');
const config = require('../config/config');

exports.auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if no token
    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    // Verify token
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ message: 'Token is not valid' });
    }
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.anonymousAuth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('x-auth-token');

    // Allow anonymous users - proceed with a null user if no token
    if (!token) {
      // Generate a new anonymous user
      const anonymousAuth = await admin.auth().createAnonymousUser();
      req.user = { id: anonymousAuth.uid, isAnonymous: true };
    } else {
      // Verify token
      try {
        const decoded = jwt.verify(token, config.jwtSecret);
        req.user = decoded;
      } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
      }
    }
    next();
  } catch (err) {
    console.error('Anonymous auth middleware error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.authOptional = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('x-auth-token');

    // If token exists, verify it - otherwise continue as guest
    if (token) {
      try {
        const decoded = jwt.verify(token, config.jwtSecret);
        req.user = decoded;
      } catch (err) {
        // Invalid token, but still continue as guest
        req.user = null;
      }
    } else {
      req.user = null;
    }
    next();
  } catch (err) {
    console.error('Optional auth middleware error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
