const Customer = require('../models/Customer');
const { logAudit } = require('../utils/audit');

const addCustomer = async (req, res) => {
  const customer = await Customer.create(req.body);
  await logAudit({ user: req.user._id, action: 'CREATE_CUSTOMER', module: 'CUSTOMER', metadata: { customerId: customer._id } });
  return res.status(201).json(customer);
};

const getCustomers = async (req, res) => {
  const { q = '', page = 1, limit = 10 } = req.query;
  const query = {
    isDeleted: false,
    $or: [
      { customerName: { $regex: q, $options: 'i' } },
      { factoryName: { $regex: q, $options: 'i' } },
      { gstNumber: { $regex: q, $options: 'i' } },
      { phone: { $regex: q, $options: 'i' } }
    ]
  };

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Customer.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Customer.countDocuments(query)
  ]);

  return res.json({ items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) || 1 });
};

const updateCustomer = async (req, res) => {
  const customer = await Customer.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    req.body,
    { new: true }
  );

  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  await logAudit({ user: req.user._id, action: 'UPDATE_CUSTOMER', module: 'CUSTOMER', metadata: { customerId: customer._id } });
  return res.json(customer);
};

const deleteCustomer = async (req, res) => {
  const customer = await Customer.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );

  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  await logAudit({ user: req.user._id, action: 'DELETE_CUSTOMER', module: 'CUSTOMER', metadata: { customerId: customer._id } });
  return res.json({ message: 'Customer deleted successfully' });
};

module.exports = { addCustomer, getCustomers, updateCustomer, deleteCustomer };