-- Migrasi 6: web kasir memuat transaksi yang baru masuk / baru dibatalkan sejak pembaruan terakhir.
create index if not exists transaksi_diterima_idx on public.transaksi (diterima_server);
create index if not exists transaksi_dibatalkan_idx on public.transaksi (dibatalkan) where dibatalkan is not null;
