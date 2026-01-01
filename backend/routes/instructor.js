// ====================================================================
// Instructor Routes - routes/instructor.js
// Routes for instructors to view all students and their work
// ====================================================================

import express from 'express';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Interview from '../models/Interview.js';
import GroupReflection from '../models/GroupReflection.js';
import { authenticateToken, isInstructor } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and instructor role
router.use(authenticateToken);
router.use(isInstructor);

// ====================================================================
// GET /api/instructor/students - Get all students
// ====================================================================
router.get('/students', async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      students,
      total: students.length
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Error fetching students' });
  }
});

// ====================================================================
// GET /api/instructor/interviews - Get all interviews
// ====================================================================
router.get('/interviews', async (req, res) => {
  try {
    const interviews = await Interview.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      interviews,
      total: interviews.length
    });
  } catch (error) {
    console.error('Get all interviews error:', error);
    res.status(500).json({ error: 'Error fetching interviews' });
  }
});

// ====================================================================
// GET /api/instructor/reflections - Get all group reflections
// ====================================================================
router.get('/reflections', async (req, res) => {
  try {
    const reflections = await GroupReflection.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      reflections,
      total: reflections.length
    });
  } catch (error) {
    console.error('Get all reflections error:', error);
    res.status(500).json({ error: 'Error fetching reflections' });
  }
});

// ====================================================================
// GET /api/instructor/stats - Get statistics
// ====================================================================
router.get('/stats', async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalInterviews = await Interview.countDocuments();
    const totalReflections = await GroupReflection.countDocuments();
    const completedReflections = await GroupReflection.countDocuments({ stage: 'completed' });

    res.json({
      totalStudents,
      totalInterviews,
      totalReflections,
      completedReflections,
      activeReflections: totalReflections - completedReflections
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Error fetching statistics' });
  }
});

// ====================================================================
// GET /api/instructor/student/:id - Get specific student with their work
// ====================================================================
router.get('/student/:id', async (req, res) => {
  try {
    const student = await User.findById(req.params.id).select('-password');
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const interviews = await Interview.find({ userId: req.params.id });
    const reflections = await GroupReflection.find({ userId: req.params.id });

    res.json({
      student,
      interviews,
      reflections,
      stats: {
        totalInterviews: interviews.length,
        totalReflections: reflections.length
      }
    });
  } catch (error) {
    console.error('Get student details error:', error);
    res.status(500).json({ error: 'Error fetching student details' });
  }
});


// GET /api/instructor/notifications - Get notifications
router.get('/notifications', authenticateToken, isInstructor, async (req, res) => {
  try {
    const notifications = await Notification.find({ instructorId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ notifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Error fetching notifications' });
  }
});

// GET /api/instructor/team-history/:teamId - Get team conversation history
router.get('/team-history/:teamId', authenticateToken, isInstructor, async (req, res) => {
  try {
    const reflections = await GroupReflection.find({ 
      teamId: req.params.teamId,
      stage: 'completed'
    })
    .sort({ createdAt: -1 });
    
    res.json({ reflections });
  } catch (error) {
    console.error('Get team history error:', error);
    res.status(500).json({ error: 'Error fetching team history' });
  }
});
export default router;



