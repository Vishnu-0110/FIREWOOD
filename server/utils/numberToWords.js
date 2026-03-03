const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigits(num) {
  if (num < 10) return ones[num];
  if (num < 20) return teens[num - 10];
  const t = Math.floor(num / 10);
  const o = num % 10;
  return `${tens[t]}${o ? ` ${ones[o]}` : ''}`.trim();
}

function threeDigits(num) {
  const h = Math.floor(num / 100);
  const rem = num % 100;
  const hPart = h ? `${ones[h]} Hundred` : '';
  const rPart = rem ? twoDigits(rem) : '';
  return `${hPart}${hPart && rPart ? ' ' : ''}${rPart}`.trim();
}

function numberToWordsIndian(amount) {
  const rounded = Math.round(Number(amount));
  if (Number.isNaN(rounded) || rounded < 0) return '';
  if (rounded === 0) return 'Zero Rupees Only';

  let num = rounded;
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const hundredPart = num;

  const parts = [];
  if (crore) parts.push(`${twoDigits(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (hundredPart) parts.push(threeDigits(hundredPart));

  return `${parts.join(' ').replace(/\s+/g, ' ').trim()} Rupees Only`;
}

module.exports = numberToWordsIndian;