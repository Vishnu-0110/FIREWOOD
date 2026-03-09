const express = require('express');
const { backupDatabase } = require('../controllers/backupController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/db', protect, authorize('admin'), backupDatabase);
router.get('/backup', protect, authorize('admin'), backupDatabase);

module.exports = router;
