// ====================================================================
// Interview Routes - routes/interviews.js
// CRUD operations for interviews
// ====================================================================

import express from 'express';
import Interview from '../models/Interview.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// ====================================================================
// GET /api/interviews - Get all interviews for current user
// ====================================================================
router.get('/', async (req, res) => {
  try {
    const { status, topic, limit = 50, skip = 0 } = req.query;

    const query = { userId: req.user._id };
    if (status) query.status = status;
    if (topic) query.topic = new RegExp(topic, 'i');

    const interviews = await Interview.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Interview.countDocuments(query);

    res.json({
      interviews,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: (parseInt(skip) + interviews.length) < total
      }
    });
  } catch (error) {
    console.error('Get interviews error:', error);
    res.status(500).json({ error: 'Error fetching interviews' });
  }
});

// ====================================================================
// GET /api/interviews/:id - Get specific interview
// ====================================================================
router.get('/:id', async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    res.json({ interview });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching interview' });
  }
});

// ====================================================================
// POST /api/interviews - Create new interview
// ====================================================================
router.post('/', async (req, res) => {
  try {
    const { 
      interviewee, 
      topic, 
      questionsAndAnswers, 
      customQuestions,
      status 
    } = req.body;

    // Validation
    if (!interviewee?.name || !topic) {
      return res.status(400).json({ 
        error: 'Interviewee name and topic are required' 
      });
    }

    const interview = new Interview({
      userId: req.user._id,
      interviewee: {
        name: interviewee.name,
        background: interviewee.background || '',
        date: interviewee.date || new Date()
      },
      topic,
      questionsAndAnswers: questionsAndAnswers || [],
      customQuestions: customQuestions || [],
      status: status || 'draft'
    });

    await interview.save();

    res.status(201).json({
      message: 'Interview created successfully',
      interview
    });
  } catch (error) {
    console.error('Create interview error:', error);
    res.status(500).json({ error: 'Error creating interview' });
  }
});

// ====================================================================
// PUT /api/interviews/:id - Update interview
// ====================================================================
router.put('/:id', async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    const { 
      interviewee, 
      topic, 
      questionsAndAnswers, 
      customQuestions,
      summary,
      status 
    } = req.body;

    if (interviewee) {
      interview.interviewee = {
        ...interview.interviewee,
        ...interviewee
      };
    }
    if (topic) interview.topic = topic;
    if (questionsAndAnswers) interview.questionsAndAnswers = questionsAndAnswers;
    if (customQuestions) interview.customQuestions = customQuestions;
    if (summary !== undefined) interview.summary = summary;
    if (status) interview.status = status;

    await interview.save();

    res.json({
      message: 'Interview updated successfully',
      interview
    });
  } catch (error) {
    console.error('Update interview error:', error);
    res.status(500).json({ error: 'Error updating interview' });
  }
});

// ====================================================================
// DELETE /api/interviews/:id - Delete interview
// ====================================================================
router.delete('/:id', async (req, res) => {
  try {
    const interview = await Interview.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    res.json({
      message: 'Interview deleted successfully',
      interview
    });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting interview' });
  }
});

// ====================================================================
// POST /api/interviews/:id/summary - Generate summary for interview
// ====================================================================
router.post('/:id/summary', async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    const summary = interview.generateSummary();
    interview.summary = summary;
    await interview.save();

    res.json({
      message: 'Summary generated successfully',
      summary
    });
  } catch (error) {
    res.status(500).json({ error: 'Error generating summary' });
  }
});

export default router;
