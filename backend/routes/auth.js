// ====================================================================
// Authentication Routes - routes/auth.js
// Login, Register, Profile endpoints - WITH ROLE SUPPORT
// ====================================================================

import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ====================================================================
// Generate JWT Token
// ====================================================================
const generateToken = (userId) => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// ====================================================================
// POST /api/auth/register - Register new user WITH ROLE
// ====================================================================
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Validate role
    const validRoles = ['student', 'instructor', 'admin'];
    const userRole = role && validRoles.includes(role) ? role : 'student';

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        error: 'User already exists with this email' 
      });
    }

    // Create new user
    const user = new User({
      email,
      password,
      name: name || email.split('@')[0],
      role: userRole
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      error: error.message || 'Error registering user' 
    });
  }
});

// ====================================================================
// POST /api/auth/login - Login user
// ====================================================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Error logging in' 
    });
  }
});

// ====================================================================
// GET /api/auth/me - Get current user profile
// ====================================================================
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching profile' });
  }
});

// ====================================================================
// PUT /api/auth/profile - Update user profile
// ====================================================================
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;

    const user = await User.findById(req.user._id);
    if (name) user.name = name;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error updating profile' });
  }
});

// ====================================================================
// POST /api/auth/logout - Logout (client-side removes token)
// ====================================================================
router.post('/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Logout successful' });
});

export default router;
