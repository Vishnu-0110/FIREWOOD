const dayjs = require('dayjs');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');

const getStats = async (req, res) => {
  const [overall] = await Invoice.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalAmount' },
        totalLoadsSent: { $sum: 1 }
      }
    }
  ]);

  const [totalCustomers, recentInvoices, monthlyRevenue, customerRevenue, topCustomers, thisMonthLoads, lastYearRevenue, prevYearRevenue] = await Promise.all([
    Customer.countDocuments({ isDeleted: false }),
    Invoice.find({ isDeleted: false })
      .populate('customer', 'customerName')
      .sort({ date: -1 })
      .limit(10),
    Invoice.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' } },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]),
    Invoice.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: '$customer',
          revenue: { $sum: '$totalAmount' },
          loads: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'customers',
          localField: '_id',
          foreignField: '_id',
          as: 'customer'
        }
      },
      { $unwind: '$customer' },
      { $project: { name: '$customer.customerName', revenue: 1, loads: 1 } },
      { $sort: { revenue: -1 } }
    ]),
    Invoice.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$customer', revenue: { $sum: '$totalAmount' }, loads: { $sum: 1 } } },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'customers',
          localField: '_id',
          foreignField: '_id',
          as: 'customer'
        }
      },
      { $unwind: '$customer' },
      { $project: { name: '$customer.customerName', revenue: 1, loads: 1 } }
    ]),
    Invoice.countDocuments({
      isDeleted: false,
      date: { $gte: dayjs().startOf('month').toDate(), $lte: dayjs().endOf('month').toDate() }
    }),
    Invoice.aggregate([
      { $match: { isDeleted: false, date: { $gte: dayjs().startOf('year').toDate(), $lte: dayjs().endOf('year').toDate() } } },
      { $group: { _id: null, revenue: { $sum: '$totalAmount' } } }
    ]),
    Invoice.aggregate([
      {
        $match: {
          isDeleted: false,
          date: {
            $gte: dayjs().subtract(1, 'year').startOf('year').toDate(),
            $lte: dayjs().subtract(1, 'year').endOf('year').toDate()
          }
        }
      },
      { $group: { _id: null, revenue: { $sum: '$totalAmount' } } }
    ])
  ]);

  const currentYearRevenue = lastYearRevenue[0]?.revenue || 0;
  const previousYearRevenue = prevYearRevenue[0]?.revenue || 0;
  const yearlyGrowth = previousYearRevenue
    ? Number((((currentYearRevenue - previousYearRevenue) / previousYearRevenue) * 100).toFixed(2))
    : currentYearRevenue > 0
      ? 100
      : 0;

  return res.json({
    summary: {
      totalRevenue: overall?.totalRevenue || 0,
      totalLoadsSent: overall?.totalLoadsSent || 0,
      totalCustomers,
      loadCountThisMonth: thisMonthLoads,
      yearlyGrowth
    },
    charts: {
      monthlyRevenue: monthlyRevenue.map((item) => ({
        label: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
        revenue: item.revenue
      })),
      customerRevenue,
      topCustomers
    },
    recentInvoices
  });
};

module.exports = { getStats };