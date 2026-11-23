/* Kopma Hub — sambungan ke Firebase project kopma-um (dipakai bersama web kasir).
   - Data kasir (products, transactions, pengeluaran, modal_harian): BACA SAJA.
   - Yang ditulis: data anggota (ketua/sekretaris, atau pemilik NIA untuk datanya sendiri), peran Kopma Hub
     (ketua/sekretaris), rumus poin (ketua/bendahara, dokumen pengaturan/poin), dan pendaftaran akun dengan kode. Semua dibatasi aturan Firestore.
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
  anggota: [], anggotaError: '', anggotaSaya: null, akunList: [], akunError: '',
  get aksesKasir() { return ['admin', 'kasir'].includes(this.akun?.role); },
  get kelolaAkun() { return this.akun?.role === 'admin' || (this.akun?.hub || []).some((r) => ['ketua', 'sekretaris'].includes(r)); },
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
    const perlu = 1 + (this.aksesKasir ? 4 : 0) + (this.bacaAnggota ? 1 : 0) + (nia && !this.bacaAnggota ? 1 : 0) + (poinSendiri ? 1 : 0) + (this.kelolaAkun ? 1 : 0);
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
      this.rpPerPoin = Number.isInteger(v) && v >= 100 ? v : 1000;
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
    if (this.kelolaAkun) {
      this._unsubs.push(fs.onSnapshot(fs.collection(db, 'users'), ...lunak((s) => {
        this.akunList = s.docs.map((d) => ({ uid: d.id, ...d.data() })).sort((a, b) => String(a.username).localeCompare(String(b.username)));
      }, 'akunError')));
    }
  },
  get dataSaya() { const n = this.akun?.nia; return n ? (this.anggota.find((a) => a.nia === n) || this.anggotaSaya) : null; },
  async _muatAkun(user) {
    const { fs, db } = this._fb;
    const snap = await fs.getDoc(fs.doc(db, 'users', user.uid));
    if (!snap.exists()) { const e = new Error('akun'); e.code = 'akun-belum-terdaftar'; throw e; }
    const d = snap.data();
    this.akun = { uid: user.uid, username: d.username || user.email.split('@')[0], role: d.role || '', hub: Array.isArray(d.hub) ? d.hub : [], nama: d.nama || '', nia: d.nia ? String(d.nia).replace(/\s+/g, '').toUpperCase() : '' };
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
    this._set({ on: false, status: 'off', products: [], transactions: [], pengeluaran: [], trxAnggota: [], poinError: '', rpPerPoin: 1000, rumusInfo: null, rumusError: '', email: '', akun: null, anggota: [], anggotaError: '', anggotaSaya: null, akunList: [], akunError: '' });
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
  async ubahPeran(uid, hub) {
    const { fs, db } = await this._load();
    await fs.updateDoc(fs.doc(db, 'users', uid), { hub });
  },

  // ketua/bendahara mengubah rumus poin bersama (1 poin setiap v rupiah)
  async simpanRumus(v) {
    const { fs, db } = await this._load();
    await fs.setDoc(fs.doc(db, 'pengaturan', 'poin'), { rpPerPoin: v, diubah: fs.serverTimestamp(), diubahOleh: this.akun?.username || '' });
  },

  // tambah / ubah data anggota (dokumen anggota/{NIA}); hanya berhasil untuk ketua & sekretaris
  async simpanAnggota(data, baru) {
    const { fs, db } = await this._load();
    const ref = fs.doc(db, 'anggota', data.nia);
    const oleh = this.akun?.username || 'kopmahub';
    if (baru) {
      await fs.runTransaction(db, async (tx) => {
        const ada = await tx.get(ref);
        if (ada.exists()) { const e = new Error(`NIA ${data.nia} sudah terdaftar atas nama ${ada.data().nama}.`); e.code = 'nia-sudah-ada'; throw e; }
        tx.set(ref, { ...data, aktif: true, dibuat: new Date().toISOString(), dibuatOleh: oleh });
      });
    } else {
      const { nia, ...ubah } = data;
      await fs.updateDoc(ref, { ...ubah, diubah: new Date().toISOString(), diubahOleh: oleh });
    }
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
