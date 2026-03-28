const express = require('express');
const { body } = require('express-validator');
const { register, login, me, logout } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { handleValidation } = require('../middleware/validateMiddleware');

const router = express.Router();

router.post(
  '/register',
  protect,
  authorize('admin'),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  handleValidation,
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  handleValidation,
  login
);

router.get('/me', protect, me);
router.post('/logout', logout);

module.exports = router;
