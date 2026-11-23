-- Migrasi 4: Kopma Rental. Total biaya dihitung server; ketersediaan unit dicek server dengan kunci (booking bersamaan tidak bisa dobel).

create or replace function public.saya_kelola_sewa() returns boolean language sql stable as
$$ select public.saya_petugas() or public.saya_punya(array['ketua', 'sekretaris', 'bendahara', 'bidang_usaha', 'petugas_jaga']) $$;
create or replace function public.saya_atur_sewa() returns boolean language sql stable as
$$ select public.saya_admin() or public.saya_punya(array['ketua', 'bidang_usaha']) $$;

create table public.sewa_barang (
  id         uuid primary key default gen_random_uuid(),
  nama       text not null check (char_length(nama) between 2 and 80),
  spek       text not null default '' check (char_length(spek) <= 200),
  unit       int not null check (unit between 1 and 100),
  harga24    int not null check (harga24 between 0 and 10000000),
  harga2     int not null check (harga2 between 0 and 10000000),     -- per hari, untuk sewa 2 hari ke atas
  batas_hari int not null default 3 check (batas_hari between 1 and 60),
  warna      text not null default 'tangerine' check (warna in ('sky', 'tangerine', 'grape', 'pink', 'coral', 'lime', 'mint', 'sun')),
  aktif      boolean not null default true
);

create table public.sewa_booking (
  id          uuid primary key default gen_random_uuid(),
  penyewa     text not null check (char_length(penyewa) between 2 and 100),
  wa          text not null default '' check (char_length(wa) <= 30),
  barang_id   uuid not null references public.sewa_barang (id),
  unit        int not null check (unit between 1 and 100),
  ambil       date not null,
  kembali     date not null,
  status      text not null default 'Dikonfirmasi' check (status in ('Menunggu', 'Dikonfirmasi', 'Diambil', 'Selesai', 'Batal')),
  total       int not null default 0,
  dibayar     int not null default 0 check (dibayar >= 0),
  jaminan     text not null default '' check (char_length(jaminan) <= 100),
  dibuat      timestamptz not null default now(),
  dibuat_oleh text,
  diubah      timestamptz,
  diubah_oleh text,
  check (kembali > ambil),
  check (dibayar <= total)
);
create index sewa_booking_barang_idx on public.sewa_booking (barang_id, ambil, kembali);

create or replace function public.cek_booking() returns trigger language plpgsql security definer set search_path = public as $$
declare
  b public.sewa_barang;
  hari int := new.kembali - new.ambil;
  hari_ini date := (now() at time zone 'Asia/Jakarta')::date;
  d date;
  terpakai int;
begin
  select * into b from sewa_barang where id = new.barang_id for update;      -- kunci: booking barang yang sama antre
  if not found then raise exception 'Barang sewa tidak ditemukan'; end if;
  if (tg_op = 'INSERT' or (new.barang_id, new.unit, new.ambil, new.kembali) is distinct from (old.barang_id, old.unit, old.ambil, old.kembali))
     and hari > b.batas_hari then
    raise exception 'Batas sewa % adalah % hari', b.nama, b.batas_hari;
  end if;
  -- total selalu dihitung server; nilai kiriman aplikasi diabaikan. Booking lama tetap memakai harga saat dibuat.
  if tg_op = 'INSERT' or (new.barang_id, new.unit, new.ambil, new.kembali) is distinct from (old.barang_id, old.unit, old.ambil, old.kembali) then
    new.total := (case when hari = 1 then b.harga24 else b.harga2 * hari end) * new.unit;
  else
    new.total := old.total;
  end if;
  if new.dibayar > new.total then raise exception 'Pembayaran melebihi total Rp%', new.total; end if;
  if new.status in ('Menunggu', 'Dikonfirmasi', 'Diambil') and (tg_op = 'INSERT'
     or (new.barang_id, new.unit, new.ambil, new.kembali, new.status) is distinct from (old.barang_id, old.unit, old.ambil, old.kembali, old.status)) then
    if new.unit > b.unit then raise exception '% hanya punya % unit', b.nama, b.unit; end if;
    for d in select generate_series(new.ambil, new.kembali - 1, interval '1 day')::date loop
      select coalesce(sum(x.unit), 0) into terpakai from sewa_booking x
       where x.barang_id = new.barang_id and x.id <> new.id
         and ((x.status in ('Menunggu', 'Dikonfirmasi', 'Diambil') and d >= x.ambil and d < x.kembali)
              -- barang yang terlambat kembali tetap memakai unit sampai dikembalikan
              or (x.status = 'Diambil' and x.kembali < hari_ini and d >= x.kembali and d <= hari_ini));
      if terpakai + new.unit > b.unit then
        raise exception 'Unit % tidak cukup pada %: tersisa % unit', b.nama, to_char(d, 'DD/MM/YYYY'), greatest(0, b.unit - terpakai);
      end if;
    end loop;
  end if;
  return new;
end $$;
create trigger booking_cek before insert or update on public.sewa_booking for each row execute function public.cek_booking();
create trigger booking_pembuat before insert on public.sewa_booking for each row execute function public.isi_pembuat();
create trigger booking_pengubah before update on public.sewa_booking for each row execute function public.isi_pengubah();
create trigger booking_jejak after insert or update on public.sewa_booking for each row execute function public.catat_jejak('rental', 'id', 'penyewa');
create trigger sewa_barang_jejak after insert or update on public.sewa_barang for each row execute function public.catat_jejak('rental', 'id', 'nama');

alter table public.sewa_barang enable row level security;
alter table public.sewa_booking enable row level security;
-- inventaris aktif boleh dilihat siapa saja (halaman publik); pengelola melihat semuanya
create policy sewa_barang_publik on public.sewa_barang for select to anon, authenticated using (aktif or public.saya_kelola_sewa());
create policy sewa_barang_tambah on public.sewa_barang for insert to authenticated with check (public.saya_atur_sewa());
create policy sewa_barang_ubah on public.sewa_barang for update to authenticated using (public.saya_atur_sewa()) with check (public.saya_atur_sewa());
-- booking lengkap (nama, WA, bayar, jaminan) hanya untuk pengelola; tidak bisa dihapus (pakai status Batal)
create policy booking_baca on public.sewa_booking for select to authenticated using (public.saya_kelola_sewa());
create policy booking_tambah on public.sewa_booking for insert to authenticated with check (public.saya_kelola_sewa());
create policy booking_ubah on public.sewa_booking for update to authenticated using (public.saya_kelola_sewa()) with check (public.saya_kelola_sewa());

-- jadwal publik tanpa data penyewa (untuk kalender tanpa login)
create or replace function public.jadwal_sewa_publik()
returns table (barang_id uuid, unit int, ambil date, kembali date, status text)
language sql stable security definer set search_path = public as $$
  select x.barang_id, x.unit, x.ambil, x.kembali, x.status from sewa_booking x
   join sewa_barang b on b.id = x.barang_id and b.aktif
   where x.status in ('Menunggu', 'Dikonfirmasi', 'Diambil') and x.kembali >= (now() at time zone 'Asia/Jakarta')::date - 62
$$;
revoke all on function public.jadwal_sewa_publik() from public;
grant execute on function public.jadwal_sewa_publik() to anon, authenticated;
