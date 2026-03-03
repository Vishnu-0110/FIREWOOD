const express = require('express');
const { body, param } = require('express-validator');
const {
  addCustomer,
  getCustomers,
  updateCustomer,
  deleteCustomer
} = require('../controllers/customerController');
const { protect } = require('../middleware/authMiddleware');
const { handleValidation } = require('../middleware/validateMiddleware');

const router = express.Router();

router.use(protect);

router.post(
  '/',
  [
    body('customerName').trim().notEmpty().withMessage('Customer name is required'),
    body('phone').optional().isLength({ min: 10, max: 15 }).withMessage('Phone must be 10-15 characters')
  ],
  handleValidation,
  addCustomer
);

router.get('/', getCustomers);

router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('Valid customer id is required'),
    body('customerName').optional().trim().notEmpty().withMessage('Customer name cannot be empty')
  ],
  handleValidation,
  updateCustomer
);

router.delete('/:id', [param('id').isMongoId().withMessage('Valid customer id is required')], handleValidation, deleteCustomer);

module.exports = router;