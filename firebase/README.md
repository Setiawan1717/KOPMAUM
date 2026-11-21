# Aturan keamanan Firestore (project kopma-um)

`firestore.rules` mengunci database web kasir supaya aman dipakai bersama Kopma Hub. Aturan ini disusun dari semua operasi yang ada di kode web kasir, dan sudah diuji di Firestore Emulator: 20 alur kasir tetap jalan dan 17 percobaan penyalahgunaan ditolak. Web kasir versi perbaikan juga sudah diuji ujung ke ujung (login, jualan dengan NIM, stok berkurang) terhadap aturan ini.

## Masalah yang ditutup

Di web kasir, pendaftaran akun baru dijaga PIN yang ditulis langsung di kode. Repo kasir publik, jadi siapa pun bisa membaca PIN itu, atau melewatinya dengan memanggil Firebase langsung, lalu membuat akun **admin**. Aturan ini membuat Firestore sendiri yang menolak, apa pun yang dilakukan di tampilan.

| Peran | Boleh | Tidak boleh |
| --- | --- | --- |
| Tanpa login / akun tak terdaftar | — | Membaca atau mengubah apa pun |
| Kasir | Login, membaca data, jualan (kurangi stok + buat transaksi) | Mengubah harga, menambah/menghapus produk, menghapus/mengedit transaksi, mencatat pengeluaran, mengubah modal harian, mengubah perannya sendiri |
| Admin | Semua menu kasir | Mengedit transaksi yang sudah tersimpan (hapus tetap bisa) |
| Kopma Hub | Membaca (pakai akun kasir/admin) | Menulis |

## Cara memasang

> **Urutan ini penting.** Web kasir versi lama mengambil data *sebelum* login. Dengan aturan baru, permintaan itu ditolak dan daftar produk kosong. Jadi **perbarui web kasir dulu** (cabang `perbaikan-kopmahub` di repo kasir), baru pasang aturan ini.

0. **Perbarui web kasir** ke versi yang mengambil data setelah login, lalu pastikan kasir masih jalan normal dengan aturan lama.

1. **Cadangkan dulu.** Buka Kopma Hub → Stok Mart → sambungkan → *Cadangkan data kasir*. Simpan file JSON-nya.
2. **Cek akun yang ada.** Firebase Console → Firestore Database → koleksi `users`. Pastikan setiap dokumen punya `role` bernilai persis `admin` atau `kasir` (huruf kecil). Akun dengan nilai lain tidak akan bisa login setelah aturan dipasang.
3. **Pasang aturan.** Firebase Console → Firestore Database → tab **Rules**. Salin isi aturan lama ke catatan (untuk jaga-jaga), lalu ganti seluruhnya dengan isi `firestore.rules` dan klik **Publish**.
4. **Coba kasir.** Login sebagai kasir, lakukan satu transaksi kecil, lalu hapus transaksinya sebagai admin. Coba juga barang masuk dan laporan harian.
5. **Kalau ada yang rusak:** tab Rules → riwayat versi (ikon jam) → pilih versi sebelumnya → kembalikan. Lalu kabari pesan error-nya.

## Membuat akun kasir baru

Tombol *Daftar* di web kasir tidak akan berfungsi lagi, karena itulah celah yang ditutup. Akun baru dibuat pemilik lewat Firebase Console:

1. **Authentication → Users → Add user.** Email: `namapengguna@kopma.um` (huruf kecil, tanpa spasi). Isi kata sandinya.
2. Salin **User UID** akun yang baru dibuat.
3. **Firestore Database → `users` → Add document.** Document ID: tempel UID tadi. Tambah field `username` (string, nama pengguna huruf kecil) dan `role` (string, `kasir` atau `admin`).

Akun itu langsung bisa login di web kasir dengan nama pengguna dan kata sandinya.

## Disarankan juga

- **Authentication → Settings → User actions:** matikan *Enable create (sign-up)* supaya orang luar tidak bisa membuat akun login sama sekali. Ini tidak wajib, karena akun tanpa dokumen `users` tetap tidak bisa membaca apa pun.
- Hapus PIN dan tombol *Daftar* dari kode web kasir, karena sudah tidak dipakai.
