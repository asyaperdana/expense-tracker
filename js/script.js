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
  var SPLIT_HISTORY_KEY = 'expense_tracker_split_history';
  var CUSTOM_CAT_KEY = 'expense_tracker_custom_cat';
  var RECURRING_KEY = 'expense_tracker_recurring';

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
  var inputCategory = document.getElementById('input-category');
  var inputAmount = document.getElementById('input-amount');
  var inputTypeRadios = document.getElementsByName('input-type');
  var inputWallet = document.getElementById('input-wallet');
  var btnSubmit = document.getElementById('btn-submit');
  var btnCancel = document.getElementById('btn-cancel');
  var tbody = document.getElementById('expense-tbody');
  var totalIncomeEl = document.getElementById('total-income');
  var totalExpenseEl = document.getElementById('total-expense');
  var totalCountEl = document.getElementById('total-count');
  var topCategoryEl = document.getElementById('top-category');
  
  var totalBalanceEl = document.getElementById('total-balance');
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

  var inputRecurring = document.getElementById('input-recurring');

  // ─── State ────────────────────────────────
  var expenses = [];
  var customCategories = [];
  var recurringExpenses = [];
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

  // ─── Calculate Total ─────────────────────
  function calculateTotal(data) {
    return data.reduce(function (res, item) {
      if (item.type === 'income') {
        res.income += item.amount;
      } else {
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

  // ─── Budget Logic ──────────────────────────
  function getBudgetLimit() {
    return Number(localStorage.getItem(BUDGET_KEY)) || 0;
  }
  
  function saveBudgetLimit(val) {
    localStorage.setItem(BUDGET_KEY, val);
  }

  // ─── Update Hero (Balance & Budget) ──────
  function updateHero() {
    var totals = calculateTotal(expenses);
    totalBalanceEl.textContent = formatRupiah(totals.balance);

    // Calculate this month's expense
    var today = new Date();
    var yyyy = today.getFullYear();
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var currentMonth = yyyy + '-' + mm;
    
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

  // ─── Get Filtered Data ───────────────────
  function getFilteredData() {
    var selectedCat = filterCategory.value;
    var selectedMonth = filterMonth.value; // YYYY-MM or ""
    var selectedSort = filterSort.value || 'date-desc';

    var filtered = expenses.filter(function (e) {
      var catMatch = selectedCat === 'Semua' || e.category === selectedCat;
      var monthMatch = !selectedMonth || e.date.substring(0, 7) === selectedMonth;
      return catMatch && monthMatch;
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
      tr.classList.add('row-animate');
      tr.style.animationDelay = (index * 0.04) + 's';
      tr.dataset.id = item.id;

      var isIncome = item.type === 'income';
      var indicatorHtml = isIncome ? '<span style="color:var(--clr-success)"><i class="ph-bold ph-arrow-down-left"></i> Pemasukan</span>' : '<span style="color:var(--clr-danger)"><i class="ph-bold ph-arrow-up-right"></i> Pengeluaran</span>';
      
      tr.innerHTML =
        '<td data-label="Tanggal">' + formatDate(item.date) + '</td>' +
        '<td data-label="Tipe & Nama"><div style="font-weight:600">' + escapeHtml(item.title) + '</div><div style="font-size:0.75rem">' + indicatorHtml + '</div></td>' +
        '<td data-label="Kategori & Dompet"><span class="badge">' + (CATEGORY_ICONS[item.category] || '') + ' ' + escapeHtml(item.category) + '</span><div style="font-size:0.75rem; margin-top:4px; opacity:0.7;"><i class="ph-fill ph-wallet"></i> ' + escapeHtml(item.wallet || 'Tunai') + '</div></td>' +
        '<td class="text-right" data-label="Nominal"><span class="amount ' + (isIncome ? 'text-success' : '') + '" style="font-weight:600">' + (isIncome ? '+' : '-') + formatRupiah(item.amount) + '</span></td>' +
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

    if (!data || data.length === 0) {
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
      if (item.type !== 'income') {
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
    if (!inputCategory.value) {
      inputCategory.classList.add('invalid');
      categoryHelp.textContent = 'Kategori wajib diisi';
      valid = false;
    } else {
      categoryHelp.textContent = '';
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

    inputRecurring.checked = false;
    document.querySelector('.checkbox-group').style.display = 'flex'; // show when adding

    btnSubmit.disabled = false;
    btnSubmit.classList.remove('is-loading');
    btnSubmit.innerHTML = '<i class="ph-bold ph-plus-circle btn-icon"></i> Simpan';
    btnCancel.style.display = 'none';

    [inputDate, inputTitle, inputCategory, inputAmount, inputWallet].forEach(function (f) {
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
      date: inputDate.value,
      title: inputTitle.value.trim(),
      category: inputCategory.value,
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
    filterCategory.value = 'Semua';
    filterMonth.value = '';
    filterSort.value = 'date-desc';
    localStorage.removeItem(FILTER_KEY);
    renderTable();
    showToast('Filter direset', 'info');
  }

  function saveFilters() {
    var payload = {
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
    var value = Number(inputAmount.value);
    if (!inputAmount.value || value <= 0) {
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
  chartCanvas.addEventListener('mousemove', handleChartHover);
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
  });

  // ─── Handle canvas DPI for retina ────────
  function setupCanvas() {
    var dpr = window.devicePixelRatio || 1;
    var rect = chartCanvas.getBoundingClientRect();
    var displaySize = 280;
    chartCanvas.style.width = displaySize + 'px';
    chartCanvas.style.height = displaySize + 'px';
    chartCanvas.width = displaySize * dpr;
    chartCanvas.height = displaySize * dpr;
    var ctx = chartCanvas.getContext('2d');
    ctx.scale(dpr, dpr);
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
    modeEqual.classList.add('active');
    modeCustom.classList.remove('active');
    splitPersonList.innerHTML = '';
    // Add 2 default persons
    addPersonRow('');
    addPersonRow('');
    updateCustomAmountVisibility();
  }

  // ─── Person Rows ──────────────────────────
  function addPersonRow(name) {
    var row = document.createElement('div');
    row.className = 'split-person-row';
    row.innerHTML =
      '<input type="text" class="person-name-input" placeholder="Nama peserta" value="' + escapeHtml(name || '') + '" />' +
      '<input type="number" class="custom-amount' + (splitMode === 'custom' ? ' visible' : '') + '" placeholder="Nominal" min="0" step="1" inputmode="numeric" />' +
      '<button class="btn-remove-person" title="Hapus" type="button">×</button>';

    // Remove button
    row.querySelector('.btn-remove-person').addEventListener('click', function () {
      if (splitPersonList.children.length > 2) {
        row.remove();
      } else {
        showToast('Minimal 2 peserta', 'error');
      }
    });

    splitPersonList.appendChild(row);
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
      var nameInput = row.querySelector('.person-name-input');
      var name = nameInput.value.trim() || 'Peserta ' + (i + 1);
      var customAmt = 0;

      if (splitMode === 'custom') {
        var customAmtText = row.querySelector('.custom-amount').value.replace(/,/g, '');
        customAmt = Number(customAmtText) || 0;
      }

      people.push({ name: name, customAmount: customAmt });
    });

    if (people.length < 2) {
      showToast('Minimal 2 peserta', 'error');
      return;
    }

    // Calculate shares
    var results = [];
    if (splitMode === 'equal') {
      var share = Math.round(total / people.length);
      var remainder = total - (share * people.length);
      people.forEach(function (p, i) {
        results.push({
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
        results.push({ name: p.name, share: p.customAmount });
      });
    }

    splitResults = {
      billName: billName,
      total: total,
      mode: splitMode,
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
        (splitResults.mode === 'equal' ? '<i class="ph-bold ph-scales"></i> Bagi Rata' : '<i class="ph-bold ph-pencil-simple"></i> Custom') + '</div>';

    splitResultList.innerHTML = '';
    splitResults.people.forEach(function (p, i) {
      var color = AVATAR_COLORS[i % AVATAR_COLORS.length];
      var initials = p.name.split(' ').map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase();

      var item = document.createElement('div');
      item.className = 'split-result-item';
      item.style.animationDelay = (i * 0.06) + 's';
      item.innerHTML =
        '<div class="person-info">' +
          '<div class="person-avatar" style="background:' + color + '">' + initials + '</div>' +
          '<span class="person-name">' + escapeHtml(p.name) + '</span>' +
        '</div>' +
        '<span class="person-share">' + formatRupiah(p.share) + '</span>';

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
      var item = document.createElement('div');
      item.className = 'split-history-item';
      item.innerHTML =
        '<div>' +
          '<div class="hist-name">' + escapeHtml(entry.billName) + '</div>' +
          '<div class="hist-meta">' + formatDate(entry.date) + ' • ' + entry.people.length + ' peserta</div>' +
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

  splitPersonList.addEventListener('input', function(e) {
    if (e.target.classList.contains('custom-amount')) {
      formatInputCurrency(e);
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
      showToast('Kategori baru ditambahkan', 'success');
    });
  }

  // ─── Automated Recurring Expenses ─────────
  function processRecurringExpenses() {
    var todayStr = getTodayString();
    var todayObj = new Date(todayStr);
    var updated = false;

    recurringExpenses.forEach(function(rec) {
      if (!rec.nextDate) return;
      var nextDateObj = new Date(rec.nextDate);
      
      while (nextDateObj <= todayObj) {
        var expense = {
          id: generateId(),
          type: rec.type,
          wallet: rec.wallet,
          date: nextDateObj.toISOString().split('T')[0],
          title: rec.title,
          category: rec.category,
          amount: rec.amount
        };
        expenses.push(expense);
        
        // advance 1 month
        nextDateObj.setMonth(nextDateObj.getMonth() + 1);
        rec.nextDate = nextDateObj.toISOString().split('T')[0];
        updated = true;
      }
    });

    if (updated) {
      saveToStorage();
      saveRecurringToStorage();
    }
  }

  // ─── Init ─────────────────────────────────
  function init() {
    loadRecurringFromStorage();
    expenses = getFromStorage(); // Must load expenses before processing recurring
    processRecurringExpenses();
    
    setTheme(getTheme());
    loadCustomCategories();
    inputDate.value = getTodayString();
    inputDate.max = getTodayString();
    loadFilters();
    updateUndoIndicator();
    setupCanvas();
    loadSplitHistory();
    renderTable();
  }

  init();
})();
