-- Migrasi 2: data kasir. Penjualan, barang masuk, dan pembatalan hanya lewat fungsi server (satu langkah, tidak bisa setengah jadi).

create table public.produk (
  id            uuid primary key default gen_random_uuid(),
  nama          text not null check (char_length(nama) between 1 and 120),
  kategori      text not null default 'Lainnya',
  barcode       text,
  harga_modal   int not null default 0 check (harga_modal >= 0),
  harga_jual    int not null default 0 check (harga_jual >= 0),
  stok          int not null default 0 check (stok >= 0),
  batas_minimum int check (batas_minimum >= 0),        -- kosong = pakai bawaan 5
  aktif         boolean not null default true,
  dibuat        timestamptz not null default now(),
  dibuat_oleh   text,
  diubah        timestamptz,
  diubah_oleh   text
);
create index produk_barcode_idx on public.produk (barcode);

create table public.transaksi (
  id             uuid primary key,                     -- dibuat di perangkat kasir: kirim ulang saat offline tidak dobel
  tanggal        timestamptz not null default now(),
  kasir_id       uuid references public.akun (id),
  kasir          text not null,                        -- nama pengguna kasir (dasar gaji jaga)
  nia_anggota    text check (nia_anggota ~ '^[A-Z0-9./-]{3,20}$'),
  subtotal       int not null check (subtotal >= 0),
  diskon         int not null default 0 check (diskon >= 0),
  total          int not null check (total >= 0),
  metode_bayar   text not null default 'Tunai',
  uang_diterima  int not null default 0,
  nomor_antrian  int,
  batal          boolean not null default false,
  dibatalkan     timestamptz,
  dibatalkan_oleh text,
  diterima_server timestamptz not null default now()
);
create index transaksi_tanggal_idx on public.transaksi (tanggal desc);
create index transaksi_nia_idx on public.transaksi (nia_anggota) where nia_anggota is not null;
create index transaksi_kasir_idx on public.transaksi (kasir, tanggal);

create table public.transaksi_item (
  id           bigint generated always as identity primary key,
  transaksi_id uuid not null references public.transaksi (id) on delete cascade,
  produk_id    uuid references public.produk (id) on delete set null,
  nama         text not null,
  kategori     text,
  harga_jual   int not null,
  harga_modal  int not null default 0,
  qty          int not null check (qty > 0)
);
create index transaksi_item_trx_idx on public.transaksi_item (transaksi_id);

create table public.pengeluaran (
  id          uuid primary key default gen_random_uuid(),
  tanggal     timestamptz not null default now(),
  keterangan  text not null check (char_length(keterangan) between 1 and 200),
  nominal     int not null check (nominal > 0),
  metode      text not null default 'Tunai',
  kasir       text,
  produk_id   uuid references public.produk (id) on delete set null,   -- terisi kalau dari barang masuk
  jumlah      int                                                       -- jumlah barang masuk
);
create index pengeluaran_tanggal_idx on public.pengeluaran (tanggal desc);

create table public.modal_harian (
  tanggal       date primary key,
  modal_cash    int not null default 0 check (modal_cash >= 0),
  modal_qris    int not null default 0 check (modal_qris >= 0),
  diupdate_oleh text,
  updated_at    timestamptz not null default now()
);

-- jejak: perubahan produk dicatat, kecuali perubahan stok karena penjualan/pembatalan (terlalu banyak, sudah ada di transaksi)
create trigger produk_pembuat before insert on public.produk for each row execute function public.isi_pembuat();
create or replace function public.isi_pengubah() returns trigger language plpgsql as $$
begin new.diubah := now(); new.diubah_oleh := coalesce(public.username_saya(), 'dashboard/sistem'); return new; end $$;
create trigger produk_pengubah before update on public.produk for each row execute function public.isi_pengubah();
create trigger produk_jejak after insert or update or delete on public.produk for each row execute function public.catat_jejak('produk', 'id', 'nama');
create trigger pengeluaran_jejak after insert or delete on public.pengeluaran for each row execute function public.catat_jejak('kas', 'id', 'keterangan');
create trigger modal_jejak after insert or update on public.modal_harian for each row execute function public.catat_jejak('kas', 'tanggal', 'tanggal', 'updated_at', 'diupdate_oleh');

-- ========== RLS ==========
alter table public.produk enable row level security;
alter table public.transaksi enable row level security;
alter table public.transaksi_item enable row level security;
alter table public.pengeluaran enable row level security;
alter table public.modal_harian enable row level security;

-- produk: dilihat kasir dan pengurus yang memantau stok; dikelola admin
create policy produk_baca on public.produk for select to authenticated
  using (public.saya_petugas() or public.saya_punya(array['ketua', 'sekretaris', 'bendahara', 'bidang_usaha', 'petugas_jaga', 'pengurus']));
create policy produk_tambah on public.produk for insert to authenticated with check (public.saya_admin());
create policy produk_ubah on public.produk for update to authenticated using (public.saya_admin()) with check (public.saya_admin());
create policy produk_hapus on public.produk for delete to authenticated using (public.saya_admin());

-- transaksi: kasir, pengurus inti, bidang usaha (laporan); setiap akun melihat yang dia layani dan belanjaan NIA-nya
create or replace function public.boleh_lihat_trx(t public.transaksi) returns boolean language sql stable as $$
  select public.saya_petugas() or public.saya_punya(array['ketua', 'sekretaris', 'bendahara', 'bidang_usaha'])
      or t.kasir = public.username_saya() or (t.nia_anggota is not null and t.nia_anggota = public.nia_saya())
$$;
create policy transaksi_baca on public.transaksi for select to authenticated using (public.boleh_lihat_trx(transaksi));
create policy transaksi_item_baca on public.transaksi_item for select to authenticated
  using (exists (select 1 from public.transaksi t where t.id = transaksi_id and public.boleh_lihat_trx(t)));

create policy pengeluaran_baca on public.pengeluaran for select to authenticated
  using (public.saya_petugas() or public.saya_bph());
create policy pengeluaran_tambah on public.pengeluaran for insert to authenticated with check (public.saya_admin());
create policy pengeluaran_hapus on public.pengeluaran for delete to authenticated using (public.saya_admin());

create policy modal_baca on public.modal_harian for select to authenticated using (public.saya_petugas() or public.saya_bph());
create policy modal_tulis on public.modal_harian for insert to authenticated with check (public.saya_admin());
create policy modal_ubah on public.modal_harian for update to authenticated using (public.saya_admin()) with check (public.saya_admin());

-- ========== Fungsi kasir ==========
-- p = { id, tanggal, nia, diskon, metode_bayar, uang_diterima, nomor_antrian, item: [{ produk_id, qty, harga_jual? }] }
-- Harga, nama, dan modal diambil dari data produk di server. Stok tidak boleh minus.
-- Kalau id yang sama dikirim ulang (kasir offline lalu online), transaksi lama yang dikembalikan, tidak dicatat dua kali.
create or replace function public.jual(p jsonb) returns public.transaksi
language plpgsql security definer set search_path = public as $$
declare
  trx public.transaksi;
  it jsonb;
  pr public.produk;
  sub int := 0;
  dsk int := greatest(0, coalesce((p ->> 'diskon')::int, 0));
  nia text := nullif(upper(regexp_replace(coalesce(p ->> 'nia', ''), '\s', '', 'g')), '');
  tgl timestamptz := coalesce((p ->> 'tanggal')::timestamptz, now());
begin
  if not public.saya_petugas() then raise exception 'Hanya akun kasir yang bisa mencatat penjualan'; end if;
  if (p ->> 'id') is null then raise exception 'ID transaksi wajib'; end if;
  select * into trx from transaksi where id = (p ->> 'id')::uuid;
  if found then return trx; end if;                           -- kiriman ulang: sudah tercatat
  if jsonb_array_length(coalesce(p -> 'item', '[]')) = 0 then raise exception 'Keranjang kosong'; end if;
  if tgl > now() + interval '5 minutes' then tgl := now(); end if;  -- jam perangkat terlalu maju
  perform set_config('kopma.tanpa_jejak', '1', true);              -- stok berkurang karena jualan tidak perlu dicatat di jejak
  insert into transaksi (id, tanggal, kasir_id, kasir, nia_anggota, subtotal, diskon, total, metode_bayar, uang_diterima, nomor_antrian)
  values ((p ->> 'id')::uuid, tgl, auth.uid(), public.username_saya(), nia, 0, 0, 0,
          coalesce(nullif(p ->> 'metode_bayar', ''), 'Tunai'), coalesce((p ->> 'uang_diterima')::int, 0), (p ->> 'nomor_antrian')::int)
  returning * into trx;
  for it in select * from jsonb_array_elements(p -> 'item') loop
    select * into pr from produk where id = (it ->> 'produk_id')::uuid for update;
    if not found then raise exception 'Produk tidak ditemukan'; end if;
    if (it ->> 'qty')::int <= 0 then raise exception 'Jumlah barang tidak valid'; end if;
    if pr.stok < (it ->> 'qty')::int then raise exception 'Stok % tidak cukup (sisa %)', pr.nama, pr.stok; end if;
    update produk set stok = stok - (it ->> 'qty')::int where id = pr.id;
    insert into transaksi_item (transaksi_id, produk_id, nama, kategori, harga_jual, harga_modal, qty)
    values (trx.id, pr.id, pr.nama, pr.kategori, pr.harga_jual, pr.harga_modal, (it ->> 'qty')::int);
    sub := sub + pr.harga_jual * (it ->> 'qty')::int;
  end loop;
  update transaksi set subtotal = sub, diskon = least(dsk, sub), total = sub - least(dsk, sub),
         uang_diterima = case when metode_bayar = 'QRIS' then sub - least(dsk, sub) else uang_diterima end
   where id = trx.id returning * into trx;
  perform set_config('kopma.tanpa_jejak', '', true);
  return trx;
end $$;

-- admin membatalkan transaksi: stok dikembalikan, data tetap tersimpan
create or replace function public.batalkan_transaksi(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare it record;
begin
  if not public.saya_admin() then raise exception 'Hanya admin yang bisa membatalkan transaksi'; end if;
  if not exists (select 1 from transaksi where id = p_id and not batal) then raise exception 'Transaksi tidak ada atau sudah dibatalkan'; end if;
  perform set_config('kopma.tanpa_jejak', '1', true);
  for it in select produk_id, qty from transaksi_item where transaksi_id = p_id and produk_id is not null loop
    update produk set stok = stok + it.qty where id = it.produk_id;
  end loop;
  perform set_config('kopma.tanpa_jejak', '', true);
  update transaksi set batal = true, dibatalkan = now(), dibatalkan_oleh = public.username_saya() where id = p_id;
  insert into jejak (modul, tabel, kunci, aksi, perubahan, ringkasan, oleh, oleh_username)
  select 'kasir', 'transaksi', p_id::text, 'ubah', jsonb_build_object('batal', jsonb_build_array(false, true)),
         'Transaksi ' || to_char(tanggal at time zone 'Asia/Jakarta', 'DD/MM HH24:MI') || ' oleh ' || kasir || ' (Rp' || total || ')', auth.uid(), public.username_saya()
    from transaksi where id = p_id;
end $$;

-- admin mencatat barang masuk: stok bertambah dan biaya kulakan tercatat sebagai pengeluaran
create or replace function public.barang_masuk(p_produk uuid, p_jumlah int, p_metode text default 'Tunai') returns void
language plpgsql security definer set search_path = public as $$
declare pr public.produk;
begin
  if not public.saya_admin() then raise exception 'Hanya admin yang bisa mencatat barang masuk'; end if;
  if p_jumlah is null or p_jumlah <= 0 then raise exception 'Jumlah tidak valid'; end if;
  update produk set stok = stok + p_jumlah where id = p_produk returning * into pr;
  if not found then raise exception 'Produk tidak ditemukan'; end if;
  if pr.harga_modal * p_jumlah > 0 then
    insert into pengeluaran (keterangan, nominal, metode, kasir, produk_id, jumlah)
    values ('Stok Masuk: ' || pr.nama || ' (x' || p_jumlah || ')', pr.harga_modal * p_jumlah, coalesce(p_metode, 'Tunai'), public.username_saya(), pr.id, p_jumlah);
  end if;
end $$;

revoke all on function public.jual(jsonb), public.batalkan_transaksi(uuid), public.barang_masuk(uuid, int, text) from public, anon;
grant execute on function public.jual(jsonb), public.batalkan_transaksi(uuid), public.barang_masuk(uuid, int, text) to authenticated;
