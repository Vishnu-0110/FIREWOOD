const express = require('express');
const { body, param } = require('express-validator');
const {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  exportInvoicesExcel
} = require('../controllers/invoiceController');
const { protect } = require('../middleware/authMiddleware');
const { handleValidation } = require('../middleware/validateMiddleware');

const router = express.Router();

router.use(protect);

const invoiceValidation = [
  body('invoiceNumber')
    .optional({ values: 'falsy' })
    .isInt({ min: 1 })
    .withMessage('Invoice number must be a positive integer'),
  body('customer').isMongoId().withMessage('Customer is required'),
  body('vehicleNumber').trim().notEmpty().withMessage('Vehicle number is required'),
  body('grossWeight').isFloat({ gt: 0 }).withMessage('Gross weight must be positive'),
  body('tareWeight').isFloat({ gte: 0 }).withMessage('Tare weight must be zero or positive'),
  body('ratePerTon').isFloat({ gt: 0 }).withMessage('Rate per ton must be positive'),
  body('date').optional().isISO8601().withMessage('Date must be valid')
];

router.post('/', invoiceValidation, handleValidation, createInvoice);
router.get('/', getInvoices);
router.get('/export/excel', exportInvoicesExcel);
router.get('/:id', [param('id').isMongoId().withMessage('Valid invoice id is required')], handleValidation, getInvoiceById);
router.put('/:id', [param('id').isMongoId().withMessage('Valid invoice id is required'), ...invoiceValidation], handleValidation, updateInvoice);
router.delete('/:id', [param('id').isMongoId().withMessage('Valid invoice id is required')], handleValidation, deleteInvoice);

module.exports = router;
