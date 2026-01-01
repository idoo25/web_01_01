import express from 'express';
import Task from '../models/Task.js';
import Team from '../models/Team.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/tasks/:teamId - Get all tasks for a team
router.get('/:teamId', authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.find({ teamId: req.params.teamId })
      .sort({ priority: -1, createdAt: -1 });
    
    res.json({ tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Error fetching tasks' });
  }
});

// POST /api/tasks - Create new task
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { teamId, title, description, category, priority, dueDate } = req.body;

    const task = new Task({
      teamId,
      title,
      description,
      category,
      priority,
      dueDate
    });

    await task.save();

    res.status(201).json({
      message: 'Task created',
      task
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Error creating task' });
  }
});

// PUT /api/tasks/:id/complete - Mark task as completed
router.put('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.completed) {
      return res.status(400).json({ error: 'Task already completed' });
    }

    task.completed = true;
    task.completedAt = new Date();
    await task.save();

    // Update team points
    const team = await Team.findOne({ teamId: task.teamId });
    if (team) {
      team.points = (team.points || 0) + task.points;
      await team.save();
    }

    res.json({
      message: 'Task completed',
      task,
      pointsEarned: task.points
    });
  } catch (error) {
    console.error('Complete task error:', error);
    res.status(500).json({ error: 'Error completing task' });
  }
});

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Error deleting task' });
  }
});

export default router;
