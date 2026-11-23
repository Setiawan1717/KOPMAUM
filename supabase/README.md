# Supabase — database baru Kopma Hub & Kasir

Project: **kopma-um** (region Singapura, paket gratis). Menggantikan Firebase secara bertahap; selama belum hari pindah, Kopma Hub dan kasir masih memakai Firebase.

## Isi folder

`migrations/` berisi skema lengkap, dijalankan berurutan:

| File | Isi |
|---|---|
| `…01_dasar.sql` | anggota, akun & peran, jejak otomatis, pengaturan, pendaftaran dengan kode |
| `…02_kasir.sql` | produk, transaksi + item, pengeluaran, modal harian, fungsi `jual`, `batalkan_transaksi`, `barang_masuk` |
| `…03_poin_gaji.sql` | poin anggota, gaji jaga 1%, saldo & penarikan, jadwal jaga |
| `…04_rental.sql` | inventaris & booking sewa, kalender publik |
| `…05_pengamanan.sql` | perbaikan dari pemeriksaan keamanan & performa Supabase |
| `…06_indeks_kasir.sql` | indeks untuk pembaruan bertahap di web kasir |

Semua migrasi sudah terpasang di project kopma-um.

## Prinsip keamanan

- Semua tabel memakai **row level security**. Tabel tanpa policy (mis. `rahasia`) tertutup total dari aplikasi.
- Urusan uang dan stok **hanya lewat fungsi server**: penjualan (stok dikunci, harga diambil dari server, kiriman ulang saat offline tidak dobel), pembatalan, barang masuk, penarikan gaji (saldo dicek server), total sewa dan ketersediaan unit (dikunci per barang).
- **Jejak otomatis** lewat trigger: siapa, kapan, kolom apa, nilai lama → baru. Ikut mencatat perubahan dari dashboard Supabase. Tidak bisa diubah atau dihapus dari aplikasi. Pendaftaran akun dan perubahan stok karena penjualan tidak dicatat.

## Pengaturan yang dilakukan pemilik lewat dashboard (sekali saja)

1. **Authentication → Sign In / Providers → Email**: matikan **Confirm email** (email akun memakai format `namapengguna@kopma.um` yang tidak bisa menerima surat).
2. **Kode pendaftaran** (jangan ditulis di repo). SQL Editor:
   ```sql
   insert into rahasia (kunci, nilai) values ('kode_daftar', 'KODE-ANDA') on conflict (kunci) do update set nilai = excluded.nilai;
   ```
3. Peran Kopma Hub dan role kasir diatur di tabel `akun` (kolom `role`: admin/kasir/anggota, kolom `hub`: daftar peran). Ketua/sekretaris juga bisa mengatur `hub` dari Kopma Hub.

## Kopma Hub versi Supabase (Tahap 2)

`js/kasir.js` di branch kerja sudah memakai Supabase (bentuk objek `Kasir` sama, tampilan tidak berubah). **Belum digabung ke `main`**: situs yang dipakai pengurus tetap memakai Firebase sampai hari pindah, karena data asli masih di Firebase.

- Halaman langsung tampil setelah akun terbaca; data tiap bagian menyusul (tidak menunggu semuanya).
- Poin, gaji, saldo, dan laporan diambil sebagai hasil hitungan server.
- Data diperbarui tiap 60 detik, saat tab dibuka lagi, dan langsung setelah menyimpan.
- Diuji di project asli dengan akun uji `uji_*` (51 cek alur browser: penjualan & stok, gaji & penarikan + WA, rumus poin, anggota & peran, jejak, jadwal, rental, halaman publik, pendaftaran). Akun & produk uji dihapus sebelum hari pindah.

## Uji

Skema diuji di Postgres lokal yang meniru Supabase (127 kasus: hak akses tiap peran, penjualan & stok, poin, gaji & penarikan, jadwal, rental, jejak) sebelum dipasang.
