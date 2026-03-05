/* ===========================
   ui.js — DOM rendering and UI updates
   =========================== */
// TODO: This file is ~2700 lines. Consider splitting into smaller modules
// (chart.js, calendar.js, split-bill.js, etc.) for better maintainability.
import {
  state,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  AVAILABLE_ICONS,
  AVATAR_COLORS,
  VALID_VIEWS,
  normalizeWalletIcon,
} from './modules/state.js';
import * as calc from './modules/calculations.js';
import * as storage from './modules/storage.js';
import * as sharedLedgers from './modules/shared-ledgers.js';

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
  dom.historyEmptyTitle = document.getElementById('history-empty-title');
  dom.historyEmptyText = document.getElementById('history-empty-text');
  dom.historyEmptyPrimaryBtn = document.getElementById('btn-history-empty-primary');
  dom.historyEmptySecondaryBtn = document.getElementById('btn-history-empty-secondary');
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
  dom.recurringRow = document.getElementById('recurring-row');
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
  dom.calendarInsights = document.getElementById('calendar-insights');
  dom.calendarDayDetail = document.getElementById('calendar-day-detail');
  dom.calDetailDate = document.getElementById('cal-detail-date');
  dom.calDetailSummary = document.getElementById('cal-detail-summary');
  dom.calDetailList = document.getElementById('cal-detail-list');
  dom.categoryBudgetMeta = document.getElementById('category-budget-meta');
  dom.categoryBudgetList = document.getElementById('category-budget-list');
  dom.categoryBudgetEmpty = document.getElementById('category-budget-empty');
  dom.toolsGoalCount = document.getElementById('tools-goal-count');
  dom.toolsGoalMeta = document.getElementById('tools-goal-meta');
  dom.toolsBudgetCount = document.getElementById('tools-budget-count');
  dom.toolsBudgetMeta = document.getElementById('tools-budget-meta');
  dom.toolsSplitOpenCount = document.getElementById('tools-split-open-count');
  dom.toolsSplitOpenMeta = document.getElementById('tools-split-open-meta');
  dom.toolsSplitSyncCount = document.getElementById('tools-split-sync-count');
  dom.toolsSplitSyncMeta = document.getElementById('tools-split-sync-meta');
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

  // Additional required references
  dom.inputImportJson = document.getElementById('input-import-json');
  dom.budgetOverlay = document.getElementById('budget-overlay');
  dom.inputBudgetLimit = document.getElementById('input-budget-limit');
  dom.categoryOverlay = document.getElementById('category-overlay');
  dom.inputCustomCatName = document.getElementById('input-custom-cat-name');
  dom.inputCustomCatType = document.getElementById('input-custom-cat-type');

  dom.summaryCard = document.querySelector('.summary-card');
  dom.chartCard = document.querySelector('.chart-card');
  dom.historyTableCard = document.querySelector('.history-table-card');
  dom.reportCard = document.querySelector('.report-card');
  dom.trendCard = document.querySelector('.trend-card');
  dom.dashboardLoadingCards = [dom.summaryCard, dom.chartCard].filter(Boolean);
  dom.historyLoadingCards = [dom.historyTableCard].filter(Boolean);
  dom.reportLoadingCards = [dom.reportCard, dom.trendCard].filter(Boolean);
}

export { dom };

const getChartJs = () => window.Chart;
const hasChartJs = () => typeof getChartJs() === 'function';
const getCssColor = (tokenName, fallback) => {
  const value = getComputedStyle(document.documentElement).getPropertyValue(tokenName).trim();
  return value || fallback;
};
let renderStateTimer = null;
let coreLoadingReleaseTimer = null;
let coreLoadingStartedAt = 0;
let coreLoadingVisible = false;
const CORE_LOADING_MIN_MS = 220;
const RENDER_STATE_ICONS = {
  loading: 'ph-bold ph-spinner-gap',
  success: 'ph-fill ph-check-circle',
  warning: 'ph-fill ph-warning-circle',
  error: 'ph-fill ph-x-circle',
  info: 'ph-fill ph-info',
};
const TREND_MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];
let trendBars = [];
let trendTooltipBound = false;
const VIEW_INDEX = VALID_VIEWS.reduce(function (map, key, idx) {
  map[key] = idx;
  return map;
}, {});
let activeViewKey = null;
let viewTransitionTimer = null;

// ─── Toast Notifications ─────────────────
export function showToast(message, type) {
  type = type || 'success';
  let iconMap = {
    success: '<i class="ph-fill ph-check-circle" style="color: var(--clr-success);"></i>',
    warning: '<i class="ph-fill ph-warning-circle" style="color: var(--clr-warning);"></i>',
    error: '<i class="ph-fill ph-warning-circle" style="color: var(--clr-danger);"></i>',
    info: '<i class="ph-fill ph-info" style="color: var(--clr-accent);"></i>',
  };
  let toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.innerHTML =
    '<span class="toast-icon">' +
    (iconMap[type] || '<i class="ph-fill ph-check-circle"></i>') +
    '</span>' +
    '<span>' +
    calc.escapeHtml(message) +
    '</span>';
  dom.toastContainer.appendChild(toast);
  setTimeout(function () {
    toast.classList.add('toast-out');
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 2500);
}

export function showUndoToast(message, onUndo) {
  let toast = document.createElement('div');
  toast.className = 'toast toast-info';
  toast.innerHTML =
    '<span class="toast-icon"><i class="ph-bold ph-arrow-u-up-left" style="color: var(--clr-accent);"></i></span>' +
    '<span>' +
    calc.escapeHtml(message) +
    '</span>' +
    '<button class="toast-action" type="button">Undo</button>';
  let btn = toast.querySelector('.toast-action');
  btn.addEventListener('click', function () {
    if (onUndo) onUndo();
    toast.classList.add('toast-out');
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 200);
  });
  dom.toastContainer.appendChild(toast);
  setTimeout(function () {
    toast.classList.add('toast-out');
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
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
  dom.themeIcon.innerHTML =
    theme === 'dark' ? '<i class="ph-bold ph-sun"></i>' : '<i class="ph-bold ph-moon"></i>';
}

// ─── Render State ─────────────────────────
export function setRenderState(message, type) {
  if (!dom.renderStateEl) return;
  let tone = type || 'info';
  dom.renderStateEl.classList.remove(
    'state-loading',
    'state-success',
    'state-warning',
    'state-error',
    'state-info'
  );
  if (!message) {
    dom.renderStateEl.textContent = '';
    dom.renderStateEl.classList.remove('visible');
    return;
  }
  dom.renderStateEl.classList.add('visible', 'state-' + tone);
  let iconClass = RENDER_STATE_ICONS[tone] || RENDER_STATE_ICONS.info;
  dom.renderStateEl.innerHTML =
    '<span class="render-state-icon" aria-hidden="true"><i class="' +
    iconClass +
    '"></i></span>' +
    '<span class="render-state-label">' +
    calc.escapeHtml(message) +
    '</span>';
}

export function flashRenderState(message, type, ms) {
  if (renderStateTimer) clearTimeout(renderStateTimer);
  setRenderState(message, type || 'info');
  renderStateTimer = setTimeout(function () {
    setRenderState('');
    renderStateTimer = null;
  }, ms || 2200);
}

function toggleLoadingCards(cards, loading) {
  if (!Array.isArray(cards) || cards.length === 0) return;
  cards.forEach(function (card) {
    if (card) card.classList.toggle('is-loading', loading);
  });
}

function setCoreLoading(loading) {
  toggleLoadingCards(dom.dashboardLoadingCards, loading);
  toggleLoadingCards(dom.historyLoadingCards, loading);
  toggleLoadingCards(dom.reportLoadingCards, loading);
}

function beginCoreLoading() {
  if (coreLoadingReleaseTimer) {
    clearTimeout(coreLoadingReleaseTimer);
    coreLoadingReleaseTimer = null;
  }
  coreLoadingStartedAt = Date.now();
  if (coreLoadingVisible) return;
  coreLoadingVisible = true;
  setCoreLoading(true);
}

function finishCoreLoading() {
  if (!coreLoadingVisible) {
    if (dom.renderStateEl && dom.renderStateEl.classList.contains('state-loading')) {
      setRenderState('');
    }
    return;
  }
  let elapsed = Date.now() - coreLoadingStartedAt;
  let wait = Math.max(0, CORE_LOADING_MIN_MS - elapsed);
  if (coreLoadingReleaseTimer) clearTimeout(coreLoadingReleaseTimer);
  coreLoadingReleaseTimer = setTimeout(function () {
    setCoreLoading(false);
    coreLoadingVisible = false;
    coreLoadingReleaseTimer = null;
    if (dom.renderStateEl && dom.renderStateEl.classList.contains('state-loading')) {
      setRenderState('');
    }
  }, wait);
}

function updateHistoryEmptyState(hasAnyTransaction) {
  if (
    !dom.historyEmptyTitle ||
    !dom.historyEmptyText ||
    !dom.historyEmptyPrimaryBtn ||
    !dom.historyEmptySecondaryBtn
  )
    return;
  if (hasAnyTransaction) {
    dom.historyEmptyTitle.textContent = 'Filter tidak menemukan transaksi';
    dom.historyEmptyText.textContent =
      'Ubah kata kunci, kategori, atau periode. Bisa juga reset filter untuk melihat semua data.';
    dom.historyEmptyPrimaryBtn.textContent = 'Tambah Transaksi';
    dom.historyEmptyPrimaryBtn.setAttribute('data-nav-target', 'add');
    dom.historyEmptySecondaryBtn.textContent = 'Reset Filter';
    dom.historyEmptySecondaryBtn.classList.remove('is-hidden');
    return;
  }
  dom.historyEmptyTitle.textContent = 'Belum ada transaksi';
  dom.historyEmptyText.textContent = 'Yuk catat pengeluaran pertamamu.';
  dom.historyEmptyPrimaryBtn.textContent = 'Tambah Transaksi';
  dom.historyEmptyPrimaryBtn.setAttribute('data-nav-target', 'add');
  dom.historyEmptySecondaryBtn.classList.add('is-hidden');
}

// ─── Summary ──────────────────────────────
export function updateSummary(filteredData) {
  let totals = calc.calculateTotal(filteredData);
  dom.totalIncomeEl.textContent = calc.formatRupiah(totals.income);
  dom.totalExpenseEl.textContent = calc.formatRupiah(totals.expense);
  dom.totalCountEl.textContent = filteredData.length;

  [dom.totalIncomeEl, dom.totalExpenseEl, dom.totalCountEl, dom.topCategoryEl].forEach(
    function (el) {
      el.classList.remove('pulse');
      void el.offsetWidth;
      el.classList.add('pulse');
    }
  );

  if (filteredData.length > 0) {
    let catTotals = {};
    filteredData.forEach(function (item) {
      if (item.type !== 'income') {
        catTotals[item.category] = (catTotals[item.category] || 0) + item.amount;
      }
    });
    let topCat = '',
      topVal = 0;
    Object.keys(catTotals).forEach(function (cat) {
      if (catTotals[cat] > topVal) {
        topVal = catTotals[cat];
        topCat = cat;
      }
    });
    dom.topCategoryEl.innerHTML = (CATEGORY_ICONS[topCat] || '') + ' ' + calc.escapeHtml(topCat);
  } else {
    dom.topCategoryEl.textContent = '—';
  }
}

// ─── Hero (Balance & Budget) ──────────────
export function updateHero() {
  let totals = calc.calculateTotal(state.expenses);
  dom.totalBalanceEl.textContent = calc.formatRupiah(totals.balance);

  if (dom.walletBalancesEl) {
    let wals = calc.calculateWalletBalances(state.expenses, state.wallets);
    dom.walletBalancesEl.innerHTML = '';
    Object.keys(wals).forEach(function (w) {
      let bal = wals[w];
      let walletObj = state.wallets.find(function (obj) {
        return obj.name === w;
      });
      let icon = walletObj
        ? '<i class="ph-bold ' + normalizeWalletIcon(walletObj.icon) + '"></i>'
        : '<i class="ph-bold ph-wallet"></i>';
      let wDiv = document.createElement('div');
      wDiv.className = 'wallet-pill';
      wDiv.innerHTML =
        '<span class="wallet-pill-label">' +
        icon +
        ' ' +
        calc.escapeHtml(w) +
        '</span>' +
        '<strong class="wallet-pill-value">' +
        calc.formatRupiah(bal) +
        '</strong>';
      dom.walletBalancesEl.appendChild(wDiv);
    });
  }

  let currentMonth = calc.getCurrentMonthKey();
  let monthExpenses = state.expenses.filter(function (item) {
    return item.type !== 'income' && item.date.startsWith(currentMonth);
  });
  let monthExpenseTotal = monthExpenses.reduce(function (sum, item) {
    return sum + item.amount;
  }, 0);
  let budget = storage.getBudgetLimit();

  if (budget > 0) {
    dom.budgetTextUsed.textContent = calc.formatRupiah(monthExpenseTotal);
    dom.budgetTextLimit.textContent = '/ ' + calc.formatRupiah(budget);
    let pct = Math.min((monthExpenseTotal / budget) * 100, 100);
    dom.budgetPct.textContent = Math.round(pct) + '%';
    dom.budgetPct.style.display = 'block';
    dom.budgetFill.style.width = pct + '%';
    if (pct >= 90) {
      dom.budgetFill.style.background = 'var(--clr-danger)';
      dom.budgetPct.style.background = 'var(--clr-danger)';
      dom.budgetPct.style.color = 'var(--clr-on-danger)';
      dom.budgetNote.textContent = 'Hati-hati! Pengeluaran Anda hampir melewati batas.';
    } else if (pct >= 70) {
      dom.budgetFill.style.background = 'var(--clr-warning)';
      dom.budgetPct.style.background = 'var(--clr-warning)';
      dom.budgetPct.style.color = 'var(--clr-on-warning)';
      dom.budgetNote.textContent = 'Pengeluaran bulan ini sudah cukup tinggi.';
    } else {
      dom.budgetFill.style.background = '';
      dom.budgetPct.style.background = '';
      dom.budgetPct.style.color = '';
      dom.budgetNote.textContent = 'Pengeluaran Anda masih aman terkontrol.';
    }
  } else {
    dom.budgetTextUsed.textContent = calc.formatRupiah(monthExpenseTotal);
    dom.budgetTextLimit.textContent = '/ Tidak ada batas';
    dom.budgetPct.style.display = 'none';
    dom.budgetFill.style.width = '0%';
    dom.budgetFill.style.background = '';
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
  state.customCategories.forEach((cat) => {
    const exists =
      Array.from(expenseGroup.options).some((o) => o.value === cat.name) ||
      Array.from(incomeGroup.options).some((o) => o.value === cat.name);
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
  let uniqueTitles = {};
  state.expenses.forEach(function (e) {
    if (!uniqueTitles[e.title]) uniqueTitles[e.title] = e;
  });
  dom.titleSuggestions.innerHTML = '';
  Object.keys(uniqueTitles).forEach(function (title) {
    let option = document.createElement('option');
    option.value = title;
    dom.titleSuggestions.appendChild(option);
  });
}

// ─── Wallet Dropdowns ─────────────────────
export function renderWalletDropdowns() {
  let walletSelects = [dom.inputWallet, dom.inputWalletTo, dom.inputGoalFundSource];
  walletSelects.forEach(function (sel) {
    if (!sel) return;
    let currentVal = sel.value;
    sel.innerHTML = '';
    state.wallets.forEach(function (w) {
      let opt = document.createElement('option');
      opt.value = w.name;
      opt.textContent = w.name;
      sel.appendChild(opt);
    });
    if (
      currentVal &&
      state.wallets.some(function (wallet) {
        return wallet.name === currentVal;
      })
    ) {
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
    let item = document.createElement('div');
    item.className = 'wallet-item';
    let usageCount = state.expenses.filter(function (entry) {
      return entry.wallet === wallet.name || entry.walletTo === wallet.name;
    }).length;
    let deleteDisabled = usageCount > 0 || state.wallets.length <= 1;
    let deleteTitle =
      usageCount > 0
        ? 'Tidak dapat dihapus karena masih digunakan dalam transaksi'
        : state.wallets.length <= 1
          ? 'Setidaknya harus ada satu dompet aktif'
          : 'Hapus dompet';
    item.innerHTML =
      '<div class="wallet-item-icon"><i class="ph-bold ' +
      normalizeWalletIcon(wallet.icon) +
      '"></i></div>' +
      '<div class="wallet-item-meta"><div class="wallet-item-name">' +
      calc.escapeHtml(wallet.name) +
      '</div><div class="wallet-item-usage">Dipakai di ' +
      usageCount +
      ' transaksi</div></div>' +
      '<button class="btn btn-ghost btn-sm btn-del-wallet" data-id="' +
      wallet.id +
      '" title="' +
      deleteTitle +
      '" ' +
      (deleteDisabled ? 'disabled aria-disabled="true"' : '') +
      '><i class="ph-bold ph-trash"></i></button>';
    let btnDel = item.querySelector('.btn-del-wallet');
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
    let card = document.createElement('div');
    card.className = 'template-card';
    let iconHtml = CATEGORY_ICONS[tpl.category] || '<i class="ph-bold ph-tag"></i>';
    card.innerHTML =
      '<div class="template-icon">' +
      iconHtml +
      '</div>' +
      '<div class="template-name">' +
      calc.escapeHtml(tpl.title) +
      '</div>' +
      '<div class="template-amount">' +
      calc.formatRupiah(tpl.amount) +
      '</div>' +
      '<button class="btn-del-template" data-id="' +
      tpl.id +
      '"><i class="ph-bold ph-x"></i></button>';
    card.addEventListener('click', function (e) {
      if (e.target.closest('.btn-del-template')) return;
      if (onUseTemplate) onUseTemplate(tpl);
    });
    let btnDel = card.querySelector('.btn-del-template');
    btnDel.addEventListener('click', function () {
      if (onDeleteTemplate) onDeleteTemplate(tpl.id);
    });
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
  let monthKey = getReportMonthKey();
  let summary = calc.calculateMonthlySummary(state.expenses, monthKey);
  dom.reportMonthLabel.textContent = calc.getMonthLabel(monthKey);
  dom.reportIncomeEl.textContent = calc.formatRupiah(summary.monthIncome);
  dom.reportExpenseEl.textContent = calc.formatRupiah(summary.monthExpense);
  dom.reportNetEl.textContent = calc.formatRupiah(summary.net);
  dom.reportNetEl.classList.remove('report-value-positive', 'report-value-negative');
  dom.reportNetEl.classList.add(
    summary.net >= 0 ? 'report-value-positive' : 'report-value-negative'
  );
  dom.reportCountEl.textContent = String(summary.count);
  dom.reportTopCategoryEl.textContent =
    'Kategori teratas: ' +
    (summary.topCategory === '—'
      ? '—'
      : summary.topCategory + ' (' + calc.formatRupiah(summary.topCategoryAmount) + ')');
  dom.reportLargestExpenseEl.textContent = summary.largestExpense
    ? 'Pengeluaran terbesar: ' +
      summary.largestExpense.title +
      ' (' +
      calc.formatRupiah(summary.largestExpense.amount) +
      ')'
    : 'Pengeluaran terbesar: —';
  dom.reportTrendEl.textContent = 'Tren vs bulan lalu: ' + summary.trendText;
  dom.reportAdviceEl.textContent = summary.advice;
  renderTrendChart();

  // Explicit fix for skeletons
  if (dom.reportCard) dom.reportCard.classList.remove('is-loading');
  if (dom.trendCard) dom.trendCard.classList.remove('is-loading');
}

// ─── Trend Chart ──────────────────────────
function formatTrendMonthShort(monthKey) {
  let parts = String(monthKey || '').split('-');
  if (parts.length !== 2) return String(monthKey || '—');
  let monthNum = Number(parts[1]);
  if (!Number.isFinite(monthNum) || monthNum < 1 || monthNum > 12) return String(monthKey || '—');
  return TREND_MONTH_SHORT[monthNum - 1] + ' ' + String(parts[0]).slice(-2);
}

function formatTrendAxisValue(value) {
  return calc.formatRupiahCompact(value, { withPrefix: false, maxFractionDigits: 1 });
}

function setTrendLegendTotals(data) {
  let incomeTotal = 0;
  let expenseTotal = 0;
  data.forEach(function (entry) {
    incomeTotal += Number(entry.income || 0);
    expenseTotal += Number(entry.expense || 0);
  });
  let incomeEl = document.getElementById('trend-legend-income-value');
  let expenseEl = document.getElementById('trend-legend-expense-value');
  if (incomeEl)
    incomeEl.textContent = calc.formatRupiahCompact(incomeTotal, { maxFractionDigits: 1 });
  if (expenseEl)
    expenseEl.textContent = calc.formatRupiahCompact(expenseTotal, { maxFractionDigits: 1 });
}

function hideTrendTooltip() {
  if (!dom.trendTooltip) return;
  dom.trendTooltip.classList.remove('visible');
}

function pointInRect(x, y, rect) {
  if (!rect) return false;
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function showTrendTooltip(bar, clientX, clientY) {
  if (!dom.trendTooltip || !bar || !dom.trendChartCanvas || !dom.trendChartCanvas.parentElement)
    return;
  let net = bar.income - bar.expense;
  let netClass = net >= 0 ? 'is-positive' : 'is-negative';
  let netLabel = (net >= 0 ? '+' : '') + calc.formatRupiahCompact(net, { maxFractionDigits: 1 });
  dom.trendTooltip.innerHTML =
    '<div class="trend-tooltip-head">' +
    calc.escapeHtml(bar.monthLabel) +
    '</div>' +
    '<div class="trend-tooltip-row"><span>Pemasukan</span><strong class="text-success">' +
    calc.formatRupiahCompact(bar.income, { maxFractionDigits: 1 }) +
    '</strong></div>' +
    '<div class="trend-tooltip-row"><span>Pengeluaran</span><strong class="text-danger">' +
    calc.formatRupiahCompact(bar.expense, { maxFractionDigits: 1 }) +
    '</strong></div>' +
    '<div class="trend-tooltip-row trend-tooltip-row-net ' +
    netClass +
    '"><span>Selisih</span><strong>' +
    netLabel +
    '</strong></div>';

  let containerRect = dom.trendChartCanvas.parentElement.getBoundingClientRect();
  let left = clientX - containerRect.left + 14;
  let top = clientY - containerRect.top + 14;
  dom.trendTooltip.style.left = left + 'px';
  dom.trendTooltip.style.top = top + 'px';
  dom.trendTooltip.classList.add('visible');

  let tipRect = dom.trendTooltip.getBoundingClientRect();
  if (tipRect.right > containerRect.right - 8) {
    left = left - tipRect.width - 22;
  }
  if (tipRect.bottom > containerRect.bottom - 8) {
    top = top - tipRect.height - 22;
  }
  dom.trendTooltip.style.left = Math.max(8, left) + 'px';
  dom.trendTooltip.style.top = Math.max(8, top) + 'px';
}

function handleTrendHover(e) {
  if (state.isPerfLite || !trendBars.length) {
    hideTrendTooltip();
    return;
  }
  let rect = dom.trendChartCanvas.getBoundingClientRect();
  let x = e.clientX - rect.left;
  let y = e.clientY - rect.top;
  let match = null;
  trendBars.forEach(function (bar) {
    if (match) return;
    if (
      pointInRect(x, y, bar.incomeRect) ||
      pointInRect(x, y, bar.expenseRect) ||
      pointInRect(x, y, bar.groupRect)
    ) {
      match = bar;
    }
  });
  if (!match) {
    hideTrendTooltip();
    return;
  }
  showTrendTooltip(match, e.clientX, e.clientY);
}

function bindTrendTooltipEvents() {
  if (trendTooltipBound || !dom.trendChartCanvas) return;
  dom.trendChartCanvas.addEventListener('mousemove', handleTrendHover);
  dom.trendChartCanvas.addEventListener('mouseleave', hideTrendTooltip);
  dom.trendChartCanvas.addEventListener('pointerleave', hideTrendTooltip);
  trendTooltipBound = true;
}

export function renderTrendChart() {
  if (!dom.trendChartCanvas) return;
  bindTrendTooltipEvents();
  hideTrendTooltip();
  trendBars = [];

  let ctx = dom.trendChartCanvas.getContext('2d');
  let dpr = window.devicePixelRatio || 1;
  let parentW = dom.trendChartCanvas.parentElement
    ? dom.trendChartCanvas.parentElement.clientWidth
    : 580;
  let viewportW = window.innerWidth || parentW || 580;
  let minCanvasWidth = viewportW <= 480 ? 280 : viewportW <= 768 ? 320 : 400;
  let canvasWidth = Math.max(parentW - 2, minCanvasWidth);
  if (parentW > 0) canvasWidth = Math.min(canvasWidth, parentW);
  canvasWidth = Math.max(240, canvasWidth);
  let canvasHeight = 260;
  dom.trendChartCanvas.width = canvasWidth * dpr;
  dom.trendChartCanvas.height = canvasHeight * dpr;
  dom.trendChartCanvas.style.width = canvasWidth + 'px';
  dom.trendChartCanvas.style.height = canvasHeight + 'px';
  dom.trendChartCanvas.style.maxWidth = '100%';
  dom.trendChartCanvas.style.display = 'block';
  dom.trendChartCanvas.style.margin = '0 auto';
  ctx.scale(dpr, dpr);

  let months = [];
  let current = calc.getCurrentMonthKey();
  for (let i = 0; i < 6; i++) {
    months.unshift(current);
    current = calc.getPreviousMonthKey(current);
  }
  let data = months.map(function (m) {
    let inc = 0,
      exp = 0;
    state.expenses.forEach(function (e) {
      if (e.date.startsWith(m)) {
        if (e.type === 'income') inc += e.amount;
        else if (e.type === 'expense') exp += e.amount;
      }
    });
    return { month: m, income: inc, expense: exp };
  });
  setTrendLegendTotals(data);

  let maxVal =
    Math.max.apply(
      Math,
      data.map(function (d) {
        return Math.max(d.income, d.expense);
      })
    ) || 100000;
  if (maxVal >= 1000000) maxVal = Math.ceil(maxVal / 1000000) * 1000000;
  else if (maxVal >= 100000) maxVal = Math.ceil(maxVal / 100000) * 100000;
  else maxVal = Math.ceil(maxVal / 10000) * 10000;
  maxVal = Math.max(maxVal, 10000);
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  if (state.expenses.length === 0) {
    if (dom.trendEmpty) dom.trendEmpty.classList.add('visible');
    dom.trendChartCanvas.style.display = 'none';
    return;
  }
  if (dom.trendEmpty) dom.trendEmpty.classList.remove('visible');
  dom.trendChartCanvas.style.display = 'block';
  let compact = canvasWidth < 360;
  let padding = compact
    ? { top: 18, right: 10, bottom: 36, left: 46 }
    : { top: 20, right: 16, bottom: 40, left: 60 };
  let chartW = canvasWidth - padding.left - padding.right;
  let chartH = canvasHeight - padding.top - padding.bottom;
  let groupWidth = chartW / data.length;
  let barWidth = Math.max(22, Math.min(58, groupWidth * 0.7));
  let pairGap = Math.max(4, Math.min(8, barWidth * 0.1));
  let singleBarWidth = (barWidth - pairGap) / 2;
  let axisColor = getCssColor(
    '--clr-chart-axis',
    storage.getTheme() === 'dark' ? '#94a3b8' : '#64748b'
  );
  let gridColor = getCssColor(
    '--clr-chart-grid',
    storage.getTheme() === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
  );
  let incomeColor = getCssColor('--clr-chart-income', '#10b981');
  let expenseColor = getCssColor('--clr-chart-expense', '#f43f5e');
  let borderColor = getCssColor(
    '--clr-border',
    storage.getTheme() === 'dark' ? '#253550' : '#dce3ed'
  );

  ctx.fillStyle = getCssColor('--clr-surface-alt', '#f7f9fc');
  ctx.fillRect(padding.left, padding.top, chartW, chartH);
  ctx.strokeStyle = borderColor;
  ctx.strokeRect(padding.left + 0.5, padding.top + 0.5, chartW - 1, chartH - 1);

  ctx.fillStyle = axisColor;
  ctx.font = (compact ? '600 9px ' : '600 10px ') + '"Manrope", "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'right';
  for (let j = 0; j <= 4; j++) {
    let y = padding.top + chartH - j * (chartH / 4);
    let labelVal = (maxVal / 4) * j;
    ctx.fillText(formatTrendAxisValue(labelVal), padding.left - 10, y + 4);
    ctx.beginPath();
    ctx.strokeStyle = gridColor;
    if (j === 0) ctx.setLineDash([]);
    else ctx.setLineDash([5, 4]);
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + chartW, y);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  data.forEach(function (d, idx) {
    let xBase = padding.left + idx * groupWidth + (groupWidth - barWidth) / 2;
    let incH = (d.income / maxVal) * chartH;
    let expH = (d.expense / maxVal) * chartH;
    let incomeDrawH = Math.max(incH, d.income > 0 ? 2 : 0);
    let expenseDrawH = Math.max(expH, d.expense > 0 ? 2 : 0);
    let incomeX = xBase;
    let expenseX = xBase + singleBarWidth + pairGap;
    let incomeY = padding.top + chartH - incomeDrawH;
    let expenseY = padding.top + chartH - expenseDrawH;

    ctx.fillStyle = incomeColor;
    if (incomeDrawH > 0) {
      ctx.beginPath();
      ctx.roundRect(incomeX, incomeY, singleBarWidth, incomeDrawH, [5, 5, 0, 0]);
      ctx.fill();
    }
    ctx.fillStyle = expenseColor;
    if (expenseDrawH > 0) {
      ctx.beginPath();
      ctx.roundRect(expenseX, expenseY, singleBarWidth, expenseDrawH, [5, 5, 0, 0]);
      ctx.fill();
    }

    let label = formatTrendMonthShort(d.month);
    ctx.fillStyle = axisColor;
    ctx.textAlign = 'center';
    ctx.fillText(label, xBase + barWidth / 2, padding.top + chartH + 20);

    let groupTop = Math.min(
      incomeDrawH > 0 ? incomeY : padding.top + chartH,
      expenseDrawH > 0 ? expenseY : padding.top + chartH
    );
    trendBars.push({
      monthLabel: calc.getMonthLabel(d.month),
      income: d.income,
      expense: d.expense,
      incomeRect: { x: incomeX, y: incomeY, w: singleBarWidth, h: Math.max(incomeDrawH, 6) },
      expenseRect: { x: expenseX, y: expenseY, w: singleBarWidth, h: Math.max(expenseDrawH, 6) },
      groupRect: {
        x: xBase,
        y: groupTop,
        w: barWidth,
        h: Math.max(padding.top + chartH - groupTop, 10),
      },
    });
  });
}

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

// ─── Category Budget Summary ──────────────
export function renderCategoryBudgetSummary() {
  if (!dom.categoryBudgetList || !dom.categoryBudgetMeta || !dom.categoryBudgetEmpty) return;
  let monthKey = getReportMonthKey();
  let monthCategoryExpense = calc.getMonthlyExpenseByCategory(state.expenses, monthKey);
  let categories = Object.keys(state.categoryBudgets).filter(function (cat) {
    return Number(state.categoryBudgets[cat]) > 0;
  });
  dom.categoryBudgetList.innerHTML = '';
  if (!categories.length) {
    dom.categoryBudgetMeta.textContent = 'Belum ada budget kategori aktif.';
    dom.categoryBudgetEmpty.classList.add('visible');
    renderToolsOverview();
    return;
  }
  dom.categoryBudgetEmpty.classList.remove('visible');
  dom.categoryBudgetMeta.textContent =
    calc.getMonthLabel(monthKey) + ' • ' + categories.length + ' kategori dipantau';
  categories.sort(function (a, b) {
    let aL = Number(state.categoryBudgets[a]) || 1;
    let bL = Number(state.categoryBudgets[b]) || 1;
    return (monthCategoryExpense[b] || 0) / bL - (monthCategoryExpense[a] || 0) / aL;
  });
  categories.forEach(function (cat) {
    let limit = Number(state.categoryBudgets[cat]) || 0;
    let spent = Number(monthCategoryExpense[cat]) || 0;
    let pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
    let statusClass = pct >= 100 ? 'is-over' : pct >= 75 ? 'is-warn' : 'is-safe';
    let item = document.createElement('div');
    item.className = 'category-budget-item';
    item.innerHTML =
      '<div class="category-budget-row"><div class="category-budget-name">' +
      (CATEGORY_ICONS[cat] || '<i class="ph-bold ph-tag"></i>') +
      ' ' +
      calc.escapeHtml(cat) +
      '</div>' +
      '<div class="category-budget-amount">' +
      calc.formatRupiah(spent) +
      ' / ' +
      calc.formatRupiah(limit) +
      ' (' +
      Math.round(pct) +
      '%)</div></div>' +
      '<div class="category-budget-track"><div class="category-budget-fill ' +
      statusClass +
      '" style="width:' +
      pct.toFixed(2) +
      '%;"></div></div>';
    dom.categoryBudgetList.appendChild(item);
  });
  renderToolsOverview();
}

export function renderToolsOverview() {
  if (
    !dom.toolsGoalCount ||
    !dom.toolsBudgetCount ||
    !dom.toolsSplitOpenCount ||
    !dom.toolsSplitSyncCount
  )
    return;
  let goalCount = state.goals.length;
  let budgetCount = Object.keys(state.categoryBudgets).filter(function (cat) {
    return Number(state.categoryBudgets[cat]) > 0;
  }).length;
  let splitOpen = 0;
  let splitPendingSync = 0;
  state.splitLedger.forEach(function (entry) {
    if (!entry || typeof entry !== 'object') return;
    if (!entry.isDone) splitOpen += 1;
    if (!entry.syncedExpenseId) splitPendingSync += 1;
  });

  dom.toolsGoalCount.textContent = String(goalCount);
  dom.toolsBudgetCount.textContent = String(budgetCount);
  dom.toolsSplitOpenCount.textContent = String(splitOpen);
  dom.toolsSplitSyncCount.textContent = String(splitPendingSync);

  if (dom.toolsGoalMeta) {
    dom.toolsGoalMeta.textContent =
      goalCount > 0 ? goalCount + ' target sedang dipantau.' : 'Belum ada target tabungan.';
  }
  if (dom.toolsBudgetMeta) {
    dom.toolsBudgetMeta.textContent =
      budgetCount > 0
        ? calc.getMonthLabel(getReportMonthKey()) + ' dipantau.'
        : 'Belum ada budget aktif.';
  }
  if (dom.toolsSplitOpenMeta) {
    dom.toolsSplitOpenMeta.textContent =
      splitOpen > 0 ? splitOpen + ' bill belum ditutup.' : 'Tidak ada split terbuka.';
  }
  if (dom.toolsSplitSyncMeta) {
    dom.toolsSplitSyncMeta.textContent =
      splitPendingSync > 0
        ? splitPendingSync + ' bill belum disinkronkan.'
        : 'Semua split sudah sinkron.';
  }
}

function getExpenseCategories() {
  let seen = {};
  let out = [];
  let expenseGroup = document.getElementById('optgroup-expense');
  if (expenseGroup) {
    expenseGroup.querySelectorAll('option').forEach(function (opt) {
      let value = (opt.value || '').trim();
      if (!value || seen[value]) return;
      seen[value] = true;
      out.push(value);
    });
  }
  state.expenses.forEach(function (item) {
    if (item.type === 'income' || item.type === 'transfer') return;
    let cat = (item.category || '').trim();
    if (!cat || seen[cat]) return;
    seen[cat] = true;
    out.push(cat);
  });
  return out.sort(function (a, b) {
    return a.localeCompare(b, 'id');
  });
}

export function openCategoryBudgetModal() {
  renderCategoryBudgetEditor(formatInputCurrency);
  dom.categoryBudgetOverlay.classList.add('active');
}

export function renderCategoryBudgetEditor(formatInputCurrency) {
  if (!dom.categoryBudgetEditor) return;
  let categories = getExpenseCategories();
  if (!categories.length) {
    dom.categoryBudgetEditor.innerHTML =
      '<p class="category-budget-empty visible">Belum ada kategori pengeluaran yang tersedia.</p>';
    return;
  }
  dom.categoryBudgetEditor.innerHTML = '';
  categories.forEach(function (cat) {
    let val = Number(state.categoryBudgets[cat]) || 0;
    let row = document.createElement('div');
    row.className = 'category-budget-edit-row';
    let label = document.createElement('label');
    label.className = 'category-budget-edit-label';
    label.innerHTML =
      (CATEGORY_ICONS[cat] || '<i class="ph-bold ph-tag"></i>') + ' ' + calc.escapeHtml(cat);
    let input = document.createElement('input');
    input.type = 'text';
    input.className = 'category-budget-input';
    input.setAttribute('inputmode', 'numeric');
    input.setAttribute('placeholder', '0 = nonaktif');
    input.dataset.category = cat;
    input.value = val > 0 ? val.toLocaleString('en-US') : '';
    row.appendChild(label);
    row.appendChild(input);
    dom.categoryBudgetEditor.appendChild(row);
  });
  dom.categoryBudgetEditor.querySelectorAll('.category-budget-input').forEach(function (input) {
    input.addEventListener('input', formatInputCurrency);
  });
}

// ─── Doughnut Chart ───────────────────────
function renderCategoryLegendItems(categories, catTotals, total, fallbackSliceColor) {
  dom.chartLegend.innerHTML = '';
  categories.forEach(function (cat, idx) {
    let pct = total > 0 ? (catTotals[cat] / total) * 100 : 0;
    let rawLabel = String(cat || '');
    let shortLabel = calc.truncateLabel(rawLabel, 20);
    let legendItem = document.createElement('div');
    legendItem.className = 'legend-item';
    legendItem.innerHTML =
      '<span class="legend-rank">' +
      String(idx + 1).padStart(2, '0') +
      '</span>' +
      '<span class="legend-color" style="background:' +
      (CATEGORY_COLORS[cat] || fallbackSliceColor) +
      '"></span>' +
      '<span class="legend-label" title="' +
      calc.escapeHtml(rawLabel) +
      '">' +
      (CATEGORY_ICONS[cat] || '<i class="ph-bold ph-tag"></i>') +
      ' ' +
      calc.escapeHtml(shortLabel) +
      '</span>' +
      '<span class="legend-value">' +
      calc.formatRupiahCompact(catTotals[cat], { maxFractionDigits: 1 }) +
      '</span>' +
      '<span class="legend-share">' +
      calc.formatPercent(pct, 1) +
      '</span>';
    dom.chartLegend.appendChild(legendItem);
  });
}

export function renderChart(data) {
  dom.chartLegend.innerHTML = '';
  state.chartSlices = [];
  state.chartGeom = null;
  hideChartTooltip();
  let hasExpense =
    data &&
    data.some(function (item) {
      return item.type === 'expense';
    });
  if (!hasExpense) {
    if (state.categoryChartInstance) {
      state.categoryChartInstance.destroy();
      state.categoryChartInstance = null;
    }
    dom.chartEmpty.classList.add('visible');
    dom.chartCanvas.style.display = 'none';
    dom.chartLegend.style.display = 'none';
    return;
  }
  let catTotals = {};
  let total = 0;
  data.forEach(function (item) {
    if (item.type === 'expense') {
      catTotals[item.category] = (catTotals[item.category] || 0) + item.amount;
      total += item.amount;
    }
  });
  let categories = Object.keys(catTotals).sort(function (a, b) {
    return catTotals[b] - catTotals[a];
  });
  let values = categories.map(function (cat) {
    return catTotals[cat];
  });
  let fallbackSliceColor = getCssColor('--clr-chart-slice-fallback', '#94a3b8');
  let chartRingBorder = getCssColor('--clr-chart-ring-border', 'rgba(255,255,255,0.18)');
  let colors = categories.map(function (cat) {
    return CATEGORY_COLORS[cat] || fallbackSliceColor;
  });

  if (hasChartJs()) {
    dom.chartEmpty.classList.remove('visible');
    dom.chartCanvas.style.display = 'block';
    dom.chartLegend.style.display = 'flex';
    renderCategoryLegendItems(categories, catTotals, total, fallbackSliceColor);
    if (state.categoryChartInstance) {
      state.categoryChartInstance.data.labels = categories;
      state.categoryChartInstance.data.datasets[0].data = values;
      state.categoryChartInstance.data.datasets[0].backgroundColor = colors;
      state.categoryChartInstance.data.datasets[0].borderColor = chartRingBorder;
      state.categoryChartInstance.update();
      return;
    }
    state.categoryChartInstance = new window.Chart(dom.chartCanvas, {
      type: 'doughnut',
      data: {
        labels: categories,
        datasets: [
          { data: values, backgroundColor: colors, borderColor: chartRingBorder, borderWidth: 1.5 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '58%',
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: false,
            external: function (ctx) {
              let tooltip = ctx && ctx.tooltip;
              if (!tooltip || tooltip.opacity === 0) {
                hideChartTooltip();
                return;
              }
              let point = tooltip.dataPoints && tooltip.dataPoints[0];
              if (!point) {
                hideChartTooltip();
                return;
              }
              let category = String(point.label || '');
              let amount = Number(point.raw || 0);
              let dataset =
                ctx.chart &&
                ctx.chart.data &&
                ctx.chart.data.datasets &&
                ctx.chart.data.datasets[0];
              let datasetTotal =
                dataset && Array.isArray(dataset.data)
                  ? dataset.data.reduce(function (sum, value) {
                      return sum + (Number(value) || 0);
                    }, 0)
                  : 0;
              let percent = datasetTotal > 0 ? (amount / datasetTotal) * 100 : 0;
              let canvasRect = ctx.chart.canvas.getBoundingClientRect();
              showCategoryTooltip(
                category,
                amount,
                percent,
                canvasRect.left + tooltip.caretX,
                canvasRect.top + tooltip.caretY
              );
            },
          },
        },
      },
    });
    return;
  }

  // Canvas fallback
  let ctx = dom.chartCanvas.getContext('2d');
  let dpr = window.devicePixelRatio || 1;
  let size = dom.chartCanvas.width / dpr;
  let center = size / 2;
  let outerRadius = center - 10;
  let innerRadius = outerRadius * 0.58;
  ctx.clearRect(0, 0, size, size);
  state.chartGeom = { center: size / 2, innerRadius: innerRadius, outerRadius: outerRadius };
  dom.chartEmpty.classList.remove('visible');
  dom.chartCanvas.style.display = 'block';
  dom.chartLegend.style.display = 'flex';
  renderCategoryLegendItems(categories, catTotals, total, fallbackSliceColor);

  let startAngle = -Math.PI / 2;
  let normalizedStart = 0;
  let gapAngle = 0.03;
  categories.forEach(function (cat) {
    let sliceAngle = (catTotals[cat] / total) * (2 * Math.PI);
    let color = CATEGORY_COLORS[cat] || fallbackSliceColor;
    let actualGap = categories.length > 1 ? gapAngle : 0;
    let drawStart = startAngle + actualGap / 2;
    let drawEnd = startAngle + sliceAngle - actualGap / 2;
    if (drawEnd > drawStart) {
      ctx.beginPath();
      ctx.arc(center, center, outerRadius, drawStart, drawEnd);
      ctx.arc(center, center, innerRadius, drawEnd, drawStart, true);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    }
    startAngle += sliceAngle;
    state.chartSlices.push({
      category: cat,
      amount: catTotals[cat],
      percent: (catTotals[cat] / total) * 100,
      start: normalizedStart,
      end: normalizedStart + sliceAngle,
    });
    normalizedStart += sliceAngle;
  });
  ctx.fillStyle = getCssColor('--clr-text', '#0f172a');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 1rem "Sora", "Space Grotesk", sans-serif';
  ctx.fillText(calc.formatRupiahCompact(total, { maxFractionDigits: 1 }), center, center - 8);
  ctx.font = '600 0.7rem "Manrope", "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = getCssColor('--clr-chart-axis', '#64748b');
  ctx.fillText('Total', center, center + 14);
}

export function hideChartTooltip() {
  if (!dom.chartTooltip) return;
  dom.chartTooltip.classList.remove('visible');
}

function showCategoryTooltip(category, amount, percent, clientX, clientY) {
  if (!dom.chartTooltip || !dom.chartCanvas || !dom.chartCanvas.parentElement) return;
  let categoryRaw = String(category || '');
  let categoryShort = calc.truncateLabel(categoryRaw, 24);
  let icon = CATEGORY_ICONS[category] || '<i class="ph-bold ph-tag"></i>';
  dom.chartTooltip.innerHTML =
    '<div class="chart-tooltip-head" title="' +
    calc.escapeHtml(categoryRaw) +
    '">' +
    icon +
    '<span>' +
    calc.escapeHtml(categoryShort) +
    '</span></div>' +
    '<div class="chart-tooltip-row"><span>Nominal</span><strong>' +
    calc.formatRupiahCompact(amount, { maxFractionDigits: 1 }) +
    '</strong></div>' +
    '<div class="chart-tooltip-row"><span>Porsi</span><strong>' +
    calc.formatPercent(percent, 1) +
    '</strong></div>';

  let containerRect = dom.chartCanvas.parentElement.getBoundingClientRect();
  let left = clientX - containerRect.left + 12;
  let top = clientY - containerRect.top + 12;
  dom.chartTooltip.style.left = left + 'px';
  dom.chartTooltip.style.top = top + 'px';
  dom.chartTooltip.classList.add('visible');

  let tipRect = dom.chartTooltip.getBoundingClientRect();
  if (tipRect.right > containerRect.right - 8) {
    left = left - tipRect.width - 20;
  }
  if (tipRect.bottom > containerRect.bottom - 8) {
    top = top - tipRect.height - 20;
  }
  dom.chartTooltip.style.left = Math.max(8, left) + 'px';
  dom.chartTooltip.style.top = Math.max(8, top) + 'px';
}

export function handleChartHoverQueued(e) {
  if (hasChartJs() && state.categoryChartInstance) return;
  if (state.isPerfLite) {
    hideChartTooltip();
    return;
  }
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
  if (!state.chartSlices.length || !state.chartGeom) {
    hideChartTooltip();
    return;
  }
  let rect = dom.chartCanvas.getBoundingClientRect();
  let x = e.clientX - rect.left;
  let y = e.clientY - rect.top;
  let dx = x - state.chartGeom.center;
  let dy = y - state.chartGeom.center;
  let dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < state.chartGeom.innerRadius || dist > state.chartGeom.outerRadius) {
    hideChartTooltip();
    return;
  }
  let angle = Math.atan2(dy, dx);
  let normalized = angle + Math.PI / 2;
  if (normalized < 0) normalized += Math.PI * 2;
  let match = null;
  state.chartSlices.forEach(function (slice) {
    if (normalized >= slice.start && normalized < slice.end) match = slice;
  });
  if (!match) {
    hideChartTooltip();
    return;
  }
  showCategoryTooltip(match.category, match.amount, match.percent, e.clientX, e.clientY);
}

// ─── Goals ────────────────────────────────
export function renderGoals(onFund, onDelete) {
  if (!dom.goalListEl) return;
  dom.goalListEl.innerHTML = '';
  let goalBalances = {};
  state.expenses.forEach(function (e) {
    if (e.type === 'transfer' && e.walletTo && e.walletTo.startsWith('Goal-')) {
      let gid = e.walletTo.replace('Goal-', '');
      goalBalances[gid] = (goalBalances[gid] || 0) + e.amount;
    }
  });
  if (state.goals.length === 0) {
    dom.goalListEl.innerHTML =
      '<div class="goal-empty">Belum ada tabungan impian.<span class="goal-empty-hint">Buat goal baru untuk mulai menabung.</span></div>';
    renderToolsOverview();
    return;
  }
  state.goals.forEach(function (g) {
    let current = goalBalances[g.id] || 0;
    let safeTarget = g.target > 0 ? g.target : 1;
    let pctValue = Math.min((current / safeTarget) * 100, 100);
    let pct = pctValue.toFixed(1);
    let card = document.createElement('article');
    card.className = 'goal-item';
    card.innerHTML =
      '<div class="goal-item-header"><div class="goal-item-name">' +
      calc.escapeHtml(g.name) +
      '</div><div class="goal-item-amount">' +
      calc.formatRupiah(current) +
      ' / ' +
      calc.formatRupiah(g.target) +
      '</div></div>' +
      '<div class="goal-progress-track"><div class="goal-progress-fill" style="width: ' +
      pct +
      '%;"></div></div>' +
      '<div class="goal-item-footer"><div class="goal-progress-label">' +
      pct +
      '% Tercapai</div><div class="goal-action-group">' +
      '<button class="btn btn-sm btn-ghost btn-fund-goal" data-id="' +
      g.id +
      '" type="button"><i class="ph-bold ph-piggy-bank"></i> Isi Dana</button>' +
      '<button class="btn btn-sm btn-ghost btn-del-goal" data-id="' +
      g.id +
      '" type="button" aria-label="Hapus goal"><i class="ph-bold ph-trash"></i></button></div></div>';
    dom.goalListEl.appendChild(card);
  });
  dom.goalListEl.querySelectorAll('.btn-fund-goal').forEach(function (b) {
    b.addEventListener('click', function () {
      if (onFund) onFund(this.dataset.id);
    });
  });
  dom.goalListEl.querySelectorAll('.btn-del-goal').forEach(function (b) {
    b.addEventListener('click', function () {
      if (onDelete) onDelete(this.dataset.id);
    });
  });
  renderToolsOverview();
}

// ─── Split History ────────────────────────
export function renderSplitHistory() {
  dom.splitHistoryList.innerHTML = '';
  if (state.splitLedger.length === 0) {
    dom.splitHistoryList.innerHTML = '<p class="split-history-empty">Belum ada riwayat split</p>';
    return;
  }
  state.splitLedger.slice(0, 12).forEach(function (entry) {
    let payerText = entry.payerName ? ' • Dibayar: ' + calc.escapeHtml(entry.payerName) : '';
    let ownerText = entry.ownerName ? ' • Saya: ' + calc.escapeHtml(entry.ownerName) : '';
    let item = document.createElement('div');
    item.className = 'split-history-item';
    item.innerHTML =
      '<div><div class="hist-name">' +
      calc.escapeHtml(entry.billName) +
      '</div><div class="hist-meta">' +
      calc.formatDate(entry.date) +
      ' • ' +
      entry.people.length +
      ' peserta' +
      payerText +
      ownerText +
      '</div></div>' +
      '<span class="hist-amount">' +
      calc.formatRupiah(entry.total) +
      '</span>';
    dom.splitHistoryList.appendChild(item);
  });
}

// ─── Split Ledger Table ───────────────────
export function renderSplitLedgerTable() {
  if (!dom.splitLedgerTbody || !dom.splitLedgerEmpty) return;
  dom.splitLedgerTbody.innerHTML = '';
  if (state.splitLedger.length === 0) {
    dom.splitLedgerEmpty.classList.add('visible');
    renderToolsOverview();
    return;
  }
  dom.splitLedgerEmpty.classList.remove('visible');
  let fragment = document.createDocumentFragment();
  state.splitLedger.forEach(function (entry) {
    let tr = document.createElement('tr');
    let statusKey = entry.ownerStatusKey || 'even';
    let statusText = entry.ownerStatusText || 'Status belum tersedia';
    let isDone = Boolean(entry.isDone);
    let doneText = isDone
      ? 'Selesai' + (entry.doneAt ? ' • ' + calc.formatDate(entry.doneAt) : '')
      : statusText;
    let doneClass = isDone ? 'done' : statusKey;
    let syncDone = Boolean(entry.syncedExpenseId);
    let syncClass = syncDone ? 'synced' : 'pending';
    let syncText = syncDone
      ? 'Tersinkron' + (entry.syncedAt ? ' • ' + calc.formatDate(entry.syncedAt) : '')
      : 'Belum sync';
    let syncButton = '';
    if (syncDone) {
      syncButton =
        '<button class="btn btn-sm btn-ghost" type="button" disabled><i class="ph-bold ph-check-circle"></i> Tersinkron</button>';
    } else if (Number(entry.ownerShare) > 0) {
      syncButton =
        '<button class="btn btn-sm btn-primary" type="button" data-split-action="sync" data-id="' +
        entry.id +
        '"><i class="ph-bold ph-arrows-clockwise"></i> Sync</button>';
    } else {
      syncButton =
        '<button class="btn btn-sm btn-ghost" type="button" disabled>Tidak ada porsi</button>';
    }
    let doneButton = isDone
      ? '<button class="btn btn-sm btn-ghost" type="button" disabled><i class="ph-bold ph-check"></i> Selesai</button>'
      : '<button class="btn btn-sm btn-ghost" type="button" data-split-action="done" data-id="' +
        entry.id +
        '"><i class="ph-bold ph-check-circle"></i> Mark Done</button>';
    let deleteButton =
      '<button class="btn btn-sm btn-delete" type="button" data-split-action="delete" data-id="' +
      entry.id +
      '"><i class="ph-bold ph-trash"></i> Hapus</button>';
    let actionHtml =
      '<div class="action-group"><button class="btn btn-sm btn-edit" type="button" data-split-action="edit" data-id="' +
      entry.id +
      '"><i class="ph-bold ph-pencil-simple"></i> Edit</button>' +
      doneButton +
      syncButton +
      deleteButton +
      '</div>';
    tr.innerHTML =
      '<td data-label="Tanggal">' +
      calc.formatDate(entry.date) +
      '</td>' +
      '<td data-label="Bill"><div class="split-ledger-bill-name">' +
      calc.escapeHtml(entry.billName) +
      '</div><div class="split-ledger-bill-meta">Saya: ' +
      calc.escapeHtml(entry.ownerName || '-') +
      ' • Dibayar: ' +
      calc.escapeHtml(entry.payerName || '-') +
      '</div></td>' +
      '<td class="text-right" data-label="Total"><strong class="split-ledger-amount">' +
      calc.formatRupiah(entry.total) +
      '</strong></td>' +
      '<td class="text-right" data-label="Porsi Saya"><strong class="split-ledger-amount">' +
      calc.formatRupiah(entry.ownerShare || 0) +
      '</strong></td>' +
      '<td data-label="Status Saya"><span class="split-ledger-status ' +
      doneClass +
      '">' +
      calc.escapeHtml(doneText) +
      '</span></td>' +
      '<td data-label="Sync"><span class="split-ledger-sync ' +
      syncClass +
      '">' +
      calc.escapeHtml(syncText) +
      '</span></td>' +
      '<td class="text-center" data-label="Aksi">' +
      actionHtml +
      '</td>';
    fragment.appendChild(tr);
  });
  dom.splitLedgerTbody.appendChild(fragment);
  renderToolsOverview();
}

// ─── Split Results ────────────────────────
export function renderSplitResults(results) {
  state.splitResults = results; // Also sync state
  dom.splitFormView.style.display = 'none';
  dom.splitResultsView.style.display = 'block';
  dom.splitResultSummary.innerHTML =
    '<div class="result-bill-name">' +
    calc.escapeHtml(results.billName) +
    '</div>' +
    '<div class="result-total">' +
    calc.formatRupiah(results.total) +
    '</div>' +
    '<div class="result-people-count">' +
    results.people.length +
    ' peserta • ' +
    (results.mode === 'equal'
      ? '<i class="ph-bold ph-scales"></i> Bagi Rata'
      : '<i class="ph-bold ph-pencil-simple"></i> Custom') +
    '</div>' +
    '<div class="result-payer">Dibayar oleh: ' +
    calc.escapeHtml(results.payerName) +
    '</div>' +
    '<div class="result-owner-status">Status Saya (' +
    calc.escapeHtml(results.ownerName) +
    '): ' +
    calc.escapeHtml(results.ownerStatusText) +
    '</div>';
  dom.splitResultList.innerHTML = '';
  results.people.forEach(function (p, i) {
    let color = AVATAR_COLORS[i % AVATAR_COLORS.length];
    let initials = p.name
      .split(' ')
      .map(function (w) {
        return w[0];
      })
      .slice(0, 2)
      .join('')
      .toUpperCase();
    let settlementText = 'Lunas';
    let settlementClass = 'even';
    if (p.net > 0) {
      settlementText = 'Harus terima ' + calc.formatRupiah(p.net);
      settlementClass = 'receive';
    } else if (p.net < 0) {
      settlementText = 'Harus bayar ' + calc.formatRupiah(Math.abs(p.net));
      settlementClass = 'pay';
    }
    let item = document.createElement('div');
    item.className = 'split-result-item';
    item.style.animationDelay = i * 0.06 + 's';
    item.innerHTML =
      '<div class="person-info"><div class="person-avatar" style="background:' +
      color +
      '">' +
      initials +
      '</div><div class="person-text"><span class="person-name">' +
      calc.escapeHtml(p.name) +
      (p.id === results.payerId ? ' (Pembayar)' : '') +
      (p.id === results.ownerId ? ' (Saya)' : '') +
      '</span><span class="person-detail">Bayar: ' +
      calc.formatRupiah(p.paid) +
      '</span></div></div>' +
      '<div class="person-result"><span class="person-share">Porsi: ' +
      calc.formatRupiah(p.share) +
      '</span><span class="person-settlement ' +
      settlementClass +
      '">' +
      settlementText +
      '</span></div>';
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
  if (state.splitMode === 'equal') {
    dom.modeEqual.classList.add('active');
    dom.modeCustom.classList.remove('active');
  } else {
    dom.modeCustom.classList.add('active');
    dom.modeEqual.classList.remove('active');
  }
  updateCustomAmountVisibility();
}

export function updateCustomAmountVisibility() {
  let fields = dom.splitPersonList.querySelectorAll('.custom-amount');
  fields.forEach(function (f) {
    if (state.splitMode === 'custom') f.classList.add('visible');
    else f.classList.remove('visible');
  });
}

export function addPersonRow(name) {
  let personId = 'p-' + ++state.splitPersonIdCounter;
  let row = document.createElement('div');
  row.className = 'split-person-row';
  row.dataset.personId = personId;
  row.innerHTML =
    '<input type="text" class="person-name-input" placeholder="Nama peserta" value="' +
    calc.escapeHtml(name || '') +
    '" />' +
    '<input type="text" class="custom-amount' +
    (state.splitMode === 'custom' ? ' visible' : '') +
    '" placeholder="Nominal" inputmode="numeric" />' +
    '<button class="btn-remove-person" title="Hapus" type="button">×</button>';
  row.querySelector('.btn-remove-person').addEventListener('click', function () {
    if (dom.splitPersonList.children.length > 2) {
      row.remove();
      syncSplitPayerOptions();
    } else {
      showToast('Minimal 2 peserta', 'error');
    }
  });
  dom.splitPersonList.appendChild(row);
  syncSplitPayerOptions();
  return row;
}

export function getSplitParticipantLabel(row, index) {
  let nameInput = row.querySelector('.person-name-input');
  let name = nameInput ? nameInput.value.trim() : '';
  return name || 'Peserta ' + (index + 1);
}

export function syncSplitPayerOptions() {
  if (!dom.splitPayer) return;
  let rows = dom.splitPersonList.querySelectorAll('.split-person-row');
  let prevPayerId = dom.splitPayer.value;
  let hasPrev = false;
  let firstId = '';
  dom.splitPayer.innerHTML = '';
  rows.forEach(function (row, i) {
    let personId = row.dataset.personId || 'p-auto-' + i;
    row.dataset.personId = personId;
    let opt = document.createElement('option');
    opt.value = personId;
    opt.textContent = getSplitParticipantLabel(row, i);
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
    let btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'icon-btn';
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
  if (!dom.chartCanvas.dataset.hoverBound) {
    dom.chartCanvas.addEventListener('mousemove', handleChartHoverQueued);
    dom.chartCanvas.addEventListener('mouseleave', hideChartTooltip);
    dom.chartCanvas.addEventListener('pointerleave', hideChartTooltip);
    dom.chartCanvas.dataset.hoverBound = '1';
  }
  const displaySize = state.isPerfLite ? 260 : 320;
  dom.chartCanvas.style.width = displaySize + 'px';
  dom.chartCanvas.style.height = displaySize + 'px';
  if (hasChartJs()) {
    dom.chartCanvas.width = displaySize;
    dom.chartCanvas.height = displaySize;
    if (state.categoryChartInstance) state.categoryChartInstance.resize();
    return;
  }
  let dpr = window.devicePixelRatio || 1;
  dom.chartCanvas.width = displaySize * dpr;
  dom.chartCanvas.height = displaySize * dpr;
  let ctx = dom.chartCanvas.getContext('2d');
  ctx.scale(dpr, dpr);
}

// ─── Performance Detection ────────────────
export function detectPerfLite(prefersReduced) {
  if (prefersReduced) return true;
  let memory = navigator.deviceMemory || 0;
  let cores = navigator.hardwareConcurrency || 0;
  let conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  let saveData = conn && conn.saveData;
  let effectiveType = conn && conn.effectiveType ? String(conn.effectiveType) : '';
  let slowNetwork = effectiveType.indexOf('2g') !== -1;
  let coarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
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
  let sections = document.querySelectorAll('.container > section');
  if (!sections || sections.length === 0) return;
  if (prefersReduced || !('IntersectionObserver' in window)) return;
  let viewport = window.innerHeight || document.documentElement.clientHeight;
  sections.forEach(function (section) {
    let rect = section.getBoundingClientRect();
    if (rect.top <= viewport * 0.9) return;
    section.classList.add('reveal-ready');
  });
  let observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.18, rootMargin: '0px 0px -8% 0px' }
  );
  sections.forEach(function (section) {
    if (section.classList.contains('reveal-ready')) observer.observe(section);
  });
}

export function setupCardGlow(prefersReduced) {
  if (prefersReduced) return;
  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return;
  let cards = document.querySelectorAll('.card');
  cards.forEach(function (card) {
    let frame = null;
    let nextX = 50;
    let nextY = 50;
    card.addEventListener('pointermove', function (e) {
      let rect = card.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      nextX = ((e.clientX - rect.left) / rect.width) * 100;
      nextY = ((e.clientY - rect.top) / rect.height) * 100;
      if (!frame) {
        frame = requestAnimationFrame(function () {
          frame = null;
          card.style.setProperty('--mx', nextX.toFixed(2) + '%');
          card.style.setProperty('--my', nextY.toFixed(2) + '%');
        });
      }
      card.classList.add('card-glow');
    });
    card.addEventListener('pointerleave', function () {
      if (frame) {
        cancelAnimationFrame(frame);
        frame = null;
      }
      card.classList.remove('card-glow');
      card.style.setProperty('--mx', '50%');
      card.style.setProperty('--my', '50%');
    });
  });
}

export function setupHeroTilt(prefersReduced) {
  if (prefersReduced) return;
  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return;
  let hero = document.querySelector('.hero-card');
  if (!hero) return;
  let frame = null;
  let next = { x: 0, y: 0, mx: 50, my: 50 };
  hero.addEventListener('pointermove', function (e) {
    let rect = hero.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    let px = (e.clientX - rect.left) / rect.width;
    let py = (e.clientY - rect.top) / rect.height;
    next.x = (0.5 - py) * 8;
    next.y = (px - 0.5) * 12;
    next.mx = px * 100;
    next.my = py * 100;
    if (!frame) {
      frame = requestAnimationFrame(function () {
        frame = null;
        hero.style.setProperty('--hero-tilt-x', next.x.toFixed(2) + 'deg');
        hero.style.setProperty('--hero-tilt-y', next.y.toFixed(2) + 'deg');
        hero.style.setProperty('--hero-mx', next.mx.toFixed(2) + '%');
        hero.style.setProperty('--hero-my', next.my.toFixed(2) + '%');
      });
    }
  });
  hero.addEventListener('pointerleave', function () {
    if (frame) {
      cancelAnimationFrame(frame);
      frame = null;
    }
    hero.style.setProperty('--hero-tilt-x', '0deg');
    hero.style.setProperty('--hero-tilt-y', '0deg');
    hero.style.setProperty('--hero-mx', '50%');
    hero.style.setProperty('--hero-my', '50%');
  });
}

export function initVisualEffects() {
  let prefersReduced =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
    let d = new Date();
    let dd = String(d.getDate()).padStart(2, '0');
    let mm = String(d.getMonth() + 1).padStart(2, '0');
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
  if (dom.inputWallet && dom.inputWallet.options.length > 0) {
    dom.inputWallet.value = dom.inputWallet.options[0].value;
  }
  if (dom.inputWalletTo && dom.inputWalletTo.options.length > 0) {
    dom.inputWalletTo.value = dom.inputWalletTo.options[0].value;
  }
  dom.inputRecurring.checked = false;
  dom.btnSubmit.disabled = false;
  dom.btnSubmit.classList.remove('is-loading');
  dom.btnSubmit.innerHTML = '<i class="ph-bold ph-plus-circle btn-icon"></i> Simpan Transaksi';
  dom.btnCancel.style.display = 'none';
  syncAmountDisplay('');
  syncConditionalFields();
  [
    dom.inputDate,
    dom.inputTitle,
    dom.inputCategory,
    dom.inputAmount,
    dom.inputWallet,
    dom.inputWalletTo,
  ].forEach(function (f) {
    if (f) f.classList.remove('invalid');
  });
}

// ─── Render Table (main orchestrator for table) ──
export function renderTableNow(renderTableCallback) {
  let filters = {
    search: dom.filterSearch ? dom.filterSearch.value : '',
    category: dom.filterCategory.value,
    month: dom.filterMonth.value,
    sort: dom.filterSort.value || 'date-desc',
  };
  let data = calc.getFilteredData(state.expenses, filters);
  dom.tbody.innerHTML = '';
  updateHero();
  updateTitleSuggestions();
  renderMonthlyReport();
  renderCategoryBudgetSummary();
  renderCalendar();
  updateHistoryEmptyState(state.expenses.length > 0 && data.length === 0);
  if (data.length === 0) {
    dom.emptyState.classList.add('visible');
    updateSummary(data);
    renderChart(data);
    return;
  }
  dom.emptyState.classList.remove('visible');
  let fragment = document.createDocumentFragment();
  data.forEach(function (item, index) {
    let tr = document.createElement('tr');
    if (!state.isPerfLite) {
      tr.classList.add('row-animate');
      tr.style.animationDelay = index * 0.04 + 's';
    }
    tr.dataset.id = item.id;
    let isIncome = item.type === 'income';
    let isTransfer = item.type === 'transfer';
    let typeLabel = isIncome ? 'Pemasukan' : isTransfer ? 'Transfer' : 'Pengeluaran';
    let typeIcon = isIncome
      ? 'ph-arrow-down-left'
      : isTransfer
        ? 'ph-arrows-left-right'
        : 'ph-arrow-up-right';
    let typeClass = isIncome
      ? 'tx-type-income'
      : isTransfer
        ? 'tx-type-transfer'
        : 'tx-type-expense';
    let walletText = isTransfer
      ? calc.escapeHtml(item.wallet || 'Tunai') +
        ' <i class="ph-bold ph-arrow-right"></i> ' +
        calc.escapeHtml(item.walletTo || 'Tunai')
      : calc.escapeHtml(item.wallet || 'Tunai');
    let categoryContent = isTransfer
      ? '<i class="ph-bold ph-arrows-left-right"></i> Transfer Dompet'
      : (CATEGORY_ICONS[item.category] || '<i class="ph-bold ph-tag"></i>') +
        ' ' +
        calc.escapeHtml(item.category);
    let amountPrefix = isIncome ? '+' : isTransfer ? '' : '-';
    let amountClass = isIncome
      ? 'tx-amount-income'
      : isTransfer
        ? 'tx-amount-transfer'
        : 'tx-amount-expense';
    tr.innerHTML =
      '<td data-label="Tanggal"><div class="tx-date">' +
      calc.formatDate(item.date) +
      '</div></td>' +
      '<td data-label="Tipe & Nama"><div class="tx-title">' +
      calc.escapeHtml(item.title) +
      '</div><div class="tx-type ' +
      typeClass +
      '"><i class="ph-bold ' +
      typeIcon +
      '"></i> ' +
      typeLabel +
      '</div></td>' +
      '<td data-label="Kategori & Dompet"><span class="tx-category-chip">' +
      categoryContent +
      '</span><div class="tx-wallet"><i class="ph-bold ph-wallet"></i> ' +
      walletText +
      '</div></td>' +
      '<td class="text-right" data-label="Nominal"><span class="tx-amount ' +
      amountClass +
      '">' +
      amountPrefix +
      calc.formatRupiah(item.amount) +
      '</span></td>' +
      '<td class="text-center" data-label="Aksi"><div class="action-group history-action-group">' +
      '<button class="btn btn-sm btn-pin" data-action="pin" data-id="' +
      item.id +
      '" title="Pin ke Quick Add" aria-label="Pin ke Quick Add"><i class="ph-bold ph-push-pin"></i><span class="btn-pin-label">Pin</span></button>' +
      '<button class="btn btn-sm btn-edit" data-action="edit" data-id="' +
      item.id +
      '" title="Edit"><i class="ph-bold ph-pencil-simple"></i> Edit</button>' +
      '<button class="btn btn-sm btn-delete" data-action="delete" data-id="' +
      item.id +
      '" title="Hapus"><i class="ph-bold ph-trash"></i> Hapus</button>' +
      '</div></td>';
    fragment.appendChild(tr);
  });
  dom.tbody.appendChild(fragment);
  updateSummary(data);
  renderChart(data);
  
  // Definitive skeleton release
  if (dom.summaryCard) dom.summaryCard.classList.remove('is-loading');
  if (dom.chartCard) dom.chartCard.classList.remove('is-loading');
  if (dom.historyTableCard) dom.historyTableCard.classList.remove('is-loading');
  
  if (renderTableCallback) renderTableCallback();
}

export function renderTable(renderTableCallback) {
  if (state.renderTimer) clearTimeout(state.renderTimer);
  beginCoreLoading();
  setRenderState('Memuat transaksi...', 'loading');
  state.renderTimer = setTimeout(function () {
    state.renderTimer = null;
    try {
      renderTableNow(renderTableCallback);
    } finally {
      finishCoreLoading();
    }
  }, 0);
}

// ─── Format Input Currency ────────────────
export function formatInputCurrency(e) {
  let value = e.target.value.replace(/\D/g, '');
  if (value !== '') {
    e.target.value = Number(value).toLocaleString('en-US');
  } else {
    e.target.value = '';
  }
  if (dom.inputAmount && e.target === dom.inputAmount) {
    syncAmountDisplay(e.target.value);
  }
}

export function syncAmountDisplay(value) {
  if (!dom.amountValue) return;
  let raw = String(value == null ? (dom.inputAmount ? dom.inputAmount.value : '') : value).replace(
    /\D/g,
    ''
  );
  dom.amountValue.textContent = raw ? Number(raw).toLocaleString('en-US') : '0';
}

// ─── View Management (from secondary IIFE) ──
function getViewIndex(view) {
  return Object.prototype.hasOwnProperty.call(VIEW_INDEX, view) ? VIEW_INDEX[view] : -1;
}

function getViewStaggerMs() {
  let raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--view-motion-stagger')
    .trim();
  if (!raw) return 34;
  let parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return 34;
  if (raw.endsWith('s') && !raw.endsWith('ms')) return parsed * 1000;
  return parsed;
}

function getViewMotionDurationMs() {
  let raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--view-motion-duration')
    .trim();
  if (!raw) return 360;
  let parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return 360;
  if (raw.endsWith('s') && !raw.endsWith('ms')) return parsed * 1000;
  return parsed;
}

function resolveCurrentView(sections) {
  if (activeViewKey && VALID_VIEWS.indexOf(activeViewKey) !== -1) return activeViewKey;
  let activeSection = sections.find(function (section) {
    return section.classList.contains('is-active');
  });
  if (activeSection) {
    let activeValue = activeSection.getAttribute('data-view');
    if (VALID_VIEWS.indexOf(activeValue) !== -1) return activeValue;
  }
  let storedView = storage.getActiveView();
  return VALID_VIEWS.indexOf(storedView) !== -1 ? storedView : 'dashboard';
}

function clearViewTransitionState(sections) {
  sections.forEach(function (section) {
    section.classList.remove('is-view-entering', 'is-enter-forward', 'is-enter-backward');
    section.style.removeProperty('--view-stagger');
  });
}

export function setActiveView(view, shouldFocus) {
  if (VALID_VIEWS.indexOf(view) === -1) view = 'dashboard';
  const sections = Array.from(document.querySelectorAll('.container > section[data-view]'));
  const navButtons = Array.from(document.querySelectorAll('[data-nav-view]'));
  const container = document.querySelector('.container');
  const currentView = resolveCurrentView(sections);
  const hasActiveSection = sections.some(function (section) {
    return section.classList.contains('is-active');
  });
  const isInitialMount = !hasActiveSection && !activeViewKey;
  const isSameView = currentView === view;
  const prefersReducedMotion =
    state.isPerfLite ||
    (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const shouldAnimate = !isInitialMount && !isSameView && !prefersReducedMotion;
  const direction = getViewIndex(view) >= getViewIndex(currentView) ? 'forward' : 'backward';
  const staggerStep = getViewStaggerMs();
  const motionDuration = getViewMotionDurationMs();

  if (viewTransitionTimer) {
    clearTimeout(viewTransitionTimer);
    viewTransitionTimer = null;
  }
  if (container) {
    container.classList.remove('view-forward', 'view-backward');
  }
  clearViewTransitionState(sections);

  let staggerIndex = 0;
  let enteringCount = 0;
  sections.forEach((section) => {
    const active = section.getAttribute('data-view') === view;
    section.classList.toggle('is-active', active);
    section.setAttribute('aria-hidden', active ? 'false' : 'true');
    if (!active || !shouldAnimate) return;
    section.classList.add(
      'is-view-entering',
      direction === 'forward' ? 'is-enter-forward' : 'is-enter-backward'
    );
    section.style.setProperty('--view-stagger', Math.min(staggerIndex, 5) * staggerStep + 'ms');
    staggerIndex += 1;
    enteringCount += 1;
  });

  if (shouldAnimate) {
    if (container)
      container.classList.add(direction === 'forward' ? 'view-forward' : 'view-backward');
    const maxStagger = Math.min(Math.max(enteringCount - 1, 0), 5) * staggerStep;
    const cleanupDelay = motionDuration + maxStagger + 48;
    viewTransitionTimer = setTimeout(function () {
      clearViewTransitionState(sections);
      if (container) container.classList.remove('view-forward', 'view-backward');
      viewTransitionTimer = null;
    }, cleanupDelay);
  }

  navButtons.forEach((btn) => {
    const activeBtn = btn.getAttribute('data-nav-view') === view;
    btn.classList.toggle('is-active', activeBtn);
    btn.setAttribute('aria-selected', activeBtn ? 'true' : 'false');
  });

  activeViewKey = view;
  storage.saveActiveView(view);
  if (shouldFocus && view === 'add' && dom.inputTitle) {
    setTimeout(
      function () {
        dom.inputTitle.focus();
      },
      shouldAnimate ? 180 : 120
    );
  }
}

// ─── Currency Animation ──────────────────
function parseCurrency(value) {
  let numeric = String(value || '').replace(/[^0-9-]/g, '');
  return Number(numeric || 0);
}

export function animateCurrency(el, targetValue, options) {
  if (!el) return;
  options = options || {};
  let duration = options.duration || 420;
  let formatter = options.formatter || calc.formatRupiah;
  let currentRaw = Number(el.getAttribute('data-anim-value'));
  if (!Number.isFinite(currentRaw)) currentRaw = parseCurrency(el.textContent);
  if (currentRaw === targetValue) {
    el.textContent = formatter(targetValue);
    el.setAttribute('data-anim-value', String(targetValue));
    return;
  }
  let start = currentRaw;
  let startTime = null;
  function tick(ts) {
    if (!startTime) startTime = ts;
    let progress = Math.min((ts - startTime) / duration, 1);
    let eased = 1 - Math.pow(1 - progress, 3);
    let now = Math.round(start + (targetValue - start) * eased);
    el.textContent = formatter(now);
    el.setAttribute('data-anim-value', String(now));
    if (progress < 1) requestAnimationFrame(tick);
    else {
      el.textContent = formatter(targetValue);
      el.setAttribute('data-anim-value', String(targetValue));
    }
  }
  requestAnimationFrame(tick);
}

export function syncDashboardMonthlyStats() {
  let reportIncomeEl = document.getElementById('report-income');
  let reportExpenseEl = document.getElementById('report-expense');
  let dashboardIncomeEl = document.getElementById('dashboard-income');
  let dashboardExpenseEl = document.getElementById('dashboard-expense');
  let dashboardNetEl = document.getElementById('dashboard-net');
  if (
    !reportIncomeEl ||
    !reportExpenseEl ||
    !dashboardIncomeEl ||
    !dashboardExpenseEl ||
    !dashboardNetEl
  )
    return;
  let income = parseCurrency(reportIncomeEl.textContent);
  let expense = parseCurrency(reportExpenseEl.textContent);
  let net = income - expense;
  animateCurrency(dashboardIncomeEl, income);
  animateCurrency(dashboardExpenseEl, expense);
  animateCurrency(dashboardNetEl, net);
  dashboardNetEl.classList.remove('summary-value-income', 'summary-value-expense');
  dashboardNetEl.classList.add(net >= 0 ? 'summary-value-income' : 'summary-value-expense');
}

export function renderRecentTransactions() {
  let recentList = document.getElementById('recent-list');
  let recentEmpty = document.getElementById('recent-empty');
  if (!recentList || !recentEmpty) return;
  let data = state.expenses
    .slice()
    .sort(function (a, b) {
      let dateCmp = String(b.date || '').localeCompare(String(a.date || ''));
      if (dateCmp !== 0) return dateCmp;
      return String(b.id || '').localeCompare(String(a.id || ''));
    })
    .slice(0, 5);
  recentList.innerHTML = '';
  if (!data.length) {
    recentEmpty.style.display = 'block';
    return;
  }
  recentEmpty.style.display = 'none';
  data.forEach(function (item) {
    let row = document.createElement('div');
    row.className = 'recent-row';
    let isIncome = item.type === 'income';
    let isTransfer = item.type === 'transfer';
    let amountPrefix = isIncome ? '+' : isTransfer ? '↔ ' : '-';
    let amountClass = isIncome ? 'text-success' : isTransfer ? 'text-accent' : 'text-danger';
    let formatDateShort = function (dateStr) {
      if (!dateStr) return '-';
      let d = new Date(dateStr + 'T00:00:00');
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    };
    row.innerHTML =
      '<div class="recent-row-main"><div class="recent-row-title">' +
      calc.escapeHtml(String(item.title || '-')) +
      '</div><div class="recent-row-meta">' +
      formatDateShort(item.date) +
      ' • ' +
      calc.escapeHtml(String(item.category || '-')) +
      '</div></div>' +
      '<div class="recent-row-amount ' +
      amountClass +
      '">' +
      amountPrefix +
      calc.formatRupiah(item.amount || 0) +
      '</div>';
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
  let options = Array.prototype.slice.call(group.querySelectorAll('option'));
  let first = options.find(function (opt) {
    return !opt.disabled;
  });
  return first ? first.value : '';
}

export function syncConditionalFields() {
  let selected = document.querySelector('input[name="input-type"]:checked');
  let type = selected ? selected.value : 'expense';
  let isTransfer = type === 'transfer';
  if (dom.groupWalletTo) dom.groupWalletTo.style.display = '';
  if (dom.groupCategory) dom.groupCategory.style.display = '';
  if (dom.groupWalletTo)
    dom.groupWalletTo.setAttribute('data-collapsed', isTransfer ? 'false' : 'true');
  if (dom.groupCategory)
    dom.groupCategory.setAttribute('data-collapsed', isTransfer ? 'true' : 'false');
  if (dom.labelWallet) dom.labelWallet.textContent = isTransfer ? 'Dari Dompet' : 'Sumber Dana';
  let optgroupExpense = document.getElementById('optgroup-expense');
  let optgroupIncome = document.getElementById('optgroup-income');
  if (!optgroupExpense || !optgroupIncome || !dom.inputCategory) return;
  let expenseOptions = Array.prototype.slice.call(optgroupExpense.querySelectorAll('option'));
  let incomeOptions = Array.prototype.slice.call(optgroupIncome.querySelectorAll('option'));
  if (type === 'expense') {
    expenseOptions.forEach(function (opt) {
      opt.disabled = false;
    });
    incomeOptions.forEach(function (opt) {
      opt.disabled = true;
    });
  } else if (type === 'income') {
    expenseOptions.forEach(function (opt) {
      opt.disabled = true;
    });
    incomeOptions.forEach(function (opt) {
      opt.disabled = false;
    });
  } else {
    expenseOptions.forEach(function (opt) {
      opt.disabled = false;
    });
    incomeOptions.forEach(function (opt) {
      opt.disabled = false;
    });
  }
  if (!isTransfer) {
    let selectedOption = dom.inputCategory.options[dom.inputCategory.selectedIndex];
    if (!selectedOption || selectedOption.disabled) {
      dom.inputCategory.value =
        type === 'income' ? firstEnabledValue(optgroupIncome) : firstEnabledValue(optgroupExpense);
    }
  } else if (
    dom.inputWallet &&
    dom.inputWalletTo &&
    dom.inputWallet.value === dom.inputWalletTo.value &&
    dom.inputWalletTo.options.length > 1
  ) {
    let nextWallet = Array.prototype.slice.call(dom.inputWalletTo.options).find(function (opt) {
      return opt.value !== dom.inputWallet.value;
    });
    if (nextWallet) dom.inputWalletTo.value = nextWallet.value;
  }
}

// ─── Shared Ledgers UI ───────────────────

export function renderSharedLedgerList(ledgers, onSelect, onCreate) {
  const container = document.getElementById('shared-ledger-list');
  if (!container) return;

  if (ledgers.length === 0) {
    container.innerHTML = `
      <div class="ledger-empty">
        <div class="ledger-empty-icon">👥</div>
        <h3 class="ledger-empty-title">Belum ada grup patungan</h3>
        <p class="ledger-empty-text">Buat grup untuk mencatat patungan dengan teman</p>
        <button class="btn btn-primary" id="btn-create-ledger">Buat Grup Baru</button>
      </div>
    `;
    const createBtn = document.getElementById('btn-create-ledger');
    if (createBtn && onCreate) {
      createBtn.addEventListener('click', onCreate);
    }
    return;
  }

  container.innerHTML = ledgers
    .map(
      (ledger) => `
    <div class="ledger-card ${ledger.isArchived ? 'archived' : ''}" data-ledger-id="${ledger.id}">
      <div class="ledger-card-header">
        <h3 class="ledger-card-title">${calc.escapeHtml(ledger.name)}</h3>
        ${getLedgerStatusBadge(ledger)}
      </div>
      ${ledger.description ? `<p class="ledger-card-description">${calc.escapeHtml(ledger.description)}</p>` : ''}
      <div class="ledger-card-meta">
        <div class="ledger-member-avatars">
          ${ledger.members
            .map(
              (m) => `
            <div class="ledger-member-avatar" style="background: ${m.color}" title="${calc.escapeHtml(m.name)}">
              ${m.name.charAt(0).toUpperCase()}
            </div>
          `
            )
            .join('')}
        </div>
        <span>${ledger.bills.length} tagihan</span>
        <span>•</span>
        <span>${formatRelativeDate(ledger.updatedAt)}</span>
      </div>
    </div>
  `
    )
    .join('');

  // Add click handlers
  container.querySelectorAll('.ledger-card').forEach((card) => {
    card.addEventListener('click', () => {
      const ledgerId = card.dataset.ledgerId;
      const ledger = ledgers.find((l) => l.id === ledgerId);
      if (ledger && onSelect) onSelect(ledger);
    });
  });
}

function getLedgerStatusBadge(ledger) {
  const settlement = sharedLedgers.calculateSettlement(ledger);
  if (settlement.isSettled) {
    return '<span class="ledger-status-badge ledger-status-settled">✓ Lunas</span>';
  }
  return '<span class="ledger-status-badge ledger-status-pending">⏳ Ada utang</span>';
}

function formatRelativeDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hari ini';
  if (diffDays === 1) return 'Kemarin';
  if (diffDays < 7) return `${diffDays} hari lalu`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

export function renderSharedLedgerDetail(ledger, onBack, onAddBill, onShare) {
  const container = document.getElementById('shared-ledger-detail');
  if (!container) return;

  const settlement = sharedLedgers.calculateSettlement(ledger);

  container.innerHTML = `
    <div class="ledger-detail">
      <div class="ledger-detail-header">
        <div>
          <h1 class="ledger-detail-title">${calc.escapeHtml(ledger.name)}</h1>
          ${ledger.description ? `<p class="ledger-detail-description">${calc.escapeHtml(ledger.description)}</p>` : ''}
        </div>
        <div class="ledger-detail-actions">
          <button class="btn btn-ghost" id="btn-ledger-back">← Kembali</button>
          <button class="btn btn-primary" id="btn-add-ledger-bill">+ Tambah Tagihan</button>
        </div>
      </div>

      ${renderSettlementCard(settlement)}

      <div class="member-balances">
        ${Object.values(settlement.memberBalances)
          .map(
            (m) => `
          <div class="member-balance-card">
            <div class="member-balance-avatar" style="background: ${m.color}">
              ${m.name.charAt(0).toUpperCase()}
            </div>
            <div class="member-balance-info">
              <div class="member-balance-name">${calc.escapeHtml(m.name)}</div>
              <div class="member-balance-amount ${getBalanceClass(m.net)}">
                ${m.net > 0 ? '+' : m.net < 0 ? '-' : ''} Rp ${Math.abs(m.net).toLocaleString('id-ID')}
              </div>
            </div>
          </div>
        `
          )
          .join('')}
      </div>

      <div class="ledger-bills">
        <h3>Daftar Tagihan (${ledger.bills.length})</h3>
        ${ledger.bills
          .map(
            (bill) => `
          <div class="ledger-bill-item">
            <div class="ledger-bill-info">
              <div class="ledger-bill-name">${calc.escapeHtml(bill.billName)}</div>
              <div class="ledger-bill-meta">${calc.formatDate(bill.date)} • ${bill.people.length} orang</div>
            </div>
            <div class="ledger-bill-amount">Rp ${(bill.total || 0).toLocaleString('id-ID')}</div>
          </div>
        `
          )
          .join('')}
      </div>

      <div style="margin-top: var(--space-6); text-align: center;">
        <button class="ledger-share-btn" id="btn-share-ledger">
          <i class="ph-bold ph-share-network"></i> Bagikan Ringkasan
        </button>
      </div>
    </div>
  `;

  // Add event handlers
  const backBtn = document.getElementById('btn-ledger-back');
  if (backBtn && onBack) backBtn.addEventListener('click', onBack);

  const addBtn = document.getElementById('btn-add-ledger-bill');
  if (addBtn && onAddBill) addBtn.addEventListener('click', onAddBill);

  const shareBtn = document.getElementById('btn-share-ledger');
  if (shareBtn && onShare) shareBtn.addEventListener('click', () => onShare(ledger));
}

function renderSettlementCard(settlement) {
  if (settlement.isSettled) {
    return `
      <div class="settlement-card settlement-status">
        <div class="settlement-status-icon">🎉</div>
        <h3 class="settlement-status-title">Semua sudah lunas!</h3>
        <p class="settlement-status-subtitle">Tidak ada utang piutang</p>
      </div>
    `;
  }

  return `
    <div class="settlement-card">
      <h3 style="margin-bottom: var(--space-4);">💰 Yang harus dibayar:</h3>
      <div class="settlement-transactions">
        ${settlement.transactions
          .map(
            (t) => `
          <div class="settlement-transaction">
            <div class="settlement-transaction-parties">
              <div class="settlement-transaction-from">
                <span>${calc.escapeHtml(t.fromName)}</span>
              </div>
              <span class="settlement-transaction-arrow">→</span>
              <div class="settlement-transaction-to">
                <span>${calc.escapeHtml(t.toName)}</span>
              </div>
            </div>
            <div class="settlement-transaction-amount">
              Rp ${t.amount.toLocaleString('id-ID')}
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `;
}

function getBalanceClass(net) {
  if (net > 0) return 'member-balance-positive';
  if (net < 0) return 'member-balance-negative';
  return 'member-balance-neutral';
}

export async function copyLedgerSummaryToClipboard(ledger) {
  const summary = sharedLedgers.generateShareableSummary(ledger);
  try {
    await navigator.clipboard.writeText(summary);
    return true;
  } catch (err) {
    return false;
  }
}
