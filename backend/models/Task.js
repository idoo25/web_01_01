import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  teamId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  category: {
    type: String,
    enum: ['communication', 'conflict', 'planning', 'technical', 'other'],
    default: 'other'
  },
  priority: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  dueDate: Date,
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: Date,
  points: {
    type: Number,
    default: 20
  }
}, {
  timestamps: true
});

const Task = mongoose.model('Task', taskSchema);

export default Task;
