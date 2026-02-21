# 🗺️ Expense Tracker Improvement Roadmap

Roadmap ini disusun menggunakan pendekatan _Product Management_ (Now-Next-Later) yang dirancang khusus untuk alur kerja _solo vibe-coding developer_. Fokusnya adalah iterasi yang cepat (quick wins) secara modular tanpa merusak fungsionalitas utama yang sudah berjalan tangguh di _LocalStorage_.

## 🎯 Visi Produk

Menjadi aplikasi pencatat keuangan harian yang **instan**, **offline-first**, dan **bebas hambatan (frictionless)**, dengan transisi yang mulus ke ekosistem cloud di masa depan.

---

## 🚀 NOW (Fase 1: Optimalisasi Core & UX)

**Fokus: Retensi User & Kenyamanan Input (Quick Wins)**
Status saat ini aplikasi sudah memiliki fungsionalitas yang solid dan lengkap secara antarmuka. Fase ini fokus pada optimalisasi "feel" dan otomatisasi.

- [x] **PWA (Progressive Web App) Implementation**
  - **Masalah:** Aplikasi web mematuhi UI/UX mobile, tapi masih dibuka melalui URL browser.
  - **Solusi:** Tambahkan `manifest.json` dan _Service Worker_.
  - **Impact:** Aplikasi bisa di-install ke _Homescreen_ (Android/iOS) tanpa App Store, menghilangkan address bar browser, dan _loading_ instan secara offline.
  - **Vibe-code Prompt:** _"Buatkan manifest.json dan script service-worker.js sederhana untuk caching aset statis index.html, style.css, script.js agar aplikasi ini jadi PWA installable."_

- [x] **Smart Autocomplete & Prediksi Kategori**
  - **Masalah:** User lelah memilih opsi drop-down berulang-ulang untuk pengeluaran yang mirip.
  - **Solusi:** Buat sistem yang merekam "_History Input_", jadi jika user mengetik "makan siang", sistem akan secara cerdas meng-_auto-select_ kategori "Makanan" dan dompet preferensi dari penginputan terakhir.
  - **Impact:** Input time berkurang drastis menjadi hanya beberapa detik saja. Mengurangi _friction_.

- [x] **Eksekusi "Recurring" (Tagihan Berulang) Otomatis**
  - **Masalah:** Centang _ recurring_ saat ini bersifat informatif, belum berjalan secara otomatis pada bulan berikutnya.
  - **Solusi:** Buat eksekusi via _client-side_. Saat aplikasi di-load (`window.onload`), periksa riwayat tagihan recurring bulan lalu. Tampilkan modal prompt, _"Waktunya bayar Netflix bulan ini. Catat sebagai pengeluaran otomatis?"_

---

## 🏗️ NEXT (Fase 2: Manajemen & Analitik Lanjutan)

**Fokus: Nilai Tambah & Akurasi Keuangan**
Fase ini dikembangkan setelah _core app_ terasa sangat nyaman untuk pemakaian personal harian pengguna.

- [x] **Manajemen Dompet Dinamis (Multi-Wallet)**
  - **Masalah:** Dropdown "Tunai, Rekening Bank, E-Wallet" saat ini statis. Kita tidak tahu persis sisa saldo di bank A atau di e-wallet B.
  - **Solusi:** Ubah menjadi entitas dompet yang bisa diatur saldonya. (_Current Balance Tunai: Rp 150.000, Bank: Rp 5.000.000_). Input transaksi akan mendeduct/menambah saldo dompet spesifik.

- [x] **Tipe Transaksi: Transfer Antar Dompet**
  - **Masalah:** Saat mengambil cash dari ATM, pengguna bingung mencatatnya. Dicatat sebagai _expense_ (pengeluaran) padahal uangnya tidak terpakai, hanya berpindah.
  - **Solusi:** Buat tipe input transaksi form ketiga, yakni "Transfer". Tab ini akan menggeser saldo (misal: Bank -> Tunai) tanpa menambah _chart_ Expense / Income.

- [x] **Goal Tracking (Tabungan Impian)**
  - **Solusi:** Buat halaman / seksi khusus yang mengikat dari tabungan sisa bulanan. Alokasi budget untuk mencapai objektif (_"Beli Laptop Baru"_ atau _"Dana Darurat"_) lengkap dengan mini _progress-bar_.

---

## 🔭 LATER (Fase 3: Transisi Ekosistem & Skalabilitas)

**Fokus: Sinkronisasi Lintas-Perangkat & AI**

- [ ] **Data Sync (Backend as a Service integration)**
  - **Solusi:** Integrasikan _auth_ login pihak ketiga (sangat disarankan via Supabase/Firebase) agar data di LocalStorage bisa dicadangkan ke _Cloud_.
  - **Arah Arsitektur:** Pertahankan konsep _Offline-first_. Data selalu dibaca dari LocalStorage dan di-_sync_ sembunyi-sembunyi ke server lewat mekanisme antrean.

- [ ] **Grup / Shared Ledger**
  - **Solusi:** Ekspansi menu _Split Bill_ saat ini menjadi konsep buku besar bersama. Berguna bagi pasangan atau teman flat yang perlu melacak tagihan utilitas bersama, dan mengkalkulasi selisih piutang.

- [ ] **AI-Powered Financial Roasting / Encouragement**
  - **Solusi:** Manfaatkan API LLM yang murah/ngebut (seperti Groq) langsung dari klien (Client-side fetch API). Lemparkan rangkuman json pengeluaran pengguna secara proaktif lalu giring AI merespon sesuatu yang unik (misal alert: _"Wooy! Kamu abis 2 juta cuma buat nongkrong, hemat dikit napa!"_).
  - **Impact:** Menjadi _Wow Factor_ dan fitur yang _highly shareable_ oleh user sosial media.

## 💡 Panduan Praktis untuk Vibe-Coding

Sebagai Solo Dev yang bergantung pada koding iteratif bersama agen AI, sangat rawan kode akan membesar dan menjadi '_Spaghetti_'. Perhatikan rambu berikut:

1. **Jaga Boundaries Codebase:** App Anda sekarang tersimpan dalam tiga file (`.html`, `.css`, dan `.js` tunggal sebesar ~60kb). Di **fase kedua**, mulailah meminta AI untuk _"Tolong ajari saya memecah file .js menjadi ES6 modules"_.
2. **Commit Git secara Granular:** Karena AI sering _overkill_ saat refactoring / _code edit_, commit hasil koding setiap selesai dengan 1 poin _checkbox_. Jangan langsung menembak 2 perbaikan di waktu bersamaan (misal menggabungkan dompet dan PWA).
3. **Mulai dari Fase 1:** Eksekusi langsung poin **PWA** dan **Smart Autocomplete**. Target pengerjaan via instruksi vibe-coding maksimal 2-3 resapan.
