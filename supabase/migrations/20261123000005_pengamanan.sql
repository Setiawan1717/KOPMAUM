-- Migrasi 5: pengamanan dari hasil pemeriksaan Supabase (security & performance advisors).

-- 1) search_path dikunci untuk semua fungsi yang belum
alter function public.cek_ubah_akun() set search_path = public;
alter function public.saya_bph() set search_path = public;
alter function public.cek_pengaturan() set search_path = public;
alter function public.cek_ubah_anggota() set search_path = public;
alter function public.isi_pembuat() set search_path = public;
alter function public.isi_pengubah() set search_path = public;
alter function public.boleh_lihat_trx(public.transaksi) set search_path = public;
alter function public.saya_kelola_sewa() set search_path = public;
alter function public.saya_atur_sewa() set search_path = public;

-- 2) fungsi trigger tidak perlu bisa dipanggil langsung lewat API (trigger tetap berjalan)
revoke all on function public.catat_jejak(), public.cek_booking(), public.cek_pengaturan(), public.cek_ubah_anggota(),
  public.cek_ubah_akun(), public.isi_pembuat(), public.isi_pengubah() from public, anon, authenticated;

-- 3) fungsi bantu hak akses tidak untuk tamu (policy tamu tidak memakainya)
revoke all on function public.saya_admin(), public.saya_petugas(), public.saya_punya(text[]), public.saya_terdaftar(),
  public.username_saya(), public.nia_saya(), public.saya_bph(), public.saya_kelola_sewa(), public.saya_atur_sewa(),
  public.boleh_lihat_trx(public.transaksi) from public, anon;
grant execute on function public.saya_admin(), public.saya_petugas(), public.saya_punya(text[]), public.saya_terdaftar(),
  public.username_saya(), public.nia_saya(), public.saya_bph(), public.saya_kelola_sewa(), public.saya_atur_sewa(),
  public.boleh_lihat_trx(public.transaksi) to authenticated;

-- policy inventaris dipisah: tamu cukup "aktif", tanpa memanggil fungsi bantu
drop policy sewa_barang_publik on public.sewa_barang;
create policy sewa_barang_tamu on public.sewa_barang for select to anon using (aktif);
create policy sewa_barang_baca on public.sewa_barang for select to authenticated using (aktif or public.saya_kelola_sewa());

-- 4) auth.uid() dihitung sekali per query, bukan per baris
drop policy akun_baca on public.akun;
create policy akun_baca on public.akun for select to authenticated
  using (id = (select auth.uid()) or public.saya_admin() or public.saya_punya(array['ketua', 'sekretaris', 'bendahara', 'bidang_usaha']));
drop policy penarikan_baca on public.penarikan_gaji;
create policy penarikan_baca on public.penarikan_gaji for select to authenticated
  using (akun_id = (select auth.uid()) or public.saya_admin() or public.saya_punya(array['ketua', 'bendahara']));

-- 5) indeks foreign key & kunci utama
create index pengeluaran_produk_idx on public.pengeluaran (produk_id);
create index transaksi_kasir_id_idx on public.transaksi (kasir_id);
create index transaksi_item_produk_idx on public.transaksi_item (produk_id);
alter table public.percobaan_daftar add column id bigint generated always as identity primary key;
