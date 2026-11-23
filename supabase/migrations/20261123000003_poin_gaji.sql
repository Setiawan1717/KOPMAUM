-- Migrasi 3: poin anggota, gaji jaga, jadwal jaga, penarikan gaji. Semua hitungan di server; HP hanya menerima hasil.

create or replace function public.pengaturan_angka(k text) returns numeric language sql stable security definer set search_path = public as
$$ select (nilai #>> '{}')::numeric from pengaturan where kunci = k $$;

-- ========== Poin ==========
-- poin per transaksi = floor(total / rp_per_poin); transaksi batal tidak dihitung
create or replace function public.poin_anggota(p_nia text default null)
returns table (nia text, nama text, poin bigint, belanja bigint, n bigint, terakhir timestamptz)
language plpgsql stable security definer set search_path = public as $$
declare rate numeric := greatest(1, coalesce(public.pengaturan_angka('rp_per_poin'), 1000));
begin
  if not (public.saya_petugas() or public.saya_bph() or public.saya_punya(array['bidang_usaha'])
          or (p_nia is not null and p_nia = public.nia_saya())) then
    raise exception 'Tidak punya izin melihat poin anggota lain';
  end if;
  return query
    select t.nia_anggota, a.nama, sum(floor(t.total / rate))::bigint, sum(t.total)::bigint, count(*), max(t.tanggal)
      from transaksi t left join anggota a on a.nia = t.nia_anggota
     where t.nia_anggota is not null and not t.batal and (p_nia is null or t.nia_anggota = p_nia)
     group by t.nia_anggota, a.nama
     order by 3 desc;
end $$;

create or replace function public.riwayat_poin(p_nia text, p_batas int default 50)
returns table (id uuid, tanggal timestamptz, total int, poin bigint, kasir text, jumlah_item bigint)
language plpgsql stable security definer set search_path = public as $$
declare rate numeric := greatest(1, coalesce(public.pengaturan_angka('rp_per_poin'), 1000));
begin
  if not (public.saya_petugas() or public.saya_bph() or public.saya_punya(array['bidang_usaha']) or p_nia = public.nia_saya()) then
    raise exception 'Tidak punya izin melihat poin anggota lain';
  end if;
  return query
    select t.id, t.tanggal, t.total, floor(t.total / rate)::bigint, t.kasir, (select count(*) from transaksi_item i where i.transaksi_id = t.id)
      from transaksi t where t.nia_anggota = p_nia and not t.batal order by t.tanggal desc limit least(coalesce(p_batas, 50), 500);
end $$;

-- ========== Gaji jaga ==========
-- gaji per hari (WIB) = floor(total penjualan akun kasir itu x persen / 100)
create or replace function public._gaji_harian(p_username text, p_dari date, p_sampai date)
returns table (kasir text, tanggal date, penjualan bigint, n bigint, gaji bigint)
language sql stable security definer set search_path = public as $$
  select t.kasir, (t.tanggal at time zone 'Asia/Jakarta')::date, sum(t.total)::bigint, count(*),
         floor(sum(t.total) * coalesce(public.pengaturan_angka('gaji_persen'), 1) / 100)::bigint
    from transaksi t
   where not t.batal and (p_username is null or t.kasir = p_username)
     and (p_dari is null or t.tanggal >= (p_dari::timestamp at time zone 'Asia/Jakarta'))
     and (p_sampai is null or t.tanggal < ((p_sampai + 1)::timestamp at time zone 'Asia/Jakarta'))
   group by 1, 2 order by 2 desc, 1
$$;
revoke all on function public._gaji_harian(text, date, date) from public, anon, authenticated;

create or replace function public.gaji_harian(p_username text default null, p_dari date default null, p_sampai date default null)
returns table (kasir text, tanggal date, penjualan bigint, n bigint, gaji bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not (public.saya_bph() or public.saya_punya(array['bidang_usaha']) or (p_username is not null and p_username = public.username_saya())) then
    raise exception 'Tidak punya izin melihat gaji orang lain';
  end if;
  return query select * from public._gaji_harian(p_username, p_dari, p_sampai);
end $$;

create table public.penarikan_gaji (
  id            uuid primary key default gen_random_uuid(),
  akun_id       uuid not null references public.akun (id),
  username      text not null,
  nominal       int not null check (nominal > 0),
  status        text not null default 'diajukan' check (status in ('diajukan', 'dibayar', 'ditolak', 'dibatalkan')),
  diajukan      timestamptz not null default now(),
  diproses      timestamptz,
  diproses_oleh text,
  alasan        text check (char_length(alasan) <= 200)
);
create index penarikan_akun_idx on public.penarikan_gaji (akun_id, diajukan desc);
create index penarikan_status_idx on public.penarikan_gaji (status, diajukan desc);

create or replace function public._saldo_gaji(p_username text)
returns table (username text, total_gaji bigint, dibayar bigint, diajukan bigint, saldo bigint, hari_jaga bigint)
language sql stable security definer set search_path = public as $$
  with g as (select coalesce(sum(gaji), 0)::bigint total, count(*) hari from public._gaji_harian(p_username, null, null)),
       p as (select coalesce(sum(nominal) filter (where status = 'dibayar'), 0)::bigint dibayar,
                    coalesce(sum(nominal) filter (where status = 'diajukan'), 0)::bigint diajukan
               from penarikan_gaji where username = p_username)
  select p_username, g.total, p.dibayar, p.diajukan, g.total - p.dibayar - p.diajukan, g.hari from g, p
$$;
revoke all on function public._saldo_gaji(text) from public, anon, authenticated;

create or replace function public.saldo_gaji(p_username text default null)
returns table (username text, total_gaji bigint, dibayar bigint, diajukan bigint, saldo bigint, hari_jaga bigint)
language plpgsql stable security definer set search_path = public as $$
declare u text := coalesce(p_username, public.username_saya());
begin
  if not (u = public.username_saya() or public.saya_bph() or public.saya_punya(array['bidang_usaha'])) then
    raise exception 'Tidak punya izin melihat saldo orang lain';
  end if;
  return query select * from public._saldo_gaji(u);
end $$;

-- petugas mengajukan penarikan: saldo dan batas dicek di server, dikunci per orang supaya tidak bisa dobel
create or replace function public.ajukan_penarikan(p_nominal int) returns public.penarikan_gaji
language plpgsql security definer set search_path = public as $$
declare u text := public.username_saya(); s bigint; r public.penarikan_gaji;
begin
  if u is null then raise exception 'Belum login'; end if;
  perform pg_advisory_xact_lock(hashtext('tarik:' || u));
  if p_nominal is null or p_nominal < coalesce(public.pengaturan_angka('min_tarik'), 10000) then
    raise exception 'Minimal penarikan Rp%', coalesce(public.pengaturan_angka('min_tarik'), 10000);
  end if;
  if p_nominal > coalesce(public.pengaturan_angka('max_tarik'), 5000000) then
    raise exception 'Maksimal penarikan Rp% per pengajuan', coalesce(public.pengaturan_angka('max_tarik'), 5000000);
  end if;
  select saldo into s from public._saldo_gaji(u);
  if p_nominal > s then raise exception 'Saldo tidak cukup (saldo Rp%)', s; end if;
  insert into penarikan_gaji (akun_id, username, nominal) values (auth.uid(), u, p_nominal) returning * into r;
  return r;
end $$;

-- ketua/bendahara/admin menandai dibayar atau ditolak (tidak untuk penarikan sendiri); pemilik bisa membatalkan
create or replace function public.proses_penarikan(p_id uuid, p_status text, p_alasan text default null) returns public.penarikan_gaji
language plpgsql security definer set search_path = public as $$
declare r public.penarikan_gaji;
begin
  select * into r from penarikan_gaji where id = p_id for update;
  if not found then raise exception 'Pengajuan tidak ditemukan'; end if;
  if r.status <> 'diajukan' then raise exception 'Pengajuan sudah diproses'; end if;
  if p_status = 'dibatalkan' then
    if r.akun_id <> auth.uid() then raise exception 'Hanya pemilik yang bisa membatalkan'; end if;
  elsif p_status in ('dibayar', 'ditolak') then
    if not (public.saya_admin() or public.saya_punya(array['ketua', 'bendahara'])) then raise exception 'Hanya ketua atau bendahara'; end if;
    if r.akun_id = auth.uid() then raise exception 'Penarikanmu sendiri diproses pengurus lain'; end if;
    if p_status = 'ditolak' and char_length(coalesce(trim(p_alasan), '')) < 3 then raise exception 'Tulis alasan penolakan'; end if;
  else
    raise exception 'Status tidak dikenal';
  end if;
  update penarikan_gaji set status = p_status, diproses = now(), diproses_oleh = public.username_saya(), alasan = nullif(trim(p_alasan), '')
   where id = p_id returning * into r;
  return r;
end $$;

-- ========== Jadwal jaga ==========
create table public.jadwal_jaga (
  tanggal     date primary key,
  petugas     text[] not null default '{}' check (cardinality(petugas) <= 10),
  catatan     text not null default '' check (char_length(catatan) <= 200),
  diubah      timestamptz,
  diubah_oleh text
);
create trigger jadwal_pengubah before insert or update on public.jadwal_jaga for each row execute function public.isi_pengubah();
create trigger jadwal_jejak after insert or update on public.jadwal_jaga for each row execute function public.catat_jejak('jadwal', 'tanggal', 'tanggal');
create trigger penarikan_jejak after insert or update on public.penarikan_gaji for each row execute function public.catat_jejak('gaji', 'id', 'username', 'akun_id', 'diajukan', 'diproses');

alter table public.jadwal_jaga enable row level security;
alter table public.penarikan_gaji enable row level security;
create policy jadwal_baca on public.jadwal_jaga for select to authenticated using (public.saya_terdaftar());
create policy jadwal_tambah on public.jadwal_jaga for insert to authenticated with check (public.saya_admin() or public.saya_punya(array['ketua', 'bidang_usaha']));
create policy jadwal_ubah on public.jadwal_jaga for update to authenticated
  using (public.saya_admin() or public.saya_punya(array['ketua', 'bidang_usaha'])) with check (public.saya_admin() or public.saya_punya(array['ketua', 'bidang_usaha']));
create policy penarikan_baca on public.penarikan_gaji for select to authenticated
  using (akun_id = auth.uid() or public.saya_admin() or public.saya_punya(array['ketua', 'bendahara']));
-- tidak ada policy tulis: hanya lewat ajukan_penarikan / proses_penarikan

revoke all on function public.poin_anggota(text), public.riwayat_poin(text, int), public.gaji_harian(text, date, date), public.saldo_gaji(text),
  public.ajukan_penarikan(int), public.proses_penarikan(uuid, text, text), public.pengaturan_angka(text) from public, anon;
grant execute on function public.poin_anggota(text), public.riwayat_poin(text, int), public.gaji_harian(text, date, date), public.saldo_gaji(text),
  public.ajukan_penarikan(int), public.proses_penarikan(uuid, text, text), public.pengaturan_angka(text) to authenticated;
