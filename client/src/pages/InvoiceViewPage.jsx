import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import AppLayout from '../layout/AppLayout';
import api from '../api/axiosClient';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/format';
import { isSilentAuthError } from '../utils/apiErrors';
import { downloadInvoicePdf, printInvoicePdf, shareInvoicePdf } from '../utils/pdf';

const InvoiceViewPage = () => {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    api.get(`/invoices/${id}`).then((res) => setInvoice(res.data)).catch((error) => {
      if (isSilentAuthError(error)) return;
      toast.error('Failed to load invoice');
    });
  }, [id]);

  if (!invoice) return <LoadingSpinner full />;

  const downloadPdf = async () => {
    await downloadInvoicePdf(invoice);
  };

  const printPdf = async () => {
    await printInvoicePdf(invoice);
  };

  const sharePdf = async () => {
    setSharing(true);
    try {
      const shared = await shareInvoicePdf(invoice);
      if (!shared) {
        toast.info('Share is not supported on this device. Download the PDF and share it manually.');
      }
    } catch (error) {
      if (error?.name !== 'AbortError') {
        toast.error('Unable to share the invoice right now.');
      }
    } finally {
      setSharing(false);
    }
  };

  const factoryName = invoice.customer?.factoryName || invoice.customer?.customerName || '-';
  const summary = [
    { label: 'Invoice Date', value: formatDate(invoice.date) },
    { label: 'Factory', value: factoryName },
    { label: 'Vehicle', value: invoice.vehicleNumber || '-' },
    { label: 'Rate / Ton', value: Number(invoice.ratePerTon || 0).toLocaleString('en-IN') }
  ];

  return (
    <AppLayout>
      <section className="page-hero page-hero-tight mb-3">
        <div>
          <span className="page-eyebrow">Invoice Overview</span>
          <h1 className="page-title mb-1">Invoice #{invoice.invoiceNumber}</h1>
          <p className="page-subtitle mb-0">Review, print, download or share this invoice instantly.</p>
        </div>
        <div className="hero-actions">
          <button className="btn btn-warning" onClick={downloadPdf}>Download PDF</button>
          <button className="btn btn-outline-dark" onClick={printPdf}>Print</button>
          <button className="btn btn-outline-primary" onClick={sharePdf} disabled={sharing}>
            {sharing ? 'Sharing...' : 'Share'}
          </button>
        </div>
      </section>

      <div className="row g-3">
        {summary.map((item) => (
          <div className="col-12 col-sm-6 col-xl-3" key={item.label}>
            <div className="card surface-card h-100">
              <div className="card-body">
                <span className="detail-label">{item.label}</span>
                <div className="detail-value mt-2">{item.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card shadow-sm mt-3 invoice-view-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <span>Load Summary</span>
          <span className="status-pill">Ready to share</span>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-12 col-lg-7">
              <div className="info-grid">
                <div className="info-tile">
                  <span className="detail-label">Gross Weight</span>
                  <strong>{invoice.grossWeight}</strong>
                </div>
                <div className="info-tile">
                  <span className="detail-label">Tare Weight</span>
                  <strong>{invoice.tareWeight}</strong>
                </div>
                <div className="info-tile">
                  <span className="detail-label">Net Weight</span>
                  <strong>{invoice.netWeight}</strong>
                </div>
                <div className="info-tile">
                  <span className="detail-label">Invoice No</span>
                  <strong>{invoice.invoiceNumber}</strong>
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-5">
              <div className="invoice-total-card">
                <span className="detail-label">Total Amount</span>
                <div className="invoice-total-value">{formatCurrency(invoice.totalAmount)}</div>
                <p className="mb-0 mt-3">
                  <strong>Amount in words:</strong> {invoice.amountInWords}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm mt-3">
        <div className="card-header">Factory and Billing Details</div>
        <div className="card-body">
          <div className="info-grid info-grid-compact">
            <div className="info-tile">
              <span className="detail-label">Factory Name</span>
              <strong>{factoryName}</strong>
            </div>
            <div className="info-tile">
              <span className="detail-label">GST Number</span>
              <strong>{invoice.customer?.gstNumber || '-'}</strong>
            </div>
            <div className="info-tile">
              <span className="detail-label">Address</span>
              <strong>{invoice.customer?.address || '-'}</strong>
            </div>
            <div className="info-tile">
              <span className="detail-label">Billing Status</span>
              <strong>Prepared and ready</strong>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default InvoiceViewPage;
