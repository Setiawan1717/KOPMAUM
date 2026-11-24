-- Migrasi 7: akun lama di Firebase ada yang nama penggunanya 1 huruf ("a"). Supaya tetap bisa masuk
-- dengan nama & kata sandi yang sama, batas minimal nama pengguna dilonggarkan dari 3 menjadi 1 karakter.
alter table public.akun drop constraint if exists akun_username_check;
alter table public.akun add constraint akun_username_check check (username ~ '^[a-z0-9._-]{1,30}$');
