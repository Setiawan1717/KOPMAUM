/* Kopma Hub — sambungan ke database Supabase (project kopma-um, dipakai bersama web kasir).
   Semua hak akses dijaga di server (row level security + fungsi server), bukan di sini:
   - poin, gaji, saldo, total sewa, dan ketersediaan unit dihitung server;
   - jejak perubahan dicatat otomatis oleh database (trigger), Kopma Hub hanya menampilkannya.
   Bentuk objek Kasir sama dengan versi Firebase sebelumnya, supaya tampilan (app.js) tidak banyak berubah. */

const SUPABASE_URL = 'https://uggwjrbialdivyegydia.supabase.co';
const SUPABASE_KEY = 'sb_publishable_0vUFj-TLhkV-6VPs7wYZ0Q__QUn_u3G';   // kunci publik; akses tetap dijaga RLS
const SUPABASE_JS = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';

const KOSONG = () => ({
  on: false, status: 'off', error: '', email: '', akun: null,
  products: [], transactions: [], pengeluaran: [], kasirError: '',
  rpPerPoin: 1000, rumusInfo: null, rumusError: '', waBendahara: '', kontakError: '', GAJI_PERSEN: 1, MIN_TARIK: 10000,
  anggota: [], anggotaError: '', anggotaSaya: null, akunList: [], akunError: '', jejak: [], jejakError: '',
  _poin: [], _riwayat: {}, poinError: '',
  jadwal: [], jadwalError: '', penarikan: [], penarikanError: '', _gaji: { hari: [], total: 0, dibayar: 0, diajukan: 0, saldo: 0 }, gajiError: '',
  laporanBulan: '', trxLaporan: [], laporanError: '', laporanSiap: false,
  sewaBarang: [], sewaBooking: [], sewaError: '',
});

const Kasir = {
  ...KOSONG(),
  publik: { on: false, barang: [], jadwal: [], error: '' },
  onChange: () => {},
  _sb: null, _timer: null, _terakhirMuat: 0,

  /* ---------- hak akses (cermin dari aturan server, hanya untuk menampilkan/menyembunyikan menu) ---------- */
  _punya(...r) { return (this.akun?.hub || []).some((x) => r.includes(x)); },
  get aksesKasir() { return ['admin', 'kasir'].includes(this.akun?.role); },
  get _admin() { return this.akun?.role === 'admin'; },
  get kelolaAkun() { return this._admin || this._punya('ketua', 'sekretaris'); },
  get ketua() { return this._punya('ketua'); },            // tambah & hapus akun (dijaga juga di server)
  get bacaJejak() { return this._admin || this._punya('ketua', 'sekretaris', 'bendahara'); },
  get prosesGaji() { return this._admin || this._punya('ketua', 'bendahara'); },
  get aturJadwal() { return this._admin || this._punya('ketua', 'bidang_usaha'); },
  get bacaLaporan() { return this._admin || this._punya('ketua', 'sekretaris', 'bendahara', 'bidang_usaha'); },
  get bacaAkun() { return this._admin || this._punya('ketua', 'sekretaris', 'bendahara', 'bidang_usaha'); },
  get kelolaSewa() { return this.aksesKasir || this._punya('ketua', 'sekretaris', 'bendahara', 'bidang_usaha', 'petugas_jaga'); },
  get aturSewa() { return this._admin || this._punya('ketua', 'bidang_usaha'); },
  get bacaAnggota() { return this._admin || this._punya('ketua', 'sekretaris', 'bendahara'); },
  get bacaPoinSemua() { return this.aksesKasir || this._punya('ketua', 'sekretaris', 'bendahara', 'bidang_usaha'); },
  get dataSaya() { const n = this.akun?.nia; return n ? (this.anggota.find((a) => a.nia === n) || this.anggotaSaya) : null; },

  /* ---------- sambungan ---------- */
  async _load() {
    if (this._sb) return this._sb;
    const { createClient } = await import(SUPABASE_JS);
    this._sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, storageKey: 'kopmahub-auth', autoRefreshToken: true } });
    return this._sb;
  },
  // hasil Supabase: lempar kalau error, kembalikan data kalau berhasil
  _ok({ data, error }) { if (error) throw error; return data; },

  _pesan(e) {
    const m = String(e?.message || e || ''); const c = String(e?.code || '');
    if (/Invalid login credentials/i.test(m)) return 'Nama pengguna atau kata sandi salah.';
    if (/already registered|already been registered/i.test(m)) return 'Nama pengguna itu sudah dipakai. Pilih nama lain.';
    if (/Password should be at least/i.test(m)) return 'Kata sandi minimal 6 karakter.';
    if (/Signups not allowed/i.test(m)) return 'Pendaftaran akun sedang dimatikan di Supabase. Hubungi admin.';
    if (/Email not confirmed/i.test(m)) return 'Akun belum dikonfirmasi. Minta admin mematikan "Confirm email" di Supabase.';
    if (/rate limit|Too many/i.test(m)) return 'Terlalu banyak percobaan. Tunggu beberapa menit.';
    if (c === '42501' || /row-level security|permission denied/i.test(m)) return 'Akun ini tidak punya izin untuk itu. Cek peran akun.';
    if (c === '23505') return 'Data dengan kunci yang sama sudah ada.';
    if (c === '23514') return 'Isian tidak memenuhi syarat (cek angka, panjang teks, atau format).';
    if (c === 'P0001' || e?.kopma) return m;                      // pesan dari fungsi server, sudah berbahasa Indonesia
    if (/Failed to fetch|NetworkError|Load failed|fetch/i.test(m)) return 'Tidak bisa menghubungi server. Cek koneksi internet.';
    if (/import|dynamically imported/i.test(m)) return 'Library Supabase gagal dimuat. Buka Kopma Hub lewat internet (bukan pratinjau).';
    return 'Gagal: ' + (m || 'kesalahan tidak dikenal');
  },
  _galat(pesan) { const e = new Error(pesan); e.kopma = true; return e; },
  _set(patch) { Object.assign(this, patch); this.onChange(); },

  async _muatAkun(user) {
    const sb = await this._load();
    const d = this._ok(await sb.from('akun').select('id, username, role, hub, nama, nia').eq('id', user.id).maybeSingle());
    if (!d) throw this._galat('Akun ini belum terdaftar di Kopma Hub. Minta admin mendaftarkannya.');
    this.akun = { uid: d.id, username: d.username, role: d.role || 'anggota', hub: d.hub || [], nama: d.nama || '', nia: d.nia || '' };
    this.email = user.email;
  },

  async connect(email, pass) {
    this._set({ status: 'connecting', error: '' });
    if (!email.includes('@')) email = email.replace(/\s+/g, '').toLowerCase() + '@kopma.um';
    try {
      const sb = await this._load();
      const { user } = this._ok(await sb.auth.signInWithPassword({ email, password: pass }));
      await this._muatAkun(user);
      Store.setPref('kasir', 'on');
      this._mulai();
    } catch (e) {
      try { await this._sb?.auth.signOut(); } catch (x) { /* abaikan */ }
      this._set({ status: 'error', error: this._pesan(e) });
    }
  },

  // sambung ulang otomatis kalau sebelumnya sudah login di browser ini
  async resume() {
    if (Store.getPref('kasir', '') !== 'on') return;
    this._set({ status: 'connecting', error: '' });
    try {
      const sb = await this._load();
      const { session } = this._ok(await sb.auth.getSession());
      if (!session) { Store.setPref('kasir', ''); this._set({ status: 'off' }); return; }
      await this._muatAkun(session.user);
      this._mulai();
    } catch (e) { this._set({ status: 'error', error: this._pesan(e) }); }
  },

  async disconnect() {
    clearInterval(this._timer); this._timer = null;
    Store.setPref('kasir', '');
    try { await this._sb?.auth.signOut(); } catch (e) { /* abaikan */ }
    this._set({ ...KOSONG() });
  },

  // halaman langsung tampil begitu akun terbaca; data menyusul per bagian
  _mulai() {
    this._set({ on: true, status: 'on', error: '' });
    this.muatSemua();
    clearInterval(this._timer);
    this._timer = setInterval(() => { if (document.visibilityState === 'visible') this.muatSemua(); }, 60000);
    if (!this._fokusDipasang) {
      this._fokusDipasang = true;
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && this.on && Date.now() - this._terakhirMuat > 15000) this.muatSemua(); });
    }
  },

  // muat satu bagian; kesalahan bagian itu hanya ditampilkan di bagian itu
  async _bagian(errKey, fn) {
    try { await fn(); if (errKey) this[errKey] = ''; } catch (e) { if (errKey) this[errKey] = this._pesan(e); }
    this.onChange();
  },

  async muatSemua() {
    if (!this.akun) return;
    this._terakhirMuat = Date.now();
    const tugas = [this._muatPengaturan(), this._muatJadwal(), this._muatPenarikan(), this._muatGajiSaya(), this._muatPoin()];
    if (this.bacaAnggota) tugas.push(this._muatAnggota()); else if (this.akun.nia) tugas.push(this._muatAnggotaSaya());
    if (this.bacaAkun) tugas.push(this._muatAkunList());
    if (this.bacaJejak) tugas.push(this._muatJejak());
    if (this.aksesKasir) tugas.push(this._muatKasir());
    if (this.kelolaSewa) tugas.push(this._muatSewa());
    if (this.laporanBulan) tugas.push(this._muatLaporan(this.laporanBulan));
    await Promise.all(tugas);
  },

  /* ---------- pemuat data ---------- */
  _muatPengaturan() {
    return this._bagian('rumusError', async () => {
      const rows = this._ok(await this._sb.from('pengaturan').select('kunci, nilai, diubah, diubah_oleh'));
      const n = Object.fromEntries(rows.map((r) => [r.kunci, r]));
      const v = Number(n.rp_per_poin?.nilai); this.rpPerPoin = Number.isInteger(v) && v >= 1 ? v : 1000;
      this.rumusInfo = n.rp_per_poin?.diubah_oleh ? { oleh: n.rp_per_poin.diubah_oleh, waktu: n.rp_per_poin.diubah } : null;
      this.waBendahara = String(n.wa_bendahara?.nilai || '');
      this.GAJI_PERSEN = Number(n.gaji_persen?.nilai ?? 1);
      this.MIN_TARIK = Number(n.min_tarik?.nilai ?? 10000);
      this.kontakError = '';
    });
  },
  _muatAnggota() {
    return this._bagian('anggotaError', async () => {
      this.anggota = this._ok(await this._sb.from('anggota').select('*').order('nama'));
    });
  },
  _muatAnggotaSaya() {
    return this._bagian('anggotaError', async () => {
      this.anggotaSaya = this._ok(await this._sb.from('anggota').select('*').eq('nia', this.akun.nia).maybeSingle());
    });
  },
  _muatAkunList() {
    return this._bagian('akunError', async () => {
      const rows = this._ok(await this._sb.from('akun').select('id, username, role, hub, nama, nia').order('username'));
      this.akunList = rows.map((a) => ({ uid: a.id, username: a.username, role: a.role, hub: a.hub || [], nama: a.nama || '', nia: a.nia || '' }));
    });
  },
  _muatJejak() {
    return this._bagian('jejakError', async () => {
      const rows = this._ok(await this._sb.from('jejak').select('*').order('waktu', { ascending: false }).limit(300));
      this.jejak = rows.map((r) => ({ id: r.id, waktu: r.waktu, oleh: r.oleh_username, modul: this._modulJejak(r), aksi: this._kalimatJejak(r) }));
    });
  },
  _muatJadwal() {
    return this._bagian('jadwalError', async () => {
      const dari = ymd(new Date(Date.now() - 200 * 864e5));
      this.jadwal = this._ok(await this._sb.from('jadwal_jaga').select('tanggal, petugas, catatan').gte('tanggal', dari).order('tanggal'));
    });
  },
  _muatPenarikan() {
    return this._bagian('penarikanError', async () => {
      const rows = this._ok(await this._sb.from('penarikan_gaji').select('*').order('diajukan', { ascending: false }).limit(500));
      this.penarikan = rows.map((p) => ({ id: p.id, uid: p.akun_id, username: p.username, nominal: p.nominal, status: p.status, diajukan: p.diajukan, diproses: p.diproses || '', diprosesOleh: p.diproses_oleh || '', alasan: p.alasan || '' }));
    });
  },
  _muatGajiSaya() {
    return this._bagian('gajiError', async () => { this._gaji = await this.saldoOrang(this.akun.username); });
  },
  // poin: peringkat semua NIA untuk kasir/pengurus; selain itu hanya poin sendiri
  _muatPoin() {
    if (!this.bacaPoinSemua && !this.akun.nia) return Promise.resolve();
    return this._bagian('poinError', async () => {
      this._poin = this._ok(await this._sb.rpc('poin_anggota', this.bacaPoinSemua ? {} : { p_nia: this.akun.nia }));
      this._riwayat = {};
      if (this.akun.nia) await this._muatRiwayat(this.akun.nia);
    });
  },
  async _muatRiwayat(nia) {
    const rows = this._ok(await this._sb.rpc('riwayat_poin', { p_nia: nia, p_batas: 100 }));
    this._riwayat[nia] = rows.map((r) => ({ id: r.id, waktu: r.tanggal, total: r.total, poin: Number(r.poin), kasir: r.kasir, item: Number(r.jumlah_item) }));
  },
  _muatKasir() {
    return this._bagian('kasirError', async () => {
      const [p, t, k] = await Promise.all([
        this._sb.from('produk').select('*').order('nama'),
        this._sb.from('transaksi').select('id, tanggal, kasir, total, metode_bayar, transaksi_item(produk_id, nama, qty)').eq('batal', false).order('tanggal', { ascending: false }).limit(300),
        this._sb.from('pengeluaran').select('*').order('tanggal', { ascending: false }).limit(300),
      ]);
      this.products = this._ok(p).map((x) => ({ id: x.id, nama: x.nama, kategori: x.kategori, barcode: x.barcode, hargaModal: x.harga_modal, hargaJual: x.harga_jual, stok: x.stok, batasMinimum: x.batas_minimum ?? undefined, aktif: x.aktif }));
      this.transactions = this._ok(t).map((x) => ({ id: x.id, tanggal: x.tanggal, kasir: x.kasir, total: x.total, metodeBayar: x.metode_bayar, item: (x.transaksi_item || []).map((i) => ({ id: i.produk_id, nama: i.nama, qty: i.qty })) }));
      this.pengeluaran = this._ok(k).map((x) => ({ id: x.id, tanggal: x.tanggal, keterangan: x.keterangan, nominal: x.nominal, metode: x.metode, kasir: x.kasir }));
    });
  },
  _barangDariDb: (b) => ({ id: b.id, nama: b.nama, spek: b.spek, unit: b.unit, harga24: b.harga24, harga2: b.harga2, batasHari: b.batas_hari, warna: b.warna, aktif: b.aktif }),
  _bookingDariDb: (k) => ({ id: k.id, penyewa: k.penyewa, wa: k.wa, barangId: k.barang_id, unit: k.unit, ambil: k.ambil, kembali: k.kembali, status: k.status, total: k.total, dibayar: k.dibayar, jaminan: k.jaminan, dibuatOleh: k.dibuat_oleh }),
  _muatSewa() {
    return this._bagian('sewaError', async () => {
      const [b, k] = await Promise.all([
        this._sb.from('sewa_barang').select('*').order('nama'),
        this._sb.from('sewa_booking').select('*').order('ambil', { ascending: false }).limit(500),
      ]);
      this.sewaBarang = this._ok(b).map(this._barangDariDb);
      this.sewaBooking = this._ok(k).map(this._bookingDariDb);
    });
  },

  /* ---------- Poin ---------- */
  // Map NIA → { nia, poin, belanja, n, terakhir, riwayat[] } (angka dari server; rate diabaikan karena server memakai pengaturan)
  poinPer() {
    const map = new Map();
    this._poin.forEach((r) => {
      const ada = this._riwayat[r.nia];
      if (!ada && this.bacaPoinSemua && this._sb && !this._memuatRiwayat?.has(r.nia)) {
        (this._memuatRiwayat ??= new Set()).add(r.nia);       // riwayat NIA lain dimuat saat dibutuhkan (mis. Cek NIA)
        this._muatRiwayat(r.nia).catch(() => {}).finally(() => { this._memuatRiwayat.delete(r.nia); this.onChange(); });
      }
      map.set(r.nia, { nia: r.nia, poin: Number(r.poin), belanja: Number(r.belanja), n: Number(r.n), terakhir: r.terakhir, riwayat: ada || [] });
    });
    return map;
  },
  async simpanRumus(v) {
    await this._load();
    this._ok(await this._sb.from('pengaturan').update({ nilai: v }).eq('kunci', 'rp_per_poin').select('kunci').single());
    await Promise.all([this._muatPengaturan(), this._muatPoin(), this.bacaJejak ? this._muatJejak() : null]);
  },

  /* ---------- Gaji jaga ---------- */
  // ringkasan gaji seseorang dari server: per hari + saldo
  async saldoOrang(username) {
    const [h, s] = await Promise.all([this._sb.rpc('gaji_harian', { p_username: username }), this._sb.rpc('saldo_gaji', { p_username: username })]);
    const hari = this._ok(h).map((d) => ({ kasir: d.kasir, tanggal: d.tanggal, penjualan: Number(d.penjualan), n: Number(d.n), gaji: Number(d.gaji) }));
    const r = this._ok(s)[0] || {};
    return { hari, total: Number(r.total_gaji || 0), dibayar: Number(r.dibayar || 0), diajukan: Number(r.diajukan || 0), saldo: Number(r.saldo || 0), penjualan: hari.reduce((a, d) => a + d.penjualan, 0) };
  },
  get gajiSaya() { return this._gaji; },
  get trxGaji() { return this._gaji.hari; },
  // laporan sudah berupa ringkasan per petugas per hari dari server
  gajiHarian(rows) { return rows; },
  muatLaporan(bulan) {
    if (!this._sb || !this.bacaLaporan || this.laporanBulan === bulan) return;
    Object.assign(this, { laporanBulan: bulan, trxLaporan: [], laporanError: '', laporanSiap: false });
    this._muatLaporan(bulan);
  },
  _muatLaporan(bulan) {
    return this._bagian('laporanError', async () => {
      const [y, m] = bulan.split('-').map(Number);
      const akhir = ymd(new Date(y, m, 0));
      const rows = this._ok(await this._sb.rpc('gaji_harian', { p_username: null, p_dari: `${bulan}-01`, p_sampai: akhir }));
      if (this.laporanBulan !== bulan) return;
      this.trxLaporan = rows.map((d) => ({ kasir: d.kasir, tanggal: d.tanggal, penjualan: Number(d.penjualan), n: Number(d.n), gaji: Number(d.gaji) }));
    }).finally(() => { this.laporanSiap = true; this.onChange(); });
  },
  async simpanWaBendahara(wa) {
    this._ok(await this._sb.from('pengaturan').update({ nilai: wa }).eq('kunci', 'wa_bendahara').select('kunci').single());
    await Promise.all([this._muatPengaturan(), this.bacaJejak ? this._muatJejak() : null]);
  },
  async ajukanPenarikan(nominal) {
    const r = this._ok(await this._sb.rpc('ajukan_penarikan', { p_nominal: nominal }));
    await Promise.all([this._muatPenarikan(), this._muatGajiSaya()]);
    return r.id;
  },
  async prosesPenarikan(p, status, alasan = '') {
    this._ok(await this._sb.rpc('proses_penarikan', { p_id: p.id, p_status: status, p_alasan: alasan || null }));
    await Promise.all([this._muatPenarikan(), this._muatGajiSaya(), this.bacaJejak ? this._muatJejak() : null]);
  },
  async simpanJadwal(tanggal, petugas, catatan) {
    const lama = this.jadwal.find((j) => j.tanggal === tanggal);
    if (lama && JSON.stringify(lama.petugas || []) === JSON.stringify(petugas) && (lama.catatan || '') === catatan) return false;
    this._ok(await this._sb.from('jadwal_jaga').upsert({ tanggal, petugas, catatan }).select('tanggal').single());
    await Promise.all([this._muatJadwal(), this.bacaJejak ? this._muatJejak() : null]);
    return true;
  },

  /* ---------- Kopma Rental ---------- */
  // halaman publik tanpa login: inventaris aktif + jadwal tanpa data penyewa
  async mulaiPublik() {
    if (this._publikDimulai) return;
    this._publikDimulai = true;
    const muat = async () => {
      try {
        const sb = await this._load();
        const [b, j] = await Promise.all([sb.from('sewa_barang').select('*').eq('aktif', true).order('nama'), sb.rpc('jadwal_sewa_publik')]);
        Object.assign(this.publik, { on: true, error: '', barang: this._ok(b).map(this._barangDariDb), jadwal: this._ok(j).map((x, i) => ({ id: 'publik-' + i, barangId: x.barang_id, unit: x.unit, ambil: x.ambil, kembali: x.kembali, status: x.status })) });
      } catch (e) { Object.assign(this.publik, { on: true, error: this._pesan(e) }); }
      this.onChange();
    };
    await muat();
    setInterval(() => { if (document.visibilityState === 'visible' && location.hash === '#sewa') muat(); }, 60000);
  },
  _barangKeDb: (d) => ({ nama: d.nama, spek: d.spek || '', unit: d.unit, harga24: d.harga24, harga2: d.harga2, batas_hari: d.batasHari, warna: d.warna, aktif: d.aktif !== false }),
  async simpanBarangSewa(data, id) {
    if (id) {
      const lama = this.sewaBarang.find((b) => b.id === id);
      if (lama && Object.keys(data).every((k) => JSON.stringify(lama[k] ?? null) === JSON.stringify(data[k] ?? null))) return false;
      this._ok(await this._sb.from('sewa_barang').update(this._barangKeDb(data)).eq('id', id).select('id').single());
    } else {
      this._ok(await this._sb.from('sewa_barang').insert(this._barangKeDb(data)).select('id').single());
    }
    await Promise.all([this._muatSewa(), this.bacaJejak ? this._muatJejak() : null]);
    return true;
  },
  _bookingKeDb(d) {
    const m = { penyewa: 'penyewa', wa: 'wa', barangId: 'barang_id', unit: 'unit', ambil: 'ambil', kembali: 'kembali', status: 'status', dibayar: 'dibayar', jaminan: 'jaminan' };
    const o = {}; Object.keys(d).forEach((k) => { if (m[k]) o[m[k]] = d[k]; }); return o;   // total sengaja tidak dikirim: dihitung server
  },
  async buatBooking(data) {
    const r = this._ok(await this._sb.from('sewa_booking').insert(this._bookingKeDb(data)).select('id').single());
    await Promise.all([this._muatSewa(), this.bacaJejak ? this._muatJejak() : null]);
    return r.id;
  },
  async ubahBooking(bk, patch) {
    const ubah = {}; Object.keys(patch).forEach((k) => { if (JSON.stringify(bk[k] ?? null) !== JSON.stringify(patch[k] ?? null)) ubah[k] = patch[k]; });
    if (!Object.keys(ubah).length) return false;
    this._ok(await this._sb.from('sewa_booking').update(this._bookingKeDb(ubah)).eq('id', bk.id).select('id').single());
    await Promise.all([this._muatSewa(), this.bacaJejak ? this._muatJejak() : null]);
    return true;
  },

  /* ---------- Akun & anggota ---------- */
  // daftar akun baru dengan kode pendaftaran (kode, NIA, dan nama pengguna dicek di server)
  async daftar({ kode, nia, username, pass }) {
    this._set({ status: 'connecting', error: '' });
    const user = username.replace(/\s+/g, '').toLowerCase(); const email = user + '@kopma.um';
    try {
      const sb = await this._load();
      let r = await sb.auth.signUp({ email, password: pass });
      const sudahAda = r.error && /already registered|already been registered/i.test(r.error.message);
      if (r.error && !sudahAda) throw r.error;
      // Tanpa sesi: nama pengguna sudah ada (percobaan daftar sebelumnya terhenti) atau "Confirm email" masih aktif. Coba masuk.
      if (sudahAda || !r.data.session) {
        r = await sb.auth.signInWithPassword({ email, password: pass });
        if (r.error && /Email not confirmed/i.test(r.error.message)) throw this._galat('Akun dibuat tetapi belum bisa masuk: minta admin mematikan "Confirm email" di Supabase.');
        if (r.error) throw this._galat('Nama pengguna itu sudah dipakai. Pilih nama lain.');
      }
      const pesan = this._ok(await sb.rpc('daftar_akun', { p_kode: kode, p_nia: nia, p_username: user }));
      if (pesan) throw this._galat(pesan);
      await this._muatAkun(r.data.user);
      Store.setPref('kasir', 'on');
      this._mulai();
    } catch (e) {
      try { await this._sb?.auth.signOut(); } catch (x) { /* abaikan */ }
      this._set({ status: 'error', error: this._pesan(e) });
    }
  },
  // akun lama (tanpa NIA) menghubungkan NIA miliknya
  async hubungkanNia(nia) {
    this._ok(await this._sb.rpc('hubungkan_nia', { p_nia: nia }));
    this.akun.nia = nia;
    await this.muatSemua();
  },
  // ketua/sekretaris mengatur peran Kopma Hub akun lain (jejak dicatat server)
  async ubahPeran(uid, hub) {
    this._ok(await this._sb.from('akun').update({ hub }).eq('id', uid).select('id').single());
    await Promise.all([this._muatAkunList(), this.bacaJejak ? this._muatJejak() : null]);
  },
  // ketua menambah akun: login dibuat lewat klien terpisah (sesi ketua tidak berganti), lalu didaftarkan server
  async buatAkun({ username, pass, nia, role, hub }) {
    const user = username.replace(/\s+/g, '').toLowerCase(); const email = user + '@kopma.um';
    if (this.akunList.some((a) => a.username === user)) throw this._galat('Nama pengguna itu sudah dipakai. Pilih nama lain.');
    await this._load();
    const { createClient } = await import(SUPABASE_JS);
    const sb2 = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'kopmahub-buat-akun' } });
    try {
      let r = await sb2.auth.signUp({ email, password: pass });
      const sudahAda = r.error && /already registered|already been registered/i.test(r.error.message);
      if (r.error && !sudahAda) throw r.error;
      // login sudah ada tanpa baris akun (percobaan sebelumnya terhenti): pakai lagi kalau kata sandinya sama
      if (sudahAda || !r.data.user?.id || (r.data.user.identities && !r.data.user.identities.length)) {
        r = await sb2.auth.signInWithPassword({ email, password: pass });
        if (r.error && /Email not confirmed/i.test(r.error.message)) throw this._galat('Login dibuat tetapi belum aktif: matikan "Confirm email" di Supabase.');
        if (r.error) throw this._galat('Nama pengguna itu sudah dipakai. Pilih nama lain.');
      }
      this._ok(await this._sb.rpc('ketua_daftarkan_akun', { p_uid: r.data.user.id, p_username: user, p_nia: nia || null, p_role: role, p_hub: hub }));
    } finally {
      try { await sb2.auth.signOut(); } catch (x) { /* abaikan */ }
    }
    await Promise.all([this._muatAkunList(), this.bacaJejak ? this._muatJejak() : null]);
  },
  // ketua menghapus akun (login ikut terhapus; riwayat transaksi & gaji tetap ada)
  async hapusAkun(uid) {
    this._ok(await this._sb.rpc('ketua_hapus_akun', { p_uid: uid }));
    await Promise.all([this._muatAkunList(), this.bacaJejak ? this._muatJejak() : null]);
  },
  // tambah / ubah data anggota. Mengembalikan false kalau tidak ada yang berubah.
  async simpanAnggota(data, baru) {
    const kosong = (x) => (x === '' || x === undefined ? null : x);
    if (baru) {
      const r = await this._sb.from('anggota').insert({ ...data, aktif: true }).select('nia').single();
      if (r.error?.code === '23505') {
        const ada = this.anggota.find((a) => a.nia === data.nia);
        throw this._galat(`NIA ${data.nia} sudah terdaftar${ada ? ' atas nama ' + ada.nama : ''}.`);
      }
      this._ok(r);
    } else {
      const lama = this.anggota.find((a) => a.nia === data.nia) || this.anggotaSaya || {};
      const { nia, ...isi } = data;
      const ubah = {}; Object.keys(isi).forEach((k) => { if (JSON.stringify(kosong(lama[k])) !== JSON.stringify(kosong(isi[k]))) ubah[k] = kosong(isi[k]); });
      if (!Object.keys(ubah).length) return false;
      this._ok(await this._sb.from('anggota').update(ubah).eq('nia', nia).select('nia').single());
    }
    await Promise.all([this.bacaAnggota ? this._muatAnggota() : this._muatAnggotaSaya(), this.bacaJejak ? this._muatJejak() : null]);
    return true;
  },

  // cadangan lengkap data kasir (baca saja) sebagai JSON
  async backup() {
    const out = { dibuat: new Date().toISOString(), sumber: 'Supabase kopma-um', tabel: {} };
    for (const t of ['produk', 'transaksi', 'transaksi_item', 'pengeluaran', 'modal_harian']) {
      const semua = []; let dari = 0;
      for (;;) {           // per 1000 baris (batas bawaan Supabase)
        const rows = this._ok(await this._sb.from(t).select('*').range(dari, dari + 999));
        semua.push(...rows); if (rows.length < 1000) break; dari += 1000;
      }
      out.tabel[t] = semua;
    }
    return out;
  },

  /* ---------- Jejak: menyusun kalimat dari catatan server ---------- */
  _LABEL: { nama: 'nama', fakultas: 'fakultas', prodi: 'prodi', angkatan: 'angkatan', wa: 'WA', status: 'status', bidang: 'bidang', aktif: 'status aktif',
    hub: 'peran', role: 'role kasir', nia: 'NIA', username: 'nama pengguna', petugas: 'petugas', catatan: 'catatan', nominal: 'nominal', alasan: 'alasan',
    diproses_oleh: 'diproses oleh', penyewa: 'penyewa', unit: 'unit', ambil: 'tanggal ambil', kembali: 'tanggal kembali', total: 'total', dibayar: 'dibayar',
    jaminan: 'jaminan', barang_id: 'barang', spek: 'spesifikasi', harga24: 'harga 24 jam', harga2: 'harga harian', batas_hari: 'batas hari', warna: 'warna',
    harga_jual: 'harga jual', harga_modal: 'harga modal', stok: 'stok', kategori: 'kategori', barcode: 'barcode', batas_minimum: 'batas minimum',
    keterangan: 'keterangan', metode: 'metode', modal_cash: 'modal tunai', modal_qris: 'modal QRIS' },
  _UANG: ['nominal', 'total', 'dibayar', 'harga24', 'harga2', 'harga_jual', 'harga_modal', 'modal_cash', 'modal_qris'],
  _nilai(k, v) {
    if (v === null || v === undefined || v === '') return k === 'hub' ? 'tanpa peran' : '—';
    if (k === 'hub' && Array.isArray(v)) return v.length ? v.map((r) => (typeof ROLES !== 'undefined' && ROLES[r]?.label) || r).join(', ') : 'tanpa peran';
    if (k === 'aktif') return v ? 'aktif' : 'nonaktif';
    if (this._UANG.includes(k)) return this._rp(v);
    if (k === 'barang_id') return (this.sewaBarang.find((b) => b.id === v) || {}).nama || 'barang lain';
    if (typeof v === 'boolean') return v ? 'ya' : 'tidak';
    if (Array.isArray(v)) return v.length ? v.join(', ') : '—';
    return String(v).slice(0, 60);
  },
  _rp: (n) => 'Rp' + Number(n || 0).toLocaleString('id-ID'),
  _beda(perubahan, kecuali = []) {
    return Object.entries(perubahan || {}).filter(([k]) => !kecuali.includes(k)).map(([k, [a, b]]) => `${this._LABEL[k] || k}: ${this._nilai(k, a)} → ${this._nilai(k, b)}`).join('; ');
  },
  _modulJejak(r) {
    if (r.tabel === 'pengaturan') return r.kunci === 'rp_per_poin' ? 'poin' : 'gaji';
    if (['produk', 'pengeluaran', 'modal_harian', 'transaksi'].includes(r.tabel)) return 'kasir';
    return r.modul;
  },
  _kalimatJejak(r) {
    const p = r.perubahan || {}; const baru = (k) => p[k]?.[1]; const judul = r.ringkasan || r.kunci;
    const tgl = (t) => { try { const d = parseYmd(String(t).slice(0, 10)); return `${d.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][d.getMonth()]}`; } catch (e) { return t; } };
    switch (r.tabel) {
      case 'anggota': return r.aksi === 'tambah' ? `Anggota baru ${judul} (${r.kunci})` : `Ubah data ${judul} (${r.kunci}): ${this._beda(p)}`;
      case 'akun': if (r.aksi === 'tambah') return `Akun baru ${r.kunci} dibuat ketua (${this._nilai('hub', baru('hub'))})`;
        if (r.aksi === 'hapus') return `Hapus akun ${r.kunci}${judul !== r.kunci ? ' (' + judul + ')' : ''}`;
        return Object.keys(p).length === 1 && p.hub ? `Ubah peran ${judul}: ${this._nilai('hub', p.hub[0])} → ${this._nilai('hub', p.hub[1])}` : `Ubah akun ${judul}: ${this._beda(p)}`;
      case 'pengaturan': {
        const [a, b] = p.nilai || [];
        if (r.kunci === 'rp_per_poin') return `Rumus poin ${this._rp(a)} → ${this._rp(b)} per poin`;
        if (r.kunci === 'wa_bendahara') return `Nomor WA bendahara: ${a || '—'} → ${b || '—'}`;
        if (r.kunci === 'gaji_persen') return `Persen gaji jaga: ${a}% → ${b}%`;
        return `Pengaturan ${r.kunci}: ${a} → ${b}`;
      }
      case 'jadwal_jaga': return r.aksi === 'tambah' ? `Jadwal jaga ${tgl(r.kunci)}: ${this._nilai('petugas', baru('petugas'))}${baru('catatan') ? ' (' + baru('catatan') + ')' : ''}` : `Ubah jadwal jaga ${tgl(r.kunci)}: ${this._beda(p)}`;
      case 'penarikan_gaji': return r.aksi === 'tambah' ? `${judul} mengajukan penarikan gaji ${this._rp(baru('nominal'))}`
        : `Penarikan gaji ${judul}: ${this._beda(p, ['diproses_oleh'])}`;
      case 'sewa_barang': return r.aksi === 'tambah' ? `Barang sewa baru: ${judul} (${baru('unit')} unit, ${this._rp(baru('harga24'))}/24 jam)` : `Ubah barang sewa ${judul}: ${this._beda(p)}`;
      case 'sewa_booking': return r.aksi === 'tambah'
        ? `Booking baru: ${judul}, ${this._nilai('barang_id', baru('barang_id'))} ×${baru('unit')}, ${tgl(baru('ambil'))} → ${tgl(baru('kembali'))} (${this._rp(baru('total'))}${baru('dibayar') ? ', dibayar ' + this._rp(baru('dibayar')) : ''})`
        : `Booking ${judul}: ${this._beda(p)}`;
      case 'produk': return r.aksi === 'tambah' ? `Produk baru: ${judul}` : r.aksi === 'hapus' ? `Hapus produk ${judul}` : `Ubah produk ${judul}: ${this._beda(p)}`;
      case 'pengeluaran': return `${r.aksi === 'hapus' ? 'Hapus pengeluaran' : 'Pengeluaran'}: ${judul} (${this._rp(r.aksi === 'hapus' ? p.nominal?.[0] : baru('nominal'))})`;
      case 'modal_harian': return `Modal harian ${tgl(r.kunci)}: ${this._beda(p)}`;
      case 'transaksi': return `Batalkan transaksi ${judul}`;
      default: return `${r.aksi} ${r.tabel} ${judul}: ${this._beda(p)}`;
    }
  },

  /* ---------- bentuk data untuk modul Stok ---------- */
  minKey: (id) => 'min-' + id,
  barang() {
    return this.products.filter((p) => p.aktif !== false).map((p) => ({
      id: p.id, nama: p.nama || '(tanpa nama)', kategori: p.kategori || 'Lainnya', barcode: p.barcode || '',
      hargaBeli: Number(p.hargaModal) || 0, hargaJual: Number(p.hargaJual) || 0, stok: Number(p.stok) || 0,
      // batas minimum dari kasir diutamakan; kalau kosong pakai pengaturan Kopma Hub, default 5
      min: Number.isFinite(p.batasMinimum) ? p.batasMinimum : (Number(Store.getPref(this.minKey(p.id), '5')) || 0),
      minDariKasir: Number.isFinite(p.batasMinimum),
    })).sort((a, b) => a.nama.localeCompare(b.nama));
  },
  riwayat() {
    const rows = [];
    this.transactions.forEach((t) => (t.item || []).forEach((it, i) => rows.push({ id: t.id + ':' + i, nama: it.nama, jenis: 'keluar', jumlah: Number(it.qty) || 0, alasan: `Terjual · ${t.metodeBayar || ''}`.trim(), oleh: t.kasir || 'kasir', waktu: t.tanggal })));
    this.pengeluaran.forEach((p) => {
      const m = /^Stok Masuk: (.+) \(x(\d+)\)$/.exec(p.keterangan || '');
      if (m) rows.push({ id: p.id, nama: m[1], jenis: 'masuk', jumlah: Number(m[2]), alasan: `Belanja stok · ${p.metode || ''}`.trim(), oleh: p.kasir || 'kasir', waktu: p.tanggal });
    });
    return rows.filter((r) => r.waktu).sort((a, b) => String(b.waktu).localeCompare(String(a.waktu)));
  },
  penjualanHari(ymdStr) {
    const list = this.transactions.filter((t) => t.tanggal && ymd(new Date(t.tanggal)) === ymdStr);
    return { n: list.length, total: list.reduce((a, t) => a + (Number(t.total) || 0), 0) };
  },
};
