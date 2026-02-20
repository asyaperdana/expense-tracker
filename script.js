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

  var CATEGORY_COLORS = {
    Makanan: '#f97316',
    Transport: '#3b82f6',
    Belanja: '#8b5cf6',
    Hiburan: '#ec4899',
    Kesehatan: '#10b981',
    Pendidikan: '#f59e0b',
    Tagihan: '#6366f1',
    Lainnya: '#64748b',
  };

  var CATEGORY_ICONS = {
    Makanan: '🍔',
    Transport: '🚗',
    Belanja: '🛒',
    Hiburan: '🎬',
    Kesehatan: '💊',
    Pendidikan: '📚',
    Tagihan: '📄',
    Lainnya: '📦',
  };

  // ─── DOM References ───────────────────────
  var form = document.getElementById('expense-form');
  var inputDate = document.getElementById('input-date');
  var inputTitle = document.getElementById('input-title');
  var inputCategory = document.getElementById('input-category');
  var inputAmount = document.getElementById('input-amount');
  var btnSubmit = document.getElementById('btn-submit');
  var btnCancel = document.getElementById('btn-cancel');
  var tbody = document.getElementById('expense-tbody');
  var totalAmountEl = document.getElementById('total-amount');
  var totalCountEl = document.getElementById('total-count');
  var avgPerDayEl = document.getElementById('avg-per-day');
  var topCategoryEl = document.getElementById('top-category');
  var emptyState = document.getElementById('empty-state');
  var filterCategory = document.getElementById('filter-category');
  var filterMonth = document.getElementById('filter-month');
  var btnResetFilter = document.getElementById('btn-reset-filter');
  var btnExportCsv = document.getElementById('btn-export-csv');
  var modalOverlay = document.getElementById('modal-overlay');
  var btnConfirmDelete = document.getElementById('btn-confirm-delete');
  var btnCancelDelete = document.getElementById('btn-cancel-delete');
  var btnThemeToggle = document.getElementById('btn-theme-toggle');
  var themeIcon = document.getElementById('theme-icon');
  var chartCanvas = document.getElementById('category-chart');
  var chartLegend = document.getElementById('chart-legend');
  var chartEmpty = document.getElementById('chart-empty');
  var toastContainer = document.getElementById('toast-container');

  // ─── State ────────────────────────────────
  var expenses = [];
  var editingId = null;
  var deleteTargetId = null;

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

  // ─── Theme (Dark Mode) ───────────────────
  function getTheme() {
    return localStorage.getItem(THEME_KEY) || 'light';
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  function toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme') || 'light';
    setTheme(current === 'dark' ? 'light' : 'dark');
  }

  // ─── Toast Notifications ─────────────────
  function showToast(message, type) {
    type = type || 'success';
    var icons = { success: '✅', error: '❌', info: 'ℹ️' };
    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.innerHTML =
      '<span class="toast-icon">' + (icons[type] || '✅') + '</span>' +
      '<span>' + escapeHtml(message) + '</span>';
    toastContainer.appendChild(toast);

    setTimeout(function () {
      toast.classList.add('toast-out');
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 2500);
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
    return data.reduce(function (sum, item) {
      return sum + item.amount;
    }, 0);
  }

  // ─── Update Summary ──────────────────────
  function updateSummary(filteredData) {
    var total = calculateTotal(filteredData);
    totalAmountEl.textContent = formatRupiah(total);
    totalCountEl.textContent = filteredData.length;

    // Pulse animation
    [totalAmountEl, totalCountEl, avgPerDayEl, topCategoryEl].forEach(function (el) {
      el.classList.remove('pulse');
      void el.offsetWidth; // reflow
      el.classList.add('pulse');
    });

    // Average per day
    if (filteredData.length > 0) {
      var dates = {};
      filteredData.forEach(function (item) {
        dates[item.date] = true;
      });
      var uniqueDays = Object.keys(dates).length;
      avgPerDayEl.textContent = formatRupiah(Math.round(total / uniqueDays));
    } else {
      avgPerDayEl.textContent = 'Rp 0';
    }

    // Top category
    if (filteredData.length > 0) {
      var catTotals = {};
      filteredData.forEach(function (item) {
        catTotals[item.category] = (catTotals[item.category] || 0) + item.amount;
      });
      var topCat = '';
      var topVal = 0;
      Object.keys(catTotals).forEach(function (cat) {
        if (catTotals[cat] > topVal) {
          topVal = catTotals[cat];
          topCat = cat;
        }
      });
      topCategoryEl.textContent = (CATEGORY_ICONS[topCat] || '') + ' ' + topCat;
    } else {
      topCategoryEl.textContent = '—';
    }
  }

  // ─── Get Filtered Data ───────────────────
  function getFilteredData() {
    var selectedCat = filterCategory.value;
    var selectedMonth = filterMonth.value; // YYYY-MM or ""

    return expenses.filter(function (e) {
      var catMatch = selectedCat === 'Semua' || e.category === selectedCat;
      var monthMatch = !selectedMonth || e.date.substring(0, 7) === selectedMonth;
      return catMatch && monthMatch;
    });
  }

  // ─── Render Table ─────────────────────────
  function renderTable() {
    var data = getFilteredData();

    // Sort by date desc
    data.sort(function (a, b) {
      return b.date.localeCompare(a.date);
    });

    tbody.innerHTML = '';

    if (data.length === 0) {
      emptyState.classList.add('visible');
      updateSummary(data);
      renderChart(data);
      return;
    }

    emptyState.classList.remove('visible');

    data.forEach(function (item, index) {
      var tr = document.createElement('tr');
      tr.classList.add('row-animate');
      tr.style.animationDelay = (index * 0.04) + 's';
      tr.dataset.id = item.id;

      tr.innerHTML =
        '<td>' + formatDate(item.date) + '</td>' +
        '<td>' + escapeHtml(item.title) + '</td>' +
        '<td><span class="badge">' + (CATEGORY_ICONS[item.category] || '') + ' ' + escapeHtml(item.category) + '</span></td>' +
        '<td class="text-right"><span class="amount">' + formatRupiah(item.amount) + '</span></td>' +
        '<td class="text-center">' +
          '<div class="action-group">' +
            '<button class="btn btn-sm btn-edit" data-action="edit" data-id="' + item.id + '" title="Edit">✏️ Edit</button>' +
            '<button class="btn btn-sm btn-delete" data-action="delete" data-id="' + item.id + '" title="Hapus">🗑️ Hapus</button>' +
          '</div>' +
        '</td>';

      tbody.appendChild(tr);
    });

    updateSummary(data);
    renderChart(data);
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
    var size = chartCanvas.width;
    var center = size / 2;
    var outerRadius = center - 10;
    var innerRadius = outerRadius * 0.58;

    ctx.clearRect(0, 0, size, size);
    chartLegend.innerHTML = '';

    if (!data || data.length === 0) {
      chartEmpty.classList.add('visible');
      chartCanvas.style.display = 'none';
      chartLegend.style.display = 'none';
      return;
    }

    chartEmpty.classList.remove('visible');
    chartCanvas.style.display = 'block';
    chartLegend.style.display = 'flex';

    // Aggregate by category
    var catTotals = {};
    var total = 0;
    data.forEach(function (item) {
      catTotals[item.category] = (catTotals[item.category] || 0) + item.amount;
      total += item.amount;
    });

    var categories = Object.keys(catTotals).sort(function (a, b) {
      return catTotals[b] - catTotals[a];
    });

    // Draw slices
    var startAngle = -Math.PI / 2;
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
    ctx.fillStyle = getComputedStyle(document.body).color || '#1a1d26';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 1.1rem Inter, sans-serif';
    ctx.fillText(formatRupiah(total), center, center - 8);
    ctx.font = '400 0.7rem Inter, sans-serif';
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--clr-text-secondary') || '#6b7280';
    ctx.fillText('Total', center, center + 14);
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
      valid = false;
    }
    if (!inputTitle.value.trim()) {
      inputTitle.classList.add('invalid');
      valid = false;
    }
    if (!inputCategory.value) {
      inputCategory.classList.add('invalid');
      valid = false;
    }
    if (!inputAmount.value || Number(inputAmount.value) <= 0) {
      inputAmount.classList.add('invalid');
      valid = false;
    }

    return valid;
  }

  // ─── Reset Form ───────────────────────────
  function resetForm() {
    form.reset();
    inputDate.value = getTodayString();
    editingId = null;
    btnSubmit.innerHTML = '<span class="btn-icon">＋</span> Simpan';
    btnCancel.style.display = 'none';

    [inputDate, inputTitle, inputCategory, inputAmount].forEach(function (f) {
      f.classList.remove('invalid');
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

    var data = {
      id: editingId || generateId(),
      date: inputDate.value,
      title: inputTitle.value.trim(),
      category: inputCategory.value,
      amount: Number(inputAmount.value),
    };

    if (editingId) {
      expenses = expenses.map(function (item) {
        return item.id === editingId ? data : item;
      });
      showToast('Pengeluaran berhasil diperbarui', 'success');
    } else {
      expenses.push(data);
      showToast('Pengeluaran berhasil ditambahkan', 'success');
    }

    saveToStorage();
    renderTable();
    resetForm();
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
    inputAmount.value = item.amount;
    btnSubmit.innerHTML = '<span class="btn-icon">✓</span> Update';
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
    expenses = expenses.filter(function (e) {
      return e.id !== deleteTargetId;
    });
    saveToStorage();
    renderTable();
    hideDeleteConfirm();
    showToast('Pengeluaran berhasil dihapus', 'error');
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

  // ─── Reset Filters ──────────────────────
  function resetFilters() {
    filterCategory.value = 'Semua';
    filterMonth.value = '';
    renderTable();
    showToast('Filter direset', 'info');
  }

  // ─── Event Listeners ─────────────────────
  form.addEventListener('submit', handleSubmit);

  btnCancel.addEventListener('click', function () {
    resetForm();
  });

  tbody.addEventListener('click', handleTableClick);

  filterCategory.addEventListener('change', function () {
    renderTable();
  });

  filterMonth.addEventListener('change', function () {
    renderTable();
  });

  btnResetFilter.addEventListener('click', resetFilters);
  btnExportCsv.addEventListener('click', exportCSV);

  btnConfirmDelete.addEventListener('click', confirmDelete);
  btnCancelDelete.addEventListener('click', hideDeleteConfirm);

  btnThemeToggle.addEventListener('click', toggleTheme);

  // Close modal on overlay click
  modalOverlay.addEventListener('click', function (e) {
    if (e.target === modalOverlay) {
      hideDeleteConfirm();
    }
  });

  // Close modal on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
      hideDeleteConfirm();
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
      '<input type="number" class="custom-amount' + (splitMode === 'custom' ? ' visible' : '') + '" placeholder="Nominal" min="0" />' +
      '<button class="btn-remove-person" title="Hapus">×</button>';

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
    var total = Number(splitTotal.value);

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
        customAmt = Number(row.querySelector('.custom-amount').value) || 0;
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
        showToast('Total custom (Rp ' + customTotal.toLocaleString('id-ID') + ') tidak sama dengan total tagihan (Rp ' + total.toLocaleString('id-ID') + ')', 'error');
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
        (splitResults.mode === 'equal' ? '⚖️ Bagi Rata' : '✏️ Custom') + '</div>';

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

  // ─── Init ─────────────────────────────────
  function init() {
    setTheme(getTheme());
    inputDate.value = getTodayString();
    expenses = getFromStorage();
    setupCanvas();
    loadSplitHistory();
    renderTable();
  }

  init();
})();

