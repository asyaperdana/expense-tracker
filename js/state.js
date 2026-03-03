/* ===========================
   state.js — In-memory state management
   =========================== */

// ─── Constants ────────────────────────────
export const OTHER_EXPENSE_CATEGORY = 'Lainnya (Keluar)';
const LEGACY_OTHER_EXPENSE_CATEGORY_KEYS = ['lainnya', 'lainnya (keluar)'];

export const FALLBACK_WALLET_ICON = 'ph-wallet';
export const VALID_WALLET_ICONS = [
  'ph-wallet',
  'ph-bank',
  'ph-device-mobile',
  'ph-credit-card',
  'ph-money',
  'ph-coin',
  'ph-piggy-bank',
  'ph-storefront',
];

export const CATEGORY_COLORS = {
  Makanan: '#f97316',
  Transport: '#0ea5e9',
  Belanja: '#16a34a',
  Hiburan: '#f43f5e',
  Kesehatan: '#14b8a6',
  Pendidikan: '#eab308',
  Tagihan: '#2563eb',
  [OTHER_EXPENSE_CATEGORY]: '#64748b',
  Gaji: '#0ea5e9',
  'Pemasukan Lain': '#10b981',
};

export const CATEGORY_ICONS = {
  Makanan: '<i class="ph-fill ph-hamburger"></i>',
  Transport: '<i class="ph-fill ph-car-profile"></i>',
  Belanja: '<i class="ph-fill ph-shopping-cart"></i>',
  Hiburan: '<i class="ph-fill ph-popcorn"></i>',
  Kesehatan: '<i class="ph-fill ph-pill"></i>',
  Pendidikan: '<i class="ph-fill ph-book-open"></i>',
  Tagihan: '<i class="ph-fill ph-receipt"></i>',
  [OTHER_EXPENSE_CATEGORY]: '<i class="ph-fill ph-package"></i>',
  Gaji: '<i class="ph-fill ph-money"></i>',
  'Pemasukan Lain': '<i class="ph-fill ph-piggy-bank"></i>',
};

export const DEFAULT_WALLETS = [
  { id: 'w1', name: 'Tunai', icon: 'ph-money' },
  { id: 'w2', name: 'Rekening Bank', icon: 'ph-bank' },
  { id: 'w3', name: 'E-Wallet', icon: 'ph-device-mobile' },
];

export const AVAILABLE_ICONS = [
  'ph-star', 'ph-heart', 'ph-airplane-tilt', 'ph-bag', 'ph-game-controller',
  'ph-cat', 'ph-dog', 'ph-car', 'ph-house', 'ph-monitor', 'ph-music-note',
  'ph-camera', 'ph-coffee', 'ph-bicycle', 'ph-barbell', 'ph-books',
  'ph-graduation-cap', 'ph-bandaids', 'ph-bed', 'ph-plug'
];

export const AVAILABLE_COLORS = [
  '#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', '#6366f1',
  '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#22c55e',
  '#84cc16', '#eab308', '#f59e0b', '#f97316', '#ef4444'
];

export const AVATAR_COLORS = [
  '#6366f1', '#ec4899', '#f97316', '#10b981',
  '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4',
  '#f59e0b', '#14b8a6', '#e11d48', '#7c3aed',
];

export const MAX_UNDO = 10;

export const VALID_VIEWS = ['dashboard', 'add', 'history', 'report', 'tools'];

// ─── Mutable State ────────────────────────
export const state = {
  expenses: [],
  customCategories: [],
  recurringExpenses: [],
  goals: [],
  wallets: [],
  templates: [],
  categoryBudgets: {},
  userProfile: { name: '' },
  splitLedger: [],

  // UI state
  editingId: null,
  deleteTargetId: null,
  lastDeleted: null,
  undoTimer: null,
  undoStack: [],
  pendingImportData: null,

  // Chart state
  chartSlices: [],
  chartGeom: null,
  renderTimer: null,
  isPerfLite: false,
  chartHoverRaf: null,
  chartHoverEvent: null,
  categoryChartInstance: null,

  // Split state
  splitMode: 'equal',
  splitResults: null,
  currentSplitResults: null,
  splitPersonIdCounter: 0,
  splitEditingId: null,
  splitEditingDate: null,
  pendingRecurring: [],

  // Calendar
  calendarViewDate: new Date(),
};

// ─── Utility Functions ────────────────────
export function generateId() {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
}

export function normalizeWalletName(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

export function normalizeWalletIcon(value) {
  const icon = String(value || '').trim();
  if (!icon) return FALLBACK_WALLET_ICON;
  return VALID_WALLET_ICONS.includes(icon) ? icon : FALLBACK_WALLET_ICON;
}

export function normalizeCategoryName(value) {
  const normalized = String(value || '').replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  const key = normalized.toLowerCase();
  if (LEGACY_OTHER_EXPENSE_CATEGORY_KEYS.includes(key)) {
    return OTHER_EXPENSE_CATEGORY;
  }
  return normalized;
}
