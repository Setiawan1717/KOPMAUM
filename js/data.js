/* Kopma Hub — lapisan data (mode demo, disimpan di localStorage).
   Struktur tabel mengikuti supabase/schema.sql supaya nanti mudah dipindah ke Supabase. */

const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseYmd = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parseYmd(s); d.setDate(d.getDate() + n); return ymd(d); };
const diffDays = (a, b) => Math.round((parseYmd(b) - parseYmd(a)) / 864e5);
const TODAY = ymd(new Date());
const nowIso = () => new Date().toISOString();
const uid = (p) => p + '_' + Math.random().toString(36).slice(2, 9);

const ROLES = {
  super_admin:  { label: 'Super admin',  short: 'Admin',      color: 'grape' },
  ketua:        { label: 'Ketua',        short: 'Ketua',      color: 'coral' },
  sekretaris:   { label: 'Sekretaris',   short: 'Sekretaris', color: 'coral' },
  bendahara:    { label: 'Bendahara',    short: 'Bendahara',  color: 'coral' },
  bidang_usaha: { label: 'Bidang usaha', short: 'Usaha',      color: 'lime' },
  petugas_jaga: { label: 'Petugas jaga', short: 'Jaga',       color: 'tangerine' },
  pengurus:     { label: 'Pengurus',     short: 'Pengurus',   color: 'sky' },
  anggota:      { label: 'Anggota',      short: 'Anggota',    color: 'mint' },
};
const PHI_ROLES = ['ketua', 'sekretaris', 'bendahara'];
const PERIODE = '2026/2027';

function seed() {
  const P = (id, nama, nia, prodi, angkatan, wa, status, bidang, pendamping, bergabung) =>
    ({ id, nama, nia, email: nama.split(' ')[0].toLowerCase() + '@kopma.um.ac.id', prodi, angkatan, wa, status, bidang, pendampingId: pendamping, bergabung, aktif: true });

  const profil = [
    P('u1', 'Raka Pratama',     '2022.001', 'Teknik Informatika',  2022, '0812-3301-1101', 'pengurus', 'Administrasi & IT', null, '2022-09-12'),
    P('u2', 'Nadia Putri',      '2022.002', 'Manajemen',           2022, '0812-3301-2202', 'pengurus', 'PHI',               null, '2022-09-12'),
    P('u3', 'Salsa Amelia',     '2022.003', 'Akuntansi',           2022, '0812-3301-3303', 'pengurus', 'PHI',               null, '2022-09-12'),
    P('u4', 'Dimas Arya',       '2023.004', 'Ilmu Komunikasi',     2023, '0812-3301-4404', 'pengurus', 'PHI',               null, '2023-09-08'),
    P('u5', 'Fajar Nugroho',    '2023.005', 'Kewirausahaan',       2023, '0812-3301-5505', 'pengurus', 'Usaha',             null, '2023-09-08'),
    P('u6', 'Intan Maharani',   '2023.006', 'Manajemen',           2023, '0812-3301-6606', 'pengurus', 'Usaha',             null, '2023-09-08'),
    P('u7', 'Bagus Setyo',      '2023.007', 'Pendidikan Biologi',  2023, '0812-3301-7707', 'pengurus', 'PSDA',              null, '2023-09-08'),
    P('u8', 'Ayu Lestari',      '2024.008', 'Sastra Inggris',      2024, '0812-3301-8808', 'anggota',  null,                'u7', '2024-09-10'),
    P('u9', 'Rizky Maulana',    '2024.009', 'Teknik Elektro',      2024, '0812-3301-9909', 'anggota',  null,                'u7', '2024-09-10'),
    P('u10','Citra Wulandari',  '2024.010', 'Ekonomi Pembangunan', 2024, '0812-3302-0010', 'anggota',  null,                'u6', '2024-09-10'),
    P('u11','Yoga Prasetyo',    '2025.011', 'Pendidikan Fisika',   2025, '0812-3302-1111', 'anggota',  null,                'u6', '2025-09-15'),
    P('u12','Laras Anindita',   '2025.012', 'Psikologi',           2025, '0812-3302-2212', 'anggota',  null,                'u5', '2025-09-15'),
    P('u13','Hendra Kusuma',    '2025.013', 'Teknik Mesin',        2025, '0812-3302-3313', 'anggota',  null,                'u5', '2025-09-15'),
    P('u14','Putri Rahmawati',  '2025.014', 'Pendidikan Bahasa',   2025, '0812-3302-4414', 'anggota',  null,                'u4', '2025-09-15'),
    P('u15','Galih Saputra',    '2026.015', 'Manajemen',           2026, '0812-3302-5515', 'anggota',  null,                'u4', '2026-09-14'),
    P('u16','Nisa Azzahra',     '2026.016', 'Pendidikan Kimia',    2026, '0812-3302-6616', 'anggota',  null,                'u7', '2026-09-14'),
  ];

  const roleMap = {
    u1: ['super_admin', 'pengurus'], u2: ['ketua', 'pengurus'], u3: ['bendahara', 'pengurus'],
    u4: ['sekretaris', 'pengurus'], u5: ['bidang_usaha', 'pengurus'], u6: ['petugas_jaga', 'bidang_usaha', 'pengurus'],
    u7: ['pengurus'],
  };
  const peran = [];
  profil.forEach((p) => {
    (roleMap[p.id] || []).forEach((r) => peran.push({ userId: p.id, peran: r, periode: PERIODE, aktif: true }));
    peran.push({ userId: p.id, peran: 'anggota', periode: PERIODE, aktif: true });
  });

  const simpanan = [];
  profil.forEach((p, i) => {
    simpanan.push({ id: uid('s'), userId: p.id, jenis: 'pokok', nominal: 50000, tanggal: p.bergabung, lunas: i !== 15 });
    simpanan.push({ id: uid('s'), userId: p.id, jenis: 'wajib', nominal: 10000, tanggal: addDays(TODAY, -20), lunas: ![9, 12, 14, 15].includes(i) });
  });

  const B = (id, nama, kategori, hargaBeli, hargaJual, stok, min) => ({ id, nama, kategori, hargaBeli, hargaJual, stok, min });
  const barangMart = [
    B('m1', 'Air mineral 600 ml',        'Minuman',     2500, 3500, 46, 24),
    B('m2', 'Teh botol 350 ml',          'Minuman',     3800, 5000, 9,  12),
    B('m3', 'Kopi susu kaleng',          'Minuman',     6000, 8000, 14, 10),
    B('m4', 'Mi instan goreng',          'Makanan',     2800, 3500, 31, 20),
    B('m5', 'Roti cokelat',              'Makanan',     4000, 5500, 4,  10),
    B('m6', 'Keripik singkong 100 g',    'Makanan',     6500, 9000, 12, 8),
    B('m7', 'Pulpen gel hitam',          'Alat tulis',  2000, 3000, 38, 15),
    B('m8', 'Buku tulis 38 lembar',      'Alat tulis',  3200, 4500, 7,  15),
    B('m9', 'Map plastik kancing',       'Alat tulis',  1800, 3000, 22, 10),
    B('m10','Kaos Kopma UM',             'Merchandise', 45000, 65000, 11, 5),
    B('m11','Totebag kanvas UM',         'Merchandise', 22000, 35000, 3,  5),
    B('m12','Tisu saku',                 'Kebutuhan',   1500, 2500, 25, 12),
  ];

  const mutasi = [];
  const M = (barangId, jenis, jumlah, alasan, olehId, hari) =>
    mutasi.push({ id: uid('mt'), barangId, jenis, jumlah, alasan, olehId, waktu: new Date(parseYmd(addDays(TODAY, -hari)).getTime() + 9.5 * 36e5).toISOString() });
  M('m1', 'masuk', 48, 'Belanja stok', 'u5', 6);  M('m4', 'masuk', 40, 'Belanja stok', 'u5', 6);
  M('m2', 'keluar', 15, 'Terjual', 'u6', 3);      M('m5', 'keluar', 2, 'Kedaluwarsa', 'u6', 2);
  M('m8', 'keluar', 8, 'Terjual', 'u6', 1);       M('m11', 'keluar', 1, 'Rusak', 'u5', 1);
  M('m10', 'masuk', 12, 'Belanja stok', 'u5', 9); M('m3', 'opname', -1, 'Stock opname', 'u5', 10);

  const S = (id, nama, unit, spek, harga24, harga2, batasHari, warna) => ({ id, nama, unit, spek, harga24, harga2, batasHari, warna });
  const barangSewa = [
    S('r1', 'LCD Proyektor Epson', 2, '3.300 lumen, HDMI + VGA, termasuk kabel 10 m', 75000, 65000, 3, 'sky'),
    S('r2', 'HT (Handy Talky)',    6, 'Jarak 3–5 km, baterai cadangan, earpiece', 20000, 15000, 7, 'tangerine'),
    S('r3', 'Sound system portable', 1, 'Speaker 15 inci + 2 mic wireless', 150000, 125000, 2, 'grape'),
    S('r4', 'Kamera mirrorless',   1, 'Lensa kit 15–45 mm, 2 baterai, SD 64 GB', 50000, 37500, 3, 'pink'),
    S('r5', 'Karpet merah 1×5 m',  4, 'Untuk panggung dan pelantikan', 25000, 20000, 3, 'coral'),
  ];

  const K = (penyewa, wa, barangId, unit, dAmbil, dKembali, status, olehId) => {
    const ambil = addDays(TODAY, dAmbil), kembali = addDays(TODAY, dKembali);
    const item = barangSewa.find((b) => b.id === barangId);
    return { id: uid('bk'), penyewa, wa, barangId, unit, ambil, kembali, total: hitungBiaya(item, ambil, kembali, unit), status, olehId, waktu: nowIso() };
  };
  const booking = [
    K('HMJ Teknik Elektro',   '0857-1100-2211', 'r1', 1, -6, -4, 'Selesai',      'u6'),
    K('BEM FIP',              '0857-1100-3322', 'r2', 4, -3, -1, 'Diambil',      'u6'),
    K('UKM Paduan Suara',     '0857-1100-4433', 'r3', 1, -1, 1,  'Diambil',      'u6'),
    K('Himaprodi Manajemen',  '0857-1100-5544', 'r1', 2, 1, 3,   'Dikonfirmasi', 'u6'),
    K('Panitia Dies Natalis', '0857-1100-6655', 'r5', 4, 3, 5,   'Dikonfirmasi', 'u5'),
    K('Rina (FS)',            '0857-1100-7766', 'r4', 1, 2, 4,   'Menunggu',     'u6'),
    K('UKM Pecinta Alam',     '0857-1100-8877', 'r2', 6, 7, 10,  'Menunggu',     'u6'),
    K('DPM FEB',              '0857-1100-9988', 'r1', 1, -2, 0,  'Batal',        'u6'),
  ];

  const poin = [];
  const PO = (userId, belanja, hari, olehId = 'u6', alasan = 'Belanja Kopma Mart') =>
    poin.push({ id: uid('p'), userId, belanja, poin: Math.floor(belanja / 1000), alasan, olehId, waktu: new Date(parseYmd(addDays(TODAY, -hari)).getTime() + 13 * 36e5).toISOString() });
  PO('u8', 23500, 12); PO('u8', 41000, 6); PO('u8', 12500, 2);
  PO('u9', 18000, 9);  PO('u9', 65000, 4);
  PO('u10', 9000, 7);  PO('u10', 27000, 1);
  PO('u11', 35000, 5); PO('u12', 15500, 3); PO('u13', 72000, 8); PO('u14', 8000, 2);
  PO('u7', 30000, 4);  PO('u5', 21000, 3); PO('u2', 14000, 1);
  poin.push({ id: uid('p'), userId: 'u9', belanja: 0, poin: 5, alasan: 'Koreksi: belanja 3 hari lalu belum tercatat', olehId: 'u2', waktu: new Date(parseYmd(addDays(TODAY, -3)).getTime() + 15 * 36e5).toISOString() });

  const bulanIni = TODAY.slice(0, 7);
  const bulanLalu = ymd(new Date(parseYmd(TODAY).getFullYear(), parseYmd(TODAY).getMonth() - 1, 15));
  const F = (userId, jenis, kegiatan, nominal, tanggal, lunas) => ({ id: uid('f'), userId, jenis, kegiatan, nominal, tanggal, lunas, olehId: 'u3' });
  const fee = [
    F('u6', 'Jaga', 'Jaga Kopma Mart (8 shift)', 120000, `${bulanIni}-05`, true),
    F('u5', 'Jaga', 'Jaga Kopma Mart (5 shift)', 75000, `${bulanIni}-05`, true),
    F('u7', 'Jaga', 'Jaga Kopma Mart (4 shift)', 60000, `${bulanIni}-05`, false),
    F('u7', 'Kepanitiaan', 'Pelatihan Perkoperasian Dasar', 100000, `${bulanIni}-12`, false),
    F('u4', 'Kepanitiaan', 'Pelatihan Perkoperasian Dasar', 100000, `${bulanIni}-12`, false),
    F('u8', 'Danusan', 'Bazar Wisuda — relawan', 50000, `${bulanIni}-15`, false),
    F('u9', 'Danusan', 'Bazar Wisuda — relawan', 50000, `${bulanIni}-15`, true),
    F('u6', 'Jaga', 'Jaga Kopma Mart (7 shift)', 105000, bulanLalu, true),
    F('u5', 'Kepanitiaan', 'Open Recruitment 2026', 80000, bulanLalu, true),
    F('u2', 'Kepanitiaan', 'Open Recruitment 2026', 80000, bulanLalu, true),
  ];

  const log = [
    { id: uid('l'), olehId: 'u1', modul: 'akun', aksi: 'Membuka periode kepengurusan 2026/2027', waktu: new Date(parseYmd(addDays(TODAY, -30)).getTime() + 8 * 36e5).toISOString() },
  ];

  return { versi: 1, profil, peran, simpanan, barangMart, mutasi, barangSewa, booking, poin, fee, log, pengaturan: { rpPerPoin: 1000 } };
}

function hitungBiaya(item, ambil, kembali, unit) {
  const hari = Math.max(1, diffDays(ambil, kembali));
  const perUnit = hari === 1 ? item.harga24 : item.harga2 * hari;
  return perUnit * unit;
}

const STORE_KEY = 'kopmahub-demo-v2'; // v2: NIM diganti NIA
const Store = {
  load() {
    try { const raw = localStorage.getItem(STORE_KEY); if (raw) return JSON.parse(raw); } catch (e) { /* abaikan */ }
    return seed();
  },
  save(db) { try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); } catch (e) { /* abaikan */ } },
  reset() { try { localStorage.removeItem(STORE_KEY); } catch (e) { /* abaikan */ } return seed(); },
  getPref(k, d) { try { return localStorage.getItem('kopmahub-' + k) ?? d; } catch (e) { return d; } },
  setPref(k, v) { try { localStorage.setItem('kopmahub-' + k, v); } catch (e) { /* abaikan */ } },
};
