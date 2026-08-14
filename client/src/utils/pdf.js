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
  email: 'garumugam251@gmail.com',
  website: 'https://vijayalakshmifirewoods.vercel.app'
};

const BANK = {
  accountName: 'A. VIJAYA LAKSHMI',
  accountNo: '404004110000005',
  ifsc: 'UBIN0540404',
  bank: 'Union Bank of India',
  branch: 'Melur'
};

const money = (value = 0) =>
  Number(value).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  });

const qty = (value = 0) =>
  Number(value).toLocaleString('en-IN', {
    maximumFractionDigits: 3
  });

const rateValue = (value = 0) =>
  Number(value).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  });

const invoiceNo = (value) => String(Number(value) || 0);

const websiteText = String(COMPANY.website || '').replace(
  /^https?:\/\//i,
  ''
);

const buildInvoiceFilename = (invoice) => {
  const rawName = String(
    invoice?.customer?.factoryName ||
      invoice?.customer?.customerName ||
      ''
  ).trim();

  const firstWord = rawName
    ? rawName.split(/\s+/)[0]
    : 'INVOICE';

  const safeWord =
    firstWord.replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'INVOICE';

  const invoiceDate = dayjs(invoice?.date);

  const datePart = invoiceDate.isValid()
    ? invoiceDate.format('DDMMYYYY')
    : dayjs().format('DDMMYYYY');

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
  const placeholder = '';

  const textFallback = (value) => {
    const raw = String(value ?? '').trim();
    return raw ? escapeHtml(raw) : placeholder;
  };

  const formatNumber = (value, formatter) => {
    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return placeholder;
    }

    const num = Number(value);

    if (Number.isNaN(num)) {
      return placeholder;
    }

    return formatter(num);
  };

  const formatDate = (value) => {
    if (template) return placeholder;

    const parsed = dayjs(value);

    return parsed.isValid()
      ? parsed.format('DD-MMM-YYYY')
      : placeholder;
  };

  const factoryName = textFallback(
    invoice.customer?.factoryName ||
      invoice.customer?.customerName
  );

  const customerAddress = textFallback(
    invoice.customer?.address
  );

  const customerGst = textFallback(
    invoice.customer?.gstNumber
  );

  const amountWords = textFallback(
    invoice.amountInWords
  );

  const vehicle = textFallback(
    invoice.vehicleNumber
  );

  const invoiceNumberText = template
    ? placeholder
    : invoiceNo(invoice.invoiceNumber);

  const invoiceDateText = formatDate(invoice.date);

  const grossText = formatNumber(
    invoice.grossWeight,
    qty
  );

  const tareText = formatNumber(
    invoice.tareWeight,
    qty
  );

  const netText = formatNumber(
    invoice.netWeight,
    qty
  );

  const rateText = formatNumber(
    invoice.ratePerTon,
    rateValue
  );

  const totalText = formatNumber(
    invoice.totalAmount,
    money
  );

  return `
    <div
      id="invoice-root"
      style="
        width:190mm;
        height:277mm;
        margin:0 auto;
        padding:0;
        background:#ffffff;
        box-sizing:border-box;
        display:flex;
        align-items:center;
        justify-content:center;
        font-family:Arial, Helvetica, sans-serif;
        font-size:13px;
        color:#000000;
        line-height:1.35;
        letter-spacing:0;
        text-rendering:geometricPrecision;
      "
    >

      <div
        style="
          width:100%;
          height:100%;
          box-sizing:border-box;
          border:1px solid #2f2f2f;
          padding:14px 15px;
          display:flex;
          flex-direction:column;
          background:#ffffff;
        "
      >

        <!-- ====================================================== -->
        <!-- MAIN CONTENT WRAPPER                                   -->
        <!-- Entire main invoice content moves down together        -->
        <!-- Footer remains outside and stays in its position       -->
        <!-- ====================================================== -->

        <div
          style="
            position:relative;
            top:18px;
          "
        >

          <!-- ================= HEADER ================= -->

          <div
            style="
              display:flex;
              align-items:flex-start;
              justify-content:space-between;
              gap:18px;
              width:100%;
            "
          >

            <!-- COMPANY INFORMATION -->

            <div
              style="
                display:flex;
                align-items:flex-start;
                gap:12px;
                flex:1 1 auto;
                min-width:0;
              "
            >

              <!-- LOGO -->

              <div
                style="
                  width:68px;
                  height:68px;
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  overflow:hidden;
                  flex-shrink:0;
                "
              >
                <img
                  src="/invoice-logo.png"
                  alt="logo"
                  style="
                    width:100%;
                    height:100%;
                    object-fit:cover;
                  "
                  onerror="
                    if(!this.dataset.retry){
                      this.dataset.retry='1';
                      this.src='/logo.png';
                    }else{
                      this.style.display='none';
                      this.parentNode.innerHTML='<span style=&quot;font-weight:700;color:#7B4F2C;&quot;>VL</span>';
                    }
                  "
                />
              </div>

              <!-- COMPANY TEXT -->

              <div
                style="
                  text-align:left;
                  min-width:0;
                  flex:1;
                "
              >

                <div
                  style="
                    font-size:25px;
                    font-weight:700;
                    line-height:0.98;
                    letter-spacing:-0.3px;
                    white-space:nowrap;
                  "
                >
                  ${COMPANY.nameLine1}
                </div>

                <div
                  style="
                    font-size:25px;
                    font-weight:700;
                    line-height:0.98;
                    letter-spacing:-0.3px;
                    margin-bottom:9px;
                    white-space:nowrap;
                  "
                >
                  ${COMPANY.nameLine2}
                </div>

                <div
                  style="
                    font-size:13px;
                    font-weight:600;
                    line-height:1.25;
                    white-space:nowrap;
                  "
                >
                  ${COMPANY.address1}
                </div>

                <div
                  style="
                    font-size:13px;
                    font-weight:600;
                    line-height:1.25;
                    white-space:nowrap;
                  "
                >
                  ${COMPANY.address2}
                </div>

                <div
                  style="
                    font-size:13px;
                    font-weight:600;
                    line-height:1.25;
                    white-space:nowrap;
                  "
                >
                  ${COMPANY.address3}
                </div>

                <div
                  style="
                    font-size:12.5px;
                    font-weight:700;
                    line-height:1.25;
                    margin-top:4px;
                    white-space:nowrap;
                  "
                >
                  ${COMPANY.gst}
                </div>

              </div>
            </div>

            <!-- CONTACT INFORMATION -->

            <div
              style="
                width:265px;
                flex:0 0 265px;
                font-size:11.5px;
                margin-top:8px;
                line-height:1.3;
                box-sizing:border-box;
              "
            >

              <!-- PHONE -->

              <div
                style="
                  display:flex;
                  align-items:flex-start;
                  width:100%;
                  box-sizing:border-box;
                  padding:5px 8px;
                  margin-bottom:6px;
                  border:1px solid #c7d2fe;
                  border-radius:6px;
                  background:#f8fbff;
                  color:#0b57d0;
                  font-weight:600;
                  overflow:hidden;
                "
              >
                <span
                  style="
                    width:50px;
                    flex:0 0 50px;
                    white-space:nowrap;
                  "
                >
                  Phone:
                </span>

                <span
                  style="
                    flex:1;
                    min-width:0;
                    white-space:nowrap;
                  "
                >
                  ${escapeHtml(COMPANY.phone)}
                </span>
              </div>

              <!-- EMAIL -->

              <a
                href="mailto:${escapeHtml(COMPANY.email)}"
                target="_blank"
                rel="noreferrer noopener"
                style="
                  display:flex;
                  align-items:flex-start;
                  width:100%;
                  box-sizing:border-box;
                  padding:5px 8px;
                  margin-bottom:6px;
                  border:1px solid #c7d2fe;
                  border-radius:6px;
                  background:#f8fbff;
                  color:#0b57d0;
                  text-decoration:none;
                  font-weight:600;
                  overflow:hidden;
                "
              >
                <span
                  style="
                    width:50px;
                    flex:0 0 50px;
                    white-space:nowrap;
                  "
                >
                  Email:
                </span>

                <span
                  style="
                    flex:1;
                    min-width:0;
                    overflow-wrap:anywhere;
                    word-break:break-word;
                  "
                >
                  ${escapeHtml(COMPANY.email)}
                </span>
              </a>

              <!-- WEBSITE -->

              <a
                href="${escapeHtml(COMPANY.website)}"
                target="_blank"
                rel="noreferrer noopener"
                style="
                  display:flex;
                  align-items:flex-start;
                  width:100%;
                  box-sizing:border-box;
                  padding:5px 8px;
                  border:1px solid #c7d2fe;
                  border-radius:6px;
                  background:#f8fbff;
                  color:#0b57d0;
                  text-decoration:none;
                  font-weight:600;
                  font-size:11px;
                  line-height:1.25;
                  overflow:visible;
                "
              >
                <span
                  style="
                    width:50px;
                    flex:0 0 50px;
                    white-space:nowrap;
                  "
                >
                  Website:
                </span>

                <span
                  style="
                    flex:1;
                    min-width:0;
                    white-space:normal;
                    overflow:visible;
                    overflow-wrap:anywhere;
                    word-break:break-all;
                  "
                >
                  ${escapeHtml(websiteText)}
                </span>
              </a>

            </div>
          </div>

          <!-- HEADER DIVIDER -->

          <div
            style="
              border-top:1.5px solid #7B4F2C;
              margin:12px 0 0;
            "
          ></div>

          <!-- ================= CUSTOMER + INVOICE ================= -->

          <div
            style="
              display:flex;
              justify-content:space-between;
              align-items:stretch;
              gap:12px;
              margin-top:15px;
              width:100%;
            "
          >

            <!-- BILL TO BLOCK -->

            <div
              style="
                flex:1;
                min-width:0;
                border:1px solid rgba(120,120,120,0.48);
                background:rgba(248,248,248,0.30);
                padding:9px 11px;
                box-sizing:border-box;
                font-size:12.5px;
                line-height:1.5;
                color:#1f1f1f;
              "
            >

              <!-- BILL TO -->

              <div
                style="
                  display:flex;
                  align-items:flex-start;
                  width:100%;
                  margin-bottom:4px;
                "
              >
                <span
                  style="
                    width:58px;
                    flex:0 0 58px;
                    margin-right:5px;
                    font-weight:700;
                    white-space:nowrap;
                  "
                >
                  Bill To:
                </span>

                <span
                  style="
                    flex:1;
                    min-width:0;
                    font-weight:500;
                    overflow-wrap:anywhere;
                  "
                >
                  ${factoryName}
                </span>
              </div>

              <!-- ADDRESS -->

              <div
                style="
                  display:flex;
                  align-items:flex-start;
                  width:100%;
                  margin-bottom:4px;
                "
              >
                <span
                  style="
                    width:58px;
                    flex:0 0 58px;
                    margin-right:5px;
                    font-weight:700;
                    white-space:nowrap;
                  "
                >
                  Address:
                </span>

                <span
                  style="
                    flex:1;
                    min-width:0;
                    font-weight:500;
                    overflow-wrap:anywhere;
                  "
                >
                  ${customerAddress}
                </span>
              </div>

              <!-- GSTIN -->

              <div
                style="
                  display:flex;
                  align-items:flex-start;
                  width:100%;
                "
              >
                <span
                  style="
                    width:58px;
                    flex:0 0 58px;
                    margin-right:5px;
                    font-weight:700;
                    white-space:nowrap;
                  "
                >
                  GSTIN:
                </span>

                <span
                  style="
                    flex:1;
                    min-width:0;
                    font-weight:500;
                    overflow-wrap:anywhere;
                  "
                >
                  ${customerGst}
                </span>
              </div>

            </div>

            <!-- INVOICE DETAILS BLOCK -->

            <div
              style="
                width:245px;
                flex:0 0 245px;
                background:rgba(243,243,243,0.72);
                border:1px solid rgba(145,145,145,0.55);
                padding:8px 10px;
                box-sizing:border-box;
                font-size:12.5px;
                line-height:1.55;
              "
            >

              <!-- INVOICE NO -->

              <div
                style="
                  display:flex;
                  align-items:flex-start;
                  width:100%;
                "
              >
                <span
                  style="
                    width:77px;
                    flex:0 0 77px;
                    margin-right:3px;
                    font-weight:700;
                    white-space:nowrap;
                  "
                >
                  Invoice No:
                </span>

                <span
                  style="
                    flex:1;
                    min-width:0;
                    font-weight:500;
                    overflow-wrap:anywhere;
                  "
                >
                  ${invoiceNumberText}
                </span>
              </div>

              <!-- INVOICE DATE -->

              <div
                style="
                  display:flex;
                  align-items:flex-start;
                  width:100%;
                "
              >
                <span
                  style="
                    width:77px;
                    flex:0 0 77px;
                    margin-right:3px;
                    font-weight:700;
                    white-space:nowrap;
                  "
                >
                  Invoice Date:
                </span>

                <span
                  style="
                    flex:1;
                    min-width:0;
                    font-weight:500;
                    white-space:nowrap;
                  "
                >
                  ${invoiceDateText}
                </span>
              </div>

              <!-- VEHICLE NO -->

              <div
                style="
                  display:flex;
                  align-items:flex-start;
                  width:100%;
                "
              >
                <span
                  style="
                    width:77px;
                    flex:0 0 77px;
                    margin-right:3px;
                    font-weight:700;
                    white-space:nowrap;
                  "
                >
                  Vehicle No:
                </span>

                <span
                  style="
                    flex:1;
                    min-width:0;
                    font-weight:500;
                    overflow-wrap:anywhere;
                  "
                >
                  ${vehicle}
                </span>
              </div>

            </div>
          </div>

          <!-- ================= SUPPLY DETAILS ================= -->

          <div
            style="
              text-align:center;
              margin:19px 0 11px;
            "
          >
            <span
              style="
                font-size:16px;
                font-weight:600;
                color:#7B4F2C;
                border-bottom:2px solid #7B4F2C;
                padding:0 10px 3px;
              "
            >
              SUPPLY DETAILS
            </span>
          </div>

          <!-- ================= SUPPLY TABLE ================= -->

          <table
            style="
              width:100%;
              border-collapse:collapse;
              border:1px solid #000;
              font-size:12.5px;
              table-layout:fixed;
            "
          >

            <thead>
              <tr style="background:#f0f0f0;">

                <th
                  style="
                    width:7%;
                    border:0.7px solid #777;
                    padding:8px 5px;
                    font-weight:700;
                  "
                >
                  S.No
                </th>

                <th
                  style="
                    width:24%;
                    border:0.7px solid #777;
                    padding:8px 5px;
                    font-weight:700;
                  "
                >
                  Description
                </th>

                <th
                  style="
                    width:13%;
                    border:0.7px solid #777;
                    padding:8px 5px;
                    font-weight:700;
                  "
                >
                  Gross (Kg)
                </th>

                <th
                  style="
                    width:13%;
                    border:0.7px solid #777;
                    padding:8px 5px;
                    font-weight:700;
                  "
                >
                  Tare (Kg)
                </th>

                <th
                  style="
                    width:13%;
                    border:0.7px solid #777;
                    padding:8px 5px;
                    font-weight:700;
                  "
                >
                  Net (Kg)
                </th>

                <th
                  style="
                    width:14%;
                    border:0.7px solid #777;
                    padding:8px 5px;
                    font-weight:700;
                  "
                >
                  Rate / Ton
                </th>

                <th
                  style="
                    width:16%;
                    border:0.7px solid #777;
                    padding:8px 5px;
                    font-weight:700;
                  "
                >
                  Amount (INR)
                </th>

              </tr>
            </thead>

            <tbody>

              <tr>

                <td
                  style="
                    border:0.7px solid #777;
                    padding:9px 5px;
                    text-align:center;
                  "
                >
                  1
                </td>

                <td
                  style="
                    border:0.7px solid #777;
                    padding:9px 5px;
                  "
                >
                  Firewood Load
                </td>

                <td
                  style="
                    border:0.7px solid #777;
                    padding:9px 5px;
                    text-align:right;
                  "
                >
                  ${grossText}
                </td>

                <td
                  style="
                    border:0.7px solid #777;
                    padding:9px 5px;
                    text-align:right;
                  "
                >
                  ${tareText}
                </td>

                <td
                  style="
                    border:0.7px solid #777;
                    padding:9px 5px;
                    text-align:right;
                  "
                >
                  ${netText}
                </td>

                <td
                  style="
                    border:0.7px solid #777;
                    padding:9px 5px;
                    text-align:right;
                    font-weight:600;
                  "
                >
                  ${rateText}
                </td>

                <td
                  style="
                    border:0.7px solid #777;
                    padding:9px 5px;
                    text-align:right;
                    font-weight:600;
                  "
                >
                  ${totalText}
                </td>

              </tr>

            </tbody>
          </table>

          <!-- ================= TOTAL ================= -->

          <div
            style="
              display:flex;
              align-items:stretch;
              justify-content:space-between;
              gap:10px;
              margin-top:16px;
            "
          >

            <div
              style="
                flex:1;
                border:1px solid #a8a8a8;
                padding:8px 10px;
                font-size:12.5px;
                font-weight:500;
                line-height:1.35;
              "
            >
              <strong>Amount in Words:</strong>
              ${amountWords}
            </div>

            <div
              style="
                width:175px;
                flex:0 0 175px;
                border:2px solid #7B4F2C;
                padding:7px 9px;
                box-sizing:border-box;
                text-align:right;
                font-size:18px;
                font-weight:600;
                display:flex;
                align-items:center;
                justify-content:flex-end;
              "
            >
              INR ${totalText}
            </div>

          </div>

          <!-- ================= BANK DETAILS ================= -->

          <div
            style="
              border:1px solid #b7b7b7;
              margin-top:16px;
              padding:9px 11px;
              font-size:12.5px;
              line-height:1.45;
            "
          >

            <div
              style="
                font-size:15px;
                font-weight:600;
                color:#7B4F2C;
                border-bottom:1px solid #7B4F2C;
                display:inline-block;
                margin-bottom:7px;
              "
            >
              Bank Details
            </div>

            <div style="font-weight:500;">
              <strong>Account Name:</strong>
              ${BANK.accountName}
            </div>

            <div style="font-weight:500;">
              <strong>Account No:</strong>
              ${BANK.accountNo}
            </div>

            <div style="font-weight:500;">
              <strong>IFSC Code:</strong>
              ${BANK.ifsc}
            </div>

            <div style="font-weight:500;">
              <strong>Bank:</strong>
              ${BANK.bank}
            </div>

            <div style="font-weight:500;">
              <strong>Branch:</strong>
              ${BANK.branch}
            </div>

          </div>

          <!-- ================= TERMS & CONDITIONS ================= -->

          <div
            style="
              border:1px solid #c4c4c4;
              margin-top:14px;
              padding:11px 12px;
              font-size:13px;
              line-height:1.6;
            "
          >

            <div
              style="
                font-size:15px;
                font-weight:600;
                color:#7B4F2C;
                border-bottom:1px solid #7B4F2C;
                display:inline-block;
                margin-bottom:7px;
              "
            >
              TERMS & CONDITIONS
            </div>

            <div style="font-weight:500;">
              • Payment should be made as per the agreed terms.
            </div>

            <div style="font-weight:500;">
              • Material quantity is based on the recorded weight at delivery.
            </div>

            <div style="font-weight:500;">
              • Any discrepancy should be reported at the time of delivery.
            </div>

            <div style="font-weight:500;">
              • Goods once delivered will be considered accepted by the customer.
            </div>

            <div style="font-weight:500;">
              • Transportation is arranged as agreed with the customer.
            </div>

          </div>

        </div>

        <!-- ====================================================== -->
        <!-- FOOTER                                                  -->
        <!-- This stays OUTSIDE the moved wrapper                    -->
        <!-- ====================================================== -->

        <div
          style="
            display:flex;
            justify-content:space-between;
            gap:12px;
            margin-top:auto;
            border-top:1px solid #c0c0c0;
            padding-top:10px;
            font-size:10.5px;
          "
        >

          <!-- NOTE -->

          <div
            style="
              flex:1;
              min-width:0;
            "
          >

            <div>
              Note: Cheque should be issued in favour of
            </div>

            <div
              style="
                font-weight:600;
                margin-top:2px;
              "
            >
              "A. Vijaya Lakshmi"
            </div>

            <div
              style="
                margin-top:16px;
                font-weight:600;
              "
            >
              Thank You
            </div>

          </div>

          <!-- SIGNATURE -->

          <div
            style="
              width:245px;
              flex:0 0 245px;
              text-align:center;
              border-left:1px solid #c0c0c0;
              padding-left:10px;
              box-sizing:border-box;
            "
          >

            <div
              style="
                font-weight:600;
              "
            >
              For Vijaya Lakshmi Firewood Supplier
            </div>

            <div
              style="
                height:44px;
                display:flex;
                align-items:flex-end;
                justify-content:center;
              "
            >
              <img
                src="/signature.png"
                alt="signature"
                style="
                  max-height:40px;
                  max-width:150px;
                  object-fit:contain;
                "
                onerror="this.style.display='none';"
              />
            </div>

            <div
              style="
                border-top:1px solid #000;
                padding-top:4px;
              "
            >
              Authorized Signatory
            </div>

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
    // Equal 10mm margin on all four sides
    margin: [10, 10, 10, 10],

    filename,

    enableLinks: true,

    image: {
      type: 'jpeg',
      quality: 0.92
    },

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

    pagebreak: {
      mode: ['avoid-all']
    }
  };

  return html2pdf()
    .set(options)
    .from(node);
};

const createInvoicePdfBlob = async (invoice) => {
  const node = createInvoiceNode(invoice);

  try {
    const worker = buildWorker(
      node,
      buildInvoiceFilename(invoice)
    );

    return await worker.outputPdf('blob');
  } finally {
    node.parentElement?.remove();
  }
};

export const downloadInvoicePdf = async (invoice) => {
  const node = createInvoiceNode(invoice);

  try {
    await buildWorker(
      node,
      buildInvoiceFilename(invoice)
    ).save();
  } finally {
    node.parentElement?.remove();
  }
};

export const viewInvoicePdf = async (invoice) => {
  if (typeof window === 'undefined') {
    return false;
  }

  const previewWindow = window.open('', '_blank');

  if (!previewWindow) {
    return false;
  }

  previewWindow.document.write(
    '<p style="font-family:Arial,sans-serif;padding:16px;">Loading invoice preview...</p>'
  );

  previewWindow.document.close();

  try {
    const blob = await createInvoicePdfBlob(invoice);

    const url = URL.createObjectURL(blob);

    previewWindow.location.href = url;
    previewWindow.focus();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 120000);

    return true;
  } catch (error) {
    previewWindow.close();
    throw error;
  }
};

export const downloadInvoiceTemplatePdf = async () => {
  const node = createInvoiceNode(
    {},
    {
      template: true
    }
  );

  try {
    const datePart = dayjs().format('DDMMYYYY');

    await buildWorker(
      node,
      `INVOICE TEMPLATE ${datePart}.pdf`
    ).save();
  } finally {
    node.parentElement?.remove();
  }
};

export const printInvoicePdf = async (invoice) => {
  const blob = await createInvoicePdfBlob(invoice);

  const url = URL.createObjectURL(blob);

  const printWindow = window.open(
    url,
    '_blank'
  );

  if (printWindow) {
    printWindow.addEventListener(
      'load',
      () => {
        printWindow.print();
      }
    );
  }

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 120000);
};

export const shareInvoicePdf = async (invoice) => {
  if (
    typeof navigator === 'undefined' ||
    typeof navigator.share !== 'function'
  ) {
    return false;
  }

  const blob = await createInvoicePdfBlob(invoice);

  const filename = buildInvoiceFilename(invoice);

  const file = new File(
    [blob],
    filename,
    {
      type: 'application/pdf'
    }
  );

  if (
    typeof navigator.canShare === 'function' &&
    !navigator.canShare({
      files: [file]
    })
  ) {
    return false;
  }

  await navigator.share({
    title: `Invoice ${invoiceNo(
      invoice?.invoiceNumber
    )}`,

    text: `Invoice for ${
      invoice?.customer?.factoryName ||
      invoice?.customer?.customerName ||
      'factory'
    }`,

    files: [file]
  });

  return true;
};  