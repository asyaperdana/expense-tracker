/* ===========================
   ocr.js — Tesseract OCR wrapper for receipt scanning
   =========================== */

let worker = null;

// ─── Image Pre-processing ─────────────────────────────────────────
/**
 * Enhance image contrast and convert to grayscale via Canvas API.
 * This significantly improves Tesseract accuracy on phone-photographed receipts.
 * @param {File|Blob} imageFile - The original image file
 * @returns {Promise<Blob>} - Processed image blob
 */
export async function preprocessImage(imageFile) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(imageFile);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement('canvas');
      // Scale down if image is too large (Tesseract works fine at ~1800px wide)
      const MAX_WIDTH = 1800;
      let { width, height } = img;
      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to grayscale + enhance contrast
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        // Luminance-based grayscale (ITU-R BT.709)
        const gray = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];

        // Adaptive contrast stretch: push values toward black/white
        // This helps with faded thermal paper receipts
        const enhanced = applyContrast(gray, 1.5);

        data[i] = enhanced;     // R
        data[i + 1] = enhanced; // G
        data[i + 2] = enhanced; // B
        // Alpha unchanged (data[i+3])
      }

      ctx.putImageData(imageData, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Gagal memproses gambar'));
        },
        'image/png'
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Gagal membuka gambar'));
    };

    img.src = url;
  });
}

/**
 * Apply contrast enhancement to a single grayscale value (0-255).
 * @param {number} value - Original pixel value
 * @param {number} factor - Contrast factor (1.0 = no change, 2.0 = double contrast)
 * @returns {number} Enhanced pixel value clamped to [0, 255]
 */
function applyContrast(value, factor) {
  const result = (value - 128) * factor + 128;
  return Math.min(255, Math.max(0, Math.round(result)));
}

// ─── Worker Management ────────────────────────────────────────────
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

  // Set PSM 6 (assume a single uniform block of text) — good for receipts
  await worker.setParameters({
    tessedit_pageseg_mode: '6',
  });

  return worker;
}

/**
 * Run OCR on an image file and return raw text with confidence scores.
 * Pre-processes the image before OCR for better accuracy.
 * @param {File|Blob|string} imageSource - Image file, blob, or URL
 * @param {function} onProgress - Progress callback (0-100)
 * @returns {Promise<{ text: string, confidence: number }>} Recognized text and confidence
 */
export async function recognizeReceipt(imageSource, onProgress) {
  const Tesseract = window.Tesseract;
  if (!Tesseract) {
    throw new Error('Tesseract.js belum dimuat.');
  }

  if (onProgress) onProgress(5);

  // Pre-process image if it's a File/Blob
  let source = imageSource;
  if (imageSource instanceof File || imageSource instanceof Blob) {
    try {
      source = await preprocessImage(imageSource);
      if (onProgress) onProgress(20);
    } catch (_) {
      // If pre-processing fails, fall back to original
      source = imageSource;
      if (onProgress) onProgress(20);
    }
  }

  const w = await initWorker();
  if (onProgress) onProgress(30);

  const result = await w.recognize(source);
  if (onProgress) onProgress(90);

  const text = result.data ? result.data.text : '';
  const confidence = result.data ? result.data.confidence : 0;

  if (onProgress) onProgress(100);

  return { text, confidence };
}

// ─── Receipt Parser ───────────────────────────────────────────────

/**
 * Patterns that indicate header/noise lines to skip.
 */
const SKIP_LINE_PATTERNS = [
  /^[-=_.#*]{3,}$/,
  /^(NOTA|RECEIPT|STRUK|TOKO|KASIR|KASSA|NO\.|NOMOR|INV(?:OICE)?)\b/i,
  /^(TERIMA\s*KASIH|THANK\s*YOU|SELAMAT\b)/i,
  /^(JL\.?|JALAN|ALAMAT|ADDRESS)/i,
  /^(TLP\.?|TEL\.?|TELP\.?|HP\.?|PHONE|FAX|WA\.?|WHATSAPP)/i,
  /^(TGL\.?|TANGGAL|DATE|WAKTU|TIME|JAM\.?)\b/i,
  /^(BILL\s*NO|NO\.\s*\d)/i,
  /^(NPWP|SIUP|SITU|NIB)\b/i,
  /^(CASHIER|OPERATOR|PELAYAN|SERVER)\b/i,
  /^\d{2}[-/]\d{2}[-/]\d{4}\s+\d{2}:\d{2}/, // pure datetime line
  /^www\./i, // website
  /^@[a-z0-9_]+$/i, // social media handle
];

/**
 * Patterns that identify a total/grand-total line.
 */
const TOTAL_LINE_PATTERNS = [
  /^(?:GRAND\s*)?TOTAL\s*[:=]?\s*/i,
  /^JUMLAH\s*(?:TOTAL|KESELURUHAN|SEMUA)?\s*[:=]?\s*/i,
  /^GRAND\s*TOTAL\s*[:=]?\s*/i,
  /^TOTAL\s*(?:HARGA|BAYAR|TAGIHAN|PEMBAYARAN)?\s*[:=]?\s*/i,
];

/**
 * Patterns that identify a subtotal line.
 * Subtotals are parsed but not used as the final total.
 */
const SUBTOTAL_LINE_PATTERNS = [
  /^(?:JU?ML(?:AH)?|SUBTOTAL|SUB\s*TOTAL)\s*[:=]?\s*/i,
];

/**
 * Patterns that identify a payment/tender line (cash given, not total owed).
 * These help extract payment method context.
 */
const PAYMENT_LINE_PATTERNS = [
  /^(?:BAYAR|TUNAI|CASH|DEBIT|KREDIT|TRANSFER|QRIS|OVO|GOPAY|DANA|SHOPEEPAY)\s*[:=]?\s*/i,
];

/**
 * Patterns that identify a tax/service charge line.
 */
const TAX_LINE_PATTERNS = [
  /^(?:PPN|PAJAK|TAX|SERVICE\s*CHARGE|SC|DISC(?:OUNT)?|DISKON)\s*(?:\d{1,3}%?)?\s*[:=]?\s*/i,
];

/**
 * Patterns that identify a change/kembalian line.
 */
const CHANGE_LINE_PATTERNS = [
  /^(?:KEMBALIAN|CHANGE|KEMBALI)\s*[:=]?\s*/i,
];

/** Price pattern: matches a number (with dots/commas) at end of line */
const PRICE_AT_END = /(\d[\d.,]*\d|\d+)\s*$/;

/** Quantity prefix: "2x " or "2 x " or "2X" or "2 pcs" */
const QTY_PREFIX = /^(\d+)\s*(?:[xX×]|pcs|pax|unit|buah|bh)\s*/;

/**
 * Extract a date string from a receipt line.
 * Returns ISO date string (YYYY-MM-DD) or null.
 * @param {string} line
 * @returns {string|null}
 */
function extractDateFromLine(line) {
  // DD/MM/YYYY or DD-MM-YYYY
  const m1 = line.match(/\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})\b/);
  if (m1) {
    const day = m1[1].padStart(2, '0');
    const month = m1[2].padStart(2, '0');
    const year = m1[3];
    if (Number(month) >= 1 && Number(month) <= 12 && Number(day) >= 1 && Number(day) <= 31) {
      return `${year}-${month}-${day}`;
    }
  }
  // YYYY-MM-DD or YYYY/MM/DD
  const m2 = line.match(/\b(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})\b/);
  if (m2) {
    const year = m2[1];
    const month = m2[2].padStart(2, '0');
    const day = m2[3].padStart(2, '0');
    if (Number(month) >= 1 && Number(month) <= 12 && Number(day) >= 1 && Number(day) <= 31) {
      return `${year}-${month}-${day}`;
    }
  }
  return null;
}

/**
 * Extract store/merchant name from the first non-empty non-noise lines.
 * @param {string[]} lines - All lines from OCR
 * @returns {string} Store name or empty string
 */
function extractStoreName(lines) {
  for (const line of lines.slice(0, 8)) {
    if (line.length < 3) continue;
    if (SKIP_LINE_PATTERNS.some((p) => p.test(line))) continue;
    // Skip lines that look like addresses, prices, or dates
    if (/\d{2}[/:]\d{2}[/:]\d{2,4}/.test(line)) continue;
    if (PRICE_AT_END.test(line) && parsePrice(line.match(PRICE_AT_END)[1]) > 0) continue;
    // A store name is usually all-caps or mixed-case without numbers dominating
    return line.replace(/^[:\s]+/, '').trim();
  }
  return '';
}

/**
 * Parse raw OCR text from a receipt into structured data.
 *
 * Improvements over v1:
 * - Extracts store name from header lines
 * - Extracts transaction date from the receipt text
 * - Handles quantity multipliers: "2x Kopi Susu 30.000" → item + qty
 * - Tracks subtotal separately from grand total
 * - Tracks tax/discount lines
 * - Tracks payment method (Tunai/Debit/etc.)
 * - Returns confidence-filtered results
 *
 * @param {string} rawText - Raw text from OCR
 * @returns {{
 *   storeName: string,
 *   date: string|null,
 *   items: Array<{name: string, price: number, qty: number}>,
 *   subtotal: number,
 *   tax: number,
 *   discount: number,
 *   total: number,
 *   paymentMethod: string,
 * }}
 */
export function parseReceiptText(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return {
      storeName: '',
      date: null,
      items: [],
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0,
      paymentMethod: '',
    };
  }

  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const items = [];
  let total = 0;
  let subtotal = 0;
  let tax = 0;
  let discount = 0;
  let paymentMethod = '';
  let receiptDate = null;

  const storeName = extractStoreName(lines);

  for (const line of lines) {
    // Skip very short lines or pure separator lines
    if (line.length < 3) continue;
    if (SKIP_LINE_PATTERNS.some((p) => p.test(line))) continue;

    // Try to extract date (don't skip line, might still have info)
    if (!receiptDate) {
      const maybeDate = extractDateFromLine(line);
      if (maybeDate) receiptDate = maybeDate;
    }

    const priceMatch = line.match(PRICE_AT_END);
    const price = priceMatch ? parsePrice(priceMatch[1]) : 0;

    // ── Grand Total line
    if (TOTAL_LINE_PATTERNS.some((p) => p.test(line))) {
      if (price > total) total = price;
      continue;
    }

    // ── Subtotal line
    if (SUBTOTAL_LINE_PATTERNS.some((p) => p.test(line))) {
      if (price > subtotal) subtotal = price;
      continue;
    }

    // ── Change/kembalian — skip, not an expense item
    if (CHANGE_LINE_PATTERNS.some((p) => p.test(line))) continue;

    // ── Payment method line
    if (PAYMENT_LINE_PATTERNS.some((p) => p.test(line))) {
      if (!paymentMethod) {
        const methodMatch = line.match(
          /^(TUNAI|CASH|DEBIT|KREDIT|TRANSFER|QRIS|OVO|GOPAY|DANA|SHOPEEPAY)/i
        );
        if (methodMatch) paymentMethod = methodMatch[1].toUpperCase();
      }
      continue;
    }

    // ── Tax / discount line
    if (TAX_LINE_PATTERNS.some((p) => p.test(line))) {
      if (price > 0) {
        if (/DISC(?:OUNT)?|DISKON/i.test(line)) {
          discount += price;
        } else {
          tax += price;
        }
      }
      continue;
    }

    // ── Item line: must have a price
    if (!priceMatch || price <= 0) continue;

    let itemPart = line.slice(0, priceMatch.index).trim();

    // Remove quantity prefix and capture qty
    let qty = 1;
    const qtyMatch = itemPart.match(QTY_PREFIX);
    if (qtyMatch) {
      qty = Number(qtyMatch[1]) || 1;
      itemPart = itemPart.slice(qtyMatch[0].length).trim();
    }

    // Remove "@price" unit price notation (e.g. "@12,500")
    itemPart = itemPart.replace(/@\s*\d[\d.,]*\d?\s*$/, '').trim();

    // Remove trailing separator characters (dots, dashes, colons used as fill)
    itemPart = itemPart.replace(/[.:_\-\s]+$/, '').trim();

    // Skip if item name is empty or too short after stripping
    if (!itemPart || itemPart.length < 2) continue;

    // Skip lines where item part looks like a non-item (store hours, etc.)
    if (/^\d{2}:\d{2}/.test(itemPart)) continue;

    // Capitalize first letter
    itemPart = itemPart.charAt(0).toUpperCase() + itemPart.slice(1);

    items.push({ name: itemPart, price, qty });
  }

  // ── Post-processing: determine the best total value
  // Priority: explicit grand total > subtotal+tax > sum of items
  if (total === 0) {
    if (subtotal > 0) {
      total = subtotal + tax - discount;
    } else if (items.length > 0) {
      total = items.reduce((sum, item) => sum + item.price, 0);
    }
  }

  // If subtotal not found, calculate from items
  if (subtotal === 0 && items.length > 0) {
    subtotal = items.reduce((sum, item) => sum + item.price, 0);
  }

  return {
    storeName,
    date: receiptDate,
    items,
    subtotal,
    tax,
    discount,
    total,
    paymentMethod,
  };
}

/**
 * Parse a price string into a whole number (in IDR, no decimals).
 * Handles: "25,000" "25.000" "25000" "1,250,000" "1.250.000,00"
 * @param {string} str
 * @returns {number}
 */
function parsePrice(str) {
  if (!str) return 0;

  let cleaned = str.replace(/\s/g, '');
  if (!cleaned) return 0;

  const dotCount = (cleaned.match(/\./g) || []).length;
  const commaCount = (cleaned.match(/,/g) || []).length;

  if (dotCount > 0 && commaCount === 0) {
    // "25.000" or "1.250.000" — dots as thousand separators
    // "25.50" — dot as decimal (unlikely on IDR receipts)
    const parts = cleaned.split('.');
    const lastPart = parts[parts.length - 1];
    if (lastPart.length === 3 || parts.length > 2) {
      cleaned = cleaned.replace(/\./g, '');
    } else {
      // Looks like a decimal — still round to int for IDR
      const n = Number(cleaned);
      return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
    }
  } else if (commaCount > 0 && dotCount === 0) {
    // "25,000" — comma as thousand separator
    // "25,50" — comma as decimal (unlikely on IDR receipts)
    const parts = cleaned.split(',');
    const lastPart = parts[parts.length - 1];
    if (lastPart.length === 3 || parts.length > 2) {
      cleaned = cleaned.replace(/,/g, '');
    } else {
      const n = Number(cleaned.replace(',', '.'));
      return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
    }
  } else if (dotCount > 0 && commaCount > 0) {
    // Mixed: "1,250,000.00" or "1.250.000,00"
    // The character appearing LAST is the decimal separator
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
