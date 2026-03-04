# Expense Tracker — Personal Finance Manager 🚀

[![Visual Regression](https://img.shields.io/badge/tests-visual--regression-blueviolet)](tests/visual/)
[![Unit Tests](https://img.shields.io/badge/tests-unit-success)](tests/unit/)
[![PWA](https://img.shields.io/badge/PWA-ready-orange)](service-worker.js)

**Expense Tracker** adalah aplikasi pengelolaan keuangan pribadi berbasis web yang fokus pada privasi, kecepatan, dan estetika UI/UX premium. Data Anda sepenuhnya aman karena disimpan secara lokal di browser melalui `localStorage`.

---

## ✨ Fitur Utama

- 💳 **Multi-wallet Management**: Kelola saldo dari berbagai sumber dana (Tunai, Bank, E-Wallet).
- 🧾 **Split Bill Ledger**: Hitung patungan makan atau belanja bersama teman dengan mudah.
- 📊 **Visual Analytics**: Diagram per kategori dan tren pengeluaran 6 bulan terakhir menggunakan `Chart.js`.
- ⚡ **Quick Add Templates**: Input transaksi rutin hanya dengan satu tap.
- 📅 **Calendar View**: Pantau aktivitas keuangan harian dalam format kalender yang intuitif.
- 🌓 **Dark Mode & Dynamic UI**: Antarmuka responsif dengan transisi halus dan dukungan tema gelap.
- 📥 **Export/Import Data**: Cadangkan data Anda dalam format JSON atau ekspor ke CSV.

## 🛠️ Tech Stack

- **Core**: Vanilla JavaScript (ES Modules), HTML5 Semantic.
- **Styling**: Vanilla CSS (Modern Tokens, Glassmorphism, Dynamic Transitions).
- **Visualization**: [Chart.js](https://www.chartjs.org/) for analytics.
- **Icons**: [Phosphor Icons](https://phosphoricons.com/).
- **PWA**: Service Worker & Web Manifest untuk pengalaman offline.
- **Aesthetic**: Premium design guidelines dengan sora & manrope typography.

## 📁 Repository Structure

```text
expense-tracker/
├── assets/          # Icons, Manifest, and static assets
├── css/             # Unified stylesheet (Tokens & Components)
├── js/
│   ├── modules/     # Business logic, State, Storage, Validation
│   ├── app.js       # Main orchestrator
│   └── ui.js        # UI controller & DOM updates
├── tests/
│   ├── unit/        # Regression & Logic tests (Node context)
│   └── visual/      # Playwright visual regression suite
├── index.html       # Single Page Application entry point
└── service-worker.js# PWA caching logic
```

## 🧪 Pengujian (Testing)

Repo ini dilengkapi dengan sistem pengujian otomatis:

### 1. Unit & Regression Tests

Dijalankan menggunakan Node.js internal test runner:

```bash
node --test tests/unit/helpers.regression.test.js
```

### 2. Visual Regression Tests

Menggunakan **Playwright** untuk memastikan UI tetap konsisten di berbagai breakpoint dan tema:

```bash
# Install dependencies (only first time)
npm install

# Jalankan tes visual
npx playwright test --config=tests/visual/playwright.config.js
```

---

Dibuat dengan ❤️ oleh **asya perdana** & **Antigravity AI**.
