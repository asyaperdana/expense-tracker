/* ===========================
   app.js — Main Orchestrator
   =========================== */

import { state, MAX_UNDO } from './state.js';
import * as storage from './storage.js';
import * as calc from './calculations.js';
import * as validation from './validation.js';
import * as ui from './ui.js';

// ─── Initialization ───────────────────────
function init() {
  ui.cacheDom();
  
  // Load initial state from storage
  state.expenses = storage.loadExpenses();
  state.recurringExpenses = storage.loadRecurring();
  state.customCategories = storage.loadCustomCategoriesData();
  state.goals = storage.loadGoals();
  state.wallets = storage.loadWalletsData() || [
    { id: 'w1', name: 'Tunai', icon: 'ph-money' },
    { id: 'w2', name: 'Rekening Bank', icon: 'ph-bank' },
    { id: 'w3', name: 'E-Wallet', icon: 'ph-device-mobile' }
  ];
  state.templates = storage.loadTemplatesData();
  state.categoryBudgets = storage.loadCategoryBudgets();
  state.userProfile = storage.loadProfile();
  state.splitLedger = storage.loadSplitLedger();

  // Setup UI
  ui.setTheme(storage.getTheme());
  ui.initVisualEffects();
  ui.renderWalletDropdowns();
  ui.renderTemplateStrip(handleUseTemplate, handleDeleteTemplate);
  ui.renderTable();
  ui.renderGoals(handleOpenFundGoal, handleDeleteGoal);
  ui.renderSplitLedgerTable();
  ui.renderRecentTransactions();
  
  // Set initial view
  const initialView = storage.getActiveView() || 'dashboard';
  ui.setActiveView(initialView, false);

  // Set default date in form
  ui.dom.inputDate.value = validation.toDisplayDate(calc.getTodayString());
  ui.syncAmountDisplay(ui.dom.inputAmount.value);

  setupEventListeners();
  ui.syncConditionalFields();
  processRecurringExpenses();
}

// ─── Event Listeners ───────────────────────
function setupEventListeners() {
  // Navigation
  document.querySelectorAll('[data-nav-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.getAttribute('data-nav-view');
      ui.setActiveView(view, view === 'add');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  const fabAdd = document.getElementById('fab-add');
  if (fabAdd) {
    fabAdd.addEventListener('click', () => {
      ui.setActiveView('add', true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  document.addEventListener('click', (e) => {
    const navTargetBtn = e.target.closest('[data-nav-target]');
    if (navTargetBtn) {
      const targetView = navTargetBtn.getAttribute('data-nav-target');
      ui.setActiveView(targetView, targetView === 'add');
      if (targetView === 'add') window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') ui.closeCalendarDetail();
  });

  // Form Handling
  ui.dom.form.addEventListener('submit', handleSubmit);
  ui.dom.btnCancel.addEventListener('click', ui.resetForm);
  ui.dom.inputAmount.addEventListener('input', ui.formatInputCurrency);

  // Type Toggle
  document.querySelectorAll('input[name="input-type"]').forEach(radio => {
    radio.addEventListener('change', () => {
      setTimeout(ui.syncConditionalFields, 0);
    });
  });

  // Title Autocomplete / Suggestion
  ui.dom.inputTitle.addEventListener('input', handleTitleInput);

  // Filters
  ui.dom.filterCategory.addEventListener('change', () => ui.renderTable());
  ui.dom.filterMonth.addEventListener('change', () => {
    if (ui.dom.filterMonth.value) {
      const parts = ui.dom.filterMonth.value.split('-');
      const year = Number(parts[0]);
      const month = Number(parts[1]);
      if (year && month) {
        state.calendarViewDate = new Date(year, month - 1, 1);
      }
    } else {
      state.calendarViewDate = new Date();
    }
    ui.closeCalendarDetail();
    ui.renderTable();
    ui.renderMonthlyReport();
  });
  ui.dom.filterSort.addEventListener('change', () => ui.renderTable());
  ui.dom.filterSearch.addEventListener('input', () => ui.renderTable());
  
  const btnResetFilter = document.getElementById('btn-reset-filter');
  if (btnResetFilter) {
    btnResetFilter.addEventListener('click', () => {
      ui.dom.filterSearch.value = '';
      ui.dom.filterCategory.value = 'Semua';
      ui.dom.filterMonth.value = '';
      ui.dom.filterSort.value = 'date-desc';
      state.calendarViewDate = new Date();
      ui.closeCalendarDetail();
      ui.renderTable();
      ui.showToast('Filter direset', 'info');
    });
  }

  // Calendar Controls
  const btnCalPrev = document.getElementById('btn-cal-prev');
  if (btnCalPrev) {
    btnCalPrev.addEventListener('click', () => {
      const y = state.calendarViewDate.getFullYear();
      const m = state.calendarViewDate.getMonth();
      state.calendarViewDate = new Date(y, m - 1, 1);
      ui.closeCalendarDetail();
      ui.renderCalendar();
    });
  }

  const btnCalNext = document.getElementById('btn-cal-next');
  if (btnCalNext) {
    btnCalNext.addEventListener('click', () => {
      const y = state.calendarViewDate.getFullYear();
      const m = state.calendarViewDate.getMonth();
      state.calendarViewDate = new Date(y, m + 1, 1);
      ui.closeCalendarDetail();
      ui.renderCalendar();
    });
  }

  const btnCalDetailClose = document.getElementById('btn-cal-detail-close');
  if (btnCalDetailClose) {
    btnCalDetailClose.addEventListener('click', ui.closeCalendarDetail);
  }

  // Exports / Imports
  const btnExportCsv = document.getElementById('btn-export-csv');
  if (btnExportCsv) btnExportCsv.addEventListener('click', handleExportCsv);
  
  const btnExportJson = document.getElementById('btn-export-json');
  if (btnExportJson) btnExportJson.addEventListener('click', handleExportJson);
  
  const btnImportJson = document.getElementById('btn-import-json');
  if (btnImportJson) btnImportJson.addEventListener('click', () => ui.dom.inputImportJson.click());
  
  if (ui.dom.inputImportJson) {
    ui.dom.inputImportJson.addEventListener('change', handleImportJson);
  }

  // Undo
  ui.dom.btnUndo.addEventListener('click', handleUndo);

  // Table Actions
  ui.dom.tbody.addEventListener('click', handleTableAction);

  // Wallet Management
  const btnManageWallet = document.getElementById('btn-manage-wallet');
  if (btnManageWallet) {
    btnManageWallet.addEventListener('click', () => {
      // Basic implementation for parity
      ui.showToast('Manajamen Dompet — Fitur ini disederhanakan dalam versi modular', 'info');
    });
  }

  // Budget Actions
  const btnEditBudget = document.getElementById('btn-edit-budget');
  if (btnEditBudget) {
    btnEditBudget.addEventListener('click', () => {
      const current = storage.getBudgetLimit();
      ui.dom.inputBudgetLimit.value = current > 0 ? current.toLocaleString('en-US') : '';
      ui.dom.budgetOverlay.classList.add('active');
    });
  }

  const btnSaveBudget = document.getElementById('btn-save-budget');
  if (btnSaveBudget) {
    btnSaveBudget.addEventListener('click', handleSaveBudget);
  }

  const btnCancelBudget = document.getElementById('btn-cancel-budget');
  if (btnCancelBudget) {
    btnCancelBudget.addEventListener('click', () => ui.dom.budgetOverlay.classList.remove('active'));
  }

  // Category Budget Actions
  const btnEditCatBudget = document.getElementById('btn-edit-category-budget');
  if (btnEditCatBudget) btnEditCatBudget.addEventListener('click', ui.openCategoryBudgetModal);
  
  const btnEditCatBudgetEmpty = document.getElementById('btn-edit-category-budget-empty');
  if (btnEditCatBudgetEmpty) btnEditCatBudgetEmpty.addEventListener('click', ui.openCategoryBudgetModal);

  const btnSaveCatBudget = document.getElementById('btn-save-category-budget');
  if (btnSaveCatBudget) {
    btnSaveCatBudget.addEventListener('click', () => {
      const inputs = ui.dom.categoryBudgetEditor.querySelectorAll('.category-budget-input');
      const next = {};
      inputs.forEach(input => {
        const cat = input.dataset.category;
        const val = Number(input.value.replace(/,/g, ''));
        if (cat && val > 0) next[cat] = val;
      });
      state.categoryBudgets = next;
      storage.saveCategoryBudgets(next);
      ui.renderCategoryBudgetSummary();
      ui.dom.categoryBudgetOverlay.classList.remove('active');
      ui.showToast('Budget per kategori disimpan', 'success');
    });
  }

  const btnCancelCatBudget = document.getElementById('btn-cancel-category-budget');
  if (btnCancelCatBudget) {
    btnCancelCatBudget.addEventListener('click', () => ui.dom.categoryBudgetOverlay.classList.remove('active'));
  }

  // Goal Actions
  const btnAddGoal = document.getElementById('btn-add-goal');
  if (btnAddGoal) {
    btnAddGoal.addEventListener('click', () => {
      ui.dom.inputGoalName.value = '';
      ui.dom.inputGoalTarget.value = '';
      ui.dom.goalAddOverlay.classList.add('active');
    });
  }

  const btnSaveGoal = document.getElementById('btn-save-goal');
  if (btnSaveGoal) btnSaveGoal.addEventListener('click', handleSaveGoal);

  const btnCancelGoal = document.getElementById('btn-cancel-goal');
  if (btnCancelGoal) {
    btnCancelGoal.addEventListener('click', () => ui.dom.goalAddOverlay.classList.remove('active'));
  }

  const btnSaveGoalFund = document.getElementById('btn-save-goal-fund');
  if (btnSaveGoalFund) btnSaveGoalFund.addEventListener('click', handleSaveGoalFund);

  const btnCancelGoalFund = document.getElementById('btn-cancel-goal-fund');
  if (btnCancelGoalFund) {
    btnCancelGoalFund.addEventListener('click', () => ui.dom.goalFundOverlay.classList.remove('active'));
  }

  // Theme Toggle
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  if (btnThemeToggle) {
    btnThemeToggle.addEventListener('click', () => {
      const current = storage.getTheme();
      ui.setTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  // Monthly Report Navigation
  const btnPrevMonth = document.getElementById('btn-report-prev');
  if (btnPrevMonth) {
    btnPrevMonth.addEventListener('click', () => {
      const current = ui.getReportMonthKey();
      ui.dom.filterMonth.value = calc.getPreviousMonthKey(current);
      ui.renderMonthlyReport();
    });
  }
  
  const btnNextMonth = document.getElementById('btn-report-next');
  if (btnNextMonth) {
    btnNextMonth.addEventListener('click', () => {
      const current = ui.getReportMonthKey();
      ui.dom.filterMonth.value = calc.getNextMonthKey(current);
      ui.renderMonthlyReport();
    });
  }

  // Split Bill Actions
  const btnOpenSplit = document.getElementById('btn-open-split');
  if (btnOpenSplit) btnOpenSplit.addEventListener('click', () => ui.dom.splitOverlay.classList.add('active'));
  
  const btnOpenSplitEmpty = document.getElementById('btn-open-split-empty');
  if (btnOpenSplitEmpty) btnOpenSplitEmpty.addEventListener('click', () => ui.dom.splitOverlay.classList.add('active'));

  const btnCloseSplit = document.getElementById('btn-close-split');
  if (btnCloseSplit) btnCloseSplit.addEventListener('click', () => ui.dom.splitOverlay.classList.remove('active'));

  const btnCalculateSplit = document.getElementById('btn-calculate-split');
  if (btnCalculateSplit) btnCalculateSplit.addEventListener('click', handleCalculateSplit);
  
  const btnSaveSplit = document.getElementById('btn-save-split');
  if (btnSaveSplit) btnSaveSplit.addEventListener('click', handleSaveSplitToLedger);
  
  const btnBackSplit = document.getElementById('btn-back-split');
  if (btnBackSplit) {
    btnBackSplit.addEventListener('click', () => {
      ui.dom.splitFormView.style.display = 'block';
      ui.dom.splitResultsView.style.display = 'none';
    });
  }

  ui.dom.splitLedgerTbody.addEventListener('click', handleSplitLedgerAction);
  
  const btnAddPerson = document.getElementById('btn-add-person');
  if (btnAddPerson) {
    btnAddPerson.addEventListener('click', () => ui.addPersonRow(''));
  }

  // Custom Category
  const btnAddCategory = document.getElementById('btn-add-category');
  if (btnAddCategory) {
    btnAddCategory.addEventListener('click', () => ui.dom.categoryOverlay.classList.add('active'));
  }
  
  const btnSaveCategory = document.getElementById('btn-save-category');
  if (btnSaveCategory) btnSaveCategory.addEventListener('click', handleSaveCustomCategory);
  
  const btnCancelCategory = document.getElementById('btn-cancel-category');
  if (btnCancelCategory) btnCancelCategory.addEventListener('click', () => ui.dom.categoryOverlay.classList.remove('active'));
}

// ─── Actions ───────────────────────────────
function handleTitleInput(e) {
  const val = e.target.value.trim().toLowerCase();
  if (!val) return;
  
  const match = [...state.expenses].reverse().find(ex => ex.title.toLowerCase() === val);
  if (match) {
    const typeRadio = document.querySelector(`input[name="input-type"][value="${match.type}"]`);
    if (typeRadio) typeRadio.checked = true;
    ui.syncConditionalFields();
    
    ui.dom.inputWallet.value = match.wallet || 'Tunai';
    if (match.type !== 'transfer') {
      ui.dom.inputCategory.value = match.category || '';
    } else {
      ui.dom.inputWalletTo.value = match.walletTo || 'Tunai';
    }
  }
}

function handleSubmit(e) {
  e.preventDefault();
  
  const type = document.querySelector('input[name="input-type"]:checked').value;
  const formData = {
    date: ui.dom.inputDate.value,
    title: ui.dom.inputTitle.value,
    category: ui.dom.inputCategory.value,
    amount: ui.dom.inputAmount.value,
    type: type,
    wallet: ui.dom.inputWallet.value,
    walletTo: ui.dom.inputWalletTo.value,
    todayString: calc.getTodayString()
  };

  const validationResult = validation.validateExpense(formData);
  if (!validationResult.valid) {
    ui.showToast(validationResult.errors[0], 'error');
    return;
  }

  const expenseItem = {
    id: state.editingId || calc.generateId(),
    date: validation.toIsoDate(formData.date),
    title: formData.title.trim(),
    category: type === 'transfer' ? 'Transfer' : formData.category,
    amount: Number(formData.amount.replace(/,/g, '')),
    type: type,
    wallet: formData.wallet,
    walletTo: type === 'transfer' ? formData.walletTo : null,
    isRecurring: ui.dom.inputRecurring.checked
  };

  pushUndo();

  if (state.editingId) {
    state.expenses = state.expenses.map(item => item.id === state.editingId ? expenseItem : item);
    ui.showToast('Transaksi diperbarui', 'success');
  } else {
    state.expenses.unshift(expenseItem);
    ui.showToast('Transaksi disimpan', 'success');
    
    if (expenseItem.isRecurring) {
      const nextDate = new Date(expenseItem.date);
      nextDate.setMonth(nextDate.getMonth() + 1);
      state.recurringExpenses.push({
        id: calc.generateId(),
        template: { ...expenseItem, isRecurring: true },
        nextDate: nextDate.toISOString().split('T')[0]
      });
      storage.saveRecurring(state.recurringExpenses);
    }
  }

  storage.saveExpenses(state.expenses);
  ui.resetForm();
  ui.renderTable();
  ui.renderRecentTransactions();
}

function handleTableAction(e) {
  const editBtn = e.target.closest('[data-action="edit"]');
  const deleteBtn = e.target.closest('[data-action="delete"]');
  const pinBtn = e.target.closest('[data-action="pin"]');

  if (editBtn) {
    const id = editBtn.dataset.id;
    const item = state.expenses.find(ex => ex.id === id);
    if (item) startEdit(item);
  } else if (deleteBtn) {
    const id = deleteBtn.dataset.id;
    if (confirm('Hapus transaksi ini?')) deleteExpense(id);
  } else if (pinBtn) {
    const id = pinBtn.dataset.id;
    const item = state.expenses.find(ex => ex.id === id);
    if (item) pinToTemplates(item);
  }
}

function startEdit(item) {
  state.editingId = item.id;
  ui.dom.inputDate.value = validation.toDisplayDate(item.date);
  ui.dom.inputTitle.value = item.title;
  ui.dom.inputAmount.value = item.amount.toLocaleString('en-US');
  ui.syncAmountDisplay(ui.dom.inputAmount.value);
  
  const typeRadio = document.querySelector(`input[name="input-type"][value="${item.type}"]`);
  if (typeRadio) typeRadio.checked = true;
  
  ui.syncConditionalFields();
  
  if (item.type !== 'transfer') {
    ui.dom.inputCategory.value = item.category;
  } else {
    ui.dom.inputWalletTo.value = item.walletTo;
  }
  
  ui.dom.inputWallet.value = item.wallet;
  ui.dom.inputRecurring.checked = item.isRecurring || false;
  
  ui.dom.btnSubmit.innerHTML = '<i class="ph-bold ph-check"></i> Perbarui Transaksi';
  ui.dom.btnCancel.style.display = 'inline-flex';
  
  ui.setActiveView('add', true);
}

function deleteExpense(id) {
  pushUndo();
  state.expenses = state.expenses.filter(e => e.id !== id);
  storage.saveExpenses(state.expenses);
  ui.renderTable();
  ui.renderRecentTransactions();
  ui.showToast('Transaksi dihapus', 'info');
}

function handleUndo() {
  if (state.undoStack.length === 0) return;
  const lastState = state.undoStack.pop();
  state.expenses = JSON.parse(lastState);
  storage.saveExpenses(state.expenses);
  ui.renderTable();
  ui.renderRecentTransactions();
  ui.updateUndoIndicator();
  ui.showToast('Aksi dibatalkan (Undo)', 'info');
}

function pushUndo() {
  state.undoStack.push(JSON.stringify(state.expenses));
  if (state.undoStack.length > MAX_UNDO) state.undoStack.shift();
  ui.updateUndoIndicator();
}

function handleSaveBudget() {
  const val = Number(ui.dom.inputBudgetLimit.value.replace(/,/g, ''));
  storage.saveBudgetLimit(val);
  ui.dom.budgetOverlay.classList.remove('active');
  ui.renderHero();
  ui.showToast('Batas bulanan disimpan', 'success');
}

function pinToTemplates(item) {
  const existing = state.templates.find(t => t.title === item.title && t.amount === item.amount);
  if (existing) {
    ui.showToast('Template sudah ada', 'info');
    return;
  }
  
  state.templates.push({
    id: calc.generateId(),
    title: item.title,
    category: item.category,
    amount: item.amount,
    type: item.type,
    wallet: item.wallet
  });
  
  storage.saveTemplates(state.templates);
  ui.renderTemplateStrip(handleUseTemplate, handleDeleteTemplate);
  ui.showToast('Disematkan ke Quick Add', 'success');
}

function handleUseTemplate(tpl) {
  ui.dom.inputTitle.value = tpl.title;
  ui.dom.inputAmount.value = tpl.amount.toLocaleString('en-US');
  ui.syncAmountDisplay(ui.dom.inputAmount.value);
  ui.dom.inputCategory.value = tpl.category;
  ui.dom.inputWallet.value = tpl.wallet;
  
  const typeRadio = document.querySelector(`input[name="input-type"][value="${tpl.type || 'expense'}"]`);
  if (typeRadio) typeRadio.checked = true;
  
  ui.syncConditionalFields();
  ui.setActiveView('add', true);
}

function handleDeleteTemplate(id) {
  state.templates = state.templates.filter(t => t.id !== id);
  storage.saveTemplates(state.templates);
  ui.renderTemplateStrip(handleUseTemplate, handleDeleteTemplate);
  ui.showToast('Template dihapus', 'info');
}

function handleSaveCustomCategory() {
  const name = ui.dom.inputCustomCatName.value.trim();
  const type = ui.dom.inputCustomCatType.value;
  const icon = ui.dom.inputCustomCatIcon.value || 'ph-tag';
  
  if (!name) {
    ui.showToast('Nama kategori wajib diisi', 'error');
    return;
  }
  
  state.customCategories.push({ name, type, icon });
  storage.saveCustomCategories(state.customCategories);
  ui.renderCategoryOptions();
  ui.dom.categoryOverlay.classList.remove('active');
  ui.showToast('Kategori custom ditambahkan', 'success');
}

// ─── Goal Management ──────────────────────
function handleSaveGoal() {
  const name = ui.dom.inputGoalName.value.trim();
  const target = Number(ui.dom.inputGoalTarget.value.replace(/,/g, ''));
  
  if (!name || !target) {
    ui.showToast('Lengkapi nama dan target dana', 'error');
    return;
  }
  
  state.goals.push({ id: calc.generateId(), name: name, target: target });
  storage.saveGoals(state.goals);
  ui.renderGoals(handleOpenFundGoal, handleDeleteGoal);
  ui.dom.goalAddOverlay.classList.remove('active');
  ui.showToast('Tabungan impian ditambahkan', 'success');
}

function handleOpenFundGoal(id) {
  const goal = state.goals.find(g => g.id === id);
  if (goal) {
    ui.dom.inputGoalFundId.value = id;
    ui.dom.goalFundSubtitle.textContent = 'Menabung untuk: ' + goal.name;
    ui.dom.inputGoalFundAmount.value = '';
    ui.dom.goalFundOverlay.classList.add('active');
  }
}

function handleDeleteGoal(id) {
  if (confirm('Hapus tabungan impian ini?')) {
    state.goals = state.goals.filter(g => g.id !== id);
    storage.saveGoals(state.goals);
    ui.renderGoals(handleOpenFundGoal, handleDeleteGoal);
    ui.showToast('Tabungan impian dihapus', 'info');
  }
}

function handleSaveGoalFund() {
  const gid = ui.dom.inputGoalFundId.value;
  const amt = Number(ui.dom.inputGoalFundAmount.value.replace(/,/g, ''));
  const src = ui.dom.inputGoalFundSource.value;
  
  if (!amt || amt <= 0) {
    ui.showToast('Nominal tidak valid', 'error');
    return;
  }
  
  const goal = state.goals.find(g => g.id === gid);
  if (!goal) return;

  const data = {
    id: calc.generateId(),
    type: 'transfer',
    wallet: src,
    walletTo: 'Goal-' + gid,
    date: calc.getTodayString(),
    title: 'Tabungan: ' + goal.name,
    category: 'Transfer',
    amount: amt
  };
  
  state.expenses.unshift(data);
  storage.saveExpenses(state.expenses);
  ui.renderTable();
  ui.renderGoals(handleOpenFundGoal, handleDeleteGoal);
  ui.dom.goalFundOverlay.classList.remove('active');
  ui.showToast('Dana berhasil dialokasikan', 'success');
}

// ─── Exports ──────────────────────────────
function handleExportCsv() {
  if (!state.expenses.length) {
    ui.showToast('Tidak ada data untuk diekspor', 'error');
    return;
  }
  
  const headers = ['Tanggal', 'Judul', 'Kategori', 'Tipe', 'Dompet', 'Tujuan', 'Nominal'];
  const rows = state.expenses.map(e => [
    e.date, 
    `"${e.title}"`, 
    e.category, 
    e.type, 
    e.wallet, 
    e.walletTo || '', 
    e.amount
  ]);
  
  const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
  downloadFile(csvContent, 'expense_tracker_export.csv', 'text/csv');
  ui.showToast('CSV Berhasil diekspor', 'success');
}

function handleExportJson() {
  const data = JSON.stringify({
    expenses: state.expenses,
    wallets: state.wallets,
    categories: state.customCategories,
    goals: state.goals,
    templates: state.templates,
    recurring: state.recurringExpenses,
    budgets: state.categoryBudgets,
    split: state.splitLedger
  }, null, 2);
  
  downloadFile(data, 'expense_tracker_backup.json', 'application/json');
  ui.showToast('JSON Berhasil diekspor', 'success');
}

function handleImportJson(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      if (confirm('Import data akan menimpa data saat ini. Lanjutkan?')) {
        if (data.expenses) storage.saveExpenses(data.expenses);
        if (data.wallets) storage.saveWallets(data.wallets);
        if (data.categories) storage.saveCustomCategories(data.categories);
        if (data.goals) storage.saveGoals(data.goals);
        if (data.templates) storage.saveTemplates(data.templates);
        if (data.recurring) storage.saveRecurring(data.recurring);
        if (data.budgets) storage.saveCategoryBudgets(data.budgets);
        if (data.split) storage.saveSplitLedger(data.split);
        
        window.location.reload();
      }
    } catch (err) {
      ui.showToast('Format JSON tidak valid', 'error');
    }
  };
  reader.readAsText(file);
}

function downloadFile(content, fileName, mimeType) {
  const a = document.createElement('a');
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  a.setAttribute('href', url);
  a.setAttribute('download', fileName);
  a.click();
}

// ─── Split Bill Logic ─────────────────────
function handleCalculateSplit() {
  const billName = ui.dom.splitBillName.value.trim() || 'Split Bill';
  const total = Number(ui.dom.splitTotal.value.replace(/,/g, ''));
  const ownerName = ui.dom.splitOwnerName.value.trim();
  const payerId = ui.dom.splitPayer.value;
  const mode = ui.dom.modeEqual.classList.contains('active') ? 'equal' : 'custom';
  
  if (!total || total <= 0) {
    ui.showToast('Masukkan total tagihan', 'error');
    return;
  }
  
  if (!ownerName) {
    ui.showToast('Isi Nama Saya untuk tracking', 'error');
    return;
  }

  const rows = ui.dom.splitPersonList.querySelectorAll('.split-person-row');
  const people = [];
  rows.forEach((row, i) => {
    const id = row.dataset.personId || `p-${i}`;
    const name = row.querySelector('.person-name-input').value.trim() || `Peserta ${i+1}`;
    let customAmt = 0;
    if (mode === 'custom') {
      customAmt = Number(row.querySelector('.custom-amount').value.replace(/,/g, '')) || 0;
    }
    people.push({ id, name, customAmount: customAmt });
  });

  const results = calc.calculateSplitResults(billName, total, mode, people, payerId, ownerName, calc.getTodayString());
  
  if (!results) {
    ui.showToast('Nama Saya harus ada di daftar peserta', 'error');
    return;
  }

  state.currentSplitResults = results;
  ui.renderSplitResults(results);
}

function handleSaveSplitToLedger() {
  if (!state.currentSplitResults) return;
  
  const entry = {
    ...state.currentSplitResults,
    id: calc.generateId(),
    isDone: false,
    syncedExpenseId: null
  };
  
  state.splitLedger.unshift(entry);
  storage.saveSplitLedger(state.splitLedger);
  ui.renderSplitLedgerTable();
  ui.dom.splitOverlay.classList.remove('active');
  ui.showToast('Split bill disimpan ke ledger', 'success');
}

function handleSplitLedgerAction(e) {
  const btn = e.target.closest('[data-split-action]');
  if (!btn) return;
  
  const action = btn.dataset.splitAction;
  const id = btn.dataset.id;
  const entry = state.splitLedger.find(s => s.id === id);
  
  if (action === 'delete') {
    if (confirm('Hapus riwayat split ini?')) {
      state.splitLedger = state.splitLedger.filter(s => s.id !== id);
      storage.saveSplitLedger(state.splitLedger);
      ui.renderSplitLedgerTable();
      ui.showToast('Riwayat split dihapus', 'info');
    }
  } else if (action === 'done') {
    if (entry) {
      entry.isDone = true;
      entry.doneAt = calc.getTodayString();
      storage.saveSplitLedger(state.splitLedger);
      ui.renderSplitLedgerTable();
      ui.showToast('Split ditandai selesai', 'success');
    }
  } else if (action === 'sync') {
    if (entry && !entry.syncedExpenseId) {
      const expense = {
        id: calc.generateId(),
        type: 'expense',
        wallet: 'Tunai',
        date: entry.date,
        title: `Split Bill: ${entry.billName} (${entry.ownerName})`,
        category: 'Makanan',
        amount: entry.ownerShare,
        splitLedgerId: entry.id
      };
      state.expenses.unshift(expense);
      entry.syncedExpenseId = expense.id;
      entry.syncedAt = calc.getTodayString();
      storage.saveExpenses(state.expenses);
      storage.saveSplitLedger(state.splitLedger);
      ui.renderTable();
      ui.renderSplitLedgerTable();
      ui.showToast('Sinkron ke pengeluaran berhasil', 'success');
    }
  }
}

// ─── Recurring ────────────────────────────
function processRecurringExpenses() {
  const today = calc.getTodayString();
  let changed = false;
  
  state.recurringExpenses.forEach(rec => {
    while (rec.nextDate <= today) {
      const newItem = {
        ...rec.template,
        id: calc.generateId(),
        date: rec.nextDate,
        isRecurring: true
      };
      state.expenses.unshift(newItem);
      
      const d = new Date(rec.nextDate);
      d.setMonth(d.getMonth() + 1);
      rec.nextDate = d.toISOString().split('T')[0];
      changed = true;
    }
  });

  if (changed) {
    storage.saveExpenses(state.expenses);
    storage.saveRecurring(state.recurringExpenses);
    ui.renderTable();
  }
}

// ─── Init ──────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
