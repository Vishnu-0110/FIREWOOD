const ExcelJS = require('exceljs');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const numberToWordsIndian = require('../utils/numberToWords');
const { recalculateCustomerTotals } = require('../utils/customerTotals');
const { logAudit } = require('../utils/audit');

const getNextInvoiceNumberForCustomer = async (customerId) => {
  const latest = await Invoice.findOne({ customer: customerId, isDeleted: false })
    .sort({ invoiceNumber: -1 })
    .select('invoiceNumber');
  return (latest?.invoiceNumber || 0) + 1;
};

const createInvoice = async (req, res) => {
  const {
    invoiceNumber,
    date,
    customer,
    vehicleNumber,
    grossWeight,
    tareWeight,
    ratePerTon
  } = req.body;

  const gross = Number(grossWeight);
  const tare = Number(tareWeight);
  const rate = Number(ratePerTon);

  if (gross <= tare) {
    return res.status(400).json({ message: 'Gross weight must be greater than tare weight' });
  }

  if (rate <= 0) {
    return res.status(400).json({ message: 'Rate per ton must be greater than zero' });
  }

  const customerDoc = await Customer.findOne({ _id: customer, isDeleted: false });
  if (!customerDoc) {
    return res.status(400).json({ message: 'Customer not found' });
  }

  let finalInvoiceNumber = Number(invoiceNumber);
  if (Number.isNaN(finalInvoiceNumber) || finalInvoiceNumber < 0) {
    return res.status(400).json({ message: 'Invoice number must be a positive number' });
  }

  if (!finalInvoiceNumber) {
    finalInvoiceNumber = await getNextInvoiceNumberForCustomer(customerDoc._id);
  }

  if (finalInvoiceNumber < 1) {
    return res.status(400).json({ message: 'Invoice number must be greater than zero' });
  }

  const duplicate = await Invoice.findOne({
    customer: customerDoc._id,
    invoiceNumber: finalInvoiceNumber,
    isDeleted: false
  });
  if (duplicate) {
    return res.status(400).json({ message: 'Duplicate invoice number for this customer' });
  }

  const netWeight = Number((gross - tare).toFixed(3));
  const effectiveRate = rate / 1000;
  const totalAmount = Number((netWeight * effectiveRate).toFixed(2));
  const amountInWords = numberToWordsIndian(totalAmount);

  const created = await Invoice.create({
    invoiceNumber: finalInvoiceNumber,
    date,
    customer,
    vehicleNumber,
    grossWeight: gross,
    tareWeight: tare,
    netWeight,
    ratePerTon: rate,
    totalAmount,
    amountInWords
  });

  await recalculateCustomerTotals(customerDoc._id);
  await logAudit({ user: req.user._id, action: 'CREATE_INVOICE', module: 'INVOICE', metadata: { invoiceId: created._id } });

  const populated = await created.populate('customer', 'customerName factoryName gstNumber phone address');
  return res.status(201).json(populated);
};

const getInvoices = async (req, res) => {
  const {
    q = '',
    customer,
    startDate,
    endDate,
    page = 1,
    limit = 10
  } = req.query;

  const filter = { isDeleted: false };

  if (customer) {
    filter.customer = customer;
  }

  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  const customers = await Customer.find(
    {
      isDeleted: false,
      $or: [
        { customerName: { $regex: q, $options: 'i' } },
        { factoryName: { $regex: q, $options: 'i' } }
      ]
    },
    '_id'
  );

  if (q) {
    filter.$or = [
      { vehicleNumber: { $regex: q, $options: 'i' } },
      { invoiceNumber: Number.isNaN(Number(q)) ? -1 : Number(q) },
      { customer: { $in: customers.map((c) => c._id) } }
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Invoice.find(filter)
      .populate('customer', 'customerName factoryName')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Invoice.countDocuments(filter)
  ]);

  return res.json({ items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) || 1 });
};

const getInvoiceById = async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, isDeleted: false }).populate(
    'customer',
    'customerName factoryName gstNumber phone address'
  );

  if (!invoice) {
    return res.status(404).json({ message: 'Invoice not found' });
  }

  return res.json(invoice);
};

const updateInvoice = async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, isDeleted: false });
  if (!invoice) {
    return res.status(404).json({ message: 'Invoice not found' });
  }

  const {
    customer,
    vehicleNumber,
    grossWeight,
    tareWeight,
    ratePerTon,
    date
  } = req.body;

  const gross = Number(grossWeight);
  const tare = Number(tareWeight);
  const rate = Number(ratePerTon);

  if (gross <= tare) {
    return res.status(400).json({ message: 'Gross weight must be greater than tare weight' });
  }

  if (rate <= 0) {
    return res.status(400).json({ message: 'Rate per ton must be greater than zero' });
  }

  const targetCustomer = await Customer.findOne({ _id: customer, isDeleted: false });
  if (!targetCustomer) {
    return res.status(400).json({ message: 'Customer not found' });
  }

  const previousCustomer = String(invoice.customer);

  const netWeight = Number((gross - tare).toFixed(3));
  const effectiveRate = rate / 1000;
  const totalAmount = Number((netWeight * effectiveRate).toFixed(2));

  invoice.customer = customer;
  invoice.vehicleNumber = vehicleNumber;
  invoice.grossWeight = gross;
  invoice.tareWeight = tare;
  invoice.netWeight = netWeight;
  invoice.ratePerTon = rate;
  invoice.totalAmount = totalAmount;
  invoice.amountInWords = numberToWordsIndian(totalAmount);
  invoice.date = date;

  await invoice.save();

  await recalculateCustomerTotals(targetCustomer._id);
  if (previousCustomer !== String(targetCustomer._id)) {
    await recalculateCustomerTotals(previousCustomer);
  }

  await logAudit({ user: req.user._id, action: 'UPDATE_INVOICE', module: 'INVOICE', metadata: { invoiceId: invoice._id } });

  const populated = await invoice.populate('customer', 'customerName factoryName gstNumber phone address');
  return res.json(populated);
};

const deleteInvoice = async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, isDeleted: false });
  if (!invoice) {
    return res.status(404).json({ message: 'Invoice not found' });
  }

  invoice.isDeleted = true;
  invoice.deletedAt = new Date();
  await invoice.save();

  await recalculateCustomerTotals(invoice.customer);
  await logAudit({ user: req.user._id, action: 'DELETE_INVOICE', module: 'INVOICE', metadata: { invoiceId: invoice._id } });

  return res.json({ message: 'Invoice deleted successfully' });
};

const exportInvoicesExcel = async (req, res) => {
  const invoices = await Invoice.find({ isDeleted: false })
    .populate('customer', 'customerName')
    .sort({ createdAt: -1 });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Invoices');

  sheet.columns = [
    { header: 'Invoice Number', key: 'invoiceNumber', width: 16 },
    { header: 'Date', key: 'date', width: 16 },
    { header: 'Customer', key: 'customer', width: 24 },
    { header: 'Vehicle', key: 'vehicle', width: 16 },
    { header: 'Gross', key: 'gross', width: 12 },
    { header: 'Tare', key: 'tare', width: 12 },
    { header: 'Net', key: 'net', width: 12 },
    { header: 'Rate/Ton', key: 'rate', width: 12 },
    { header: 'Total', key: 'total', width: 16 }
  ];

  invoices.forEach((inv) => {
    sheet.addRow({
      invoiceNumber: inv.invoiceNumber,
      date: inv.date.toISOString().slice(0, 10),
      customer: inv.customer?.customerName || '-',
      vehicle: inv.vehicleNumber,
      gross: inv.grossWeight,
      tare: inv.tareWeight,
      net: inv.netWeight,
      rate: inv.ratePerTon,
      total: inv.totalAmount
    });
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=invoices.xlsx');
  await workbook.xlsx.write(res);
  return res.end();
};

module.exports = {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  exportInvoicesExcel
};
