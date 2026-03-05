/* ===========================
   ocr.js — Tesseract OCR wrapper for receipt scanning
   =========================== */

let worker = null;

/**
 * Initialize Tesseract worker with Indonesian + English language support.
 * Reuses existing worker if already initialized.
 */
export async function initWorker() {
  if (worker) return worker;

  const Tesseract = window.Tesseract;
  if (!Tesseract) {
    throw new Error('Tesseract.js belum dimuat. Periksa koneksi internet.');
  }

  worker = await Tesseract.createWorker('ind+eng', 1, {
    logger: () => {},
  });

  return worker;
}

/**
 * Run OCR on an image file and return raw text.
 * @param {File|Blob|string} imageSource - Image file, blob, or URL
 * @param {function} onProgress - Progress callback (0-100)
 * @returns {Promise<string>} Recognized text
 */
export async function recognizeReceipt(imageSource, onProgress) {
  const Tesseract = window.Tesseract;
  if (!Tesseract) {
    throw new Error('Tesseract.js belum dimuat.');
  }

  if (onProgress) onProgress(10);

  const w = await initWorker();

  if (onProgress) onProgress(30);

  const result = await w.recognize(imageSource);

  if (onProgress) onProgress(90);

  const text = result.data ? result.data.text : '';

  if (onProgress) onProgress(100);

  return text;
}

/**
 * Parse raw OCR text from a receipt into structured items and total.
 *
 * Handles common Indonesian receipt formats:
 * - "Item Name    25,000" or "Item Name    25.000"
 * - "2x Item Name  @12,500  25,000"
 * - "TOTAL  125,000"
 *
 * @param {string} rawText - Raw text from OCR
 * @returns {{ items: Array<{name: string, price: number}>, total: number }}
 */
export function parseReceiptText(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return { items: [], total: 0 };
  }

  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const items = [];
  let total = 0;

  // Patterns for total line detection
  const totalPatterns = [
    /^(?:GRAND\s*)?TOTAL\s*[:=]?\s*/i,
    /^(?:JU?ML(?:AH)?|SUBTOTAL|SUB\s*TOTAL)\s*[:=]?\s*/i,
    /^(?:BAYAR|TUNAI|CASH|DEBIT|KREDIT)\s*[:=]?\s*/i,
  ];

  // Price pattern: matches "25,000" or "25.000" or "25000" at end of line
  const priceAtEnd = /(\d[\d.,]*\d)\s*$/;
  // Quantity prefix: "2x " or "2 x " or "2X"
  const qtyPrefix = /^\d+\s*[xX×]\s*/;

  for (const line of lines) {
    // Skip header/noise lines (very short, or just dashes/symbols)
    if (line.length < 3) continue;
    if (/^[-=_.#*]{3,}$/.test(line)) continue;
    if (/^(NOTA|RECEIPT|STRUK|TOKO|KASIR|NO\.|TANGGAL|WAKTU|ALAMAT)/i.test(line)) continue;
    if (/^(TERIMA\s*KASIH|THANK|SELAMAT)/i.test(line)) continue;
    // Skip address, phone, date/time lines
    if (/^(JL\.?|JALAN|ALAMAT)/i.test(line)) continue;
    if (/^(TLP\.?|TEL\.?|TELP\.?|HP\.?|PHONE|FAX)/i.test(line)) continue;
    if (/^(TGL\.?|TANGGAL|DATE|WAKTU|TIME)/i.test(line)) continue;
    if (/^(NO\.?\s*:?\s*\d|INVOICE|BILL\s*NO)/i.test(line)) continue;

    // Check if this is a total line
    let isTotalLine = false;
    for (const pattern of totalPatterns) {
      if (pattern.test(line)) {
        isTotalLine = true;
        break;
      }
    }

    const priceMatch = line.match(priceAtEnd);
    if (!priceMatch) continue;

    const rawPrice = priceMatch[1];
    const price = parsePrice(rawPrice);
    if (price <= 0) continue;

    if (isTotalLine) {
      // Use the largest total-like value found
      if (price > total) total = price;
      continue;
    }

    // Extract item name (everything before the price)
    let itemPart = line.slice(0, priceMatch.index).trim();

    // Remove quantity prefix if present
    itemPart = itemPart.replace(qtyPrefix, '').trim();

    // Remove trailing dots, dashes, colons used as separators
    itemPart = itemPart.replace(/[.:\-_]+$/, '').trim();

    // Remove "@price" unit price notation (e.g. "@12,500")
    itemPart = itemPart.replace(/@\s*\d[\d.,]*\d?\s*$/, '').trim();

    if (!itemPart) itemPart = 'Item';

    // Capitalize first letter
    itemPart = itemPart.charAt(0).toUpperCase() + itemPart.slice(1);

    items.push({ name: itemPart, price });
  }

  // If no explicit total found, sum up all items
  if (total === 0 && items.length > 0) {
    total = items.reduce((sum, item) => sum + item.price, 0);
  }

  return { items, total };
}

/**
 * Parse a price string into a number.
 * Handles: "25,000" "25.000" "25000" "1,250,000"
 */
function parsePrice(str) {
  if (!str) return 0;

  let cleaned = str.replace(/\s/g, '');

  // Determine if dots or commas are thousand separators
  // Indonesian format: 25.000 (dot = thousand separator)
  // Or: 25,000 (comma = thousand separator)
  const dotCount = (cleaned.match(/\./g) || []).length;
  const commaCount = (cleaned.match(/,/g) || []).length;

  if (dotCount > 0 && commaCount === 0) {
    // Could be "25.000" (=25000) or "25.50" (=25.50)
    // Indonesian receipts almost always use dot as thousand separator
    // If last segment after dot has 3 digits, treat as thousand sep
    const parts = cleaned.split('.');
    const lastPart = parts[parts.length - 1];
    if (lastPart.length === 3 || parts.length > 2) {
      // Thousand separator
      cleaned = cleaned.replace(/\./g, '');
    }
    // else keep as decimal (unlikely for receipt prices > 100)
  } else if (commaCount > 0 && dotCount === 0) {
    // "25,000" — comma as thousand separator
    const parts = cleaned.split(',');
    const lastPart = parts[parts.length - 1];
    if (lastPart.length === 3 || parts.length > 2) {
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (dotCount > 0 && commaCount > 0) {
    // Mixed: "1,250,000.00" or "1.250.000,00"
    // Find which comes last — that's likely the decimal separator
    const lastDot = cleaned.lastIndexOf('.');
    const lastComma = cleaned.lastIndexOf(',');
    if (lastDot > lastComma) {
      // "1,250,000.00" — comma=thousand, dot=decimal
      cleaned = cleaned.replace(/,/g, '');
    } else {
      // "1.250.000,00" — dot=thousand, comma=decimal
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    }
  }

  const num = Number(cleaned);
  return Number.isFinite(num) && num > 0 ? Math.round(num) : 0;
}

/**
 * Terminate the OCR worker and free resources.
 */
export async function terminateWorker() {
  if (worker) {
    try {
      await worker.terminate();
    } catch (_) {
      // ignore termination errors
    }
    worker = null;
  }
}
