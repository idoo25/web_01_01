// ====================================================================
// Main Server File - server.js
// Express + MongoDB Backend for Keren Web
// ====================================================================

import cron from 'node-cron';
import { checkTeamsStatus, checkStaleTeams, generateWeeklySummary, initializeMonitoring } from './services/monitoring.js';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth.js';
import interviewRoutes from './routes/interviews.js';
import groupReflectionRoutes from './routes/groupReflections.js';
import instructorRoutes from './routes/instructor.js';
import claudeRoutes from './routes/claude.js';
import doublebotRoutes from './routes/doublebot.js';
import teamsRoutes from './routes/teams.js';
import tasksRoutes from './routes/tasks.js';
import studentsRoutes from './routes/students.js';

// Load environment variables
dotenv.config();

const app = express();

// ====================================================================
// Background Jobs & Monitoring
// ====================================================================
initializeMonitoring();

// Check teams status every hour
cron.schedule('0 * * * *', () => {
  console.log('⏰ Running hourly team status check...');
  checkTeamsStatus();
});

// Check for stale teams daily at midnight
cron.schedule('0 0 * * *', () => {
  console.log('⏰ Running daily stale teams check...');
  checkStaleTeams();
});

// Generate weekly summary every Friday at 9 AM
cron.schedule('0 9 * * 5', () => {
  console.log('⏰ Generating weekly summary...');
  generateWeeklySummary();
});

// Run initial checks on startup
setTimeout(() => {
  console.log('🔄 Running initial team checks...');
  checkTeamsStatus();
  checkStaleTeams();
}, 5000);

const PORT = process.env.PORT || 5000;

// ====================================================================
// Middleware
// ====================================================================
app.use(cors({
  origin: 'http://localhost:5173', // Vite dev server
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ====================================================================
// Database Connection
// ====================================================================
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('âœ… MongoDB Connected Successfully!');
  } catch (error) {
    console.error('âŒ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

connectDB();

// ====================================================================
// Routes
// ====================================================================
app.get('/', (req, res) => {
  res.json({
    message: 'ðŸš€ Keren Web API Server',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      interviews: '/api/interviews',
      groupReflections: '/api/group-reflections'
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/group-reflections', groupReflectionRoutes);
app.use('/api/instructor', instructorRoutes);
app.use('/api/claude', claudeRoutes);
app.use('/api/doublebot', doublebotRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/students', studentsRoutes);

// ====================================================================
// Error Handling
// ====================================================================
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ====================================================================
// Start Server
// ====================================================================
app.listen(PORT, () => {
  console.log(`
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘              ðŸš€ Server Running Successfully                â•‘
â•‘              Port: ${PORT}                                      â•‘
â•‘              Database: MongoDB Atlas                       â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  `);
  console.log(`ðŸ“ Server URL: http://localhost:${PORT}`);
  console.log(`ðŸ“ API Docs: http://localhost:${PORT}/api/docs`);
});

export default app;






