/* ===========================
   calculations.js — Pure calculation functions
   =========================== */
import { OTHER_EXPENSE_CATEGORY } from './state.js';

// ─── Format Helpers ───────────────────────
/**
 * Formats a number as Indonesian Rupiah currency.
 * @param {number} num - The number to format
 * @returns {string} Formatted Rupiah string (e.g., "Rp 1.000.000")
 */
export function formatRupiah(num) {
  return 'Rp ' + Number(num).toLocaleString('id-ID');
}

function clampNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatLocaleNumber(value, maxFractionDigits, minFractionDigits) {
  return Number(value).toLocaleString('id-ID', {
    minimumFractionDigits: minFractionDigits,
    maximumFractionDigits: maxFractionDigits,
  });
}

function getCompactFractionDigits(scaled) {
  const absScaled = Math.abs(Number(scaled) || 0);
  if (absScaled >= 100) return 0;
  if (absScaled >= 10) return 1;
  return 2;
}

/**
 * Formats a number as compact Rupiah (e.g., "Rp 1,5 jt" or "Rp 500 rb").
 * @param {number} num - The number to format
 * @param {Object} options - Formatting options
 * @returns {string} Compact formatted Rupiah string
 */
export function formatRupiahCompact(num, options = {}) {
  const value = clampNumber(num);
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  const withPrefix = options.withPrefix !== false;
  const unitSpacing = options.unitSpacing !== false ? ' ' : '';
  const minFractionDigits = Number.isFinite(options.minFractionDigits)
    ? Math.max(0, options.minFractionDigits)
    : 0;
  const fixedMaxFractionDigits = Number.isFinite(options.maxFractionDigits)
    ? Math.max(minFractionDigits, options.maxFractionDigits)
    : null;
  let divisor = 1;
  let suffix = '';

  if (abs >= 1000000) {
    divisor = 1000000;
    suffix = 'jt';
  } else if (abs >= 1000) {
    divisor = 1000;
    suffix = 'rb';
  }

  const scaled = value / divisor;
  const maxFractionDigits =
    fixedMaxFractionDigits == null ? getCompactFractionDigits(scaled) : fixedMaxFractionDigits;
  const formatted = formatLocaleNumber(Math.abs(scaled), maxFractionDigits, minFractionDigits);
  const core = suffix ? formatted + unitSpacing + suffix : formatted;
  return withPrefix ? sign + 'Rp ' + core : sign + core;
}

/**
 * Formats a number as percentage.
 * @param {number} value - The value to format
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted percentage string
 */
export function formatPercent(value, decimals = 1) {
  const safeDecimals = Number.isFinite(decimals) ? Math.max(0, decimals) : 1;
  const n = clampNumber(value);
  return formatLocaleNumber(n, safeDecimals, 0) + '%';
}

export function truncateLabel(label, maxLength = 24) {
  const text = String(label || '').trim();
  const safeLength = Number.isFinite(maxLength) ? Math.max(2, Math.floor(maxLength)) : 24;
  if (text.length <= safeLength) return text;
  return text.slice(0, safeLength - 1).trimEnd() + '…';
}

export function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function normalizePersonName(name) {
  return String(name || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

export function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Generates a unique ID using timestamp and random string.
 * @returns {string} Unique identifier
 */
export function generateId() {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
}

// ─── Date Helpers ─────────────────────────
export function getCurrentMonthKey() {
  const now = new Date();
  return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
}

export function getMonthLabel(monthKey) {
  if (!monthKey || monthKey.length !== 7) return 'Bulan Ini';
  const monthNames = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];
  const parts = monthKey.split('-');
  const year = Number(parts[0]);
  const monthIndex = Number(parts[1]) - 1;
  if (monthIndex < 0 || monthIndex > 11 || !year) return 'Bulan Ini';
  return monthNames[monthIndex] + ' ' + year;
}

export function getPreviousMonthKey(monthKey) {
  const parts = (monthKey || getCurrentMonthKey()).split('-');
  let year = Number(parts[0]);
  let month = Number(parts[1]);
  if (!year || !month) return getCurrentMonthKey();
  month -= 1;
  if (month === 0) {
    month = 12;
    year -= 1;
  }
  return year + '-' + String(month).padStart(2, '0');
}

export function getNextMonthKey(monthKey) {
  const parts = (monthKey || getCurrentMonthKey()).split('-');
  let year = Number(parts[0]);
  let month = Number(parts[1]);
  if (!year || !month) return getCurrentMonthKey();
  month += 1;
  if (month === 13) {
    month = 1;
    year += 1;
  }
  return year + '-' + String(month).padStart(2, '0');
}

export function getTodayString() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return d.getFullYear() + '-' + mm + '-' + dd;
}

// ─── Calculations ─────────────────────────
/**
 * Calculates totals for income, expense, and balance from expenses array.
 * @param {Array} expenses - Array of expense items
 * @returns {{income: number, expense: number, balance: number}} Totals object
 */
export function calculateTotal(expenses) {
  return expenses.reduce(
    function (res, item) {
      if (item.type === 'income') {
        res.income += item.amount;
      } else if (item.type === 'expense') {
        res.expense += item.amount;
      }
      res.balance = res.income - res.expense;
      return res;
    },
    { income: 0, expense: 0, balance: 0 }
  );
}

/**
 * Calculates wallet balances based on all transactions.
 * @param {Array} expenses - Array of expense items
 * @param {Array} wallets - Array of wallet objects
 * @returns {Object} Map of wallet names to balance values
 */
export function calculateWalletBalances(expenses, wallets) {
  const walletsResult = {};
  wallets.forEach(function (w) {
    walletsResult[w.name] = 0;
  });

  expenses.forEach(function (item) {
    const w = item.wallet || 'Tunai';
    if (typeof walletsResult[w] === 'undefined') walletsResult[w] = 0;

    if (item.type === 'income') {
      walletsResult[w] += item.amount;
    } else if (item.type === 'expense') {
      walletsResult[w] -= item.amount;
    } else if (item.type === 'transfer') {
      const wTo = item.walletTo || 'Tunai';
      if (typeof walletsResult[wTo] === 'undefined') walletsResult[wTo] = 0;
      walletsResult[w] -= item.amount;
      walletsResult[wTo] += item.amount;
    }
  });

  return walletsResult;
}

export function calculateMonthlySummary(expenses, monthKey) {
  const previousMonthKey = getPreviousMonthKey(monthKey);
  const monthData = expenses.filter(function (item) {
    return item.date && item.date.substring(0, 7) === monthKey;
  });

  let monthIncome = 0;
  let monthExpense = 0;
  const categoryTotals = {};
  let largestExpense = null;

  monthData.forEach(function (item) {
    if (item.type === 'income') {
      monthIncome += item.amount;
    } else if (item.type !== 'transfer') {
      monthExpense += item.amount;
      categoryTotals[item.category] = (categoryTotals[item.category] || 0) + item.amount;
      if (!largestExpense || item.amount > largestExpense.amount) {
        largestExpense = item;
      }
    }
  });

  let topCategory = '—';
  let topCategoryAmount = 0;
  Object.keys(categoryTotals).forEach(function (cat) {
    if (categoryTotals[cat] > topCategoryAmount) {
      topCategoryAmount = categoryTotals[cat];
      topCategory = cat;
    }
  });

  const prevExpense = expenses.reduce(function (sum, item) {
    if (
      item.type !== 'income' &&
      item.type !== 'transfer' &&
      item.date &&
      item.date.substring(0, 7) === previousMonthKey
    ) {
      return sum + item.amount;
    }
    return sum;
  }, 0);

  const net = monthIncome - monthExpense;
  let trendText = 'Stabil terhadap bulan lalu.';
  if (prevExpense === 0 && monthExpense > 0) {
    trendText = 'Ada pengeluaran baru dibanding bulan lalu.';
  } else if (prevExpense > 0) {
    const diff = monthExpense - prevExpense;
    const pct = Math.abs((diff / prevExpense) * 100);
    if (diff > 0) {
      trendText = 'Naik ' + pct.toFixed(1) + '% dibanding bulan lalu.';
    } else if (diff < 0) {
      trendText = 'Turun ' + pct.toFixed(1) + '% dibanding bulan lalu.';
    }
  }

  let advice = 'Belum ada rekomendasi.';
  if (monthExpense === 0) {
    advice = 'Belum ada pengeluaran tercatat di bulan ini. Jaga konsistensi pencatatan.';
  } else if (net < 0) {
    advice =
      'Pengeluaran melebihi pemasukan. Prioritaskan biaya wajib dan kurangi pos non-esensial.';
  } else if (topCategoryAmount > 0 && topCategoryAmount / monthExpense >= 0.45) {
    advice =
      'Kategori ' +
      topCategory +
      ' mendominasi pengeluaran. Pertimbangkan set budget lebih ketat di kategori ini.';
  } else if (monthIncome > 0 && monthExpense / monthIncome >= 0.8) {
    advice =
      'Pengeluaran sudah mendekati pemasukan. Sisakan buffer minimal 20% untuk tabungan/darurat.';
  } else {
    advice = 'Arus kas bulan ini cukup sehat. Pertahankan ritme dan tingkatkan porsi tabungan.';
  }

  return {
    monthData,
    monthIncome,
    monthExpense,
    net,
    categoryTotals,
    topCategory,
    topCategoryAmount,
    largestExpense,
    trendText,
    advice,
    count: monthData.length,
  };
}

export function getMonthlyExpenseByCategory(expenses, monthKey) {
  const totals = {};
  expenses.forEach(function (item) {
    if (item.type === 'income' || item.type === 'transfer') return;
    if (!item.date || item.date.substring(0, 7) !== monthKey) return;
    const cat = item.category || OTHER_EXPENSE_CATEGORY;
    totals[cat] = (totals[cat] || 0) + item.amount;
  });
  return totals;
}

export function getFilteredData(expenses, filters) {
  const selectedSearch = (filters.search || '').trim().toLowerCase();
  const selectedCat = filters.category || 'Semua';
  const selectedMonth = filters.month || '';
  const selectedSort = filters.sort || 'date-desc';

  let filtered = expenses.filter(function (e) {
    const haystack = [
      e.date || '',
      e.title || '',
      e.category || '',
      e.wallet || '',
      e.walletTo || '',
      e.type || '',
      String(e.amount || ''),
      Number(e.amount || 0).toLocaleString('en-US'),
      Number(e.amount || 0).toLocaleString('id-ID'),
    ]
      .join(' ')
      .toLowerCase();
    const searchMatch = !selectedSearch || haystack.indexOf(selectedSearch) !== -1;
    const catMatch = selectedCat === 'Semua' || e.category === selectedCat;
    const monthMatch = !selectedMonth || e.date.substring(0, 7) === selectedMonth;
    return searchMatch && catMatch && monthMatch;
  });

  filtered.sort(function (a, b) {
    if (selectedSort === 'date-asc') return a.date.localeCompare(b.date);
    if (selectedSort === 'amount-desc') return b.amount - a.amount || b.date.localeCompare(a.date);
    if (selectedSort === 'amount-asc') return a.amount - b.amount || b.date.localeCompare(a.date);
    return b.date.localeCompare(a.date);
  });

  return filtered;
}

export function getOwnerSettlementDescriptor(net) {
  if (net > 0) {
    return { key: 'receive', text: 'Teman harus bayar saya ' + formatRupiah(net) };
  }
  if (net < 0) {
    return { key: 'pay', text: 'Saya harus bayar ' + formatRupiah(Math.abs(net)) };
  }
  return { key: 'even', text: 'Lunas' };
}

export function getOwnerSettlement(ownerName, results) {
  const ownerKey = normalizePersonName(ownerName);
  if (!ownerKey) return null;

  let owner = null;
  results.forEach(function (p) {
    if (!owner && normalizePersonName(p.name) === ownerKey) {
      owner = p;
    }
  });
  if (!owner) return null;

  const status = getOwnerSettlementDescriptor(owner.net);
  return {
    id: owner.id,
    name: owner.name,
    share: owner.share,
    paid: owner.paid,
    net: owner.net,
    statusKey: status.key,
    statusText: status.text,
  };
}

export function calculateSplitResults(
  billName,
  total,
  splitMode,
  people,
  payerId,
  ownerName,
  date
) {
  let results = [];
  const payer = people.find((p) => p.id === payerId) || people[0];
  let customTotal = 0;

  if (splitMode === 'equal') {
    const share = Math.round(total / people.length);
    const remainder = total - share * people.length;
    people.forEach((p, i) => {
      results.push({
        id: p.id,
        name: p.name,
        share: share + (i === 0 ? remainder : 0),
      });
    });
  } else {
    // Custom mode
    people.forEach((p) => {
      const share = Number(p.customAmount);
      const safeShare = Number.isFinite(share) && share >= 0 ? share : 0;
      customTotal += safeShare;
      results.push({ id: p.id, name: p.name, share: safeShare });
    });
    if (customTotal !== total) {
      const difference = total - customTotal;
      const amount = formatRupiah(Math.abs(difference));
      const direction = difference > 0 ? 'kurang' : 'lebih';
      return {
        errorCode: 'CUSTOM_TOTAL_MISMATCH',
        errorMessage:
          'Total porsi custom harus sama dengan total tagihan. Selisih ' +
          amount +
          ' (' +
          direction +
          ').',
        expectedTotal: total,
        actualTotal: customTotal,
        difference: difference,
      };
    }
  }

  results = results.map((p) => {
    const paid = p.id === payerId ? total : 0;
    return {
      id: p.id,
      name: p.name,
      share: p.share,
      paid: paid,
      net: paid - p.share,
    };
  });

  const ownerSettlement = getOwnerSettlement(ownerName, results);
  if (!ownerSettlement) return null;

  return {
    billName,
    total,
    mode: splitMode,
    payerId,
    payerName: payer.name,
    ownerId: ownerSettlement.id,
    ownerName: ownerSettlement.name,
    ownerShare: ownerSettlement.share,
    ownerPaid: ownerSettlement.paid,
    ownerNet: ownerSettlement.net,
    ownerStatusKey: ownerSettlement.statusKey,
    ownerStatusText: ownerSettlement.statusText,
    people: results,
    date: date || getTodayString(),
  };
}
