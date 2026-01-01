import express from 'express';
import Team from '../models/Team.js';
import GroupReflection from '../models/GroupReflection.js';
import Notification from '../models/Notification.js';
import Task from '../models/Task.js';
import { authenticateToken, isInstructor } from '../middleware/auth.js';

const router = express.Router();

// GET /api/teams - Get all teams for instructor
router.get('/', authenticateToken, isInstructor, async (req, res) => {
  try {
    const teams = await Team.find({ instructorId: req.user._id })
      .sort({ lastActivity: -1 });
    res.json({ teams });
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ error: 'Error fetching teams' });
  }
});

// POST /api/teams - Create new team
router.post('/', authenticateToken, isInstructor, async (req, res) => {
  try {
    const { teamId, projectName, members } = req.body;

    const existingTeam = await Team.findOne({ teamId });
    if (existingTeam) {
      return res.status(400).json({ error: 'Team ID already exists' });
    }

    const team = new Team({
      teamId,
      projectName,
      members,
      instructorId: req.user._id
    });

    await team.save();

    res.status(201).json({
      message: 'Team created successfully',
      team
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ error: 'Error creating team' });
  }
});

// GET /api/teams/:teamId - Get specific team
router.get('/:teamId', authenticateToken, async (req, res) => {
  try {
    const team = await Team.findOne({ teamId: req.params.teamId });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Get recent sessions
    const sessions = await GroupReflection.find({ teamId: req.params.teamId })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get tasks
    const tasks = await Task.find({ teamId: req.params.teamId })
      .sort({ createdAt: -1 });

    res.json({
      team,
      sessions,
      tasks
    });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ error: 'Error fetching team' });
  }
});

// PUT /api/teams/:teamId - Update team
router.put('/:teamId', authenticateToken, isInstructor, async (req, res) => {
  try {
    const team = await Team.findOneAndUpdate(
      { teamId: req.params.teamId, instructorId: req.user._id },
      req.body,
      { new: true }
    );

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    res.json({ team });
  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({ error: 'Error updating team' });
  }
});

// DELETE /api/teams/:teamId - Delete team
router.delete('/:teamId', authenticateToken, isInstructor, async (req, res) => {
  try {
    const team = await Team.findOneAndDelete({
      teamId: req.params.teamId,
      instructorId: req.user._id
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Delete related data
    await GroupReflection.deleteMany({ teamId: req.params.teamId });
    await Task.deleteMany({ teamId: req.params.teamId });
    await Notification.deleteMany({ teamId: req.params.teamId });

    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({ error: 'Error deleting team' });
  }
});

// GET /api/teams/:teamId/analytics - Get team analytics
router.get('/:teamId/analytics', authenticateToken, async (req, res) => {
  try {
    const sessions = await GroupReflection.find({ teamId: req.params.teamId })
      .sort({ createdAt: 1 });

    // Get only completed sessions with full data
    const completedSessions = sessions.filter(s => s.stage === 'completed');

    const analytics = {
      sentimentTrend: sessions.map(s => ({
        date: s.createdAt,
        score: s.hfAnalysis?.sentiment_score || 0
      })),
      weScoreTrend: sessions.map(s => ({
        date: s.createdAt,
        score: s.hfAnalysis?.we_score || 0
      })),
      sessionCount: sessions.length,
      completedSessionCount: completedSessions.length,
      averageSentiment: sessions.reduce((acc, s) => acc + (s.hfAnalysis?.sentiment_score || 0), 0) / (sessions.length || 1),

      // Add latest scores and analysis
      latestSession: completedSessions.length > 0 ? {
        scores: completedSessions[completedSessions.length - 1].scores,
        finalAnalysis: completedSessions[completedSessions.length - 1].finalAnalysis,
        createdAt: completedSessions[completedSessions.length - 1].createdAt,
        conversationLength: completedSessions[completedSessions.length - 1].conversationHistory?.length || 0
      } : null,

      // All completed sessions with scores
      allSessions: completedSessions.map(s => ({
        _id: s._id,
        createdAt: s.createdAt,
        scores: s.scores,
        finalAnalysis: s.finalAnalysis,
        conversationLength: s.conversationHistory?.length || 0
      }))
    };

    res.json({ analytics });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Error fetching analytics' });
  }
});

export default router;
