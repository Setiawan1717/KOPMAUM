-- Kopma Hub + Kasir — migrasi 1: akun, anggota, peran, jejak otomatis, pengaturan, pendaftaran dengan kode.
-- Semua akses dijaga row level security (RLS). Tabel tanpa policy = tidak bisa diakses dari aplikasi.

-- ========== Anggota (ID = NIA) ==========
create table public.anggota (
  nia         text primary key check (nia ~ '^[A-Z0-9./-]{3,20}$'),
  nama        text not null check (char_length(nama) between 2 and 100),
  fakultas    text,
  prodi       text,
  angkatan    int check (angkatan between 1950 and 2100),
  wa          text check (char_length(wa) <= 30),
  status      text not null default 'anggota' check (status in ('anggota', 'pengurus')),
  bidang      text,
  aktif       boolean not null default true,
  dibuat      timestamptz not null default now(),
  dibuat_oleh text,
  diubah      timestamptz,
  diubah_oleh text
);

-- ========== Akun (1 baris per pengguna login) ==========
create table public.akun (
  id       uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9._-]{3,30}$'),
  role     text not null default 'anggota' check (role in ('admin', 'kasir', 'anggota')),   -- role web kasir
  hub      text[] not null default '{}'
           check (hub <@ array['ketua', 'sekretaris', 'bendahara', 'bidang_usaha', 'petugas_jaga', 'pengurus']::text[]),
  nia      text unique references public.anggota (nia),
  nama     text,
  dibuat   timestamptz not null default now()
);

-- ========== Fungsi bantu hak akses ==========
create or replace function public.saya_admin() returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from akun where id = auth.uid() and role = 'admin') $$;
create or replace function public.saya_petugas() returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from akun where id = auth.uid() and role in ('admin', 'kasir')) $$;
create or replace function public.saya_punya(peran text[]) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from akun where id = auth.uid() and hub && peran) $$;
create or replace function public.saya_terdaftar() returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from akun where id = auth.uid()) $$;
create or replace function public.username_saya() returns text language sql stable security definer set search_path = public as
$$ select username from akun where id = auth.uid() $$;
create or replace function public.nia_saya() returns text language sql stable security definer set search_path = public as
$$ select nia from akun where id = auth.uid() $$;
-- pengurus inti + admin
create or replace function public.saya_bph() returns boolean language sql stable as
$$ select public.saya_admin() or public.saya_punya(array['ketua', 'sekretaris', 'bendahara']) $$;

-- ========== Jejak otomatis ==========
-- Diisi trigger, bukan aplikasi: perubahan dari Kopma Hub, kasir, maupun dashboard Supabase ikut tercatat.
create table public.jejak (
  id            bigint generated always as identity primary key,
  waktu         timestamptz not null default now(),
  modul         text not null,
  tabel         text not null,
  kunci         text not null,
  aksi          text not null check (aksi in ('tambah', 'ubah', 'hapus')),
  perubahan     jsonb not null default '{}',     -- { kolom: [lama, baru] }
  ringkasan     text,                            -- teks singkat opsional (mis. "Booking HMJ X")
  oleh          uuid,
  oleh_username text not null
);
create index jejak_waktu_idx on public.jejak (waktu desc);
create index jejak_modul_idx on public.jejak (modul, waktu desc);

-- TG_ARGV[0] = modul, TG_ARGV[1] = kolom kunci, TG_ARGV[2] = kolom judul (opsional), sisanya = kolom yang diabaikan
create or replace function public.catat_jejak() returns trigger language plpgsql security definer set search_path = public as $$
declare
  lama jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) else '{}'::jsonb end;
  baru jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) else '{}'::jsonb end;
  abai text[] := array['diubah', 'diubah_oleh', 'dibuat', 'dibuat_oleh']::text[] || coalesce(tg_argv[3:], '{}');
  beda jsonb := '{}';
  k text;
  pelaku text;
  judul text;
begin
  -- fungsi tertentu (mis. hubungkan_nia) meminta perubahannya tidak dicatat
  if current_setting('kopma.tanpa_jejak', true) = '1' then return coalesce(new, old); end if;
  if tg_op = 'UPDATE' then
    for k in select jsonb_object_keys(baru) loop
      if not (k = any (abai)) and (lama -> k) is distinct from (baru -> k) then
        beda := beda || jsonb_build_object(k, jsonb_build_array(lama -> k, baru -> k));
      end if;
    end loop;
    if beda = '{}' then return new; end if;
  elsif tg_op = 'INSERT' then
    for k in select jsonb_object_keys(baru) loop
      if not (k = any (abai)) and baru -> k <> 'null'::jsonb then
        beda := beda || jsonb_build_object(k, jsonb_build_array(null, baru -> k));
      end if;
    end loop;
  end if;
  select username into pelaku from akun where id = auth.uid();
  judul := case when tg_argv[2] is not null and tg_argv[2] <> '' then coalesce(baru ->> tg_argv[2], lama ->> tg_argv[2]) end;
  insert into jejak (modul, tabel, kunci, aksi, perubahan, ringkasan, oleh, oleh_username)
  values (tg_argv[0], tg_table_name, coalesce(baru ->> tg_argv[1], lama ->> tg_argv[1]),
          case tg_op when 'INSERT' then 'tambah' when 'UPDATE' then 'ubah' else 'hapus' end,
          beda, judul, auth.uid(),
          coalesce(pelaku, case when auth.uid() is null then 'dashboard/sistem' else 'tidak dikenal' end));
  return coalesce(new, old);
end $$;

-- ========== Pengaturan (dibaca akun terdaftar) & rahasia (tidak bisa dibaca siapa pun) ==========
create table public.pengaturan (
  kunci       text primary key check (kunci in ('rp_per_poin', 'wa_bendahara', 'gaji_persen', 'min_tarik', 'max_tarik')),
  nilai       jsonb not null,
  diubah      timestamptz not null default now(),
  diubah_oleh text
);
insert into public.pengaturan (kunci, nilai) values
  ('rp_per_poin', '1000'), ('gaji_persen', '1'), ('min_tarik', '10000'), ('max_tarik', '5000000'), ('wa_bendahara', '""');

create table public.rahasia (kunci text primary key, nilai text not null);   -- mis. kode_daftar, diisi lewat dashboard SQL

create or replace function public.cek_pengaturan() returns trigger language plpgsql as $$
begin
  if new.kunci in ('rp_per_poin', 'min_tarik', 'max_tarik') and not (jsonb_typeof(new.nilai) = 'number' and (new.nilai #>> '{}')::numeric >= 1
     and (new.nilai #>> '{}')::numeric = floor((new.nilai #>> '{}')::numeric) and (new.nilai #>> '{}')::numeric <= 100000000) then
    raise exception 'Nilai % harus bilangan bulat >= 1', new.kunci;
  end if;
  if new.kunci = 'gaji_persen' and not (jsonb_typeof(new.nilai) = 'number' and (new.nilai #>> '{}')::numeric between 0 and 100) then
    raise exception 'Persen gaji harus 0 sampai 100';
  end if;
  if new.kunci = 'wa_bendahara' and not (jsonb_typeof(new.nilai) = 'string' and (new.nilai #>> '{}') ~ '^(62[0-9]{8,13})?$') then
    raise exception 'Nomor WA harus diawali 62';
  end if;
  new.diubah := now(); new.diubah_oleh := coalesce(public.username_saya(), 'dashboard/sistem');
  return new;
end $$;
create trigger pengaturan_cek before insert or update on public.pengaturan for each row execute function public.cek_pengaturan();
create trigger pengaturan_jejak after update on public.pengaturan for each row execute function public.catat_jejak('pengaturan', 'kunci', 'kunci');

-- ========== Penjagaan kolom ==========
-- anggota: pemilik NIA hanya boleh mengubah data diri; NIA tidak pernah berubah
create or replace function public.cek_ubah_anggota() returns trigger language plpgsql as $$
begin
  if new.nia <> old.nia then raise exception 'NIA tidak bisa diubah'; end if;
  if auth.uid() is not null and not (public.saya_admin() or public.saya_punya(array['ketua', 'sekretaris'])) then
    if (new.status, new.bidang, new.aktif, new.dibuat, new.dibuat_oleh) is distinct from (old.status, old.bidang, old.aktif, old.dibuat, old.dibuat_oleh) then
      raise exception 'Status, bidang, dan keaktifan hanya bisa diubah ketua atau sekretaris';
    end if;
  end if;
  new.diubah := now(); new.diubah_oleh := coalesce(public.username_saya(), 'dashboard/sistem');
  return new;
end $$;
create trigger anggota_cek before update on public.anggota for each row execute function public.cek_ubah_anggota();
create or replace function public.isi_pembuat() returns trigger language plpgsql as $$
begin new.dibuat := now(); new.dibuat_oleh := coalesce(public.username_saya(), 'dashboard/sistem'); return new; end $$;
create trigger anggota_pembuat before insert on public.anggota for each row execute function public.isi_pembuat();
create trigger anggota_jejak after insert or update on public.anggota for each row execute function public.catat_jejak('anggota', 'nia', 'nama');

-- akun: ketua/sekretaris hanya boleh mengubah hub akun lain; selain admin tidak ada yang mengubah role/username/nia
create or replace function public.cek_ubah_akun() returns trigger language plpgsql as $$
begin
  if new.id <> old.id then raise exception 'ID akun tidak bisa diubah'; end if;
  if current_setting('kopma.izin', true) = 'hubungkan_nia' then return new; end if;   -- lewat fungsi hubungkan_nia
  if auth.uid() is not null and not public.saya_admin() then
    if (new.username, new.role, new.nia, new.nama, new.dibuat) is distinct from (old.username, old.role, old.nia, old.nama, old.dibuat) then
      raise exception 'Hanya admin yang bisa mengubah data akun selain peran';
    end if;
    if new.hub is distinct from old.hub and (new.id = auth.uid() or not public.saya_punya(array['ketua', 'sekretaris'])) then
      raise exception 'Peran hanya bisa diatur ketua atau sekretaris, dan tidak untuk akun sendiri';
    end if;
  end if;
  return new;
end $$;
create trigger akun_cek before update on public.akun for each row execute function public.cek_ubah_akun();
-- pendaftaran akun tidak dicatat (bukan perubahan data); perubahan peran/role dicatat
create trigger akun_jejak after update on public.akun for each row execute function public.catat_jejak('akun', 'username', 'username', 'nama');

-- ========== RLS ==========
alter table public.anggota enable row level security;
alter table public.akun enable row level security;
alter table public.jejak enable row level security;
alter table public.pengaturan enable row level security;
alter table public.rahasia enable row level security;   -- tanpa policy: tertutup total

create policy anggota_baca on public.anggota for select to authenticated
  using (public.saya_bph() or nia = public.nia_saya());
create policy anggota_tambah on public.anggota for insert to authenticated
  with check (public.saya_admin() or public.saya_punya(array['ketua', 'sekretaris']));
create policy anggota_ubah on public.anggota for update to authenticated
  using (public.saya_admin() or public.saya_punya(array['ketua', 'sekretaris']) or nia = public.nia_saya())
  with check (public.saya_admin() or public.saya_punya(array['ketua', 'sekretaris']) or nia = public.nia_saya());

create policy akun_baca on public.akun for select to authenticated
  using (id = auth.uid() or public.saya_admin() or public.saya_punya(array['ketua', 'sekretaris', 'bendahara', 'bidang_usaha']));
create policy akun_ubah on public.akun for update to authenticated
  using (public.saya_admin() or public.saya_punya(array['ketua', 'sekretaris']))
  with check (public.saya_admin() or public.saya_punya(array['ketua', 'sekretaris']));

create policy jejak_baca on public.jejak for select to authenticated using (public.saya_bph());

create policy pengaturan_baca on public.pengaturan for select to authenticated using (public.saya_terdaftar());
create policy pengaturan_ubah on public.pengaturan for update to authenticated
  using (public.saya_admin() or public.saya_punya(array['ketua', 'bendahara']))
  with check (public.saya_admin() or public.saya_punya(array['ketua', 'bendahara']));

-- ========== Pendaftaran akun dengan kode ==========
create table public.percobaan_daftar (waktu timestamptz not null default now(), uid uuid);
alter table public.percobaan_daftar enable row level security;

-- Mengembalikan '' kalau berhasil, atau pesan kesalahan. Kode salah tidak memakai exception supaya catatan
-- percobaannya tetap tersimpan (dasar penguncian 20 tebakan salah per jam).
create or replace function public.daftar_akun(p_kode text, p_nia text, p_username text) returns text
language plpgsql security definer set search_path = public as $$
declare kode text; surel text;
begin
  if auth.uid() is null then raise exception 'Belum login'; end if;
  if exists (select 1 from akun where id = auth.uid()) then raise exception 'Akun ini sudah terdaftar'; end if;
  if (select count(*) from percobaan_daftar where waktu > now() - interval '1 hour') >= 20 then
    raise exception 'Terlalu banyak percobaan pendaftaran gagal. Coba lagi 1 jam lagi.';
  end if;
  select nilai into kode from rahasia where kunci = 'kode_daftar';
  if kode is null or char_length(kode) < 6 or p_kode is distinct from kode then
    insert into percobaan_daftar (uid) values (auth.uid());
    return 'Kode pendaftaran salah';
  end if;
  select email into surel from auth.users where id = auth.uid();
  if surel is distinct from lower(p_username) || '@kopma.um' then raise exception 'Nama pengguna tidak cocok dengan email akun'; end if;
  if not exists (select 1 from anggota where nia = p_nia) then raise exception 'NIA belum terdaftar di data anggota'; end if;
  if exists (select 1 from akun where nia = p_nia) then raise exception 'NIA sudah dipakai akun lain'; end if;
  insert into akun (id, username, role, nia) values (auth.uid(), lower(p_username), 'anggota', p_nia);
  return '';
end $$;

-- akun lama (tanpa NIA) menghubungkan NIA miliknya
create or replace function public.hubungkan_nia(p_nia text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from akun where id = auth.uid() and nia is null) then raise exception 'Akun ini sudah punya NIA'; end if;
  if not exists (select 1 from anggota where nia = p_nia) then raise exception 'NIA belum terdaftar di data anggota'; end if;
  if exists (select 1 from akun where nia = p_nia) then raise exception 'NIA sudah dipakai akun lain'; end if;
  perform set_config('kopma.izin', 'hubungkan_nia', true);
  perform set_config('kopma.tanpa_jejak', '1', true);
  update akun set nia = p_nia where id = auth.uid();
  perform set_config('kopma.izin', '', true);
  perform set_config('kopma.tanpa_jejak', '', true);
end $$;

revoke all on function public.daftar_akun(text, text, text), public.hubungkan_nia(text) from public, anon;
grant execute on function public.daftar_akun(text, text, text), public.hubungkan_nia(text) to authenticated;
