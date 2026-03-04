# Smoke Test Checklist

Dokumen ini adalah checklist manual untuk validasi flow kritikal setelah perubahan besar.

## Scope
- Tambah/Edit/Hapus transaksi
- Prompt recurring (catat dan lewati/snooze)
- Import JSON (replace, merge-id, merge-content)
- Split bill mode custom
- Wallet CRUD
- Visual QA dark mode + transisi antar view

## Prasyarat
- Buka aplikasi di browser dengan data lokal baru (atau clear localStorage).
- Siapkan 2 file impor:
  1. `sample-full.json` berisi semua section (`expenses`, `wallets`, `categories`, `goals`, `templates`, `recurring`, `budgets`, `split`).
  2. `sample-partial.json` berisi sebagian section saja (misalnya hanya `expenses`).

## 1) Tambah / Edit / Hapus Transaksi
1. Tambah transaksi pengeluaran normal.
   Ekspektasi: transaksi muncul di riwayat, ringkasan saldo dan report ikut berubah.
2. Edit transaksi tadi (ubah nominal + kategori).
   Ekspektasi: baris transaksi terbarui, angka summary/report ikut tersinkron.
3. Hapus transaksi tadi.
   Ekspektasi: baris hilang, angka summary/report kembali sesuai, tombol undo aktif.

## 2) Prompt Recurring (Catat + Snooze)
1. Buat 1 transaksi recurring dengan tanggal jatuh tempo <= hari ini.
2. Reload halaman sampai modal recurring tampil.
3. Klik `Lewati`.
   Ekspektasi: modal tertutup dan tidak muncul lagi saat reload di hari yang sama.
4. Ubah tanggal perangkat/sistem ke hari berikutnya lalu reload.
   Ekspektasi: modal recurring muncul kembali untuk item yang belum dicatat.
5. Klik `Catat Semua`.
   Ekspektasi: transaksi recurring dibuat, `nextDate` recurring maju ke bulan berikutnya, modal tidak muncul ulang untuk periode yang sama.

## 3) Import Mode
1. Impor `sample-full.json` dengan mode `Ganti semua data`.
   Ekspektasi: semua section diganti mengikuti file; section yang tidak ada di file menjadi kosong (wallet fallback ke default bila kosong total).
2. Impor file yang sama lagi dengan mode `Gabung (berdasarkan ID)`.
   Ekspektasi: item dengan ID yang sama dilewati; duplikat tidak bertambah.
3. Impor file dengan konten duplikat tapi ID berbeda via mode `Gabung (berdasarkan konten)`.
   Ekspektasi: duplikat konten tidak ditambahkan.

## 4) Split Bill Custom
1. Buka split bill mode `Custom`, isi total bill `100000`.
2. Isi porsi peserta jadi `40000` + `30000`.
   Ekspektasi: tombol hitung menampilkan warning mismatch total porsi vs total tagihan.
3. Ubah porsi jadi `40000` + `60000`.
   Ekspektasi: hasil split muncul dan bisa disimpan ke ledger.

## 5) Wallet CRUD
1. Tambah wallet baru dengan nama unik.
   Ekspektasi: wallet muncul di dropdown transaksi + daftar wallet.
2. Tambah wallet dengan nama sama (case-insensitive).
   Ekspektasi: ditolak dengan toast nama sudah digunakan.
3. Impor wallet dengan icon tidak valid via JSON.
   Ekspektasi: icon otomatis fallback ke `ph-wallet`.
4. Hapus wallet yang masih dipakai transaksi.
   Ekspektasi: ditolak.

## 6) Visual QA (Dark Mode + Motion)
1. Uji layout di desktop (`1440x980`) dan mobile (`390x844`) untuk view `Dashboard`, `Tambah`, `Riwayat`, `Laporan`, dan `Tools`.
   Ekspektasi: tidak ada horizontal overflow; kartu/section tidak terpotong; bottom nav tampil normal di mobile.
2. Toggle tema `Light` dan `Dark` di semua view utama.
   Ekspektasi: kontras teks tetap terbaca, border komponen tetap jelas, shadow tetap memisahkan layer.
3. Cek view `Laporan` pada mobile, khususnya kartu trend.
   Ekspektasi: canvas trend mengikuti lebar container (tidak keluar layar), axis label masih terbaca.
4. Navigasi view berurutan `Dashboard -> Tambah -> Riwayat -> Laporan -> Tools`, lalu balik lagi.
   Ekspektasi: transisi antar view konsisten (arah + stagger), tanpa flicker/ghosting.
5. Buka modal informatif (mis. `Atur Batas Bulanan`) dan modal destruktif (hapus transaksi).
   Ekspektasi: modal destruktif terlihat lebih tegas (tone danger), modal informatif tetap netral/primary.
6. Aktifkan `prefers-reduced-motion` (atau mode perf-lite) lalu ulangi perpindahan view.
   Ekspektasi: animasi/transisi diminimalkan, interaksi tetap normal.

## Catatan Eksekusi Cepat
- Lakukan smoke test ini setiap ada perubahan di `index.html`, `css/style.css`, `js/app.js`, `js/calculations.js`, `js/ui.js`, atau fitur import/recurring/split/wallet.
- Simpan hasil uji dalam format sederhana: `tanggal - branch/commit - pass/fail - catatan`.
