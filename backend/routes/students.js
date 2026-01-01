import express from 'express';
import Team from '../models/Team.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/students/my-team - Get student's team automatically
router.get('/my-team', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email;

    const team = await Team.findOne({
      'members.email': userEmail
    });

    if (!team) {
      return res.json({ team: null, message: 'Not assigned to any team' });
    }

    res.json({ team });
  } catch (error) {
    console.error('Get my team error:', error);
    res.status(500).json({ error: 'Error fetching team' });
  }
});

export default router;
