const { test, expect } = require('@playwright/test');

const FIXED_NOW_ISO = '2026-03-04T10:15:00.000+07:00';
const SNAPSHOT_VIEWS = ['dashboard', 'history', 'report'];

const SEEDED_STORAGE = {
  expense_tracker_data: [
    { id: 'tx-001', date: '2026-03-03', title: 'Gaji Maret', category: 'Gaji', amount: 12000000, type: 'income', wallet: 'Rekening Bank', walletTo: null },
    { id: 'tx-002', date: '2026-03-03', title: 'Belanja Bulanan', category: 'Belanja', amount: 1250000, type: 'expense', wallet: 'Rekening Bank', walletTo: null },
    { id: 'tx-003', date: '2026-03-02', title: 'Makan Siang Tim', category: 'Makanan', amount: 285000, type: 'expense', wallet: 'E-Wallet', walletTo: null },
    { id: 'tx-004', date: '2026-03-02', title: 'Transport Online', category: 'Transport', amount: 98000, type: 'expense', wallet: 'E-Wallet', walletTo: null },
    { id: 'tx-005', date: '2026-03-01', title: 'Tagihan Internet', category: 'Tagihan', amount: 420000, type: 'expense', wallet: 'Rekening Bank', walletTo: null },
    { id: 'tx-006', date: '2026-02-25', title: 'Freelance UI Audit', category: 'Pemasukan Lain', amount: 1850000, type: 'income', wallet: 'Rekening Bank', walletTo: null },
    { id: 'tx-007', date: '2026-02-19', title: 'Hiburan Akhir Pekan', category: 'Hiburan', amount: 315000, type: 'expense', wallet: 'Tunai', walletTo: null },
    { id: 'tx-008', date: '2026-02-09', title: 'Vitamin', category: 'Kesehatan', amount: 145000, type: 'expense', wallet: 'Tunai', walletTo: null },
    { id: 'tx-009', date: '2026-01-20', title: 'Kelas Online', category: 'Pendidikan', amount: 510000, type: 'expense', wallet: 'Rekening Bank', walletTo: null },
    { id: 'tx-010', date: '2026-01-06', title: 'Gaji Januari', category: 'Gaji', amount: 11500000, type: 'income', wallet: 'Rekening Bank', walletTo: null },
    { id: 'tx-011', date: '2025-12-18', title: 'Belanja Harian', category: 'Belanja', amount: 690000, type: 'expense', wallet: 'E-Wallet', walletTo: null },
    { id: 'tx-012', date: '2025-12-02', title: 'Gaji Desember', category: 'Gaji', amount: 11200000, type: 'income', wallet: 'Rekening Bank', walletTo: null },
    { id: 'tx-013', date: '2025-11-14', title: 'Makan Keluarga', category: 'Makanan', amount: 470000, type: 'expense', wallet: 'Tunai', walletTo: null },
    { id: 'tx-014', date: '2025-11-03', title: 'Gaji November', category: 'Gaji', amount: 11000000, type: 'income', wallet: 'Rekening Bank', walletTo: null },
    { id: 'tx-015', date: '2025-10-29', title: 'Transfer Cash', category: 'Transfer', amount: 500000, type: 'transfer', wallet: 'Rekening Bank', walletTo: 'Tunai' },
    { id: 'tx-016', date: '2025-10-03', title: 'Gaji Oktober', category: 'Gaji', amount: 10800000, type: 'income', wallet: 'Rekening Bank', walletTo: null }
  ],
  expense_tracker_wallets: [
    { id: 'w1', name: 'Tunai', icon: 'ph-money' },
    { id: 'w2', name: 'Rekening Bank', icon: 'ph-bank' },
    { id: 'w3', name: 'E-Wallet', icon: 'ph-device-mobile' }
  ],
  expense_tracker_templates: [
    { id: 'tpl-1', title: 'Makan Siang', category: 'Makanan', amount: 45000, type: 'expense', wallet: 'E-Wallet' },
    { id: 'tpl-2', title: 'Transport Harian', category: 'Transport', amount: 30000, type: 'expense', wallet: 'E-Wallet' }
  ],
  expense_tracker_goals: [
    { id: 'goal-1', name: 'Dana Darurat', target: 25000000 }
  ],
  expense_tracker_category_budget: {
    Makanan: 1800000,
    Transport: 850000,
    Belanja: 2600000,
    Hiburan: 700000,
    Tagihan: 900000
  },
  expense_tracker_custom_cat: [],
  expense_tracker_recurring: [],
  expense_tracker_splits: [
    {
      id: 'split-1',
      date: '2026-03-01',
      billName: 'Makan Kantor',
      total: 360000,
      ownerName: 'Asya',
      ownerShare: 120000,
      ownerStatusKey: 'pay',
      ownerStatusText: 'Harus bayar Rp 120.000',
      isDone: false,
      payerName: 'Bimo',
      payerId: 'p2',
      mode: 'equal',
      people: [
        { id: 'p1', name: 'Asya', paid: 0, share: 120000, net: -120000 },
        { id: 'p2', name: 'Bimo', paid: 360000, share: 120000, net: 240000 },
        { id: 'p3', name: 'Citra', paid: 0, share: 120000, net: -120000 }
      ],
      syncedExpenseId: null
    }
  ],
  expense_tracker_profile: { name: 'Asya' },
};

function getThemeFromProject(projectName) {
  return projectName.includes('dark') ? 'dark' : 'light';
}

async function bootstrapPage(page, opts) {
  await page.route('https://cdn.jsdelivr.net/npm/chart.js*', (route) => route.abort());
  await page.route('https://fonts.googleapis.com/*', (route) => route.abort());
  await page.route('https://fonts.gstatic.com/*', (route) => route.abort());

  await page.addInitScript(({ fixedNowIso, activeView, theme, seededStorage }) => {
    const fixedTimestamp = new Date(fixedNowIso).getTime();
    const NativeDate = Date;

    class MockDate extends NativeDate {
      constructor(...args) {
        if (args.length === 0) {
          super(fixedTimestamp);
          return;
        }
        super(...args);
      }
      static now() {
        return fixedTimestamp;
      }
      static parse(...args) {
        return NativeDate.parse(...args);
      }
      static UTC(...args) {
        return NativeDate.UTC(...args);
      }
    }

    Object.defineProperty(window, 'Date', {
      value: MockDate,
      configurable: true,
      writable: true,
    });

    localStorage.clear();
    Object.keys(seededStorage).forEach((key) => {
      localStorage.setItem(key, JSON.stringify(seededStorage[key]));
    });
    localStorage.setItem('expense_tracker_theme', theme);
    localStorage.setItem('expense_tracker_active_view', activeView);
    localStorage.setItem('expense_tracker_budget', '4500000');
    Object.defineProperty(window, 'Chart', {
      value: undefined,
      configurable: true,
      writable: false,
    });
  }, {
    fixedNowIso: FIXED_NOW_ISO,
    activeView: opts.activeView,
    theme: opts.theme,
    seededStorage: SEEDED_STORAGE,
  });

  await page.goto('/', { waitUntil: 'networkidle' });
  await page.addStyleTag({
    content: [
      '*',
      '*::before',
      '*::after',
      '{ transition: none !important; animation: none !important; }',
    ].join(' '),
  });
}

async function waitForStableUI(page) {
  await page.waitForSelector('main.container');
  await expect(page.locator('.card.is-loading')).toHaveCount(0, { timeout: 12000 });
  await expect(page.locator('#render-state.state-loading')).toHaveCount(0, { timeout: 12000 });
  await page.waitForTimeout(200);
}

async function waitForViewReady(page, activeView) {
  if (activeView === 'dashboard') {
    await expect(page.locator('#recent-list .recent-row').first()).toBeVisible({ timeout: 12000 });
    return;
  }
  if (activeView === 'history') {
    await expect(page.locator('#expense-tbody tr').first()).toBeVisible({ timeout: 12000 });
    return;
  }
  if (activeView === 'report') {
    await expect(page.locator('#report-income')).not.toHaveText('Rp 0', { timeout: 12000 });
  }
}

for (const activeView of SNAPSHOT_VIEWS) {
  test(`baseline ${activeView} view`, async ({ page }, testInfo) => {
    const theme = getThemeFromProject(testInfo.project.name);
    await bootstrapPage(page, { activeView, theme });
    await waitForStableUI(page);
    await waitForViewReady(page, activeView);
    await page.waitForTimeout(180);

    const image = await page.screenshot({
      fullPage: true,
      animations: 'disabled',
      caret: 'hide',
    });
    expect(image).toMatchSnapshot(`${activeView}.png`, {
      maxDiffPixelRatio: 0.01,
    });
  });
}
