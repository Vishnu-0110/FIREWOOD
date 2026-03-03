const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true, trim: true },
    factoryName: { type: String, trim: true, default: '' },
    gstNumber: { type: String, trim: true, uppercase: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    totalLoadsSent: { type: Number, default: 0 },
    totalAmountPaid: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

customerSchema.index({ isDeleted: 1, factoryName: 1 });

module.exports = mongoose.model('Customer', customerSchema);
