# Kopma Hub: web internal Kopma UM

Tempat kerja harian pengurus dan anggota Kopma UM, dibuat dari PRD *Web Internal Kopma UM*. Isinya stok Kopma Mart, jadwal Kopma Rental, poin anggota, fee, dan data anggota. Tiap orang hanya melihat yang menjadi haknya.

## Cara mencoba

Buka `index.html` di browser, atau upload folder ini ke Netlify/Vercel. Di halaman masuk, pilih salah satu akun demo. Kata sandi semua akun demo adalah `kopma123`.

| Akun demo | Peran | Yang bisa dicoba |
| --- | --- | --- |
| Raka Pratama | Super admin | Buat akun, atur peran, tutup periode |
| Nadia Putri | Ketua (PHI) | Lihat semua data, koreksi poin, rekap fee, ekspor CSV |
| Salsa Amelia | Bendahara (PHI) | Catat fee, ubah rumus poin |
| Fajar Nugroho | Bidang usaha | Catat stok masuk/keluar, stock opname, kelola barang sewa |
| Intan Maharani | Petugas jaga + usaha | Catat belanja anggota (poin), booking sewa |
| Bagus Setyo | Pengurus | Lihat stok dan jadwal sewa, anggota dampingan |
| Ayu Lestari | Anggota | Lihat poin, simpanan, dan fee miliknya |

Ini **mode demo**: data contoh disimpan di browser (localStorage). Perubahan hanya ada di browser yang dipakai. Untuk mengembalikan data contoh, klik avatar → *Kembalikan data contoh*.

## Modul MVP

1. **Akun & peran**: satu akun bisa punya beberapa peran; tombol *Ganti periode* mencabut semua peran pengurus tanpa menghapus data.
2. **Data anggota**: cari nama/NIA seketika, status simpanan pokok & wajib, pengurus pendamping.
3. **Stok Kopma Mart**: mutasi masuk/keluar dengan alasan dan pencatat, daftar *perlu belanja*, stock opname dengan selisih.
4. **Kopma Rental**: kalender per barang, cek ketersediaan unit otomatis, biaya dihitung dari tabel harga, booking terlambat ditandai merah, pratinjau kalender versi publik.
5. **Poin anggota**: catat belanja dari HP (ada penghitung waktu, target di bawah 30 detik), rumus diatur bendahara, koreksi oleh PHI selalu tercatat.
6. **Fee & gaji**: fee milik sendiri, rekap bulanan untuk PHI, status bayar diubah bendahara.

Tambahan: halaman **Jejak** (siapa mengubah apa), **ekspor CSV** untuk PHI, mode gelap.

## Sambungan ke web kasir

Modul Stok bisa membaca data langsung dari web kasir (repo `KasirKopmaUM2026`, Firebase project `kopma-um`).

- Buka **Stok Mart**, lalu masuk dengan akun yang dipakai di web kasir (hanya peran bidang usaha, PHI, atau super admin yang melihat form ini).
- **Baca saja:** `js/kasir.js` hanya memakai `onSnapshot` dan `getDocs`. Tidak ada fungsi tulis Firestore, jadi data kasir tidak bisa berubah dari Kopma Hub.
- Setelah tersambung, stok, daftar perlu belanja, riwayat penjualan dan barang masuk, serta penjualan hari ini diambil dari kasir secara langsung. Pencatatan stok dan opname di Kopma Hub dimatikan karena tugas itu dikerjakan di kasir.
- **Poin otomatis:** transaksi kasir yang diisi NIA anggota langsung menjadi poin (`total ÷ rumus`, dibulatkan ke bawah per transaksi). Ada *Cek NIA* dan peringkat poin. Transaksi sebelum isian NIA ada tidak dihitung.
- **Batas minimum** tiap produk disimpan di Kopma Hub (browser), tidak ditulis ke data produk kasir.
- Tombol **Cadangkan data kasir** mengunduh semua produk, transaksi, pengeluaran, dan modal harian sebagai file JSON.
- Fitur ini tidak jalan di pratinjau claude.ai karena pratinjau memblokir koneksi ke Firebase. Buka dari hosting (Netlify/Vercel/GitHub Pages) atau dari file lokal.

## Struktur

```
index.html          halaman utama
css/style.css       tampilan (palet 8 warna, satu warna per modul)
js/data.js          data contoh + penyimpanan demo
js/app.js           tampilan, hak akses, dan logika semua modul
js/kasir.js         sambungan baca-saja ke Firebase web kasir
supabase/schema.sql 9 tabel, aturan RLS, trigger cek booking, view jadwal_sewa_publik
```

## Langkah ke produksi (Supabase)

1. Buat project Supabase, jalankan `supabase/schema.sql` di SQL Editor.
2. Ganti fungsi di `js/data.js` (`Store.load/save`) dengan panggilan `supabase-js`. Nama tabel dan kolom sudah disiapkan sama dengan PRD.
3. Web eksternal cukup membaca view `jadwal_sewa_publik` (barang, tanggal, tersedia/penuh) memakai anon key. Nama dan WA penyewa tidak ikut.
4. Uji dengan satu akun untuk tiap peran sebelum rilis.

## Keputusan sementara (dari pertanyaan terbuka PRD)

- Fee hanya terlihat oleh pemiliknya; PHI melihat semua.
- Rumus poin awal 1 poin per Rp1.000 (bisa diubah bendahara).
- Harga "2 hari ke atas" dihitung **per hari**. Contoh: kamera Rp37.500/hari, jadi 2 hari = Rp75.000 total.
- Jumlah unit tiap barang sewa masih angka contoh; ubah lewat Rental → Inventaris.
