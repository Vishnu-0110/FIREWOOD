import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import AppLayout from '../layout/AppLayout';
import api from '../api/axiosClient';
import LoadingSpinner from '../components/LoadingSpinner';
import { DownloadIcon, EyeIcon, IconAction, PrintIcon, ShareIcon } from '../components/AppIcons';
import { formatCurrency, formatDate } from '../utils/format';
import { isSilentAuthError } from '../utils/apiErrors';
import { downloadInvoicePdf, printInvoicePdf, shareInvoicePdf, viewInvoicePdf } from '../utils/pdf';
import {
  buildInvoicePdfArtifacts,
  downloadBlob,
  isSamsungInternet,
  openPdfDataUrl,
  printPdfDataUrl
} from '../utils/pdfCompat';

const InvoiceViewPage = () => {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadTick, setReloadTick] = useState(0);
  const [activeAction, setActiveAction] = useState('');
  const [pdfArtifacts, setPdfArtifacts] = useState(null);
  const [isPreparingPdf, setIsPreparingPdf] = useState(false);
  const actionLockRef = useRef('');
  const samsungInternet = isSamsungInternet();

  useEffect(() => {
    let active = true;

    const loadInvoice = async () => {
      setLoading(true);
      setError('');

      try {
        const res = await api.get(`/invoices/${id}`);
        if (active) {
          setInvoice(res.data);
        }
      } catch (loadError) {
        if (isSilentAuthError(loadError)) return;

        const message = loadError?.response?.data?.message || 'Could not load invoice';
        if (active) {
          setInvoice(null);
          setError(message);
        }
        toast.error(message);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadInvoice();

    return () => {
      active = false;
    };
  }, [id, reloadTick]);

  useEffect(() => {
    if (!invoice || !samsungInternet) {
      setPdfArtifacts(null);
      setIsPreparingPdf(false);
      return undefined;
    }

    let active = true;

    const preparePdfArtifacts = async () => {
      setIsPreparingPdf(true);
      try {
        const artifacts = await buildInvoicePdfArtifacts(invoice);
        if (active) {
          setPdfArtifacts(artifacts);
        }
      } catch {
        if (active) {
          setPdfArtifacts(null);
        }
      } finally {
        if (active) {
          setIsPreparingPdf(false);
        }
      }
    };

    void preparePdfArtifacts();

    return () => {
      active = false;
    };
  }, [invoice, samsungInternet]);

  const runAction = async (name, action) => {
    if (actionLockRef.current) return false;

    actionLockRef.current = name;
    setActiveAction(name);
    try {
      return await action();
    } finally {
      actionLockRef.current = '';
      setActiveAction('');
    }
  };

  if (loading) return <LoadingSpinner full />;

  if (error) {
    return (
      <AppLayout>
        <div className="row justify-content-center">
          <div className="col-12 col-lg-8">
            <div className="card shadow-sm">
              <div className="card-body p-4 p-md-5 text-center">
                <h1 className="h4 mb-2">Could not load invoice</h1>
                <p className="text-muted mb-4">{error}</p>
                <button type="button" className="btn btn-warning btn-lg" onClick={() => setReloadTick((value) => value + 1)}>
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
    }

  if (!invoice) return <LoadingSpinner full />;

  const invoicePdfName = `Invoice-${invoice.invoiceNumber}.pdf`;
  const invoicePdfTitle = `Invoice #${invoice.invoiceNumber}`;
  const hasSamsungPdfArtifacts = Boolean(pdfArtifacts?.blob && pdfArtifacts?.dataUrl);

  const downloadPdf = async () => {
    if (samsungInternet) {
      if (!hasSamsungPdfArtifacts) {
        toast.info('Preparing invoice PDF...');
        return;
      }

      downloadBlob(pdfArtifacts.blob, invoicePdfName);
      return;
    }

    await runAction('download', async () => {
      await downloadInvoicePdf(invoice);
    });
  };

  const viewPdf = async () => {
    if (samsungInternet) {
      if (!hasSamsungPdfArtifacts) {
        toast.info('Preparing invoice preview...');
        return;
      }

      if (!openPdfDataUrl(pdfArtifacts.dataUrl, invoicePdfTitle, pdfArtifacts.blob)) {
        toast.info('Could not open a PDF preview here.');
      }
      return;
    }

    await runAction('view', async () => {
      const opened = await viewInvoicePdf(invoice);
      if (!opened) {
        toast.info('Could not open a PDF preview here.');
      }
    });
  };

  const printPdf = async () => {
    if (samsungInternet) {
      if (!hasSamsungPdfArtifacts) {
        toast.info('Preparing invoice PDF...');
        return;
      }

      if (!printPdfDataUrl(pdfArtifacts.dataUrl, invoicePdfTitle, pdfArtifacts.blob)) {
        toast.info('Could not open print preview here.');
      }
      return;
    }

    await runAction('print', async () => {
      await printInvoicePdf(invoice);
    });
  };

  const sharePdf = async () => {
    if (samsungInternet) {
      if (!hasSamsungPdfArtifacts) {
        toast.info('Preparing invoice PDF...');
        return;
      }

      try {
        const file = new File([pdfArtifacts.blob], invoicePdfName, { type: 'application/pdf' });
        const shareText = `Invoice for ${factoryName}`;
        const shareLink = window.location.href;
        let canShareFile = false;

        if (typeof navigator.canShare === 'function') {
          try {
            canShareFile = navigator.canShare({ files: [file] });
          } catch {
            canShareFile = false;
          }
        } else if (typeof navigator.share === 'function') {
          canShareFile = true;
        }

        if (typeof navigator.share === 'function' && canShareFile) {
          try {
            await navigator.share({
              title: invoicePdfTitle,
              text: shareText,
              files: [file]
            });
            return;
          } catch (shareError) {
            if (shareError?.name === 'AbortError') {
              return;
            }
          }
        }

        if (typeof navigator.share === 'function') {
          try {
            await navigator.share({
              title: invoicePdfTitle,
              text: shareText,
              url: shareLink
            });
            return;
          } catch (shareError) {
            if (shareError?.name === 'AbortError') {
              return;
            }
          }
        }

        if (navigator.clipboard?.writeText) {
          try {
            await navigator.clipboard.writeText(shareLink);
            toast.success('Invoice link copied to clipboard.');
            return;
          } catch {
            // Fall through to the informational message below.
          }
        }

        toast.info('Sharing not available here.');
      } catch {
        toast.error('Could not share invoice.');
      }
      return;
    }

    await runAction('share', async () => {
      try {
        const shared = await shareInvoicePdf(invoice);
        if (!shared) {
          toast.info('Sharing not available here.');
        }
      } catch (shareError) {
        if (shareError?.name !== 'AbortError') {
          toast.error('Could not share invoice.');
        }
      }
    });
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
        <div className="hero-actions action-row-grid action-row-grid--buttons">
          <IconAction
            type="button"
            icon={EyeIcon}
            label={samsungInternet && !hasSamsungPdfArtifacts ? 'Preparing preview...' : 'View PDF'}
            className="btn-outline-success btn-sm"
            onClick={viewPdf}
            disabled={Boolean(activeAction) || (samsungInternet && isPreparingPdf)}
          />
          <IconAction
            type="button"
            icon={DownloadIcon}
            label={samsungInternet && !hasSamsungPdfArtifacts ? 'Preparing download...' : 'Download PDF'}
            className="btn-warning btn-sm"
            onClick={downloadPdf}
            disabled={Boolean(activeAction) || (samsungInternet && isPreparingPdf)}
          />
          <IconAction
            type="button"
            icon={PrintIcon}
            label="Print"
            className="btn-outline-dark btn-sm"
            onClick={printPdf}
            disabled={Boolean(activeAction) || (samsungInternet && isPreparingPdf)}
          />
          <IconAction
            type="button"
            icon={ShareIcon}
            label={activeAction === 'share' ? 'Sharing...' : 'Share'}
            className="btn-outline-primary btn-sm"
            onClick={sharePdf}
            disabled={Boolean(activeAction) || (samsungInternet && isPreparingPdf)}
          />
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
