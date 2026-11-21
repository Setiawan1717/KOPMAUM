-- Kopma Hub — skema database Supabase (MVP, 9 tabel + view publik)
-- Jalankan di Supabase: SQL Editor → tempel → Run.
-- Hak akses dijaga dengan row level security (RLS), bukan hanya disembunyikan di tampilan.

create extension if not exists btree_gist;

-- ========== Tipe ==========
create type peran_t as enum ('super_admin','ketua','sekretaris','bendahara','bidang_usaha','petugas_jaga','pengurus','anggota');
create type status_booking_t as enum ('Menunggu','Dikonfirmasi','Diambil','Selesai','Batal');
create type jenis_mutasi_t as enum ('masuk','keluar','opname');
create type jenis_fee_t as enum ('Jaga','Kepanitiaan','Danusan');

-- ========== F1, F2: profil & peran ==========
create table profil (
  id uuid primary key references auth.users(id) on delete cascade,
  nama text not null,
  nim text unique not null,
  email text unique not null,
  prodi text,
  angkatan int,
  wa text,
  status text not null default 'anggota' check (status in ('anggota','pengurus')),
  bidang text,
  pendamping_id uuid references profil(id),
  bergabung date not null default current_date,
  aktif boolean not null default true
);

create table peran_pengguna (
  id bigint generated always as identity primary key,
  user_id uuid not null references profil(id) on delete cascade,
  peran peran_t not null,
  periode text not null,               -- contoh '2026/2027'
  aktif boolean not null default true, -- dicabut saat ganti periode, data tetap ada
  unique (user_id, peran, periode)
);

create table simpanan (
  id bigint generated always as identity primary key,
  user_id uuid not null references profil(id) on delete cascade,
  jenis text not null check (jenis in ('pokok','wajib')),
  nominal int not null check (nominal >= 0),
  tanggal date not null default current_date,
  lunas boolean not null default false
);

-- ========== F3: stok ==========
create table barang_mart (
  id bigint generated always as identity primary key,
  nama text not null,
  kategori text not null,
  harga_beli int not null check (harga_beli >= 0),
  harga_jual int not null check (harga_jual >= 0),
  stok int not null default 0 check (stok >= 0),
  batas_minimum int not null default 0
);

create table mutasi_stok (
  id bigint generated always as identity primary key,
  barang_id bigint not null references barang_mart(id),
  jenis jenis_mutasi_t not null,
  jumlah int not null,                 -- opname boleh negatif (selisih)
  alasan text not null,
  pencatat uuid not null default auth.uid() references profil(id),
  waktu timestamptz not null default now()
);

-- stok di barang_mart selalu mengikuti riwayat mutasi
create or replace function terapkan_mutasi() returns trigger language plpgsql security definer as $$
begin
  update barang_mart set stok = stok + case new.jenis when 'masuk' then new.jumlah when 'keluar' then -new.jumlah else new.jumlah end
  where id = new.barang_id;
  return new;
end $$;
create trigger trg_mutasi after insert on mutasi_stok for each row execute function terapkan_mutasi();

-- ========== F4: rental ==========
create table barang_sewa (
  id bigint generated always as identity primary key,
  nama text not null,
  jumlah_unit int not null check (jumlah_unit > 0),
  spesifikasi text,
  harga_24_jam int not null,
  harga_2_hari int not null,           -- per hari untuk sewa 2 hari ke atas
  batas_hari int not null default 3
);

create table booking_sewa (
  id bigint generated always as identity primary key,
  penyewa text not null,
  wa text,
  barang_id bigint not null references barang_sewa(id),
  unit int not null check (unit > 0),
  tanggal_ambil date not null,
  tanggal_kembali date not null check (tanggal_kembali >= tanggal_ambil),
  total int not null,
  status status_booking_t not null default 'Menunggu',
  pencatat uuid default auth.uid() references profil(id),
  waktu timestamptz not null default now()
);

-- tolak booking kalau unit tersisa tidak cukup di salah satu tanggal
create or replace function cek_ketersediaan() returns trigger language plpgsql as $$
declare d date; dipakai int; kapasitas int; hari int;
begin
  if new.status not in ('Menunggu','Dikonfirmasi','Diambil') then return new; end if;
  select jumlah_unit into kapasitas from barang_sewa where id = new.barang_id;
  hari := greatest(1, new.tanggal_kembali - new.tanggal_ambil);
  for i in 0 .. hari - 1 loop
    d := new.tanggal_ambil + i;
    select coalesce(sum(unit), 0) into dipakai from booking_sewa
      where barang_id = new.barang_id and id is distinct from new.id
        and status in ('Menunggu','Dikonfirmasi','Diambil')
        and d >= tanggal_ambil and d < greatest(tanggal_kembali, tanggal_ambil + 1);
    if dipakai + new.unit > kapasitas then
      raise exception 'Unit tidak cukup pada %: tersisa % unit', d, kapasitas - dipakai;
    end if;
  end loop;
  return new;
end $$;
create trigger trg_cek_booking before insert or update on booking_sewa for each row execute function cek_ketersediaan();

-- ========== F5: poin ==========
create table pengaturan (kunci text primary key, nilai int not null);
insert into pengaturan values ('rp_per_poin', 1000);

create table poin_riwayat (
  id bigint generated always as identity primary key,
  user_id uuid not null references profil(id),
  nominal_belanja int not null default 0,
  poin int not null,
  alasan text not null,
  pencatat uuid not null default auth.uid() references profil(id),
  waktu timestamptz not null default now()
);

-- ========== F6: fee ==========
create table fee (
  id bigint generated always as identity primary key,
  penerima uuid not null references profil(id),
  jenis jenis_fee_t not null,
  kegiatan text not null,
  nominal int not null check (nominal >= 0),
  tanggal date not null default current_date,
  lunas boolean not null default false,
  pencatat uuid not null default auth.uid() references profil(id)
);

-- ========== Fungsi bantu hak akses ==========
create or replace function punya_peran(variadic p peran_t[]) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from peran_pengguna where user_id = auth.uid() and aktif and peran = any(p));
$$;
create or replace function is_phi() returns boolean language sql stable as $$
  select punya_peran('ketua','sekretaris','bendahara');
$$;
create or replace function is_pengurus_mana_pun() returns boolean language sql stable as $$
  select punya_peran('super_admin','ketua','sekretaris','bendahara','bidang_usaha','petugas_jaga','pengurus');
$$;

-- ========== RLS ==========
alter table profil enable row level security;
alter table peran_pengguna enable row level security;
alter table simpanan enable row level security;
alter table barang_mart enable row level security;
alter table mutasi_stok enable row level security;
alter table barang_sewa enable row level security;
alter table booking_sewa enable row level security;
alter table pengaturan enable row level security;
alter table poin_riwayat enable row level security;
alter table fee enable row level security;

-- profil: diri sendiri, atau semua pengurus (petugas jaga butuh cari NIM)
create policy profil_lihat on profil for select using (id = auth.uid() or is_pengurus_mana_pun());
create policy profil_ubah on profil for all using (punya_peran('super_admin') or is_phi()) with check (punya_peran('super_admin') or is_phi());

create policy peran_lihat on peran_pengguna for select using (user_id = auth.uid() or punya_peran('super_admin') or is_phi());
create policy peran_ubah on peran_pengguna for all using (punya_peran('super_admin')) with check (punya_peran('super_admin'));

create policy simpanan_lihat on simpanan for select using (user_id = auth.uid() or punya_peran('super_admin','bidang_usaha','pengurus') or is_phi());
create policy simpanan_ubah on simpanan for all using (punya_peran('super_admin') or is_phi()) with check (punya_peran('super_admin') or is_phi());

-- stok: dilihat pengurus, diubah hanya bidang usaha
create policy mart_lihat on barang_mart for select using (is_pengurus_mana_pun());
create policy mart_ubah on barang_mart for all using (punya_peran('bidang_usaha')) with check (punya_peran('bidang_usaha'));
create policy mutasi_lihat on mutasi_stok for select using (is_pengurus_mana_pun());
create policy mutasi_tambah on mutasi_stok for insert with check (punya_peran('bidang_usaha') and pencatat = auth.uid());

-- rental
create policy sewa_lihat on barang_sewa for select using (true); -- daftar barang & harga memang publik
create policy sewa_ubah on barang_sewa for all using (punya_peran('bidang_usaha') or is_phi()) with check (punya_peran('bidang_usaha') or is_phi());
create policy booking_lihat on booking_sewa for select using (is_pengurus_mana_pun());
create policy booking_ubah on booking_sewa for all using (punya_peran('bidang_usaha','petugas_jaga') or is_phi()) with check (punya_peran('bidang_usaha','petugas_jaga') or is_phi());

-- poin
create policy pengaturan_lihat on pengaturan for select using (auth.uid() is not null);
create policy pengaturan_ubah on pengaturan for update using (punya_peran('bendahara'));
create policy poin_lihat on poin_riwayat for select using (user_id = auth.uid() or punya_peran('super_admin','bidang_usaha') or is_phi());
create policy poin_tambah_belanja on poin_riwayat for insert with check (punya_peran('petugas_jaga') and nominal_belanja > 0 and poin >= 0 and pencatat = auth.uid());
create policy poin_koreksi on poin_riwayat for insert with check (is_phi() and pencatat = auth.uid());
-- tidak ada policy update/delete: riwayat poin tidak bisa diubah, koreksi = baris baru

-- fee: milik sendiri; PHI lihat semua; hanya bendahara mengubah
create policy fee_lihat on fee for select using (penerima = auth.uid() or is_phi());
create policy fee_ubah on fee for all using (punya_peran('bendahara')) with check (punya_peran('bendahara'));

-- ========== View untuk web eksternal (tanpa nama/NIM/WA penyewa) ==========
create or replace view jadwal_sewa_publik with (security_barrier) as
select s.id as barang_id, s.nama as barang, d::date as tanggal,
       case when coalesce(sum(b.unit), 0) >= s.jumlah_unit then 'penuh' else 'tersedia' end as status
from barang_sewa s
cross join generate_series(current_date, current_date + 90, interval '1 day') d
left join booking_sewa b on b.barang_id = s.id
  and b.status in ('Menunggu','Dikonfirmasi','Diambil')
  and d::date >= b.tanggal_ambil and d::date < greatest(b.tanggal_kembali, b.tanggal_ambil + 1)
group by s.id, s.nama, s.jumlah_unit, d;
grant select on jadwal_sewa_publik to anon;
