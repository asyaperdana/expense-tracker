import { state, CATEGORY_ICONS } from './state.js';
import { dom } from '../ui.js';
import * as calc from './calculations.js';

// ─── Calendar ─────────────────────────────
function updateCalendarHeader() {
  if (!dom.calendarMonthLabel) return;
  let months = [
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
  dom.calendarMonthLabel.textContent =
    months[state.calendarViewDate.getMonth()] + ' ' + state.calendarViewDate.getFullYear();
}

function getCalendarMonthKey(year, month) {
  return year + '-' + String(month + 1).padStart(2, '0');
}

function formatCompactAmount(value) {
  return calc.formatRupiahCompact(value, {
    withPrefix: false,
    unitSpacing: false,
    maxFractionDigits: 1,
  });
}

function getNoSpendStreak(expenseByDay, year, month, daysInMonth) {
  let longest = 0;
  let current = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    let dateKey =
      year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    if ((expenseByDay[dateKey] || 0) > 0) {
      current = 0;
    } else {
      current += 1;
      if (current > longest) longest = current;
    }
  }
  return longest;
}

function renderCalendarInsights(insights) {
  if (!dom.calendarInsights) return;
  let netClass = insights.net >= 0 ? 'is-positive' : 'is-negative';
  let topCategoryLabel =
    insights.topCategory === '—'
      ? '—'
      : (CATEGORY_ICONS[insights.topCategory] || '<i class="ph-bold ph-tag"></i>') +
        ' ' +
        calc.escapeHtml(insights.topCategory);
  let peakDateLabel = insights.peakExpenseDate ? calc.formatDate(insights.peakExpenseDate) : '—';
  let peakAmountLabel = insights.peakExpense > 0 ? calc.formatRupiah(insights.peakExpense) : '—';
  let dailyAvg =
    insights.daysInMonth > 0 ? Math.round(insights.monthExpense / insights.daysInMonth) : 0;

  dom.calendarInsights.innerHTML =
    '<article class="calendar-insight-card is-negative"><span class="calendar-insight-label"><i class="ph-bold ph-trend-down"></i> Pengeluaran</span><strong class="calendar-insight-value">' +
    calc.formatRupiah(insights.monthExpense) +
    '</strong></article>' +
    '<article class="calendar-insight-card is-positive"><span class="calendar-insight-label"><i class="ph-bold ph-trend-up"></i> Pemasukan</span><strong class="calendar-insight-value">' +
    calc.formatRupiah(insights.monthIncome) +
    '</strong></article>' +
    '<article class="calendar-insight-card ' +
    netClass +
    '"><span class="calendar-insight-label"><i class="ph-bold ph-scales"></i> Selisih</span><strong class="calendar-insight-value">' +
    calc.formatRupiah(insights.net) +
    '</strong></article>' +
    '<article class="calendar-insight-card"><span class="calendar-insight-label"><i class="ph-bold ph-activity"></i> Hari Aktif</span><strong class="calendar-insight-value">' +
    insights.activeDays +
    ' / ' +
    insights.daysInMonth +
    '</strong></article>' +
    '<article class="calendar-insight-card"><span class="calendar-insight-label"><i class="ph-bold ph-flame"></i> Puncak Belanja</span><strong class="calendar-insight-value">' +
    peakAmountLabel +
    '</strong><small class="calendar-insight-meta">' +
    peakDateLabel +
    '</small></article>' +
    '<article class="calendar-insight-card"><span class="calendar-insight-label"><i class="ph-bold ph-hourglass-medium"></i> Avg/Hari</span><strong class="calendar-insight-value">' +
    calc.formatRupiah(dailyAvg) +
    '</strong><small class="calendar-insight-meta">Streak hemat: ' +
    insights.noSpendStreak +
    ' hari</small></article>' +
    '<article class="calendar-insight-card is-wide"><span class="calendar-insight-label"><i class="ph-bold ph-chart-pie-slice"></i> Kategori Dominan</span><strong class="calendar-insight-value">' +
    topCategoryLabel +
    '</strong><small class="calendar-insight-meta">' +
    calc.formatRupiah(insights.topCategoryAmount) +
    ' bulan ini</small></article>';
}

export function renderCalendar() {
  if (!dom.calendarGrid) return;
  updateCalendarHeader();
  let year = state.calendarViewDate.getFullYear();
  let month = state.calendarViewDate.getMonth();
  let monthKey = getCalendarMonthKey(year, month);
  let firstDay = new Date(year, month, 1).getDay();
  let startOffset = firstDay === 0 ? 6 : firstDay - 1;
  let daysInMonth = new Date(year, month + 1, 0).getDate();
  let today = calc.getTodayString();

  let monthData = state.expenses.filter(function (item) {
    return item.date && item.date.substring(0, 7) === monthKey;
  });

  let dayMap = {};
  let categoryTotals = {};
  let activeDayLookup = {};
  let monthIncome = 0;
  let monthExpense = 0;
  monthData.forEach(function (item) {
    let dateKey = item.date;
    if (!dayMap[dateKey]) dayMap[dateKey] = { income: 0, expense: 0, transfer: 0, count: 0 };
    dayMap[dateKey].count += 1;
    activeDayLookup[dateKey] = true;
    if (item.type === 'income') {
      dayMap[dateKey].income += item.amount;
      monthIncome += item.amount;
    } else if (item.type === 'expense') {
      dayMap[dateKey].expense += item.amount;
      monthExpense += item.amount;
      categoryTotals[item.category] = (categoryTotals[item.category] || 0) + item.amount;
    } else if (item.type === 'transfer') {
      dayMap[dateKey].transfer += item.amount;
    }
  });

  let peakExpenseDate = '';
  let peakExpense = 0;
  let expenseByDay = {};
  Object.keys(dayMap).forEach(function (dateKey) {
    expenseByDay[dateKey] = dayMap[dateKey].expense || 0;
    if ((dayMap[dateKey].expense || 0) > peakExpense) {
      peakExpense = dayMap[dateKey].expense;
      peakExpenseDate = dateKey;
    }
  });

  let topCategory = '—';
  let topCategoryAmount = 0;
  Object.keys(categoryTotals).forEach(function (cat) {
    if (categoryTotals[cat] > topCategoryAmount) {
      topCategory = cat;
      topCategoryAmount = categoryTotals[cat];
    }
  });

  renderCalendarInsights({
    monthIncome: monthIncome,
    monthExpense: monthExpense,
    net: monthIncome - monthExpense,
    activeDays: Object.keys(activeDayLookup).length,
    noSpendStreak: getNoSpendStreak(expenseByDay, year, month, daysInMonth),
    peakExpense: peakExpense,
    peakExpenseDate: peakExpenseDate,
    topCategory: topCategory,
    topCategoryAmount: topCategoryAmount,
    daysInMonth: daysInMonth,
  });

  if (dom.calendarDayDetail && dom.calendarDayDetail.style.display !== 'none') {
    let openedDate = dom.calendarDayDetail.dataset.date || '';
    if (openedDate && openedDate.substring(0, 7) === monthKey) {
      renderDayDetail(openedDate);
    } else {
      closeCalendarDetail();
    }
  }

  while (dom.calendarGrid.children.length > 7)
    dom.calendarGrid.removeChild(dom.calendarGrid.lastChild);
  for (let i = 0; i < startOffset; i++) {
    let empty = document.createElement('div');
    empty.className = 'cal-day empty';
    dom.calendarGrid.appendChild(empty);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    let dateKey =
      year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    let daySummary = dayMap[dateKey] || { income: 0, expense: 0, transfer: 0, count: 0 };
    let intensityClass = '';
    if (peakExpense > 0 && daySummary.expense > 0) {
      let ratio = daySummary.expense / peakExpense;
      if (ratio >= 0.85) intensityClass = ' cal-day-level-4';
      else if (ratio >= 0.6) intensityClass = ' cal-day-level-3';
      else if (ratio >= 0.35) intensityClass = ' cal-day-level-2';
      else intensityClass = ' cal-day-level-1';
    }
    let peakClass = peakExpenseDate && dateKey === peakExpenseDate ? ' peak' : '';
    let cell = document.createElement('div');
    cell.className = 'cal-day' + (dateKey === today ? ' today' : '') + intensityClass + peakClass;
    cell.dataset.date = dateKey;
    let innerHtml = '<span class="cal-num">' + d + '</span>';
    if (daySummary.count > 0)
      innerHtml += '<span class="cal-count">' + daySummary.count + 'x</span>';
    if (daySummary.expense > 0 || daySummary.income > 0 || daySummary.transfer > 0) {
      innerHtml += '<div class="cal-spending">';
      if (daySummary.expense > 0)
        innerHtml +=
          '<span class="cal-amount cal-amount-exp">-' +
          formatCompactAmount(daySummary.expense) +
          '</span>';
      if (daySummary.income > 0)
        innerHtml +=
          '<span class="cal-amount cal-amount-inc">+' +
          formatCompactAmount(daySummary.income) +
          '</span>';
      innerHtml += '<div class="cal-dots">';
      if (daySummary.expense > 0) innerHtml += '<span class="cal-dot cal-dot-exp"></span>';
      if (daySummary.income > 0) innerHtml += '<span class="cal-dot cal-dot-inc"></span>';
      if (daySummary.transfer > 0) innerHtml += '<span class="cal-dot cal-dot-trf"></span>';
      innerHtml += '</div></div>';
    }
    if (peakExpenseDate && dateKey === peakExpenseDate) {
      innerHtml +=
        '<span class="cal-peak-tag" title="Puncak pengeluaran"><i class="ph-bold ph-fire"></i></span>';
    }
    cell.innerHTML = innerHtml;
    cell.addEventListener('click', function () {
      renderDayDetail(this.dataset.date);
    });
    dom.calendarGrid.appendChild(cell);
  }
}

export function closeCalendarDetail() {
  if (!dom.calendarDayDetail) return;
  dom.calendarDayDetail.style.display = 'none';
  dom.calendarDayDetail.dataset.date = '';
}

export function renderDayDetail(dateStr) {
  if (!dom.calendarDayDetail) return;
  let dayData = state.expenses
    .filter(function (e) {
      return e.date === dateStr;
    })
    .sort(function (a, b) {
      return (b.amount || 0) - (a.amount || 0);
    });
  dom.calDetailDate.textContent = calc.formatDate(dateStr);
  dom.calDetailList.innerHTML = '';
  let totalInc = 0,
    totalExp = 0,
    totalTransfer = 0;
  dayData.forEach(function (item) {
    if (item.type === 'income') totalInc += item.amount;
    else if (item.type === 'expense') totalExp += item.amount;
    else if (item.type === 'transfer') totalTransfer += item.amount;
    let itemDiv = document.createElement('div');
    itemDiv.className = 'cal-item';
    let isInc = item.type === 'income';
    let isTransfer = item.type === 'transfer';
    let iconHtml = isTransfer
      ? '<i class="ph-bold ph-arrows-left-right"></i>'
      : CATEGORY_ICONS[item.category] || '<i class="ph-bold ph-tag"></i>';
    let walletInfo = isTransfer
      ? calc.escapeHtml(item.wallet || 'Tunai') + ' → ' + calc.escapeHtml(item.walletTo || 'Tunai')
      : calc.escapeHtml(item.wallet || 'Tunai');
    let categoryLabel = isTransfer ? 'Transfer Dompet' : calc.escapeHtml(item.category);
    let amountClass = isInc ? 'text-success' : isTransfer ? 'text-accent' : 'text-danger';
    let amountPrefix = isInc ? '+' : isTransfer ? '' : '-';
    itemDiv.innerHTML =
      '<div class="cal-item-left"><div class="category-icon">' +
      iconHtml +
      '</div><div class="cal-item-info"><strong>' +
      calc.escapeHtml(item.title) +
      '</strong><span>' +
      categoryLabel +
      ' • ' +
      walletInfo +
      '</span></div></div>' +
      '<div class="cal-item-right ' +
      amountClass +
      '">' +
      amountPrefix +
      calc.formatRupiah(item.amount) +
      '</div>';
    dom.calDetailList.appendChild(itemDiv);
  });
  if (dayData.length === 0) {
    dom.calDetailList.innerHTML = '<p class="cal-empty">Belum ada transaksi pada tanggal ini.</p>';
  }
  dom.calDetailSummary.innerHTML =
    '<div><small>Transaksi</small><br><strong>' +
    dayData.length +
    '</strong></div>' +
    '<div><small>Pemasukan</small><br><strong class="text-success">' +
    calc.formatRupiah(totalInc) +
    '</strong></div>' +
    '<div><small>Pengeluaran</small><br><strong class="text-danger">' +
    calc.formatRupiah(totalExp) +
    '</strong></div>' +
    '<div><small>Transfer</small><br><strong class="text-accent">' +
    calc.formatRupiah(totalTransfer) +
    '</strong></div>' +
    '<div><small>Selisih</small><br><strong>' +
    calc.formatRupiah(totalInc - totalExp) +
    '</strong></div>';
  dom.calendarDayDetail.style.display = 'flex';
  dom.calendarDayDetail.dataset.date = dateStr;
}
