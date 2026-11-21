/* Kopma Hub — sambungan ke data web kasir (Firebase project kopma-um).
   BACA SAJA: file ini hanya memakai fungsi baca Firestore (onSnapshot, getDocs).
   Tidak ada addDoc/setDoc/updateDoc/deleteDoc/writeBatch, jadi data kasir tidak bisa berubah dari sini. */

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
  products: [], transactions: [], pengeluaran: [],
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
    if (c.includes('invalid-credential') || c.includes('wrong-password') || c.includes('user-not-found') || c.includes('invalid-email')) return 'Nama pengguna atau kata sandi kasir salah.';
    if (c.includes('permission-denied')) return 'Akun ini tidak punya izin membaca data kasir. Cek Rules Firestore.';
    if (c.includes('too-many-requests')) return 'Terlalu banyak percobaan masuk. Tunggu beberapa menit.';
    if (c.includes('network') || c.includes('unavailable')) return 'Tidak bisa menghubungi Firebase. Cek koneksi internet.';
    if (!c && e?.message?.includes('import')) return 'Library Firebase gagal dimuat. Buka Kopma Hub lewat internet (bukan pratinjau).';
    return 'Gagal tersambung: ' + (c || e?.message || 'kesalahan tidak dikenal');
  },

  _set(patch) { Object.assign(this, patch); this.onChange(); },

  _listen() {
    const { fs, db } = this._fb;
    this._stop();
    let siap = 0;
    const done = () => { siap++; if (siap >= 3) this._set({ on: true, status: 'on' }); else this.onChange(); };
    const fail = (e) => { this._stop(); this._set({ on: false, status: 'error', error: this._pesan(e) }); };
    const once = (fn) => { let first = true; return (snap) => { fn(snap); if (first) { first = false; done(); } else this.onChange(); }; };
    this._unsubs.push(
      fs.onSnapshot(fs.collection(db, 'products'), once((s) => { this.products = s.docs.map((d) => ({ id: d.id, ...d.data() })); }), fail),
      fs.onSnapshot(fs.query(fs.collection(db, 'transactions'), fs.orderBy('tanggal', 'desc'), fs.limit(300)), once((s) => { this.transactions = s.docs.map((d) => ({ id: d.id, ...d.data() })); }), fail),
      fs.onSnapshot(fs.query(fs.collection(db, 'pengeluaran'), fs.orderBy('tanggal', 'desc'), fs.limit(300)), once((s) => { this.pengeluaran = s.docs.map((d) => ({ id: d.id, ...d.data() })); }), fail),
    );
  },
  _stop() { this._unsubs.forEach((u) => { try { u(); } catch (e) { /* abaikan */ } }); this._unsubs = []; },

  async connect(email, pass) {
    this._set({ status: 'connecting', error: '' });
    // web kasir login dengan nama pengguna, disimpan di Firebase sebagai <nama>@kopma.um
    if (!email.includes('@')) email = email.replace(/\s+/g, '').toLowerCase() + '@kopma.um';
    try {
      const fb = await this._load();
      const cred = await fb.auth.signInWithEmailAndPassword(fb.authInst, email, pass);
      this.email = cred.user.email;
      Store.setPref('kasir', 'on');
      this._listen();
    } catch (e) { this._set({ status: 'error', error: this._pesan(e) }); }
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
      this._listen();
    } catch (e) { this._set({ status: 'error', error: this._pesan(e) }); }
  },

  async disconnect() {
    this._stop();
    Store.setPref('kasir', '');
    try { if (this._fb) await this._fb.auth.signOut(this._fb.authInst); } catch (e) { /* abaikan */ }
    this._set({ on: false, status: 'off', products: [], transactions: [], pengeluaran: [], email: '' });
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
      min: Number(Store.getPref(this.minKey(p.id), '5')) || 0,
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
  penjualanHari(ymdStr) {
    const list = this.transactions.filter((t) => t.tanggal && ymd(new Date(t.tanggal)) === ymdStr);
    return { n: list.length, total: list.reduce((a, t) => a + (Number(t.total) || 0), 0) };
  },
};
