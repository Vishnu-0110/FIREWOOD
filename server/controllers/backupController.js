const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

const backupDatabase = async (req, res) => {
  const [users, customers, invoices, auditLogs] = await Promise.all([
    User.find({}).select('-password -__v').lean(),
    Customer.find({}).lean(),
    Invoice.find({}).lean(),
    AuditLog.find({}).sort({ createdAt: -1 }).limit(5000).lean()
  ]);
  console.log(`Backup triggered by ${req.user.email}`);

  return res.json({
    exportedAt: new Date().toISOString(),
    counts: { users: users.length, customers: customers.length, invoices: invoices.length, auditLogs: auditLogs.length },
    data: { users, customers, invoices, auditLogs }
  });
};

module.exports = { backupDatabase };
