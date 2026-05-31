const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Logger = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/authRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const gradesRoutes = require('./routes/gradesRoutes');
const classesRoutes = require('./routes/classesRoutes');
const studentsRoutes = require('./routes/studentsRoutes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// SECURITY MIDDLEWARE
// ==========================================

// Helmet for security headers
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// ==========================================
// BODY PARSING MIDDLEWARE
// ==========================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==========================================
// REQUEST LOGGING MIDDLEWARE
// ==========================================
app.use((req, res, next) => {
  Logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// ==========================================
// API ROUTES
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/grades', gradesRoutes);
app.use('/api/classes', classesRoutes);
app.use('/api/students', studentsRoutes);

// ==========================================
// API ROOT ENDPOINT
// ==========================================
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Student Management System API root',
    documentation: '/api/health'
  });
});

// ==========================================
// HEALTH CHECK ENDPOINT
// ==========================================
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Student Management System API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ==========================================
// ROOT ENDPOINT
// ==========================================
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Student Management System API',
    version: '1.0.0',
    documentation: '/api/docs'
  });
});

// ==========================================
// 404 HANDLER
// ==========================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.path
  });
});
// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================
app.use((error, req, res, next) => {
  Logger.error('Unhandled error:', error);
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
});

// ==========================================
// START SERVER
// ==========================================
app.listen(PORT, () => {
  Logger.success(`Server running on port ${PORT}`);
  Logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  Logger.info(`API Base URL: http://localhost:${PORT}/api`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  Logger.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

module.exports = app;
