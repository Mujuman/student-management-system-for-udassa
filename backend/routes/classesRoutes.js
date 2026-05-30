const express = require('express');
const router = express.Router();
const { getClasses } = require('../controllers/classesController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, getClasses);

module.exports = router;