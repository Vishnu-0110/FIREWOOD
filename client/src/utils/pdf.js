import dayjs from 'dayjs';
import html2pdf from 'html2pdf.js';

const COMPANY = {
  nameLine1: 'VIJAYA LAKSHMI',
  nameLine2: 'FIREWOOD SUPPLIER',
  address1: 'Sivanpuram, Velankanni',
  address2: 'Mettupalayam, Coimbatore - 641301',
  address3: 'Tamil Nadu',
  gst: 'GSTIN: 33CPOPA7913R1ZC',
  phone: '+91 94427 37292',
  email: 'garumugam251@gmail.com'
};

const BANK = {
  accountName: 'A. VIJAYA LAKSHMI',
  accountNo: '404004110000005',
  ifsc: 'UBIN0540404',
  bank: 'Union Bank of India',
  branch: 'Melur'
};

const money = (value = 0) =>
  Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 });

const qty = (value = 0) => Number(value).toLocaleString('en-IN', { maximumFractionDigits: 3 });
const rateValue = (value = 0) =>
  Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 });

const invoiceNo = (value) => String(Number(value) || 0);
const buildInvoiceFilename = (invoice) => {
  const rawName = String(invoice?.customer?.factoryName || invoice?.customer?.customerName || '').trim();
  const firstWord = rawName ? rawName.split(/\s+/)[0] : 'INVOICE';
  const safeWord = firstWord.replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'INVOICE';
  const datePart = dayjs().format('DDMMYYYY');
  return `${safeWord} ${datePart}.pdf`;
};

const escapeHtml = (value = '') =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const buildInvoiceHTML = (invoice, { template = false } = {}) => {
  const placeholder = template ? '________' : '-';
  const textFallback = (value) => {
    const raw = String(value ?? '').trim();
    return raw ? escapeHtml(raw) : placeholder;
  };
  const formatNumber = (value, formatter) => {
    if (value === null || value === undefined || value === '') return placeholder;
    const num = Number(value);
    if (Number.isNaN(num)) return placeholder;
    return formatter(num);
  };
  const formatDate = (value) => {
    if (template) return placeholder;
    const parsed = dayjs(value);
    return parsed.isValid() ? parsed.format('DD-MMM-YYYY') : placeholder;
  };

  const factoryName = textFallback(invoice.customer?.factoryName || invoice.customer?.customerName);
  const customerAddress = textFallback(invoice.customer?.address);
  const customerGst = textFallback(invoice.customer?.gstNumber);
  const amountWords = textFallback(invoice.amountInWords);
  const vehicle = textFallback(invoice.vehicleNumber);
  const invoiceNumberText = template ? placeholder : invoiceNo(invoice.invoiceNumber);
  const invoiceDateText = formatDate(invoice.date);
  const grossText = formatNumber(invoice.grossWeight, qty);
  const tareText = formatNumber(invoice.tareWeight, qty);
  const netText = formatNumber(invoice.netWeight, qty);
  const rateText = formatNumber(invoice.ratePerTon, rateValue);
  const totalText = formatNumber(invoice.totalAmount, money);

  return `
    <div id="invoice-root" style="
      width: 190mm;
      height: 277mm;
      background: #fff;
      box-sizing: border-box;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 14px;
      color: #000000;
      line-height: 1.48;
      letter-spacing: 0;
      text-rendering: geometricPrecision;
    ">
      <div style="border: 1px solid #2f2f2f; padding: 16px 16px; box-sizing: border-box; width: 100%; min-height: 245mm; display: flex; flex-direction: column;">
        <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;">
          <div style="display: flex; align-items: flex-start; gap: 12px; flex: 1;">
            <div style="width: 72px; height: 72px; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0;">
              <img src="/invoice-logo.png" alt="logo" style="width: 100%; height: 100%; object-fit: cover;" onerror="if(!this.dataset.retry){this.dataset.retry='1';this.src='/logo.png';}else{this.style.display='none';this.parentNode.innerHTML='<span style=&quot;font-weight:700;color:#7B4F2C;&quot;>VL</span>';}" />
            </div>

            <div style="text-align: left;">
              <div style="font-size: 23px; font-weight: 600; line-height: 1.12;">${COMPANY.nameLine1}</div>
              <div style="font-size: 23px; font-weight: 600; line-height: 1.12; margin-bottom: 4px;">${COMPANY.nameLine2}</div>
              <div style="font-size: 14px; font-weight: 500;">${COMPANY.address1}</div>
              <div style="font-size: 14px; font-weight: 500;">${COMPANY.address2}</div>
              <div style="font-size: 14px; font-weight: 500;">${COMPANY.address3}</div>
              <div style="font-size: 15px; font-weight: 600; margin-top: 2px;">${COMPANY.gst}</div>
            </div>
          </div>

          <div style="min-width: 220px; font-size: 14px; margin-top: 6px; line-height: 1.55;">
            <div style="display:flex; align-items:flex-start; justify-content:flex-end; gap:6px;">
              <span style="font-weight:600; width:46px; text-align:left;">Phone:</span>
              <span style="font-weight:500; min-width:150px; text-align:left;">${COMPANY.phone}</span>
            </div>
            <div style="display:flex; align-items:flex-start; justify-content:flex-end; gap:6px;">
              <span style="font-weight:600; width:46px; text-align:left;">Email:</span>
              <span style="font-weight:500; min-width:150px; text-align:left;">${COMPANY.email}</span>
            </div>
          </div>
        </div>

        <div style="border-top: 1.5px solid #7B4F2C; margin: 14px 0 0;"></div>

        <div style="display: flex; justify-content: space-between; gap: 14px; margin-top: 18px;">
          <div style="flex: 1; border: 1px solid #8f8f8f; padding: 10px 12px; font-size: 14px;">
            <div style="display:flex; gap:6px; margin-bottom:4px;"><span style="font-weight:600; width:54px;">Bill To:</span><span style="font-weight:500;">${factoryName}</span></div>
            <div style="display:flex; gap:6px; margin-bottom:4px;"><span style="font-weight:600; width:54px;">Address:</span><span style="font-weight:500;">${customerAddress}</span></div>
            <div style="display:flex; gap:6px;"><span style="font-weight:600; width:54px;">GSTIN:</span><span style="font-weight:500;">${customerGst}</span></div>
          </div>

          <div style="width: 250px; background: #f3f3f3; border: 1px solid #b3b3b3; padding: 8px 10px; font-size: 14px; line-height: 1.6;">
            <div style="display:flex; align-items:flex-start; gap:8px;"><span style="font-weight:600; width:80px;">Invoice No:</span><span style="font-weight:500;">${invoiceNumberText}</span></div>
            <div style="display:flex; align-items:flex-start; gap:8px;"><span style="font-weight:600; width:80px;">Invoice Date:</span><span style="font-weight:500;">${invoiceDateText}</span></div>
            <div style="display:flex; align-items:flex-start; gap:8px;"><span style="font-weight:600; width:80px;">Vehicle No:</span><span style="font-weight:500;">${vehicle}</span></div>
          </div>
        </div>

        <div style="text-align: center; margin: 22px 0 12px;">
          <span style="font-size: 17px; font-weight: 600; color: #7B4F2C; border-bottom: 2px solid #7B4F2C; padding: 0 10px 4px;">SUPPLY DETAILS</span>
        </div>

        <table style="width:100%; border-collapse: collapse; font-size:14px;">
          <thead>
            <tr style="background:#f0f0f0;">
              <th style="border:1px solid #000; padding:9px 6px; font-weight:600;">S.No</th>
              <th style="border:1px solid #000; padding:9px 6px; font-weight:600;">Description</th>
              <th style="border:1px solid #000; padding:9px 6px; font-weight:600;">Gross (Kg)</th>
              <th style="border:1px solid #000; padding:9px 6px; font-weight:600;">Tare (Kg)</th>
              <th style="border:1px solid #000; padding:9px 6px; font-weight:600;">Net (Kg)</th>
              <th style="border:1px solid #000; padding:9px 6px; font-weight:600;">Rate / Ton</th>
              <th style="border:1px solid #000; padding:9px 6px; font-weight:600;">Amount (INR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border:1px solid #000; padding:10px 6px; text-align:center;">1</td>
              <td style="border:1px solid #000; padding:10px 6px;">Firewood Load</td>
              <td style="border:1px solid #000; padding:10px 6px; text-align:right;">${grossText}</td>
              <td style="border:1px solid #000; padding:10px 6px; text-align:right;">${tareText}</td>
              <td style="border:1px solid #000; padding:10px 6px; text-align:right;">${netText}</td>
              <td style="border:1px solid #000; padding:10px 6px; text-align:right; font-weight:600;">${rateText}</td>
              <td style="border:1px solid #000; padding:10px 6px; text-align:right; font-weight:600;">${totalText}</td>
            </tr>
          </tbody>
        </table>

        <div style="display:flex; align-items:stretch; justify-content:space-between; gap:10px; margin-top:18px;">
          <div style="flex:1; border:1px solid #a8a8a8; padding:9px 10px; font-size:14px; font-weight:500;">
            <strong>Amount in Words:</strong> ${amountWords}
          </div>
          <div style="width:180px; border:2px solid #7B4F2C; padding:8px 10px; text-align:right; font-size:19px; font-weight:600; display:flex; align-items:center; justify-content:flex-end;">
            INR ${totalText}
          </div>
        </div>

        <div style="border:1px solid #b7b7b7; margin-top:18px; padding:11px 12px; font-size:14px;">
          <div style="font-size:16px; font-weight:600; color:#7B4F2C; border-bottom:1px solid #7B4F2C; display:inline-block; margin-bottom:8px;">Bank Details</div>
          <div style="font-weight:500;"><strong>Account Name:</strong> ${BANK.accountName}</div>
          <div style="font-weight:500;"><strong>Account No:</strong> ${BANK.accountNo}</div>
          <div style="font-weight:500;"><strong>IFSC Code:</strong> ${BANK.ifsc}</div>
          <div style="font-weight:500;"><strong>Bank:</strong> ${BANK.bank}</div>
          <div style="font-weight:500;"><strong>Branch:</strong> ${BANK.branch}</div>
        </div>

        <div style="display:flex; justify-content:space-between; gap:12px; margin-top:auto; border-top:1px solid #c0c0c0; padding-top:12px; font-size:13px;">
          <div style="flex:1;">
            <div>Note: Cheque should be issued in favour of</div>
            <div style="font-weight:600; margin-top:2px;">&quot;A. Vijaya Lakshmi&quot;</div>
            <div style="margin-top:18px; font-weight:600;">Thank You</div>
          </div>

          <div style="width:260px; text-align:center; border-left:1px solid #c0c0c0; padding-left:12px;">
            <div style="font-weight:600;">For Vijaya Lakshmi Firewood Supplier</div>
            <div style="height:54px; display:flex; align-items:flex-end; justify-content:center;">
              <img src="/signature.png" alt="signature" style="max-height:46px; max-width:160px; object-fit:contain;" onerror="this.style.display='none';" />
            </div>
            <div style="border-top:1px solid #000; padding-top:4px;">Authorized Signatory</div>
          </div>
        </div>
      </div>
    </div>
  `;
};

const createInvoiceNode = (invoice, options) => {
  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.left = '-100000px';
  host.style.top = '0';
  host.style.zIndex = '-1';
  host.innerHTML = buildInvoiceHTML(invoice, options);
  document.body.appendChild(host);
  return host.firstElementChild;
};

const buildWorker = (node, filename) => {
  const options = {
    margin: [10, 10, 10, 10],
    filename,
    image: { type: 'jpeg', quality: 0.92 },
    html2canvas: {
      scale: 2.4,
      useCORS: true,
      backgroundColor: '#ffffff',
      scrollY: 0,
      windowWidth: 1280,
      letterRendering: true
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
      compress: true
    },
    pagebreak: { mode: ['avoid-all'] }
  };

  return html2pdf().set(options).from(node);
};

export const downloadInvoicePdf = async (invoice) => {
  const node = createInvoiceNode(invoice);

  try {
    await buildWorker(node, buildInvoiceFilename(invoice)).save();
  } finally {
    node.parentElement?.remove();
  }
};

export const downloadInvoiceTemplatePdf = async () => {
  const node = createInvoiceNode({}, { template: true });

  try {
    const datePart = dayjs().format('DDMMYYYY');
    await buildWorker(node, `INVOICE TEMPLATE ${datePart}.pdf`).save();
  } finally {
    node.parentElement?.remove();
  }
};

export const printInvoicePdf = async (invoice) => {
  const node = createInvoiceNode(invoice);

  try {
    const worker = buildWorker(node, buildInvoiceFilename(invoice));
    const blob = await worker.outputPdf('blob');
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');

    if (printWindow) {
      printWindow.addEventListener('load', () => {
        printWindow.print();
      });
    }

    setTimeout(() => URL.revokeObjectURL(url), 120000);
  } finally {
    node.parentElement?.remove();
  }
};
