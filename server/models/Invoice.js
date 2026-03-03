const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: Number, required: true, min: 1, index: true },
    date: { type: Date, default: Date.now },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    vehicleNumber: { type: String, required: true, trim: true, uppercase: true },
    grossWeight: { type: Number, required: true, min: 0 },
    tareWeight: { type: Number, required: true, min: 0 },
    netWeight: { type: Number, required: true, min: 0 },
    ratePerTon: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    amountInWords: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

invoiceSchema.index(
  { customer: 1, invoiceNumber: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
invoiceSchema.index({ isDeleted: 1, date: 1 });
invoiceSchema.index({ customer: 1, isDeleted: 1, date: -1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
