-- Migrasi 8: ketua bisa menambah dan menghapus akun dari Kopma Hub.
-- Tambah akun: Kopma Hub membuat login (auth.signUp lewat klien terpisah, jadi sesi ketua tidak berganti),
--   lalu ketua_daftarkan_akun() mendaftarkannya ke tabel akun. Role admin tetap hanya lewat dashboard.
-- Hapus akun: ketua_hapus_akun() menghapus login + baris akun. Riwayat transaksi dan penarikan gaji tetap ada
--   (kolom username tetap tersimpan, sambungan ke akun dikosongkan).

-- ========== Riwayat tetap utuh saat akun dihapus ==========
alter table public.transaksi drop constraint if exists transaksi_kasir_id_fkey;
alter table public.transaksi add constraint transaksi_kasir_id_fkey
  foreign key (kasir_id) references public.akun (id) on delete set null;

alter table public.penarikan_gaji alter column akun_id drop not null;
alter table public.penarikan_gaji drop constraint if exists penarikan_gaji_akun_id_fkey;
alter table public.penarikan_gaji add constraint penarikan_gaji_akun_id_fkey
  foreign key (akun_id) references public.akun (id) on delete set null;

-- ========== Tambah akun (khusus ketua) ==========
create or replace function public.ketua_daftarkan_akun(p_uid uuid, p_username text, p_nia text, p_role text, p_hub text[])
returns void language plpgsql security definer set search_path = public as $$
declare
  u text := lower(trim(p_username));
  n text := nullif(upper(trim(coalesce(p_nia, ''))), '');
  r text := coalesce(nullif(p_role, ''), 'anggota');
  h text[] := coalesce(p_hub, '{}');
  surel text;
  pelaku text;
begin
  if auth.uid() is null or not public.saya_punya(array['ketua']) then
    raise exception 'Hanya ketua yang bisa menambah akun';
  end if;
  if r not in ('anggota', 'kasir') then raise exception 'Role kasir hanya boleh anggota atau kasir (admin lewat dashboard Supabase)'; end if;
  if u !~ '^[a-z0-9._-]{3,30}$' then raise exception 'Nama pengguna 3-30 karakter: huruf kecil, angka, titik, strip, atau garis bawah'; end if;
  if not (h <@ array['ketua', 'sekretaris', 'bendahara', 'bidang_usaha', 'petugas_jaga', 'pengurus']::text[]) then
    raise exception 'Peran tidak dikenal';
  end if;
  select email into surel from auth.users where id = p_uid;
  if surel is null then raise exception 'Login akun belum dibuat'; end if;
  if surel is distinct from u || '@kopma.um' then raise exception 'Nama pengguna tidak cocok dengan login akun'; end if;
  if exists (select 1 from akun where id = p_uid) then raise exception 'Akun ini sudah terdaftar'; end if;
  if exists (select 1 from akun where username = u) then raise exception 'Nama pengguna itu sudah dipakai'; end if;
  if n is not null then
    if not exists (select 1 from anggota where nia = n) then raise exception 'NIA % belum ada di data anggota', n; end if;
    if exists (select 1 from akun where nia = n) then raise exception 'NIA % sudah dipakai akun lain', n; end if;
  end if;

  insert into akun (id, username, role, hub, nia) values (p_uid, u, r, h, n);

  select username into pelaku from akun where id = auth.uid();
  insert into jejak (modul, tabel, kunci, aksi, perubahan, ringkasan, oleh, oleh_username)
  values ('akun', 'akun', u, 'tambah',
          jsonb_strip_nulls(jsonb_build_object('role', jsonb_build_array(null, r), 'hub', jsonb_build_array(null, to_jsonb(h)),
                                               'nia', case when n is not null then jsonb_build_array(null, n) end)),
          u, auth.uid(), coalesce(pelaku, 'tidak dikenal'));
end $$;

-- ========== Hapus akun (khusus ketua) ==========
create or replace function public.ketua_hapus_akun(p_uid uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  a akun%rowtype;
  pelaku text;
begin
  if auth.uid() is null or not public.saya_punya(array['ketua']) then
    raise exception 'Hanya ketua yang bisa menghapus akun';
  end if;
  if p_uid = auth.uid() then raise exception 'Akunmu sendiri tidak bisa dihapus'; end if;
  select * into a from akun where id = p_uid for update;
  if not found then raise exception 'Akun tidak ditemukan'; end if;
  if a.role = 'admin' and not exists (select 1 from akun where role = 'admin' and id <> p_uid) then
    raise exception 'Ini satu-satunya admin kasir, jadi tidak bisa dihapus';
  end if;
  if exists (select 1 from penarikan_gaji where akun_id = p_uid and status = 'diajukan') then
    raise exception 'Akun ini masih punya pengajuan penarikan gaji yang belum diproses. Proses dulu, baru hapus.';
  end if;

  select username into pelaku from akun where id = auth.uid();
  insert into jejak (modul, tabel, kunci, aksi, perubahan, ringkasan, oleh, oleh_username)
  values ('akun', 'akun', a.username, 'hapus',
          jsonb_strip_nulls(jsonb_build_object('role', jsonb_build_array(a.role, null), 'hub', jsonb_build_array(to_jsonb(a.hub), null),
                                               'nia', case when a.nia is not null then jsonb_build_array(a.nia, null) end)),
          coalesce(a.nama, a.username), auth.uid(), coalesce(pelaku, 'tidak dikenal'));

  -- menghapus login sekaligus baris akun (on delete cascade); sesi yang masih terbuka ikut terhapus
  delete from auth.users where id = p_uid;
end $$;

revoke all on function public.ketua_daftarkan_akun(uuid, text, text, text, text[]), public.ketua_hapus_akun(uuid) from public, anon;
grant execute on function public.ketua_daftarkan_akun(uuid, text, text, text, text[]), public.ketua_hapus_akun(uuid) to authenticated;
