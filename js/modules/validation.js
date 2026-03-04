/* ===========================
   validation.js — Form validation logic
   =========================== */

// ─── Date Validation ──────────────────────
export function isValidIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parts = value.split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return false;
  const d = new Date(value + 'T00:00:00');
  return d.getFullYear() === year && d.getMonth() + 1 === month && d.getDate() === day;
}

export function toDisplayDate(isoDate) {
  if (!isValidIsoDate(isoDate)) return '';
  const parts = isoDate.split('-');
  return parts[2] + '/' + parts[1] + '/' + parts[0];
}

export function toIsoDate(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  if (isValidIsoDate(raw)) return raw;

  let compact = raw.replace(/[^\d]/g, '');
  let normalized = raw;
  if (compact.length === 8 && raw.indexOf('/') === -1 && raw.indexOf('-') === -1) {
    normalized = compact.slice(0, 2) + '/' + compact.slice(2, 4) + '/' + compact.slice(4, 8);
  }

  const match = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return '';

  const dd = String(Number(match[1])).padStart(2, '0');
  const mm = String(Number(match[2])).padStart(2, '0');
  const yyyy = match[3];
  const iso = yyyy + '-' + mm + '-' + dd;

  return isValidIsoDate(iso) ? iso : '';
}

// ─── Expense Validation ───────────────────
/**
 * Validates expense form data.
 * @param {Object} data - { date, title, category, amount, type, wallet, walletTo }
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateExpense(data) {
  const errors = [];

  // Date validation
  if (!data.date) {
    errors.push('Tanggal wajib diisi');
  } else {
    const isoDate = toIsoDate(data.date);
    if (!isoDate) {
      errors.push('Gunakan format dd/mm/yyyy yang valid');
    } else if (isoDate > data.todayString) {
      errors.push('Tanggal tidak boleh di masa depan');
    }
  }

  // Title validation
  if (!data.title || !data.title.trim()) {
    errors.push('Nama transaksi wajib diisi');
  } else if (data.title.trim().length < 3) {
    errors.push('Minimal 3 karakter untuk nama transaksi');
  }

  // Wallet validation
  if (!data.wallet) {
    errors.push('Pilih sumber dana');
  }

  const isTransfer = data.type === 'transfer';

  // Category validation (not for transfers)
  if (!isTransfer && !data.category) {
    errors.push('Kategori wajib diisi');
  }

  // Transfer wallet validation
  if (isTransfer) {
    if (!data.walletTo) {
      errors.push('Pilih tujuan dana');
    }
    if (data.wallet && data.walletTo && data.wallet === data.walletTo) {
      errors.push('Dompet asal dan tujuan tidak boleh sama');
    }
  }

  // Amount validation
  const rawAmount = String(data.amount || '').replace(/,/g, '');
  if (!rawAmount || Number(rawAmount) <= 0) {
    errors.push('Nominal harus lebih dari 0');
  }

  return {
    valid: errors.length === 0,
    errors: errors,
  };
}
