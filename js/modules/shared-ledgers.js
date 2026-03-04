/* ===========================
   shared-ledgers.js — Group expense tracking & settlement
   =========================== */

// ─── Types ---
/**
 * SharedLedger Group structure:
 * {
 *   id: string,
 *   name: string,
 *   description: string,
 *   members: [{ id, name, color }],
 *   bills: [SplitEntry],
 *   createdAt: string,
 *   updatedAt: string,
 *   isArchived: boolean
 * }
 */

import { generateId } from './state.js';
import * as storage from './storage.js';

const SHARED_LEDGER_KEY = 'expense_tracker_shared_ledgers';

// ─── Storage Functions ---

/**
 * Loads shared ledgers from localStorage.
 * @returns {Array} Array of shared ledger groups
 */
export function loadSharedLedgers() {
  try {
    const raw = localStorage.getItem(SHARED_LEDGER_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Saves shared ledgers to localStorage.
 * @param {Array} data - Array of shared ledger groups
 */
export function saveSharedLedgers(data) {
  localStorage.setItem(SHARED_LEDGER_KEY, JSON.stringify(data));
}

// ─── Core Functions ---

/**
 * Creates a new shared ledger group.
 * @param {Object} params - { name, description, members }
 * @returns {Object} New ledger object
 */
export function createSharedLedger({ name, description = '', members = [] }) {
  const now = new Date().toISOString();
  const ledger = {
    id: generateId(),
    name: name.trim(),
    description: description.trim(),
    members: members.map((m, i) => ({
      id: m.id || `member-${i + 1}`,
      name: m.name.trim(),
      color: m.color || getMemberColor(i),
    })),
    bills: [],
    createdAt: now,
    updatedAt: now,
    isArchived: false,
  };

  const ledgers = loadSharedLedgers();
  ledgers.unshift(ledger);
  saveSharedLedgers(ledgers);

  return ledger;
}

/**
 * Adds a split bill to a shared ledger.
 * @param {string} ledgerId - Ledger ID
 * @param {Object} bill - Split bill entry
 * @returns {boolean} Success status
 */
export function addBillToLedger(ledgerId, bill) {
  const ledgers = loadSharedLedgers();
  const ledger = ledgers.find((l) => l.id === ledgerId);

  if (!ledger) return false;

  // Ensure bill has ledger reference
  const billWithRef = {
    ...bill,
    ledgerId,
    addedAt: new Date().toISOString(),
  };

  ledger.bills.push(billWithRef);
  ledger.updatedAt = new Date().toISOString();

  saveSharedLedgers(ledgers);
  return true;
}

/**
 * Removes a bill from a shared ledger.
 * @param {string} ledgerId - Ledger ID
 * @param {string} billId - Bill ID
 * @returns {boolean} Success status
 */
export function removeBillFromLedger(ledgerId, billId) {
  const ledgers = loadSharedLedgers();
  const ledger = ledgers.find((l) => l.id === ledgerId);

  if (!ledger) return false;

  ledger.bills = ledger.bills.filter((b) => b.id !== billId);
  ledger.updatedAt = new Date().toISOString();

  saveSharedLedgers(ledgers);
  return true;
}

/**
 * Deletes a shared ledger.
 * @param {string} ledgerId - Ledger ID
 * @returns {boolean} Success status
 */
export function deleteSharedLedger(ledgerId) {
  const ledgers = loadSharedLedgers();
  const filtered = ledgers.filter((l) => l.id !== ledgerId);

  if (filtered.length === ledgers.length) return false;

  saveSharedLedgers(filtered);
  return true;
}

/**
 * Archives/unarchives a shared ledger.
 * @param {string} ledgerId - Ledger ID
 * @param {boolean} isArchived - Archive status
 * @returns {boolean} Success status
 */
export function archiveSharedLedger(ledgerId, isArchived = true) {
  const ledgers = loadSharedLedgers();
  const ledger = ledgers.find((l) => l.id === ledgerId);

  if (!ledger) return false;

  ledger.isArchived = isArchived;
  ledger.updatedAt = new Date().toISOString();

  saveSharedLedgers(ledgers);
  return true;
}

// ─── Settlement Logic ---

/**
 * Calculates settlement summary for a ledger.
 * @param {Object} ledger - Shared ledger object
 * @returns {Object} Settlement summary
 */
export function calculateSettlement(ledger) {
  if (!ledger || !ledger.bills || ledger.bills.length === 0) {
    return {
      memberBalances: {},
      transactions: [],
      totalAmount: 0,
      isSettled: true,
    };
  }

  const memberBalances = {};

  // Initialize balances for all members
  ledger.members.forEach((member) => {
    memberBalances[member.id] = {
      id: member.id,
      name: member.name,
      color: member.color,
      paid: 0,
      owed: 0,
      net: 0,
    };
  });

  // Calculate from all bills
  let totalAmount = 0;

  ledger.bills.forEach((bill) => {
    if (!bill.people) return;

    totalAmount += bill.total || 0;

    bill.people.forEach((person) => {
      const memberId = findMemberId(ledger.members, person.name);
      if (!memberId) return;

      memberBalances[memberId].paid += person.paid || 0;
      memberBalances[memberId].owed += person.share || 0;
    });
  });

  // Calculate net for each member
  Object.keys(memberBalances).forEach((id) => {
    const member = memberBalances[id];
    member.net = member.paid - member.owed;
  });

  // Calculate who owes whom (simplified settlement)
  const transactions = calculateSimplifiedSettlement(memberBalances);

  return {
    memberBalances,
    transactions,
    totalAmount,
    isSettled: transactions.length === 0,
  };
}

/**
 * Finds member ID by name (case-insensitive).
 * @param {Array} members - Array of member objects
 * @param {string} name - Name to search for
 * @returns {string|null} Member ID or null
 */
function findMemberId(members, name) {
  const normalizedName = name.toLowerCase().trim();
  const member = members.find((m) => m.name.toLowerCase().trim() === normalizedName);
  return member ? member.id : null;
}

/**
 * Calculates simplified settlement transactions.
 * Minimizes number of transactions needed to settle debts.
 * @param {Object} memberBalances - Member balance map
 * @returns {Array} Array of settlement transactions
 */
function calculateSimplifiedSettlement(memberBalances) {
  const transactions = [];

  // Separate debtors (negative net) and creditors (positive net)
  const debtors = [];
  const creditors = [];

  Object.values(memberBalances).forEach((member) => {
    if (member.net < -0.01) {
      debtors.push({ ...member, amount: Math.abs(member.net) });
    } else if (member.net > 0.01) {
      creditors.push({ ...member, amount: member.net });
    }
  });

  // Sort by amount (largest first for fewer transactions)
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  // Match debtors to creditors
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const amount = Math.min(debtor.amount, creditor.amount);

    if (amount > 0.01) {
      transactions.push({
        from: debtor.id,
        fromName: debtor.name,
        to: creditor.id,
        toName: creditor.name,
        amount: Math.round(amount),
      });
    }

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  return transactions;
}

// ─── Helper Functions ---

const MEMBER_COLORS = [
  '#6366f1',
  '#ec4899',
  '#f97316',
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#ef4444',
  '#06b6d4',
  '#f59e0b',
  '#14b8a6',
];

function getMemberColor(index) {
  return MEMBER_COLORS[index % MEMBER_COLORS.length];
}

/**
 * Generates a shareable summary text for a ledger.
 * @param {Object} ledger - Shared ledger
 * @returns {string} Formatted summary text
 */
export function generateShareableSummary(ledger) {
  const settlement = calculateSettlement(ledger);

  let text = `📊 *${ledger.name}*\n`;
  text += `Total: Rp ${settlement.totalAmount.toLocaleString('id-ID')}\n\n`;

  if (settlement.isSettled) {
    text += '✅ Sudah lunas semua!\n';
  } else {
    text += '*Yang harus dibayar:*\n';
    settlement.transactions.forEach((t) => {
      text += `• ${t.fromName} → ${t.toName}: Rp ${t.amount.toLocaleString('id-ID')}\n`;
    });
  }

  text += '\n*Per orang:*\n';
  Object.values(settlement.memberBalances).forEach((m) => {
    const status = m.net > 0 ? '+' : m.net < 0 ? '-' : '=';
    const emoji = m.net > 0 ? '🟢' : m.net < 0 ? '🔴' : '⚪';
    text += `${emoji} ${m.name}: ${status} Rp ${Math.abs(m.net).toLocaleString('id-ID')}\n`;
  });

  return text;
}

/**
 * Converts a standalone split entry to a ledger bill.
 * @param {Object} splitEntry - Split entry from splitLedger
 * @returns {Object} Bill object for ledger
 */
export function convertSplitToLedgerBill(splitEntry) {
  return {
    ...splitEntry,
    ledgerBillId: splitEntry.id,
    originalSplitId: splitEntry.id,
  };
}
