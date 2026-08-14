import dayjs from 'dayjs';
import { downloadInvoiceTemplatePdf, viewInvoicePdf } from './pdf';

const isBrowser = () => typeof window !== 'undefined' && typeof document !== 'undefined';

export const isSamsungInternet = () => {
  if (!isBrowser()) return false;
  const ua = navigator.userAgent || '';
  return /SamsungBrowser/i.test(ua) || (/Android/i.test(ua) && /Chrome/i.test(ua) && /Mobile/i.test(ua) && /Samsung/i.test(ua));
};

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Failed to read PDF blob'));
    reader.readAsDataURL(blob);
  });

const capturePdfBlob = async (action, { suppressDownloads = false } = {}) => {
  if (!isBrowser()) return null;

  const originalOpen = window.open;
  const originalCreateObjectURL = URL.createObjectURL.bind(URL);
  const originalRevokeObjectURL = URL.revokeObjectURL.bind(URL);
  const originalDispatchEvent = EventTarget.prototype.dispatchEvent;
  const originalClick = HTMLAnchorElement.prototype.click;
  const createdUrls = [];
  let capturedBlob = null;

  const fakeWindow = {
    document: {
      write() {},
      close() {}
    },
    location: {
      href: 'about:blank'
    },
    focus() {},
    close() {},
    addEventListener() {}
  };

  window.open = () => fakeWindow;

  URL.createObjectURL = ((...args) => {
    const blob = args[0];
    if (blob instanceof Blob) {
      capturedBlob = blob;
    }
    const url = originalCreateObjectURL(...args);
    createdUrls.push(url);
    return url;
  });

  if (suppressDownloads) {
    HTMLAnchorElement.prototype.click = function click() {};
    EventTarget.prototype.dispatchEvent = function dispatchEvent(event) {
      if (this instanceof HTMLAnchorElement && event?.type === 'click') {
        return true;
      }
      return originalDispatchEvent.call(this, event);
    };
  }

  try {
    await action();
  } finally {
    window.open = originalOpen;
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    HTMLAnchorElement.prototype.click = originalClick;
    EventTarget.prototype.dispatchEvent = originalDispatchEvent;
    createdUrls.forEach((url) => {
      try {
        originalRevokeObjectURL(url);
      } catch {
        // Ignore revocation errors from browsers that do not support the url anymore.
      }
    });
  }

  if (!capturedBlob) return null;
  const dataUrl = await blobToDataUrl(capturedBlob);
  return { blob: capturedBlob, dataUrl };
};

export const buildInvoicePdfArtifacts = async (invoice) =>
  capturePdfBlob(() => viewInvoicePdf(invoice));

export const buildInvoiceTemplatePdfArtifacts = async () =>
  capturePdfBlob(() => downloadInvoiceTemplatePdf(), { suppressDownloads: true });

export const downloadBlob = (blob, filename) => {
  if (!blob || !isBrowser()) return false;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 120000);
  return true;
};

export const openPdfDataUrl = (dataUrl, title = 'Invoice PDF') => {
  if (!isBrowser() || !dataUrl) return null;

  const previewWindow = window.open('', '_blank', 'noopener,noreferrer');
  if (!previewWindow) return null;

  previewWindow.document.open();
  previewWindow.document.write(`<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${title}</title>
        <style>
          html, body { margin: 0; width: 100%; height: 100%; background: #111827; }
          body { display: flex; align-items: stretch; justify-content: stretch; }
          iframe { border: 0; width: 100%; height: 100%; background: #fff; }
        </style>
      </head>
      <body>
        <iframe src="${dataUrl}" title="${title}"></iframe>
      </body>
    </html>`);
  previewWindow.document.close();
  previewWindow.focus();
  return previewWindow;
};

export const printPdfDataUrl = (dataUrl, title = 'Invoice PDF') => {
  if (!isBrowser() || !dataUrl) return false;

  const printWindow = window.open('', '_blank', 'noopener,noreferrer');
  if (!printWindow) return false;

  printWindow.document.open();
  printWindow.document.write(`<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${title}</title>
        <style>
          html, body { margin: 0; width: 100%; height: 100%; background: #fff; }
          iframe { border: 0; width: 100%; height: 100%; }
        </style>
      </head>
      <body>
        <iframe id="pdf-frame" src="${dataUrl}" title="${title}"></iframe>
        <script>
          const frame = document.getElementById('pdf-frame');
          frame.addEventListener('load', () => {
            setTimeout(() => {
              window.focus();
              window.print();
            }, 250);
          });
        </script>
      </body>
    </html>`);
  printWindow.document.close();
  printWindow.focus();
  return true;
};

export const getTemplateFilename = () => `INVOICE TEMPLATE ${dayjs().format('DDMMYYYY')}.pdf`;
