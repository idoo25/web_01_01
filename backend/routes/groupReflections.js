import express from 'express';
import GroupReflection from '../models/GroupReflection.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/group-reflections - Get all reflections (instructors see all, students see only their own)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Instructors see all reflections, students see only their own
    const query = req.user.role === 'instructor' ? {} : { userId: req.user._id };
    const reflections = await GroupReflection.find(query)
      .sort({ createdAt: -1 });
    
    res.json({ reflections });
  } catch (error) {
    console.error('Get reflections error:', error);
    res.status(500).json({ error: 'Error fetching reflections' });
  }
});

// POST /api/group-reflections - Create new reflection
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { groupName, projectTopic, teamId } = req.body;
    
    const reflection = new GroupReflection({
      groupName,
      projectTopic,
      teamId,
      userId: req.user._id,
      stage: 'setup'
    });
    
    await reflection.save();
    res.status(201).json({ reflection });
  } catch (error) {
    console.error('Create reflection error:', error);
    res.status(500).json({ error: 'Error creating reflection' });
  }
});

// GET /api/group-reflections/:id - Get specific reflection
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const reflection = await GroupReflection.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!reflection) {
      return res.status(404).json({ error: 'Reflection not found' });
    }
    
    res.json({ reflection });
  } catch (error) {
    console.error('Get reflection error:', error);
    res.status(500).json({ error: 'Error fetching reflection' });
  }
});

// PUT /api/group-reflections/:id - Update reflection
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const reflection = await GroupReflection.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    
    if (!reflection) {
      return res.status(404).json({ error: 'Reflection not found' });
    }
    
    res.json({ reflection });
  } catch (error) {
    console.error('Update reflection error:', error);
    res.status(500).json({ error: 'Error updating reflection' });
  }
});

// DELETE /api/group-reflections/:id - Delete reflection
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const reflection = await GroupReflection.findByIdAndDelete(req.params.id);
    
    if (!reflection) {
      return res.status(404).json({ error: 'Reflection not found' });
    }
    
    res.json({ message: 'Reflection deleted', reflection });
  } catch (error) {
    console.error('Delete reflection error:', error);
    res.status(500).json({ error: 'Error deleting reflection' });
  }
});

export default router;
