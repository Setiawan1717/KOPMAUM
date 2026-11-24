# Impor data Firebase → Supabase

Dipakai saat latihan (24 Nov 2026) dan dipakai lagi di hari pindah. **Jangan menaruh file ekspor, kunci, atau token di folder ini** (repo publik).

## Bahan (dari pemilik)

1. `firestore.json` — dari halaman `alat/ekspor-firebase.html` (login admin kasir).
2. `akun.json` — `firebase auth:export akun-kopma.json --format=json --project kopma-um` (bisa lewat Google Cloud Shell).
3. `signer_key.txt` — `base64_signer_key` dari Firebase Console → Authentication → Users → ⋮ → Password hash parameters. Parameter lain yang dipakai: `rounds: 8`, `mem_cost: 14`, `base64_salt_separator: Bw==`.

Letakkan di folder kerja sementara (di luar repo): `<KERJA>/data/`.

## Langkah

1. Buat token acak, simpan di `<KERJA>/token.txt`, lalu pasang fungsi sementara (`fungsi_sementara.sql`, ganti `TOKEN_ACAK`) lewat SQL Editor.
2. `python3 -I siapkan.py <KERJA>` → membuat `<KERJA>/muatan/*.json` dan ringkasan.
3. `node kirim.mjs <KERJA>` (butuh `@supabase/supabase-js`; lewat proxy memakai `undici`).
4. Cocokkan jumlah & total dengan ringkasan.
5. **Hapus** fungsi & token: `drop function public.impor_kopma_sementara(text, text, jsonb); delete from rahasia where kunci = 'token_impor';` — lalu hapus folder `<KERJA>`.

## Sifat impor

- ID dibuat tetap (uuid5 dari ID Firebase), jadi **impor ulang tidak dobel**: transaksi yang sudah ada dilewati, produk/akun/modal diperbarui ke nilai terbaru.
- Kata sandi tidak berubah: hash Firebase disimpan dalam format `$fbscrypt$v=1,n=<mem_cost>,r=<rounds>,p=1,ss=<separator>,sk=<signer>$<salt>$<hash>` yang dikenali Supabase Auth (sudah diuji: sandi benar masuk, sandi salah ditolak).
- Impor tidak dicatat di jejak.
- Akun login tanpa dokumen `users` dilewati. Stok minus menjadi 0. Nilai angka berupa teks kosong menjadi 0.

## Hasil latihan 24 Nov 2026

8 akun (2 dilewati: tanpa data peran), 1 anggota dibuat untuk NIA akun ketua, 300 produk, 789 transaksi (1.552 item, total Rp5.158.000), 10 modal harian. Semua jumlah & total cocok dengan Firebase; impor ulang tidak menambah data.
