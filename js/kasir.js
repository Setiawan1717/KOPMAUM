/* Kopma Hub — sambungan ke Firebase project kopma-um (dipakai bersama web kasir).
   - Data kasir (products, transactions, pengeluaran, modal_harian): BACA SAJA.
   - Yang ditulis: data anggota (ketua/sekretaris, atau pemilik NIA untuk datanya sendiri), peran Kopma Hub
     (ketua/sekretaris), rumus poin (ketua/bendahara, dokumen pengaturan/poin), dan pendaftaran akun dengan kode.
   - Setiap tulisan di atas disertai satu catatan di koleksi jejak dalam batch yang sama (diwajibkan aturan Firestore). Semua dibatasi aturan Firestore.
   Aturan Firestore (firebase/firestore.rules) menolak tulisan lain apa pun yang dikirim dari sini. */

const KASIR_FIREBASE_CONFIG = {
    apiKey: "AIzaSyBINmUacCCgyXsQOn898lKWPTkygCO92xA",
    authDomain: "kopma-um.firebaseapp.com",
    projectId: "kopma-um",
    storageBucket: "kopma-um.firebasestorage.app",
    messagingSenderId: "985041442661",
    appId: "1:985041442661:web:4fcd6030b3880088eb338c"
};

const FB_VER = '10.4.0'; // sama dengan versi di web kasir
const FB = (m) => `https://www.gstatic.com/firebasejs/${FB_VER}/firebase-${m}.js`;

const Kasir = {
  on: false,            // tersambung dan data sudah masuk
  status: 'off',        // off | connecting | on | error
  error: '',
  email: '',
  products: [], transactions: [], pengeluaran: [], trxAnggota: [], poinError: '',
  rpPerPoin: 1000, rumusInfo: null, rumusError: '',   // rumus poin bersama dari pengaturan/poin (default Rp1.000)
  akun: null,           // dokumen users milik akun yang login: { uid, username, role, hub[], nama, nia }
  anggota: [], anggotaError: '', anggotaSaya: null, akunList: [], akunError: '', jejak: [], jejakError: '',
  // gaji jaga: 1% penjualan akun sendiri per hari, ditabung; penarikan minimal Rp10.000
  jadwal: [], jadwalError: '', penarikan: [], penarikanError: '', trxGaji: [], gajiError: '',
  laporanBulan: '', trxLaporan: [], laporanError: '', laporanSiap: false, _unsubLaporan: null,
  // Kopma Rental: inventaris, booking lengkap (pengelola), salinan publik (tanpa login)
  waBendahara: '', kontakError: '',
  sewaBarang: [], sewaBooking: [], sewaError: '', publik: { on: false, barang: [], jadwal: [], error: '' }, _unsubPublik: [],
  get aksesKasir() { return ['admin', 'kasir'].includes(this.akun?.role); },
  get kelolaAkun() { return this.akun?.role === 'admin' || (this.akun?.hub || []).some((r) => ['ketua', 'sekretaris'].includes(r)); },
  get bacaJejak() { return this.akun?.role === 'admin' || (this.akun?.hub || []).some((r) => ['ketua', 'sekretaris', 'bendahara'].includes(r)); },
  get prosesGaji() { return this.akun?.role === 'admin' || (this.akun?.hub || []).some((r) => ['ketua', 'bendahara'].includes(r)); },
  get aturJadwal() { return this.akun?.role === 'admin' || (this.akun?.hub || []).some((r) => ['ketua', 'bidang_usaha'].includes(r)); },
  get bacaLaporan() { return this.akun?.role === 'admin' || (this.akun?.hub || []).some((r) => ['ketua', 'sekretaris', 'bendahara', 'bidang_usaha'].includes(r)); },
  get bacaAkun() { return this.akun?.role === 'admin' || (this.akun?.hub || []).some((r) => ['ketua', 'sekretaris', 'bendahara', 'bidang_usaha'].includes(r)); },
  get kelolaSewa() { return ['admin', 'kasir'].includes(this.akun?.role) || (this.akun?.hub || []).some((r) => ['ketua', 'sekretaris', 'bendahara', 'bidang_usaha', 'petugas_jaga'].includes(r)); },
  get aturSewa() { return this.akun?.role === 'admin' || (this.akun?.hub || []).some((r) => ['ketua', 'bidang_usaha'].includes(r)); },
  get bacaAnggota() { return this.akun?.role === 'admin' || (this.akun?.hub || []).some((r) => ['ketua', 'sekretaris', 'bendahara'].includes(r)); },
  onChange: () => {},
  _fb: null, _unsubs: [],

  async _load() {
    if (this._fb) return this._fb;
    const [app, auth, fs] = await Promise.all([import(FB('app')), import(FB('auth')), import(FB('firestore'))]);
    const a = app.initializeApp(KASIR_FIREBASE_CONFIG, 'kopmahub-baca');
    this._fb = { auth, fs, authInst: auth.getAuth(a), db: fs.getFirestore(a) };
    return this._fb;
  },

  _pesan(e) {
    const c = e?.code || '';
    if (c.includes('invalid-credential') || c.includes('wrong-password') || c.includes('user-not-found') || c.includes('invalid-email')) return 'Nama pengguna atau kata sandi salah.';
    if (c.includes('permission-denied')) return 'Akun ini tidak punya izin untuk data tersebut. Cek peran akun di Firebase.';
    if (c === 'akun-belum-terdaftar') return 'Akun ini belum terdaftar di koleksi users Firebase. Minta admin mendaftarkannya.';
    if (c === 'nia-sudah-ada' || c === 'pesan') return e.message;
    if (c.includes('email-already-in-use')) return 'Nama pengguna itu sudah dipakai. Pilih nama lain.';
    if (c.includes('weak-password')) return 'Kata sandi minimal 6 karakter.';
    if (c.includes('admin-restricted-operation') || c.includes('operation-not-allowed')) return 'Pendaftaran akun sedang dimatikan di Firebase. Hubungi admin.';
    if (c.includes('too-many-requests')) return 'Terlalu banyak percobaan masuk. Tunggu beberapa menit.';
    if (c.includes('network') || c.includes('unavailable')) return 'Tidak bisa menghubungi Firebase. Cek koneksi internet.';
    if (!c && e?.message?.includes('import')) return 'Library Firebase gagal dimuat. Buka Kopma Hub lewat internet (bukan pratinjau).';
    return 'Gagal tersambung: ' + (c || e?.message || 'kesalahan tidak dikenal');
  },

  _set(patch) { Object.assign(this, patch); this.onChange(); },

  _listen() {
    const { fs, db } = this._fb;
    this._stop();
    const nia = this.akun?.nia || '';
    const poinSendiri = !this.aksesKasir && !!nia;
    const perlu = 1 + (this.aksesKasir ? 4 : 0) + (this.bacaAnggota ? 1 : 0) + (nia && !this.bacaAnggota ? 1 : 0) + (poinSendiri ? 1 : 0) + (this.bacaAkun ? 1 : 0) + (this.bacaJejak ? 1 : 0) + 2 + (this.akun?.username ? 1 : 0) + (this.kelolaSewa ? 2 : 0) + 1;
    let siap = 0;
    const done = () => { siap++; if (siap >= perlu) this._set({ on: true, status: 'on' }); else this.onChange(); };
    const fail = (e) => { this._stop(); this._set({ on: false, status: 'error', error: this._pesan(e) }); };
    const once = (fn) => { let first = true; return (snap) => { fn(snap); if (first) { first = false; done(); } else this.onChange(); }; };
    // pendengar yang gagal sendiri tidak memutus sambungan (cukup tampilkan pesan)
    const lunak = (fn, errKey) => { let first = true; return [(snap) => { fn(snap); this[errKey] = ''; if (first) { first = false; done(); } else this.onChange(); }, (e) => { this[errKey] = this._pesan(e); if (first) { first = false; done(); } else this.onChange(); }]; };
    // rumus poin dibaca semua akun terdaftar; kalau dokumen belum ada / aturan belum dipublish, pakai Rp1.000
    this._unsubs.push(fs.onSnapshot(fs.doc(db, 'pengaturan', 'poin'), ...lunak((d) => {
      const x = d.exists() ? d.data({ serverTimestamps: 'estimate' }) : {};
      const v = Number(x.rpPerPoin);
      this.rpPerPoin = Number.isInteger(v) && v >= 1 ? v : 1000;
      this.rumusInfo = d.exists() ? { oleh: x.diubahOleh || '', waktu: x.diubah?.toDate ? x.diubah.toDate().toISOString() : '' } : null;
    }, 'rumusError')));
    if (this.aksesKasir) {
      this._unsubs.push(
        fs.onSnapshot(fs.collection(db, 'products'), once((s) => { this.products = s.docs.map((d) => ({ id: d.id, ...d.data() })); }), fail),
        fs.onSnapshot(fs.query(fs.collection(db, 'transactions'), fs.orderBy('tanggal', 'desc'), fs.limit(300)), once((s) => { this.transactions = s.docs.map((d) => ({ id: d.id, ...d.data() })); }), fail),
        fs.onSnapshot(fs.query(fs.collection(db, 'pengeluaran'), fs.orderBy('tanggal', 'desc'), fs.limit(300)), once((s) => { this.pengeluaran = s.docs.map((d) => ({ id: d.id, ...d.data() })); }), fail),
        // semua transaksi yang diisi NIA anggota (untuk poin) — tidak dibatasi 300 terakhir
        fs.onSnapshot(fs.query(fs.collection(db, 'transactions'), fs.where('niaAnggota', '!=', null)), ...lunak((s) => { this.trxAnggota = s.docs.map((d) => ({ id: d.id, ...d.data() })); }, 'poinError')),
      );
    }
    if (this.bacaAnggota) {
      this._unsubs.push(fs.onSnapshot(fs.collection(db, 'anggota'), ...lunak((s) => {
        this.anggota = s.docs.map((d) => ({ ...d.data(), nia: d.id })).sort((a, b) => String(a.nama).localeCompare(String(b.nama)));
      }, 'anggotaError')));
    }
    if (nia && !this.bacaAnggota) {   // anggota biasa hanya bisa membaca datanya sendiri
      this._unsubs.push(fs.onSnapshot(fs.doc(db, 'anggota', nia), ...lunak((d) => { this.anggotaSaya = d.exists() ? { ...d.data(), nia: d.id } : null; }, 'anggotaError')));
    }
    if (poinSendiri) {                // poin sendiri: hanya transaksi dengan NIA miliknya
      this._unsubs.push(fs.onSnapshot(fs.query(fs.collection(db, 'transactions'), fs.where('niaAnggota', '==', nia)), ...lunak((s) => { this.trxAnggota = s.docs.map((d) => ({ id: d.id, ...d.data() })); }, 'poinError')));
    }
    if (this.bacaJejak) {
      this._unsubs.push(fs.onSnapshot(fs.query(fs.collection(db, 'jejak'), fs.orderBy('waktu', 'desc'), fs.limit(300)), ...lunak((s) => {
        this.jejak = s.docs.map((d) => { const x = d.data({ serverTimestamps: 'estimate' }); return { ...x, id: d.id, waktu: x.waktu?.toDate ? x.waktu.toDate().toISOString() : '' }; });
      }, 'jejakError')));
    }
    // nomor WA bendahara (untuk pengajuan tarik gaji)
    this._unsubs.push(fs.onSnapshot(fs.doc(db, 'pengaturan', 'kontak'), ...lunak((d) => { this.waBendahara = d.exists() ? String(d.data().waBendahara || '') : ''; }, 'kontakError')));
    // jadwal jaga: semua akun terdaftar
    this._unsubs.push(fs.onSnapshot(fs.collection(db, 'jadwal_jaga'), ...lunak((s) => {
      this.jadwal = s.docs.map((d) => ({ ...d.data(), tanggal: d.id })).sort((a, b) => a.tanggal.localeCompare(b.tanggal));
    }, 'jadwalError')));
    // penarikan gaji: ketua/bendahara/admin melihat semua, selain itu hanya miliknya
    const qTarik = this.prosesGaji ? fs.query(fs.collection(db, 'penarikan_gaji'), fs.orderBy('diajukan', 'desc'), fs.limit(500))
      : fs.query(fs.collection(db, 'penarikan_gaji'), fs.where('uid', '==', this.akun.uid));
    this._unsubs.push(fs.onSnapshot(qTarik, ...lunak((s) => {
      this.penarikan = s.docs.map((d) => { const x = d.data({ serverTimestamps: 'estimate' }); const iso = (v) => (v?.toDate ? v.toDate().toISOString() : ''); return { ...x, id: d.id, diajukan: iso(x.diajukan), diproses: iso(x.diproses) }; })
        .sort((a, b) => String(b.diajukan).localeCompare(String(a.diajukan)));
    }, 'penarikanError')));
    // transaksi yang dilayani akun ini sendiri (dasar gaji)
    if (this.akun?.username) {
      this._unsubs.push(fs.onSnapshot(fs.query(fs.collection(db, 'transactions'), fs.where('kasir', '==', this.akun.username)), ...lunak((s) => {
        this.trxGaji = s.docs.map((d) => ({ id: d.id, tanggal: d.data().tanggal, total: d.data().total, kasir: d.data().kasir }));
      }, 'gajiError')));
    }
    if (this.kelolaSewa) {
      this._unsubs.push(fs.onSnapshot(fs.collection(db, 'sewa_barang'), ...lunak((s) => {
        this.sewaBarang = s.docs.map((d) => ({ ...d.data(), id: d.id })).sort((a, b) => String(a.nama).localeCompare(String(b.nama)));
      }, 'sewaError')));
      this._unsubs.push(fs.onSnapshot(fs.query(fs.collection(db, 'sewa_booking'), fs.orderBy('ambil', 'desc'), fs.limit(500)), ...lunak((s) => {
        this.sewaBooking = s.docs.map((d) => ({ ...d.data(), id: d.id }));
      }, 'sewaError')));
    }
    if (this.bacaAkun) {
      this._unsubs.push(fs.onSnapshot(fs.collection(db, 'users'), ...lunak((s) => {
        this.akunList = s.docs.map((d) => { const x = d.data(); return { uid: d.id, ...x, hub: this._hub(x.hub) }; }).sort((a, b) => String(a.username).localeCompare(String(b.username)));
      }, 'akunError')));
    }
  },
  get dataSaya() { const n = this.akun?.nia; return n ? (this.anggota.find((a) => a.nia === n) || this.anggotaSaya) : null; },
  async _muatAkun(user) {
    const { fs, db } = this._fb;
    const snap = await fs.getDoc(fs.doc(db, 'users', user.uid));
    if (!snap.exists()) { const e = new Error('akun'); e.code = 'akun-belum-terdaftar'; throw e; }
    const d = snap.data();
    this.akun = { uid: user.uid, username: d.username || user.email.split('@')[0], role: d.role || '', hub: this._hub(d.hub), nama: d.nama || '', nia: d.nia ? String(d.nia).replace(/\s+/g, '').toUpperCase() : '' };
  },
  // peran hub boleh tersimpan sebagai daftar atau teks biasa (diketik di Console)
  _hub: (h) => (Array.isArray(h) ? h : typeof h === 'string' && h.trim() ? [h] : []).map((r) => String(r).trim().toLowerCase()),
  _stop() { this._stopLaporan(); this._unsubs.forEach((u) => { try { u(); } catch (e) { /* abaikan */ } }); this._unsubs = []; },

  async connect(email, pass) {
    this._set({ status: 'connecting', error: '' });
    // web kasir login dengan nama pengguna, disimpan di Firebase sebagai <nama>@kopma.um
    if (!email.includes('@')) email = email.replace(/\s+/g, '').toLowerCase() + '@kopma.um';
    try {
      const fb = await this._load();
      const cred = await fb.auth.signInWithEmailAndPassword(fb.authInst, email, pass);
      this.email = cred.user.email;
      await this._muatAkun(cred.user);
      Store.setPref('kasir', 'on');
      this._listen();
    } catch (e) {
      if (e?.code === 'akun-belum-terdaftar') { try { await this._fb.auth.signOut(this._fb.authInst); } catch (x) { /* abaikan */ } }
      this._set({ status: 'error', error: this._pesan(e) });
    }
  },

  // sambung ulang otomatis kalau sebelumnya sudah login di browser ini
  async resume() {
    if (Store.getPref('kasir', '') !== 'on') return;
    this._set({ status: 'connecting', error: '' });
    try {
      const fb = await this._load();
      const user = await new Promise((res) => { const u = fb.auth.onAuthStateChanged(fb.authInst, (x) => { u(); res(x); }); });
      if (!user) { Store.setPref('kasir', ''); this._set({ status: 'off' }); return; }
      this.email = user.email;
      await this._muatAkun(user);
      this._listen();
    } catch (e) { this._set({ status: 'error', error: this._pesan(e) }); }
  },

  async disconnect() {
    this._stop();
    Store.setPref('kasir', '');
    try { if (this._fb) await this._fb.auth.signOut(this._fb.authInst); } catch (e) { /* abaikan */ }
    this._set({ on: false, status: 'off', products: [], transactions: [], pengeluaran: [], trxAnggota: [], poinError: '', rpPerPoin: 1000, rumusInfo: null, rumusError: '', email: '', akun: null, anggota: [], anggotaError: '', anggotaSaya: null, akunList: [], akunError: '', jejak: [], jejakError: '', waBendahara: '', kontakError: '', sewaBarang: [], sewaBooking: [], sewaError: '', jadwal: [], jadwalError: '', penarikan: [], penarikanError: '', trxGaji: [], gajiError: '', laporanBulan: '', trxLaporan: [], laporanError: '', laporanSiap: false });
  },

  // catatan jejak untuk satu perubahan; ditulis di batch/transaksi yang sama dengan perubahannya.
  // Mengembalikan id catatan, yang harus disimpan sebagai field jejakId di dokumen target.
  _jejak(w, { target, modul, aksi, kolom = [] }, username) {
    const { fs, db } = this._fb;
    const ref = fs.doc(fs.collection(db, 'jejak'));
    w.set(ref, { modul, aksi: String(aksi).slice(0, 300), target, kolom, oleh: username ?? (this.akun?.username || ''), uid: this._fb.authInst.currentUser.uid, waktu: fs.serverTimestamp() });
    return ref.id;
  },

  /* ---- Gaji jaga ---- */
  GAJI_PERSEN: 1, MIN_TARIK: 10000,
  // per hari (waktu lokal): penjualan dan gaji = 1% dibulatkan ke bawah
  gajiHarian(trx) {
    const map = new Map();
    trx.forEach((t) => {
      if (!t.tanggal) return; const tgl = ymd(new Date(t.tanggal)); const k = `${t.kasir || ''}|${tgl}`;
      const d = map.get(k) || { kasir: t.kasir || '', tanggal: tgl, penjualan: 0, n: 0, gaji: 0 };
      d.penjualan += Number(t.total) || 0; d.n++; map.set(k, d);
    });
    map.forEach((d) => { d.gaji = Math.floor(d.penjualan * this.GAJI_PERSEN / 100); });
    return [...map.values()].sort((a, b) => b.tanggal.localeCompare(a.tanggal) || a.kasir.localeCompare(b.kasir));
  },
  ringkasGaji(trx, username) {
    const hari = this.gajiHarian(trx.filter((t) => t.kasir === username));
    const total = hari.reduce((a, d) => a + d.gaji, 0);
    const milik = this.penarikan.filter((p) => p.username === username);
    const dibayar = milik.filter((p) => p.status === 'dibayar').reduce((a, p) => a + (Number(p.nominal) || 0), 0);
    const diajukan = milik.filter((p) => p.status === 'diajukan').reduce((a, p) => a + (Number(p.nominal) || 0), 0);
    return { hari, total, dibayar, diajukan, saldo: total - dibayar - diajukan, penjualan: hari.reduce((a, d) => a + d.penjualan, 0) };
  },
  get gajiSaya() { return this.ringkasGaji(this.trxGaji, this.akun?.username || ''); },
  // laporan satu bulan (YYYY-MM) untuk pengurus: dengarkan transaksi bulan itu saja
  _stopLaporan() { if (this._unsubLaporan) { try { this._unsubLaporan(); } catch (e) { /* abaikan */ } } this._unsubLaporan = null; },
  muatLaporan(bulan) {
    if (!this._fb || !this.bacaLaporan || this.laporanBulan === bulan) return;
    const { fs, db } = this._fb; this._stopLaporan();
    const [y, m] = bulan.split('-').map(Number);
    const awal = new Date(y, m - 1, 1).toISOString(), akhir = new Date(y, m, 1).toISOString();
    Object.assign(this, { laporanBulan: bulan, trxLaporan: [], laporanError: '', laporanSiap: false });
    this._unsubLaporan = fs.onSnapshot(fs.query(fs.collection(db, 'transactions'), fs.where('tanggal', '>=', awal), fs.where('tanggal', '<', akhir)),
      (s) => { this.trxLaporan = s.docs.map((d) => ({ id: d.id, tanggal: d.data().tanggal, total: d.data().total, kasir: d.data().kasir })); this.laporanSiap = true; this.laporanError = ''; this.onChange(); },
      (e) => { this.laporanError = this._pesan(e); this.laporanSiap = true; this.onChange(); });
  },
  // seluruh transaksi seseorang (untuk mengecek saldo sebelum membayar penarikan)
  async trxMilik(username) {
    const { fs, db } = await this._load();
    const s = await fs.getDocs(fs.query(fs.collection(db, 'transactions'), fs.where('kasir', '==', username)));
    return s.docs.map((d) => ({ id: d.id, tanggal: d.data().tanggal, total: d.data().total, kasir: d.data().kasir }));
  },
  _rp: (n) => 'Rp' + Number(n || 0).toLocaleString('id-ID'),
  // "label: lama → baru" untuk catatan jejak
  _nilai(v) { if (v === null || v === undefined || v === '') return '—'; if (typeof v === 'boolean') return v ? 'ya' : 'tidak'; if (Array.isArray(v)) return v.length ? v.join(', ') : '—'; return String(v).slice(0, 60); },
  _beda(lama, baru, kolom, NAMA = {}, fmt = {}) {
    return kolom.map((k) => { const f = fmt[k] || ((x) => this._nilai(x)); return `${NAMA[k] || k}: ${f(lama?.[k])} → ${f(baru[k])}`; }).join('; ');
  },
  async simpanWaBendahara(wa) {
    const { fs, db } = await this._load();
    const b = fs.writeBatch(db);
    const jejakId = this._jejak(b, { target: 'pengaturan/kontak', modul: 'gaji', aksi: `Nomor WA bendahara: ${this.waBendahara || '—'} → ${wa}`, kolom: this.waBendahara ? ['waBendahara'] : [] });
    b.set(fs.doc(db, 'pengaturan', 'kontak'), { waBendahara: wa, jejakId });
    await b.commit();
  },
  async ajukanPenarikan(nominal) {
    const { fs, db } = await this._load();
    const b = fs.writeBatch(db); const ref = fs.doc(fs.collection(db, 'penarikan_gaji'));
    const jejakId = this._jejak(b, { target: 'penarikan_gaji/' + ref.id, modul: 'gaji', aksi: `${this.akun.username} mengajukan penarikan gaji ${this._rp(nominal)}` });
    b.set(ref, { uid: this.akun.uid, username: this.akun.username, nominal, status: 'diajukan', diajukan: fs.serverTimestamp(), jejakId });
    await b.commit(); return ref.id;
  },
  async prosesPenarikan(p, status, alasan = '') {
    const { fs, db } = await this._load();
    const b = fs.writeBatch(db);
    const label = { dibayar: 'dibayar', ditolak: 'ditolak', dibatalkan: 'dibatalkan' }[status];
    const kolom = ['status', 'diproses', 'diprosesOleh', ...(alasan ? ['alasan'] : [])];
    const jejakId = this._jejak(b, { target: 'penarikan_gaji/' + p.id, modul: 'gaji', aksi: `Penarikan gaji ${p.username} ${this._rp(p.nominal)} ${label}${alasan ? ': ' + alasan : ''}`, kolom });
    b.update(fs.doc(db, 'penarikan_gaji', p.id), { status, diproses: fs.serverTimestamp(), diprosesOleh: this.akun.username, ...(alasan ? { alasan } : {}), jejakId });
    await b.commit();
  },
  async simpanJadwal(tanggal, petugas, catatan, labelTgl) {
    const { fs, db } = await this._load();
    const ref = fs.doc(db, 'jadwal_jaga', tanggal);
    return fs.runTransaction(db, async (tx) => {
      const ada = await tx.get(ref); const lama = ada.exists() ? ada.data() : null;
      const baru = { petugas, catatan };
      const kolom = lama ? Object.keys(baru).filter((k) => JSON.stringify(lama[k] ?? (k === 'catatan' ? '' : [])) !== JSON.stringify(baru[k])) : [];
      if (lama && !kolom.length) return false;
      const aksi = lama ? `Ubah jadwal jaga ${labelTgl || tanggal}: ${this._beda(lama, baru, kolom, { petugas: 'petugas', catatan: 'catatan' })}`
        : `Jadwal jaga ${labelTgl || tanggal}: ${petugas.join(', ') || 'kosong'}${catatan ? ' (' + catatan + ')' : ''}`;
      const jejakId = this._jejak(tx, { target: 'jadwal_jaga/' + tanggal, modul: 'jadwal', aksi, kolom });
      const isi = { tanggal, petugas, catatan, diubah: new Date().toISOString(), diubahOleh: this.akun.username, jejakId };
      if (lama) tx.update(ref, isi); else tx.set(ref, isi);
      return true;
    });
  },

  /* ---- Kopma Rental ---- */
  // kalender publik: dibaca tanpa login (hanya inventaris dan salinan jadwal tanpa data penyewa)
  async mulaiPublik() {
    if (this.publik.on || this._unsubPublik.length) return;
    try {
      const { fs, db } = await this._load();
      const upd = (patch) => { Object.assign(this.publik, patch); this.onChange(); };
      const err = (e) => upd({ error: this._pesan(e), on: true });
      this._unsubPublik.push(
        fs.onSnapshot(fs.collection(db, 'sewa_barang'), (s) => upd({ on: true, barang: s.docs.map((d) => ({ ...d.data(), id: d.id })).filter((b) => b.aktif !== false).sort((a, b) => String(a.nama).localeCompare(String(b.nama))) }), err),
        fs.onSnapshot(fs.query(fs.collection(db, 'sewa_jadwal'), fs.where('kembali', '>=', ymd(new Date(Date.now() - 62 * 864e5)))), (s) => upd({ jadwal: s.docs.map((d) => ({ ...d.data(), id: d.id })) }), err),
      );
    } catch (e) { Object.assign(this.publik, { on: true, error: this._pesan(e) }); this.onChange(); }
  },
  _cermin: (d) => ({ barangId: d.barangId, unit: d.unit, ambil: d.ambil, kembali: d.kembali, status: d.status }),
  async simpanBarangSewa(data, id) {
    const { fs, db } = await this._load();
    const ref = id ? fs.doc(db, 'sewa_barang', id) : fs.doc(fs.collection(db, 'sewa_barang'));
    return fs.runTransaction(db, async (tx) => {
      const ada = await tx.get(ref); const lama = ada.exists() ? ada.data() : null;
      const kolom = lama ? Object.keys(data).filter((k) => JSON.stringify(lama[k] ?? null) !== JSON.stringify(data[k] ?? null)) : [];
      if (lama && !kolom.length) return false;
      const NAMA = { nama: 'nama', spek: 'spesifikasi', unit: 'unit', harga24: 'harga 24 jam', harga2: 'harga harian', batasHari: 'batas hari', warna: 'warna', aktif: 'status aktif' };
      const rp = (x) => this._rp(x);
      const aksi = lama ? `Ubah barang sewa ${lama.nama}: ${this._beda(lama, data, kolom, NAMA, { harga24: rp, harga2: rp, aktif: (x) => (x === false ? 'nonaktif' : 'aktif') })}`
        : `Barang sewa baru: ${data.nama} (${data.unit} unit, ${this._rp(data.harga24)}/24 jam)`;
      const jejakId = this._jejak(tx, { target: 'sewa_barang/' + ref.id, modul: 'rental', aksi, kolom });
      if (lama) { const isi = {}; kolom.forEach((k) => { isi[k] = data[k]; }); tx.update(ref, { ...isi, jejakId }); } else tx.set(ref, { ...data, jejakId });
      return true;
    });
  },
  async buatBooking(data, aksi) {
    const { fs, db } = await this._load();
    const b = fs.writeBatch(db); const ref = fs.doc(fs.collection(db, 'sewa_booking'));
    const jejakId = this._jejak(b, { target: 'sewa_booking/' + ref.id, modul: 'rental', aksi });
    b.set(ref, { ...data, dibuat: new Date().toISOString(), dibuatOleh: this.akun.username, jejakId });
    b.set(fs.doc(db, 'sewa_jadwal', ref.id), this._cermin(data));
    await b.commit(); return ref.id;
  },
  async ubahBooking(bk, patch, aksi) {
    const { fs, db } = await this._load();
    const kolom = Object.keys(patch).filter((k) => JSON.stringify(bk[k] ?? null) !== JSON.stringify(patch[k] ?? null));
    if (!kolom.length) return false;
    const b = fs.writeBatch(db);
    const jejakId = this._jejak(b, { target: 'sewa_booking/' + bk.id, modul: 'rental', aksi, kolom });
    const isi = {}; kolom.forEach((k) => { isi[k] = patch[k]; });
    b.update(fs.doc(db, 'sewa_booking', bk.id), { ...isi, diubah: new Date().toISOString(), diubahOleh: this.akun.username, jejakId });
    if (kolom.some((k) => ['barangId', 'unit', 'ambil', 'kembali', 'status'].includes(k))) b.set(fs.doc(db, 'sewa_jadwal', bk.id), this._cermin({ ...bk, ...isi }));
    await b.commit(); return true;
  },

  // daftar akun baru dengan kode pendaftaran (dicek aturan Firestore, bukan di sini)
  async daftar({ kode, nia, username, pass }) {
    this._set({ status: 'connecting', error: '' });
    const fb = await this._load().catch((e) => { this._set({ status: 'error', error: this._pesan(e) }); return null; });
    if (!fb) return;
    const { auth, fs, authInst, db } = fb;
    const user = username.replace(/\s+/g, '').toLowerCase();
    let cred = null;
    try {
      cred = await auth.createUserWithEmailAndPassword(authInst, user + '@kopma.um', pass);
      const uid = cred.user.uid; const b = fs.writeBatch(db);
      b.set(fs.doc(db, 'bukti_daftar', uid), { kode });
      b.set(fs.doc(db, 'klaim_nia', nia), { uid, dibuat: new Date().toISOString() });
      b.set(fs.doc(db, 'users', uid), { username: user, role: 'anggota', nia, dibuat: new Date().toISOString() });
      await b.commit();
    } catch (e) {
      if (cred) { try { await auth.deleteUser(cred.user); } catch (x) { try { await auth.signOut(authInst); } catch (y) { /* abaikan */ } } }
      const msg = String(e?.code || '').includes('permission-denied')
        ? 'Pendaftaran ditolak. Periksa kode pendaftaran, pastikan NIA sudah didaftarkan ketua/sekretaris, dan NIA itu belum dipakai akun lain.'
        : this._pesan(e);
      this._set({ status: 'error', error: msg }); return;
    }
    try { this.email = cred.user.email; await this._muatAkun(cred.user); Store.setPref('kasir', 'on'); this._listen(); }
    catch (e) { this._set({ status: 'error', error: this._pesan(e) }); }
  },

  // akun lama (tanpa NIA) menghubungkan NIA miliknya
  async hubungkanNia(nia) {
    const { fs, db } = await this._load();
    const uid = this.akun.uid; const b = fs.writeBatch(db);
    b.set(fs.doc(db, 'klaim_nia', nia), { uid, dibuat: new Date().toISOString() });
    b.update(fs.doc(db, 'users', uid), { nia });
    try { await b.commit(); } catch (e) {
      if (String(e?.code || '').includes('permission-denied')) { const x = new Error('NIA itu belum ada di data anggota atau sudah dipakai akun lain.'); x.code = 'pesan'; throw x; }
      throw e;
    }
    this.akun.nia = nia; this._listen();
  },

  // ketua/sekretaris mengatur peran Kopma Hub akun lain
  async ubahPeran(uid, hub, aksi) {
    const { fs, db } = await this._load();
    const b = fs.writeBatch(db);
    const jejakId = this._jejak(b, { target: 'users/' + uid, modul: 'akun', aksi, kolom: ['hub'] });
    b.update(fs.doc(db, 'users', uid), { hub, jejakId });
    await b.commit();
  },

  // ketua/bendahara mengubah rumus poin bersama (1 poin setiap v rupiah)
  async simpanRumus(v) {
    const { fs, db } = await this._load();
    const rp = (n) => 'Rp' + Number(n).toLocaleString('id-ID');
    const b = fs.writeBatch(db);
    const jejakId = this._jejak(b, { target: 'pengaturan/poin', modul: 'poin', aksi: `Rumus poin ${rp(this.rpPerPoin)} → ${rp(v)} per poin`, kolom: ['rpPerPoin'] });
    b.set(fs.doc(db, 'pengaturan', 'poin'), { rpPerPoin: v, diubah: fs.serverTimestamp(), diubahOleh: this.akun?.username || '', jejakId });
    await b.commit();
  },

  // tambah / ubah data anggota (dokumen anggota/{NIA}); hanya berhasil untuk ketua & sekretaris
  async simpanAnggota(data, baru) {
    const { fs, db } = await this._load();
    const ref = fs.doc(db, 'anggota', data.nia);
    const oleh = this.akun?.username || 'kopmahub';
    const target = 'anggota/' + data.nia;
    // dibaca ulang di dalam transaksi supaya daftar kolom yang berubah selalu tepat
    return fs.runTransaction(db, async (tx) => {
      const ada = await tx.get(ref);
      if (baru) {
        if (ada.exists()) { const e = new Error(`NIA ${data.nia} sudah terdaftar atas nama ${ada.data().nama}.`); e.code = 'nia-sudah-ada'; throw e; }
        const jejakId = this._jejak(tx, { target, modul: 'anggota', aksi: `Anggota baru ${data.nama} (${data.nia})` });
        tx.set(ref, { ...data, aktif: true, dibuat: new Date().toISOString(), dibuatOleh: oleh, jejakId });
        return true;
      }
      const lama = ada.exists() ? ada.data() : {};
      const { nia, ...ubah } = data;
      const sama = (x, y) => JSON.stringify(x === '' || x === undefined ? null : x) === JSON.stringify(y === '' || y === undefined ? null : y);
      const kolom = Object.keys(ubah).filter((k) => !sama(lama[k], ubah[k]));
      if (!kolom.length) return false;   // tidak ada yang berubah, tidak perlu menulis
      // dokumen lama yang dibuat lewat Console kadang tanpa kolom nia: lengkapi sekalian (aturan mensyaratkannya untuk ketua/sekretaris)
      const lengkapiNia = lama.nia !== nia && this.akun?.nia !== nia;
      const NAMA = { nama: 'nama', fakultas: 'fakultas', prodi: 'prodi', angkatan: 'angkatan', wa: 'WA', status: 'status', bidang: 'bidang', aktif: 'status aktif' };
      const siapa = this.akun?.nia === nia ? `${oleh} memperbarui datanya sendiri` : `Ubah data ${ubah.nama || lama.nama} (${nia})`;
      const ket = this._beda(lama, ubah, kolom, NAMA, { aktif: (x) => (x === false ? 'nonaktif' : 'aktif') });
      const jejakId = this._jejak(tx, { target, modul: 'anggota', aksi: `${siapa}: ${ket}`, kolom: lengkapiNia ? [...kolom, 'nia'] : kolom });
      const isi = {}; kolom.forEach((k) => { isi[k] = ubah[k] ?? null; });
      if (lengkapiNia) { isi.nia = nia; }
      tx.update(ref, { ...isi, diubah: new Date().toISOString(), diubahOleh: oleh, jejakId });
      return true;
    });
  },

  // cadangan lengkap (baca saja) — seluruh isi koleksi kasir sebagai JSON
  async backup() {
    const { fs, db } = await this._load();
    const out = { dibuat: new Date().toISOString(), sumber: 'Firebase kopma-um (web kasir)', koleksi: {} };
    for (const k of ['products', 'transactions', 'pengeluaran', 'modal_harian']) {
      const s = await fs.getDocs(fs.collection(db, k));
      out.koleksi[k] = s.docs.map((d) => ({ id: d.id, ...d.data() }));
    }
    return out;
  },

  /* ---- bentuk data untuk Kopma Hub ---- */
  minKey: (id) => 'min-' + id,
  barang() {
    return this.products.map((p) => ({
      id: p.id, nama: p.nama || '(tanpa nama)', kategori: p.kategori || 'Lainnya', barcode: p.barcode || '',
      hargaBeli: Number(p.hargaModal) || 0, hargaJual: Number(p.hargaJual) || 0, stok: Number(p.stok) || 0,
      // batas minimum dari kasir (kolom batasMinimum) diutamakan; kalau kosong pakai pengaturan Kopma Hub, default 5
      min: Number.isFinite(p.batasMinimum) ? p.batasMinimum : (Number(Store.getPref(this.minKey(p.id), '5')) || 0),
      minDariKasir: Number.isFinite(p.batasMinimum),
    })).sort((a, b) => a.nama.localeCompare(b.nama));
  },
  riwayat() {
    const rows = [];
    this.transactions.forEach((t) => (t.item || []).forEach((it) => rows.push({ id: t.id + it.id, nama: it.nama, jenis: 'keluar', jumlah: Number(it.qty) || 0, alasan: `Terjual · ${t.metodeBayar || ''}`.trim(), oleh: t.kasir || 'kasir', waktu: t.tanggal })));
    this.pengeluaran.forEach((p) => {
      const m = /^Stok Masuk: (.+) \(x(\d+)\)$/.exec(p.keterangan || '');
      if (m) rows.push({ id: p.id, nama: m[1], jenis: 'masuk', jumlah: Number(m[2]), alasan: `Belanja stok · ${p.metode || ''}`.trim(), oleh: p.kasir || 'kasir', waktu: p.tanggal });
    });
    return rows.filter((r) => r.waktu).sort((a, b) => String(b.waktu).localeCompare(String(a.waktu)));
  },
  // poin per NIA dari transaksi kasir: floor(total / rpPerPoin) per transaksi
  poinPer(rpPerPoin) {
    const map = new Map();
    this.trxAnggota.forEach((t) => {
      const nia = String(t.niaAnggota || '').replace(/\s+/g, '').toUpperCase(); if (!nia) return;
      const total = Number(t.total) || 0;
      const poin = Math.floor(total / Math.max(1, rpPerPoin));
      const d = map.get(nia) || { nia, poin: 0, belanja: 0, n: 0, terakhir: '', riwayat: [] };
      d.poin += poin; d.belanja += total; d.n++;
      if (String(t.tanggal) > d.terakhir) d.terakhir = String(t.tanggal);
      d.riwayat.push({ id: t.id, waktu: t.tanggal, total, poin, kasir: t.kasir || 'kasir', item: (t.item || []).length });
      map.set(nia, d);
    });
    map.forEach((d) => d.riwayat.sort((a, b) => String(b.waktu).localeCompare(String(a.waktu))));
    return map;
  },
  penjualanHari(ymdStr) {
    const list = this.transactions.filter((t) => t.tanggal && ymd(new Date(t.tanggal)) === ymdStr);
    return { n: list.length, total: list.reduce((a, t) => a + (Number(t.total) || 0), 0) };
  },
};
