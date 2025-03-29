const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const { admin } = require('../config/db');
const User = require('../models/User');
const config = require('../config/config');

exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, username } = req.body;

    // Check if user already exists
    const userRecord = await admin.auth().getUserByEmail(email).catch(() => null);
    
    if (userRecord) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user in Firebase Auth
    const newUser = await admin.auth().createUser({
      email,
      password,
      displayName: username
    });

    // Create user in Firestore
    const userData = {
      id: newUser.uid,
      email,
      username,
      createdAt: new Date(),
      isAnonymous: false
    };

    await User.createUser(userData);

    // Generate JWT token
    const payload = {
      id: newUser.uid,
      email,
      username,
      isAnonymous: false
    };

    jwt.sign(
      payload,
      config.jwtSecret,
      { expiresIn: config.jwtExpiration },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: payload });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Sign in with Firebase Auth
      const signInResult = await admin.auth().getUserByEmail(email);
      
      // Get user from Firestore
      const user = await User.getUserById(signInResult.uid);

      if (!user) {
        return res.status(404).json({ message: 'User not found in database' });
      }

      // Generate JWT token
      const payload = {
        id: user.id,
        email: user.email,
        username: user.username,
        isAnonymous: false
      };

      jwt.sign(
        payload,
        config.jwtSecret,
        { expiresIn: config.jwtExpiration },
        (err, token) => {
          if (err) throw err;
          res.json({ token, user: payload });
        }
      );
    } catch (error) {
      console.error('Auth error:', error);
      return res.status(400).json({ message: 'Invalid credentials' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.anonymousLogin = async (req, res) => {
  try {
    // Create anonymous user in Firebase Auth
    const anonymousAuth = await admin.auth().createUser({
      disabled: false
    });

    // Create anonymous user in Firestore
    const anonymousUser = await User.createAnonymousUser();

    // Generate JWT token
    const payload = {
      id: anonymousUser.id,
      anonymousId: anonymousUser.anonymousId,
      isAnonymous: true
    };

    jwt.sign(
      payload,
      config.jwtSecret,
      { expiresIn: config.jwtExpiration },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: payload });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.getUserById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove sensitive info
    const { password, ...userData } = user;
    
    res.json(userData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    // Get current user data
    const user = await User.getUserById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Generate new token
    const payload = {
      id: user.id,
      email: user.email,
      username: user.username,
      anonymousId: user.anonymousId,
      isAnonymous: user.isAnonymous
    };
    
    jwt.sign(
      payload,
      config.jwtSecret,
      { expiresIn: config.jwtExpiration },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: payload });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
