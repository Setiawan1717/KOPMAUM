# Aturan keamanan Firestore (project kopma-um)

`firestore.rules` mengunci database web kasir supaya aman dipakai bersama Kopma Hub. Aturan ini disusun dari semua operasi yang ada di kode web kasir, dan sudah diuji di Firestore Emulator: 20 alur kasir tetap jalan dan 17 percobaan penyalahgunaan ditolak. Aturan koleksi `anggota` diuji terpisah (19 kasus), begitu juga pendaftaran dengan kode, perbarui data sendiri, dan pengaturan peran (38 kasus). Rumus poin bersama dan jejak wajib diuji 44 kasus; gaji jaga, jadwal, dan penarikan 55 kasus; ditambah uji alur di browser. Web kasir versi perbaikan juga sudah diuji ujung ke ujung (login, jualan dengan NIA, stok berkurang) terhadap aturan ini.

## Masalah yang ditutup

Di web kasir, pendaftaran akun baru dijaga PIN yang ditulis langsung di kode. Repo kasir publik, jadi siapa pun bisa membaca PIN itu, atau melewatinya dengan memanggil Firebase langsung, lalu membuat akun **admin**. Aturan ini membuat Firestore sendiri yang menolak, apa pun yang dilakukan di tampilan.

| Peran | Boleh | Tidak boleh |
| --- | --- | --- |
| Tanpa login / akun tak terdaftar | — | Membaca atau mengubah apa pun |
| Kasir | Login, membaca data, jualan (kurangi stok + buat transaksi) | Mengubah harga, menambah/menghapus produk, menghapus/mengedit transaksi, mencatat pengeluaran, mengubah modal harian, mengubah perannya sendiri |
| Admin | Semua menu kasir | Mengedit transaksi yang sudah tersimpan (hapus tetap bisa) |
| Ketua / sekretaris (Kopma Hub) | Melihat, menambah, dan mengubah data anggota | Menghapus anggota, membaca data kasir (kecuali akunnya juga admin/kasir) |
| Kopma Hub lainnya | Membaca sesuai peran | Menulis |

## Cara memasang

> **Urutan ini penting.** Web kasir versi lama mengambil data *sebelum* login. Dengan aturan baru, permintaan itu ditolak dan daftar produk kosong. Jadi **perbarui web kasir dulu** (cabang `perbaikan-kopmahub` di repo kasir), baru pasang aturan ini.

0. **Perbarui web kasir** ke versi yang mengambil data setelah login, lalu pastikan kasir masih jalan normal dengan aturan lama.

1. **Cadangkan dulu.** Buka Kopma Hub → Stok Mart → sambungkan → *Cadangkan data kasir*. Simpan file JSON-nya.
2. **Cek akun yang ada.** Firebase Console → Firestore Database → koleksi `users`. Pastikan setiap dokumen punya `role` bernilai persis `admin` atau `kasir` (huruf kecil). Akun dengan nilai lain tidak akan bisa login setelah aturan dipasang.
3. **Pasang aturan.** Firebase Console → Firestore Database → tab **Rules**. Salin isi aturan lama ke catatan (untuk jaga-jaga), lalu ganti seluruhnya dengan isi `firestore.rules` dan klik **Publish**.
4. **Coba kasir.** Login sebagai kasir, lakukan satu transaksi kecil, lalu hapus transaksinya sebagai admin. Coba juga barang masuk dan laporan harian.
5. **Kalau ada yang rusak:** tab Rules → riwayat versi (ikon jam) → pilih versi sebelumnya → kembalikan. Lalu kabari pesan error-nya.

## Pendaftaran akun, peran, dan data diri (lewat Kopma Hub)

Akun Kopma Hub sama dengan akun web kasir. Setelah langkah awal di bawah, semuanya diatur dari Kopma Hub dan **tidak perlu Firebase Console lagi**.

### Langkah awal (sekali saja, di Firebase Console)

1. **Simpan kode pendaftaran.** Firestore Database → **Start collection** → ID koleksi `pengaturan` → ID dokumen `pendaftaran` → field `kode` (string) berisi kode pendaftaranmu, minimal 6 karakter (kode yang lebih pendek, termasuk kosong, selalu ditolak).
   - Kode ini **tidak pernah** ditulis di repo. Tidak ada aplikasi yang bisa membacanya; hanya aturan Firestore yang mencocokkannya saat orang mendaftar.
   - Mengganti kode cukup dengan mengubah field ini. Kode lama langsung tidak berlaku.
2. **Pastikan pendaftaran Firebase menyala.** Authentication → Settings → User actions → **Enable create (sign-up)** harus dicentang.
3. **Jadikan dirimu ketua** (sekali saja): `users` → dokumen akunmu → field `hub` (array) berisi `ketua`. Setelah itu peran orang lain diatur dari Kopma Hub.
4. **Publish ulang** isi `firestore.rules` terbaru.

### Cara kerjanya

| Siapa | Bisa apa |
| --- | --- |
| Calon pengguna | **Daftar** di halaman masuk Kopma Hub dengan kode pendaftaran, NIA, nama pengguna, dan kata sandi. Syarat: kode benar, NIA sudah ada di data anggota, dan NIA belum dipakai akun lain. Akun baru selalu berperan *anggota*. |
| Pemilik akun | **Profil saya → Perbarui data**: nama, fakultas, prodi, angkatan, nomor WA. Status dan bidang tidak bisa diubah sendiri. Melihat poin dari transaksi dengan NIA miliknya saja. |
| Ketua & sekretaris | Menambah dan mengubah data semua anggota. **Akun & peran → Atur peran**: memberi peran ketua, sekretaris, bendahara, bidang usaha, petugas jaga, atau pengurus ke akun lain (tidak bisa ke diri sendiri). |
| Bendahara | Melihat data anggota. Mengubah **rumus poin** (bersama ketua dan admin kasir). |
| Admin kasir | Tetap satu-satunya yang mengatur role kasir (`admin`/`kasir`) lewat Firebase Console. |

Akun lama yang belum punya NIA (misalnya akun kasir) bisa menghubungkan NIA-nya sendiri di **Profil saya**. Satu NIA hanya bisa untuk satu akun; kalau ada yang salah klaim, admin bisa menghapus dokumennya di koleksi `klaim_nia`.

Akun anggota/pengurus hasil pendaftaran **tidak bisa** dipakai di web kasir.

## Rumus poin bersama

Rumus poin (1 poin setiap berapa rupiah belanja) disimpan di dokumen `pengaturan/poin`, jadi semua HP dan laptop memakai angka yang sama. Dokumen ini dibuat otomatis saat ketua, bendahara, atau admin kasir pertama kali menekan **Simpan rumus** di halaman Poin. Sebelum ada dokumennya, Kopma Hub memakai Rp1.000.

- Dibaca: semua akun terdaftar (poin anggota dihitung dari rumus ini).
- Diubah: hanya ketua, bendahara, atau admin kasir, dengan angka bulat antara 100 dan 1.000.000 rupiah. Nama pengubah dan waktunya (waktu server) ikut tercatat dan tidak bisa dipalsukan.
- Tidak bisa dihapus dari Kopma Hub. Dokumen `pengaturan/pendaftaran` (kode daftar) tetap tidak bisa dibaca siapa pun.

## Jejak perubahan (wajib)

Setiap perubahan yang dikirim Kopma Hub ke `anggota`, `users` (peran, penghubungan NIA, pendaftaran), dan `pengaturan/poin` wajib ditulis bersama satu catatan baru di koleksi `jejak`, dalam satu batch. Aturan Firestore memeriksa bahwa:

- dokumen yang diubah menyimpan `jejakId` yang menunjuk catatan **baru** (catatan lama tidak bisa dipakai ulang);
- catatan dibuat oleh akun yang sama, dengan nama pengguna dan waktu server yang tidak bisa dipalsukan;
- setiap kolom yang berubah sudah disebut di catatan (misalnya tidak bisa mengganti nama diam-diam sambil menulis "ubah WA");
- catatan tidak bisa dibuat tanpa perubahan sungguhan, dan tidak bisa diubah atau dihapus siapa pun dari aplikasi.

Yang bisa membaca: ketua, sekretaris, bendahara, dan admin kasir. Perubahan oleh admin kasir dari web kasir dan dari Firebase Console tidak tercatat, karena tidak lewat Kopma Hub.

**Penting saat memasang:** aturan baru dan kode Kopma Hub baru harus dipasang berdekatan. Kode lama ditolak oleh aturan baru (karena tidak menulis jejak), dan kode baru ditolak oleh aturan lama. Publish aturan setelah GitHub Pages selesai memperbarui situs (sekitar 1 menit setelah push), lalu minta pengurus memuat ulang Kopma Hub.

## Gaji jaga, jadwal, dan penarikan

- **Gaji** tidak disimpan, tapi dihitung dari `transactions`: 1% total penjualan per hari untuk akun yang tercatat di kolom `kasir`. Karena itu setiap petugas harus login kasir dengan akunnya sendiri.
- **Membaca transaksi**: selain kasir/admin, sekarang ketua, sekretaris, bendahara, dan bidang usaha boleh membaca (untuk laporan), dan setiap akun boleh membaca transaksi yang dia layani sendiri. Tetap tidak ada yang bisa mengubah transaksi dari Kopma Hub.
- **`jadwal_jaga/{YYYY-MM-DD}`**: daftar nama pengguna petugas (maksimal 10) dan catatan. Diatur bidang usaha, ketua, dan admin; dibaca semua akun terdaftar; tidak bisa dihapus.
- **`penarikan_gaji`**: petugas mengajukan atas namanya sendiri (bilangan bulat Rp10.000 sampai Rp5.000.000, status awal `diajukan`). Ketua, bendahara, atau admin mengubahnya menjadi `dibayar` atau `ditolak`, tetapi tidak untuk penarikannya sendiri. Pemilik bisa membatalkan selama masih `diajukan`. Penarikan yang sudah diproses tidak bisa diubah lagi atau dihapus.
- Aturan Firestore tidak bisa menjumlah saldo, jadi kecukupan saldo dicek aplikasi saat mengajukan, dan dicek ulang dari transaksi saat ketua/bendahara menekan **Proses**.
- **Daftar akun** (`users`) kini juga bisa dibaca bendahara dan bidang usaha, untuk memilih petugas di jadwal dan menampilkan nama. Mengubah peran tetap hanya ketua dan sekretaris.
- Semua perubahan jadwal dan penarikan tercatat di Jejak.

## Membuat akun kasir baru

Tombol *Daftar* di web kasir tidak akan berfungsi lagi, karena itulah celah yang ditutup. Akun baru dibuat pemilik lewat Firebase Console:

1. **Authentication → Users → Add user.** Email: `namapengguna@kopma.um` (huruf kecil, tanpa spasi). Isi kata sandinya.
2. Salin **User UID** akun yang baru dibuat.
3. **Firestore Database → `users` → Add document.** Document ID: tempel UID tadi. Tambah field `username` (string, nama pengguna huruf kecil) dan `role` (string, `kasir` atau `admin`).

Akun itu langsung bisa login di web kasir dengan nama pengguna dan kata sandinya.

## Disarankan juga

- **Authentication → Settings → User actions:** matikan *Enable create (sign-up)* supaya orang luar tidak bisa membuat akun login sama sekali. Ini tidak wajib, karena akun tanpa dokumen `users` tetap tidak bisa membaca apa pun.
- Hapus PIN dan tombol *Daftar* dari kode web kasir, karena sudah tidak dipakai.
