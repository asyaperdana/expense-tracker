/* ===========================
   storage.js — All localStorage interactions
   =========================== */

const STORAGE_KEY = 'expense_tracker_data';
const THEME_KEY = 'expense_tracker_theme';
const FILTER_KEY = 'expense_tracker_filters';
const BUDGET_KEY = 'expense_tracker_budget';
const CATEGORY_BUDGET_KEY = 'expense_tracker_category_budget';
const SPLIT_LEDGER_KEY = 'expense_tracker_splits';
const PROFILE_KEY = 'expense_tracker_profile';
const CUSTOM_CAT_KEY = 'expense_tracker_custom_cat';
const RECURRING_KEY = 'expense_tracker_recurring';
const GOALS_KEY = 'expense_tracker_goals';
const WALLETS_KEY = 'expense_tracker_wallets';
const TEMPLATES_KEY = 'expense_tracker_templates';
const VIEW_KEY = 'expense_tracker_active_view';

// ─── Expenses ─────────────────────────────
export function loadExpenses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveExpenses(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ─── Recurring ────────────────────────────
export function loadRecurring() {
  try {
    const raw = localStorage.getItem(RECURRING_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveRecurring(data) {
  localStorage.setItem(RECURRING_KEY, JSON.stringify(data));
}

// ─── Custom Categories ────────────────────
export function loadCustomCategoriesData() {
  try {
    const raw = localStorage.getItem(CUSTOM_CAT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveCustomCategories(data) {
  localStorage.setItem(CUSTOM_CAT_KEY, JSON.stringify(data));
}

// ─── Goals ────────────────────────────────
export function loadGoals() {
  try {
    const raw = localStorage.getItem(GOALS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveGoals(data) {
  localStorage.setItem(GOALS_KEY, JSON.stringify(data));
}

// ─── Profile ──────────────────────────────
export function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed.name === 'string') {
      return { name: parsed.name.trim() };
    }
    return { name: '' };
  } catch (e) {
    return { name: '' };
  }
}

export function saveProfile(data) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify({
    name: (data.name || '').trim(),
  }));
}

// ─── Wallets ──────────────────────────────
export function loadWalletsData() {
  try {
    const raw = localStorage.getItem(WALLETS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function saveWallets(data) {
  localStorage.setItem(WALLETS_KEY, JSON.stringify(data));
}

// ─── Templates ────────────────────────────
export function loadTemplatesData() {
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveTemplates(data) {
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(data));
}

// ─── Theme ────────────────────────────────
export function getTheme() {
  return localStorage.getItem(THEME_KEY) || 'dark';
}

export function setThemeStorage(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

// ─── Budget ───────────────────────────────
export function getBudgetLimit() {
  return Number(localStorage.getItem(BUDGET_KEY)) || 0;
}

export function saveBudgetLimit(val) {
  localStorage.setItem(BUDGET_KEY, val);
}

// ─── Category Budgets ─────────────────────
export function loadCategoryBudgets() {
  try {
    const raw = localStorage.getItem(CATEGORY_BUDGET_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const result = {};
    if (parsed && typeof parsed === 'object') {
      Object.keys(parsed).forEach(function (cat) {
        const val = Number(parsed[cat]);
        if (cat && val > 0) result[cat] = val;
      });
    }
    return result;
  } catch (e) {
    return {};
  }
}

export function saveCategoryBudgets(data) {
  localStorage.setItem(CATEGORY_BUDGET_KEY, JSON.stringify(data));
}

// ─── Split Ledger ─────────────────────────
export function loadSplitLedger() {
  try {
    const raw = localStorage.getItem(SPLIT_LEDGER_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveSplitLedger(data) {
  localStorage.setItem(SPLIT_LEDGER_KEY, JSON.stringify(data));
}

// ─── Filters ──────────────────────────────
export function loadFilters() {
  try {
    const raw = localStorage.getItem(FILTER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function saveFilters(data) {
  localStorage.setItem(FILTER_KEY, JSON.stringify(data));
}

export function removeFilters() {
  localStorage.removeItem(FILTER_KEY);
}

// ─── Active View ──────────────────────────
export function getActiveView() {
  try {
    return localStorage.getItem(VIEW_KEY);
  } catch (e) {
    return null;
  }
}

export function saveActiveView(view) {
  try {
    localStorage.setItem(VIEW_KEY, view);
  } catch (e) {
    // ignore
  }
}
