/* ===========================
   Expense Tracker — script.js
   Enhanced with: dark mode, chart, toasts,
   CSV export, month filter, enhanced summary
   =========================== */

(function () {
  'use strict';

  // ─── Constants ────────────────────────────
  var STORAGE_KEY = 'expense_tracker_data';
  var THEME_KEY = 'expense_tracker_theme';
  var FILTER_KEY = 'expense_tracker_filters';
  var BUDGET_KEY = 'expense_tracker_budget';
  var CATEGORY_BUDGET_KEY = 'expense_tracker_category_budget';
  var SPLIT_HISTORY_KEY = 'expense_tracker_split_history';
  var CUSTOM_CAT_KEY = 'expense_tracker_custom_cat';
  var RECURRING_KEY = 'expense_tracker_recurring';
  var GOALS_KEY = 'expense_tracker_goals';


  var CATEGORY_COLORS = {
    Makanan: '#f97316',
    Transport: '#0ea5e9',
    Belanja: '#16a34a',
    Hiburan: '#f43f5e',
    Kesehatan: '#14b8a6',
    Pendidikan: '#eab308',
    Tagihan: '#2563eb',
    'Lainnya (Keluar)': '#64748b',
    Gaji: '#0ea5e9',
    'Pemasukan Lain': '#10b981',
  };

  var CATEGORY_ICONS = {
    Makanan: '<i class="ph-fill ph-hamburger"></i>',
    Transport: '<i class="ph-fill ph-car-profile"></i>',
    Belanja: '<i class="ph-fill ph-shopping-cart"></i>',
    Hiburan: '<i class="ph-fill ph-popcorn"></i>',
    Kesehatan: '<i class="ph-fill ph-pill"></i>',
    Pendidikan: '<i class="ph-fill ph-book-open"></i>',
    Tagihan: '<i class="ph-fill ph-receipt"></i>',
    'Lainnya (Keluar)': '<i class="ph-fill ph-package"></i>',
    Gaji: '<i class="ph-fill ph-money"></i>',
    'Pemasukan Lain': '<i class="ph-fill ph-piggy-bank"></i>',
  };

  // ─── DOM References ───────────────────────
  var form = document.getElementById('expense-form');
  var inputDate = document.getElementById('input-date');
  var inputTitle = document.getElementById('input-title');
  var titleSuggestions = document.getElementById('title-suggestions');
  var inputCategory = document.getElementById('input-category');
  var inputAmount = document.getElementById('input-amount');
  var inputTypeRadios = document.getElementsByName('input-type');
  var inputWallet = document.getElementById('input-wallet');
  var inputWalletTo = document.getElementById('input-wallet-to');
  var groupWalletTo = document.getElementById('group-wallet-to');
  var groupCategory = document.getElementById('group-category');
  var labelWallet = document.getElementById('label-wallet');
  var btnSubmit = document.getElementById('btn-submit');
  var btnCancel = document.getElementById('btn-cancel');
  var tbody = document.getElementById('expense-tbody');
  var totalIncomeEl = document.getElementById('total-income');
  var totalExpenseEl = document.getElementById('total-expense');
  var totalCountEl = document.getElementById('total-count');
  var topCategoryEl = document.getElementById('top-category');
  
  var totalBalanceEl = document.getElementById('total-balance');
  var walletBalancesEl = document.getElementById('wallet-balances');
  var budgetTextUsed = document.getElementById('budget-text-used');
  var budgetTextLimit = document.getElementById('budget-text-limit');
  var budgetPct = document.getElementById('budget-pct');
  var budgetFill = document.getElementById('budget-fill');
  var budgetNote = document.getElementById('budget-note');
  var emptyState = document.getElementById('empty-state');
  var dateHelp = document.getElementById('date-help');
  var categoryHelp = document.getElementById('category-help');
  var amountHelp = document.getElementById('amount-help');
  var filterCategory = document.getElementById('filter-category');
  var filterSearch = document.getElementById('filter-search');
  var filterMonth = document.getElementById('filter-month');
  var filterSort = document.getElementById('filter-sort');
  var btnResetFilter = document.getElementById('btn-reset-filter');
  var btnExportCsv = document.getElementById('btn-export-csv');
  var btnExportJson = document.getElementById('btn-export-json');
  var btnImportJson = document.getElementById('btn-import-json');
  var inputImportJson = document.getElementById('input-import-json');
  var undoIndicator = document.getElementById('undo-indicator');
  var btnUndo = document.getElementById('btn-undo');
  var modalOverlay = document.getElementById('modal-overlay');
  var btnConfirmDelete = document.getElementById('btn-confirm-delete');
  var btnCancelDelete = document.getElementById('btn-cancel-delete');

  var btnAddCategory = document.getElementById('btn-add-category');
  var categoryOverlay = document.getElementById('category-overlay');
  var inputCustomCatName = document.getElementById('input-custom-cat-name');
  var inputCustomCatType = document.getElementById('input-custom-cat-type');
  var inputCustomCatIcon = document.getElementById('input-custom-cat-icon');
  var iconSelector = document.getElementById('icon-selector');
  var btnSaveCategory = document.getElementById('btn-save-category');
  var btnCancelCategory = document.getElementById('btn-cancel-category');
  var btnThemeToggle = document.getElementById('btn-theme-toggle');
  var themeIcon = document.getElementById('theme-icon');
  var chartCanvas = document.getElementById('category-chart');
  var chartLegend = document.getElementById('chart-legend');
  var chartEmpty = document.getElementById('chart-empty');
  var chartTooltip = document.getElementById('chart-tooltip');
  var toastContainer = document.getElementById('toast-container');
  var renderStateEl = document.getElementById('render-state');
  var importOverlay = document.getElementById('import-overlay');
  var btnConfirmImport = document.getElementById('btn-confirm-import');
  var btnCancelImport = document.getElementById('btn-cancel-import');
  var importSummaryOverlay = document.getElementById('import-summary-overlay');
  var importSummaryMode = document.getElementById('import-summary-mode');
  var importSummaryAdded = document.getElementById('import-summary-added');
  var importSummarySkipped = document.getElementById('import-summary-skipped');
  var btnCloseImportSummary = document.getElementById('btn-close-import-summary');

  var btnEditBudget = document.getElementById('btn-edit-budget');
  var budgetOverlay = document.getElementById('budget-overlay');
  var inputBudgetLimit = document.getElementById('input-budget-limit');
  var btnSaveBudget = document.getElementById('btn-save-budget');
  var btnCancelBudget = document.getElementById('btn-cancel-budget');
  var btnEditCategoryBudget = document.getElementById('btn-edit-category-budget');
  var categoryBudgetMeta = document.getElementById('category-budget-meta');
  var categoryBudgetList = document.getElementById('category-budget-list');
  var categoryBudgetEmpty = document.getElementById('category-budget-empty');
  var categoryBudgetOverlay = document.getElementById('category-budget-overlay');
  var categoryBudgetEditor = document.getElementById('category-budget-editor');
  var btnSaveCategoryBudget = document.getElementById('btn-save-category-budget');
  var btnCancelCategoryBudget = document.getElementById('btn-cancel-category-budget');
  var reportMonthLabel = document.getElementById('report-month-label');
  var reportIncomeEl = document.getElementById('report-income');
  var reportExpenseEl = document.getElementById('report-expense');
  var reportNetEl = document.getElementById('report-net');
  var reportCountEl = document.getElementById('report-count');
  var reportTopCategoryEl = document.getElementById('report-top-category');
  var reportLargestExpenseEl = document.getElementById('report-largest-expense');
  var reportTrendEl = document.getElementById('report-trend');
  var reportAdviceEl = document.getElementById('report-advice');

  var inputRecurring = document.getElementById('input-recurring');

  var goalListEl = document.getElementById('goal-list');
  var btnAddGoal = document.getElementById('btn-add-goal');
  var goalAddOverlay = document.getElementById('goal-add-overlay');
  var inputGoalName = document.getElementById('input-goal-name');
  var inputGoalTarget = document.getElementById('input-goal-target');
  var btnSaveGoal = document.getElementById('btn-save-goal');
  var btnCancelGoal = document.getElementById('btn-cancel-goal');

  var goalFundOverlay = document.getElementById('goal-fund-overlay');
  var inputGoalFundId = document.getElementById('input-goal-fund-id');
  var inputGoalFundSource = document.getElementById('input-goal-fund-source');
  var inputGoalFundAmount = document.getElementById('input-goal-fund-amount');
  var btnSaveGoalFund = document.getElementById('btn-save-goal-fund');
  var btnCancelGoalFund = document.getElementById('btn-cancel-goal-fund');
  var goalFundSubtitle = document.getElementById('goal-fund-subtitle');
  var goalSection = document.getElementById('goal-section');

  // ─── State ────────────────────────────────
  var expenses = [];
  var customCategories = [];
  var recurringExpenses = [];
  var goals = [];
  var editingId = null;
  var deleteTargetId = null;
  var lastDeleted = null;
  var undoTimer = null;
  var undoStack = [];
  var pendingImportData = null;
  var MAX_UNDO = 10;
  var chartSlices = [];
  var chartGeom = null;
  var renderTimer = null;
  var isPerfLite = false;
  var chartHoverRaf = null;
  var chartHoverEvent = null;
  var categoryBudgets = {};
  
  var AVAILABLE_ICONS = ['ph-star', 'ph-heart', 'ph-airplane-tilt', 'ph-bag', 'ph-game-controller', 'ph-cat', 'ph-dog', 'ph-car', 'ph-house', 'ph-monitor', 'ph-music-note', 'ph-camera', 'ph-coffee', 'ph-bicycle', 'ph-barbell', 'ph-books', 'ph-graduation-cap', 'ph-bandaids', 'ph-bed', 'ph-plug'];
  var AVAILABLE_COLORS = ['#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#22c55e', '#84cc16', '#eab308', '#f59e0b', '#f97316', '#ef4444'];

  // ─── UUID Generator ───────────────────────
  function generateId() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
  }

  // ─── Storage Functions ────────────────────
  function getFromStorage() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  }

  function saveRecurringToStorage() {
    localStorage.setItem(RECURRING_KEY, JSON.stringify(recurringExpenses));
  }

  function loadRecurringFromStorage() {
    try {
      var raw = localStorage.getItem(RECURRING_KEY);
      recurringExpenses = raw ? JSON.parse(raw) : [];
    } catch (e) {
      recurringExpenses = [];
    }
  }

  function saveCustomCategories() {
    localStorage.setItem(CUSTOM_CAT_KEY, JSON.stringify(customCategories));
  }

  function loadGoalsFromStorage() {
    try {
      var raw = localStorage.getItem(GOALS_KEY);
      goals = raw ? JSON.parse(raw) : [];
    } catch (e) {
      goals = [];
    }
  }

  function saveGoalsToStorage() {
    localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
  }

  // ─── Theme (Dark Mode) ───────────────────
  function getTheme() {
    return localStorage.getItem(THEME_KEY) || 'light';
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    themeIcon.innerHTML = theme === 'dark' ? '<i class="ph-fill ph-sun"></i>' : '<i class="ph-fill ph-moon"></i>';
    
    // Refresh chart to apply theme-specific colors (e.g., center text)
    if (typeof renderTable === 'function') {
      renderTable();
    }
  }

  function toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme') || 'light';
    setTheme(current === 'dark' ? 'light' : 'dark');
  }

  // ─── Toast Notifications ─────────────────
  function showToast(message, type) {
    type = type || 'success';
    var icons = { success: '<i class="ph-fill ph-check-circle" style="color: var(--clr-success);"></i>', error: '<i class="ph-fill ph-warning-circle" style="color: var(--clr-danger);"></i>', info: '<i class="ph-fill ph-info" style="color: var(--clr-accent);"></i>' };
    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.innerHTML =
      '<span class="toast-icon">' + (icons[type] || '<i class="ph-fill ph-check-circle"></i>') + '</span>' +
      '<span>' + escapeHtml(message) + '</span>';
    toastContainer.appendChild(toast);

    setTimeout(function () {
      toast.classList.add('toast-out');
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 2500);
  }

  function showUndoToast(message, onUndo) {
    var toast = document.createElement('div');
    toast.className = 'toast toast-info';
    toast.innerHTML =
      '<span class="toast-icon"><i class="ph-bold ph-arrow-u-up-left" style="color: var(--clr-accent);"></i></span>' +
      '<span>' + escapeHtml(message) + '</span>' +
      '<button class="toast-action" type="button">Undo</button>';

    var btn = toast.querySelector('.toast-action');
    btn.addEventListener('click', function () {
      if (onUndo) onUndo();
      toast.classList.add('toast-out');
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 200);
    });

    toastContainer.appendChild(toast);

    setTimeout(function () {
      toast.classList.add('toast-out');
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 5000);
  }

  function showUndoStackToast() {
    if (!undoStack.length) return;
    showUndoToast('Perubahan dibatalkan', function () {
      var prev = undoStack.pop();
      if (!prev) return;
      expenses = prev;
      saveToStorage();
      renderTable();
      updateUndoIndicator();
      showToast('Undo berhasil', 'success');
    });
  }

  function pushUndo(state) {
    undoStack.push(state.slice());
    if (undoStack.length > MAX_UNDO) {
      undoStack.shift();
    }
    updateUndoIndicator();
  }

  function updateUndoIndicator() {
    undoIndicator.textContent = 'Undo: ' + undoStack.length;
    btnUndo.disabled = undoStack.length === 0;
  }

  function undoLast() {
    if (!undoStack.length) {
      showToast('Tidak ada undo tersedia', 'info');
      return;
    }
    var prev = undoStack.pop();
    if (!prev) return;
    expenses = prev;
    saveToStorage();
    renderTable();
    updateUndoIndicator();
    showToast('Undo berhasil', 'success');
  }

  // ─── Format Helpers ───────────────────────
  function formatRupiah(num) {
    return 'Rp ' + Number(num).toLocaleString('id-ID');
  }

  function formatDate(dateStr) {
    var d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  function getCurrentMonthKey() {
    var now = new Date();
    return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  }

  function getMonthLabel(monthKey) {
    if (!monthKey || monthKey.length !== 7) return 'Bulan Ini';
    var monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    var parts = monthKey.split('-');
    var year = Number(parts[0]);
    var monthIndex = Number(parts[1]) - 1;
    if (monthIndex < 0 || monthIndex > 11 || !year) return 'Bulan Ini';
    return monthNames[monthIndex] + ' ' + year;
  }

  function getPreviousMonthKey(monthKey) {
    var parts = (monthKey || getCurrentMonthKey()).split('-');
    var year = Number(parts[0]);
    var month = Number(parts[1]);
    if (!year || !month) return getCurrentMonthKey();
    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
    return year + '-' + String(month).padStart(2, '0');
  }

  // ─── Calculate Total ─────────────────────
  function calculateTotal(data) {
    return data.reduce(function (res, item) {
      if (item.type === 'income') {
        res.income += item.amount;
      } else if (item.type === 'expense') {
        res.expense += item.amount;
      }
      res.balance = res.income - res.expense;
      return res;
    }, { income: 0, expense: 0, balance: 0 });
  }

  function updateSummary(filteredData) {
    var totals = calculateTotal(filteredData);
    totalIncomeEl.textContent = formatRupiah(totals.income);
    totalExpenseEl.textContent = formatRupiah(totals.expense);
    totalCountEl.textContent = filteredData.length;

    // Pulse animation
    [totalIncomeEl, totalExpenseEl, totalCountEl, topCategoryEl].forEach(function (el) {
      el.classList.remove('pulse');
      void el.offsetWidth; // reflow
      el.classList.add('pulse');
    });

    // Remove Avg per day calculation

    if (filteredData.length > 0) {
      var catTotals = {};
      filteredData.forEach(function (item) {
        if (item.type !== 'income') {
          catTotals[item.category] = (catTotals[item.category] || 0) + item.amount;
        }
      });
      var topCat = '';
      var topVal = 0;
      Object.keys(catTotals).forEach(function (cat) {
        if (catTotals[cat] > topVal) {
          topVal = catTotals[cat];
          topCat = cat;
        }
      });
      topCategoryEl.innerHTML = (CATEGORY_ICONS[topCat] || '') + ' ' + topCat;
    } else {
      topCategoryEl.textContent = '—';
    }
  }

  function getReportMonthKey() {
    if (filterMonth && filterMonth.value) return filterMonth.value;
    return getCurrentMonthKey();
  }

  function renderMonthlyReport() {
    if (!reportMonthLabel) return;

    var monthKey = getReportMonthKey();
    var previousMonthKey = getPreviousMonthKey(monthKey);
    var monthData = expenses.filter(function (item) {
      return item.date && item.date.substring(0, 7) === monthKey;
    });

    var monthIncome = 0;
    var monthExpense = 0;
    var categoryTotals = {};
    var largestExpense = null;

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

    var topCategory = '—';
    var topCategoryAmount = 0;
    Object.keys(categoryTotals).forEach(function (cat) {
      if (categoryTotals[cat] > topCategoryAmount) {
        topCategoryAmount = categoryTotals[cat];
        topCategory = cat;
      }
    });

    var prevExpense = expenses.reduce(function (sum, item) {
      if (item.type !== 'income' && item.type !== 'transfer' && item.date && item.date.substring(0, 7) === previousMonthKey) {
        return sum + item.amount;
      }
      return sum;
    }, 0);

    var net = monthIncome - monthExpense;
    var trendText = 'Stabil terhadap bulan lalu.';
    if (prevExpense === 0 && monthExpense > 0) {
      trendText = 'Ada pengeluaran baru dibanding bulan lalu.';
    } else if (prevExpense > 0) {
      var diff = monthExpense - prevExpense;
      var pct = Math.abs((diff / prevExpense) * 100);
      if (diff > 0) {
        trendText = 'Naik ' + pct.toFixed(1) + '% dibanding bulan lalu.';
      } else if (diff < 0) {
        trendText = 'Turun ' + pct.toFixed(1) + '% dibanding bulan lalu.';
      }
    }

    var advice = 'Belum ada rekomendasi.';
    if (monthExpense === 0) {
      advice = 'Belum ada pengeluaran tercatat di bulan ini. Jaga konsistensi pencatatan.';
    } else if (net < 0) {
      advice = 'Pengeluaran melebihi pemasukan. Prioritaskan biaya wajib dan kurangi pos non-esensial.';
    } else if (topCategoryAmount > 0 && (topCategoryAmount / monthExpense) >= 0.45) {
      advice = 'Kategori ' + topCategory + ' mendominasi pengeluaran. Pertimbangkan set budget lebih ketat di kategori ini.';
    } else if (monthIncome > 0 && (monthExpense / monthIncome) >= 0.8) {
      advice = 'Pengeluaran sudah mendekati pemasukan. Sisakan buffer minimal 20% untuk tabungan/darurat.';
    } else {
      advice = 'Arus kas bulan ini cukup sehat. Pertahankan ritme dan tingkatkan porsi tabungan.';
    }

    reportMonthLabel.textContent = getMonthLabel(monthKey);
    reportIncomeEl.textContent = formatRupiah(monthIncome);
    reportExpenseEl.textContent = formatRupiah(monthExpense);
    reportNetEl.textContent = formatRupiah(net);
    reportNetEl.classList.remove('report-value-positive', 'report-value-negative');
    reportNetEl.classList.add(net >= 0 ? 'report-value-positive' : 'report-value-negative');
    reportCountEl.textContent = String(monthData.length);
    reportTopCategoryEl.textContent = 'Kategori teratas: ' + (topCategory === '—' ? '—' : (topCategory + ' (' + formatRupiah(topCategoryAmount) + ')'));
    reportLargestExpenseEl.textContent = largestExpense ? ('Pengeluaran terbesar: ' + largestExpense.title + ' (' + formatRupiah(largestExpense.amount) + ')') : 'Pengeluaran terbesar: —';
    reportTrendEl.textContent = 'Tren vs bulan lalu: ' + trendText;
    reportAdviceEl.textContent = advice;
  }

  // ─── Budget Logic ──────────────────────────
  function getBudgetLimit() {
    return Number(localStorage.getItem(BUDGET_KEY)) || 0;
  }
  
  function saveBudgetLimit(val) {
    localStorage.setItem(BUDGET_KEY, val);
  }

  function loadCategoryBudgets() {
    try {
      var raw = localStorage.getItem(CATEGORY_BUDGET_KEY);
      var parsed = raw ? JSON.parse(raw) : {};
      categoryBudgets = {};
      if (parsed && typeof parsed === 'object') {
        Object.keys(parsed).forEach(function (cat) {
          var val = Number(parsed[cat]);
          if (cat && val > 0) categoryBudgets[cat] = val;
        });
      }
    } catch (e) {
      categoryBudgets = {};
    }
  }

  function saveCategoryBudgets() {
    localStorage.setItem(CATEGORY_BUDGET_KEY, JSON.stringify(categoryBudgets));
  }

  function getExpenseCategories() {
    var seen = {};
    var out = [];
    var expenseGroup = document.getElementById('optgroup-expense');

    if (expenseGroup) {
      var options = expenseGroup.querySelectorAll('option');
      options.forEach(function (opt) {
        var value = (opt.value || '').trim();
        if (!value || seen[value]) return;
        seen[value] = true;
        out.push(value);
      });
    }

    expenses.forEach(function (item) {
      if (item.type === 'income' || item.type === 'transfer') return;
      var cat = (item.category || '').trim();
      if (!cat || seen[cat]) return;
      seen[cat] = true;
      out.push(cat);
    });

    return out.sort(function (a, b) {
      return a.localeCompare(b, 'id');
    });
  }

  // ─── Calculate Individual Wallets ────────
  function calculateWalletBalances(data) {
    var wallets = {
      'Tunai': 0,
      'Rekening Bank': 0,
      'E-Wallet': 0
    };
    
    data.forEach(function(item) {
      var w = item.wallet || 'Tunai';
      if (typeof wallets[w] === 'undefined') wallets[w] = 0;
      
      if (item.type === 'income') {
        wallets[w] += item.amount;
      } else if (item.type === 'expense') {
        wallets[w] -= item.amount;
      } else if (item.type === 'transfer') {
        var wTo = item.walletTo || 'Tunai';
        if (typeof wallets[wTo] === 'undefined') wallets[wTo] = 0;
        
        wallets[w] -= item.amount;
        wallets[wTo] += item.amount;
      }
    });
    
    return wallets;
  }

  // ─── Update Hero (Balance & Budget) ──────
  function updateHero() {
    var totals = calculateTotal(expenses);
    totalBalanceEl.textContent = formatRupiah(totals.balance);

    if (walletBalancesEl) {
      var wals = calculateWalletBalances(expenses);
      walletBalancesEl.innerHTML = '';
      Object.keys(wals).forEach(function(w) {
        var bal = wals[w];
        var icon = '<i class="ph-bold ph-wallet"></i>';
        if (w === 'Tunai') icon = '<i class="ph-bold ph-money"></i>';
        if (w === 'Rekening Bank') icon = '<i class="ph-bold ph-bank"></i>';
        if (w === 'E-Wallet') icon = '<i class="ph-bold ph-device-mobile"></i>';
        
        var wDiv = document.createElement('div');
        wDiv.className = 'wallet-pill';
        wDiv.innerHTML =
          '<span class="wallet-pill-label">' + icon + ' ' + escapeHtml(w) + '</span>' +
          '<strong class="wallet-pill-value">' + formatRupiah(bal) + '</strong>';
        walletBalancesEl.appendChild(wDiv);
      });
    }

    // Calculate this month's expense
    var currentMonth = getCurrentMonthKey();
    
    var monthExpenses = expenses.filter(function(item) {
      return (item.type !== 'income') && item.date.startsWith(currentMonth);
    });
    
    var monthExpenseTotal = monthExpenses.reduce(function(sum, item) { return sum + item.amount; }, 0);
    var budget = getBudgetLimit();
    
    if (budget > 0) {
      budgetTextUsed.textContent = formatRupiah(monthExpenseTotal);
      budgetTextLimit.textContent = '/ ' + formatRupiah(budget);
      var pct = Math.min((monthExpenseTotal / budget) * 100, 100);
      budgetPct.textContent = Math.round(pct) + '%';
      budgetPct.style.display = 'block';
      budgetFill.style.width = pct + '%';
      
      if (pct >= 90) {
        budgetFill.style.background = 'var(--clr-danger)';
        budgetPct.style.background = 'var(--clr-danger)';
        budgetPct.style.color = '#fff';
        budgetNote.textContent = 'Hati-hati! Pengeluaran Anda hampir melewati batas.';
      } else if (pct >= 70) {
        budgetFill.style.background = 'var(--clr-warning)';
        budgetPct.style.background = 'var(--clr-warning)';
        budgetPct.style.color = '#000';
        budgetNote.textContent = 'Pengeluaran bulan ini sudah cukup tinggi.';
      } else {
        budgetFill.style.background = '#ffffff';
        budgetPct.style.background = 'rgba(255,255,255,0.2)';
        budgetPct.style.color = '#fff';
        budgetNote.textContent = 'Pengeluaran Anda masih aman terkontrol.';
      }
    } else {
      budgetTextUsed.textContent = formatRupiah(monthExpenseTotal);
      budgetTextLimit.textContent = '/ Tidak ada batas';
      budgetPct.style.display = 'none';
      budgetFill.style.width = '0%';
      budgetFill.style.background = '#ffffff';
      budgetNote.textContent = 'Atur batas bulanan agar lebih terkontrol.';
    }
  }

  function getMonthlyExpenseByCategory(monthKey) {
    var totals = {};
    expenses.forEach(function (item) {
      if (item.type === 'income' || item.type === 'transfer') return;
      if (!item.date || item.date.substring(0, 7) !== monthKey) return;
      var cat = item.category || 'Lainnya (Keluar)';
      totals[cat] = (totals[cat] || 0) + item.amount;
    });
    return totals;
  }

  function renderCategoryBudgetSummary() {
    if (!categoryBudgetList || !categoryBudgetMeta || !categoryBudgetEmpty) return;

    var monthKey = getReportMonthKey();
    var monthCategoryExpense = getMonthlyExpenseByCategory(monthKey);
    var categories = Object.keys(categoryBudgets).filter(function (cat) {
      return Number(categoryBudgets[cat]) > 0;
    });

    categoryBudgetList.innerHTML = '';
    if (!categories.length) {
      categoryBudgetMeta.textContent = 'Belum ada budget kategori aktif.';
      categoryBudgetEmpty.classList.add('visible');
      return;
    }

    categoryBudgetEmpty.classList.remove('visible');
    categoryBudgetMeta.textContent = getMonthLabel(monthKey) + ' • ' + categories.length + ' kategori dipantau';

    categories.sort(function (a, b) {
      var aLimit = Number(categoryBudgets[a]) || 1;
      var bLimit = Number(categoryBudgets[b]) || 1;
      var aPct = ((monthCategoryExpense[a] || 0) / aLimit);
      var bPct = ((monthCategoryExpense[b] || 0) / bLimit);
      return bPct - aPct;
    });

    categories.forEach(function (cat) {
      var limit = Number(categoryBudgets[cat]) || 0;
      var spent = Number(monthCategoryExpense[cat]) || 0;
      var pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
      var statusClass = pct >= 100 ? 'is-over' : (pct >= 75 ? 'is-warn' : 'is-safe');

      var item = document.createElement('div');
      item.className = 'category-budget-item';
      item.innerHTML =
        '<div class="category-budget-row">' +
          '<div class="category-budget-name">' + (CATEGORY_ICONS[cat] || '<i class="ph-fill ph-tag"></i>') + ' ' + escapeHtml(cat) + '</div>' +
          '<div class="category-budget-amount">' + formatRupiah(spent) + ' / ' + formatRupiah(limit) + ' (' + Math.round(pct) + '%)</div>' +
        '</div>' +
        '<div class="category-budget-track">' +
          '<div class="category-budget-fill ' + statusClass + '" style="width:' + pct.toFixed(2) + '%;"></div>' +
        '</div>';
      categoryBudgetList.appendChild(item);
    });
  }

  function renderCategoryBudgetEditor() {
    if (!categoryBudgetEditor) return;
    var categories = getExpenseCategories();
    if (!categories.length) {
      categoryBudgetEditor.innerHTML = '<p class="category-budget-empty visible">Belum ada kategori pengeluaran yang tersedia.</p>';
      return;
    }

    categoryBudgetEditor.innerHTML = '';
    categories.forEach(function (cat) {
      var val = Number(categoryBudgets[cat]) || 0;
      var row = document.createElement('div');
      row.className = 'category-budget-edit-row';
      var label = document.createElement('label');
      label.className = 'category-budget-edit-label';
      label.innerHTML = (CATEGORY_ICONS[cat] || '<i class="ph-fill ph-tag"></i>') + ' ' + escapeHtml(cat);

      var input = document.createElement('input');
      input.type = 'text';
      input.className = 'category-budget-input';
      input.setAttribute('inputmode', 'numeric');
      input.setAttribute('placeholder', '0 = nonaktif');
      input.dataset.category = cat;
      input.value = val > 0 ? val.toLocaleString('en-US') : '';

      row.appendChild(label);
      row.appendChild(input);
      categoryBudgetEditor.appendChild(row);
    });

    var inputs = categoryBudgetEditor.querySelectorAll('.category-budget-input');
    inputs.forEach(function (input) {
      input.addEventListener('input', formatInputCurrency);
    });
  }

  function openCategoryBudgetModal() {
    if (!categoryBudgetOverlay) return;
    renderCategoryBudgetEditor();
    categoryBudgetOverlay.classList.add('active');
  }

  function closeCategoryBudgetModal() {
    if (!categoryBudgetOverlay) return;
    categoryBudgetOverlay.classList.remove('active');
  }

  function saveCategoryBudgetFromEditor() {
    if (!categoryBudgetEditor) return;
    var inputs = categoryBudgetEditor.querySelectorAll('.category-budget-input');
    var next = {};
    inputs.forEach(function (input) {
      var cat = input.dataset.category;
      var val = Number((input.value || '').replace(/,/g, ''));
      if (cat && val > 0) {
        next[cat] = val;
      }
    });
    categoryBudgets = next;
    saveCategoryBudgets();
    renderCategoryBudgetSummary();
    closeCategoryBudgetModal();
    showToast('Budget per kategori berhasil disimpan', 'success');
  }

  // ─── Get Filtered Data ───────────────────
  function getFilteredData() {
    var selectedSearch = (filterSearch && filterSearch.value ? filterSearch.value : '').trim().toLowerCase();
    var selectedCat = filterCategory.value;
    var selectedMonth = filterMonth.value; // YYYY-MM or ""
    var selectedSort = filterSort.value || 'date-desc';

    var filtered = expenses.filter(function (e) {
      var haystack = [
        e.date || '',
        e.title || '',
        e.category || '',
        e.wallet || '',
        e.walletTo || '',
        e.type || '',
        String(e.amount || ''),
        Number(e.amount || 0).toLocaleString('en-US'),
        Number(e.amount || 0).toLocaleString('id-ID'),
      ].join(' ').toLowerCase();
      var searchMatch = !selectedSearch || haystack.indexOf(selectedSearch) !== -1;
      var catMatch = selectedCat === 'Semua' || e.category === selectedCat;
      var monthMatch = !selectedMonth || e.date.substring(0, 7) === selectedMonth;
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

  function setRenderState(message) {
    if (!renderStateEl) return;
    renderStateEl.textContent = message || '';
    renderStateEl.classList.toggle('visible', Boolean(message));
  }

  // ─── Render Table ─────────────────────────
  function renderTableNow() {
    var data = getFilteredData();

    tbody.innerHTML = '';
    updateHero();
    updateTitleSuggestions();
    renderMonthlyReport();
    renderCategoryBudgetSummary();

    if (data.length === 0) {
      emptyState.classList.add('visible');
      updateSummary(data);
      renderChart(data);
      return;
    }

    emptyState.classList.remove('visible');
    var fragment = document.createDocumentFragment();

    data.forEach(function (item, index) {
      var tr = document.createElement('tr');
      if (!isPerfLite) {
        tr.classList.add('row-animate');
        tr.style.animationDelay = (index * 0.04) + 's';
      }
      tr.dataset.id = item.id;

      var isIncome = item.type === 'income';
      var isTransfer = item.type === 'transfer';
      var indicatorHtml = isIncome ? '<span style="color:var(--clr-success)"><i class="ph-bold ph-arrow-down-left"></i> Pemasukan</span>' : 
                          (isTransfer ? '<span style="color:var(--clr-accent)"><i class="ph-bold ph-arrows-left-right"></i> Transfer</span>' :
                          '<span style="color:var(--clr-danger)"><i class="ph-bold ph-arrow-up-right"></i> Pengeluaran</span>');
      
      var walletText = isTransfer ? (escapeHtml(item.wallet || 'Tunai') + ' <i class="ph-bold ph-arrow-right"></i> ' + escapeHtml(item.walletTo || 'Tunai')) : escapeHtml(item.wallet || 'Tunai');
      var categoryContent = isTransfer ? '<i class="ph-fill ph-arrows-left-right"></i> Transfer Dompet' : ((CATEGORY_ICONS[item.category] || '') + ' ' + escapeHtml(item.category));

      tr.innerHTML =
        '<td data-label="Tanggal">' + formatDate(item.date) + '</td>' +
        '<td data-label="Tipe & Nama"><div style="font-weight:600">' + escapeHtml(item.title) + '</div><div style="font-size:0.75rem">' + indicatorHtml + '</div></td>' +
        '<td data-label="Kategori & Dompet"><span class="badge">' + categoryContent + '</span><div style="font-size:0.75rem; margin-top:4px; opacity:0.7;"><i class="ph-fill ph-wallet"></i> ' + walletText + '</div></td>' +
        '<td class="text-right" data-label="Nominal"><span class="amount ' + (isIncome ? 'text-success' : (isTransfer ? 'text-accent' : '')) + '" style="font-weight:600">' + (isIncome ? '+' : (isTransfer ? '' : '-')) + formatRupiah(item.amount) + '</span></td>' +
        '<td class="text-center" data-label="Aksi">' +
          '<div class="action-group">' +
            '<button class="btn btn-sm btn-edit" data-action="edit" data-id="' + item.id + '" title="Edit"><i class="ph-bold ph-pencil-simple"></i> Edit</button>' +
            '<button class="btn btn-sm btn-delete" data-action="delete" data-id="' + item.id + '" title="Hapus"><i class="ph-bold ph-trash"></i> Hapus</button>' +
          '</div>' +
        '</td>';

      fragment.appendChild(tr);
    });

    tbody.appendChild(fragment);
    updateSummary(data);
    renderChart(data);
  }

  function renderTable() {
    if (renderTimer) {
      clearTimeout(renderTimer);
    }
    setRenderState('Memuat transaksi...');
    renderTimer = setTimeout(function () {
      renderTimer = null;
      renderTableNow();
      setRenderState('');
    }, 0);
  }

  // ─── Title Suggestions (Autocomplete) ─────
  function updateTitleSuggestions() {
    if (!titleSuggestions) return;
    var uniqueTitles = {};
    expenses.forEach(function(e) {
      if (!uniqueTitles[e.title]) {
        uniqueTitles[e.title] = e;
      }
    });
    titleSuggestions.innerHTML = '';
    Object.keys(uniqueTitles).forEach(function(title) {
      var option = document.createElement('option');
      option.value = title;
      titleSuggestions.appendChild(option);
    });
  }

  // ─── Escape HTML ──────────────────────────
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ─── Doughnut Chart ──────────────────────
  function renderChart(data) {
    var ctx = chartCanvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    var size = chartCanvas.width / dpr;
    var center = size / 2;
    var outerRadius = center - 10;
    var innerRadius = outerRadius * 0.58;

    ctx.clearRect(0, 0, size, size);
    chartLegend.innerHTML = '';
    chartSlices = [];
    chartGeom = { center: size / 2, innerRadius: innerRadius, outerRadius: outerRadius };

    var hasExpense = data && data.some(function(item) { return item.type === 'expense'; });

    if (!hasExpense) {
      chartEmpty.classList.add('visible');
      chartCanvas.style.display = 'none';
      chartLegend.style.display = 'none';
      chartTooltip.classList.remove('visible');
      return;
    }

    chartEmpty.classList.remove('visible');
    chartCanvas.style.display = 'block';
    chartLegend.style.display = 'flex';

    // Aggregate by category for expenses only
    var catTotals = {};
    var total = 0;
    data.forEach(function (item) {
      if (item.type === 'expense') {
        catTotals[item.category] = (catTotals[item.category] || 0) + item.amount;
        total += item.amount;
      }
    });

    var categories = Object.keys(catTotals).sort(function (a, b) {
      return catTotals[b] - catTotals[a];
    });

    // Draw slices
    var startAngle = -Math.PI / 2;
    var normalizedStart = 0;
    var gapAngle = 0.03;

    categories.forEach(function (cat, i) {
      var sliceAngle = (catTotals[cat] / total) * (2 * Math.PI);
      var color = CATEGORY_COLORS[cat] || '#94a3b8';

      // Only add gap if more than 1 category
      var actualGap = categories.length > 1 ? gapAngle : 0;
      var drawStart = startAngle + actualGap / 2;
      var drawEnd = startAngle + sliceAngle - actualGap / 2;

      if (drawEnd > drawStart) {
        ctx.beginPath();
        ctx.arc(center, center, outerRadius, drawStart, drawEnd);
        ctx.arc(center, center, innerRadius, drawEnd, drawStart, true);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
      }

      startAngle += sliceAngle;
      chartSlices.push({
        category: cat,
        amount: catTotals[cat],
        percent: ((catTotals[cat] / total) * 100),
        start: normalizedStart,
        end: normalizedStart + sliceAngle,
      });
      normalizedStart += sliceAngle;

      // Legend item
      var pct = ((catTotals[cat] / total) * 100).toFixed(1);
      var legendItem = document.createElement('div');
      legendItem.className = 'legend-item';
      legendItem.innerHTML =
        '<span class="legend-color" style="background:' + color + '"></span>' +
        '<span class="legend-label">' + (CATEGORY_ICONS[cat] || '') + ' ' + cat + '</span>' +
        '<span class="legend-value">' + pct + '%</span>';
      chartLegend.appendChild(legendItem);
    });

    // Center text
    var theme = getTheme();
    var textColor = theme === 'dark' ? '#e2e8f0' : '#0f172a';
    var textSecondaryColor = theme === 'dark' ? '#94a3b8' : '#64748b';

    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 1rem "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
    ctx.fillText(formatRupiah(total), center, center - 8);

    ctx.font = '500 0.7rem "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
    ctx.fillStyle = textSecondaryColor;
    ctx.fillText('Total', center, center + 14);
  }

  function hideChartTooltip() {
    chartTooltip.classList.remove('visible');
  }

  function handleChartHoverQueued(e) {
    if (isPerfLite) {
      hideChartTooltip();
      return;
    }
    chartHoverEvent = e;
    if (chartHoverRaf) return;
    chartHoverRaf = requestAnimationFrame(function () {
      chartHoverRaf = null;
      if (!chartHoverEvent) return;
      handleChartHover(chartHoverEvent);
      chartHoverEvent = null;
    });
  }

  function handleChartHover(e) {
    if (!chartSlices.length || !chartGeom) {
      hideChartTooltip();
      return;
    }

    var rect = chartCanvas.getBoundingClientRect();
    var x = (e.clientX - rect.left);
    var y = (e.clientY - rect.top);

    var dx = x - chartGeom.center;
    var dy = y - chartGeom.center;
    var dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < chartGeom.innerRadius || dist > chartGeom.outerRadius) {
      hideChartTooltip();
      return;
    }

    var angle = Math.atan2(dy, dx);
    var normalized = angle + Math.PI / 2;
    if (normalized < 0) normalized += Math.PI * 2;

    var match = null;
    chartSlices.forEach(function (slice) {
      if (normalized >= slice.start && normalized < slice.end) {
        match = slice;
      }
    });

    if (!match) {
      hideChartTooltip();
      return;
    }

    var icon = CATEGORY_ICONS[match.category] || '';
    var pct = match.percent.toFixed(1);
    chartTooltip.innerHTML =
      icon + ' ' + match.category + ' — ' + formatRupiah(match.amount) + ' (' + pct + '%)';

    var containerRect = chartCanvas.parentElement.getBoundingClientRect();
    chartTooltip.style.left = (e.clientX - containerRect.left + 12) + 'px';
    chartTooltip.style.top = (e.clientY - containerRect.top + 12) + 'px';
    chartTooltip.classList.add('visible');
  }

  // ─── Form Validation ─────────────────────
  function validateForm() {
    var valid = true;
    var fields = [inputDate, inputTitle, inputCategory, inputAmount];

    fields.forEach(function (field) {
      field.classList.remove('invalid');
    });

    if (!inputDate.value) {
      inputDate.classList.add('invalid');
      dateHelp.textContent = 'Tanggal wajib diisi';
      valid = false;
    }
    if (inputDate.value && inputDate.value > getTodayString()) {
      inputDate.classList.add('invalid');
      dateHelp.textContent = 'Tanggal tidak boleh di masa depan';
      valid = false;
    }
    if (inputDate.value && inputDate.value <= getTodayString()) {
      dateHelp.textContent = '';
    }
    if (!inputTitle.value.trim()) {
      inputTitle.classList.add('invalid');
      valid = false;
    }
    
    var isTransfer = document.querySelector('input[name="input-type"]:checked').value === 'transfer';

    if (!isTransfer && !inputCategory.value) {
      inputCategory.classList.add('invalid');
      categoryHelp.textContent = 'Kategori wajib diisi';
      valid = false;
    } else {
      categoryHelp.textContent = '';
    }
    
    if (isTransfer) {
      if (inputWallet.value === inputWalletTo.value) {
        showToast('Dompet asal dan tujuan tidak boleh sama', 'error');
        valid = false;
      }
    }
    var rawAmount = inputAmount.value.replace(/,/g, '');
    if (!rawAmount || Number(rawAmount) <= 0) {
      inputAmount.classList.add('invalid');
      amountHelp.textContent = 'Nominal harus lebih dari 0';
      valid = false;
    } else {
      amountHelp.textContent = '';
    }

    return valid;
  }

  // ─── Reset Form ───────────────────────────
  function resetForm() {
    form.reset();
    inputDate.value = getTodayString();
    inputDate.max = getTodayString();
    dateHelp.textContent = '';
    categoryHelp.textContent = '';
    amountHelp.textContent = '';
    editingId = null;
    
    // reset type to expense and background to Tunai
    document.querySelector('input[name="input-type"][value="expense"]').checked = true;
    inputWallet.value = 'Tunai';
    inputWalletTo.value = 'Tunai';
    groupWalletTo.style.display = 'none';
    groupCategory.style.display = 'flex';
    labelWallet.textContent = 'Sumber Dana';

    inputRecurring.checked = false;
    document.querySelector('.checkbox-group').style.display = 'flex'; // show when adding

    btnSubmit.disabled = false;
    btnSubmit.classList.remove('is-loading');
    btnSubmit.innerHTML = '<i class="ph-bold ph-plus-circle btn-icon"></i> Simpan';
    btnCancel.style.display = 'none';

    [inputDate, inputTitle, inputCategory, inputAmount, inputWallet, inputWalletTo].forEach(function (f) {
      if (f) f.classList.remove('invalid');
    });
  }

  // ─── Get Today String ────────────────────
  function getTodayString() {
    var d = new Date();
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + mm + '-' + dd;
  }

  // ─── Add or Update Expense ───────────────
  function handleSubmit(e) {
    e.preventDefault();

    if (!validateForm()) return;
    if (btnSubmit.disabled) return;

    var submitLabel = btnSubmit.innerHTML;
    var completed = false;
    btnSubmit.disabled = true;
    btnSubmit.classList.add('is-loading');
    btnSubmit.innerHTML = '<span class="btn-spinner" aria-hidden="true"></span> Menyimpan...';

    var selectedType = 'expense';
    for (var i = 0; i < inputTypeRadios.length; i++) {
        if (inputTypeRadios[i].checked) {
            selectedType = inputTypeRadios[i].value;
            break;
        }
    }

    var data = {
      id: editingId || generateId(),
      type: selectedType,
      wallet: inputWallet.value || 'Tunai',
      walletTo: selectedType === 'transfer' ? (inputWalletTo.value || 'Tunai') : undefined,
      date: inputDate.value,
      title: inputTitle.value.trim(),
      category: selectedType === 'transfer' ? 'Transfer' : inputCategory.value,
      amount: Number(inputAmount.value.replace(/,/g, '')),
    };

    try {
      if (editingId) {
        expenses = expenses.map(function (item) {
          return item.id === editingId ? data : item;
        });
        showToast('Transaksi berhasil diperbarui', 'success');
      } else {
        expenses.push(data);
        showToast('Transaksi berhasil ditambahkan', 'success');
        
        // Handle Recurring
        if (inputRecurring && inputRecurring.checked) {
          var nextDateObj = new Date(data.date);
          nextDateObj.setMonth(nextDateObj.getMonth() + 1);
          recurringExpenses.push({
            id: generateId(),
            type: data.type,
            wallet: data.wallet,
            title: data.title,
            category: data.category,
            amount: data.amount,
            nextDate: nextDateObj.toISOString().split('T')[0]
          });
          saveRecurringToStorage();
        }
      }

      saveToStorage();
      renderTable();
      resetForm();
      completed = true;
    } finally {
      if (!completed) {
        btnSubmit.innerHTML = submitLabel;
      }
      btnSubmit.disabled = false;
      btnSubmit.classList.remove('is-loading');
    }
  }

  // ─── Edit Expense ────────────────────────
  function startEdit(id) {
    var item = expenses.find(function (e) {
      return e.id === id;
    });
    if (!item) return;

    editingId = item.id;
    inputDate.value = item.date;
    inputTitle.value = item.title;
    inputCategory.value = item.category;
    inputAmount.value = item.amount.toLocaleString('en-US');

    document.querySelector('.checkbox-group').style.display = 'none'; // hide when editing
    
    // Set wallet
    if (item.wallet) {
      inputWallet.value = item.wallet;
    } else {
      inputWallet.value = 'Tunai';
    }
    
    if (item.type === 'transfer') {
      inputWalletTo.value = item.walletTo || 'Tunai';
      groupWalletTo.style.display = 'flex';
      groupCategory.style.display = 'none';
      labelWallet.textContent = 'Dari Dompet';
    } else {
      groupWalletTo.style.display = 'none';
      groupCategory.style.display = 'flex';
      labelWallet.textContent = 'Sumber Dana';
    }
    
    // Set type
    var typeVal = item.type || 'expense';
    for (var i = 0; i < inputTypeRadios.length; i++) {
        inputTypeRadios[i].checked = (inputTypeRadios[i].value === typeVal);
    }

    btnSubmit.innerHTML = '<i class="ph-bold ph-check btn-icon"></i> Update';
    btnCancel.style.display = 'inline-flex';

    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    inputTitle.focus();
  }

  // ─── Delete Expense ──────────────────────
  function showDeleteConfirm(id) {
    deleteTargetId = id;
    modalOverlay.classList.add('active');
  }

  function hideDeleteConfirm() {
    deleteTargetId = null;
    modalOverlay.classList.remove('active');
  }

  function confirmDelete() {
    if (!deleteTargetId) return;
    var targetId = deleteTargetId;
    var row = tbody.querySelector('tr[data-id="' + targetId + '"]');
    var deletedItem = expenses.find(function (e) {
      return e.id === targetId;
    });

    hideDeleteConfirm();

    function finalizeDelete() {
      pushUndo(expenses);
      expenses = expenses.filter(function (e) {
        return e.id !== targetId;
      });
      saveToStorage();
      renderTable();

      if (deletedItem) {
        lastDeleted = deletedItem;
        if (undoTimer) clearTimeout(undoTimer);
        undoTimer = setTimeout(function () {
          lastDeleted = null;
        }, 5500);
        showUndoToast('Pengeluaran dihapus', function () {
          if (!lastDeleted) return;
          expenses.push(lastDeleted);
          lastDeleted = null;
          saveToStorage();
          renderTable();
          showToast('Pengeluaran dikembalikan', 'success');
        });
      } else {
        showToast('Pengeluaran berhasil dihapus', 'error');
      }
    }

    if (row) {
      row.classList.add('row-removing');
      setTimeout(finalizeDelete, 180);
    } else {
      finalizeDelete();
    }
  }

  // ─── Table Click Delegation ──────────────
  function handleTableClick(e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;

    var action = btn.dataset.action;
    var id = btn.dataset.id;

    if (action === 'edit') {
      startEdit(id);
    } else if (action === 'delete') {
      showDeleteConfirm(id);
    }
  }

  // ─── Export CSV ──────────────────────────
  function exportCSV() {
    var data = getFilteredData();
    if (data.length === 0) {
      showToast('Tidak ada data untuk diekspor', 'info');
      return;
    }

    var headers = ['Tanggal', 'Nama', 'Kategori', 'Nominal'];
    var rows = data.map(function (item) {
      return [
        item.date,
        '"' + item.title.replace(/"/g, '""') + '"',
        item.category,
        item.amount,
      ].join(',');
    });

    var csv = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'pengeluaran_' + getTodayString() + '.csv';
    link.click();
    URL.revokeObjectURL(url);

    showToast('CSV berhasil diunduh', 'success');
  }

  // ─── Export JSON ─────────────────────────
  function exportJSON() {
    if (!expenses.length) {
      showToast('Tidak ada data untuk diekspor', 'info');
      return;
    }

    var json = JSON.stringify(expenses, null, 2);
    var blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'pengeluaran_' + getTodayString() + '.json';
    link.click();
    URL.revokeObjectURL(url);

    showToast('JSON berhasil diunduh', 'success');
  }

  // ─── Import JSON ─────────────────────────
  function importJSONFile(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        var parsed = JSON.parse(e.target.result);
        if (!Array.isArray(parsed)) {
          showToast('Format JSON tidak valid', 'error');
          return;
        }

        var cleaned = parsed.filter(function (item) {
          return item && item.id && item.date && item.title && item.category && typeof item.amount === 'number';
        });

        pendingImportData = cleaned;
        openImportModal();
      } catch (err) {
        showToast('Gagal membaca file JSON', 'error');
      } finally {
        inputImportJson.value = '';
      }
    };
    reader.readAsText(file);
  }

  function openImportModal() {
    if (!pendingImportData) return;
    importOverlay.classList.add('active');
  }

  function closeImportModal() {
    importOverlay.classList.remove('active');
    pendingImportData = null;
  }

  function openImportSummary(mode, added, skipped) {
    importSummaryMode.textContent = mode;
    importSummaryAdded.textContent = String(added);
    importSummarySkipped.textContent = String(skipped);
    importSummaryOverlay.classList.add('active');
  }

  function closeImportSummary() {
    importSummaryOverlay.classList.remove('active');
  }

  function applyImport() {
    if (!pendingImportData) return;
    var selected = document.querySelector('input[name="import-mode"]:checked');
    var mode = selected ? selected.value : 'replace';

    pushUndo(expenses);

    var added = 0;
    var skipped = 0;

    if (mode === 'replace') {
      expenses = pendingImportData.slice();
      added = expenses.length;
    } else if (mode === 'merge-id') {
      var existing = {};
      expenses.forEach(function (e) { existing[e.id] = true; });
      pendingImportData.forEach(function (item) {
        if (!existing[item.id]) {
          expenses.push(item);
          added += 1;
        } else {
          skipped += 1;
        }
      });
    } else {
      var seen = {};
      function normText(value) {
        return String(value || '')
          .trim()
          .replace(/\s+/g, ' ')
          .toLowerCase();
      }
      function makeKey(item) {
        return [
          item.date,
          normText(item.title),
          item.category,
          item.amount,
        ].join('|');
      }
      expenses.forEach(function (e) {
        seen[makeKey(e)] = true;
      });
      pendingImportData.forEach(function (item) {
        var k = makeKey(item);
        if (!seen[k]) {
          expenses.push(item);
          seen[k] = true;
          added += 1;
        } else {
          skipped += 1;
        }
      });
    }

    saveToStorage();
    renderTable();
    closeImportModal();
    var modeLabel =
      mode === 'replace' ? 'Ganti semua data' :
      mode === 'merge-id' ? 'Gabung (berdasarkan ID)' :
      'Gabung (berdasarkan konten)';
    openImportSummary(modeLabel, added, skipped);
    showUndoStackToast();
  }

  // ─── Reset Filters ──────────────────────
  function resetFilters() {
    if (filterSearch) filterSearch.value = '';
    filterCategory.value = 'Semua';
    filterMonth.value = '';
    filterSort.value = 'date-desc';
    localStorage.removeItem(FILTER_KEY);
    renderTable();
    showToast('Filter direset', 'info');
  }

  function saveFilters() {
    var payload = {
      search: filterSearch ? filterSearch.value : '',
      category: filterCategory.value,
      month: filterMonth.value,
      sort: filterSort.value,
    };
    localStorage.setItem(FILTER_KEY, JSON.stringify(payload));
  }

  function loadFilters() {
    try {
      var raw = localStorage.getItem(FILTER_KEY);
      var saved = raw ? JSON.parse(raw) : null;
      if (saved && typeof saved.search === 'string' && filterSearch) {
        filterSearch.value = saved.search;
      }
      if (saved && saved.category) {
        filterCategory.value = saved.category;
      }
      if (saved && typeof saved.month === 'string') {
        filterMonth.value = saved.month;
      }
      if (saved && typeof saved.sort === 'string') {
        filterSort.value = saved.sort;
      }
    } catch (e) {
      // ignore corrupted filters
    }
  }

  // ─── Event Listeners ─────────────────────
  form.addEventListener('submit', handleSubmit);

  btnCancel.addEventListener('click', function () {
    resetForm();
  });

  tbody.addEventListener('click', handleTableClick);

  if (filterSearch) {
    filterSearch.addEventListener('input', function () {
      saveFilters();
      renderTable();
    });
  }

  filterCategory.addEventListener('change', function () {
    saveFilters();
    renderTable();
  });

  filterMonth.addEventListener('change', function () {
    saveFilters();
    renderTable();
  });

  filterSort.addEventListener('change', function () {
    saveFilters();
    renderTable();
  });

  btnUndo.addEventListener('click', undoLast);

  inputDate.addEventListener('input', function () {
    if (!inputDate.value) {
      dateHelp.textContent = 'Tanggal wajib diisi';
      inputDate.classList.add('invalid');
      return;
    }
    if (inputDate.value > getTodayString()) {
      dateHelp.textContent = 'Tanggal tidak boleh di masa depan';
      inputDate.classList.add('invalid');
      return;
    }
    dateHelp.textContent = '';
    inputDate.classList.remove('invalid');
  });

  inputCategory.addEventListener('change', function () {
    if (!inputCategory.value) {
      categoryHelp.textContent = 'Kategori wajib diisi';
      inputCategory.classList.add('invalid');
      return;
    }
    categoryHelp.textContent = '';
    inputCategory.classList.remove('invalid');
  });

  inputAmount.addEventListener('input', function () {
    var rawValue = inputAmount.value.replace(/,/g, '');
    var value = Number(rawValue);
    if (!rawValue || value <= 0) {
      amountHelp.textContent = 'Nominal harus lebih dari 0';
      inputAmount.classList.add('invalid');
      return;
    }
    amountHelp.textContent = '';
    inputAmount.classList.remove('invalid');
  });

  btnResetFilter.addEventListener('click', resetFilters);
  btnExportCsv.addEventListener('click', exportCSV);
  btnExportJson.addEventListener('click', exportJSON);
  btnImportJson.addEventListener('click', function () {
    inputImportJson.click();
  });
  inputImportJson.addEventListener('change', function (e) {
    var file = e.target.files && e.target.files[0];
    importJSONFile(file);
  });
  btnConfirmImport.addEventListener('click', applyImport);
  btnCancelImport.addEventListener('click', closeImportModal);
  btnCloseImportSummary.addEventListener('click', closeImportSummary);

  btnConfirmDelete.addEventListener('click', confirmDelete);
  btnCancelDelete.addEventListener('click', hideDeleteConfirm);

  btnThemeToggle.addEventListener('click', toggleTheme);
  chartCanvas.addEventListener('mousemove', handleChartHoverQueued);
  chartCanvas.addEventListener('mouseleave', hideChartTooltip);

  // Close modal on overlay click
  modalOverlay.addEventListener('click', function (e) {
    if (e.target === modalOverlay) {
      hideDeleteConfirm();
    }
  });
  importOverlay.addEventListener('click', function (e) {
    if (e.target === importOverlay) {
      closeImportModal();
    }
  });
  importSummaryOverlay.addEventListener('click', function (e) {
    if (e.target === importSummaryOverlay) {
      closeImportSummary();
    }
  });

  // Close modal on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
      hideDeleteConfirm();
    }
    if (e.key === 'Escape' && importOverlay.classList.contains('active')) {
      closeImportModal();
    }
    if (e.key === 'Escape' && importSummaryOverlay.classList.contains('active')) {
      closeImportSummary();
    }
    if (categoryBudgetOverlay && e.key === 'Escape' && categoryBudgetOverlay.classList.contains('active')) {
      closeCategoryBudgetModal();
    }
  });

  // ─── Handle canvas DPI for retina ────────
  function setupCanvas() {
    var dpr = window.devicePixelRatio || 1;
    var rect = chartCanvas.getBoundingClientRect();
    var displaySize = isPerfLite ? 260 : 320;
    chartCanvas.style.width = displaySize + 'px';
    chartCanvas.style.height = displaySize + 'px';
    chartCanvas.width = displaySize * dpr;
    chartCanvas.height = displaySize * dpr;
    var ctx = chartCanvas.getContext('2d');
    ctx.scale(dpr, dpr);
  }

  function detectPerfLite(prefersReduced) {
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

  function applyPerformanceMode(enabled) {
    document.documentElement.classList.toggle('perf-lite', enabled);
    document.body.classList.toggle('perf-lite', enabled);
  }

  function initVisualEffects() {
    var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    isPerfLite = detectPerfLite(prefersReduced);
    applyPerformanceMode(isPerfLite);
    setupCanvas();
    setupScrollReveal(prefersReduced || isPerfLite);
    setupCardGlow(prefersReduced || isPerfLite);
    setupHeroTilt(prefersReduced || isPerfLite);
  }

  function setupScrollReveal(prefersReduced) {
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
    }, {
      threshold: 0.18,
      rootMargin: '0px 0px -8% 0px'
    });

    sections.forEach(function (section) {
      if (section.classList.contains('reveal-ready')) {
        observer.observe(section);
      }
    });
  }

  function setupCardGlow(prefersReduced) {
    if (prefersReduced) return;
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return;

    var cards = document.querySelectorAll('.card');
    cards.forEach(function (card) {
      var frame = null;
      var nextX = 50;
      var nextY = 50;

      card.addEventListener('pointermove', function (e) {
        var rect = card.getBoundingClientRect();
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

  function setupHeroTilt(prefersReduced) {
    if (prefersReduced) return;
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return;

    var hero = document.querySelector('.hero-card');
    if (!hero) return;
    var frame = null;
    var next = { x: 0, y: 0, mx: 50, my: 50 };

    hero.addEventListener('pointermove', function (e) {
      var rect = hero.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      var px = (e.clientX - rect.left) / rect.width;
      var py = (e.clientY - rect.top) / rect.height;
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

  // ═══════════════════════════════════════════
  //  SPLIT BILL MODULE
  // ═══════════════════════════════════════════
  var SPLIT_HISTORY_KEY = 'expense_tracker_splits';

  var splitOverlay = document.getElementById('split-overlay');
  var btnOpenSplit = document.getElementById('btn-open-split');
  var btnCloseSplit = document.getElementById('btn-close-split');
  var splitBillName = document.getElementById('split-bill-name');
  var splitTotal = document.getElementById('split-total');
  var splitPayer = document.getElementById('split-payer');
  var modeEqual = document.getElementById('mode-equal');
  var modeCustom = document.getElementById('mode-custom');
  var splitPersonList = document.getElementById('split-person-list');
  var btnAddPerson = document.getElementById('btn-add-person');
  var btnCalculateSplit = document.getElementById('btn-calculate-split');
  var splitFormView = document.getElementById('split-form-view');
  var splitResultsView = document.getElementById('split-results-view');
  var splitResultSummary = document.getElementById('split-result-summary');
  var splitResultList = document.getElementById('split-result-list');
  var btnSaveSplit = document.getElementById('btn-save-split');
  var btnBackSplit = document.getElementById('btn-back-split');
  var splitHistoryList = document.getElementById('split-history-list');

  var splitMode = 'equal'; // 'equal' or 'custom'
  var splitResults = null;
  var splitHistory = [];
  var splitPersonIdCounter = 0;

  var AVATAR_COLORS = [
    '#6366f1', '#ec4899', '#f97316', '#10b981',
    '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4',
    '#f59e0b', '#14b8a6', '#e11d48', '#7c3aed',
  ];

  // ─── Open / Close Split Modal ─────────────
  function openSplitModal() {
    splitOverlay.classList.add('active');
    splitFormView.style.display = 'block';
    splitResultsView.style.display = 'none';
    resetSplitForm();
    renderSplitHistory();
  }

  function closeSplitModal() {
    splitOverlay.classList.remove('active');
  }

  function resetSplitForm() {
    splitBillName.value = '';
    splitTotal.value = '';
    splitMode = 'equal';
    splitPersonIdCounter = 0;
    modeEqual.classList.add('active');
    modeCustom.classList.remove('active');
    splitPersonList.innerHTML = '';
    // Add 2 default persons
    addPersonRow('');
    addPersonRow('');
    syncSplitPayerOptions();
    updateCustomAmountVisibility();
  }

  // ─── Person Rows ──────────────────────────
  function addPersonRow(name) {
    var personId = 'p-' + (++splitPersonIdCounter);
    var row = document.createElement('div');
    row.className = 'split-person-row';
    row.dataset.personId = personId;
    row.innerHTML =
      '<input type="text" class="person-name-input" placeholder="Nama peserta" value="' + escapeHtml(name || '') + '" />' +
      '<input type="text" class="custom-amount' + (splitMode === 'custom' ? ' visible' : '') + '" placeholder="Nominal" inputmode="numeric" />' +
      '<button class="btn-remove-person" title="Hapus" type="button">×</button>';

    // Remove button
    row.querySelector('.btn-remove-person').addEventListener('click', function () {
      if (splitPersonList.children.length > 2) {
        row.remove();
        syncSplitPayerOptions();
      } else {
        showToast('Minimal 2 peserta', 'error');
      }
    });

    splitPersonList.appendChild(row);
    syncSplitPayerOptions();
  }

  function getSplitParticipantLabel(row, index) {
    var nameInput = row.querySelector('.person-name-input');
    var name = nameInput ? nameInput.value.trim() : '';
    return name || ('Peserta ' + (index + 1));
  }

  function syncSplitPayerOptions() {
    if (!splitPayer) return;

    var rows = splitPersonList.querySelectorAll('.split-person-row');
    var prevPayerId = splitPayer.value;
    var hasPrev = false;
    var firstId = '';
    splitPayer.innerHTML = '';

    rows.forEach(function (row, i) {
      var personId = row.dataset.personId || ('p-auto-' + i);
      row.dataset.personId = personId;

      var opt = document.createElement('option');
      opt.value = personId;
      opt.textContent = getSplitParticipantLabel(row, i);
      splitPayer.appendChild(opt);

      if (!firstId) firstId = personId;
      if (personId === prevPayerId) hasPrev = true;
    });

    if (!firstId) return;
    splitPayer.value = hasPrev ? prevPayerId : firstId;
  }

  function updateCustomAmountVisibility() {
    var fields = splitPersonList.querySelectorAll('.custom-amount');
    fields.forEach(function (f) {
      if (splitMode === 'custom') {
        f.classList.add('visible');
      } else {
        f.classList.remove('visible');
      }
    });
  }

  // ─── Split Mode Toggle ────────────────────
  function setSplitMode(mode) {
    splitMode = mode;
    if (mode === 'equal') {
      modeEqual.classList.add('active');
      modeCustom.classList.remove('active');
    } else {
      modeCustom.classList.add('active');
      modeEqual.classList.remove('active');
    }
    updateCustomAmountVisibility();
  }

  // ─── Calculate Split ──────────────────────
  function calculateSplit() {
    syncSplitPayerOptions();

    var billName = splitBillName.value.trim() || 'Split Bill';
    var totalText = splitTotal.value.replace(/,/g, '');
    var total = Number(totalText);

    if (!total || total <= 0) {
      splitTotal.classList.add('invalid');
      showToast('Masukkan total tagihan', 'error');
      return;
    }
    splitTotal.classList.remove('invalid');

    var rows = splitPersonList.querySelectorAll('.split-person-row');
    var people = [];

    rows.forEach(function (row, i) {
      var personId = row.dataset.personId || ('p-' + (i + 1));
      row.dataset.personId = personId;
      var nameInput = row.querySelector('.person-name-input');
      var name = nameInput.value.trim() || 'Peserta ' + (i + 1);
      var customAmt = 0;

      if (splitMode === 'custom') {
        var customAmtText = row.querySelector('.custom-amount').value.replace(/,/g, '');
        customAmt = Number(customAmtText) || 0;
      }

      people.push({ id: personId, name: name, customAmount: customAmt });
    });

    if (people.length < 2) {
      showToast('Minimal 2 peserta', 'error');
      return;
    }

    var payerId = splitPayer && splitPayer.value ? splitPayer.value : people[0].id;
    var payer = people.find(function (p) { return p.id === payerId; }) || people[0];
    payerId = payer.id;

    // Calculate shares
    var results = [];
    if (splitMode === 'equal') {
      var share = Math.round(total / people.length);
      var remainder = total - (share * people.length);
      people.forEach(function (p, i) {
        results.push({
          id: p.id,
          name: p.name,
          share: share + (i === 0 ? remainder : 0),
        });
      });
    } else {
      // Custom mode: validate totals
      var customTotal = people.reduce(function (s, p) { return s + p.customAmount; }, 0);
      if (customTotal !== total) {
        showToast('Total custom (Rp ' + customTotal.toLocaleString('en-US') + ') tidak sama dengan tagihan (Rp ' + total.toLocaleString('en-US') + ')', 'error');
        return;
      }
      people.forEach(function (p) {
        results.push({ id: p.id, name: p.name, share: p.customAmount });
      });
    }

    results = results.map(function (p) {
      var paid = p.id === payerId ? total : 0;
      return {
        id: p.id,
        name: p.name,
        share: p.share,
        paid: paid,
        net: paid - p.share,
      };
    });

    splitResults = {
      billName: billName,
      total: total,
      mode: splitMode,
      payerId: payerId,
      payerName: payer.name,
      people: results,
      date: getTodayString(),
    };

    showSplitResults();
  }

  // ─── Show Results ─────────────────────────
  function showSplitResults() {
    splitFormView.style.display = 'none';
    splitResultsView.style.display = 'block';

    splitResultSummary.innerHTML =
      '<div class="result-bill-name">' + escapeHtml(splitResults.billName) + '</div>' +
      '<div class="result-total">' + formatRupiah(splitResults.total) + '</div>' +
      '<div class="result-people-count">' + splitResults.people.length + ' peserta • ' +
        (splitResults.mode === 'equal' ? '<i class="ph-bold ph-scales"></i> Bagi Rata' : '<i class="ph-bold ph-pencil-simple"></i> Custom') + '</div>' +
      '<div class="result-payer">Dibayar oleh: ' + escapeHtml(splitResults.payerName) + '</div>';

    splitResultList.innerHTML = '';
    splitResults.people.forEach(function (p, i) {
      var color = AVATAR_COLORS[i % AVATAR_COLORS.length];
      var initials = p.name.split(' ').map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase();
      var settlementText = 'Lunas';
      var settlementClass = 'even';
      if (p.net > 0) {
        settlementText = 'Harus terima ' + formatRupiah(p.net);
        settlementClass = 'receive';
      } else if (p.net < 0) {
        settlementText = 'Harus bayar ' + formatRupiah(Math.abs(p.net));
        settlementClass = 'pay';
      }

      var item = document.createElement('div');
      item.className = 'split-result-item';
      item.style.animationDelay = (i * 0.06) + 's';
      item.innerHTML =
        '<div class="person-info">' +
          '<div class="person-avatar" style="background:' + color + '">' + initials + '</div>' +
          '<div class="person-text">' +
            '<span class="person-name">' + escapeHtml(p.name) + (p.id === splitResults.payerId ? ' (Pembayar)' : '') + '</span>' +
            '<span class="person-detail">Bayar: ' + formatRupiah(p.paid) + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="person-result">' +
          '<span class="person-share">Porsi: ' + formatRupiah(p.share) + '</span>' +
          '<span class="person-settlement ' + settlementClass + '">' + settlementText + '</span>' +
        '</div>';

      splitResultList.appendChild(item);
    });
  }

  // ─── Save Split to Expenses ───────────────
  function saveSplitToExpenses() {
    if (!splitResults) return;

    splitResults.people.forEach(function (p) {
      var expense = {
        id: generateId(),
        date: splitResults.date,
        title: splitResults.billName + ' (' + p.name + ')',
        category: 'Makanan',
        amount: p.share,
      };
      expenses.push(expense);
    });

    // Save to split history
    var historyEntry = {
      id: generateId(),
      date: splitResults.date,
      billName: splitResults.billName,
      total: splitResults.total,
      people: splitResults.people,
      mode: splitResults.mode,
      payerName: splitResults.payerName,
    };
    splitHistory.unshift(historyEntry);
    if (splitHistory.length > 20) splitHistory = splitHistory.slice(0, 20);
    localStorage.setItem(SPLIT_HISTORY_KEY, JSON.stringify(splitHistory));

    saveToStorage();
    renderTable();
    showToast('Split bill disimpan sebagai ' + splitResults.people.length + ' pengeluaran', 'success');
    closeSplitModal();
  }

  // ─── Split History ────────────────────────
  function loadSplitHistory() {
    try {
      var raw = localStorage.getItem(SPLIT_HISTORY_KEY);
      splitHistory = raw ? JSON.parse(raw) : [];
    } catch (e) {
      splitHistory = [];
    }
  }

  function renderSplitHistory() {
    splitHistoryList.innerHTML = '';

    if (splitHistory.length === 0) {
      splitHistoryList.innerHTML = '<p class="split-history-empty">Belum ada riwayat split</p>';
      return;
    }

    splitHistory.forEach(function (entry) {
      var payerText = entry.payerName ? (' • Dibayar: ' + escapeHtml(entry.payerName)) : '';
      var item = document.createElement('div');
      item.className = 'split-history-item';
      item.innerHTML =
        '<div>' +
          '<div class="hist-name">' + escapeHtml(entry.billName) + '</div>' +
          '<div class="hist-meta">' + formatDate(entry.date) + ' • ' + entry.people.length + ' peserta' + payerText + '</div>' +
        '</div>' +
        '<span class="hist-amount">' + formatRupiah(entry.total) + '</span>';
      splitHistoryList.appendChild(item);
    });
  }

  // ─── Split Bill Event Listeners ───────────
  btnOpenSplit.addEventListener('click', openSplitModal);
  btnCloseSplit.addEventListener('click', closeSplitModal);

  splitOverlay.addEventListener('click', function (e) {
    if (e.target === splitOverlay) closeSplitModal();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && splitOverlay.classList.contains('active')) {
      closeSplitModal();
    }
  });

  modeEqual.addEventListener('click', function () { setSplitMode('equal'); });
  modeCustom.addEventListener('click', function () { setSplitMode('custom'); });

  btnAddPerson.addEventListener('click', function () { addPersonRow(''); });

  btnCalculateSplit.addEventListener('click', calculateSplit);
  btnSaveSplit.addEventListener('click', saveSplitToExpenses);

  btnBackSplit.addEventListener('click', function () {
    splitFormView.style.display = 'block';
    splitResultsView.style.display = 'none';
  });

  // ─── Budget Modal Event Listeners ─────────
  btnEditBudget.addEventListener('click', function () {
    var b = getBudgetLimit();
    inputBudgetLimit.value = b ? b.toLocaleString('en-US') : '';
    budgetOverlay.classList.add('active');
  });

  btnCancelBudget.addEventListener('click', function () {
    budgetOverlay.classList.remove('active');
  });

  btnSaveBudget.addEventListener('click', function () {
    var val = Number(inputBudgetLimit.value.replace(/,/g, ''));
    saveBudgetLimit(val);
    budgetOverlay.classList.remove('active');
    updateHero();
    showToast('Batas bulanan berhasil disimpan', 'success');
  });

  budgetOverlay.addEventListener('click', function (e) {
    if (e.target === budgetOverlay) budgetOverlay.classList.remove('active');
  });

  if (btnEditCategoryBudget) {
    btnEditCategoryBudget.addEventListener('click', openCategoryBudgetModal);
  }

  if (btnCancelCategoryBudget) {
    btnCancelCategoryBudget.addEventListener('click', closeCategoryBudgetModal);
  }

  if (btnSaveCategoryBudget) {
    btnSaveCategoryBudget.addEventListener('click', saveCategoryBudgetFromEditor);
  }

  if (categoryBudgetOverlay) {
    categoryBudgetOverlay.addEventListener('click', function (e) {
      if (e.target === categoryBudgetOverlay) closeCategoryBudgetModal();
    });
  }
  
  // ─── Input Formatting ───────────────────
  function formatInputCurrency(e) {
    var value = e.target.value.replace(/\D/g, "");
    if (value !== "") {
      e.target.value = Number(value).toLocaleString('en-US');
    } else {
      e.target.value = "";
    }
  }

  inputAmount.addEventListener('input', formatInputCurrency);
  inputBudgetLimit.addEventListener('input', formatInputCurrency);
  splitTotal.addEventListener('input', formatInputCurrency);

  inputTitle.addEventListener('input', function(e) {
    var val = e.target.value.trim().toLowerCase();
    if (!val) return;
    
    var match = null;
    for (var i = expenses.length - 1; i >= 0; i--) {
      if (expenses[i].title.toLowerCase() === val) {
        match = expenses[i];
        break; // take latest
      }
    }

    if (match) {
      // auto-fill type
      var typeRadio = document.querySelector('input[name="input-type"][value="' + match.type + '"]');
      if (typeRadio) {
        typeRadio.checked = true;
      }
      // auto-fill wallet & category
      if (match.wallet) inputWallet.value = match.wallet;
      if (match.category) inputCategory.value = match.category;
    }
  });

  for (var i = 0; i < inputTypeRadios.length; i++) {
    inputTypeRadios[i].addEventListener('change', function(e) {
      if (e.target.value === 'transfer') {
        groupWalletTo.style.display = 'flex';
        groupCategory.style.display = 'none';
        labelWallet.textContent = 'Dari Dompet';
        inputCategory.removeAttribute('required');
        inputWalletTo.setAttribute('required', 'required');
      } else {
        groupWalletTo.style.display = 'none';
        groupCategory.style.display = 'flex';
        labelWallet.textContent = 'Sumber Dana';
        inputCategory.setAttribute('required', 'required');
        inputWalletTo.removeAttribute('required');
      }
    });
  }

  splitPersonList.addEventListener('input', function(e) {
    if (e.target.classList.contains('custom-amount')) {
      formatInputCurrency(e);
    }
    if (e.target.classList.contains('person-name-input')) {
      syncSplitPayerOptions();
    }
  });

  // ─── Custom Categories ────────────────────
  function loadCustomCategories() {
    try {
      var raw = localStorage.getItem(CUSTOM_CAT_KEY);
      customCategories = raw ? JSON.parse(raw) : [];
      
      var optExpense = document.getElementById('optgroup-expense');
      var optIncome = document.getElementById('optgroup-income');

      customCategories.forEach(function(cat) {
        CATEGORY_COLORS[cat.name] = cat.color;
        CATEGORY_ICONS[cat.name] = cat.icon;

        var opt = document.createElement('option');
        opt.value = cat.name;
        opt.textContent = cat.name;

        var filterOpt = opt.cloneNode(true);
        filterCategory.appendChild(filterOpt);

        if (cat.type === 'expense') {
          if(optExpense) optExpense.appendChild(opt);
        } else {
          if(optIncome) optIncome.appendChild(opt);
        }
      });
    } catch (e) {
      customCategories = [];
    }
  }

  function renderIconSelector() {
    iconSelector.innerHTML = '';
    AVAILABLE_ICONS.forEach(function(iconCls) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'icon-btn';
      if (inputCustomCatIcon.value === iconCls) {
        btn.classList.add('selected');
      }
      btn.innerHTML = '<i class="ph-bold ' + iconCls + '"></i>';

      btn.addEventListener('click', function() {
        inputCustomCatIcon.value = iconCls;
        renderIconSelector(); // refresh selection state
      });

      iconSelector.appendChild(btn);
    });
  }

  if (btnAddCategory) {
    btnAddCategory.addEventListener('click', function() {
      if (!inputCustomCatIcon.value || inputCustomCatIcon.value === "") {
        inputCustomCatIcon.value = AVAILABLE_ICONS[0];
      }
      renderIconSelector();
      inputCustomCatName.value = '';
      categoryOverlay.classList.add('active');
    });
  }

  if (btnCancelCategory) {
    btnCancelCategory.addEventListener('click', function() {
      categoryOverlay.classList.remove('active');
    });
  }

  if (btnSaveCategory) {
    btnSaveCategory.addEventListener('click', function() {
      var catName = inputCustomCatName.value.trim();
      var catType = inputCustomCatType.value;
      var catIcon = inputCustomCatIcon.value;

      if (!catName) {
        showToast('Nama kategori tidak boleh kosong', 'error');
        return;
      }
      
      // Select a random color for this category
      var randIndex = Math.floor(Math.random() * AVAILABLE_COLORS.length);
      var catColor = AVAILABLE_COLORS[randIndex] || '#0ea5e9';
      
      var fullIconString = '<i class="ph-fill ' + catIcon + '"></i>';
      var newCat = {
        id: generateId(),
        name: catName,
        type: catType,
        icon: fullIconString,
        color: catColor
      };

      customCategories.push(newCat);
      saveCustomCategories();

      CATEGORY_COLORS[newCat.name] = newCat.color;
      CATEGORY_ICONS[newCat.name] = newCat.icon;

      var opt = document.createElement('option');
      opt.value = newCat.name;
      opt.textContent = newCat.name;

      var filterOpt = opt.cloneNode(true);
      filterCategory.appendChild(filterOpt);

      if (newCat.type === 'expense') {
        document.getElementById('optgroup-expense').appendChild(opt);
      } else {
        document.getElementById('optgroup-income').appendChild(opt);
      }

      inputCategory.value = newCat.name;
      categoryOverlay.classList.remove('active');
      renderCategoryBudgetSummary();
      if (categoryBudgetOverlay && categoryBudgetOverlay.classList.contains('active')) {
        renderCategoryBudgetEditor();
      }
      showToast('Kategori baru ditambahkan', 'success');
    });
  }

  var pendingRecurring = [];

  // ─── Automated Recurring Expenses ─────────
  function processRecurringExpenses() {
    var todayStr = getTodayString();
    var todayObj = new Date(todayStr);
    pendingRecurring = [];

    recurringExpenses.forEach(function(rec) {
      if (!rec.nextDate) return;
      var nextDateObj = new Date(rec.nextDate);
      
      while (nextDateObj <= todayObj) {
        pendingRecurring.push({
          recRef: rec,
          expenseData: {
            id: generateId(),
            type: rec.type,
            wallet: rec.wallet,
            date: nextDateObj.toISOString().split('T')[0],
            title: rec.title,
            category: rec.category,
            amount: rec.amount
          }
        });
        nextDateObj.setMonth(nextDateObj.getMonth() + 1);
      }
    });

    if (pendingRecurring.length > 0) {
      showRecurringPrompt();
    }
  }

  function showRecurringPrompt() {
    var recurringOverlay = document.getElementById('recurring-overlay');
    var recurringList = document.getElementById('recurring-list');
    var btnConfirm = document.getElementById('btn-confirm-recurring');
    var btnCancel = document.getElementById('btn-cancel-recurring');

    if (!recurringOverlay || !recurringList) return;

    recurringList.innerHTML = '';
    pendingRecurring.forEach(function(item) {
      var div = document.createElement('div');
      div.style.marginBottom = '8px';
      div.innerHTML = '<strong>' + escapeHtml(item.expenseData.title) + '</strong><br>' +
                      '<span style="font-size:0.8rem; opacity:0.8">' + formatDate(item.expenseData.date) + ' - ' + formatRupiah(item.expenseData.amount) + '</span>';
      recurringList.appendChild(div);
    });

    // Handle Confirm
    btnConfirm.onclick = function() {
      var updated = false;
      pendingRecurring.forEach(function(item) {
        expenses.push(item.expenseData);
        var currentNextDateObj = new Date(item.expenseData.date);
        currentNextDateObj.setMonth(currentNextDateObj.getMonth() + 1);
        item.recRef.nextDate = currentNextDateObj.toISOString().split('T')[0];
        updated = true;
      });
      if (updated) {
        saveToStorage();
        saveRecurringToStorage();
        renderTable();
        showToast('Tagihan otomatis berhasil dicatat!', 'success');
      }
      recurringOverlay.classList.remove('active');
    };

    // Handle Skip
    btnCancel.onclick = function() {
      var updated = false;
      pendingRecurring.forEach(function(item) {
        var currentNextDateObj = new Date(item.expenseData.date);
        currentNextDateObj.setMonth(currentNextDateObj.getMonth() + 1);
        item.recRef.nextDate = currentNextDateObj.toISOString().split('T')[0];
        updated = true;
      });
      if (updated) {
        saveRecurringToStorage();
      }
      recurringOverlay.classList.remove('active');
    };

    recurringOverlay.classList.add('active');
  }

  // ─── Goal Tracking (Tabungan Impian) ─────
  function renderGoals() {
    if (!goalListEl) return;
    goalListEl.innerHTML = '';
    
    // Calculate current amounts for each goal based on transfer transactions
    var goalBalances = {};
    expenses.forEach(function(e) {
      if (e.type === 'transfer' && e.walletTo && e.walletTo.startsWith('Goal-')) {
        var gid = e.walletTo.replace('Goal-', '');
        goalBalances[gid] = (goalBalances[gid] || 0) + e.amount;
      }
    });

    if (goals.length === 0) {
      goalListEl.innerHTML =
        '<div class="goal-empty">Belum ada tabungan impian.' +
        '<span class="goal-empty-hint">Buat goal baru untuk mulai menabung.</span>' +
        '</div>';
      return;
    }

    goals.forEach(function(g) {
      var current = goalBalances[g.id] || 0;
      var safeTarget = g.target > 0 ? g.target : 1;
      var pctValue = Math.min((current / safeTarget) * 100, 100);
      var pct = pctValue.toFixed(1);
      
      var card = document.createElement('article');
      card.className = 'goal-item';
      
      card.innerHTML = 
        '<div class="goal-item-header">' +
          '<div class="goal-item-name">' + escapeHtml(g.name) + '</div>' +
          '<div class="goal-item-amount">' + formatRupiah(current) + ' / ' + formatRupiah(g.target) + '</div>' +
        '</div>' +
        '<div class="goal-progress-track">' +
          '<div class="goal-progress-fill" style="width: ' + pct + '%;"></div>' +
        '</div>' +
        '<div class="goal-item-footer">' +
          '<div class="goal-progress-label">' + pct + '% Tercapai</div>' +
          '<div class="goal-action-group">' +
            '<button class="btn btn-sm btn-ghost btn-fund-goal" data-id="' + g.id + '" type="button"><i class="ph-bold ph-piggy-bank"></i> Isi Dana</button>' +
            '<button class="btn btn-sm btn-ghost btn-del-goal" data-id="' + g.id + '" type="button" aria-label="Hapus goal"><i class="ph-bold ph-trash"></i></button>' +
          '</div>' +
        '</div>';
      
      goalListEl.appendChild(card);
    });

    var fundBtns = goalListEl.querySelectorAll('.btn-fund-goal');
    fundBtns.forEach(function(b) {
      b.addEventListener('click', function() {
        var gid = this.dataset.id;
        var goal = goals.find(function(g) { return g.id === gid; });
        if(goal) {
          inputGoalFundId.value = gid;
          goalFundSubtitle.textContent = 'Menabung untuk: ' + goal.name;
          inputGoalFundAmount.value = '';
          goalFundOverlay.classList.add('active');
        }
      });
    });

    var delBtns = goalListEl.querySelectorAll('.btn-del-goal');
    delBtns.forEach(function(b) {
      b.addEventListener('click', function() {
        var gid = this.dataset.id;
        if(confirm('Hapus tabungan impian ini? (Dana yang sudah dialokasikan tidak akan kembali ke dompet secara otomatis)')) {
          goals = goals.filter(function(g) { return g.id !== gid; });
          saveGoalsToStorage();
          renderGoals();
          showToast('Tabungan impian dihapus', 'info');
        }
      });
    });
  }

  if (btnAddGoal) {
    btnAddGoal.addEventListener('click', function() {
      inputGoalName.value = '';
      inputGoalTarget.value = '';
      goalAddOverlay.classList.add('active');
    });
  }

  if (btnCancelGoal) {
    btnCancelGoal.addEventListener('click', function() {
      goalAddOverlay.classList.remove('active');
    });
  }

  if (btnSaveGoal) {
    btnSaveGoal.addEventListener('click', function() {
      var name = inputGoalName.value.trim();
      var target = Number(inputGoalTarget.value.replace(/,/g, ''));
      if (!name || !target) {
        showToast('Lengkapi nama dan target dana', 'error');
        return;
      }
      
      goals.push({ id: generateId(), name: name, target: target });
      saveGoalsToStorage();
      renderGoals();
      goalAddOverlay.classList.remove('active');
      showToast('Tabungan impian ditambahkan', 'success');
    });
  }

  if (btnCancelGoalFund) {
    btnCancelGoalFund.addEventListener('click', function() {
      goalFundOverlay.classList.remove('active');
    });
  }

  if (btnSaveGoalFund) {
    btnSaveGoalFund.addEventListener('click', function() {
      var gid = inputGoalFundId.value;
      var amt = Number(inputGoalFundAmount.value.replace(/,/g, ''));
      var src = inputGoalFundSource.value;
      
      if (!amt || amt <= 0) {
        showToast('Nominal tidak valid', 'error');
        return;
      }
      
      var goal = goals.find(function(g) { return g.id === gid; });
      if(!goal) return;

      var data = {
        id: generateId(),
        type: 'transfer',
        wallet: src,
        walletTo: 'Goal-' + gid,
        date: getTodayString(),
        title: 'Tabungan: ' + goal.name,
        category: 'Transfer',
        amount: amt
      };
      
      expenses.push(data);
      saveToStorage();
      renderTable();
      renderGoals();
      
      goalFundOverlay.classList.remove('active');
      showToast('Dana berhasil dialokasikan', 'success');
    });
  }
  
  if (inputGoalTarget) inputGoalTarget.addEventListener('input', formatInputCurrency);
  if (inputGoalFundAmount) inputGoalFundAmount.addEventListener('input', formatInputCurrency);

  // ─── Init ─────────────────────────────────
  function init() {
    loadRecurringFromStorage();
    expenses = getFromStorage(); // Must load expenses before processing recurring
    loadGoalsFromStorage();
    processRecurringExpenses();
    isPerfLite = detectPerfLite(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    applyPerformanceMode(isPerfLite);
    
    setTheme(getTheme());
    loadCustomCategories();
    loadCategoryBudgets();
    inputDate.value = getTodayString();
    inputDate.max = getTodayString();
    loadFilters();
    updateUndoIndicator();
    loadSplitHistory();
    initVisualEffects();
    renderTable();
    renderGoals();

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('./service-worker.js').then(function(reg) {
          console.log('ServiceWorker registration successful with scope: ', reg.scope);
        }).catch(function(err) {
          console.log('ServiceWorker registration failed: ', err);
        });
      });
    }
  }

  init();
})();
