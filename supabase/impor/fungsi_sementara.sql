-- FUNGSI IMPOR SEMENTARA: pasang sebelum impor, HAPUS setelah selesai (lihat README.md).
-- Ganti TOKEN_ACAK dengan token acak yang sama dengan isi <KERJA>/token.txt. Jangan commit token asli.
insert into public.rahasia (kunci, nilai) values ('token_impor', 'TOKEN_ACAK')
  on conflict (kunci) do update set nilai = excluded.nilai;

create or replace function public.impor_kopma_sementara(p_token text, p_jenis text, p_data jsonb) returns int
language plpgsql security definer set search_path = public, extensions as $$
declare r jsonb; i jsonb; n int := 0; baru boolean;
begin
  if p_token is null or p_token is distinct from (select nilai from rahasia where kunci = 'token_impor') then raise exception 'token impor salah'; end if;
  perform set_config('kopma.tanpa_jejak', '1', true);     -- impor tidak dicatat sebagai perubahan
  if p_jenis = 'anggota' then
    for r in select * from jsonb_array_elements(p_data) loop
      insert into anggota (nia, nama, status) values (r->>'nia', r->>'nama', coalesce(r->>'status', 'anggota')) on conflict (nia) do nothing;
      n := n + 1;
    end loop;
  elsif p_jenis = 'akun' then
    for r in select * from jsonb_array_elements(p_data) loop
      insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
                              created_at, updated_at, last_sign_in_at, confirmation_token, email_change, email_change_token_new, recovery_token)
      values ('00000000-0000-0000-0000-000000000000', (r->>'id')::uuid, 'authenticated', 'authenticated', r->>'email', r->>'hash', now(),
              '{"provider":"email","providers":["email"]}', '{}', (r->>'dibuat')::timestamptz, now(), (r->>'masuk')::timestamptz, '', '', '', '')
      on conflict (id) do update set email = excluded.email, encrypted_password = excluded.encrypted_password;
      insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
      values (gen_random_uuid(), (r->>'id')::uuid, r->>'id', jsonb_build_object('sub', r->>'id', 'email', r->>'email', 'email_verified', true), 'email', now(), now(), now())
      on conflict (provider_id, provider) do nothing;
      insert into akun (id, username, role, hub, nama, nia)
      values ((r->>'id')::uuid, r->>'username', r->>'role', array(select jsonb_array_elements_text(r->'hub')), nullif(r->>'nama', ''), nullif(r->>'nia', ''))
      on conflict (id) do update set username = excluded.username, role = excluded.role, hub = excluded.hub, nama = excluded.nama, nia = excluded.nia;
      n := n + 1;
    end loop;
  elsif p_jenis = 'produk' then
    for r in select * from jsonb_array_elements(p_data) loop
      insert into produk (id, nama, kategori, barcode, harga_modal, harga_jual, stok, batas_minimum)
      values ((r->>'id')::uuid, r->>'nama', r->>'kategori', nullif(r->>'barcode', ''), (r->>'harga_modal')::int, (r->>'harga_jual')::int, (r->>'stok')::int, (r->>'batas_minimum')::int)
      on conflict (id) do update set nama = excluded.nama, kategori = excluded.kategori, barcode = excluded.barcode, harga_modal = excluded.harga_modal,
        harga_jual = excluded.harga_jual, stok = excluded.stok, batas_minimum = excluded.batas_minimum;
      n := n + 1;
    end loop;
  elsif p_jenis = 'transaksi' then
    for r in select * from jsonb_array_elements(p_data) loop
      insert into transaksi (id, tanggal, kasir_id, kasir, nia_anggota, subtotal, diskon, total, metode_bayar, uang_diterima, nomor_antrian, diterima_server)
      values ((r->>'id')::uuid, (r->>'tanggal')::timestamptz, (r->>'kasir_id')::uuid, r->>'kasir', nullif(r->>'nia', ''), (r->>'subtotal')::int, (r->>'diskon')::int,
              (r->>'total')::int, r->>'metode', (r->>'uang_diterima')::int, (r->>'nomor_antrian')::int, (r->>'tanggal')::timestamptz)
      on conflict (id) do nothing;
      get diagnostics n = row_count;
      baru := n > 0;
      if baru then
        for i in select * from jsonb_array_elements(r->'item') loop
          insert into transaksi_item (transaksi_id, produk_id, nama, kategori, harga_jual, harga_modal, qty)
          values ((r->>'id')::uuid, (i->>'produk_id')::uuid, i->>'nama', i->>'kategori', (i->>'harga_jual')::int, (i->>'harga_modal')::int, (i->>'qty')::int);
        end loop;
      end if;
    end loop;
    select count(*) into n from transaksi;
  elsif p_jenis = 'modal' then
    for r in select * from jsonb_array_elements(p_data) loop
      insert into modal_harian (tanggal, modal_cash, modal_qris, diupdate_oleh, updated_at)
      values ((r->>'tanggal')::date, (r->>'modal_cash')::int, (r->>'modal_qris')::int, r->>'oleh', coalesce((r->>'updated_at')::timestamptz, now()))
      on conflict (tanggal) do update set modal_cash = excluded.modal_cash, modal_qris = excluded.modal_qris, diupdate_oleh = excluded.diupdate_oleh, updated_at = excluded.updated_at;
      n := n + 1;
    end loop;
  else
    raise exception 'jenis tidak dikenal';
  end if;
  return n;
end $$;
revoke all on function public.impor_kopma_sementara(text, text, jsonb) from public, authenticated;
grant execute on function public.impor_kopma_sementara(text, text, jsonb) to anon;
