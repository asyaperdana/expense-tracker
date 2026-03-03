/* ===========================
   ui.js — DOM rendering and UI updates
   =========================== */
import { state, CATEGORY_COLORS, CATEGORY_ICONS, AVAILABLE_ICONS, AVATAR_COLORS } from './state.js';
import * as calc from './calculations.js';
import * as storage from './storage.js';

// ─── Constants ────────────────────────────
export const VALID_VIEWS = ['dashboard', 'transactions', 'add', 'report', 'goals', 'split', 'wallets', 'settings'];

// ─── DOM References (cached once) ─────────
const dom = {};

export function cacheDom() {
  dom.form = document.getElementById('expense-form');
  dom.inputDate = document.getElementById('input-date');
  dom.inputTitle = document.getElementById('input-title');
  dom.titleSuggestions = document.getElementById('title-suggestions');
  dom.inputCategory = document.getElementById('input-category');
  dom.inputAmount = document.getElementById('input-amount');
  dom.amountDisplay = document.getElementById('amount-display');
  dom.amountValue = document.getElementById('amount-value');
  dom.inputTypeRadios = document.getElementsByName('input-type');
  dom.inputWallet = document.getElementById('input-wallet');
  dom.inputWalletTo = document.getElementById('input-wallet-to');
  dom.groupWalletTo = document.getElementById('group-wallet-to');
  dom.groupCategory = document.getElementById('group-category');
  dom.labelWallet = document.getElementById('label-wallet');
  dom.btnSubmit = document.getElementById('btn-submit');
  dom.btnCancel = document.getElementById('btn-cancel');
  dom.tbody = document.getElementById('expense-tbody');
  dom.totalIncomeEl = document.getElementById('total-income');
  dom.totalExpenseEl = document.getElementById('total-expense');
  dom.totalCountEl = document.getElementById('total-count');
  dom.topCategoryEl = document.getElementById('top-category');
  dom.totalBalanceEl = document.getElementById('total-balance');
  dom.walletBalancesEl = document.getElementById('wallet-balances');
  dom.budgetTextUsed = document.getElementById('budget-text-used');
  dom.budgetTextLimit = document.getElementById('budget-text-limit');
  dom.budgetPct = document.getElementById('budget-pct');
  dom.budgetFill = document.getElementById('budget-fill');
  dom.budgetNote = document.getElementById('budget-note');
  dom.emptyState = document.getElementById('empty-state');
  dom.dateHelp = document.getElementById('date-help');
  dom.titleHelp = document.getElementById('title-help');
  dom.walletHelp = document.getElementById('wallet-help');
  dom.walletToHelp = document.getElementById('wallet-to-help');
  dom.categoryHelp = document.getElementById('category-help');
  dom.amountHelp = document.getElementById('amount-help');
  dom.filterCategory = document.getElementById('filter-category');
  dom.filterSearch = document.getElementById('filter-search');
  dom.filterMonth = document.getElementById('filter-month');
  dom.filterSort = document.getElementById('filter-sort');
  dom.undoIndicator = document.getElementById('undo-indicator');
  dom.btnUndo = document.getElementById('btn-undo');
  dom.modalOverlay = document.getElementById('modal-overlay');
  dom.toastContainer = document.getElementById('toast-container');
  dom.renderStateEl = document.getElementById('render-state');
  dom.chartCanvas = document.getElementById('category-chart');
  dom.chartLegend = document.getElementById('chart-legend');
  dom.chartEmpty = document.getElementById('chart-empty');
  dom.chartTooltip = document.getElementById('chart-tooltip');
  dom.reportMonthLabel = document.getElementById('report-month-label');
  dom.reportIncomeEl = document.getElementById('report-income');
  dom.reportExpenseEl = document.getElementById('report-expense');
  dom.reportNetEl = document.getElementById('report-net');
  dom.reportCountEl = document.getElementById('report-count');
  dom.reportTopCategoryEl = document.getElementById('report-top-category');
  dom.reportLargestExpenseEl = document.getElementById('report-largest-expense');
  dom.reportTrendEl = document.getElementById('report-trend');
  dom.reportAdviceEl = document.getElementById('report-advice');
  dom.inputRecurring = document.getElementById('input-recurring');
  dom.goalListEl = document.getElementById('goal-list');
  dom.inputGoalFundId = document.getElementById('input-goal-fund-id');
  dom.inputGoalFundSource = document.getElementById('input-goal-fund-source');
  dom.inputGoalFundAmount = document.getElementById('input-goal-fund-amount');
  dom.goalFundSubtitle = document.getElementById('goal-fund-subtitle');
  dom.goalFundOverlay = document.getElementById('goal-fund-overlay');
  dom.inputGoalName = document.getElementById('input-goal-name');
  dom.inputGoalTarget = document.getElementById('input-goal-target');
  dom.goalAddOverlay = document.getElementById('goal-add-overlay');
  dom.splitLedgerTbody = document.getElementById('split-ledger-tbody');
  dom.splitLedgerEmpty = document.getElementById('split-ledger-empty');
  dom.walletList = document.getElementById('wallet-list');
  dom.quickAddStrip = document.getElementById('quick-add-strip');
  dom.quickAddSection = document.getElementById('quick-add-section');
  dom.quickAddEmpty = document.getElementById('quick-add-empty');
  dom.trendChartCanvas = document.getElementById('trend-chart');
  dom.trendTooltip = document.getElementById('trend-tooltip');
  dom.trendEmpty = document.getElementById('trend-empty');
  dom.calendarGrid = document.getElementById('calendar-grid');
  dom.calendarMonthLabel = document.getElementById('calendar-month-label');
  dom.calendarDayDetail = document.getElementById('calendar-day-detail');
  dom.calDetailDate = document.getElementById('cal-detail-date');
  dom.calDetailSummary = document.getElementById('cal-detail-summary');
  dom.calDetailList = document.getElementById('cal-detail-list');
  dom.categoryBudgetMeta = document.getElementById('category-budget-meta');
  dom.categoryBudgetList = document.getElementById('category-budget-list');
  dom.categoryBudgetEmpty = document.getElementById('category-budget-empty');
  dom.categoryBudgetOverlay = document.getElementById('category-budget-overlay');
  dom.categoryBudgetEditor = document.getElementById('category-budget-editor');
  dom.iconSelector = document.getElementById('icon-selector');
  dom.inputCustomCatIcon = document.getElementById('input-custom-cat-icon');
  dom.themeIcon = document.getElementById('theme-icon');
  // Split bill DOM
  dom.splitOverlay = document.getElementById('split-overlay');
  dom.splitTitleEl = document.getElementById('split-title');
  dom.splitBillName = document.getElementById('split-bill-name');
  dom.splitTotal = document.getElementById('split-total');
  dom.splitOwnerName = document.getElementById('split-owner-name');
  dom.splitPayer = document.getElementById('split-payer');
  dom.modeEqual = document.getElementById('mode-equal');
  dom.modeCustom = document.getElementById('mode-custom');
  dom.splitPersonList = document.getElementById('split-person-list');
  dom.splitFormView = document.getElementById('split-form-view');
  dom.splitResultsView = document.getElementById('split-results-view');
  dom.splitResultSummary = document.getElementById('split-result-summary');
  dom.splitResultList = document.getElementById('split-result-list');
  dom.btnSaveSplit = document.getElementById('btn-save-split');
  dom.splitHistoryList = document.getElementById('split-history-list');
}

export { dom };

const hasChartJs = typeof window.Chart === 'function';

// ─── Toast Notifications ─────────────────
export function showToast(message, type) {
  type = type || 'success';
  var icons = { success: '<i class="ph-fill ph-check-circle" style="color: var(--clr-success);"></i>', error: '<i class="ph-fill ph-warning-circle" style="color: var(--clr-danger);"></i>', info: '<i class="ph-fill ph-info" style="color: var(--clr-accent);"></i>' };
  var toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.innerHTML = '<span class="toast-icon">' + (icons[type] || '<i class="ph-fill ph-check-circle"></i>') + '</span>' + '<span>' + calc.escapeHtml(message) + '</span>';
  dom.toastContainer.appendChild(toast);
  setTimeout(function () {
    toast.classList.add('toast-out');
    setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
  }, 2500);
}

export function showUndoToast(message, onUndo) {
  var toast = document.createElement('div');
  toast.className = 'toast toast-info';
  toast.innerHTML = '<span class="toast-icon"><i class="ph-bold ph-arrow-u-up-left" style="color: var(--clr-accent);"></i></span>' + '<span>' + calc.escapeHtml(message) + '</span>' + '<button class="toast-action" type="button">Undo</button>';
  var btn = toast.querySelector('.toast-action');
  btn.addEventListener('click', function () {
    if (onUndo) onUndo();
    toast.classList.add('toast-out');
    setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 200);
  });
  dom.toastContainer.appendChild(toast);
  setTimeout(function () {
    toast.classList.add('toast-out');
    setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
  }, 5000);
}

// ─── Undo ─────────────────────────────────
export function updateUndoIndicator() {
  dom.undoIndicator.textContent = 'Undo: ' + state.undoStack.length;
  dom.btnUndo.disabled = state.undoStack.length === 0;
}

// ─── Theme ────────────────────────────────
export function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  storage.setThemeStorage(theme);
  dom.themeIcon.innerHTML = theme === 'dark' ? '<i class="ph-fill ph-sun"></i>' : '<i class="ph-fill ph-moon"></i>';
}

// ─── Render State ─────────────────────────
export function setRenderState(message) {
  if (!dom.renderStateEl) return;
  dom.renderStateEl.textContent = message || '';
  dom.renderStateEl.classList.toggle('visible', Boolean(message));
}

// ─── Summary ──────────────────────────────
export function updateSummary(filteredData) {
  var totals = calc.calculateTotal(filteredData);
  dom.totalIncomeEl.textContent = calc.formatRupiah(totals.income);
  dom.totalExpenseEl.textContent = calc.formatRupiah(totals.expense);
  dom.totalCountEl.textContent = filteredData.length;

  [dom.totalIncomeEl, dom.totalExpenseEl, dom.totalCountEl, dom.topCategoryEl].forEach(function (el) {
    el.classList.remove('pulse');
    void el.offsetWidth;
    el.classList.add('pulse');
  });

  if (filteredData.length > 0) {
    var catTotals = {};
    filteredData.forEach(function (item) {
      if (item.type !== 'income') {
        catTotals[item.category] = (catTotals[item.category] || 0) + item.amount;
      }
    });
    var topCat = '', topVal = 0;
    Object.keys(catTotals).forEach(function (cat) {
      if (catTotals[cat] > topVal) { topVal = catTotals[cat]; topCat = cat; }
    });
    dom.topCategoryEl.innerHTML = (CATEGORY_ICONS[topCat] || '') + ' ' + topCat;
  } else {
    dom.topCategoryEl.textContent = '—';
  }
}

// ─── Hero (Balance & Budget) ──────────────
export function updateHero() {
  var totals = calc.calculateTotal(state.expenses);
  dom.totalBalanceEl.textContent = calc.formatRupiah(totals.balance);

  if (dom.walletBalancesEl) {
    var wals = calc.calculateWalletBalances(state.expenses, state.wallets);
    dom.walletBalancesEl.innerHTML = '';
    Object.keys(wals).forEach(function (w) {
      var bal = wals[w];
      var walletObj = state.wallets.find(function (obj) { return obj.name === w; });
      var icon = walletObj ? ('<i class="ph-bold ' + walletObj.icon + '"></i>') : '<i class="ph-bold ph-wallet"></i>';
      var wDiv = document.createElement('div');
      wDiv.className = 'wallet-pill';
      wDiv.innerHTML = '<span class="wallet-pill-label">' + icon + ' ' + calc.escapeHtml(w) + '</span>' + '<strong class="wallet-pill-value">' + calc.formatRupiah(bal) + '</strong>';
      dom.walletBalancesEl.appendChild(wDiv);
    });
  }

  var currentMonth = calc.getCurrentMonthKey();
  var monthExpenses = state.expenses.filter(function (item) { return (item.type !== 'income') && item.date.startsWith(currentMonth); });
  var monthExpenseTotal = monthExpenses.reduce(function (sum, item) { return sum + item.amount; }, 0);
  var budget = storage.getBudgetLimit();

  if (budget > 0) {
    dom.budgetTextUsed.textContent = calc.formatRupiah(monthExpenseTotal);
    dom.budgetTextLimit.textContent = '/ ' + calc.formatRupiah(budget);
    var pct = Math.min((monthExpenseTotal / budget) * 100, 100);
    dom.budgetPct.textContent = Math.round(pct) + '%';
    dom.budgetPct.style.display = 'block';
    dom.budgetFill.style.width = pct + '%';
    if (pct >= 90) {
      dom.budgetFill.style.background = 'var(--clr-danger)'; dom.budgetPct.style.background = 'var(--clr-danger)'; dom.budgetPct.style.color = '#fff';
      dom.budgetNote.textContent = 'Hati-hati! Pengeluaran Anda hampir melewati batas.';
    } else if (pct >= 70) {
      dom.budgetFill.style.background = 'var(--clr-warning)'; dom.budgetPct.style.background = 'var(--clr-warning)'; dom.budgetPct.style.color = '#000';
      dom.budgetNote.textContent = 'Pengeluaran bulan ini sudah cukup tinggi.';
    } else {
      dom.budgetFill.style.background = ''; dom.budgetPct.style.background = ''; dom.budgetPct.style.color = '';
      dom.budgetNote.textContent = 'Pengeluaran Anda masih aman terkontrol.';
    }
  } else {
    dom.budgetTextUsed.textContent = calc.formatRupiah(monthExpenseTotal);
    dom.budgetTextLimit.textContent = '/ Tidak ada batas';
    dom.budgetPct.style.display = 'none';
    dom.budgetFill.style.width = '0%'; dom.budgetFill.style.background = '';
    dom.budgetNote.textContent = 'Atur batas bulanan agar lebih terkontrol.';
  }
}

// ─── Category Options ─────────────────────
export function renderCategoryOptions() {
  if (!dom.inputCategory) return;
  const expenseGroup = document.getElementById('optgroup-expense');
  const incomeGroup = document.getElementById('optgroup-income');
  if (!expenseGroup || !incomeGroup) return;

  // Clear existing custom categories if any (logic to keep defaults)
  // For simplicity, we can just append custom ones to the relevant group
  state.customCategories.forEach(cat => {
    const exists = Array.from(expenseGroup.options).some(o => o.value === cat.name) || 
                   Array.from(incomeGroup.options).some(o => o.value === cat.name);
    if (!exists) {
      const opt = document.createElement('option');
      opt.value = cat.name;
      opt.textContent = cat.name;
      if (cat.type === 'income') incomeGroup.appendChild(opt);
      else expenseGroup.appendChild(opt);
    }
  });
}

// ─── Title Suggestions ────────────────────
export function updateTitleSuggestions() {
  if (!dom.titleSuggestions) return;
  var uniqueTitles = {};
  state.expenses.forEach(function (e) { if (!uniqueTitles[e.title]) uniqueTitles[e.title] = e; });
  dom.titleSuggestions.innerHTML = '';
  Object.keys(uniqueTitles).forEach(function (title) {
    var option = document.createElement('option');
    option.value = title;
    dom.titleSuggestions.appendChild(option);
  });
}

// ─── Wallet Dropdowns ─────────────────────
export function renderWalletDropdowns() {
  var walletSelects = [dom.inputWallet, dom.inputWalletTo, dom.inputGoalFundSource];
  walletSelects.forEach(function (sel) {
    if (!sel) return;
    var currentVal = sel.value;
    sel.innerHTML = '';
    state.wallets.forEach(function (w) {
      var opt = document.createElement('option');
      opt.value = w.name; opt.textContent = w.name;
      sel.appendChild(opt);
    });
    if (currentVal && state.wallets.some(function (wallet) { return wallet.name === currentVal; })) {
      sel.value = currentVal;
    } else if (state.wallets.length > 0) {
      sel.value = state.wallets[0].name;
    }
  });
}

// ─── Wallet List (Modal) ──────────────────
export function renderWalletList(onDelete) {
  if (!dom.walletList) return;
  dom.walletList.innerHTML = '';
  state.wallets.forEach(function (wallet) {
    var item = document.createElement('div');
    item.className = 'wallet-item';
    var usageCount = state.expenses.filter(function (entry) { return entry.wallet === wallet.name || entry.walletTo === wallet.name; }).length;
    var deleteDisabled = usageCount > 0 || state.wallets.length <= 1;
    var deleteTitle = usageCount > 0 ? 'Tidak dapat dihapus karena masih digunakan dalam transaksi' : (state.wallets.length <= 1 ? 'Setidaknya harus ada satu dompet aktif' : 'Hapus dompet');
    item.innerHTML =
      '<div class="wallet-item-icon"><i class="ph-fill ' + wallet.icon + '"></i></div>' +
      '<div class="wallet-item-meta"><div class="wallet-item-name">' + calc.escapeHtml(wallet.name) + '</div><div class="wallet-item-usage">Dipakai di ' + usageCount + ' transaksi</div></div>' +
      '<button class="btn btn-ghost btn-sm btn-del-wallet" data-id="' + wallet.id + '" title="' + deleteTitle + '" ' + (deleteDisabled ? 'disabled aria-disabled="true"' : '') + '><i class="ph-bold ph-trash"></i></button>';
    var btnDel = item.querySelector('.btn-del-wallet');
    btnDel.addEventListener('click', function () {
      if (deleteDisabled) return;
      if (onDelete) onDelete(wallet);
    });
    dom.walletList.appendChild(item);
  });
}

// ─── Template Strip ───────────────────────
export function renderTemplateStrip(onUseTemplate, onDeleteTemplate) {
  if (!dom.quickAddStrip) return;
  dom.quickAddStrip.innerHTML = '';
  if (state.templates.length === 0) {
    if (dom.quickAddEmpty) dom.quickAddEmpty.style.display = 'block';
    dom.quickAddStrip.style.display = 'none';
    if (dom.quickAddSection) dom.quickAddSection.style.display = 'none';
    return;
  }
  if (dom.quickAddEmpty) dom.quickAddEmpty.style.display = 'none';
  dom.quickAddStrip.style.display = 'flex';
  if (dom.quickAddSection) dom.quickAddSection.style.display = 'block';
  state.templates.forEach(function (tpl) {
    var card = document.createElement('div');
    card.className = 'template-card';
    var iconHtml = CATEGORY_ICONS[tpl.category] || '<i class="ph-fill ph-tag"></i>';
    card.innerHTML =
      '<div class="template-icon">' + iconHtml + '</div>' +
      '<div class="template-name">' + calc.escapeHtml(tpl.title) + '</div>' +
      '<div class="template-amount">' + calc.formatRupiah(tpl.amount) + '</div>' +
      '<button class="btn-del-template" data-id="' + tpl.id + '"><i class="ph-bold ph-x"></i></button>';
    card.addEventListener('click', function (e) {
      if (e.target.closest('.btn-del-template')) return;
      if (onUseTemplate) onUseTemplate(tpl);
    });
    var btnDel = card.querySelector('.btn-del-template');
    btnDel.addEventListener('click', function () { if (onDeleteTemplate) onDeleteTemplate(tpl.id); });
    dom.quickAddStrip.appendChild(card);
  });
}

// ─── Monthly Report ───────────────────────
export function getReportMonthKey() {
  if (dom.filterMonth && dom.filterMonth.value) return dom.filterMonth.value;
  return calc.getCurrentMonthKey();
}

export function renderMonthlyReport() {
  if (!dom.reportMonthLabel) return;
  var monthKey = getReportMonthKey();
  var summary = calc.calculateMonthlySummary(state.expenses, monthKey);
  dom.reportMonthLabel.textContent = calc.getMonthLabel(monthKey);
  dom.reportIncomeEl.textContent = calc.formatRupiah(summary.monthIncome);
  dom.reportExpenseEl.textContent = calc.formatRupiah(summary.monthExpense);
  dom.reportNetEl.textContent = calc.formatRupiah(summary.net);
  dom.reportNetEl.classList.remove('report-value-positive', 'report-value-negative');
  dom.reportNetEl.classList.add(summary.net >= 0 ? 'report-value-positive' : 'report-value-negative');
  dom.reportCountEl.textContent = String(summary.count);
  dom.reportTopCategoryEl.textContent = 'Kategori teratas: ' + (summary.topCategory === '—' ? '—' : (summary.topCategory + ' (' + calc.formatRupiah(summary.topCategoryAmount) + ')'));
  dom.reportLargestExpenseEl.textContent = summary.largestExpense ? ('Pengeluaran terbesar: ' + summary.largestExpense.title + ' (' + calc.formatRupiah(summary.largestExpense.amount) + ')') : 'Pengeluaran terbesar: —';
  dom.reportTrendEl.textContent = 'Tren vs bulan lalu: ' + summary.trendText;
  dom.reportAdviceEl.textContent = summary.advice;
  renderTrendChart();
}

// ─── Trend Chart ──────────────────────────
export function renderTrendChart() {
  if (!dom.trendChartCanvas) return;
  var ctx = dom.trendChartCanvas.getContext('2d');
  var dpr = window.devicePixelRatio || 1;
  var parentW = dom.trendChartCanvas.parentElement ? dom.trendChartCanvas.parentElement.clientWidth : 580;
  var canvasWidth = Math.max(parentW, 400);
  var canvasHeight = 260;
  dom.trendChartCanvas.width = canvasWidth * dpr;
  dom.trendChartCanvas.height = canvasHeight * dpr;
  dom.trendChartCanvas.style.width = canvasWidth + 'px';
  dom.trendChartCanvas.style.height = canvasHeight + 'px';
  ctx.scale(dpr, dpr);

  var months = [];
  var current = calc.getCurrentMonthKey();
  for (var i = 0; i < 6; i++) { months.unshift(current); current = calc.getPreviousMonthKey(current); }
  var data = months.map(function (m) {
    var inc = 0, exp = 0;
    state.expenses.forEach(function (e) { if (e.date.startsWith(m)) { if (e.type === 'income') inc += e.amount; else if (e.type === 'expense') exp += e.amount; } });
    return { month: m, income: inc, expense: exp };
  });
  var maxVal = Math.max.apply(Math, data.map(function (d) { return Math.max(d.income, d.expense); })) || 100000;
  if (maxVal >= 1000000) maxVal = Math.ceil(maxVal / 1000000) * 1000000;
  else if (maxVal >= 100000) maxVal = Math.ceil(maxVal / 100000) * 100000;
  else maxVal = Math.ceil(maxVal / 10000) * 10000;
  maxVal = Math.max(maxVal, 10000);
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  if (state.expenses.length === 0) {
    if (dom.trendEmpty) dom.trendEmpty.style.display = 'block';
    dom.trendChartCanvas.style.display = 'none'; return;
  }
  if (dom.trendEmpty) dom.trendEmpty.style.display = 'none';
  dom.trendChartCanvas.style.display = 'block';
  var padding = { top: 20, right: 20, bottom: 40, left: 60 };
  var chartW = canvasWidth - padding.left - padding.right;
  var chartH = canvasHeight - padding.top - padding.bottom;
  var barGap = 20; var barWidth = (chartW / 6) - barGap;
  ctx.fillStyle = storage.getTheme() === 'dark' ? '#94a3b8' : '#64748b';
  ctx.font = '10px Inter'; ctx.textAlign = 'right';
  for (var j = 0; j <= 4; j++) {
    var y = padding.top + chartH - (j * (chartH / 4));
    var labelVal = (maxVal / 4) * j;
    ctx.fillText(labelVal >= 1000000 ? (labelVal / 1000000).toFixed(1) + 'M' : (labelVal / 1000).toFixed(0) + 'K', padding.left - 10, y + 4);
    ctx.beginPath(); ctx.strokeStyle = storage.getTheme() === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    ctx.moveTo(padding.left, y); ctx.lineTo(padding.left + chartW, y); ctx.stroke();
  }
  data.forEach(function (d, idx) {
    var xBase = padding.left + (idx * (chartW / 6)) + (barGap / 2);
    var incH = (d.income / maxVal) * chartH; var expH = (d.expense / maxVal) * chartH;
    ctx.fillStyle = '#10b981'; ctx.beginPath(); ctx.roundRect(xBase, padding.top + chartH - incH, barWidth / 2 - 2, incH, [4, 4, 0, 0]); ctx.fill();
    ctx.fillStyle = '#f43f5e'; ctx.beginPath(); ctx.roundRect(xBase + barWidth / 2 + 2, padding.top + chartH - expH, barWidth / 2 - 2, expH, [4, 4, 0, 0]); ctx.fill();
    var label = d.month.split('-')[1] + '/' + d.month.split('-')[0].substring(2);
    ctx.fillStyle = storage.getTheme() === 'dark' ? '#94a3b8' : '#64748b';
    ctx.textAlign = 'center'; ctx.fillText(label, xBase + barWidth / 2, padding.top + chartH + 20);
  });
}

// ─── Calendar ─────────────────────────────
function updateCalendarHeader() {
  if (!dom.calendarMonthLabel) return;
  var months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  dom.calendarMonthLabel.textContent = months[state.calendarViewDate.getMonth()] + ' ' + state.calendarViewDate.getFullYear();
}

export function renderCalendar() {
  if (!dom.calendarGrid) return;
  updateCalendarHeader();
  while (dom.calendarGrid.children.length > 7) dom.calendarGrid.removeChild(dom.calendarGrid.lastChild);
  var year = state.calendarViewDate.getFullYear();
  var month = state.calendarViewDate.getMonth();
  var firstDay = new Date(year, month, 1).getDay();
  var startOffset = firstDay === 0 ? 6 : firstDay - 1;
  var daysInMonth = new Date(year, month + 1, 0).getDate();
  var today = calc.getTodayString();
  for (var i = 0; i < startOffset; i++) {
    var empty = document.createElement('div'); empty.className = 'cal-day empty'; dom.calendarGrid.appendChild(empty);
  }
  for (var d = 1; d <= daysInMonth; d++) {
    var dateKey = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    var dayExpenses = state.expenses.filter(function (e) { return e.date === dateKey; });
    var cell = document.createElement('div');
    cell.className = 'cal-day' + (dateKey === today ? ' today' : '');
    cell.dataset.date = dateKey;
    var innerHtml = '<span class="cal-num">' + d + '</span>';
    if (dayExpenses.length > 0) {
      var dayInc = 0, dayExp = 0;
      dayExpenses.forEach(function (e) { if (e.type === 'income') dayInc += e.amount; else if (e.type === 'expense') dayExp += e.amount; });
      innerHtml += '<div class="cal-spending">';
      if (dayExp > 0) innerHtml += '<span class="cal-amount cal-amount-exp">-' + (dayExp / 1000).toFixed(0) + 'k</span>';
      if (dayInc > 0) innerHtml += '<span class="cal-amount cal-amount-inc">+' + (dayInc / 1000).toFixed(0) + 'k</span>';
      innerHtml += '<div class="cal-dots">';
      if (dayExp > 0) innerHtml += '<span class="cal-dot" style="background:#f43f5e"></span>';
      if (dayInc > 0) innerHtml += '<span class="cal-dot" style="background:#10b981"></span>';
      innerHtml += '</div></div>';
    }
    cell.innerHTML = innerHtml;
    cell.addEventListener('click', function () { renderDayDetail(this.dataset.date); });
    dom.calendarGrid.appendChild(cell);
  }
}

export function renderDayDetail(dateStr) {
  if (!dom.calendarDayDetail) return;
  var dayData = state.expenses.filter(function (e) { return e.date === dateStr; });
  dom.calDetailDate.textContent = calc.formatDate(dateStr);
  dom.calDetailList.innerHTML = '';
  var totalInc = 0, totalExp = 0;
  dayData.forEach(function (item) {
    if (item.type === 'income') totalInc += item.amount;
    else if (item.type === 'expense') totalExp += item.amount;
    var itemDiv = document.createElement('div'); itemDiv.className = 'cal-item';
    var isInc = item.type === 'income';
    itemDiv.innerHTML =
      '<div class="cal-item-left"><div class="category-icon">' + (CATEGORY_ICONS[item.category] || '') + '</div><div class="cal-item-info"><strong>' + calc.escapeHtml(item.title) + '</strong><span>' + calc.escapeHtml(item.category) + ' • ' + calc.escapeHtml(item.wallet) + '</span></div></div>' +
      '<div class="cal-item-right ' + (isInc ? 'text-success' : 'text-danger') + '">' + (isInc ? '+' : '-') + calc.formatRupiah(item.amount) + '</div>';
    dom.calDetailList.appendChild(itemDiv);
  });
  dom.calDetailSummary.innerHTML =
    '<div><small>Pemasukan</small><br><strong class="text-success">' + calc.formatRupiah(totalInc) + '</strong></div>' +
    '<div><small>Pengeluaran</small><br><strong class="text-danger">' + calc.formatRupiah(totalExp) + '</strong></div>' +
    '<div><small>Selisih</small><br><strong>' + calc.formatRupiah(totalInc - totalExp) + '</strong></div>';
  dom.calendarDayDetail.style.display = 'flex';
}

// ─── Category Budget Summary ──────────────
export function renderCategoryBudgetSummary() {
  if (!dom.categoryBudgetList || !dom.categoryBudgetMeta || !dom.categoryBudgetEmpty) return;
  var monthKey = getReportMonthKey();
  var monthCategoryExpense = calc.getMonthlyExpenseByCategory(state.expenses, monthKey);
  var categories = Object.keys(state.categoryBudgets).filter(function (cat) { return Number(state.categoryBudgets[cat]) > 0; });
  dom.categoryBudgetList.innerHTML = '';
  if (!categories.length) {
    dom.categoryBudgetMeta.textContent = 'Belum ada budget kategori aktif.';
    dom.categoryBudgetEmpty.classList.add('visible'); return;
  }
  dom.categoryBudgetEmpty.classList.remove('visible');
  dom.categoryBudgetMeta.textContent = calc.getMonthLabel(monthKey) + ' • ' + categories.length + ' kategori dipantau';
  categories.sort(function (a, b) { var aL = Number(state.categoryBudgets[a]) || 1; var bL = Number(state.categoryBudgets[b]) || 1; return ((monthCategoryExpense[b] || 0) / bL) - ((monthCategoryExpense[a] || 0) / aL); });
  categories.forEach(function (cat) {
    var limit = Number(state.categoryBudgets[cat]) || 0;
    var spent = Number(monthCategoryExpense[cat]) || 0;
    var pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
    var statusClass = pct >= 100 ? 'is-over' : (pct >= 75 ? 'is-warn' : 'is-safe');
    var item = document.createElement('div'); item.className = 'category-budget-item';
    item.innerHTML =
      '<div class="category-budget-row"><div class="category-budget-name">' + (CATEGORY_ICONS[cat] || '<i class="ph-fill ph-tag"></i>') + ' ' + calc.escapeHtml(cat) + '</div>' +
      '<div class="category-budget-amount">' + calc.formatRupiah(spent) + ' / ' + calc.formatRupiah(limit) + ' (' + Math.round(pct) + '%)</div></div>' +
      '<div class="category-budget-track"><div class="category-budget-fill ' + statusClass + '" style="width:' + pct.toFixed(2) + '%;"></div></div>';
    dom.categoryBudgetList.appendChild(item);
  });
}

function getExpenseCategories() {
  var seen = {}; var out = [];
  var expenseGroup = document.getElementById('optgroup-expense');
  if (expenseGroup) {
    expenseGroup.querySelectorAll('option').forEach(function (opt) {
      var value = (opt.value || '').trim();
      if (!value || seen[value]) return;
      seen[value] = true; out.push(value);
    });
  }
  state.expenses.forEach(function (item) {
    if (item.type === 'income' || item.type === 'transfer') return;
    var cat = (item.category || '').trim();
    if (!cat || seen[cat]) return;
    seen[cat] = true; out.push(cat);
  });
  return out.sort(function (a, b) { return a.localeCompare(b, 'id'); });
}

export function openCategoryBudgetModal() {
  renderCategoryBudgetEditor(formatInputCurrency);
  dom.categoryBudgetOverlay.classList.add('active');
}

export function renderCategoryBudgetEditor(formatInputCurrency) {
  if (!dom.categoryBudgetEditor) return;
  var categories = getExpenseCategories();
  if (!categories.length) {
    dom.categoryBudgetEditor.innerHTML = '<p class="category-budget-empty visible">Belum ada kategori pengeluaran yang tersedia.</p>';
    return;
  }
  dom.categoryBudgetEditor.innerHTML = '';
  categories.forEach(function (cat) {
    var val = Number(state.categoryBudgets[cat]) || 0;
    var row = document.createElement('div'); row.className = 'category-budget-edit-row';
    var label = document.createElement('label'); label.className = 'category-budget-edit-label';
    label.innerHTML = (CATEGORY_ICONS[cat] || '<i class="ph-fill ph-tag"></i>') + ' ' + calc.escapeHtml(cat);
    var input = document.createElement('input');
    input.type = 'text'; input.className = 'category-budget-input';
    input.setAttribute('inputmode', 'numeric'); input.setAttribute('placeholder', '0 = nonaktif');
    input.dataset.category = cat; input.value = val > 0 ? val.toLocaleString('en-US') : '';
    row.appendChild(label); row.appendChild(input);
    dom.categoryBudgetEditor.appendChild(row);
  });
  dom.categoryBudgetEditor.querySelectorAll('.category-budget-input').forEach(function (input) {
    input.addEventListener('input', formatInputCurrency);
  });
}

// ─── Doughnut Chart ───────────────────────
export function renderChart(data) {
  dom.chartLegend.innerHTML = '';
  state.chartSlices = [];
  state.chartGeom = null;
  dom.chartTooltip.classList.remove('visible');
  var hasExpense = data && data.some(function (item) { return item.type === 'expense'; });
  if (!hasExpense) {
    if (state.categoryChartInstance) { state.categoryChartInstance.destroy(); state.categoryChartInstance = null; }
    dom.chartEmpty.classList.add('visible');
    dom.chartCanvas.style.display = 'none'; dom.chartLegend.style.display = 'none';
    return;
  }
  var catTotals = {}; var total = 0;
  data.forEach(function (item) { if (item.type === 'expense') { catTotals[item.category] = (catTotals[item.category] || 0) + item.amount; total += item.amount; } });
  var categories = Object.keys(catTotals).sort(function (a, b) { return catTotals[b] - catTotals[a]; });
  var values = categories.map(function (cat) { return catTotals[cat]; });
  var colors = categories.map(function (cat) { return CATEGORY_COLORS[cat] || '#94a3b8'; });

  if (hasChartJs) {
    dom.chartEmpty.classList.remove('visible'); dom.chartCanvas.style.display = 'block'; dom.chartLegend.style.display = 'flex';
    categories.forEach(function (cat) {
      var pct = ((catTotals[cat] / total) * 100).toFixed(1);
      var legendItem = document.createElement('div'); legendItem.className = 'legend-item';
      legendItem.innerHTML = '<span class="legend-color" style="background:' + (CATEGORY_COLORS[cat] || '#94a3b8') + '"></span><span class="legend-label">' + (CATEGORY_ICONS[cat] || '') + ' ' + cat + '</span><span class="legend-value">' + pct + '%</span>';
      dom.chartLegend.appendChild(legendItem);
    });
    if (state.categoryChartInstance) {
      state.categoryChartInstance.data.labels = categories;
      state.categoryChartInstance.data.datasets[0].data = values;
      state.categoryChartInstance.data.datasets[0].backgroundColor = colors;
      state.categoryChartInstance.update(); return;
    }
    state.categoryChartInstance = new window.Chart(dom.chartCanvas, {
      type: 'doughnut',
      data: { labels: categories, datasets: [{ data: values, backgroundColor: colors, borderColor: 'rgba(255,255,255,0.18)', borderWidth: 1.5 }] },
      options: { responsive: true, maintainAspectRatio: true, cutout: '58%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (ctx) { var amount = Number(ctx.raw || 0); var pct = total > 0 ? ((amount / total) * 100).toFixed(1) : '0.0'; return (ctx.label || '-') + ': ' + calc.formatRupiah(amount) + ' (' + pct + '%)'; } } } } }
    });
    return;
  }

  // Canvas fallback
  var ctx = dom.chartCanvas.getContext('2d');
  var dpr = window.devicePixelRatio || 1;
  var size = dom.chartCanvas.width / dpr;
  var center = size / 2; var outerRadius = center - 10; var innerRadius = outerRadius * 0.58;
  ctx.clearRect(0, 0, size, size);
  state.chartGeom = { center: size / 2, innerRadius: innerRadius, outerRadius: outerRadius };
  dom.chartEmpty.classList.remove('visible'); dom.chartCanvas.style.display = 'block'; dom.chartLegend.style.display = 'flex';

  var startAngle = -Math.PI / 2; var normalizedStart = 0; var gapAngle = 0.03;
  categories.forEach(function (cat) {
    var sliceAngle = (catTotals[cat] / total) * (2 * Math.PI);
    var color = CATEGORY_COLORS[cat] || '#94a3b8';
    var actualGap = categories.length > 1 ? gapAngle : 0;
    var drawStart = startAngle + actualGap / 2; var drawEnd = startAngle + sliceAngle - actualGap / 2;
    if (drawEnd > drawStart) { ctx.beginPath(); ctx.arc(center, center, outerRadius, drawStart, drawEnd); ctx.arc(center, center, innerRadius, drawEnd, drawStart, true); ctx.closePath(); ctx.fillStyle = color; ctx.fill(); }
    startAngle += sliceAngle;
    state.chartSlices.push({ category: cat, amount: catTotals[cat], percent: ((catTotals[cat] / total) * 100), start: normalizedStart, end: normalizedStart + sliceAngle });
    normalizedStart += sliceAngle;
    var pct = ((catTotals[cat] / total) * 100).toFixed(1);
    var legendItem = document.createElement('div'); legendItem.className = 'legend-item';
    legendItem.innerHTML = '<span class="legend-color" style="background:' + color + '"></span><span class="legend-label">' + (CATEGORY_ICONS[cat] || '') + ' ' + cat + '</span><span class="legend-value">' + pct + '%</span>';
    dom.chartLegend.appendChild(legendItem);
  });
  var theme = storage.getTheme();
  ctx.fillStyle = theme === 'dark' ? '#e2e8f0' : '#0f172a';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = '700 1rem "Archivo", system-ui, -apple-system, sans-serif';
  ctx.fillText(calc.formatRupiah(total), center, center - 8);
  ctx.font = '500 0.7rem "Archivo", system-ui, -apple-system, sans-serif';
  ctx.fillStyle = theme === 'dark' ? '#94a3b8' : '#64748b';
  ctx.fillText('Total', center, center + 14);
}

export function hideChartTooltip() { dom.chartTooltip.classList.remove('visible'); }

export function handleChartHoverQueued(e) {
  if (state.isPerfLite) { hideChartTooltip(); return; }
  state.chartHoverEvent = e;
  if (state.chartHoverRaf) return;
  state.chartHoverRaf = requestAnimationFrame(function () {
    state.chartHoverRaf = null;
    if (!state.chartHoverEvent) return;
    handleChartHover(state.chartHoverEvent);
    state.chartHoverEvent = null;
  });
}

function handleChartHover(e) {
  if (!state.chartSlices.length || !state.chartGeom) { hideChartTooltip(); return; }
  var rect = dom.chartCanvas.getBoundingClientRect();
  var x = (e.clientX - rect.left); var y = (e.clientY - rect.top);
  var dx = x - state.chartGeom.center; var dy = y - state.chartGeom.center;
  var dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < state.chartGeom.innerRadius || dist > state.chartGeom.outerRadius) { hideChartTooltip(); return; }
  var angle = Math.atan2(dy, dx); var normalized = angle + Math.PI / 2;
  if (normalized < 0) normalized += Math.PI * 2;
  var match = null;
  state.chartSlices.forEach(function (slice) { if (normalized >= slice.start && normalized < slice.end) match = slice; });
  if (!match) { hideChartTooltip(); return; }
  var icon = CATEGORY_ICONS[match.category] || '';
  dom.chartTooltip.innerHTML = icon + ' ' + match.category + ' — ' + calc.formatRupiah(match.amount) + ' (' + match.percent.toFixed(1) + '%)';
  var containerRect = dom.chartCanvas.parentElement.getBoundingClientRect();
  dom.chartTooltip.style.left = (e.clientX - containerRect.left + 12) + 'px';
  dom.chartTooltip.style.top = (e.clientY - containerRect.top + 12) + 'px';
  dom.chartTooltip.classList.add('visible');
}

// ─── Goals ────────────────────────────────
export function renderGoals(onFund, onDelete) {
  if (!dom.goalListEl) return;
  dom.goalListEl.innerHTML = '';
  var goalBalances = {};
  state.expenses.forEach(function (e) {
    if (e.type === 'transfer' && e.walletTo && e.walletTo.startsWith('Goal-')) {
      var gid = e.walletTo.replace('Goal-', '');
      goalBalances[gid] = (goalBalances[gid] || 0) + e.amount;
    }
  });
  if (state.goals.length === 0) {
    dom.goalListEl.innerHTML = '<div class="goal-empty">Belum ada tabungan impian.<span class="goal-empty-hint">Buat goal baru untuk mulai menabung.</span></div>';
    return;
  }
  state.goals.forEach(function (g) {
    var current = goalBalances[g.id] || 0;
    var safeTarget = g.target > 0 ? g.target : 1;
    var pctValue = Math.min((current / safeTarget) * 100, 100);
    var pct = pctValue.toFixed(1);
    var card = document.createElement('article'); card.className = 'goal-item';
    card.innerHTML =
      '<div class="goal-item-header"><div class="goal-item-name">' + calc.escapeHtml(g.name) + '</div><div class="goal-item-amount">' + calc.formatRupiah(current) + ' / ' + calc.formatRupiah(g.target) + '</div></div>' +
      '<div class="goal-progress-track"><div class="goal-progress-fill" style="width: ' + pct + '%;"></div></div>' +
      '<div class="goal-item-footer"><div class="goal-progress-label">' + pct + '% Tercapai</div><div class="goal-action-group">' +
      '<button class="btn btn-sm btn-ghost btn-fund-goal" data-id="' + g.id + '" type="button"><i class="ph-bold ph-piggy-bank"></i> Isi Dana</button>' +
      '<button class="btn btn-sm btn-ghost btn-del-goal" data-id="' + g.id + '" type="button" aria-label="Hapus goal"><i class="ph-bold ph-trash"></i></button></div></div>';
    dom.goalListEl.appendChild(card);
  });
  dom.goalListEl.querySelectorAll('.btn-fund-goal').forEach(function (b) {
    b.addEventListener('click', function () { if (onFund) onFund(this.dataset.id); });
  });
  dom.goalListEl.querySelectorAll('.btn-del-goal').forEach(function (b) {
    b.addEventListener('click', function () { if (onDelete) onDelete(this.dataset.id); });
  });
}

// ─── Split History ────────────────────────
export function renderSplitHistory() {
  dom.splitHistoryList.innerHTML = '';
  if (state.splitLedger.length === 0) {
    dom.splitHistoryList.innerHTML = '<p class="split-history-empty">Belum ada riwayat split</p>';
    return;
  }
  state.splitLedger.slice(0, 12).forEach(function (entry) {
    var payerText = entry.payerName ? (' • Dibayar: ' + calc.escapeHtml(entry.payerName)) : '';
    var ownerText = entry.ownerName ? (' • Saya: ' + calc.escapeHtml(entry.ownerName)) : '';
    var item = document.createElement('div'); item.className = 'split-history-item';
    item.innerHTML =
      '<div><div class="hist-name">' + calc.escapeHtml(entry.billName) + '</div><div class="hist-meta">' + calc.formatDate(entry.date) + ' • ' + entry.people.length + ' peserta' + payerText + ownerText + '</div></div>' +
      '<span class="hist-amount">' + calc.formatRupiah(entry.total) + '</span>';
    dom.splitHistoryList.appendChild(item);
  });
}

// ─── Split Ledger Table ───────────────────
export function renderSplitLedgerTable() {
  if (!dom.splitLedgerTbody || !dom.splitLedgerEmpty) return;
  dom.splitLedgerTbody.innerHTML = '';
  if (state.splitLedger.length === 0) { dom.splitLedgerEmpty.classList.add('visible'); return; }
  dom.splitLedgerEmpty.classList.remove('visible');
  var fragment = document.createDocumentFragment();
  state.splitLedger.forEach(function (entry) {
    var tr = document.createElement('tr');
    var statusKey = entry.ownerStatusKey || 'even';
    var statusText = entry.ownerStatusText || 'Status belum tersedia';
    var isDone = Boolean(entry.isDone);
    var doneText = isDone ? ('Selesai' + (entry.doneAt ? (' • ' + calc.formatDate(entry.doneAt)) : '')) : statusText;
    var doneClass = isDone ? 'done' : statusKey;
    var syncDone = Boolean(entry.syncedExpenseId);
    var syncClass = syncDone ? 'synced' : 'pending';
    var syncText = syncDone ? ('Tersinkron' + (entry.syncedAt ? (' • ' + calc.formatDate(entry.syncedAt)) : '')) : 'Belum sync';
    var syncButton = '';
    if (syncDone) { syncButton = '<button class="btn btn-sm btn-ghost" type="button" disabled><i class="ph-bold ph-check-circle"></i> Tersinkron</button>'; }
    else if (Number(entry.ownerShare) > 0) { syncButton = '<button class="btn btn-sm btn-primary" type="button" data-split-action="sync" data-id="' + entry.id + '"><i class="ph-bold ph-arrows-clockwise"></i> Sync</button>'; }
    else { syncButton = '<button class="btn btn-sm btn-ghost" type="button" disabled>Tidak ada porsi</button>'; }
    var doneButton = isDone
      ? '<button class="btn btn-sm btn-ghost" type="button" disabled><i class="ph-bold ph-check"></i> Selesai</button>'
      : '<button class="btn btn-sm btn-ghost" type="button" data-split-action="done" data-id="' + entry.id + '"><i class="ph-bold ph-check-circle"></i> Mark Done</button>';
    var deleteButton = '<button class="btn btn-sm btn-delete" type="button" data-split-action="delete" data-id="' + entry.id + '"><i class="ph-bold ph-trash"></i> Hapus</button>';
    var actionHtml = '<div class="action-group"><button class="btn btn-sm btn-edit" type="button" data-split-action="edit" data-id="' + entry.id + '"><i class="ph-bold ph-pencil-simple"></i> Edit</button>' + doneButton + syncButton + deleteButton + '</div>';
    tr.innerHTML =
      '<td data-label="Tanggal">' + calc.formatDate(entry.date) + '</td>' +
      '<td data-label="Bill"><div style="font-weight:700">' + calc.escapeHtml(entry.billName) + '</div><div style="font-size:0.78rem; color:var(--clr-text-secondary)">Saya: ' + calc.escapeHtml(entry.ownerName || '-') + ' • Dibayar: ' + calc.escapeHtml(entry.payerName || '-') + '</div></td>' +
      '<td class="text-right" data-label="Total"><strong>' + calc.formatRupiah(entry.total) + '</strong></td>' +
      '<td class="text-right" data-label="Porsi Saya"><strong>' + calc.formatRupiah(entry.ownerShare || 0) + '</strong></td>' +
      '<td data-label="Status Saya"><span class="split-ledger-status ' + doneClass + '">' + calc.escapeHtml(doneText) + '</span></td>' +
      '<td data-label="Sync"><span class="split-ledger-sync ' + syncClass + '">' + calc.escapeHtml(syncText) + '</span></td>' +
      '<td class="text-center" data-label="Aksi">' + actionHtml + '</td>';
    fragment.appendChild(tr);
  });
  dom.splitLedgerTbody.appendChild(fragment);
}

// ─── Split Results ────────────────────────
export function renderSplitResults(results) {
  state.splitResults = results; // Also sync state
  dom.splitFormView.style.display = 'none';
  dom.splitResultsView.style.display = 'block';
  dom.splitResultSummary.innerHTML =
    '<div class="result-bill-name">' + calc.escapeHtml(results.billName) + '</div>' +
    '<div class="result-total">' + calc.formatRupiah(results.total) + '</div>' +
    '<div class="result-people-count">' + results.people.length + ' peserta • ' + (results.mode === 'equal' ? '<i class="ph-bold ph-scales"></i> Bagi Rata' : '<i class="ph-bold ph-pencil-simple"></i> Custom') + '</div>' +
    '<div class="result-payer">Dibayar oleh: ' + calc.escapeHtml(results.payerName) + '</div>' +
    '<div class="result-owner-status">Status Saya (' + calc.escapeHtml(results.ownerName) + '): ' + calc.escapeHtml(results.ownerStatusText) + '</div>';
  dom.splitResultList.innerHTML = '';
  results.people.forEach(function (p, i) {
    var color = AVATAR_COLORS[i % AVATAR_COLORS.length];
    var initials = p.name.split(' ').map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase();
    var settlementText = 'Lunas'; var settlementClass = 'even';
    if (p.net > 0) { settlementText = 'Harus terima ' + calc.formatRupiah(p.net); settlementClass = 'receive'; }
    else if (p.net < 0) { settlementText = 'Harus bayar ' + calc.formatRupiah(Math.abs(p.net)); settlementClass = 'pay'; }
    var item = document.createElement('div'); item.className = 'split-result-item'; item.style.animationDelay = (i * 0.06) + 's';
    item.innerHTML =
      '<div class="person-info"><div class="person-avatar" style="background:' + color + '">' + initials + '</div><div class="person-text"><span class="person-name">' + calc.escapeHtml(p.name) + (p.id === results.payerId ? ' (Pembayar)' : '') + (p.id === results.ownerId ? ' (Saya)' : '') + '</span><span class="person-detail">Bayar: ' + calc.formatRupiah(p.paid) + '</span></div></div>' +
      '<div class="person-result"><span class="person-share">Porsi: ' + calc.formatRupiah(p.share) + '</span><span class="person-settlement ' + settlementClass + '">' + settlementText + '</span></div>';
    dom.splitResultList.appendChild(item);
  });
}

// ─── Split Modal Helpers ──────────────────
export function updateSplitModalHeader() {
  if (!dom.splitTitleEl || !dom.btnSaveSplit) return;
  if (state.splitEditingId) {
    dom.splitTitleEl.innerHTML = '<i class="ph-bold ph-pencil-simple"></i> Edit Split Bill';
    dom.btnSaveSplit.innerHTML = '<i class="ph-bold ph-check-circle"></i> Update Ledger Split';
  } else {
    dom.splitTitleEl.innerHTML = '<i class="ph-bold ph-receipt"></i> Split Bill';
    dom.btnSaveSplit.innerHTML = '<i class="ph-bold ph-floppy-disk"></i> Simpan ke Ledger Split';
  }
}

export function applySplitMode(mode) {
  state.splitMode = mode === 'custom' ? 'custom' : 'equal';
  if (state.splitMode === 'equal') { dom.modeEqual.classList.add('active'); dom.modeCustom.classList.remove('active'); }
  else { dom.modeCustom.classList.add('active'); dom.modeEqual.classList.remove('active'); }
  updateCustomAmountVisibility();
}

export function updateCustomAmountVisibility() {
  var fields = dom.splitPersonList.querySelectorAll('.custom-amount');
  fields.forEach(function (f) { if (state.splitMode === 'custom') f.classList.add('visible'); else f.classList.remove('visible'); });
}

export function addPersonRow(name) {
  var personId = 'p-' + (++state.splitPersonIdCounter);
  var row = document.createElement('div');
  row.className = 'split-person-row'; row.dataset.personId = personId;
  row.innerHTML =
    '<input type="text" class="person-name-input" placeholder="Nama peserta" value="' + calc.escapeHtml(name || '') + '" />' +
    '<input type="text" class="custom-amount' + (state.splitMode === 'custom' ? ' visible' : '') + '" placeholder="Nominal" inputmode="numeric" />' +
    '<button class="btn-remove-person" title="Hapus" type="button">×</button>';
  row.querySelector('.btn-remove-person').addEventListener('click', function () {
    if (dom.splitPersonList.children.length > 2) { row.remove(); syncSplitPayerOptions(); }
    else { showToast('Minimal 2 peserta', 'error'); }
  });
  dom.splitPersonList.appendChild(row);
  syncSplitPayerOptions();
  return row;
}

export function getSplitParticipantLabel(row, index) {
  var nameInput = row.querySelector('.person-name-input');
  var name = nameInput ? nameInput.value.trim() : '';
  return name || ('Peserta ' + (index + 1));
}

export function syncSplitPayerOptions() {
  if (!dom.splitPayer) return;
  var rows = dom.splitPersonList.querySelectorAll('.split-person-row');
  var prevPayerId = dom.splitPayer.value;
  var hasPrev = false; var firstId = '';
  dom.splitPayer.innerHTML = '';
  rows.forEach(function (row, i) {
    var personId = row.dataset.personId || ('p-auto-' + i);
    row.dataset.personId = personId;
    var opt = document.createElement('option');
    opt.value = personId; opt.textContent = getSplitParticipantLabel(row, i);
    dom.splitPayer.appendChild(opt);
    if (!firstId) firstId = personId;
    if (personId === prevPayerId) hasPrev = true;
  });
  if (!firstId) return;
  dom.splitPayer.value = hasPrev ? prevPayerId : firstId;
}

// ─── Icon Selector ────────────────────────
export function renderIconSelector() {
  dom.iconSelector.innerHTML = '';
  AVAILABLE_ICONS.forEach(function (iconCls) {
    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'icon-btn';
    if (dom.inputCustomCatIcon.value === iconCls) btn.classList.add('selected');
    btn.innerHTML = '<i class="ph-bold ' + iconCls + '"></i>';
    btn.addEventListener('click', function () {
      dom.inputCustomCatIcon.value = iconCls;
      renderIconSelector();
    });
    dom.iconSelector.appendChild(btn);
  });
}

// ─── Canvas Setup ─────────────────────────
export function setupCanvas() {
  var displaySize = state.isPerfLite ? 260 : 320;
  dom.chartCanvas.style.width = displaySize + 'px';
  dom.chartCanvas.style.height = displaySize + 'px';
  if (hasChartJs) {
    dom.chartCanvas.width = displaySize; dom.chartCanvas.height = displaySize;
    if (state.categoryChartInstance) state.categoryChartInstance.resize();
    return;
  }
  var dpr = window.devicePixelRatio || 1;
  dom.chartCanvas.width = displaySize * dpr;
  dom.chartCanvas.height = displaySize * dpr;
  var ctx = dom.chartCanvas.getContext('2d');
  ctx.scale(dpr, dpr);
}

// ─── Performance Detection ────────────────
export function detectPerfLite(prefersReduced) {
  if (prefersReduced) return true;
  var memory = navigator.deviceMemory || 0;
  var cores = navigator.hardwareConcurrency || 0;
  var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var saveData = conn && conn.saveData;
  var effectiveType = conn && conn.effectiveType ? String(conn.effectiveType) : '';
  var slowNetwork = effectiveType.indexOf('2g') !== -1;
  var coarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  if (saveData || slowNetwork) return true;
  if (memory && memory <= 4) return true;
  if (cores && cores <= 4) return true;
  if (coarsePointer && cores && cores <= 6) return true;
  return false;
}

export function applyPerformanceMode(enabled) {
  document.documentElement.classList.toggle('perf-lite', enabled);
  document.body.classList.toggle('perf-lite', enabled);
}

export function setupScrollReveal(prefersReduced) {
  var sections = document.querySelectorAll('.container > section');
  if (!sections || sections.length === 0) return;
  if (prefersReduced || !('IntersectionObserver' in window)) return;
  var viewport = window.innerHeight || document.documentElement.clientHeight;
  sections.forEach(function (section) {
    var rect = section.getBoundingClientRect();
    if (rect.top <= viewport * 0.9) return;
    section.classList.add('reveal-ready');
  });
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('revealed');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
  sections.forEach(function (section) {
    if (section.classList.contains('reveal-ready')) observer.observe(section);
  });
}

export function setupCardGlow(prefersReduced) {
  if (prefersReduced) return;
  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return;
  var cards = document.querySelectorAll('.card');
  cards.forEach(function (card) {
    var frame = null; var nextX = 50; var nextY = 50;
    card.addEventListener('pointermove', function (e) {
      var rect = card.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      nextX = ((e.clientX - rect.left) / rect.width) * 100;
      nextY = ((e.clientY - rect.top) / rect.height) * 100;
      if (!frame) { frame = requestAnimationFrame(function () { frame = null; card.style.setProperty('--mx', nextX.toFixed(2) + '%'); card.style.setProperty('--my', nextY.toFixed(2) + '%'); }); }
      card.classList.add('card-glow');
    });
    card.addEventListener('pointerleave', function () {
      if (frame) { cancelAnimationFrame(frame); frame = null; }
      card.classList.remove('card-glow');
      card.style.setProperty('--mx', '50%'); card.style.setProperty('--my', '50%');
    });
  });
}

export function setupHeroTilt(prefersReduced) {
  if (prefersReduced) return;
  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return;
  var hero = document.querySelector('.hero-card');
  if (!hero) return;
  var frame = null; var next = { x: 0, y: 0, mx: 50, my: 50 };
  hero.addEventListener('pointermove', function (e) {
    var rect = hero.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    var px = (e.clientX - rect.left) / rect.width;
    var py = (e.clientY - rect.top) / rect.height;
    next.x = (0.5 - py) * 8; next.y = (px - 0.5) * 12;
    next.mx = px * 100; next.my = py * 100;
    if (!frame) { frame = requestAnimationFrame(function () { frame = null; hero.style.setProperty('--hero-tilt-x', next.x.toFixed(2) + 'deg'); hero.style.setProperty('--hero-tilt-y', next.y.toFixed(2) + 'deg'); hero.style.setProperty('--hero-mx', next.mx.toFixed(2) + '%'); hero.style.setProperty('--hero-my', next.my.toFixed(2) + '%'); }); }
  });
  hero.addEventListener('pointerleave', function () {
    if (frame) { cancelAnimationFrame(frame); frame = null; }
    hero.style.setProperty('--hero-tilt-x', '0deg'); hero.style.setProperty('--hero-tilt-y', '0deg');
    hero.style.setProperty('--hero-mx', '50%'); hero.style.setProperty('--hero-my', '50%');
  });
}

export function initVisualEffects() {
  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  state.isPerfLite = detectPerfLite(prefersReduced);
  applyPerformanceMode(state.isPerfLite);
  setupCanvas();
  setupScrollReveal(prefersReduced || state.isPerfLite);
  setupCardGlow(prefersReduced || state.isPerfLite);
  setupHeroTilt(prefersReduced || state.isPerfLite);
}

// ─── Reset Form ───────────────────────────
export function resetForm() {
  dom.form.reset();
  dom.inputDate.value = (function () {
    var d = new Date();
    var dd = String(d.getDate()).padStart(2, '0');
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    return dd + '/' + mm + '/' + d.getFullYear();
  })();
  dom.dateHelp.textContent = '';
  if (dom.titleHelp) dom.titleHelp.textContent = '';
  if (dom.walletHelp) dom.walletHelp.textContent = '';
  if (dom.walletToHelp) dom.walletToHelp.textContent = '';
  dom.categoryHelp.textContent = '';
  dom.amountHelp.textContent = '';
  state.editingId = null;
  document.querySelector('input[name="input-type"][value="expense"]').checked = true;
  dom.inputWallet.value = 'Tunai';
  dom.inputWalletTo.value = 'Tunai';
  dom.groupWalletTo.style.display = 'none';
  dom.groupCategory.style.display = 'flex';
  dom.labelWallet.textContent = 'Sumber Dana';
  dom.inputRecurring.checked = false;
  document.querySelector('.checkbox-group').style.display = 'flex';
  dom.btnSubmit.disabled = false;
  dom.btnSubmit.classList.remove('is-loading');
  dom.btnSubmit.innerHTML = '<i class="ph-bold ph-plus-circle btn-icon"></i> Simpan Transaksi';
  dom.btnCancel.style.display = 'none';
  if (dom.amountValue) dom.amountValue.textContent = '0';
  [dom.inputDate, dom.inputTitle, dom.inputCategory, dom.inputAmount, dom.inputWallet, dom.inputWalletTo].forEach(function (f) {
    if (f) f.classList.remove('invalid');
  });
}

// ─── Render Table (main orchestrator for table) ──
export function renderTableNow(renderTableCallback) {
  var filters = {
    search: dom.filterSearch ? dom.filterSearch.value : '',
    category: dom.filterCategory.value,
    month: dom.filterMonth.value,
    sort: dom.filterSort.value || 'date-desc'
  };
  var data = calc.getFilteredData(state.expenses, filters);
  dom.tbody.innerHTML = '';
  updateHero();
  updateTitleSuggestions();
  renderMonthlyReport();
  renderCategoryBudgetSummary();
  if (data.length === 0) {
    dom.emptyState.classList.add('visible');
    updateSummary(data);
    renderChart(data);
    return;
  }
  dom.emptyState.classList.remove('visible');
  var fragment = document.createDocumentFragment();
  data.forEach(function (item, index) {
    var tr = document.createElement('tr');
    if (!state.isPerfLite) { tr.classList.add('row-animate'); tr.style.animationDelay = (index * 0.04) + 's'; }
    tr.dataset.id = item.id;
    var isIncome = item.type === 'income';
    var isTransfer = item.type === 'transfer';
    var indicatorHtml = isIncome ? '<span style="color:var(--clr-success)"><i class="ph-bold ph-arrow-down-left"></i> Pemasukan</span>' :
      (isTransfer ? '<span style="color:var(--clr-accent)"><i class="ph-bold ph-arrows-left-right"></i> Transfer</span>' :
      '<span style="color:var(--clr-danger)"><i class="ph-bold ph-arrow-up-right"></i> Pengeluaran</span>');
    var walletText = isTransfer ? (calc.escapeHtml(item.wallet || 'Tunai') + ' <i class="ph-bold ph-arrow-right"></i> ' + calc.escapeHtml(item.walletTo || 'Tunai')) : calc.escapeHtml(item.wallet || 'Tunai');
    var categoryContent = isTransfer ? '<i class="ph-fill ph-arrows-left-right"></i> Transfer Dompet' : ((CATEGORY_ICONS[item.category] || '') + ' ' + calc.escapeHtml(item.category));
    tr.innerHTML =
      '<td data-label="Tanggal">' + calc.formatDate(item.date) + '</td>' +
      '<td data-label="Tipe & Nama"><div style="font-weight:600">' + calc.escapeHtml(item.title) + '</div><div style="font-size:0.75rem">' + indicatorHtml + '</div></td>' +
      '<td data-label="Kategori & Dompet"><span class="badge">' + categoryContent + '</span><div style="font-size:0.75rem; margin-top:4px; opacity:0.7;"><i class="ph-fill ph-wallet"></i> ' + walletText + '</div></td>' +
      '<td class="text-right" data-label="Nominal"><span class="amount ' + (isIncome ? 'text-success' : (isTransfer ? 'text-accent' : '')) + '" style="font-weight:600">' + (isIncome ? '+' : (isTransfer ? '' : '-')) + calc.formatRupiah(item.amount) + '</span></td>' +
      '<td class="text-center" data-label="Aksi"><div class="action-group">' +
        '<button class="btn btn-sm btn-pin" data-action="pin" data-id="' + item.id + '" title="Pin ke Quick Add"><i class="ph-bold ph-push-pin"></i></button>' +
        '<button class="btn btn-sm btn-edit" data-action="edit" data-id="' + item.id + '" title="Edit"><i class="ph-bold ph-pencil-simple"></i> Edit</button>' +
        '<button class="btn btn-sm btn-delete" data-action="delete" data-id="' + item.id + '" title="Hapus"><i class="ph-bold ph-trash"></i> Hapus</button>' +
      '</div></td>';
    fragment.appendChild(tr);
  });
  dom.tbody.appendChild(fragment);
  updateSummary(data);
  renderChart(data);
  if (renderTableCallback) renderTableCallback();
}

export function renderTable(renderTableCallback) {
  if (state.renderTimer) clearTimeout(state.renderTimer);
  setRenderState('Memuat transaksi...');
  state.renderTimer = setTimeout(function () {
    state.renderTimer = null;
    renderTableNow(renderTableCallback);
    setRenderState('');
  }, 0);
}

// ─── Format Input Currency ────────────────
export function formatInputCurrency(e) {
  var value = e.target.value.replace(/\D/g, "");
  if (value !== "") { e.target.value = Number(value).toLocaleString('en-US'); }
  else { e.target.value = ""; }
}

// ─── View Management (from secondary IIFE) ──
export function setActiveView(view, shouldFocus) {
  if (VALID_VIEWS.indexOf(view) === -1) view = 'dashboard';
  var sections = Array.prototype.slice.call(document.querySelectorAll('.container > section[data-view]'));
  var navButtons = Array.prototype.slice.call(document.querySelectorAll('[data-nav-view]'));
  sections.forEach(function (section) {
    var active = section.getAttribute('data-view') === view;
    section.classList.toggle('is-active', active);
    section.setAttribute('aria-hidden', active ? 'false' : 'true');
  });
  navButtons.forEach(function (btn) {
    var activeBtn = btn.getAttribute('data-nav-view') === view;
    btn.classList.toggle('is-active', activeBtn);
    btn.setAttribute('aria-selected', activeBtn ? 'true' : 'false');
  });
  storage.saveActiveView(view);
  if (shouldFocus && view === 'add' && dom.inputTitle) {
    setTimeout(function () { dom.inputTitle.focus(); }, 120);
  }
}

// ─── Currency Animation ──────────────────
function parseCurrency(value) {
  var numeric = String(value || '').replace(/[^0-9-]/g, '');
  return Number(numeric || 0);
}

export function animateCurrency(el, targetValue, options) {
  if (!el) return;
  options = options || {};
  var duration = options.duration || 420;
  var formatter = options.formatter || calc.formatRupiah;
  var currentRaw = Number(el.getAttribute('data-anim-value'));
  if (!Number.isFinite(currentRaw)) currentRaw = parseCurrency(el.textContent);
  if (currentRaw === targetValue) {
    el.textContent = formatter(targetValue);
    el.setAttribute('data-anim-value', String(targetValue));
    return;
  }
  var start = currentRaw; var startTime = null;
  function tick(ts) {
    if (!startTime) startTime = ts;
    var progress = Math.min((ts - startTime) / duration, 1);
    var eased = 1 - Math.pow(1 - progress, 3);
    var now = Math.round(start + (targetValue - start) * eased);
    el.textContent = formatter(now);
    el.setAttribute('data-anim-value', String(now));
    if (progress < 1) requestAnimationFrame(tick);
    else { el.textContent = formatter(targetValue); el.setAttribute('data-anim-value', String(targetValue)); }
  }
  requestAnimationFrame(tick);
}

export function syncDashboardMonthlyStats() {
  var reportIncomeEl = document.getElementById('report-income');
  var reportExpenseEl = document.getElementById('report-expense');
  var dashboardIncomeEl = document.getElementById('dashboard-income');
  var dashboardExpenseEl = document.getElementById('dashboard-expense');
  var dashboardNetEl = document.getElementById('dashboard-net');
  if (!reportIncomeEl || !reportExpenseEl || !dashboardIncomeEl || !dashboardExpenseEl || !dashboardNetEl) return;
  var income = parseCurrency(reportIncomeEl.textContent);
  var expense = parseCurrency(reportExpenseEl.textContent);
  var net = income - expense;
  animateCurrency(dashboardIncomeEl, income);
  animateCurrency(dashboardExpenseEl, expense);
  animateCurrency(dashboardNetEl, net);
  dashboardNetEl.classList.remove('summary-value-income', 'summary-value-expense');
  dashboardNetEl.classList.add(net >= 0 ? 'summary-value-income' : 'summary-value-expense');
}

export function renderRecentTransactions() {
  var recentList = document.getElementById('recent-list');
  var recentEmpty = document.getElementById('recent-empty');
  if (!recentList || !recentEmpty) return;
  var data = state.expenses.slice().sort(function (a, b) {
    var dateCmp = String(b.date || '').localeCompare(String(a.date || ''));
    if (dateCmp !== 0) return dateCmp;
    return String(b.id || '').localeCompare(String(a.id || ''));
  }).slice(0, 5);
  recentList.innerHTML = '';
  if (!data.length) { recentEmpty.style.display = 'block'; return; }
  recentEmpty.style.display = 'none';
  data.forEach(function (item) {
    var row = document.createElement('div'); row.className = 'recent-row';
    var isIncome = item.type === 'income'; var isTransfer = item.type === 'transfer';
    var amountPrefix = isIncome ? '+' : (isTransfer ? '↔ ' : '-');
    var amountClass = isIncome ? 'text-success' : (isTransfer ? 'text-accent' : 'text-danger');
    var formatDateShort = function (dateStr) {
      if (!dateStr) return '-';
      var d = new Date(dateStr + 'T00:00:00');
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    };
    row.innerHTML =
      '<div class="recent-row-main"><div class="recent-row-title">' + String(item.title || '-') + '</div><div class="recent-row-meta">' + formatDateShort(item.date) + ' • ' + String(item.category || '-') + '</div></div>' +
      '<div class="recent-row-amount ' + amountClass + '">' + amountPrefix + calc.formatRupiah(item.amount || 0) + '</div>';
    recentList.appendChild(row);
  });
}

export function setButtonLoading(button, loadingText, ms) {
  if (!button || button.dataset.loading === '1') return;
  button.dataset.loading = '1';
  button.dataset.originalHtml = button.innerHTML;
  button.disabled = true;
  button.innerHTML = '<span class="btn-spinner" aria-hidden="true"></span> ' + loadingText;
  setTimeout(function () {
    button.disabled = false;
    button.innerHTML = button.dataset.originalHtml || button.innerHTML;
    button.dataset.loading = '0';
  }, ms || 900);
}

function firstEnabledValue(group) {
  if (!group) return '';
  var options = Array.prototype.slice.call(group.querySelectorAll('option'));
  var first = options.find(function (opt) { return !opt.disabled; });
  return first ? first.value : '';
}

export function syncConditionalFields() {
  var selected = document.querySelector('input[name="input-type"]:checked');
  var type = selected ? selected.value : 'expense';
  var isTransfer = type === 'transfer';
  if (dom.groupWalletTo) dom.groupWalletTo.setAttribute('data-collapsed', isTransfer ? 'false' : 'true');
  if (dom.groupCategory) dom.groupCategory.setAttribute('data-collapsed', isTransfer ? 'true' : 'false');
  var optgroupExpense = document.getElementById('optgroup-expense');
  var optgroupIncome = document.getElementById('optgroup-income');
  if (!optgroupExpense || !optgroupIncome || !dom.inputCategory) return;
  var expenseOptions = Array.prototype.slice.call(optgroupExpense.querySelectorAll('option'));
  var incomeOptions = Array.prototype.slice.call(optgroupIncome.querySelectorAll('option'));
  if (type === 'expense') { expenseOptions.forEach(function (opt) { opt.disabled = false; }); incomeOptions.forEach(function (opt) { opt.disabled = true; }); }
  else if (type === 'income') { expenseOptions.forEach(function (opt) { opt.disabled = true; }); incomeOptions.forEach(function (opt) { opt.disabled = false; }); }
  else { expenseOptions.forEach(function (opt) { opt.disabled = false; }); incomeOptions.forEach(function (opt) { opt.disabled = false; }); }
  if (!isTransfer) {
    var selectedOption = dom.inputCategory.options[dom.inputCategory.selectedIndex];
    if (!selectedOption || selectedOption.disabled) {
      dom.inputCategory.value = type === 'income' ? firstEnabledValue(optgroupIncome) : firstEnabledValue(optgroupExpense);
    }
  }
}
