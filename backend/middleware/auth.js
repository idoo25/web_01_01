// ====================================================================
// Authentication Middleware - middleware/auth.js
// JWT verification and role-based access control
// ====================================================================

import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// ====================================================================
// Verify JWT Token
// ====================================================================
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token. User not found.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

// ====================================================================
// Check if user is Instructor
// ====================================================================
export const isInstructor = (req, res, next) => {
  if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Access denied. Instructor only.' 
    });
  }
  next();
};

// ====================================================================
// Check if user is Admin
// ====================================================================
export const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Access denied. Admin only.' 
    });
  }
  next();
};
