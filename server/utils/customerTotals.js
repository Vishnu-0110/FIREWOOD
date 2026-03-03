const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');

const recalculateCustomerTotals = async (customerId) => {
  const [result] = await Invoice.aggregate([
    {
      $match: {
        customer: customerId,
        isDeleted: false
      }
    },
    {
      $group: {
        _id: '$customer',
        totalLoadsSent: { $sum: 1 },
        totalAmountPaid: { $sum: '$totalAmount' }
      }
    }
  ]);

  await Customer.findByIdAndUpdate(customerId, {
    totalLoadsSent: result?.totalLoadsSent || 0,
    totalAmountPaid: result?.totalAmountPaid || 0
  });
};

module.exports = { recalculateCustomerTotals };