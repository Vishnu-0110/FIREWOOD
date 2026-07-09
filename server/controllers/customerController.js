const Customer = require('../models/Customer');
const { logAudit } = require('../utils/audit');
const { recalculateCustomerTotals } = require('../utils/customerTotals');

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeFactoryName = (value) => String(value || '').trim().replace(/\s+/g, ' ');

const findDuplicateFactory = async ({ factoryName, excludeId } = {}) => {
  const normalizedName = normalizeFactoryName(factoryName);
  if (!normalizedName) return null;

  const query = {
    isDeleted: false,
    _id: excludeId ? { $ne: excludeId } : { $exists: true },
    $or: [
      { factoryName: { $regex: `^${escapeRegex(normalizedName)}$`, $options: 'i' } },
      { customerName: { $regex: `^${escapeRegex(normalizedName)}$`, $options: 'i' } }
    ]
  };

  return Customer.findOne(query).lean();
};

const addCustomer = async (req, res) => {
  const factoryName = normalizeFactoryName(req.body.factoryName || req.body.customerName);
  const duplicate = await findDuplicateFactory({ factoryName });

  if (duplicate) {
    return res.status(400).json({ message: 'Factory already exists' });
  }

  const customer = await Customer.create({
    ...req.body,
    factoryName,
    customerName: factoryName
  });
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

const getDeletedCustomers = async (req, res) => {
  const { q = '', page = 1, limit = 10 } = req.query;
  const query = {
    isDeleted: true,
    $or: [
      { customerName: { $regex: q, $options: 'i' } },
      { factoryName: { $regex: q, $options: 'i' } },
      { gstNumber: { $regex: q, $options: 'i' } },
      { phone: { $regex: q, $options: 'i' } }
    ]
  };

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Customer.find(query).sort({ deletedAt: -1, updatedAt: -1 }).skip(skip).limit(Number(limit)),
    Customer.countDocuments(query)
  ]);

  return res.json({ items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) || 1 });
};

const updateCustomer = async (req, res) => {
  const factoryName = normalizeFactoryName(req.body.factoryName || req.body.customerName);
  const duplicate = await findDuplicateFactory({ factoryName, excludeId: req.params.id });

  if (duplicate) {
    return res.status(400).json({ message: 'Factory already exists' });
  }

  const customer = await Customer.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    {
      ...req.body,
      factoryName,
      customerName: factoryName
    },
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
    { isDeleted: true, deletedAt: new Date() },
    { new: true }
  );

  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  await logAudit({
    user: req.user._id,
    action: 'DELETE_CUSTOMER',
    module: 'CUSTOMER',
    metadata: {
      customerId: customer._id,
      factoryName: customer.factoryName || customer.customerName,
      deletedAt: customer.deletedAt
    }
  });
  return res.json({ message: 'Customer deleted successfully' });
};

const restoreCustomer = async (req, res) => {
  const customer = await Customer.findOne({ _id: req.params.id, isDeleted: true });

  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  const duplicate = await findDuplicateFactory({
    factoryName: customer.factoryName || customer.customerName,
    excludeId: customer._id
  });

  if (duplicate) {
    return res.status(409).json({ message: 'Factory already exists' });
  }

  customer.isDeleted = false;
  customer.deletedAt = null;
  await customer.save();
  await recalculateCustomerTotals(customer._id);

  await logAudit({
    user: req.user._id,
    action: 'RESTORE_CUSTOMER',
    module: 'CUSTOMER',
    metadata: {
      customerId: customer._id,
      factoryName: customer.factoryName || customer.customerName
    }
  });

  return res.json({ message: 'Customer restored successfully' });
};

module.exports = { addCustomer, getCustomers, getDeletedCustomers, updateCustomer, deleteCustomer, restoreCustomer };
