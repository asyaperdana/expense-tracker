import test from 'node:test';
import assert from 'node:assert/strict';

import { state } from '../../js/modules/state.js';
import {
  sanitizeExpenseItem,
  sanitizeWallet,
  sanitizeRecurring,
  sanitizeTemplate,
  sanitizeImportPayload,
  escapeCsvCell,
  getDueRecurringQueue,
} from '../../js/app.js';
import {
  calculateSplitResults,
  formatRupiahCompact,
  formatPercent,
  truncateLabel,
} from '../../js/modules/calculations.js';

test('sanitizeExpenseItem normalizes legacy category value', () => {
  const item = sanitizeExpenseItem({
    id: 'exp-1',
    date: '2026-03-03',
    title: 'Tes Legacy',
    category: 'Lainnya',
    amount: 12000,
    type: 'expense',
    wallet: 'Tunai',
  });

  assert.ok(item);
  assert.equal(item.category, 'Lainnya (Keluar)');
});

test('sanitizeWallet applies icon whitelist fallback', () => {
  const wallet = sanitizeWallet({
    id: 'w-custom',
    name: 'Dompet Aman',
    icon: 'ph-script-alert',
  }, 0);

  assert.ok(wallet);
  assert.equal(wallet.icon, 'ph-wallet');
});

test('sanitizeTemplate normalizes category and preserves valid data', () => {
  const template = sanitizeTemplate({
    id: 'tpl-1',
    title: 'Template Legacy',
    category: 'Lainnya',
    amount: 35000,
    type: 'expense',
    wallet: 'Tunai',
  }, 0);

  assert.ok(template);
  assert.equal(template.category, 'Lainnya (Keluar)');
});

test('sanitizeRecurring accepts valid skipUntil and drops invalid value', () => {
  const valid = sanitizeRecurring({
    id: 'rec-1',
    nextDate: '2026-03-03',
    skipUntil: '2026-03-10',
    template: {
      id: 'exp-1',
      date: '2026-03-01',
      title: 'Spotify',
      category: 'Tagihan',
      amount: 50000,
      type: 'expense',
      wallet: 'Tunai',
    },
  }, 0);
  assert.ok(valid);
  assert.equal(valid.skipUntil, '2026-03-10');

  const invalid = sanitizeRecurring({
    id: 'rec-2',
    nextDate: '2026-03-03',
    skipUntil: '03-10-2026',
    template: {
      id: 'exp-2',
      date: '2026-03-01',
      title: 'YouTube',
      category: 'Tagihan',
      amount: 70000,
      type: 'expense',
      wallet: 'Tunai',
    },
  }, 1);
  assert.ok(invalid);
  assert.equal(invalid.skipUntil, null);
});

test('sanitizeImportPayload dedupes goals/templates strictly by content', () => {
  const payload = sanitizeImportPayload({
    goals: [
      { id: 'g1', name: 'Dana Darurat', target: 5000000 },
      { id: 'g2', name: 'dana darurat', target: 7000000 },
    ],
    templates: [
      { id: 't1', title: 'Makan Siang', category: 'Lainnya', amount: 25000, type: 'expense', wallet: 'Tunai' },
      { id: 't2', title: 'makan siang', category: 'Lainnya (Keluar)', amount: 25000, type: 'expense', wallet: 'Tunai' },
    ],
  });

  assert.ok(payload.hasValidSection);
  assert.equal(payload.goals.length, 1);
  assert.equal(payload.templates.length, 1);
  assert.equal(payload.templates[0].category, 'Lainnya (Keluar)');
});

test('escapeCsvCell sanitizes formula-like values and quotes', () => {
  assert.equal(escapeCsvCell('=2+2'), '"\'=2+2"');
  assert.equal(escapeCsvCell('kata "aman"'), '"kata ""aman"""');
});

test('calculateSplitResults returns error on custom total mismatch', () => {
  const mismatch = calculateSplitResults(
    'Bill',
    100000,
    'custom',
    [
      { id: 'p1', name: 'Asya', customAmount: 40000 },
      { id: 'p2', name: 'Budi', customAmount: 30000 },
    ],
    'p1',
    'Asya',
    '2026-03-03'
  );

  assert.ok(mismatch);
  assert.equal(mismatch.errorCode, 'CUSTOM_TOTAL_MISMATCH');
  assert.equal(mismatch.difference, 30000);
});

test('calculateSplitResults succeeds when custom totals match', () => {
  const result = calculateSplitResults(
    'Bill',
    100000,
    'custom',
    [
      { id: 'p1', name: 'Asya', customAmount: 40000 },
      { id: 'p2', name: 'Budi', customAmount: 60000 },
    ],
    'p1',
    'Asya',
    '2026-03-03'
  );

  assert.ok(result);
  assert.equal(result.ownerShare, 40000);
  assert.equal(result.people.length, 2);
});

test('formatRupiahCompact standardizes rb/jt suffix and precision', () => {
  assert.equal(formatRupiahCompact(1250000, { maxFractionDigits: 1 }), 'Rp 1,3 jt');
  assert.equal(formatRupiahCompact(75000, { maxFractionDigits: 1 }), 'Rp 75 rb');
  assert.equal(formatRupiahCompact(75000, { withPrefix: false, maxFractionDigits: 1 }), '75 rb');
  assert.equal(formatRupiahCompact(1250000, { withPrefix: false, maxFractionDigits: 1, unitSpacing: false }), '1,3jt');
});

test('formatPercent uses id locale decimal separator', () => {
  assert.equal(formatPercent(12.34, 1), '12,3%');
  assert.equal(formatPercent(0, 1), '0%');
});

test('truncateLabel keeps short values and truncates long labels', () => {
  assert.equal(truncateLabel('Makan', 10), 'Makan');
  assert.equal(truncateLabel('Kategori Pengeluaran Panjang Sekali', 12), 'Kategori Pe…');
});

test('recurring queue respects skip_until and backfills overdue months', () => {
  const previous = state.recurringExpenses;
  try {
    state.recurringExpenses = [{
      id: 'rec-1',
      template: {
        id: 'tpl-1',
        date: '2026-01-01',
        title: 'Netflix',
        category: 'Tagihan',
        amount: 100000,
        type: 'expense',
        wallet: 'Tunai',
        walletTo: null,
        isRecurring: true,
        recurringSourceId: 'rec-1',
      },
      nextDate: '2026-01-01',
      skipUntil: '2026-03-03',
    }];

    let seed = 0;
    const makeId = () => 'due-' + (++seed);

    const snoozed = getDueRecurringQueue('2026-03-03', makeId);
    assert.equal(snoozed.queue.length, 0);

    state.recurringExpenses[0].skipUntil = '2026-03-02';
    const active = getDueRecurringQueue('2026-03-03', makeId);

    assert.equal(active.queue.length, 1);
    assert.equal(active.queue[0].dueItems.length, 3);
    assert.equal(active.queue[0].nextDate, '2026-04-01');
    assert.equal(active.changed, true);
  } finally {
    state.recurringExpenses = previous;
  }
});
