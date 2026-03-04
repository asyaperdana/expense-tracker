/* ===========================
   app.js — Main Orchestrator
   =========================== */
// TODO: This file is ~2000 lines. Consider extracting business logic into
// separate modules (transactions.js, import-export.js, recurring.js, etc.)

import {
  state,
  MAX_UNDO,
  DEFAULT_WALLETS,
  normalizeWalletName,
  normalizeWalletIcon,
  normalizeCategoryName,
  OTHER_EXPENSE_CATEGORY,
} from './modules/state.js';
import * as storage from './modules/storage.js';
import * as calc from './modules/calculations.js';
import * as validation from './modules/validation.js';
import * as sharedLedgers from './modules/shared-ledgers.js';
import * as ui from './ui.js';

const VALID_TRANSACTION_TYPES = ['expense', 'income', 'transfer'];
let shouldReloadAfterImportSummary = false;

/**
 * Normalizes text input by trimming whitespace.
 * @param {*} value - Value to normalize
 * @returns {string} Trimmed string or empty string
 */
export function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Sanitizes and validates an expense item from raw data.
 * @param {Object} raw - Raw expense data
 * @returns {Object|null} Sanitized expense object or null if invalid
 */
export function sanitizeExpenseItem(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const type = VALID_TRANSACTION_TYPES.includes(raw.type) ? raw.type : 'expense';
  const date = normalizeText(raw.date);
  const title = normalizeText(raw.title);
  const amount = Number(raw.amount);
  const wallet = normalizeText(raw.wallet) || 'Tunai';
  const category = normalizeCategoryName(raw.category);
  const walletTo = normalizeText(raw.walletTo);
  const recurringSourceId = normalizeText(raw.recurringSourceId) || null;

  if (!validation.isValidIsoDate(date)) return null;
  if (!title) return null;
  if (!Number.isFinite(amount) || amount <= 0) return null;

  if (type === 'transfer') {
    const targetWallet = walletTo || 'Tunai';
    if (wallet === targetWallet) return null;
    return {
      id: normalizeText(raw.id) || calc.generateId(),
      date,
      title,
      category: 'Transfer',
      amount,
      type,
      wallet,
      walletTo: targetWallet,
      isRecurring: Boolean(raw.isRecurring),
      recurringSourceId,
    };
  }

  if (!category) return null;
  return {
    id: normalizeText(raw.id) || calc.generateId(),
    date,
    title,
    category,
    amount,
    type,
    wallet,
    walletTo: null,
    isRecurring: Boolean(raw.isRecurring),
    recurringSourceId,
  };
}

export function sanitizeWallet(raw, index) {
  if (!raw || typeof raw !== 'object') return null;
  const name = normalizeText(raw.name);
  if (!name) return null;
  return {
    id: normalizeText(raw.id) || 'w-import-' + (index + 1),
    name,
    icon: normalizeWalletIcon(raw.icon),
  };
}

export function sanitizeCustomCategory(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const type = raw.type === 'income' ? 'income' : 'expense';
  const name = type === 'expense' ? normalizeCategoryName(raw.name) : normalizeText(raw.name);
  if (!name) return null;
  return {
    name,
    type: type,
    icon: normalizeText(raw.icon) || 'ph-tag',
  };
}

export function sanitizeGoal(raw, index) {
  if (!raw || typeof raw !== 'object') return null;
  const name = normalizeText(raw.name);
  const target = Number(raw.target);
  if (!name || !Number.isFinite(target) || target <= 0) return null;
  return {
    id: normalizeText(raw.id) || 'goal-import-' + (index + 1),
    name,
    target,
  };
}

export function sanitizeTemplate(raw, index) {
  if (!raw || typeof raw !== 'object') return null;
  const title = normalizeText(raw.title);
  const amount = Number(raw.amount);
  const type = VALID_TRANSACTION_TYPES.includes(raw.type) ? raw.type : 'expense';
  if (!title || !Number.isFinite(amount) || amount <= 0) return null;
  const category = normalizeCategoryName(raw.category);
  return {
    id: normalizeText(raw.id) || 'tpl-import-' + (index + 1),
    title,
    category: category || (type === 'transfer' ? 'Transfer' : OTHER_EXPENSE_CATEGORY),
    amount,
    type,
    wallet: normalizeText(raw.wallet) || 'Tunai',
  };
}

export function sanitizeRecurring(raw, index) {
  if (!raw || typeof raw !== 'object') return null;
  const nextDate = normalizeText(raw.nextDate);
  const skipUntil = normalizeText(raw.skipUntil);
  const template = sanitizeExpenseItem(raw.template);
  if (!template || !validation.isValidIsoDate(nextDate)) return null;
  const recurringId = normalizeText(raw.id) || 'rec-import-' + (index + 1);
  return {
    id: recurringId,
    template: {
      ...template,
      isRecurring: true,
      recurringSourceId: normalizeText(template.recurringSourceId) || recurringId,
    },
    nextDate,
    skipUntil: validation.isValidIsoDate(skipUntil) ? skipUntil : null,
  };
}

export function sanitizeCategoryBudgets(raw) {
  if (!raw || typeof raw !== 'object') return {};
  const result = {};
  Object.keys(raw).forEach((cat) => {
    const key = normalizeCategoryName(cat);
    const amount = Number(raw[cat]);
    if (key && Number.isFinite(amount) && amount > 0) {
      result[key] = amount;
    }
  });
  return result;
}

export function sanitizeSplitPerson(raw, index) {
  if (!raw || typeof raw !== 'object') return null;
  const share = Number(raw.share);
  const paid = Number(raw.paid);
  const net = Number(raw.net);
  const safeShare = Number.isFinite(share) && share >= 0 ? share : 0;
  const safePaid = Number.isFinite(paid) && paid >= 0 ? paid : 0;
  const safeNet = Number.isFinite(net) ? net : safePaid - safeShare;
  return {
    id: normalizeText(raw.id) || 'p-' + (index + 1),
    name: normalizeText(raw.name) || 'Peserta ' + (index + 1),
    share: safeShare,
    paid: safePaid,
    net: safeNet,
  };
}

export function sanitizeSplitEntry(raw, index) {
  if (!raw || typeof raw !== 'object') return null;
  const date = normalizeText(raw.date);
  if (!validation.isValidIsoDate(date)) return null;

  const people = Array.isArray(raw.people)
    ? raw.people.map(sanitizeSplitPerson).filter(Boolean)
    : [];
  if (people.length === 0) return null;

  const payerId = normalizeText(raw.payerId) || people[0].id;
  const ownerId = normalizeText(raw.ownerId) || people[0].id;
  const payer = people.find((p) => p.id === payerId);
  const owner = people.find((p) => p.id === ownerId);
  const ownerShare = Number.isFinite(Number(raw.ownerShare))
    ? Number(raw.ownerShare)
    : owner
      ? owner.share
      : 0;
  const ownerPaid = Number.isFinite(Number(raw.ownerPaid))
    ? Number(raw.ownerPaid)
    : owner
      ? owner.paid
      : 0;
  const ownerNet = Number.isFinite(Number(raw.ownerNet))
    ? Number(raw.ownerNet)
    : ownerPaid - ownerShare;
  const status = calc.getOwnerSettlementDescriptor(ownerNet);
  const doneAt = normalizeText(raw.doneAt);
  const syncedAt = normalizeText(raw.syncedAt);

  return {
    id: normalizeText(raw.id) || 'split-import-' + (index + 1),
    billName: normalizeText(raw.billName) || 'Split Bill',
    total: Number.isFinite(Number(raw.total)) ? Number(raw.total) : 0,
    mode: raw.mode === 'custom' ? 'custom' : 'equal',
    payerId: payer ? payer.id : people[0].id,
    payerName: normalizeText(raw.payerName) || (payer ? payer.name : people[0].name),
    ownerId: owner ? owner.id : people[0].id,
    ownerName: normalizeText(raw.ownerName) || (owner ? owner.name : people[0].name),
    ownerShare,
    ownerPaid,
    ownerNet,
    ownerStatusKey: raw.ownerStatusKey || status.key,
    ownerStatusText: normalizeText(raw.ownerStatusText) || status.text,
    people,
    date,
    isDone: Boolean(raw.isDone),
    doneAt: validation.isValidIsoDate(doneAt) ? doneAt : null,
    syncedExpenseId: normalizeText(raw.syncedExpenseId) || null,
    syncedAt: validation.isValidIsoDate(syncedAt) ? syncedAt : null,
  };
}

function goalContentKey(item) {
  return normalizeText(item && item.name).toLowerCase();
}

function templateContentKey(item) {
  return [
    normalizeText(item && item.title).toLowerCase(),
    normalizeCategoryName(item && item.category).toLowerCase(),
    normalizeText(item && item.type).toLowerCase(),
    normalizeText(item && item.wallet).toLowerCase(),
    Number(item && item.amount ? item.amount : 0).toFixed(2),
  ].join('|');
}

export function sanitizeImportPayload(raw) {
  if (!raw || typeof raw !== 'object') return { hasValidSection: false };

  const payload = { hasValidSection: false };

  if (Array.isArray(raw.expenses)) {
    payload.expenses = raw.expenses.map(sanitizeExpenseItem).filter(Boolean);
    payload.hasValidSection = true;
  }

  if (Array.isArray(raw.wallets)) {
    const seen = new Set();
    payload.wallets = raw.wallets
      .map(sanitizeWallet)
      .filter(Boolean)
      .filter((wallet) => {
        const key = wallet.name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    payload.hasValidSection = true;
  }

  if (Array.isArray(raw.categories)) {
    const seen = new Set();
    payload.categories = raw.categories
      .map(sanitizeCustomCategory)
      .filter(Boolean)
      .filter((cat) => {
        const key = cat.type + '|' + cat.name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    payload.hasValidSection = true;
  }

  if (Array.isArray(raw.goals)) {
    const seen = new Set();
    payload.goals = raw.goals
      .map(sanitizeGoal)
      .filter(Boolean)
      .filter((goal) => {
        const key = goalContentKey(goal);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    payload.hasValidSection = true;
  }

  if (Array.isArray(raw.templates)) {
    const seen = new Set();
    payload.templates = raw.templates
      .map(sanitizeTemplate)
      .filter(Boolean)
      .filter((template) => {
        const key = templateContentKey(template);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    payload.hasValidSection = true;
  }

  if (Array.isArray(raw.recurring)) {
    payload.recurring = raw.recurring.map(sanitizeRecurring).filter(Boolean);
    payload.hasValidSection = true;
  }

  if (raw.budgets && typeof raw.budgets === 'object') {
    payload.budgets = sanitizeCategoryBudgets(raw.budgets);
    payload.hasValidSection = true;
  }

  if (Array.isArray(raw.split)) {
    payload.split = raw.split.map(sanitizeSplitEntry).filter(Boolean);
    payload.hasValidSection = true;
  }

  return payload;
}

export function escapeCsvCell(value) {
  let text = String(value == null ? '' : value).replace(/\r?\n/g, ' ');
  const withoutLeadingWhitespace = text.replace(/^\s+/, '');
  if (/^[=+\-@]/.test(withoutLeadingWhitespace)) {
    text = "'" + text;
  }
  return '"' + text.replace(/"/g, '""') + '"';
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('./service-worker.js').catch(() => {});
}

/**
 * Deduplicates wallets by name (case-insensitive).
 * @param {Array} wallets - Array of wallet objects
 * @returns {Array} Deduplicated wallets array
 */
export function dedupeWallets(wallets) {
  const seen = new Set();
  return wallets.filter((wallet) => {
    const key = String(wallet.name || '').toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Calculates the next recurring date (1 month from base date).
 * @param {string} baseDate - ISO date string (YYYY-MM-DD)
 * @returns {string} Next recurring date as ISO string
 */
export function getRecurringNextDate(baseDate) {
  const d = new Date(baseDate);
  if (isNaN(d.getTime())) return calc.getTodayString();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().split('T')[0];
}

function syncRecurringForExpense(expenseItem) {
  const recurringSourceId = normalizeText(expenseItem.recurringSourceId);
  const recurringIndex = state.recurringExpenses.findIndex((rec) => {
    if (!rec || !rec.template) return false;
    if (recurringSourceId && rec.id === recurringSourceId) return true;
    return rec.template.id === expenseItem.id;
  });

  if (expenseItem.isRecurring) {
    const nextDate = getRecurringNextDate(expenseItem.date);
    if (recurringIndex !== -1) {
      const existing = state.recurringExpenses[recurringIndex];
      const templateId =
        existing.template && existing.template.id ? existing.template.id : expenseItem.id;
      expenseItem.recurringSourceId = existing.id;
      existing.template = {
        ...expenseItem,
        id: templateId,
        isRecurring: true,
        recurringSourceId: existing.id,
      };
      if (!validation.isValidIsoDate(existing.nextDate) || existing.nextDate <= expenseItem.date) {
        existing.nextDate = nextDate;
      }
      existing.skipUntil = null;
      return true;
    }
    const recurringId = calc.generateId();
    expenseItem.recurringSourceId = recurringId;
    state.recurringExpenses.push({
      id: recurringId,
      template: { ...expenseItem, isRecurring: true, recurringSourceId: recurringId },
      nextDate: nextDate,
      skipUntil: null,
    });
    return true;
  }

  if (recurringIndex !== -1) {
    expenseItem.recurringSourceId = null;
    state.recurringExpenses.splice(recurringIndex, 1);
    return true;
  }

  expenseItem.recurringSourceId = null;
  return false;
}

function removeRecurringForExpenseId(expenseId) {
  const before = state.recurringExpenses.length;
  state.recurringExpenses = state.recurringExpenses.filter((rec) => {
    return !(rec && rec.template && rec.template.id === expenseId);
  });
  return state.recurringExpenses.length !== before;
}

function handleOpenWalletModal() {
  const walletOverlay = document.getElementById('wallet-overlay');
  const walletNameInput = document.getElementById('input-wallet-name');
  ui.renderWalletList(handleDeleteWallet);
  if (walletNameInput) {
    walletNameInput.value = '';
    walletNameInput.focus();
  }
  if (walletOverlay) walletOverlay.classList.add('active');
}

function handleCloseWalletModal() {
  const walletOverlay = document.getElementById('wallet-overlay');
  if (walletOverlay) walletOverlay.classList.remove('active');
}

function handleAddWallet() {
  const walletNameInput = document.getElementById('input-wallet-name');
  const walletIconInput = document.getElementById('input-wallet-icon');
  const rawName = walletNameInput ? walletNameInput.value : '';
  const name = normalizeWalletName(rawName);
  const icon = normalizeWalletIcon(walletIconInput && walletIconInput.value);

  if (!name) {
    ui.showToast('Nama dompet wajib diisi', 'error');
    return;
  }

  const exists = state.wallets.some((wallet) => {
    return String(wallet.name || '').toLowerCase() === name.toLowerCase();
  });
  if (exists) {
    ui.showToast('Nama dompet sudah digunakan', 'error');
    return;
  }

  state.wallets.push({
    id: calc.generateId(),
    name,
    icon,
  });
  state.wallets = dedupeWallets(state.wallets);
  storage.saveWallets(state.wallets);
  ui.renderWalletDropdowns();
  ui.updateHero();
  ui.renderWalletList(handleDeleteWallet);
  if (walletNameInput) walletNameInput.value = '';
  ui.showToast('Dompet ditambahkan', 'success');
}

function handleDeleteWallet(wallet) {
  if (!wallet || !wallet.name) return;
  const usageCount = state.expenses.filter((entry) => {
    return entry.wallet === wallet.name || entry.walletTo === wallet.name;
  }).length;
  if (usageCount > 0) {
    ui.showToast('Dompet tidak bisa dihapus karena masih dipakai transaksi', 'error');
    return;
  }
  if (state.wallets.length <= 1) {
    ui.showToast('Minimal harus ada satu dompet aktif', 'error');
    return;
  }
  if (!confirm('Hapus dompet "' + wallet.name + '"?')) return;

  state.wallets = state.wallets.filter((w) => w.id !== wallet.id);
  storage.saveWallets(state.wallets);
  ui.renderWalletDropdowns();
  ui.updateHero();
  ui.renderWalletList(handleDeleteWallet);
  ui.showToast('Dompet dihapus', 'info');
}

function closeDeleteModal() {
  state.deleteTargetId = null;
  if (ui.dom.modalOverlay) ui.dom.modalOverlay.classList.remove('active');
}

function openDeleteModal(id) {
  state.deleteTargetId = id;
  if (!ui.dom.modalOverlay) {
    if (id) deleteExpense(id);
    return;
  }
  ui.dom.modalOverlay.classList.add('active');
}

function confirmDeleteModal() {
  const id = state.deleteTargetId;
  closeDeleteModal();
  if (!id) return;
  deleteExpense(id);
}

function closeImportModeModal() {
  const overlay = document.getElementById('import-overlay');
  if (overlay) overlay.classList.remove('active');
}

function closeImportSummaryModal() {
  const overlay = document.getElementById('import-summary-overlay');
  if (overlay) overlay.classList.remove('active');
  if (shouldReloadAfterImportSummary) {
    shouldReloadAfterImportSummary = false;
    window.location.reload();
  }
}

function getImportMode() {
  const selected = document.querySelector('input[name="import-mode"]:checked');
  const value = selected ? selected.value : 'replace';
  if (value === 'merge-id' || value === 'merge-content') return value;
  return 'replace';
}

function getImportModeLabel(mode) {
  if (mode === 'merge-id') return 'Gabung (berdasarkan ID)';
  if (mode === 'merge-content') return 'Gabung (berdasarkan konten)';
  return 'Ganti semua data';
}

function mergeUniqueBy(existing, incoming, keyFn) {
  const out = Array.isArray(existing) ? existing.slice() : [];
  const keys = new Set();
  out.forEach((item) => {
    keys.add(keyFn(item));
  });
  let added = 0;
  let skipped = 0;
  incoming.forEach((item) => {
    const key = keyFn(item);
    if (keys.has(key)) {
      skipped += 1;
      return;
    }
    keys.add(key);
    out.push(item);
    added += 1;
  });
  return { out, added, skipped };
}

function expenseContentKey(item) {
  return [
    normalizeText(item.date),
    normalizeText(item.title).toLowerCase(),
    normalizeText(item.category).toLowerCase(),
    normalizeText(item.type).toLowerCase(),
    normalizeText(item.wallet).toLowerCase(),
    normalizeText(item.walletTo).toLowerCase(),
    Number(item.amount || 0).toFixed(2),
  ].join('|');
}

function applyImportData(mode, data) {
  let added = 0;
  let skipped = 0;

  if (mode === 'replace') {
    state.expenses = ('expenses' in data ? data.expenses : [])
      .map(sanitizeExpenseItem)
      .filter(Boolean);
    storage.saveExpenses(state.expenses);

    const importedWallets = dedupeWallets(
      ('wallets' in data ? data.wallets : []).map(sanitizeWallet).filter(Boolean)
    );
    state.wallets =
      importedWallets.length > 0
        ? importedWallets
        : DEFAULT_WALLETS.map(sanitizeWallet).filter(Boolean);
    storage.saveWallets(state.wallets);

    state.customCategories = ('categories' in data ? data.categories : [])
      .map(sanitizeCustomCategory)
      .filter(Boolean);
    storage.saveCustomCategories(state.customCategories);

    state.goals = ('goals' in data ? data.goals : []).map(sanitizeGoal).filter(Boolean);
    storage.saveGoals(state.goals);

    state.templates = ('templates' in data ? data.templates : [])
      .map(sanitizeTemplate)
      .filter(Boolean);
    storage.saveTemplates(state.templates);

    state.recurringExpenses = ('recurring' in data ? data.recurring : [])
      .map(sanitizeRecurring)
      .filter(Boolean);
    storage.saveRecurring(state.recurringExpenses);

    state.categoryBudgets = sanitizeCategoryBudgets('budgets' in data ? data.budgets : {});
    storage.saveCategoryBudgets(state.categoryBudgets);

    state.splitLedger = ('split' in data ? data.split : []).map(sanitizeSplitEntry).filter(Boolean);
    storage.saveSplitLedger(state.splitLedger);

    const importedLedgers = 'sharedLedgers' in data ? data.sharedLedgers : [];
    sharedLedgers.saveSharedLedgers(importedLedgers);

    added += state.expenses.length;
    added += state.wallets.length;
    added += state.customCategories.length;
    added += state.goals.length;
    added += state.templates.length;
    added += state.recurringExpenses.length;
    added += Object.keys(state.categoryBudgets).length;
    added += state.splitLedger.length;
    return { added, skipped };
  }

  if ('expenses' in data) {
    const incoming = data.expenses.map(sanitizeExpenseItem).filter(Boolean);
    const merged =
      mode === 'merge-content'
        ? mergeUniqueBy(state.expenses, incoming, expenseContentKey)
        : mergeUniqueBy(
            state.expenses,
            incoming,
            (item) => normalizeText(item.id) || expenseContentKey(item)
          );
    state.expenses = merged.out;
    storage.saveExpenses(state.expenses);
    added += merged.added;
    skipped += merged.skipped;
  }

  if ('wallets' in data) {
    const incoming = data.wallets.map(sanitizeWallet).filter(Boolean);
    const merged = mergeUniqueBy(state.wallets, incoming, (item) =>
      normalizeWalletName(item.name).toLowerCase()
    );
    state.wallets = dedupeWallets(merged.out);
    storage.saveWallets(state.wallets);
    added += merged.added;
    skipped += merged.skipped;
  }

  if ('categories' in data) {
    const incoming = data.categories.map(sanitizeCustomCategory).filter(Boolean);
    const merged = mergeUniqueBy(
      state.customCategories,
      incoming,
      (item) => item.type + '|' + normalizeText(item.name).toLowerCase()
    );
    state.customCategories = merged.out;
    storage.saveCustomCategories(state.customCategories);
    added += merged.added;
    skipped += merged.skipped;
  }

  if ('goals' in data) {
    const incoming = data.goals.map(sanitizeGoal).filter(Boolean);
    const merged = mergeUniqueBy(state.goals, incoming, goalContentKey);
    state.goals = merged.out;
    storage.saveGoals(state.goals);
    added += merged.added;
    skipped += merged.skipped;
  }

  if ('templates' in data) {
    const incoming = data.templates.map(sanitizeTemplate).filter(Boolean);
    const merged = mergeUniqueBy(state.templates, incoming, templateContentKey);
    state.templates = merged.out;
    storage.saveTemplates(state.templates);
    added += merged.added;
    skipped += merged.skipped;
  }

  if ('recurring' in data) {
    const incoming = data.recurring.map(sanitizeRecurring).filter(Boolean);
    const merged = mergeUniqueBy(
      state.recurringExpenses,
      incoming,
      (item) => normalizeText(item.id) || normalizeText(item.template && item.template.id)
    );
    state.recurringExpenses = merged.out;
    storage.saveRecurring(state.recurringExpenses);
    added += merged.added;
    skipped += merged.skipped;
  }

  if ('budgets' in data) {
    const currentKeys = Object.keys(state.categoryBudgets).length;
    state.categoryBudgets = sanitizeCategoryBudgets({
      ...state.categoryBudgets,
      ...data.budgets,
    });
    storage.saveCategoryBudgets(state.categoryBudgets);
    const mergedKeys = Object.keys(state.categoryBudgets).length;
    if (mergedKeys >= currentKeys) added += mergedKeys - currentKeys;
  }

  if ('split' in data) {
    const incoming = data.split.map(sanitizeSplitEntry).filter(Boolean);
    const merged = mergeUniqueBy(state.splitLedger, incoming, (item) => normalizeText(item.id));
    state.splitLedger = merged.out;
    storage.saveSplitLedger(state.splitLedger);
    added += merged.added;
    skipped += merged.skipped;
  }

  if ('sharedLedgers' in data && Array.isArray(data.sharedLedgers)) {
    const currentLedgers = sharedLedgers.loadSharedLedgers();
    const merged = mergeUniqueBy(currentLedgers, data.sharedLedgers, (item) =>
      normalizeText(item.id)
    );
    sharedLedgers.saveSharedLedgers(merged.out);
    added += merged.added;
    skipped += merged.skipped;
  }

  return { added, skipped };
}

function showImportSummary(mode, summary) {
  const overlay = document.getElementById('import-summary-overlay');
  const modeEl = document.getElementById('import-summary-mode');
  const addedEl = document.getElementById('import-summary-added');
  const skippedEl = document.getElementById('import-summary-skipped');
  if (!overlay || !modeEl || !addedEl || !skippedEl) {
    window.location.reload();
    return;
  }
  modeEl.textContent = getImportModeLabel(mode);
  addedEl.textContent = String(summary.added || 0);
  skippedEl.textContent = String(summary.skipped || 0);
  shouldReloadAfterImportSummary = true;
  overlay.classList.add('active');
}

function openImportModeModal(data) {
  state.pendingImportData = data;
  const overlay = document.getElementById('import-overlay');
  if (!overlay) {
    const summary = applyImportData('replace', data);
    showImportSummary('replace', summary);
    return;
  }
  const defaultRadio = overlay.querySelector('input[name="import-mode"][value="replace"]');
  if (defaultRadio) defaultRadio.checked = true;
  overlay.classList.add('active');
}

function handleConfirmImport() {
  if (!state.pendingImportData) {
    closeImportModeModal();
    return;
  }
  const mode = getImportMode();
  const summary = applyImportData(mode, state.pendingImportData);
  state.pendingImportData = null;
  if (ui.dom.inputImportJson) ui.dom.inputImportJson.value = '';
  closeImportModeModal();
  showImportSummary(mode, summary);
  if ((summary.skipped || 0) > 0) {
    ui.flashRenderState('Impor selesai dengan beberapa data dilewati.', 'warning', 3200);
  } else {
    ui.flashRenderState('Impor selesai tanpa konflik.', 'success', 2600);
  }
}

function handleCancelImport() {
  state.pendingImportData = null;
  closeImportModeModal();
  if (ui.dom.inputImportJson) ui.dom.inputImportJson.value = '';
}

/**
 * Gets queue of due recurring expenses for a given date.
 * @param {string} today - ISO date string (YYYY-MM-DD)
 * @param {Function} idGenerator - Optional ID generator function
 * @returns {{queue: Array, changed: boolean}} Queue of due items and change flag
 */
export function getDueRecurringQueue(today, idGenerator) {
  const queue = [];
  let changed = false;
  const makeId = typeof idGenerator === 'function' ? idGenerator : calc.generateId;

  state.recurringExpenses.forEach((rec) => {
    if (!rec) return;
    if (!rec.id) {
      rec.id = makeId();
      changed = true;
    }
    if (!rec.template) return;
    if (rec.template.recurringSourceId !== rec.id) {
      rec.template.recurringSourceId = rec.id;
      changed = true;
    }
    const skipUntil = normalizeText(rec.skipUntil);
    if (skipUntil && !validation.isValidIsoDate(skipUntil)) {
      rec.skipUntil = null;
      changed = true;
    } else if (skipUntil && skipUntil < today) {
      rec.skipUntil = null;
      changed = true;
    }
    if (rec.skipUntil && rec.skipUntil >= today) return;

    let cursor = normalizeText(rec.nextDate);
    if (!validation.isValidIsoDate(cursor)) {
      cursor = today;
      rec.nextDate = today;
      changed = true;
    }

    const dueItems = [];
    while (cursor <= today) {
      dueItems.push({
        id: makeId(),
        date: cursor,
      });
      cursor = getRecurringNextDate(cursor);
    }

    if (dueItems.length > 0) {
      queue.push({
        recurringId: rec.id,
        template: rec.template,
        dueItems,
        nextDate: cursor,
      });
    }
  });

  return { queue, changed };
}

function closeRecurringModal() {
  const overlay = document.getElementById('recurring-overlay');
  if (overlay) overlay.classList.remove('active');
}

function renderRecurringPrompt() {
  const overlay = document.getElementById('recurring-overlay');
  const list = document.getElementById('recurring-list');
  const desc = document.getElementById('recurring-desc');
  if (!overlay || !list || !desc) {
    handleConfirmRecurring();
    return;
  }

  let totalDue = 0;
  list.innerHTML = '';
  state.pendingRecurring.forEach((entry) => {
    totalDue += entry.dueItems.length;
    const item = document.createElement('div');
    item.className = 'wallet-item';
    item.innerHTML =
      '<div class="wallet-item-icon"><i class="ph-bold ph-arrows-clockwise"></i></div>' +
      '<div class="wallet-item-meta">' +
      '<div class="wallet-item-name">' +
      calc.escapeHtml(entry.template.title || 'Tagihan Berulang') +
      '</div>' +
      '<div class="wallet-item-usage">' +
      entry.dueItems.length +
      'x jatuh tempo • ' +
      calc.formatRupiah((entry.template.amount || 0) * entry.dueItems.length) +
      '</div></div>';
    list.appendChild(item);
  });

  desc.textContent =
    'Ada ' + totalDue + ' transaksi recurring yang jatuh tempo. Tambahkan sekarang?';
  overlay.classList.add('active');
}

function handleConfirmRecurring() {
  if (!Array.isArray(state.pendingRecurring) || state.pendingRecurring.length === 0) {
    closeRecurringModal();
    return;
  }

  pushUndo();
  let addedCount = 0;
  state.pendingRecurring.forEach((entry) => {
    const rec = state.recurringExpenses.find((item) => item.id === entry.recurringId);
    if (!rec || !rec.template) return;
    entry.dueItems.forEach((due) => {
      const newItem = {
        ...rec.template,
        id: due.id,
        date: due.date,
        isRecurring: true,
        recurringSourceId: rec.id,
      };
      state.expenses.unshift(newItem);
      addedCount += 1;
    });
    rec.nextDate = entry.nextDate;
    rec.skipUntil = null;
  });

  storage.saveExpenses(state.expenses);
  storage.saveRecurring(state.recurringExpenses);
  state.pendingRecurring = [];
  closeRecurringModal();
  ui.renderTable();
  ui.renderRecentTransactions();
  ui.showToast(addedCount + ' transaksi recurring ditambahkan', 'success');
}

function handleSkipRecurring() {
  const today = calc.getTodayString();
  state.pendingRecurring.forEach((entry) => {
    const rec = state.recurringExpenses.find((item) => item.id === entry.recurringId);
    if (!rec) return;
    rec.skipUntil = today;
  });
  storage.saveRecurring(state.recurringExpenses);
  state.pendingRecurring = [];
  closeRecurringModal();
  ui.showToast('Tagihan recurring ditunda sampai besok', 'info');
}

// ─── Initialization ───────────────────────
function init() {
  ui.cacheDom();

  // Load initial state from storage
  state.expenses = storage.loadExpenses().map(sanitizeExpenseItem).filter(Boolean);
  state.recurringExpenses = storage.loadRecurring().map(sanitizeRecurring).filter(Boolean);
  state.customCategories = storage
    .loadCustomCategoriesData()
    .map(sanitizeCustomCategory)
    .filter(Boolean);
  state.goals = storage.loadGoals().map(sanitizeGoal).filter(Boolean);
  state.wallets = dedupeWallets(
    (storage.loadWalletsData() || []).map(sanitizeWallet).filter(Boolean)
  );
  if (state.wallets.length === 0) {
    state.wallets = DEFAULT_WALLETS.map(sanitizeWallet).filter(Boolean);
  }
  state.templates = storage.loadTemplatesData().map(sanitizeTemplate).filter(Boolean);
  state.categoryBudgets = sanitizeCategoryBudgets(storage.loadCategoryBudgets());
  state.userProfile = storage.loadProfile();
  state.splitLedger = storage.loadSplitLedger().map(sanitizeSplitEntry).filter(Boolean);

  // Setup UI
  ui.setTheme(storage.getTheme());
  ui.initVisualEffects();
  ui.renderWalletDropdowns();
  ui.renderTemplateStrip(handleUseTemplate, handleDeleteTemplate);
  ui.renderTable();
  ui.renderGoals(handleOpenFundGoal, handleDeleteGoal);
  ui.renderSplitLedgerTable();
  ui.renderSplitHistory();
  renderSharedLedgers();
  ui.renderRecentTransactions();

  // Set initial view
  const initialView = storage.getActiveView() || 'dashboard';
  ui.setActiveView(initialView, false);

  // Set default date in form
  ui.dom.inputDate.value = validation.toDisplayDate(calc.getTodayString());
  ui.syncAmountDisplay(ui.dom.inputAmount.value);

  setupEventListeners();
  ui.syncConditionalFields();
  registerServiceWorker();
  processRecurringExpenses();
}

function resetSplitForm() {
  state.splitEditingId = null;
  state.currentSplitResults = null;
  ui.updateSplitModalHeader();
  ui.dom.splitBillName.value = '';
  ui.dom.splitTotal.value = '';
  ui.dom.splitOwnerName.value = '';
  ui.dom.splitPayer.innerHTML = '';
  ui.dom.splitPersonList.innerHTML = '';
  ui.dom.splitFormView.style.display = 'block';
  ui.dom.splitResultsView.style.display = 'none';
  ui.applySplitMode('equal');
  ui.addPersonRow('');
  ui.addPersonRow('');
}

function openSplitEditor(entry) {
  if (!entry) return;
  state.splitEditingId = entry.id;
  state.currentSplitResults = null;
  ui.updateSplitModalHeader();
  ui.dom.splitOverlay.classList.add('active');
  ui.dom.splitBillName.value = entry.billName || '';
  const totalValue = Number(entry.total);
  ui.dom.splitTotal.value = Number.isFinite(totalValue) ? totalValue.toLocaleString('en-US') : '';
  ui.dom.splitOwnerName.value = entry.ownerName || '';
  ui.dom.splitPersonList.innerHTML = '';
  ui.dom.splitFormView.style.display = 'block';
  ui.dom.splitResultsView.style.display = 'none';

  const mode = entry.mode === 'custom' ? 'custom' : 'equal';
  ui.applySplitMode(mode);
  (entry.people || []).forEach((person) => {
    const row = ui.addPersonRow(person.name || '');
    row.dataset.personId = person.id || row.dataset.personId;
    if (mode === 'custom') {
      const customAmount = row.querySelector('.custom-amount');
      if (customAmount) customAmount.value = Number(person.share || 0).toLocaleString('en-US');
    }
  });
  if (ui.dom.splitPersonList.children.length < 2) ui.addPersonRow('');
  ui.syncSplitPayerOptions();
  if (entry.payerId) ui.dom.splitPayer.value = entry.payerId;
}

function applyFilterMonthAndRefresh(monthKey) {
  if (!ui.dom.filterMonth) return;
  ui.dom.filterMonth.value = monthKey || '';
  ui.dom.filterMonth.dispatchEvent(new Event('change'));
}

// ─── Event Listeners ───────────────────────
function setupEventListeners() {
  // Navigation
  document.querySelectorAll('[data-nav-view]').forEach((btn) => {
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
  document.querySelectorAll('input[name="input-type"]').forEach((radio) => {
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
  });
  ui.dom.filterSort.addEventListener('change', () => ui.renderTable());
  ui.dom.filterSearch.addEventListener('input', () => ui.renderTable());

  const resetFiltersAndRender = (showToastMessage) => {
    ui.dom.filterSearch.value = '';
    ui.dom.filterCategory.value = 'Semua';
    ui.dom.filterMonth.value = '';
    ui.dom.filterSort.value = 'date-desc';
    state.calendarViewDate = new Date();
    ui.closeCalendarDetail();
    ui.renderTable();
    if (showToastMessage) ui.showToast('Filter direset', 'info');
  };

  const btnResetFilter = document.getElementById('btn-reset-filter');
  if (btnResetFilter) {
    btnResetFilter.addEventListener('click', () => resetFiltersAndRender(true));
  }

  const btnHistoryEmptySecondary = document.getElementById('btn-history-empty-secondary');
  if (btnHistoryEmptySecondary) {
    btnHistoryEmptySecondary.addEventListener('click', () => resetFiltersAndRender(true));
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

  const btnConfirmImport = document.getElementById('btn-confirm-import');
  if (btnConfirmImport) btnConfirmImport.addEventListener('click', handleConfirmImport);

  const btnCancelImport = document.getElementById('btn-cancel-import');
  if (btnCancelImport) btnCancelImport.addEventListener('click', handleCancelImport);

  const btnCloseImportSummary = document.getElementById('btn-close-import-summary');
  if (btnCloseImportSummary)
    btnCloseImportSummary.addEventListener('click', closeImportSummaryModal);

  // Undo
  ui.dom.btnUndo.addEventListener('click', handleUndo);

  const btnConfirmDelete = document.getElementById('btn-confirm-delete');
  if (btnConfirmDelete) btnConfirmDelete.addEventListener('click', confirmDeleteModal);

  const btnCancelDelete = document.getElementById('btn-cancel-delete');
  if (btnCancelDelete) btnCancelDelete.addEventListener('click', closeDeleteModal);

  if (ui.dom.modalOverlay) {
    ui.dom.modalOverlay.addEventListener('click', (e) => {
      if (e.target === ui.dom.modalOverlay) closeDeleteModal();
    });
  }

  // Table Actions
  ui.dom.tbody.addEventListener('click', handleTableAction);

  // Wallet Management
  const btnManageWallet = document.getElementById('btn-manage-wallet');
  if (btnManageWallet) {
    btnManageWallet.addEventListener('click', handleOpenWalletModal);
  }

  const btnAddWallet = document.getElementById('btn-add-wallet');
  if (btnAddWallet) btnAddWallet.addEventListener('click', handleAddWallet);

  const btnCloseWallet = document.getElementById('btn-close-wallet');
  if (btnCloseWallet) btnCloseWallet.addEventListener('click', handleCloseWalletModal);

  const walletNameInput = document.getElementById('input-wallet-name');
  if (walletNameInput) {
    walletNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddWallet();
      }
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
    btnCancelBudget.addEventListener('click', () =>
      ui.dom.budgetOverlay.classList.remove('active')
    );
  }

  // Category Budget Actions
  const btnEditCatBudget = document.getElementById('btn-edit-category-budget');
  if (btnEditCatBudget) btnEditCatBudget.addEventListener('click', ui.openCategoryBudgetModal);

  const btnEditCatBudgetEmpty = document.getElementById('btn-edit-category-budget-empty');
  if (btnEditCatBudgetEmpty)
    btnEditCatBudgetEmpty.addEventListener('click', ui.openCategoryBudgetModal);

  const btnToolsOpenBudget = document.getElementById('btn-tools-open-budget');
  if (btnToolsOpenBudget) btnToolsOpenBudget.addEventListener('click', ui.openCategoryBudgetModal);

  const btnSaveCatBudget = document.getElementById('btn-save-category-budget');
  if (btnSaveCatBudget) {
    btnSaveCatBudget.addEventListener('click', () => {
      const inputs = ui.dom.categoryBudgetEditor.querySelectorAll('.category-budget-input');
      const next = {};
      inputs.forEach((input) => {
        const cat = input.dataset.category;
        const val = Number(input.value.replace(/,/g, ''));
        if (cat && val > 0) next[cat] = val;
      });
      state.categoryBudgets = next;
      storage.saveCategoryBudgets(next);
      ui.renderCategoryBudgetSummary();
      ui.dom.categoryBudgetOverlay.classList.remove('active');
      ui.showToast('Budget per kategori disimpan', 'success');
      ui.flashRenderState('Budget per kategori diperbarui.', 'success', 2200);
    });
  }

  const btnCancelCatBudget = document.getElementById('btn-cancel-category-budget');
  if (btnCancelCatBudget) {
    btnCancelCatBudget.addEventListener('click', () =>
      ui.dom.categoryBudgetOverlay.classList.remove('active')
    );
  }

  // Goal Actions
  const openGoalModal = () => {
    ui.dom.inputGoalName.value = '';
    ui.dom.inputGoalTarget.value = '';
    ui.dom.goalAddOverlay.classList.add('active');
  };

  const btnAddGoal = document.getElementById('btn-add-goal');
  if (btnAddGoal) {
    btnAddGoal.addEventListener('click', openGoalModal);
  }

  const btnToolsOpenGoal = document.getElementById('btn-tools-open-goal');
  if (btnToolsOpenGoal) btnToolsOpenGoal.addEventListener('click', openGoalModal);

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
    btnCancelGoalFund.addEventListener('click', () =>
      ui.dom.goalFundOverlay.classList.remove('active')
    );
  }

  const btnConfirmRecurring = document.getElementById('btn-confirm-recurring');
  if (btnConfirmRecurring) btnConfirmRecurring.addEventListener('click', handleConfirmRecurring);

  const btnCancelRecurring = document.getElementById('btn-cancel-recurring');
  if (btnCancelRecurring) btnCancelRecurring.addEventListener('click', handleSkipRecurring);

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
      applyFilterMonthAndRefresh(calc.getPreviousMonthKey(current));
    });
  }

  const btnNextMonth = document.getElementById('btn-report-next');
  if (btnNextMonth) {
    btnNextMonth.addEventListener('click', () => {
      const current = ui.getReportMonthKey();
      applyFilterMonthAndRefresh(calc.getNextMonthKey(current));
    });
  }

  // Split Bill Actions
  const openSplitOverlay = () => {
    resetSplitForm();
    ui.dom.splitOverlay.classList.add('active');
  };

  const btnOpenSplit = document.getElementById('btn-open-split');
  if (btnOpenSplit) btnOpenSplit.addEventListener('click', openSplitOverlay);

  const btnOpenSplitEmpty = document.getElementById('btn-open-split-empty');
  if (btnOpenSplitEmpty) btnOpenSplitEmpty.addEventListener('click', openSplitOverlay);

  const btnToolsOpenSplit = document.getElementById('btn-tools-open-split');
  if (btnToolsOpenSplit) btnToolsOpenSplit.addEventListener('click', openSplitOverlay);

  const btnOpenSplitTools = document.getElementById('btn-open-split-tools');
  if (btnOpenSplitTools) btnOpenSplitTools.addEventListener('click', openSplitOverlay);

  const btnCloseSplit = document.getElementById('btn-close-split');
  if (btnCloseSplit) {
    btnCloseSplit.addEventListener('click', () => {
      ui.dom.splitOverlay.classList.remove('active');
      state.splitEditingId = null;
      state.currentSplitResults = null;
      ui.updateSplitModalHeader();
    });
  }

  const btnCalculateSplit = document.getElementById('btn-calculate-split');
  if (btnCalculateSplit) btnCalculateSplit.addEventListener('click', handleCalculateSplit);

  const btnSaveSplit = document.getElementById('btn-save-split');
  if (btnSaveSplit) btnSaveSplit.addEventListener('click', handleSaveSplitToLedger);

  const btnBackSplit = document.getElementById('btn-back-split');
  if (btnBackSplit) {
    btnBackSplit.addEventListener('click', () => {
      ui.dom.splitFormView.style.display = 'block';
      ui.dom.splitResultsView.style.display = 'none';
      state.currentSplitResults = null;
    });
  }

  ui.dom.splitLedgerTbody.addEventListener('click', handleSplitLedgerAction);
  ui.dom.splitTotal.addEventListener('input', ui.formatInputCurrency);
  ui.dom.splitPersonList.addEventListener('input', (e) => {
    if (e.target.classList.contains('custom-amount')) ui.formatInputCurrency(e);
    if (e.target.classList.contains('person-name-input')) ui.syncSplitPayerOptions();
  });
  document.querySelectorAll('.split-mode-btn[data-mode]').forEach((btn) => {
    btn.addEventListener('click', () => ui.applySplitMode(btn.dataset.mode));
  });

  const btnAddPerson = document.getElementById('btn-add-person');
  if (btnAddPerson) {
    btnAddPerson.addEventListener('click', () => ui.addPersonRow(''));
  }

  ui.updateSplitModalHeader();
  if (ui.dom.splitPersonList.children.length === 0) {
    ui.addPersonRow('');
    ui.addPersonRow('');
  }
  ui.syncSplitPayerOptions();

  // Custom Category
  const btnAddCategory = document.getElementById('btn-add-category');
  if (btnAddCategory) {
    btnAddCategory.addEventListener('click', () => ui.dom.categoryOverlay.classList.add('active'));
  }

  const btnSaveCategory = document.getElementById('btn-save-category');
  if (btnSaveCategory) btnSaveCategory.addEventListener('click', handleSaveCustomCategory);

  const btnCancelCategory = document.getElementById('btn-cancel-category');
  if (btnCancelCategory)
    btnCancelCategory.addEventListener('click', () =>
      ui.dom.categoryOverlay.classList.remove('active')
    );

  // Shared Ledger Event Listeners
  const btnCreateSharedLedger = document.getElementById('btn-create-shared-ledger');
  if (btnCreateSharedLedger)
    btnCreateSharedLedger.addEventListener('click', openSharedLedgerCreateModal);

  const btnCreateSharedLedgerEmpty = document.getElementById('btn-create-shared-ledger-empty');
  if (btnCreateSharedLedgerEmpty)
    btnCreateSharedLedgerEmpty.addEventListener('click', openSharedLedgerCreateModal);

  const btnSaveSharedLedger = document.getElementById('btn-save-shared-ledger');
  if (btnSaveSharedLedger) btnSaveSharedLedger.addEventListener('click', handleSaveSharedLedger);

  const btnCancelSharedLedger = document.getElementById('btn-cancel-shared-ledger');
  if (btnCancelSharedLedger)
    btnCancelSharedLedger.addEventListener('click', closeSharedLedgerCreateModal);

  const btnAddLedgerMember = document.getElementById('btn-add-ledger-member');
  if (btnAddLedgerMember) btnAddLedgerMember.addEventListener('click', addLedgerMemberRow);
}

// ─── Actions ───────────────────────────────
function handleTitleInput(e) {
  const val = e.target.value.trim().toLowerCase();
  if (!val) return;

  const match = [...state.expenses].reverse().find((ex) => ex.title.toLowerCase() === val);
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
  const existingItem = state.editingId
    ? state.expenses.find((item) => item.id === state.editingId)
    : null;
  const formData = {
    date: ui.dom.inputDate.value,
    title: ui.dom.inputTitle.value,
    category: ui.dom.inputCategory.value,
    amount: ui.dom.inputAmount.value,
    type: type,
    wallet: ui.dom.inputWallet.value,
    walletTo: ui.dom.inputWalletTo.value,
    todayString: calc.getTodayString(),
  };

  const validationResult = validation.validateExpense(formData);
  if (!validationResult.valid) {
    ui.showToast(validationResult.errors[0], 'error');
    ui.flashRenderState(validationResult.errors[0], 'error', 2600);
    return;
  }

  const expenseItem = {
    id: state.editingId || calc.generateId(),
    date: validation.toIsoDate(formData.date),
    title: formData.title.trim(),
    category:
      type === 'transfer'
        ? 'Transfer'
        : normalizeCategoryName(formData.category) || OTHER_EXPENSE_CATEGORY,
    amount: Number(formData.amount.replace(/,/g, '')),
    type: type,
    wallet: formData.wallet,
    walletTo: type === 'transfer' ? formData.walletTo : null,
    isRecurring: ui.dom.inputRecurring.checked,
    recurringSourceId:
      existingItem && existingItem.recurringSourceId ? existingItem.recurringSourceId : null,
  };

  pushUndo();

  const hadEditingId = state.editingId;
  if (hadEditingId) {
    state.expenses = state.expenses.map((item) =>
      item.id === state.editingId ? expenseItem : item
    );
    if (syncRecurringForExpense(expenseItem)) {
      storage.saveRecurring(state.recurringExpenses);
    }
    ui.showToast('Transaksi diperbarui', 'success');
    ui.flashRenderState('Transaksi diperbarui.', 'success', 2200);
  } else {
    state.expenses.unshift(expenseItem);
    if (syncRecurringForExpense(expenseItem)) {
      storage.saveRecurring(state.recurringExpenses);
    }
    ui.showToast('Transaksi disimpan', 'success');
    ui.flashRenderState('Transaksi disimpan.', 'success', 2200);
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
    const item = state.expenses.find((ex) => ex.id === id);
    if (item) startEdit(item);
  } else if (deleteBtn) {
    const id = deleteBtn.dataset.id;
    if (id) openDeleteModal(id);
  } else if (pinBtn) {
    const id = pinBtn.dataset.id;
    const item = state.expenses.find((ex) => ex.id === id);
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
  state.expenses = state.expenses.filter((e) => e.id !== id);
  if (removeRecurringForExpenseId(id)) {
    storage.saveRecurring(state.recurringExpenses);
  }
  storage.saveExpenses(state.expenses);
  ui.renderTable();
  ui.renderRecentTransactions();
  ui.showToast('Transaksi dihapus', 'info');
}

function handleUndo() {
  if (state.undoStack.length === 0) return;
  const lastState = state.undoStack.pop();
  let parsed = null;
  try {
    parsed = JSON.parse(lastState);
  } catch (e) {
    parsed = null;
  }

  if (Array.isArray(parsed)) {
    state.expenses = parsed.map(sanitizeExpenseItem).filter(Boolean);
  } else if (parsed && typeof parsed === 'object') {
    if (Array.isArray(parsed.expenses)) {
      state.expenses = parsed.expenses.map(sanitizeExpenseItem).filter(Boolean);
    }
    if (Array.isArray(parsed.recurringExpenses)) {
      state.recurringExpenses = parsed.recurringExpenses.map(sanitizeRecurring).filter(Boolean);
      storage.saveRecurring(state.recurringExpenses);
    }
  }

  storage.saveExpenses(state.expenses);
  ui.renderTable();
  ui.renderRecentTransactions();
  ui.updateUndoIndicator();
  ui.showToast('Aksi dibatalkan (Undo)', 'info');
}

function pushUndo() {
  state.undoStack.push(
    JSON.stringify({
      expenses: state.expenses,
      recurringExpenses: state.recurringExpenses,
    })
  );
  if (state.undoStack.length > MAX_UNDO) state.undoStack.shift();
  ui.updateUndoIndicator();
}

function handleSaveBudget() {
  const val = Number(ui.dom.inputBudgetLimit.value.replace(/,/g, ''));
  storage.saveBudgetLimit(val);
  ui.dom.budgetOverlay.classList.remove('active');
  ui.updateHero();
  ui.showToast('Batas bulanan disimpan', 'success');
}

function pinToTemplates(item) {
  const existing = state.templates.find((t) => t.title === item.title && t.amount === item.amount);
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
    wallet: item.wallet,
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

  const typeRadio = document.querySelector(
    `input[name="input-type"][value="${tpl.type || 'expense'}"]`
  );
  if (typeRadio) typeRadio.checked = true;

  ui.syncConditionalFields();
  ui.setActiveView('add', true);
}

function handleDeleteTemplate(id) {
  state.templates = state.templates.filter((t) => t.id !== id);
  storage.saveTemplates(state.templates);
  ui.renderTemplateStrip(handleUseTemplate, handleDeleteTemplate);
  ui.showToast('Template dihapus', 'info');
}

function handleSaveCustomCategory() {
  let name = ui.dom.inputCustomCatName.value.trim();
  const type = ui.dom.inputCustomCatType.value;
  const icon = ui.dom.inputCustomCatIcon.value || 'ph-tag';
  if (type === 'expense') name = normalizeCategoryName(name);

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
  const goal = state.goals.find((g) => g.id === id);
  if (goal) {
    ui.dom.inputGoalFundId.value = id;
    ui.dom.goalFundSubtitle.textContent = 'Menabung untuk: ' + goal.name;
    ui.dom.inputGoalFundAmount.value = '';
    ui.dom.goalFundOverlay.classList.add('active');
  }
}

function handleDeleteGoal(id) {
  if (confirm('Hapus tabungan impian ini?')) {
    state.goals = state.goals.filter((g) => g.id !== id);
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

  const goal = state.goals.find((g) => g.id === gid);
  if (!goal) return;

  const data = {
    id: calc.generateId(),
    type: 'transfer',
    wallet: src,
    walletTo: 'Goal-' + gid,
    date: calc.getTodayString(),
    title: 'Tabungan: ' + goal.name,
    category: 'Transfer',
    amount: amt,
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
  const rows = state.expenses.map((e) => [
    e.date,
    e.title,
    e.category,
    e.type,
    e.wallet,
    e.walletTo || '',
    e.amount,
  ]);

  const csvContent = [headers, ...rows].map((r) => r.map(escapeCsvCell).join(',')).join('\n');
  downloadFile(csvContent, 'expense_tracker_export.csv', 'text/csv');
  ui.showToast('CSV Berhasil diekspor', 'success');
}

function handleExportJson() {
  const data = JSON.stringify(
    {
      expenses: state.expenses,
      wallets: state.wallets,
      categories: state.customCategories,
      goals: state.goals,
      templates: state.templates,
      recurring: state.recurringExpenses,
      budgets: state.categoryBudgets,
      split: state.splitLedger,
      sharedLedgers: sharedLedgers.loadSharedLedgers(),
    },
    null,
    2
  );

  downloadFile(data, 'expense_tracker_backup.json', 'application/json');
  ui.showToast('JSON Berhasil diekspor', 'success');
}

function handleImportJson(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const rawData = JSON.parse(event.target.result);
      const data = sanitizeImportPayload(rawData);
      if (!data.hasValidSection) {
        ui.showToast('Struktur JSON tidak dikenali', 'error');
        ui.flashRenderState('Struktur JSON tidak dikenali.', 'error', 2800);
        return;
      }
      openImportModeModal(data);
      ui.flashRenderState('File valid. Pilih mode impor.', 'warning', 2600);
    } catch (err) {
      ui.showToast('Format JSON tidak valid', 'error');
      ui.flashRenderState('Format JSON tidak valid.', 'error', 2800);
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

// ─── Shared Ledger Functions ───────────────

function openSharedLedgerCreateModal() {
  const overlay = document.getElementById('shared-ledger-create-overlay');
  if (!overlay) return;

  // Reset form
  document.getElementById('input-shared-ledger-name').value = '';
  document.getElementById('input-shared-ledger-description').value = '';

  // Reset members to one empty row
  const membersContainer = document.getElementById('shared-ledger-members-input');
  membersContainer.innerHTML = `
    <div class="ledger-member-row">
      <input type="color" class="ledger-member-color-picker" value="#6366f1" title="Pilih warna" />
      <input type="text" class="ledger-member-name" placeholder="Nama anggota" />
    </div>
  `;

  overlay.classList.add('active');
}

function closeSharedLedgerCreateModal() {
  const overlay = document.getElementById('shared-ledger-create-overlay');
  if (overlay) overlay.classList.remove('active');
}

function addLedgerMemberRow() {
  const membersContainer = document.getElementById('shared-ledger-members-input');
  const colors = [
    '#6366f1',
    '#ec4899',
    '#f97316',
    '#10b981',
    '#3b82f6',
    '#8b5cf6',
    '#ef4444',
    '#06b6d4',
  ];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  const row = document.createElement('div');
  row.className = 'ledger-member-row';
  row.innerHTML = `
    <input type="color" class="ledger-member-color-picker" value="${randomColor}" title="Pilih warna" />
    <input type="text" class="ledger-member-name" placeholder="Nama anggota" />
    <button type="button" class="btn btn-ghost btn-sm" onclick="this.parentElement.remove()">✕</button>
  `;
  membersContainer.appendChild(row);
}

function handleSaveSharedLedger() {
  const name = document.getElementById('input-shared-ledger-name').value.trim();
  const description = document.getElementById('input-shared-ledger-description').value.trim();

  if (!name) {
    ui.showToast('Nama grup wajib diisi', 'error');
    return;
  }

  // Collect members
  const members = [];
  const rows = document.querySelectorAll('#shared-ledger-members-input .ledger-member-row');
  rows.forEach((row) => {
    const color = row.querySelector('.ledger-member-color-picker').value;
    const nameInput = row.querySelector('.ledger-member-name');
    const memberName = nameInput.value.trim();
    if (memberName) {
      members.push({
        id: `member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: memberName,
        color,
      });
    }
  });

  if (members.length < 2) {
    ui.showToast('Minimal 2 anggota untuk grup patungan', 'error');
    return;
  }

  const ledger = sharedLedgers.createSharedLedger({ name, description, members });

  closeSharedLedgerCreateModal();
  renderSharedLedgers();
  ui.showToast('Grup patungan berhasil dibuat', 'success');
}

let currentViewingLedgerId = null;

function renderSharedLedgers() {
  const ledgers = sharedLedgers.loadSharedLedgers().filter((l) => !l.isArchived);

  const listContainer = document.getElementById('shared-ledger-list');
  const emptyState = document.getElementById('shared-ledger-empty');
  const detailContainer = document.getElementById('shared-ledger-detail');

  if (ledgers.length === 0) {
    listContainer.style.display = 'none';
    emptyState.style.display = 'block';
    detailContainer.style.display = 'none';
  } else {
    listContainer.style.display = 'block';
    emptyState.style.display = 'none';

    ui.renderSharedLedgerList(
      ledgers,
      (ledger) => {
        // onSelect
        currentViewingLedgerId = ledger.id;
        listContainer.style.display = 'none';
        emptyState.style.display = 'none';
        detailContainer.style.display = 'block';

        ui.renderSharedLedgerDetail(
          ledger,
          () => {
            // onBack
            currentViewingLedgerId = null;
            renderSharedLedgers();
          },
          () => {
            // onAddBill - open split bill with ledger context
            openSplitOverlayForLedger(ledger.id);
          },
          async (ledger) => {
            // onShare
            const success = await ui.copyLedgerSummaryToClipboard(ledger);
            if (success) {
              ui.showToast('Ringkasan disalin ke clipboard', 'success');
            } else {
              ui.showToast('Gagal menyalin, coba lagi', 'error');
            }
          }
        );
      },
      () => {
        // onCreate
        openSharedLedgerCreateModal();
      }
    );
  }
}

function openSplitOverlayForLedger(ledgerId) {
  const ledger = sharedLedgers.loadSharedLedgers().find((l) => l.id === ledgerId);
  if (!ledger) return;

  // Pre-fill owner name if current user is a member
  const ownerInput = document.getElementById('split-owner-name');
  if (ownerInput && ledger.members.length > 0) {
    ownerInput.value = ledger.members[0].name;
  }

  // Pre-populate participants
  const personList = document.getElementById('split-person-list');
  personList.innerHTML = '';

  ledger.members.forEach((member) => {
    const row = ui.addPersonRow(member.name);
    if (row) {
      row.dataset.personId = member.id;
    }
  });

  ui.syncSplitPayerOptions();
  ui.dom.splitOverlay.classList.add('active');

  // Override save split to add to ledger
  const saveBtn = document.getElementById('btn-save-split');
  const originalSaveHandler = saveBtn.onclick;

  saveBtn.onclick = function () {
    handleSaveSplitToLedgerWithContext(ledgerId);
  };
}

function handleSaveSplitToLedgerWithContext(ledgerId) {
  if (!state.currentSplitResults) return;

  const ledger = sharedLedgers.loadSharedLedgers().find((l) => l.id === ledgerId);
  if (!ledger) return;

  const bill = {
    ...state.currentSplitResults,
    id: calc.generateId(),
    ledgerId: ledgerId,
    addedAt: new Date().toISOString(),
  };

  sharedLedgers.addBillToLedger(ledgerId, bill);

  ui.dom.splitOverlay.classList.remove('active');
  state.currentSplitResults = null;
  ui.updateSplitModalHeader();
  ui.showToast('Tagihan ditambahkan ke grup patungan', 'success');

  // Refresh the ledger detail view if viewing
  if (currentViewingLedgerId === ledgerId) {
    renderSharedLedgers();
    const updatedLedger = sharedLedgers.loadSharedLedgers().find((l) => l.id === ledgerId);
    if (updatedLedger) {
      const listContainer = document.getElementById('shared-ledger-list');
      const detailContainer = document.getElementById('shared-ledger-detail');
      listContainer.style.display = 'none';
      document.getElementById('shared-ledger-empty').style.display = 'none';
      detailContainer.style.display = 'block';

      ui.renderSharedLedgerDetail(
        updatedLedger,
        () => {
          currentViewingLedgerId = null;
          renderSharedLedgers();
        },
        () => openSplitOverlayForLedger(ledgerId),
        async (ledger) => {
          const success = await ui.copyLedgerSummaryToClipboard(ledger);
          if (success) {
            ui.showToast('Ringkasan disalin ke clipboard', 'success');
          } else {
            ui.showToast('Gagal menyalin, coba lagi', 'error');
          }
        }
      );
    }
  }
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
    const name = row.querySelector('.person-name-input').value.trim() || `Peserta ${i + 1}`;
    let customAmt = 0;
    if (mode === 'custom') {
      customAmt = Number(row.querySelector('.custom-amount').value.replace(/,/g, '')) || 0;
    }
    people.push({ id, name, customAmount: customAmt });
  });

  const results = calc.calculateSplitResults(
    billName,
    total,
    mode,
    people,
    payerId,
    ownerName,
    calc.getTodayString()
  );
  if (results && results.errorCode === 'CUSTOM_TOTAL_MISMATCH') {
    ui.showToast(results.errorMessage, 'error');
    return;
  }

  if (!results) {
    ui.showToast('Nama Saya harus ada di daftar peserta', 'error');
    return;
  }

  state.currentSplitResults = results;
  ui.renderSplitResults(results);
}

function handleSaveSplitToLedger() {
  if (!state.currentSplitResults) return;

  if (state.splitEditingId) {
    const existingIndex = state.splitLedger.findIndex((item) => item.id === state.splitEditingId);
    if (existingIndex !== -1) {
      const previous = state.splitLedger[existingIndex];
      const updatedEntry = {
        ...previous,
        ...state.currentSplitResults,
        id: previous.id,
      };
      if (
        previous.syncedExpenseId &&
        Number(previous.ownerShare) !== Number(updatedEntry.ownerShare)
      ) {
        updatedEntry.syncedExpenseId = null;
        updatedEntry.syncedAt = null;
      }
      state.splitLedger[existingIndex] = updatedEntry;
      storage.saveSplitLedger(state.splitLedger);
      ui.renderSplitLedgerTable();
      ui.renderSplitHistory();
      ui.dom.splitOverlay.classList.remove('active');
      state.splitEditingId = null;
      state.currentSplitResults = null;
      ui.updateSplitModalHeader();
      ui.showToast('Split bill diperbarui', 'success');
      return;
    }
    state.splitEditingId = null;
  }

  const entry = {
    ...state.currentSplitResults,
    id: calc.generateId(),
    isDone: false,
    syncedExpenseId: null,
  };

  state.splitLedger.unshift(entry);
  storage.saveSplitLedger(state.splitLedger);
  ui.renderSplitLedgerTable();
  ui.renderSplitHistory();
  ui.dom.splitOverlay.classList.remove('active');
  state.currentSplitResults = null;
  ui.updateSplitModalHeader();
  ui.showToast('Split bill disimpan ke ledger', 'success');
}

function handleSplitLedgerAction(e) {
  const btn = e.target.closest('[data-split-action]');
  if (!btn) return;

  const action = btn.dataset.splitAction;
  const id = btn.dataset.id;
  const entry = state.splitLedger.find((s) => s.id === id);

  if (action === 'edit') {
    if (entry) openSplitEditor(entry);
  } else if (action === 'delete') {
    if (confirm('Hapus riwayat split ini?')) {
      state.splitLedger = state.splitLedger.filter((s) => s.id !== id);
      storage.saveSplitLedger(state.splitLedger);
      ui.renderSplitLedgerTable();
      ui.renderSplitHistory();
      ui.showToast('Riwayat split dihapus', 'info');
    }
  } else if (action === 'done') {
    if (entry) {
      entry.isDone = true;
      entry.doneAt = calc.getTodayString();
      storage.saveSplitLedger(state.splitLedger);
      ui.renderSplitLedgerTable();
      ui.renderSplitHistory();
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
        splitLedgerId: entry.id,
      };
      state.expenses.unshift(expense);
      entry.syncedExpenseId = expense.id;
      entry.syncedAt = calc.getTodayString();
      storage.saveExpenses(state.expenses);
      storage.saveSplitLedger(state.splitLedger);
      ui.renderTable();
      ui.renderSplitLedgerTable();
      ui.renderSplitHistory();
      ui.showToast('Sinkron ke pengeluaran berhasil', 'success');
    }
  }
}

// ─── Recurring ────────────────────────────
function processRecurringExpenses() {
  const today = calc.getTodayString();
  const recurringState = getDueRecurringQueue(today);
  if (recurringState.changed) {
    storage.saveRecurring(state.recurringExpenses);
  }

  if (recurringState.queue.length === 0) return;
  state.pendingRecurring = recurringState.queue;
  renderRecurringPrompt();
}

// ─── Init ──────────────────────────────────
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', init);
}
