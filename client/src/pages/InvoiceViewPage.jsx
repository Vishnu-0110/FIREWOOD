import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import AppLayout from '../layout/AppLayout';
import api from '../api/axiosClient';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/format';
import { isSilentAuthError } from '../utils/apiErrors';
import { downloadInvoicePdf, printInvoicePdf } from '../utils/pdf';

const InvoiceViewPage = () => {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);

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

  return (
    <AppLayout>
      <div className="card shadow-sm">
        <div className="card-header d-flex justify-content-between">
          <span>Invoice #{invoice.invoiceNumber}</span>
          <div className="d-flex gap-2">
            <button className="btn btn-sm btn-warning" onClick={downloadPdf}>Download PDF</button>
            <button className="btn btn-sm btn-outline-dark" onClick={printPdf}>Print</button>
          </div>
        </div>
        <div className="card-body">
          <p className="mb-1"><strong>Date:</strong> {formatDate(invoice.date)}</p>
          <p className="mb-1"><strong>Factory:</strong> {invoice.customer?.factoryName || invoice.customer?.customerName}</p>
          <p className="mb-1"><strong>Vehicle:</strong> {invoice.vehicleNumber}</p>
          <hr />
          <div className="row">
            <div className="col-md-4">Gross: <strong>{invoice.grossWeight}</strong></div>
            <div className="col-md-4">Tare: <strong>{invoice.tareWeight}</strong></div>
            <div className="col-md-4">Net: <strong>{invoice.netWeight}</strong></div>
          </div>
          <div className="mt-3">
            Rate/Ton: <strong>{Number(invoice.ratePerTon || 0).toLocaleString('en-IN')}</strong><br />
            Total: <strong>{formatCurrency(invoice.totalAmount)}</strong><br />
            Amount in words: <strong>{invoice.amountInWords}</strong>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default InvoiceViewPage;
