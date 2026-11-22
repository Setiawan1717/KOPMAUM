/* Kopma Hub — aplikasi utama */

/* ================= Util ================= */
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rp = (n) => 'Rp' + Number(n || 0).toLocaleString('id-ID');
const fmtNum = (n) => Number(n || 0).toLocaleString('id-ID');
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const tgl = (s) => { const d = parseYmd(s); return `${d.getDate()} ${BLN[d.getMonth()]}`; };
const tglPanjang = (s) => { const d = parseYmd(s); return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`; };
const waktu = (iso) => { const d = new Date(iso); return `${d.getDate()} ${BLN[d.getMonth()]}, ${pad(d.getHours())}.${pad(d.getMinutes())}`; };
const bulanLabel = (ym) => { const [y, m] = ym.split('-').map(Number); return `${BULAN[m - 1]} ${y}`; };
const inisial = (n) => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
const AV_COLORS = ['sky', 'pink', 'lime', 'tangerine', 'grape', 'mint', 'coral', 'sun'];
const avColor = (id) => AV_COLORS[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % AV_COLORS.length];
const avatar = (p, size = 38) => `<span class="avatar c-${avColor(p.id)}" style="width:${size}px;height:${size}px" aria-hidden="true">${esc(inisial(p.nama))}</span>`;

const I = {
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  box: '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  star: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>',
  wallet: '<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  clip: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
  history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  refresh: '<path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/>',
  cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
  key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
  user: '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
  sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>',
};
const ic = (n, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true">${I[n]}</svg>`;

/* ================= State ================= */
let db = Store.load();
let meId = Store.getPref('me', null);
const ui = {
  view: 'dasbor',
  q: {},
  anggotaFilter: 'semua',
  stokTab: 'barang', stokKat: 'Semua',
  rentalTab: 'kalender', rentalItem: 'r1', calMonth: TODAY.slice(0, 7), publicView: false, bookingFilter: 'aktif',
  feeMonth: TODAY.slice(0, 7), feeTab: 'saya',
  poinTab: 'saya', poinTimer: null,
  jejakModul: 'semua',
};
const save = () => Store.save(db);

/* Mode akun sungguhan: login lewat Firebase (akun yang sama dengan web kasir).
   Peran Kopma Hub diambil dari field "hub" di dokumen users; role kasir "admin"/"kasir" ikut dipetakan. */
const LIVE_ID = 'live';
const isLive = () => meId === LIVE_ID;
const liveProfil = () => { const a = Kasir.akun || {}; const dariAnggota = Kasir.dataSaya;
  return { id: LIVE_ID, nama: a.nama || dariAnggota?.nama || a.username || 'Pengguna', nia: a.nia || '', email: (a.username || '') + ' · akun Kopma', prodi: dariAnggota?.prodi || '', angkatan: dariAnggota?.angkatan || '', wa: '', status: 'pengurus', bidang: null, pendampingId: null, bergabung: TODAY, aktif: true }; };
const me = () => (isLive() ? (Kasir.on && Kasir.akun ? liveProfil() : null) : db.profil.find((p) => p.id === meId));
const prof = (id) => (id === LIVE_ID ? me() : db.profil.find((p) => p.id === id)) || { id: 'x', nama: 'Tidak dikenal', nia: '-' };
const rolesOf = (id) => {
  if (id === LIVE_ID) {
    const a = Kasir.akun || {}; const r = (a.hub || []).filter((x) => ROLES[x]);
    if (a.role === 'admin') r.push('bidang_usaha'); if (a.role === 'kasir') r.push('petugas_jaga');
    return [...new Set(r.length ? r : ['anggota'])];
  }
  return db.peran.filter((r) => r.userId === id && r.aktif).map((r) => r.peran);
};
const anggotaByNia = (nia) => (isLive() ? Kasir.anggota.find((a) => a.nia === nia) : db.profil.find((x) => x.nia === nia));
const has = (...rs) => { const mine = rolesOf(meId); return rs.some((r) => mine.includes(r)); };
const isPHI = () => has(...PHI_ROLES);

/* Matriks hak akses (sesuai tabel di PRD) */
const can = {
  akunView: () => has('super_admin') || isPHI(),
  akunEdit: () => has('super_admin'),
  anggotaView: () => has('super_admin', 'bidang_usaha', 'petugas_jaga', 'pengurus') || isPHI(),
  anggotaFull: () => has('super_admin', 'bidang_usaha', 'pengurus') || isPHI(),
  anggotaEdit: () => has('super_admin') || isPHI(),
  stokView: () => has('super_admin', 'bidang_usaha', 'petugas_jaga', 'pengurus') || isPHI(),
  stokEdit: () => has('bidang_usaha'),
  rentalView: () => has('super_admin', 'bidang_usaha', 'petugas_jaga', 'pengurus') || isPHI(),
  rentalEdit: () => has('bidang_usaha', 'petugas_jaga') || isPHI(),
  inventarisEdit: () => has('bidang_usaha') || isPHI(),
  poinAll: () => has('super_admin', 'bidang_usaha') || isPHI(),
  poinAdd: () => has('petugas_jaga'),
  poinKoreksi: () => isPHI(),
  poinRumus: () => has('bendahara'),
  feeEdit: () => has('bendahara'),
  feeAll: () => isPHI(),
  export: () => isPHI(),
  jejak: () => has('super_admin') || isPHI(),
};

// Di mode akun sungguhan, modul yang datanya belum di Firebase disembunyikan supaya tidak tercampur data contoh.
['akunView', 'akunEdit', 'anggotaView', 'anggotaFull', 'anggotaEdit', 'rentalView', 'rentalEdit', 'inventarisEdit', 'poinAdd', 'poinKoreksi', 'feeEdit', 'feeAll', 'jejak']
  .forEach((k) => { const f = can[k]; can[k] = () => !isLive() && f(); });
can.anggotaLiveView = () => isLive() && (has('ketua', 'sekretaris', 'bendahara') || Kasir.akun?.role === 'admin');
can.anggotaLiveEdit = () => isLive() && has('ketua', 'sekretaris');
const stokTersedia = () => can.stokView() && (!isLive() || Kasir.aksesKasir);
const poinTersedia = () => !isLive() || Kasir.aksesKasir || !!Kasir.akun?.nia;

function catat(modul, aksi) { db.log.unshift({ id: uid('l'), olehId: meId, modul, aksi, waktu: nowIso() }); }

/* ================= Logika rental ================= */
const AKTIF = ['Menunggu', 'Dikonfirmasi', 'Diambil'];
const hariSewa = (b) => Math.max(1, diffDays(b.ambil, b.kembali));
const hariTerpakai = (ambil, kembali) => { const n = Math.max(1, diffDays(ambil, kembali)); return Array.from({ length: n }, (_, i) => addDays(ambil, i)); };
const terlambat = (b) => b.status === 'Diambil' && b.kembali < TODAY;
function sisaUnit(barangId, tanggal, kecualiId) {
  const item = db.barangSewa.find((x) => x.id === barangId);
  const dipakai = db.booking.filter((b) => b.barangId === barangId && b.id !== kecualiId && (AKTIF.includes(b.status)) && hariTerpakai(b.ambil, b.kembali).includes(tanggal)).reduce((a, b) => a + b.unit, 0);
  // barang yang terlambat tetap memakai unit sampai dikembalikan
  const telat = db.booking.filter((b) => b.barangId === barangId && b.id !== kecualiId && terlambat(b) && tanggal >= b.kembali && tanggal <= TODAY).reduce((a, b) => a + b.unit, 0);
  return item.unit - dipakai - telat;
}
function cekKetersediaan(barangId, ambil, kembali, unit, kecualiId) {
  let minSisa = Infinity, hariBentrok = null;
  for (const d of hariTerpakai(ambil, kembali)) {
    const s = sisaUnit(barangId, d, kecualiId);
    if (s < minSisa) minSisa = s;
    if (s < unit && !hariBentrok) hariBentrok = { d, s };
  }
  return { ok: !hariBentrok, minSisa, hariBentrok };
}
const STATUS_COLOR = { Menunggu: 'sun', Dikonfirmasi: 'sky', Diambil: 'grape', Selesai: 'mint', Batal: 'coral' };
const NEXT = { Menunggu: ['Dikonfirmasi', 'Batal'], Dikonfirmasi: ['Diambil', 'Batal'], Diambil: ['Selesai'] };
const NEXT_LABEL = { Dikonfirmasi: 'Konfirmasi', Diambil: 'Tandai diambil', Selesai: 'Tandai kembali', Batal: 'Batalkan' };

/* ================= Logika lain ================= */
const normNia = (v) => String(v || '').replace(/\s+/g, '').toUpperCase();
const saldoPoin = (id) => (Kasir.on ? (Kasir.poinPer(db.pengaturan.rpPerPoin).get(prof(id).nia)?.poin || 0) : db.poin.filter((p) => p.userId === id).reduce((a, p) => a + p.poin, 0));
const martItems = () => (Kasir.on ? Kasir.barang() : db.barangMart);
const perluBelanja = () => martItems().filter((b) => b.stok < b.min);
const stokBisaDiubah = () => can.stokEdit() && !Kasir.on;
const simpananOf = (id) => db.simpanan.filter((s) => s.userId === id);
const simpananLunas = (id) => simpananOf(id).every((s) => s.lunas);
const feeOf = (id) => db.fee.filter((f) => f.userId === id).sort((a, b) => b.tanggal.localeCompare(a.tanggal));

/* ================= Navigasi ================= */
const NAV = [
  { id: 'dasbor', label: 'Dasbor', icon: 'home', color: 'sun', show: () => true },
  { id: 'anggota', label: 'Anggota', icon: 'users', color: 'sky', show: () => true, labelFn: () => ((isLive() ? can.anggotaLiveView() : can.anggotaView()) ? 'Anggota' : 'Profil saya') },
  { id: 'stok', label: 'Stok Mart', icon: 'box', color: 'lime', show: () => stokTersedia() },
  { id: 'rental', label: 'Rental', icon: 'cal', color: 'tangerine', show: () => can.rentalView() },
  { id: 'poin', label: 'Poin', icon: 'star', color: 'grape', show: () => poinTersedia() },
  { id: 'fee', label: 'Fee & gaji', icon: 'wallet', color: 'pink', show: () => !isLive() },
  { id: 'akun', label: 'Akun & peran', icon: 'shield', color: 'mint', show: () => (isLive() ? Kasir.kelolaAkun : can.akunView()) },
  { id: 'jejak', label: 'Jejak', icon: 'history', color: 'coral', show: () => can.jejak() },
];
const navLabel = (n) => (n.labelFn ? n.labelFn() : n.label);

function route() {
  const h = location.hash.replace('#', '');
  const n = NAV.find((x) => x.id === h && x.show());
  ui.view = n ? n.id : 'dasbor';
}

/* ================= Render ================= */
const app = () => $('#app');
function render() {
  if (isLive() && !Kasir.on) {
    if (Kasir.status === 'connecting') { app().innerHTML = `<div class="login-form c-sky" style="min-height:100vh"><div class="inner" style="text-align:center;justify-items:center"><img src="logo-kopma.png" alt="" style="width:64px;height:64px;border-radius:50%;background:#fff;padding:4px"><h2>Memuat Kopma Hub…</h2><p class="muted">Mengambil data dari Firebase.</p></div></div>`; return; }
    ui.loginError = Kasir.status === 'error' ? Kasir.error : ''; meId = null; Store.setPref('me', '');
  }
  if (!me() || !me().aktif) { app().innerHTML = viewLogin(); return; }
  route();
  const nav = NAV.filter((n) => n.show());
  const cur = NAV.find((n) => n.id === ui.view);
  const p = me();
  const roles = rolesOf(meId);
  app().innerHTML = `
  <div class="shell">
    <aside class="sidebar" aria-label="Navigasi utama">
      <div class="brand"><img src="logo-kopma.png" alt=""><div>Kopma Hub<small>Web internal Kopma UM</small></div></div>
      ${nav.map((n) => `<a href="#${n.id}" class="nav-item c-${n.color} ${n.id === ui.view ? 'active' : ''}" ${n.id === ui.view ? 'aria-current="page"' : ''}><span class="sq">${ic(n.icon)}</span>${esc(navLabel(n))}</a>`).join('')}
      <div class="grow"></div>
      <button class="me-card" data-act="menu-akun">${avatar(p)}<span><b>${esc(p.nama)}</b><span class="small muted">${esc(roles.filter((r) => r !== 'anggota').map((r) => ROLES[r].short).join(' · ') || 'Anggota')}</span></span></button>
    </aside>
    <div style="min-width:0">
      <header class="topbar">
        <div class="brand"><img src="logo-kopma.png" alt=""><div>Kopma Hub<small>${esc(navLabel(cur))}</small></div></div>
        <div class="spacer"></div>
        <button class="avatar c-${avColor(p.id)}" data-act="menu-akun" aria-label="Menu akun">${esc(inisial(p.nama))}</button>
      </header>
      <main class="main c-${cur.color}" id="main"><div class="main-inner">${VIEWS[ui.view]()}</div></main>
    </div>
    <nav class="bottomnav" aria-label="Navigasi">
      ${nav.map((n) => `<a href="#${n.id}" class="bn-item c-${n.color} ${n.id === ui.view ? 'active' : ''}"><span class="dot">${ic(n.icon)}</span>${esc(navLabel(n).split(' ')[0])}</a>`).join('')}
    </nav>
  </div>`;
  afterRender();
}
function afterRender() {
  if (ui.view === 'poin' && $('#niaInput') && document.activeElement === document.body) { /* jangan fokus otomatis di HP */ }
}

function pageHead(title, sub, actions = '') {
  const cur = NAV.find((n) => n.id === ui.view);
  return `<div class="page-head"><div><span class="badge-mod">${ic(cur.icon)}${esc(navLabel(cur))}</span><h1>${title}</h1>${sub ? `<p class="muted">${sub}</p>` : ''}</div>${actions ? `<div class="actions">${actions}</div>` : ''}</div>`;
}
const exportBtn = (kind) => (can.export() ? `<button class="btn btn-ghost btn-sm" data-act="export" data-kind="${kind}">${ic('download', 'icon-sm')}Ekspor CSV</button>` : '');
const empty = (icon, text, color = '') => `<div class="empty ${color ? 'c-' + color : ''}"><span class="ill">${ic(icon)}</span><span>${text}</span></div>`;

/* ---------- Login ---------- */
function viewLogin() {
  const demo = [
    ['u1', 'super_admin'], ['u2', 'ketua'], ['u3', 'bendahara'], ['u5', 'bidang_usaha'],
    ['u6', 'petugas_jaga'], ['u7', 'pengurus'], ['u8', 'anggota'],
  ];
  const shapes = [
    ['lime', 160, '-40px', 'auto', 'auto', '-50px'], ['sun', 90, '30%', '-30px', 'auto', 'auto'],
    ['coral', 120, 'auto', 'auto', '-50px', '22%'], ['sky', 70, '18%', 'auto', 'auto', '46%'],
    ['grape', 200, 'auto', '-70px', '-90px', 'auto'], ['pink', 46, '62%', 'auto', 'auto', '12%'], ['mint', 60, '8%', '24%', 'auto', 'auto'],
  ];
  return `
  <div class="login">
    <section class="login-art">
      <div class="shapes" aria-hidden="true">${shapes.map(([c, s, t, r, b, l]) => `<span style="background:var(--${c});width:${s}px;height:${s}px;top:${t};right:${r};bottom:${b};left:${l};opacity:.85"></span>`).join('')}</div>
      <div class="logos"><img src="logo-um.png" alt="Logo Universitas Negeri Malang"><img src="logo-kopma.png" alt="Logo Kopma UM"></div>
      <div style="display:grid;gap:14px;position:relative">
        <span class="eyebrow" style="color:var(--sun)">Web internal · Periode ${PERIODE}</span>
        <h1>Kopma Hub</h1>
        <p>Stok, jadwal sewa, poin, dan fee dalam satu tempat. Setiap orang melihat yang menjadi haknya, tanpa perlu bertanya.</p>
      </div>
      <div class="mods">
        ${[['sky', 'Data anggota'], ['lime', 'Stok Mart'], ['tangerine', 'Kopma Rental'], ['grape', 'Poin'], ['pink', 'Fee & gaji'], ['mint', 'Akun & peran']].map(([c, t]) => `<span class="pill c-${c}">${t}</span>`).join('')}
      </div>
    </section>
    <section class="login-form c-sky">
      <div class="inner">
        <div style="display:grid;gap:6px"><h2 style="font-size:1.6rem">Masuk</h2><p class="muted">Pakai nama pengguna dan kata sandi akun Kopma (sama dengan akun web kasir).</p></div>
        <form class="form" data-form="login" id="loginForm">
          <div class="field"><label for="loginId">Nama pengguna</label><input class="input" id="loginId" name="id" autocomplete="username" autocapitalize="none" placeholder="contoh: adit" required></div>
          <div class="field"><label for="loginPass">Kata sandi</label><input class="input" id="loginPass" name="pass" type="password" autocomplete="current-password" placeholder="••••••••" required></div>
          <div id="loginMsg">${ui.loginError ? `<div class="notice c-coral">${ic('alert')}<span>${esc(ui.loginError)}</span></div>` : ''}</div>
          <button class="btn btn-primary" type="submit" id="loginBtn">Masuk</button>
          <p class="small muted">Lupa kata sandi? Hubungi admin Kopma.</p>
        </form>
        <section class="card c-grape" style="box-shadow:none">
          ${ui.daftar ? `
          <form class="form" data-form="daftar" id="daftarForm" autocomplete="off">
            <div class="card-head" style="margin:0"><h3>Daftar akun baru</h3><button type="button" class="btn btn-ghost btn-sm" data-act="daftar-tutup">Batal</button></div>
            <p class="small muted">Butuh kode pendaftaran dari pengurus. NIA-mu harus sudah dimasukkan ketua atau sekretaris ke data anggota.</p>
            <div class="field"><label for="dfKode">Kode pendaftaran</label><input class="input" id="dfKode" name="kode" type="password" required autocomplete="off"></div>
            <div class="field"><label for="dfNia">NIA</label><input class="input num" id="dfNia" name="nia" required autocapitalize="characters" placeholder="NIA sesuai kartu anggota"></div>
            <div class="field"><label for="dfUser">Nama pengguna</label><input class="input" id="dfUser" name="user" required autocapitalize="none" pattern="[A-Za-z0-9._\-]{3,30}" placeholder="huruf/angka tanpa spasi, untuk login"><span class="hint">Dipakai untuk login di Kopma Hub.</span></div>
            <div class="form-row"><div class="field"><label for="dfPass">Kata sandi</label><input class="input" id="dfPass" name="pass" type="password" minlength="6" required autocomplete="new-password"></div><div class="field"><label for="dfPass2">Ulangi kata sandi</label><input class="input" id="dfPass2" name="pass2" type="password" minlength="6" required autocomplete="new-password"></div></div>
            <div id="daftarMsg"></div>
            <button class="btn btn-primary" type="submit" id="daftarBtn">Daftar</button>
          </form>` : `<div class="card-head" style="margin:0"><div><b>Belum punya akun?</b><p class="small muted">Daftar sendiri dengan kode pendaftaran dari pengurus.</p></div><button type="button" class="btn btn-soft" data-act="daftar-buka">Daftar</button></div>`}
        </section>
        <details class="demo-box">
          <summary>Lihat mode demo (data contoh, bukan data asli)</summary>
          <p class="small muted" style="margin:8px 0 10px">Untuk mencoba tampilan tiap peran. Tidak tersambung ke Firebase dan tidak menyimpan apa pun ke data asli.</p>
          <div class="demo-accounts">
            ${demo.map(([id, r]) => { const p = prof(id); return `<button type="button" class="demo-acc c-${ROLES[r].color}" data-act="demo-login" data-id="${id}"><span class="avatar c-${ROLES[r].color}" style="width:36px;height:36px;background:var(--c);color:#fff">${esc(inisial(p.nama))}</span><span><b>${esc(ROLES[r].label)}</b><span>${esc(p.nama)} · demo</span></span></button>`; }).join('')}
          </div>
        </details>
      </div>
    </section>
  </div>`;
}

/* ---------- Dasbor ---------- */
function viewDasbor() {
  const p = me();
  const jam = new Date().getHours();
  const salam = jam < 11 ? 'Selamat pagi' : jam < 15 ? 'Selamat siang' : jam < 18 ? 'Selamat sore' : 'Selamat malam';
  const roles = rolesOf(meId);
  const tiles = [];
  if (poinTersedia() && (!isLive() || p.nia)) tiles.push(`<a href="#poin" class="tile c-grape"><span class="t-icon">${ic('star')}</span><span class="t-val num">${fmtNum(saldoPoin(meId))}</span><span class="t-lbl">Poin belanjamu</span></a>`);
  if (!isLive()) { const feeBelum = feeOf(meId).filter((f) => !f.lunas).reduce((a, f) => a + f.nominal, 0);
    tiles.push(`<a href="#fee" class="tile c-pink"><span class="t-icon">${ic('wallet')}</span><span class="t-val num">${rp(feeBelum)}</span><span class="t-lbl">Fee belum dibayar</span></a>`); }
  if (can.anggotaLiveView()) tiles.push(`<a href="#anggota" class="tile c-sky"><span class="t-icon">${ic('users')}</span><span class="t-val num">${Kasir.anggota.filter((x) => x.aktif !== false).length}</span><span class="t-lbl">Anggota terdaftar</span></a>`);
  if (can.rentalView()) {
    const aktif = db.booking.filter((b) => AKTIF.includes(b.status)).length;
    tiles.push(`<a href="#rental" class="tile c-tangerine"><span class="t-icon">${ic('cal')}</span><span class="t-val num">${aktif}</span><span class="t-lbl">Booking aktif</span></a>`);
  }
  if (stokTersedia() && Kasir.on) { const h = Kasir.penjualanHari(TODAY); tiles.push(`<a href="#stok" class="tile c-mint"><span class="t-icon">${ic('cart')}</span><span class="t-val num">${rp(h.total)}</span><span class="t-lbl">Penjualan hari ini · ${h.n} transaksi</span></a>`); }
  if (stokTersedia()) tiles.push(`<a href="#stok" class="tile c-lime" data-act="go-belanja"><span class="t-icon">${ic('cart')}</span><span class="t-val num">${perluBelanja().length}</span><span class="t-lbl">Barang perlu belanja</span></a>`);
  if (can.anggotaFull()) tiles.push(`<a href="#anggota" class="tile c-sky"><span class="t-icon">${ic('users')}</span><span class="t-val num">${db.profil.filter((x) => x.aktif).length}</span><span class="t-lbl">Anggota terdaftar</span></a>`);
  if (!can.rentalView() && !isLive()) tiles.push(`<a href="#anggota" class="tile c-mint"><span class="t-icon">${ic('check')}</span><span class="t-val">${simpananLunas(meId) ? 'Lunas' : 'Belum'}</span><span class="t-lbl">Status simpananmu</span></a>`);

  const late = can.rentalView() ? db.booking.filter(terlambat) : [];
  const upcoming = can.rentalView() ? db.booking.filter((b) => ['Menunggu', 'Dikonfirmasi'].includes(b.status) && b.ambil >= TODAY && b.ambil <= addDays(TODAY, 7)).sort((a, b) => a.ambil.localeCompare(b.ambil)) : [];

  const quick = [];
  if (can.poinAdd()) quick.push(`<a class="btn btn-primary c-grape" href="#poin" data-act="go-catat">${ic('star', 'icon-sm')}Catat belanja anggota</a>`);
  if (can.rentalEdit()) quick.push(`<button class="btn btn-primary c-tangerine" data-act="booking-baru">${ic('plus', 'icon-sm')}Booking baru</button>`);
  if (stokBisaDiubah()) quick.push(`<button class="btn btn-primary c-lime" data-act="mutasi" data-id="">${ic('box', 'icon-sm')}Catat stok</button>`);
  if (can.feeEdit()) quick.push(`<button class="btn btn-primary c-pink" data-act="fee-baru">${ic('wallet', 'icon-sm')}Catat fee</button>`);

  const dampingan = isLive() ? [] : db.profil.filter((x) => x.pendampingId === meId);

  return `
  <section class="hero">
    <span class="blob" style="background:var(--lime);width:150px;height:150px;right:-30px;top:-50px"></span>
    <span class="blob" style="background:var(--pink);width:70px;height:70px;right:120px;bottom:-24px"></span>
    <span class="blob" style="background:var(--sun);width:38px;height:38px;right:70px;top:70px"></span>
    <span class="blob" style="background:var(--sky);width:22px;height:22px;right:200px;top:24px"></span>
    <div class="hero-content">
      <span class="eyebrow" style="color:var(--sun)">${tglPanjang(TODAY)}</span>
      <h1>${salam}, ${esc(p.nama.split(' ')[0])}!</h1>
      <div class="chips">${roles.map((r) => `<span class="pill c-${ROLES[r].color}" style="background:rgba(255,255,255,.14);color:#fff">${esc(ROLES[r].label)}</span>`).join('')}</div>
      ${quick.length ? `<div class="actions" style="margin-top:6px">${quick.join('')}</div>` : ''}
    </div>
  </section>
  <div class="tiles">${tiles.join('')}</div>
  <div class="grid grid-2">
    ${can.rentalView() ? `
    <section class="card c-coral">
      <div class="card-head"><h2>Terlambat kembali</h2><span class="pill">${late.length}</span></div>
      <div class="list">${late.length ? late.map(bookingRow).join('') : empty('check', 'Semua barang sewa kembali tepat waktu.', 'mint')}</div>
    </section>
    <section class="card c-tangerine">
      <div class="card-head"><h2>Ambil 7 hari ke depan</h2><a href="#rental" class="btn btn-soft btn-sm">Kalender</a></div>
      <div class="list">${upcoming.length ? upcoming.map(bookingRow).join('') : empty('cal', 'Belum ada jadwal ambil minggu ini.')}</div>
    </section>` : ''}
    ${stokTersedia() ? `
    <section class="card c-lime">
      <div class="card-head"><h2>Perlu belanja</h2><a href="#stok" class="btn btn-soft btn-sm" data-act="go-belanja">Lihat stok</a></div>
      <div class="list">${perluBelanja().length ? perluBelanja().map(stokRow).join('') : empty('check', 'Semua stok di atas batas minimum.', 'mint')}</div>
    </section>` : ''}
    ${poinTersedia() && (!isLive() || p.nia) ? `<section class="card c-grape">
      <div class="card-head"><h2>Poin terakhirmu</h2><a href="#poin" class="btn btn-soft btn-sm">Riwayat</a></div>
      <div class="list">${Kasir.on ? (riwayatPoinKasir(Kasir.poinPer(db.pengaturan.rpPerPoin).get(me().nia), 4) || empty('star', 'Belum ada belanja dengan NIA-mu. Sebutkan NIA saat bayar di kasir.')) : (poinRows(db.poin.filter((x) => x.userId === meId).slice(-4).reverse(), false) || empty('star', 'Belum ada belanja tercatat. Sebutkan NIA saat belanja di Kopma Mart.'))}</div>
    </section>` : ''}
    ${can.anggotaLiveView() ? `<section class="card c-sky"><div class="card-head"><h2>Anggota terbaru</h2><a href="#anggota" class="btn btn-soft btn-sm">Semua</a></div><div class="list">${[...Kasir.anggota].sort((a, b) => String(b.dibuat || '').localeCompare(String(a.dibuat || ''))).slice(0, 4).map(anggotaLiveRow).join('') || empty('users', 'Belum ada data anggota.')}</div></section>` : ''}
    ${dampingan.length ? `
    <section class="card c-sky">
      <div class="card-head"><h2>Anggota dampinganmu</h2><span class="pill">${dampingan.length}</span></div>
      <div class="list">${dampingan.map(anggotaRow).join('')}</div>
    </section>` : ''}
  </div>`;
}

/* ---------- Anggota ---------- */
function anggotaRow(p) {
  const lunas = simpananLunas(p.id);
  return `<div class="row click" data-act="profil" data-id="${p.id}" role="button" tabindex="0">
    ${avatar(p)}
    <div class="grow"><div class="title">${esc(p.nama)}</div><div class="sub num">${esc(p.nia)} · ${esc(p.prodi)} ’${String(p.angkatan).slice(2)}</div></div>
    <div class="end">
      <span class="pill c-${p.status === 'pengurus' ? 'sky' : 'mint'}">${p.status === 'pengurus' ? 'Pengurus' : 'Anggota'}</span>
      ${can.anggotaFull() ? `<span class="pill c-${lunas ? 'lime' : 'coral'} plain small">${lunas ? 'Simpanan lunas' : 'Simpanan belum'}</span>` : ''}
    </div>
  </div>`;
}
function listAnggota() {
  const q = (ui.q.anggota || '').toLowerCase().trim();
  if (!can.anggotaFull() && q.length < 3) return empty('search', 'Ketik minimal 3 huruf nama atau NIA untuk mencari anggota.');
  let rows = db.profil.filter((p) => !q || p.nama.toLowerCase().includes(q) || p.nia.toLowerCase().includes(q));
  const f = ui.anggotaFilter;
  if (f === 'pengurus') rows = rows.filter((p) => p.status === 'pengurus');
  if (f === 'anggota') rows = rows.filter((p) => p.status === 'anggota');
  if (f === 'belum') rows = rows.filter((p) => !simpananLunas(p.id));
  if (f === 'dampingan') rows = rows.filter((p) => p.pendampingId === meId);
  return rows.length ? rows.map(anggotaRow).join('') : empty('search', 'Tidak ada anggota yang cocok. Coba nama atau NIA lain.');
}
/* ---------- Anggota (data asli di Firebase) ---------- */
const FAKULTAS_UM = ['FIP', 'FS', 'FMIPA', 'FEB', 'FT', 'FIK', 'FIS', 'FPPsi', 'FK'];
function anggotaLiveRow(a) {
  const poin = Kasir.aksesKasir ? (Kasir.poinPer(db.pengaturan.rpPerPoin).get(a.nia)?.poin || 0) : null;
  return `<div class="row click" data-act="anggota-live" data-nia="${esc(a.nia)}" role="button" tabindex="0" style="${a.aktif === false ? 'opacity:.55' : ''}">
    ${avatar({ id: a.nia, nama: a.nama || '?' })}
    <div class="grow"><div class="title">${esc(a.nama)}</div><div class="sub"><span class="num">${esc(a.nia)}</span> · ${esc(a.fakultas || '-')}, ${esc(a.prodi || '-')}</div></div>
    <div class="end"><span class="pill c-${a.status === 'pengurus' ? 'sky' : 'mint'}">${a.status === 'pengurus' ? 'Pengurus' + (a.bidang ? ' · ' + esc(a.bidang) : '') : 'Anggota'}</span>${poin !== null ? `<span class="small muted num">${fmtNum(poin)} poin</span>` : ''}</div>
  </div>`;
}
function listAnggotaLive() {
  const q = (ui.q.anggotaLive || '').toLowerCase().trim();
  let rows = Kasir.anggota.filter((a) => !q || [a.nama, a.nia, a.prodi, a.fakultas].some((v) => String(v || '').toLowerCase().includes(q)));
  const f = ui.anggotaLiveFilter || 'semua';
  if (f === 'anggota' || f === 'pengurus') rows = rows.filter((a) => a.status === f);
  else if (f !== 'semua') rows = rows.filter((a) => a.fakultas === f);
  if (rows.length) return rows.map(anggotaLiveRow).join('');
  return Kasir.anggota.length ? empty('search', 'Tidak ada anggota yang cocok. Coba nama, NIA, atau prodi lain.') : empty('users', can.anggotaLiveEdit() ? 'Belum ada data anggota. Klik <b>Tambah anggota</b> untuk memasukkan yang pertama.' : 'Belum ada data anggota.', 'sky');
}
function viewAnggotaLive() {
  const fak = [...new Set(Kasir.anggota.map((a) => a.fakultas).filter(Boolean))].sort();
  const filters = [['semua', 'Semua', Kasir.anggota.length], ['anggota', 'Anggota', Kasir.anggota.filter((a) => a.status === 'anggota').length], ['pengurus', 'Pengurus', Kasir.anggota.filter((a) => a.status === 'pengurus').length], ...fak.map((x) => [x, x, Kasir.anggota.filter((a) => a.fakultas === x).length])];
  return `
  ${pageHead('Data anggota', `Tersimpan di Firebase, jadi sama di semua perangkat. ${can.anggotaLiveEdit() ? 'Ketua dan sekretaris bisa menambah dan mengubah.' : 'Kamu bisa melihat; perubahan oleh ketua atau sekretaris.'}`,
    `${exportBtn('anggota')}${can.anggotaLiveEdit() ? `<button class="btn btn-primary" data-act="anggota-live-form">${ic('plus', 'icon-sm')}Tambah anggota</button>` : ''}`)}
  ${Kasir.anggotaError ? `<div class="notice c-coral">${ic('alert')}<span>Data anggota gagal dimuat: ${esc(Kasir.anggotaError)}</span></div>` : ''}
  <div class="toolbar"><div class="search">${ic('search')}<input class="input" id="qAnggotaLive" data-live="anggotaLive" placeholder="Cari nama, NIA, atau prodi…" value="${esc(ui.q.anggotaLive || '')}" aria-label="Cari anggota"></div></div>
  <div class="chips">${filters.map(([k, l, n]) => `<button class="chip ${(ui.anggotaLiveFilter || 'semua') === k ? 'on' : ''}" data-act="anggota-live-filter" data-k="${esc(k)}">${esc(l)}<span class="count num">${n}</span></button>`).join('')}</div>
  <div class="list" id="listAnggotaLive">${listAnggotaLive()}</div>`;
}
function formAnggotaLive(a, sendiri = false) {
  const fak = [...new Set([...FAKULTAS_UM, ...Kasir.anggota.map((x) => x.fakultas).filter(Boolean)])];
  const prodi = [...new Set(Kasir.anggota.map((x) => x.prodi).filter(Boolean))].sort();
  openModal(sendiri ? 'Perbarui data saya' : a ? 'Ubah data anggota' : 'Tambah anggota', `
  <form class="form" data-form="anggotaLive" id="anggotaLiveForm"><input type="hidden" name="baru" value="${a ? '' : '1'}"><input type="hidden" name="sendiri" value="${sendiri ? '1' : ''}">
    <div class="field"><label for="alNama">Nama lengkap</label><input class="input" id="alNama" name="nama" required minlength="2" value="${esc(a?.nama || '')}"></div>
    <div class="field"><label for="alNia">NIA</label><input class="input num" id="alNia" name="nia" required autocapitalize="characters" value="${esc(a?.nia || '')}" ${a ? 'readonly' : ''} placeholder="NIA sesuai kartu anggota"><span class="hint">${a ? 'NIA tidak bisa diubah karena menjadi kunci data dan poin.' : 'Huruf, angka, titik, strip, atau garis miring. Harus sama dengan yang diketik di kasir.'}</span></div>
    <div class="form-row">
      <div class="field"><label for="alFak">Fakultas</label><input class="input" id="alFak" name="fakultas" list="listFak" required value="${esc(a?.fakultas || '')}" placeholder="contoh: FMIPA"><datalist id="listFak">${fak.map((x) => `<option value="${esc(x)}">`).join('')}</datalist></div>
      <div class="field"><label for="alProdi">Prodi</label><input class="input" id="alProdi" name="prodi" list="listProdi" required value="${esc(a?.prodi || '')}" placeholder="contoh: Fisika"><datalist id="listProdi">${prodi.map((x) => `<option value="${esc(x)}">`).join('')}</datalist></div>
    </div>
    ${sendiri ? `<p class="small muted">Status (${a.status === 'pengurus' ? 'pengurus' : 'anggota'}${a.bidang ? ', ' + esc(a.bidang) : ''}) hanya bisa diubah ketua atau sekretaris.</p>` : `<div class="form-row">
      <div class="field"><label for="alStatus">Status</label><select class="input" id="alStatus" name="status"><option value="anggota" ${a?.status !== 'pengurus' ? 'selected' : ''}>Anggota</option><option value="pengurus" ${a?.status === 'pengurus' ? 'selected' : ''}>Pengurus</option></select></div>
      <div class="field"><label for="alBidang">Bidang (kalau pengurus)</label><input class="input" id="alBidang" name="bidang" value="${esc(a?.bidang || '')}" placeholder="Usaha, PSDA, PHI…"></div>
    </div>`}
    <div class="form-row">
      <div class="field"><label for="alAngkatan">Angkatan (opsional)</label><input class="input num" id="alAngkatan" name="angkatan" type="number" min="1990" max="2100" value="${esc(a?.angkatan || '')}"></div>
      <div class="field"><label for="alWa">Nomor WA (opsional)</label><input class="input num" id="alWa" name="wa" inputmode="tel" value="${esc(a?.wa || '')}"></div>
    </div>
    ${a && !sendiri ? `<label class="chip ${a.aktif === false ? '' : 'on'}" style="width:fit-content"><input type="checkbox" name="aktif" ${a.aktif === false ? '' : 'checked'} data-live="rolechip" style="position:absolute;opacity:0;width:0">Masih aktif sebagai anggota</label>` : ''}
    <div id="alMsg"></div>
  </form>`, 'sky', `<button class="btn btn-ghost" data-act="close-modal">Batal</button><button class="btn btn-primary" form="anggotaLiveForm" type="submit" id="alSubmit">${a ? 'Simpan perubahan' : 'Tambah anggota'}</button>`);
}

function viewProfilSayaLive() {
  const a = Kasir.dataSaya; const ak = Kasir.akun || {};
  if (!ak.nia) return `${pageHead('Profil saya', 'Hubungkan akunmu dengan NIA supaya data dan poinmu muncul.')}
    <section class="card c-sky" style="max-width:560px"><form class="form" data-form="hubungkanNia" id="hubungkanForm">
      <div class="field"><label for="hnNia">NIA kamu</label><input class="input input-lg num" id="hnNia" name="nia" required autocapitalize="characters" placeholder="NIA sesuai kartu anggota"><span class="hint">NIA harus sudah ada di data anggota dan belum dipakai akun lain. Setelah terhubung, NIA tidak bisa diganti sendiri.</span></div>
      <div id="hnMsg"></div><button class="btn btn-primary" type="submit" id="hnBtn" style="justify-self:start">Hubungkan NIA</button></form></section>`;
  if (!a) return `${pageHead('Profil saya', '')}${Kasir.anggotaError ? `<div class="notice c-coral">${ic('alert')}<span>${esc(Kasir.anggotaError)}</span></div>` : empty('users', 'Data anggotamu belum ditemukan. Hubungi sekretaris.')}`;
  return `${pageHead('Profil saya', 'Data keanggotaanmu. Kamu bisa memperbarui nama, fakultas, prodi, angkatan, dan nomor WA.', `<button class="btn btn-primary" data-act="anggota-self-form">${ic('edit', 'icon-sm')}Perbarui data</button>`)}
  <div class="grid grid-2"><section class="card c-sky">
    <div style="display:flex;gap:14px;align-items:center;margin-bottom:14px">${avatar({ id: a.nia, nama: a.nama || '?' }, 56)}<div><h2>${esc(a.nama)}</h2><p class="muted num">NIA ${esc(a.nia)}</p></div></div>
    <dl class="kv"><dt>Fakultas</dt><dd>${esc(a.fakultas || '-')}</dd><dt>Prodi</dt><dd>${esc(a.prodi || '-')}</dd><dt>Status</dt><dd>${a.status === 'pengurus' ? 'Pengurus' + (a.bidang ? ' · ' + esc(a.bidang) : '') : 'Anggota'}</dd><dt>Angkatan</dt><dd class="num">${esc(a.angkatan || '-')}</dd><dt>WhatsApp</dt><dd class="num">${esc(a.wa || '-')}</dd><dt>Nama pengguna</dt><dd>${esc(ak.username)}</dd></dl>
  </section></div>`;
}

function viewAnggota() {
  if (isLive()) return can.anggotaLiveView() ? viewAnggotaLive() : viewProfilSayaLive();
  if (!can.anggotaView()) return viewProfilSaya();
  const counts = {
    semua: db.profil.length, pengurus: db.profil.filter((p) => p.status === 'pengurus').length,
    anggota: db.profil.filter((p) => p.status === 'anggota').length, belum: db.profil.filter((p) => !simpananLunas(p.id)).length,
    dampingan: db.profil.filter((p) => p.pendampingId === meId).length,
  };
  const filters = [['semua', 'Semua'], ['pengurus', 'Pengurus'], ['anggota', 'Anggota'], ['belum', 'Simpanan belum lunas'], ['dampingan', 'Dampingan saya']].filter(([k]) => k !== 'dampingan' || counts.dampingan);
  return `
  ${pageHead('Data anggota', 'Setiap anggota punya satu pengurus pendamping, jadi tidak ada yang hanya tercatat di atas kertas.',
    `${exportBtn('anggota')}${can.anggotaEdit() ? `<button class="btn btn-primary" data-act="anggota-form">${ic('plus', 'icon-sm')}Tambah anggota</button>` : ''}`)}
  <div class="toolbar">
    <div class="search">${ic('search')}<input class="input" id="qAnggota" data-live="anggota" placeholder="Cari nama atau NIA…" value="${esc(ui.q.anggota || '')}" aria-label="Cari anggota" inputmode="search"></div>
  </div>
  ${can.anggotaFull() ? `<div class="chips">${filters.map(([k, l]) => `<button class="chip ${ui.anggotaFilter === k ? 'on' : ''}" data-act="anggota-filter" data-k="${k}">${l}<span class="count num">${counts[k]}</span></button>`).join('')}</div>` : ''}
  <div class="list" id="listAnggota">${listAnggota()}</div>`;
}
function viewProfilSaya() {
  const p = me();
  return `${pageHead('Profil saya', 'Data keanggotaanmu di Kopma UM.')}
  <div class="grid grid-2">${profilDetail(p)}</div>`;
}
function profilDetail(p) {
  const pend = p.pendampingId ? prof(p.pendampingId) : null;
  const sp = simpananOf(p.id);
  const bisaWA = can.anggotaFull() || p.id === meId;
  return `
  <section class="card">
    <div style="display:flex;gap:14px;align-items:center;margin-bottom:14px">${avatar(p, 56)}<div><h2>${esc(p.nama)}</h2><p class="muted num">${esc(p.nia)}</p></div></div>
    <dl class="kv">
      <dt>Prodi</dt><dd>${esc(p.prodi)}</dd>
      <dt>Angkatan</dt><dd class="num">${p.angkatan}</dd>
      ${bisaWA ? `<dt>WhatsApp</dt><dd class="num">${esc(p.wa)}</dd><dt>Email</dt><dd>${esc(p.email)}</dd>` : ''}
      <dt>Status</dt><dd>${p.status === 'pengurus' ? 'Pengurus' : 'Anggota'}${p.bidang ? ' · ' + esc(p.bidang) : ''}</dd>
      <dt>Bergabung</dt><dd>${tglPanjang(p.bergabung)}</dd>
      ${p.status === 'anggota' ? `<dt>Pendamping</dt><dd>${pend ? esc(pend.nama) : '<span style="color:var(--coral-ink)">Belum ada</span>'}</dd>` : ''}
    </dl>
  </section>
  <section class="card c-mint">
    <div class="card-head"><h3>Simpanan</h3><span class="pill">${simpananLunas(p.id) ? 'Semua lunas' : 'Ada yang belum'}</span></div>
    <div class="list">${sp.map((s) => `<div class="row"><span class="stripe c-${s.lunas ? 'lime' : 'coral'}"></span><div class="grow"><div class="title">Simpanan ${s.jenis}</div><div class="sub">${tglPanjang(s.tanggal)}</div></div><div class="end"><b class="num">${rp(s.nominal)}</b>${can.anggotaEdit() ? `<button class="btn btn-sm ${s.lunas ? 'btn-ghost' : 'btn-soft c-lime'}" data-act="toggle-simpanan" data-id="${s.id}">${s.lunas ? 'Lunas ✓' : 'Tandai lunas'}</button>` : `<span class="pill c-${s.lunas ? 'lime' : 'coral'}">${s.lunas ? 'Lunas' : 'Belum'}</span>`}</div></div>`).join('')}</div>
  </section>`;
}

/* ---------- Stok ---------- */
function stokRow(b) {
  const low = b.stok < b.min;
  const pct = Math.min(100, Math.round((b.stok / Math.max(b.min * 2, 1)) * 100));
  return `<div class="row ${stokBisaDiubah() ? 'click' : ''}" ${stokBisaDiubah() ? `data-act="mutasi" data-id="${b.id}" role="button" tabindex="0"` : ''}>
    <div class="grow">
      <div class="title">${esc(b.nama)}</div>
      <div class="sub">${esc(b.kategori)} · jual ${rp(b.hargaJual)}${b.barcode ? ` · <span class="num">${esc(b.barcode)}</span>` : ''}</div>
      <div class="meter c-${low ? 'coral' : b.stok < b.min * 1.5 ? 'sun' : 'lime'}" style="margin-top:6px"><i style="width:${pct}%"></i></div>
    </div>
    <div class="end"><b class="num" style="font-size:1.15rem">${b.stok}</b>${Kasir.on && can.stokEdit() && !b.minDariKasir ? `<button class="btn btn-ghost btn-sm num" data-act="set-min" data-id="${esc(b.id)}" title="Ubah batas minimum">min ${b.min}</button>` : `<span class="small muted num">min ${b.min}</span>`}${low ? '<span class="pill c-coral">Perlu belanja</span>' : ''}</div>
  </div>`;
}
function viewStok() {
  const tabs = [['barang', 'Barang'], ['belanja', `Perlu belanja (${perluBelanja().length})`], ['riwayat', 'Riwayat'], ...(stokBisaDiubah() ? [['opname', 'Stock opname']] : [])];
  if (!tabs.find((t) => t[0] === ui.stokTab)) ui.stokTab = 'barang';
  const kats = ['Semua', ...new Set(martItems().map((b) => b.kategori))];
  let body = '';
  if (ui.stokTab === 'barang') {
    body = `<div class="toolbar"><div class="search">${ic('search')}<input class="input" data-live="stok" placeholder="Cari barang…" value="${esc(ui.q.stok || '')}" aria-label="Cari barang"></div></div>
    <div class="chips">${kats.map((k) => `<button class="chip ${ui.stokKat === k ? 'on' : ''}" data-act="stok-kat" data-k="${esc(k)}">${esc(k)}</button>`).join('')}</div>
    <div class="list" id="listStok">${listStok()}</div>`;
  } else if (ui.stokTab === 'belanja') {
    const items = perluBelanja();
    const est = items.reduce((a, b) => a + (b.min * 2 - b.stok) * b.hargaBeli, 0);
    body = items.length ? `<div class="notice c-sun">${ic('cart')}<span>Saran belanja: isi sampai 2× batas minimum. Perkiraan modal <b class="num">${rp(est)}</b>.</span></div>
      <div class="table-wrap"><table><thead><tr><th>Barang</th><th class="r">Stok</th><th class="r">Min</th><th class="r">Saran beli</th><th class="r">Perkiraan</th></tr></thead><tbody>
      ${items.map((b) => `<tr><td><b>${esc(b.nama)}</b></td><td class="r num">${b.stok}</td><td class="r num">${b.min}</td><td class="r num"><b>${b.min * 2 - b.stok}</b></td><td class="r num">${rp((b.min * 2 - b.stok) * b.hargaBeli)}</td></tr>`).join('')}
      </tbody></table></div>` : empty('check', 'Semua stok aman di atas batas minimum.', 'mint');
  } else if (ui.stokTab === 'riwayat' && Kasir.on) {
    const rows = Kasir.riwayat().slice(0, 120);
    body = rows.length ? `<div class="list">${rows.map((m) => {
      const c = m.jenis === 'masuk' ? 'lime' : 'tangerine';
      return `<div class="row"><span class="stripe c-${c}"></span><div class="grow"><div class="title">${esc(m.nama)}</div><div class="sub">${esc(m.alasan)} · ${esc(m.oleh)} · ${waktu(m.waktu)}</div></div><div class="end"><b class="num c-${c}" style="color:var(--c-ink)">${m.jenis === 'masuk' ? '+' : '−'}${m.jumlah}</b><span class="pill c-${c}">${m.jenis}</span></div></div>`;
    }).join('')}</div>` : empty('history', 'Belum ada penjualan atau barang masuk di kasir.');
  } else if (ui.stokTab === 'riwayat') {
    const rows = [...db.mutasi].sort((a, b) => b.waktu.localeCompare(a.waktu));
    body = `<div class="list">${rows.map((m) => {
      const b = db.barangMart.find((x) => x.id === m.barangId) || { nama: '?' };
      const c = m.jenis === 'masuk' ? 'lime' : m.jenis === 'keluar' ? 'tangerine' : 'grape';
      const sign = m.jenis === 'masuk' ? '+' : m.jenis === 'keluar' ? '−' : (m.jumlah >= 0 ? '+' : '−');
      return `<div class="row"><span class="stripe c-${c}"></span><div class="grow"><div class="title">${esc(b.nama)}</div><div class="sub">${esc(m.alasan)} · ${esc(prof(m.olehId).nama)} · ${waktu(m.waktu)}</div></div><div class="end"><b class="num c-${c}" style="color:var(--c-ink)">${sign}${Math.abs(m.jumlah)}</b><span class="pill c-${c}">${m.jenis}</span></div></div>`;
    }).join('')}</div>`;
  } else if (ui.stokTab === 'opname') {
    body = `<div class="notice c-grape">${ic('clip')}<span>Hitung barang di rak, isi jumlah fisiknya. Baris yang selisih akan disorot kuning. Kosongkan kalau tidak dihitung.</span></div>
    <form data-form="opname" id="opnameForm" class="form">
      <div class="table-wrap"><table><thead><tr><th>Barang</th><th class="r">Sistem</th><th class="r">Fisik</th><th class="r">Selisih</th></tr></thead><tbody>
      ${db.barangMart.map((b) => `<tr id="op-${b.id}"><td><b>${esc(b.nama)}</b><div class="small muted">${esc(b.kategori)}</div></td><td class="r num">${b.stok}</td><td class="r"><input class="input num" style="width:88px;min-height:38px;text-align:right" type="number" min="0" inputmode="numeric" name="${b.id}" id="opin-${b.id}" data-live="opname" data-stok="${b.stok}" aria-label="Jumlah fisik ${esc(b.nama)}"></td><td class="r num" id="opd-${b.id}">–</td></tr>`).join('')}
      </tbody></table></div>
      <div class="toolbar"><span id="opSummary" class="muted small">Belum ada yang dihitung.</span><div class="spacer" style="flex:1"></div><button class="btn btn-primary c-grape" type="submit">${ic('check', 'icon-sm')}Simpan hasil opname</button></div>
    </form>`;
  }
  return `
  ${pageHead('Stok Kopma Mart', Kasir.on ? 'Stok terkini langsung dari web kasir. Penjualan dan barang masuk dicatat di kasir.' : can.stokEdit() ? 'Ketuk barang untuk mencatat barang masuk atau keluar.' : 'Kamu bisa melihat stok. Perubahan hanya oleh bidang usaha.',
    `${exportBtn('stok')}${stokBisaDiubah() ? `<button class="btn btn-ghost" data-act="barang-form">${ic('plus', 'icon-sm')}Barang baru</button><button class="btn btn-primary" data-act="mutasi" data-id="">${ic('box', 'icon-sm')}Catat mutasi</button>` : ''}`)}
  ${kasirPanel()}
  <div class="seg">${tabs.map(([k, l]) => `<button class="${ui.stokTab === k ? 'on' : ''}" data-act="stok-tab" data-k="${k}">${l}</button>`).join('')}</div>
  ${body}`;
}
function kasirPanel() {
  const bisaAtur = can.stokEdit() || isPHI() || has('super_admin');
  if (Kasir.status === 'on') {
    const h = Kasir.penjualanHari(TODAY);
    return `<section class="card c-mint"><div class="card-head" style="margin:0"><div style="display:grid;gap:2px"><span class="pill" style="width:fit-content">Tersambung ke web kasir · baca saja</span><span class="small muted">${esc(Kasir.email)} · ${Kasir.products.length} produk · hari ini ${h.n} transaksi (${rp(h.total)})</span></div>
      ${bisaAtur ? `<div class="actions"><button class="btn btn-soft btn-sm" data-act="kasir-backup">${ic('download', 'icon-sm')}Cadangkan data kasir</button>${isLive() ? '' : '<button class="btn btn-ghost btn-sm" data-act="kasir-putus">Putuskan</button>'}</div>` : ''}</div></section>`;
  }
  if (Kasir.status === 'connecting') return `<section class="card c-mint"><span class="pill">Menyambungkan ke web kasir…</span></section>`;
  const err = Kasir.status === 'error' ? `<div class="notice c-coral">${ic('alert')}<span>${esc(Kasir.error)}</span></div>` : '';
  if (!bisaAtur) return `<div class="notice c-sun">${ic('alert')}<span>Belum tersambung ke web kasir. Yang tampil di bawah adalah data contoh.</span></div>`;
  return `<section class="card c-mint">
    <form class="form" data-form="kasir" id="kasirForm">
      <div style="display:grid;gap:4px"><h3>Sambungkan ke web kasir</h3><p class="small muted">Masuk dengan nama pengguna dan kata sandi yang dipakai di web kasir. Kopma Hub hanya <b>membaca</b> produk, penjualan, dan barang masuk. Data di kasir tidak bisa berubah dari sini. Selama belum tersambung, stok di bawah adalah data contoh.</p></div>
      <div class="form-row"><div class="field"><label for="ksEmail">Nama pengguna kasir</label><input class="input" id="ksEmail" name="email" autocomplete="username" autocapitalize="none" placeholder="sama seperti saat login kasir" required></div><div class="field"><label for="ksPass">Kata sandi</label><input class="input" id="ksPass" name="pass" type="password" autocomplete="current-password" required></div></div>
      ${err}
      <button class="btn btn-primary" type="submit" style="justify-self:start">Sambungkan (baca saja)</button>
    </form></section>`;
}
function listStok() {
  const q = (ui.q.stok || '').toLowerCase();
  const rows = martItems().filter((b) => (ui.stokKat === 'Semua' || b.kategori === ui.stokKat) && (!q || b.nama.toLowerCase().includes(q)));
  return rows.length ? rows.map(stokRow).join('') : empty('search', 'Barang tidak ditemukan.');
}

/* ---------- Rental ---------- */
function bookingRow(b) {
  const item = db.barangSewa.find((x) => x.id === b.barangId);
  const late = terlambat(b);
  const nexts = can.rentalEdit() ? (NEXT[b.status] || []) : [];
  return `<div class="row ${late ? 'alert' : ''}">
    <span class="stripe c-${item.warna}"></span>
    <div class="grow">
      <div class="title">${esc(b.penyewa)}</div>
      <div class="sub">${esc(item.nama)} × ${b.unit} · ${tgl(b.ambil)} → ${tgl(b.kembali)} (${hariSewa(b)} hari)</div>
      ${late ? `<div class="small" style="color:var(--coral-ink);font-weight:700;margin-top:2px">${ic('alert', 'icon-sm')} Terlambat ${diffDays(b.kembali, TODAY)} hari</div>` : ''}
      ${nexts.length ? `<div class="actions" style="margin-top:8px">${nexts.map((n) => `<button class="btn btn-sm ${n === 'Batal' ? 'btn-ghost' : 'btn-soft c-' + STATUS_COLOR[n]}" data-act="booking-status" data-id="${b.id}" data-s="${n}">${NEXT_LABEL[n]}</button>`).join('')}</div>` : ''}
    </div>
    <div class="end"><span class="pill c-${late ? 'coral' : STATUS_COLOR[b.status]}">${late ? 'Terlambat' : b.status}</span><b class="num">${rp(b.total)}</b></div>
  </div>`;
}
function calendarHtml(item, pub) {
  const [y, m] = ui.calMonth.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const startDow = (first.getDay() + 6) % 7; // Senin = 0
  const days = new Date(y, m, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push('<span class="day out" aria-hidden="true"></span>');
  for (let d = 1; d <= days; d++) {
    const ds = `${y}-${pad(m)}-${pad(d)}`;
    const sisa = sisaUnit(item.id, ds);
    const cls = sisa <= 0 ? 'full' : sisa < item.unit ? 'partial' : '';
    const label = pub ? (sisa <= 0 ? 'Penuh' : 'Tersedia') : `${Math.max(0, sisa)}/${item.unit} unit`;
    cells.push(`<button class="day ${pub && cls === 'partial' ? '' : cls} ${ds < TODAY ? 'past' : ''} ${ds === TODAY ? 'today' : ''}" ${pub ? 'tabindex="-1"' : `data-act="cal-day" data-d="${ds}"`} aria-label="${tglPanjang(ds)}: ${label}"><span class="d num">${d}</span><span class="a">${label}</span></button>`);
  }
  return `
  <div class="cal-head">
    <button class="btn btn-ghost btn-icon" data-act="cal-nav" data-n="-1" aria-label="Bulan sebelumnya">${ic('left')}</button>
    <h3>${bulanLabel(ui.calMonth)}</h3>
    <button class="btn btn-ghost btn-icon" data-act="cal-nav" data-n="1" aria-label="Bulan berikutnya">${ic('right')}</button>
  </div>
  <div class="cal">${['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((d) => `<span class="dow">${d}</span>`).join('')}${cells.join('')}</div>
  <div class="legend">
    <span><i style="background:var(--mint-soft);box-shadow:inset 0 0 0 2px var(--mint)"></i>Tersedia</span>
    ${pub ? '' : '<span><i style="background:var(--sun-soft);box-shadow:inset 0 0 0 2px var(--sun)"></i>Sebagian terpakai</span>'}
    <span><i style="background:var(--coral-soft);box-shadow:inset 0 0 0 2px var(--coral)"></i>Penuh</span>
  </div>`;
}
function viewRental() {
  const tabs = [['kalender', 'Kalender'], ['booking', 'Booking'], ['inventaris', 'Inventaris']];
  const item = db.barangSewa.find((x) => x.id === ui.rentalItem) || db.barangSewa[0];
  let body = '';
  if (ui.rentalTab === 'kalender') {
    body = `
    <div class="chips" role="tablist" aria-label="Pilih barang">${db.barangSewa.map((b) => `<button class="chip c-${b.warna} ${b.id === item.id ? 'on' : ''}" data-act="rental-item" data-id="${b.id}">${esc(b.nama)}</button>`).join('')}</div>
    <div class="grid grid-2">
      <section class="card c-${item.warna} ${ui.publicView ? 'public-frame' : ''}">
        ${ui.publicView ? `<div class="notice c-sky" style="margin-bottom:12px">${ic('globe')}<span>Begini kalender tampil di web eksternal. Hanya status tersedia atau penuh, tanpa nama dan nomor penyewa.</span></div>` : ''}
        ${calendarHtml(item, ui.publicView)}
      </section>
      <section class="card c-${item.warna}">
        <div class="card-head"><div><span class="eyebrow">Barang terpilih</span><h2>${esc(item.nama)}</h2></div><span class="pill">${item.unit} unit</span></div>
        <p class="muted small">${esc(item.spek)}</p>
        <dl class="kv" style="margin-top:12px">
          <dt>Sewa 24 jam</dt><dd class="num">${rp(item.harga24)}</dd>
          <dt>2 hari ke atas</dt><dd class="num">${rp(item.harga2)} / hari</dd>
          <dt>Batas sewa</dt><dd class="num">${item.batasHari} hari</dd>
        </dl>
        <div class="actions" style="margin-top:16px">
          ${can.rentalEdit() ? `<button class="btn btn-primary" data-act="booking-baru" data-item="${item.id}">${ic('plus', 'icon-sm')}Booking ${esc(item.nama.split(' ')[0])}</button>` : ''}
          <button class="btn btn-soft c-sky" data-act="toggle-public">${ic('globe', 'icon-sm')}${ui.publicView ? 'Kembali ke tampilan internal' : 'Lihat versi publik'}</button>
        </div>
        <div class="divider" style="margin:16px 0"></div>
        <h3 style="margin-bottom:8px">Booking barang ini</h3>
        <div class="list">${db.booking.filter((b) => b.barangId === item.id && AKTIF.includes(b.status)).sort((a, b) => a.ambil.localeCompare(b.ambil)).map(bookingRow).join('') || empty('cal', 'Belum ada booking aktif.')}</div>
      </section>
    </div>`;
  } else if (ui.rentalTab === 'booking') {
    const f = ui.bookingFilter;
    const filters = [['aktif', 'Aktif'], ['terlambat', 'Terlambat'], ['Menunggu', 'Menunggu'], ['Dikonfirmasi', 'Dikonfirmasi'], ['Diambil', 'Diambil'], ['Selesai', 'Selesai'], ['Batal', 'Batal']];
    const match = (b, k) => (k === 'aktif' ? AKTIF.includes(b.status) : k === 'terlambat' ? terlambat(b) : b.status === k);
    const rows = db.booking.filter((b) => match(b, f)).sort((a, b) => (terlambat(b) - terlambat(a)) || a.ambil.localeCompare(b.ambil));
    body = `<div class="chips">${filters.map(([k, l]) => `<button class="chip c-${k === 'terlambat' ? 'coral' : STATUS_COLOR[k] || 'tangerine'} ${f === k ? 'on' : ''}" data-act="booking-filter" data-k="${k}">${l}<span class="count num">${db.booking.filter((b) => match(b, k)).length}</span></button>`).join('')}</div>
    <div class="list">${rows.length ? rows.map(bookingRow).join('') : empty('cal', 'Tidak ada booking di kategori ini.')}</div>`;
  } else {
    body = `<div class="grid grid-2">${db.barangSewa.map((b) => `
      <section class="card c-${b.warna}">
        <div class="card-head"><h3>${esc(b.nama)}</h3><span class="pill">${b.unit} unit</span></div>
        <p class="muted small">${esc(b.spek)}</p>
        <dl class="kv" style="margin-top:10px"><dt>24 jam</dt><dd class="num">${rp(b.harga24)}</dd><dt>2 hari+</dt><dd class="num">${rp(b.harga2)} / hari</dd><dt>Batas</dt><dd class="num">${b.batasHari} hari</dd></dl>
        ${can.inventarisEdit() ? `<div class="actions" style="margin-top:12px"><button class="btn btn-soft btn-sm" data-act="sewa-form" data-id="${b.id}">${ic('edit', 'icon-sm')}Ubah</button></div>` : ''}
      </section>`).join('')}</div>`;
  }
  return `
  ${pageHead('Kopma Rental', 'Jadwal di sini otomatis tampil di kalender web eksternal. Sistem menolak booking kalau unit tidak cukup.',
    `${exportBtn('booking')}${can.inventarisEdit() ? `<button class="btn btn-ghost" data-act="sewa-form" data-id="">${ic('plus', 'icon-sm')}Barang sewa</button>` : ''}${can.rentalEdit() ? `<button class="btn btn-primary" data-act="booking-baru">${ic('plus', 'icon-sm')}Booking baru</button>` : ''}`)}
  <div class="seg">${tabs.map(([k, l]) => `<button class="${ui.rentalTab === k ? 'on' : ''}" data-act="rental-tab" data-k="${k}">${l}</button>`).join('')}</div>
  ${body}`;
}

/* ---------- Poin ---------- */
function poinRows(rows, showName = true) {
  if (!rows.length) return '';
  return rows.map((x) => {
    const pos = x.poin >= 0;
    const kor = x.alasan.startsWith('Koreksi');
    return `<div class="row"><span class="stripe c-${kor ? 'sun' : pos ? 'grape' : 'coral'}"></span><div class="grow"><div class="title">${showName ? esc(prof(x.userId).nama) : esc(x.alasan)}</div><div class="sub">${showName ? esc(x.alasan) + ' · ' : ''}${x.belanja ? 'Belanja ' + rp(x.belanja) + ' · ' : ''}dicatat ${esc(prof(x.olehId).nama.split(' ')[0])} · ${waktu(x.waktu)}</div></div><div class="end"><b class="num" style="font-size:1.1rem;color:var(--${pos ? 'grape' : 'coral'}-ink)">${pos ? '+' : ''}${x.poin}</b></div></div>`;
  }).join('');
}
/* ---- Poin otomatis dari transaksi kasir ---- */
function riwayatPoinKasir(d, max = 50) {
  if (!d || !d.riwayat.length) return '';
  return d.riwayat.slice(0, max).map((r) => `<div class="row"><span class="stripe c-grape"></span><div class="grow"><div class="title">Belanja ${rp(r.total)}</div><div class="sub">${r.item} barang · kasir ${esc(r.kasir)} · ${waktu(r.waktu)}</div></div><div class="end"><b class="num" style="font-size:1.1rem;color:var(--grape-ink)">+${fmtNum(r.poin)}</b></div></div>`).join('');
}
function kartuPoinNia(nia, d) {
  const p = anggotaByNia(nia);
  return `<section class="card c-grape" style="background:linear-gradient(135deg,var(--grape-soft),var(--pink-soft))">
    <span class="eyebrow">${p ? esc(p.nama) + ' · ' : ''}NIA <span class="num">${esc(nia)}</span></span>
    <div class="bignum num" style="color:var(--grape-ink)">${fmtNum(d?.poin || 0)}</div>
    <p class="muted small" style="margin-top:8px">${d ? `Dari ${d.n} kali belanja senilai ${rp(d.belanja)}. Terakhir ${waktu(d.terakhir)}.` : 'Belum ada belanja dengan NIA ini di kasir.'}</p>
  </section>
  ${d ? `<section class="card"><div class="card-head"><h3>Riwayat poin</h3></div><div class="list">${riwayatPoinKasir(d)}</div></section>` : ''}`;
}
function viewPoinKasir() {
  const rate = db.pengaturan.rpPerPoin;
  const data = Kasir.poinPer(rate);
  const tabs = [['saya', 'Poin saya'], ...(Kasir.aksesKasir || !isLive() ? [['cek', 'Cek NIA']] : []), ...(can.poinAll() && (Kasir.aksesKasir || !isLive()) ? [['semua', 'Semua anggota']] : [])];
  if (!tabs.find((t) => t[0] === ui.poinTab)) ui.poinTab = 'saya';
  let body = '';
  if (ui.poinTab === 'saya') {
    body = `<div class="grid grid-2">${kartuPoinNia(me().nia, data.get(me().nia))}</div>`;
  } else if (ui.poinTab === 'cek') {
    body = `<section class="card c-grape" style="max-width:620px"><div class="field"><label for="cekNia">NIA anggota</label>
      <div class="search">${ic('search')}<input class="input input-lg num" id="cekNia" data-live="ceknia" autocapitalize="characters" placeholder="Ketik NIA…" value="${esc(ui.q.ceknia || '')}"></div>
      <span class="hint">Cocok untuk menjawab anggota yang bertanya "poinku berapa?"</span></div></section>
      <div class="grid grid-2" id="cekHasil">${hasilCekNia()}</div>`;
  } else {
    const rank = [...data.values()].sort((a, b) => b.poin - a.poin);
    const max = Math.max(1, rank[0]?.poin || 1);
    const colors = ['grape', 'pink', 'sky', 'tangerine', 'lime', 'mint', 'sun', 'coral'];
    body = `
    ${can.poinRumus() ? `<section class="card c-sun"><form class="toolbar" data-form="rumus"><div class="field" style="flex:1 1 220px"><label for="rateInput">Rumus poin (bendahara)</label><div class="toolbar"><span>1 poin setiap</span><input class="input num" id="rateInput" name="rate" type="number" min="100" step="100" value="${rate}" style="max-width:140px"><span>rupiah</span></div><span class="hint">Berlaku untuk semua transaksi, termasuk yang lama, karena poin dihitung ulang dari data kasir.</span></div><button class="btn btn-primary" type="submit">Simpan rumus</button></form></section>` : ''}
    <section class="card c-grape"><div class="card-head"><h2>Peringkat poin</h2><span class="pill">${rank.length} NIA</span></div>
      <div class="list">${rank.length ? rank.map((d, i) => { const p = anggotaByNia(d.nia); return `<div class="row click" data-act="lihat-nia" data-nia="${esc(d.nia)}" role="button" tabindex="0"><span class="avatar c-${colors[i % colors.length]}" style="width:34px;height:34px">${i + 1}</span><div class="grow"><div class="title">${p ? esc(p.nama) : `<span class="num">${esc(d.nia)}</span>`}</div><div class="sub">${p ? `<span class="num">${esc(d.nia)}</span> · ` : 'Belum terdaftar di data anggota · '}${d.n}× belanja · ${rp(d.belanja)}</div><div class="meter c-${colors[i % colors.length]}" style="margin-top:6px"><i style="width:${Math.round((d.poin / max) * 100)}%"></i></div></div><div class="end"><b class="num">${fmtNum(d.poin)}</b></div></div>`; }).join('') : empty('star', 'Belum ada transaksi kasir yang diisi NIA anggota.', 'grape')}</div>
    </section>`;
  }
  return `${pageHead('Poin anggota', 'Poin tercatat otomatis setiap kasir mengisi NIA anggota saat pembayaran.', exportBtn('poin'))}
  <div class="notice c-mint">${ic('check')}<span>Tersambung ke kasir. ${rp(rate)} belanja = 1 poin, dihitung per transaksi. Transaksi sebelum ada isian NIA tidak dihitung.</span></div>
  ${Kasir.poinError ? `<div class="notice c-coral">${ic('alert')}<span>Data poin gagal dimuat: ${esc(Kasir.poinError)}</span></div>` : ''}
  <div class="seg">${tabs.map(([k, l]) => `<button class="${ui.poinTab === k ? 'on' : ''}" data-act="poin-tab" data-k="${k}">${l}</button>`).join('')}</div>
  ${body}`;
}
function hasilCekNia() {
  const nia = normNia(ui.q.ceknia);
  if (nia.length < 3) return empty('search', 'Ketik NIA lengkap untuk melihat poinnya.');
  return kartuPoinNia(nia, Kasir.poinPer(db.pengaturan.rpPerPoin).get(nia));
}

function viewPoin() {
  if (Kasir.on) return viewPoinKasir();
  const rate = db.pengaturan.rpPerPoin;
  const tabs = [['saya', 'Poin saya'], ...(can.poinAdd() ? [['catat', 'Catat belanja']] : []), ...(can.poinAll() ? [['semua', 'Semua anggota']] : [])];
  if (!tabs.find((t) => t[0] === ui.poinTab)) ui.poinTab = 'saya';
  let body = '';
  if (ui.poinTab === 'saya') {
    const mine = db.poin.filter((x) => x.userId === meId).sort((a, b) => b.waktu.localeCompare(a.waktu));
    const totalBelanja = mine.reduce((a, x) => a + x.belanja, 0);
    body = `<div class="grid grid-2">
      <section class="card c-grape" style="background:linear-gradient(135deg,var(--grape-soft),var(--pink-soft))">
        <span class="eyebrow">Saldo poin</span>
        <div class="bignum num" style="color:var(--grape-ink)">${fmtNum(saldoPoin(meId))}</div>
        <p class="muted small" style="margin-top:8px">Dari ${mine.filter((x) => x.belanja).length} kali belanja senilai ${rp(totalBelanja)}. Setiap ${rp(rate)} belanja = 1 poin.</p>
        <p class="small" style="margin-top:10px"><b>Penukaran poin</b> menyusul di Fase 2.</p>
      </section>
      <section class="card"><div class="card-head"><h2>Riwayat</h2></div><div class="list">${poinRows(mine, false) || empty('star', 'Belum ada poin. Sebutkan NIA setiap belanja di Kopma Mart.', 'grape')}</div></section>
    </div>`;
  } else if (ui.poinTab === 'catat') {
    body = `<section class="card c-grape" style="max-width:620px">
      <form class="form" data-form="poin" id="poinForm" autocomplete="off">
        <div class="card-head" style="margin:0"><h2>Catat belanja anggota</h2><span class="pill plain timer" id="poinTimer">0 dtk</span></div>
        <div class="field"><label for="niaInput">NIA atau nama anggota</label>
          <div class="search">${ic('search')}<input class="input input-lg num" id="niaInput" data-live="nia" autocapitalize="characters" placeholder="Ketik NIA…" aria-describedby="niaHint"></div>
          <input type="hidden" name="userId" id="poinUser">
          <div class="suggest" id="niaSuggest"></div>
          <span class="hint" id="niaHint">Pilih anggota dari daftar yang muncul.</span>
        </div>
        <div class="field"><label for="nominalInput">Nominal belanja</label>
          <input class="input input-lg num" id="nominalInput" name="nominal" data-live="nominal" type="number" min="0" step="500" inputmode="numeric" placeholder="0">
          <div class="chips">${[5000, 10000, 15000, 25000, 50000].map((n) => `<button type="button" class="chip" data-act="nominal-cepat" data-n="${n}">${rp(n)}</button>`).join('')}</div>
        </div>
        <div class="preview"><div class="line"><span>Poin didapat</span><span class="total num" id="poinPreview" style="color:var(--grape-ink)">+0</span></div><div class="line small muted"><span>Rumus</span><span>${rp(rate)} = 1 poin</span></div></div>
        <button class="btn btn-primary btn-lg" type="submit" id="poinSubmit" disabled>${ic('check', 'icon-sm')}Simpan poin</button>
      </form>
    </section>
    <section class="card"><div class="card-head"><h3>Baru saja dicatat</h3></div><div class="list">${poinRows([...db.poin].sort((a, b) => b.waktu.localeCompare(a.waktu)).slice(0, 5)) || empty('star', 'Belum ada.')}</div></section>`;
  } else {
    const rank = db.profil.map((p) => ({ p, s: saldoPoin(p.id) })).sort((a, b) => b.s - a.s);
    const max = Math.max(1, rank[0]?.s || 1);
    const colors = ['grape', 'pink', 'sky', 'tangerine', 'lime', 'mint', 'sun', 'coral'];
    body = `
    ${can.poinRumus() ? `<section class="card c-sun"><form class="toolbar" data-form="rumus"><div class="field" style="flex:1 1 220px"><label for="rateInput">Rumus poin (bendahara)</label><div class="toolbar"><span>1 poin setiap</span><input class="input num" id="rateInput" name="rate" type="number" min="100" step="100" value="${rate}" style="max-width:140px"><span>rupiah</span></div></div><button class="btn btn-primary" type="submit">Simpan rumus</button></form></section>` : ''}
    <div class="grid grid-2">
      <section class="card c-grape"><div class="card-head"><h2>Saldo per anggota</h2>${exportBtn('poin')}</div>
        <div class="list">${rank.map(({ p, s }, i) => `<div class="row">${avatar(p, 34)}<div class="grow"><div class="title">${esc(p.nama)}</div><div class="meter c-${colors[i % colors.length]}" style="margin-top:6px"><i style="width:${Math.round((s / max) * 100)}%"></i></div></div><div class="end"><b class="num">${fmtNum(s)}</b>${can.poinKoreksi() ? `<button class="btn btn-ghost btn-sm" data-act="poin-koreksi" data-id="${p.id}">Koreksi</button>` : ''}</div></div>`).join('')}</div>
      </section>
      <section class="card"><div class="card-head"><h2>Semua riwayat</h2></div><div class="list">${poinRows([...db.poin].sort((a, b) => b.waktu.localeCompare(a.waktu)).slice(0, 25))}</div></section>
    </div>`;
  }
  return `${pageHead('Poin anggota', 'Poin dari setiap belanja tercatat nyata, jadi benefit Kopma bisa dicek sendiri.')}
  ${tabs.length > 1 ? `<div class="seg">${tabs.map(([k, l]) => `<button class="${ui.poinTab === k ? 'on' : ''}" data-act="poin-tab" data-k="${k}">${l}</button>`).join('')}</div>` : ''}
  ${body}`;
}

/* ---------- Fee ---------- */
const FEE_COLOR = { Jaga: 'tangerine', Kepanitiaan: 'sky', Danusan: 'lime' };
function feeRow(f, showName) {
  return `<div class="row"><span class="stripe c-${FEE_COLOR[f.jenis] || 'pink'}"></span>
    <div class="grow"><div class="title">${showName ? esc(prof(f.userId).nama) : esc(f.kegiatan)}</div><div class="sub">${showName ? esc(f.kegiatan) + ' · ' : ''}<span class="pill c-${FEE_COLOR[f.jenis]} plain">${f.jenis}</span> ${tgl(f.tanggal)}</div></div>
    <div class="end"><b class="num">${rp(f.nominal)}</b>${can.feeEdit() ? `<button class="btn btn-sm ${f.lunas ? 'btn-ghost' : 'btn-soft c-mint'}" data-act="fee-toggle" data-id="${f.id}">${f.lunas ? 'Dibayar ✓' : 'Tandai dibayar'}</button>` : `<span class="pill c-${f.lunas ? 'mint' : 'sun'}">${f.lunas ? 'Dibayar' : 'Belum dibayar'}</span>`}</div>
  </div>`;
}
function viewFee() {
  const tabs = [['saya', 'Fee saya'], ...(can.feeAll() ? [['rekap', 'Rekap bulanan'], ['semua', 'Semua fee']] : [])];
  if (!tabs.find((t) => t[0] === ui.feeTab)) ui.feeTab = 'saya';
  let body = '';
  if (ui.feeTab === 'saya') {
    const mine = feeOf(meId);
    const belum = mine.filter((f) => !f.lunas).reduce((a, f) => a + f.nominal, 0);
    const sudah = mine.filter((f) => f.lunas).reduce((a, f) => a + f.nominal, 0);
    body = `<div class="tiles">
      <div class="tile c-sun"><span class="t-icon">${ic('wallet')}</span><span class="t-val num">${rp(belum)}</span><span class="t-lbl">Belum dibayar</span></div>
      <div class="tile c-mint"><span class="t-icon">${ic('check')}</span><span class="t-val num">${rp(sudah)}</span><span class="t-lbl">Sudah dibayar</span></div>
      <div class="tile c-pink"><span class="t-icon">${ic('sparkle')}</span><span class="t-val num">${mine.length}</span><span class="t-lbl">Total catatan fee</span></div>
    </div>
    <section class="card"><div class="card-head"><h2>Rincian fee</h2></div><div class="list">${mine.length ? mine.map((f) => feeRow(f, false)).join('') : empty('wallet', 'Belum ada fee yang tercatat atas namamu.', 'pink')}</div></section>`;
  } else if (ui.feeTab === 'rekap') {
    const months = [...new Set([TODAY.slice(0, 7), ...db.fee.map((f) => f.tanggal.slice(0, 7))])].sort().reverse();
    const inMonth = db.fee.filter((f) => f.tanggal.startsWith(ui.feeMonth));
    const per = {};
    inMonth.forEach((f) => { per[f.userId] ??= { total: 0, lunas: 0 }; per[f.userId].total += f.nominal; if (f.lunas) per[f.userId].lunas += f.nominal; });
    const rows = Object.entries(per).sort((a, b) => b[1].total - a[1].total);
    const tot = inMonth.reduce((a, f) => a + f.nominal, 0), lun = inMonth.filter((f) => f.lunas).reduce((a, f) => a + f.nominal, 0);
    body = `<div class="toolbar"><div class="field"><label for="feeMonth">Bulan</label><select class="input" id="feeMonth" data-live="feemonth">${months.map((m) => `<option value="${m}" ${m === ui.feeMonth ? 'selected' : ''}>${bulanLabel(m)}</option>`).join('')}</select></div></div>
    <div class="tiles">
      <div class="tile c-pink"><span class="t-val num">${rp(tot)}</span><span class="t-lbl">Total fee ${bulanLabel(ui.feeMonth)}</span></div>
      <div class="tile c-mint"><span class="t-val num">${rp(lun)}</span><span class="t-lbl">Sudah dibayar</span></div>
      <div class="tile c-sun"><span class="t-val num">${rp(tot - lun)}</span><span class="t-lbl">Belum dibayar</span></div>
    </div>
    ${rows.length ? `<div class="table-wrap"><table><thead><tr><th>Penerima</th><th class="r">Total</th><th class="r">Dibayar</th><th class="r">Sisa</th></tr></thead><tbody>${rows.map(([id, v]) => `<tr><td><b>${esc(prof(id).nama)}</b></td><td class="r num">${rp(v.total)}</td><td class="r num">${rp(v.lunas)}</td><td class="r num" style="color:var(--${v.total - v.lunas ? 'coral' : 'mint'}-ink);font-weight:700">${rp(v.total - v.lunas)}</td></tr>`).join('')}</tbody></table></div>` : empty('wallet', 'Belum ada fee di bulan ini.', 'pink')}`;
  } else {
    const rows = [...db.fee].sort((a, b) => b.tanggal.localeCompare(a.tanggal));
    body = `<div class="list">${rows.map((f) => feeRow(f, true)).join('')}</div>`;
  }
  return `${pageHead('Fee & gaji', 'Fee yang menjadi hakmu terlihat lengkap beserta statusnya. Hanya bendahara yang mencatat.',
    `${exportBtn('fee')}${can.feeEdit() ? `<button class="btn btn-primary" data-act="fee-baru">${ic('plus', 'icon-sm')}Catat fee</button>` : ''}`)}
  ${tabs.length > 1 ? `<div class="seg">${tabs.map(([k, l]) => `<button class="${ui.feeTab === k ? 'on' : ''}" data-act="fee-tab" data-k="${k}">${l}</button>`).join('')}</div>` : ''}
  ${body}`;
}

/* ---------- Akun & peran ---------- */
const PERAN_HUB = ['ketua', 'sekretaris', 'bendahara', 'bidang_usaha', 'petugas_jaga', 'pengurus'];
function viewAkunLive() {
  const q = (ui.q.akunLive || '').toLowerCase();
  const rows = Kasir.akunList.filter((u) => { const nama = anggotaByNia(u.nia)?.nama || u.nama || ''; return !q || [u.username, nama, u.nia].some((v) => String(v || '').toLowerCase().includes(q)); });
  const label = { admin: 'Kasir: admin', kasir: 'Kasir: kasir', anggota: 'Anggota', pengurus: 'Pengurus' };
  return `${pageHead('Akun & peran', 'Atur peran Kopma Hub tiap akun. Role kasir (admin/kasir) tetap diatur admin lewat Firebase.')}
  ${Kasir.akunError ? `<div class="notice c-coral">${ic('alert')}<span>${esc(Kasir.akunError)}</span></div>` : ''}
  <div class="toolbar"><div class="search">${ic('search')}<input class="input" data-live="akunLive" placeholder="Cari nama pengguna, nama, atau NIA…" value="${esc(ui.q.akunLive || '')}" aria-label="Cari akun"></div></div>
  <div class="list" id="listAkunLive">${rows.map((u) => { const nama = anggotaByNia(u.nia)?.nama || u.nama || u.username; const saya = u.uid === Kasir.akun?.uid;
    return `<div class="row">${avatar({ id: u.uid, nama })}<div class="grow"><div class="title">${esc(nama)} ${saya ? '<span class="pill c-sun">Kamu</span>' : ''}</div><div class="sub">${esc(u.username)}${u.nia ? ` · NIA <span class="num">${esc(u.nia)}</span>` : ' · belum terhubung NIA'}</div>
      <div class="chips" style="margin-top:6px"><span class="pill c-${u.role === 'admin' || u.role === 'kasir' ? 'tangerine' : 'mint'} plain">${esc(label[u.role] || u.role || '-')}</span>${(u.hub || []).filter((r) => ROLES[r]).map((r) => `<span class="pill c-${ROLES[r].color}">${ROLES[r].label}</span>`).join('')}</div></div>
      ${saya ? '' : `<div class="end"><button class="btn btn-soft btn-sm" data-act="peran-live" data-uid="${esc(u.uid)}">${ic('key', 'icon-sm')}Atur peran</button></div>`}</div>`; }).join('') || empty('users', 'Belum ada akun.')}</div>`;
}

function viewAkun() {
  if (isLive()) return viewAkunLive();
  const q = (ui.q.akun || '').toLowerCase();
  const rows = db.profil.filter((p) => !q || p.nama.toLowerCase().includes(q) || p.nia.toLowerCase().includes(q) || p.email.includes(q));
  return `${pageHead('Akun & peran', can.akunEdit() ? 'Buat akun, atur peran, dan serah terima saat ganti periode.' : 'Kamu bisa melihat daftar akun. Perubahan hanya oleh super admin.',
    can.akunEdit() ? `<button class="btn btn-ghost" data-act="ganti-periode">${ic('refresh', 'icon-sm')}Ganti periode</button><button class="btn btn-primary" data-act="akun-form">${ic('plus', 'icon-sm')}Buat akun</button>` : '')}
  <div class="toolbar"><div class="search">${ic('search')}<input class="input" data-live="akun" placeholder="Cari nama, NIA, atau email…" value="${esc(ui.q.akun || '')}" aria-label="Cari akun"></div></div>
  <div class="list" id="listAkun">${rows.map((p) => {
    const rs = rolesOf(p.id);
    return `<div class="row" style="${p.aktif ? '' : 'opacity:.55'}">${avatar(p)}<div class="grow"><div class="title">${esc(p.nama)} ${p.aktif ? '' : '<span class="pill c-coral">Nonaktif</span>'}</div><div class="sub">${esc(p.email)} · <span class="num">${esc(p.nia)}</span></div><div class="chips" style="margin-top:6px">${rs.map((r) => `<span class="pill c-${ROLES[r].color}">${ROLES[r].label}</span>`).join('')}</div></div>
    ${can.akunEdit() ? `<div class="end"><button class="btn btn-soft btn-sm" data-act="peran-form" data-id="${p.id}">${ic('key', 'icon-sm')}Peran</button>${p.id !== meId ? `<button class="btn btn-ghost btn-sm" data-act="akun-toggle" data-id="${p.id}">${p.aktif ? 'Nonaktifkan' : 'Aktifkan'}</button>` : ''}</div>` : ''}</div>`;
  }).join('')}</div>`;
}

/* ---------- Jejak ---------- */
function viewJejak() {
  const MOD = { semua: ['Semua', 'coral'], akun: ['Akun', 'mint'], anggota: ['Anggota', 'sky'], stok: ['Stok', 'lime'], rental: ['Rental', 'tangerine'], poin: ['Poin', 'grape'], fee: ['Fee', 'pink'] };
  const rows = db.log.filter((l) => ui.jejakModul === 'semua' || l.modul === ui.jejakModul);
  return `${pageHead('Jejak perubahan', 'Setiap perubahan stok, poin, booking, dan fee mencatat pelaku dan waktunya.')}
  <div class="chips">${Object.entries(MOD).map(([k, [l, c]]) => `<button class="chip c-${c} ${ui.jejakModul === k ? 'on' : ''}" data-act="jejak-mod" data-k="${k}">${l}</button>`).join('')}</div>
  <div class="list">${rows.length ? rows.slice(0, 80).map((l) => `<div class="row"><span class="stripe c-${MOD[l.modul]?.[1] || 'coral'}"></span>${avatar(prof(l.olehId), 32)}<div class="grow"><div style="font-weight:600">${esc(l.aksi)}</div><div class="sub">${esc(prof(l.olehId).nama)} · ${waktu(l.waktu)}</div></div><span class="pill c-${MOD[l.modul]?.[1] || 'coral'}">${MOD[l.modul]?.[0] || l.modul}</span></div>`).join('') : empty('history', 'Belum ada perubahan tercatat. Coba catat stok, booking, atau poin.')}</div>`;
}

const VIEWS = { dasbor: viewDasbor, anggota: viewAnggota, stok: viewStok, rental: viewRental, poin: viewPoin, fee: viewFee, akun: viewAkun, jejak: viewJejak };

/* ================= Modal, toast, confetti ================= */
function openModal(title, body, color = 'sky', foot = '') {
  closeModal();
  const el = document.createElement('div');
  el.className = 'modal-back';
  el.id = 'modalBack';
  el.innerHTML = `<div class="modal c-${color}" role="dialog" aria-modal="true" aria-labelledby="modalTitle"><div class="modal-head"><h2 id="modalTitle">${title}</h2><button class="btn btn-ghost btn-icon" data-act="close-modal" aria-label="Tutup">${ic('x')}</button></div>${body}${foot ? `<div class="modal-foot">${foot}</div>` : ''}</div>`;
  document.body.appendChild(el);
  const f = el.querySelector('input:not([type=hidden]), select, textarea');
  if (f && window.matchMedia('(min-width: 640px)').matches) f.focus();
}
function closeModal() { $('#modalBack')?.remove(); }
function toast(msg, color = 'lime') {
  let wrap = $('#toasts');
  if (!wrap) { wrap = document.createElement('div'); wrap.id = 'toasts'; wrap.className = 'toasts'; wrap.setAttribute('role', 'status'); document.body.appendChild(wrap); }
  const t = document.createElement('div');
  t.className = `toast c-${color}`;
  t.innerHTML = `${ic('check')}<span>${msg}</span>`;
  wrap.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}
function confetti(x, y) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cols = ['lime', 'sun', 'coral', 'sky', 'grape', 'tangerine', 'pink', 'mint'];
  for (let i = 0; i < 36; i++) {
    const s = document.createElement('span');
    s.className = 'confetti';
    const a = Math.random() * Math.PI * 2, d = 80 + Math.random() * 160;
    s.style.cssText = `left:${x}px;top:${y}px;background:var(--${cols[i % cols.length]});--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d - 60}px;--rot:${Math.random() * 720}deg`;
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 1200);
  }
}
function commit(msg, color, modul, aksi) { if (aksi) catat(modul, aksi); save(); closeModal(); render(); if (msg) toast(msg, color); }

/* ================= Form modal builders ================= */
function modalBooking(itemId, tanggal) {
  const item = itemId || ui.rentalItem;
  const ambil = tanggal || TODAY;
  openModal('Booking baru', `
  <form class="form" data-form="booking" id="bookingForm">
    <div class="form-row">
      <div class="field"><label for="bkPenyewa">Nama penyewa</label><input class="input" id="bkPenyewa" name="penyewa" required placeholder="Nama orang atau organisasi"></div>
      <div class="field"><label for="bkWa">Nomor WA</label><input class="input num" id="bkWa" name="wa" inputmode="tel" placeholder="08…" required></div>
    </div>
    <div class="form-row">
      <div class="field"><label for="bkBarang">Barang</label><select class="input" id="bkBarang" name="barangId" data-live="booking">${db.barangSewa.map((b) => `<option value="${b.id}" ${b.id === item ? 'selected' : ''}>${esc(b.nama)} (${b.unit} unit)</option>`).join('')}</select></div>
      <div class="field"><label for="bkUnit">Jumlah unit</label><input class="input num" id="bkUnit" name="unit" type="number" min="1" value="1" data-live="booking" required></div>
    </div>
    <div class="form-row">
      <div class="field"><label for="bkAmbil">Tanggal ambil</label><input class="input" id="bkAmbil" name="ambil" type="date" value="${ambil}" data-live="booking" required></div>
      <div class="field"><label for="bkKembali">Tanggal kembali</label><input class="input" id="bkKembali" name="kembali" type="date" value="${addDays(ambil, 1)}" data-live="booking" required></div>
    </div>
    <div class="field"><label for="bkStatus">Status awal</label><select class="input" id="bkStatus" name="status"><option>Dikonfirmasi</option><option>Menunggu</option></select></div>
    <div class="preview" id="bkPreview"></div>
  </form>`, 'tangerine', `<button class="btn btn-ghost" data-act="close-modal">Batal</button><button class="btn btn-primary" form="bookingForm" type="submit" id="bkSubmit">Simpan booking</button>`);
  previewBooking();
}
function previewBooking() {
  const f = $('#bookingForm'); if (!f) return;
  const item = db.barangSewa.find((b) => b.id === f.barangId.value);
  const unit = Math.max(1, parseInt(f.unit.value || '1', 10));
  const { ambil, kembali } = { ambil: f.ambil.value, kembali: f.kembali.value };
  const out = $('#bkPreview'), btn = $('#bkSubmit');
  let err = '';
  if (!ambil || !kembali) err = 'Isi tanggal ambil dan kembali.';
  else if (kembali < ambil) err = 'Tanggal kembali tidak boleh sebelum tanggal ambil.';
  else if (unit > item.unit) err = `${item.nama} hanya punya ${item.unit} unit.`;
  else if (Math.max(1, diffDays(ambil, kembali)) > item.batasHari) err = `Batas sewa ${item.nama} adalah ${item.batasHari} hari.`;
  let html = '';
  if (!err) {
    const cek = cekKetersediaan(item.id, ambil, kembali, unit);
    const hari = Math.max(1, diffDays(ambil, kembali));
    const total = hitungBiaya(item, ambil, kembali, unit);
    if (!cek.ok) err = `Unit tidak cukup pada ${tglPanjang(cek.hariBentrok.d)}: tersisa ${Math.max(0, cek.hariBentrok.s)} unit.`;
    html = `<div class="line"><span>Durasi</span><b class="num">${hari} hari</b></div>
      <div class="line"><span>Tarif</span><span class="num">${hari === 1 ? rp(item.harga24) + ' / 24 jam' : rp(item.harga2) + ' × ' + hari + ' hari'} × ${unit} unit</span></div>
      <div class="line"><span>Total biaya</span><span class="total num">${rp(total)}</span></div>
      ${cek.ok ? `<div class="notice c-mint">${ic('check')}<span>Tersedia. Sisa paling sedikit ${cek.minSisa} unit di rentang ini.</span></div>` : ''}`;
  }
  out.innerHTML = html + (err ? `<div class="notice c-coral">${ic('alert')}<span>${esc(err)}</span></div>` : '');
  btn.disabled = !!err;
}

function modalMutasi(barangId) {
  openModal('Catat mutasi stok', `
  <form class="form" data-form="mutasi" id="mutasiForm">
    <div class="field"><label for="mtBarang">Barang</label><select class="input" id="mtBarang" name="barangId" data-live="mutasi">${db.barangMart.map((b) => `<option value="${b.id}" ${b.id === barangId ? 'selected' : ''}>${esc(b.nama)} (stok ${b.stok})</option>`).join('')}</select></div>
    <div class="seg" role="radiogroup" aria-label="Jenis mutasi" id="mtSeg">
      <button type="button" class="on" data-act="mt-jenis" data-k="masuk">${ic('plus', 'icon-sm')} Barang masuk</button>
      <button type="button" data-act="mt-jenis" data-k="keluar">${ic('minus', 'icon-sm')} Barang keluar</button>
    </div>
    <input type="hidden" name="jenis" id="mtJenis" value="masuk">
    <div class="form-row">
      <div class="field"><label for="mtJumlah">Jumlah</label><input class="input input-lg num" id="mtJumlah" name="jumlah" type="number" min="1" inputmode="numeric" required data-live="mutasi"></div>
      <div class="field"><label for="mtAlasan">Alasan</label><select class="input" id="mtAlasan" name="alasan"></select></div>
    </div>
    <div class="preview" id="mtPreview"></div>
  </form>`, 'lime', `<button class="btn btn-ghost" data-act="close-modal">Batal</button><button class="btn btn-primary" form="mutasiForm" type="submit" id="mtSubmit">Simpan</button>`);
  setJenisMutasi('masuk');
}
function setJenisMutasi(j) {
  $('#mtJenis').value = j;
  document.querySelectorAll('#mtSeg button').forEach((b) => b.classList.toggle('on', b.dataset.k === j));
  $('#mtAlasan').innerHTML = (j === 'masuk' ? ['Belanja stok', 'Retur dari pembeli'] : ['Terjual', 'Rusak', 'Kedaluwarsa']).map((a) => `<option>${a}</option>`).join('');
  previewMutasi();
}
function previewMutasi() {
  const f = $('#mutasiForm'); if (!f) return;
  const b = db.barangMart.find((x) => x.id === f.barangId.value);
  const n = parseInt(f.jumlah.value || '0', 10);
  const j = f.jenis.value;
  const akhir = j === 'masuk' ? b.stok + n : b.stok - n;
  const err = n > 0 && akhir < 0 ? `Stok ${b.nama} hanya ${b.stok}.` : '';
  $('#mtPreview').innerHTML = `<div class="line"><span>Stok sekarang</span><b class="num">${b.stok}</b></div><div class="line"><span>Setelah dicatat</span><span class="total num" style="color:var(--${akhir < b.min ? 'coral' : 'lime'}-ink)">${n ? akhir : '–'}</span></div>${n && akhir < b.min && !err ? `<div class="notice c-sun">${ic('cart')}<span>Di bawah batas minimum (${b.min}), akan masuk daftar perlu belanja.</span></div>` : ''}${err ? `<div class="notice c-coral">${ic('alert')}<span>${err}</span></div>` : ''}`;
  $('#mtSubmit').disabled = !n || !!err;
}

/* ================= Aksi klik ================= */
const ACT = {
  'demo-login': (el) => { meId = el.dataset.id; Store.setPref('me', meId); location.hash = 'dasbor'; render(); toast(`Masuk sebagai ${esc(prof(meId).nama)}`, ROLES[rolesOf(meId).find((r) => r !== 'pengurus' && r !== 'anggota') || 'anggota'].color); },
  lupa: () => openModal('Lupa kata sandi', `<form class="form" data-form="lupa" id="lupaForm"><p class="muted">Masukkan email akunmu. Kami kirim tautan untuk membuat kata sandi baru.</p><div class="field"><label for="lupaEmail">Email</label><input class="input" id="lupaEmail" name="email" type="email" required placeholder="nama@kopma.um.ac.id"></div></form>`, 'sky', `<button class="btn btn-primary" form="lupaForm" type="submit">Kirim tautan</button>`),
  'menu-akun': () => {
    const p = me();
    const dark = document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
    openModal('Akun saya', `<div style="display:flex;gap:12px;align-items:center;margin-bottom:14px">${avatar(p, 52)}<div><b>${esc(p.nama)}</b><div class="small muted">${esc(p.email)}</div><div class="chips" style="margin-top:6px">${rolesOf(meId).map((r) => `<span class="pill c-${ROLES[r].color}">${ROLES[r].label}</span>`).join('')}</div></div></div>
      <div class="list">
        <button class="row click" data-act="theme" style="text-align:left;font:inherit">${ic('moon')}<span class="grow"><b>Mode ${dark ? 'terang' : 'gelap'}</b></span></button>
        ${isLive() ? (Kasir.dataSaya ? `<button class="row click" data-act="anggota-self-form" style="text-align:left;font:inherit">${ic('edit')}<span class="grow"><b>Perbarui data saya</b><div class="sub">Nama, fakultas, prodi, angkatan, WA</div></span></button>` : (!Kasir.akun?.nia ? `<a class="row click" href="#anggota" data-act="close-modal" style="text-decoration:none">${ic('user')}<span class="grow"><b>Hubungkan NIA</b><div class="sub">Supaya data dan poinmu muncul</div></span></a>` : '')) : `<button class="row click" data-act="reset-demo" style="text-align:left;font:inherit">${ic('refresh')}<span class="grow"><b>Kembalikan data contoh</b><div class="sub">Hapus semua perubahan di browser ini</div></span></button>`}
        <button class="row click" data-act="logout" style="text-align:left;font:inherit;color:var(--coral-ink)">${ic('logout')}<span class="grow"><b>Keluar</b></span></button>
      </div>`, avColor(p.id));
  },
  theme: () => {
    const root = document.documentElement;
    const dark = root.dataset.theme === 'dark' || (!root.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
    root.dataset.theme = dark ? 'light' : 'dark'; Store.setPref('theme', root.dataset.theme); closeModal();
  },
  'reset-demo': () => confirmBox('Kembalikan data contoh?', 'Semua perubahan yang kamu buat di browser ini akan hilang.', 'Ya, kembalikan', () => { db = Store.reset(); save(); closeModal(); render(); toast('Data contoh dikembalikan', 'sky'); }),
  logout: async () => { const live = isLive(); meId = null; Store.setPref('me', ''); closeModal(); location.hash = ''; ui.loginError = ''; if (live) await Kasir.disconnect(); render(); },
  'daftar-buka': () => { ui.daftar = true; ui.loginError = ''; render(); $('#dfKode')?.focus(); },
  'daftar-tutup': () => { ui.daftar = false; render(); },
  'anggota-self-form': () => { const a = Kasir.dataSaya; if (a) formAnggotaLive(a, true); },
  'peran-live': (el) => {
    const u = Kasir.akunList.find((x) => x.uid === el.dataset.uid); if (!u) return;
    const nama = anggotaByNia(u.nia)?.nama || u.nama || u.username;
    openModal('Atur peran', `<form class="form" data-form="peranLive" id="peranLiveForm"><input type="hidden" name="uid" value="${esc(u.uid)}">
      <p class="muted">${esc(nama)} (${esc(u.username)}). Boleh lebih dari satu peran.</p>
      <div class="chips">${PERAN_HUB.map((k) => `<label class="chip c-${ROLES[k].color} ${(u.hub || []).includes(k) ? 'on' : ''}"><input type="checkbox" name="peran" value="${k}" ${(u.hub || []).includes(k) ? 'checked' : ''} data-live="rolechip" style="position:absolute;opacity:0;width:0">${ROLES[k].label}</label>`).join('')}</div>
      <p class="small muted">Ketua & sekretaris: kelola anggota dan peran. Bendahara: lihat data anggota. Tanpa peran: anggota biasa.</p><div id="plMsg"></div></form>`, 'mint',
      `<button class="btn btn-ghost" data-act="close-modal">Batal</button><button class="btn btn-primary" form="peranLiveForm" type="submit" id="plBtn">Simpan peran</button>`);
  },
  'anggota-live-filter': (el) => { ui.anggotaLiveFilter = el.dataset.k; render(); },
  'anggota-live-form': (el) => formAnggotaLive(el.dataset.nia ? Kasir.anggota.find((a) => a.nia === el.dataset.nia) : null),
  'anggota-live': (el) => {
    const a = Kasir.anggota.find((x) => x.nia === el.dataset.nia); if (!a) return;
    const d = Kasir.aksesKasir ? Kasir.poinPer(db.pengaturan.rpPerPoin).get(a.nia) : null;
    openModal('Data anggota', `<div style="display:flex;gap:14px;align-items:center;margin-bottom:14px">${avatar({ id: a.nia, nama: a.nama }, 56)}<div><h2>${esc(a.nama)}</h2><p class="muted num">NIA ${esc(a.nia)}</p></div></div>
      <dl class="kv"><dt>Fakultas</dt><dd>${esc(a.fakultas || '-')}</dd><dt>Prodi</dt><dd>${esc(a.prodi || '-')}</dd><dt>Status</dt><dd>${a.status === 'pengurus' ? 'Pengurus' + (a.bidang ? ' · ' + esc(a.bidang) : '') : 'Anggota'}${a.aktif === false ? ' (tidak aktif)' : ''}</dd>${a.angkatan ? `<dt>Angkatan</dt><dd class="num">${esc(a.angkatan)}</dd>` : ''}${a.wa ? `<dt>WhatsApp</dt><dd class="num">${esc(a.wa)}</dd>` : ''}<dt>Ditambahkan</dt><dd>${a.dibuat ? waktu(a.dibuat) : '-'}${a.dibuatOleh ? ' · ' + esc(a.dibuatOleh) : ''}</dd>${a.diubah ? `<dt>Terakhir diubah</dt><dd>${waktu(a.diubah)} · ${esc(a.diubahOleh || '')}</dd>` : ''}</dl>
      ${Kasir.aksesKasir ? `<div class="notice c-grape" style="margin-top:14px">${ic('star')}<span>Poin dari kasir: <b class="num">${fmtNum(d?.poin || 0)}</b>${d ? ` · ${d.n}× belanja, ${rp(d.belanja)}` : ''}</span></div>` : ''}`, 'sky',
      can.anggotaLiveEdit() ? `<button class="btn btn-primary" data-act="anggota-live-form" data-nia="${esc(a.nia)}">${ic('edit', 'icon-sm')}Ubah data</button>` : '');
  },
  'close-modal': () => closeModal(),

  'go-belanja': () => { ui.stokTab = 'belanja'; },
  'go-catat': () => { ui.poinTab = 'catat'; },

  'anggota-filter': (el) => { ui.anggotaFilter = el.dataset.k; render(); },
  profil: (el) => {
    const p = prof(el.dataset.id);
    openModal('Profil anggota', `<div class="grid">${profilDetail(p)}${can.poinAll() ? `<div class="notice c-grape">${ic('star')}<span>Saldo poin: <b class="num">${fmtNum(saldoPoin(p.id))}</b></span></div>` : ''}</div>`, 'sky',
      can.anggotaEdit() ? `<button class="btn btn-primary" data-act="anggota-form" data-id="${p.id}">${ic('edit', 'icon-sm')}Ubah data</button>` : '');
  },
  'toggle-simpanan': (el) => {
    const s = db.simpanan.find((x) => x.id === el.dataset.id); s.lunas = !s.lunas;
    catat('anggota', `Simpanan ${s.jenis} ${prof(s.userId).nama} → ${s.lunas ? 'lunas' : 'belum lunas'}`); save();
    const pid = s.userId; render(); ACT.profil({ dataset: { id: pid } }); toast('Status simpanan diperbarui', 'mint');
  },
  'anggota-form': (el) => {
    const p = el.dataset.id ? prof(el.dataset.id) : null;
    const pengurus = db.profil.filter((x) => x.status === 'pengurus');
    openModal(p ? 'Ubah data anggota' : 'Tambah anggota', `
    <form class="form" data-form="anggota" id="anggotaForm"><input type="hidden" name="id" value="${p?.id || ''}">
      <div class="field"><label for="agNama">Nama lengkap</label><input class="input" id="agNama" name="nama" required value="${esc(p?.nama || '')}"></div>
      <div class="form-row"><div class="field"><label for="agNia">NIA</label><input class="input num" id="agNia" name="nia" required autocapitalize="characters" value="${esc(p?.nia || '')}"></div><div class="field"><label for="agAngkatan">Angkatan</label><input class="input num" id="agAngkatan" name="angkatan" type="number" required value="${p?.angkatan || new Date().getFullYear()}"></div></div>
      <div class="field"><label for="agProdi">Prodi</label><input class="input" id="agProdi" name="prodi" required value="${esc(p?.prodi || '')}"></div>
      <div class="form-row"><div class="field"><label for="agWa">Nomor WA</label><input class="input num" id="agWa" name="wa" inputmode="tel" value="${esc(p?.wa || '')}"></div><div class="field"><label for="agStatus">Status</label><select class="input" id="agStatus" name="status"><option value="anggota" ${p?.status === 'anggota' ? 'selected' : ''}>Anggota</option><option value="pengurus" ${p?.status === 'pengurus' ? 'selected' : ''}>Pengurus</option></select></div></div>
      <div class="form-row"><div class="field"><label for="agBidang">Bidang (pengurus)</label><input class="input" id="agBidang" name="bidang" value="${esc(p?.bidang || '')}" placeholder="Usaha, PSDA, …"></div><div class="field"><label for="agPend">Pengurus pendamping</label><select class="input" id="agPend" name="pendampingId"><option value="">— Tidak ada —</option>${pengurus.map((x) => `<option value="${x.id}" ${p?.pendampingId === x.id ? 'selected' : ''}>${esc(x.nama)}</option>`).join('')}</select></div></div>
    </form>`, 'sky', `<button class="btn btn-ghost" data-act="close-modal">Batal</button><button class="btn btn-primary" form="anggotaForm" type="submit">Simpan</button>`);
  },

  'stok-tab': (el) => { ui.stokTab = el.dataset.k; render(); },
  'stok-kat': (el) => { ui.stokKat = el.dataset.k; render(); },
  mutasi: (el) => { if (can.stokEdit()) modalMutasi(el.dataset.id || db.barangMart[0].id); },
  'mt-jenis': (el) => setJenisMutasi(el.dataset.k),
  'barang-form': () => openModal('Barang baru', `
    <form class="form" data-form="barang" id="barangForm">
      <div class="field"><label for="brNama">Nama barang</label><input class="input" id="brNama" name="nama" required></div>
      <div class="field"><label for="brKat">Kategori</label><input class="input" id="brKat" name="kategori" list="katList" required><datalist id="katList">${[...new Set(db.barangMart.map((b) => b.kategori))].map((k) => `<option value="${esc(k)}">`).join('')}</datalist></div>
      <div class="form-row"><div class="field"><label for="brBeli">Harga beli</label><input class="input num" id="brBeli" name="hargaBeli" type="number" min="0" required></div><div class="field"><label for="brJual">Harga jual</label><input class="input num" id="brJual" name="hargaJual" type="number" min="0" required></div></div>
      <div class="form-row"><div class="field"><label for="brStok">Stok awal</label><input class="input num" id="brStok" name="stok" type="number" min="0" value="0" required></div><div class="field"><label for="brMin">Batas minimum</label><input class="input num" id="brMin" name="min" type="number" min="0" value="5" required></div></div>
    </form>`, 'lime', `<button class="btn btn-ghost" data-act="close-modal">Batal</button><button class="btn btn-primary" form="barangForm" type="submit">Tambah barang</button>`),

  'rental-tab': (el) => { ui.rentalTab = el.dataset.k; render(); },
  'rental-item': (el) => { ui.rentalItem = el.dataset.id; render(); },
  'cal-nav': (el) => { const [y, m] = ui.calMonth.split('-').map(Number); const d = new Date(y, m - 1 + Number(el.dataset.n), 1); ui.calMonth = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; render(); },
  'toggle-public': () => { ui.publicView = !ui.publicView; render(); },
  'cal-day': (el) => {
    const d = el.dataset.d; const item = db.barangSewa.find((x) => x.id === ui.rentalItem);
    const list = db.booking.filter((b) => b.barangId === item.id && AKTIF.includes(b.status) && (hariTerpakai(b.ambil, b.kembali).includes(d) || (terlambat(b) && d >= b.kembali && d <= TODAY)));
    const sisa = sisaUnit(item.id, d);
    openModal(tglPanjang(d), `<p class="muted" style="margin-bottom:12px">${esc(item.nama)} · sisa <b class="num">${Math.max(0, sisa)} dari ${item.unit}</b> unit</p><div class="list">${list.length ? list.map(bookingRow).join('') : empty('check', 'Belum ada yang menyewa di tanggal ini.', 'mint')}</div>`, item.warna,
      can.rentalEdit() && sisa > 0 && d >= TODAY ? `<button class="btn btn-primary" data-act="booking-baru" data-item="${item.id}" data-d="${d}">${ic('plus', 'icon-sm')}Booking mulai tanggal ini</button>` : '');
  },
  'booking-filter': (el) => { ui.bookingFilter = el.dataset.k; render(); },
  'booking-baru': (el) => modalBooking(el.dataset.item, el.dataset.d),
  'booking-status': (el) => {
    const b = db.booking.find((x) => x.id === el.dataset.id); const s = el.dataset.s;
    const doIt = () => { const lama = b.status; b.status = s; commit(`Booking ${esc(b.penyewa)} → ${s}`, STATUS_COLOR[s], 'rental', `Booking ${b.penyewa} (${db.barangSewa.find((x) => x.id === b.barangId).nama}): ${lama} → ${s}`); };
    if (s === 'Batal') confirmBox('Batalkan booking ini?', `${esc(b.penyewa)} · ${tgl(b.ambil)} → ${tgl(b.kembali)}. Unit akan tersedia lagi di kalender.`, 'Ya, batalkan', doIt); else doIt();
  },
  'sewa-form': (el) => {
    const b = el.dataset.id ? db.barangSewa.find((x) => x.id === el.dataset.id) : null;
    openModal(b ? 'Ubah barang sewa' : 'Barang sewa baru', `
    <form class="form" data-form="sewa" id="sewaForm"><input type="hidden" name="id" value="${b?.id || ''}">
      <div class="field"><label for="swNama">Nama barang</label><input class="input" id="swNama" name="nama" required value="${esc(b?.nama || '')}"></div>
      <div class="field"><label for="swSpek">Spesifikasi</label><input class="input" id="swSpek" name="spek" value="${esc(b?.spek || '')}"></div>
      <div class="form-row"><div class="field"><label for="swUnit">Jumlah unit</label><input class="input num" id="swUnit" name="unit" type="number" min="1" required value="${b?.unit || 1}"></div><div class="field"><label for="swBatas">Batas hari</label><input class="input num" id="swBatas" name="batasHari" type="number" min="1" required value="${b?.batasHari || 3}"></div></div>
      <div class="form-row"><div class="field"><label for="sw24">Harga 24 jam</label><input class="input num" id="sw24" name="harga24" type="number" min="0" required value="${b?.harga24 || ''}"></div><div class="field"><label for="sw2">Harga per hari (2 hari+)</label><input class="input num" id="sw2" name="harga2" type="number" min="0" required value="${b?.harga2 || ''}"></div></div>
    </form>`, b?.warna || 'tangerine', `<button class="btn btn-ghost" data-act="close-modal">Batal</button><button class="btn btn-primary" form="sewaForm" type="submit">Simpan</button>`);
  },

  'poin-tab': (el) => { ui.poinTab = el.dataset.k; ui.poinTimer = null; render(); },
  'nominal-cepat': (el) => { const i = $('#nominalInput'); i.value = el.dataset.n; startTimer(); previewPoin(); },
  'pilih-anggota': (el) => { const p = prof(el.dataset.id); $('#poinUser').value = p.id; $('#niaInput').value = `${p.nia} · ${p.nama}`; $('#niaSuggest').innerHTML = `<div class="notice c-grape">${avatar(p, 30)}<span>${esc(p.nama)}<br><span class="small">Saldo sekarang ${fmtNum(saldoPoin(p.id))} poin</span></span></div>`; $('#nominalInput').focus(); previewPoin(); },
  'lihat-nia': (el) => { ui.q.ceknia = el.dataset.nia; ui.poinTab = 'cek'; render(); window.scrollTo(0, 0); },
  'poin-koreksi': (el) => {
    const p = prof(el.dataset.id);
    openModal(`Koreksi poin`, `<form class="form" data-form="koreksi" id="koreksiForm"><input type="hidden" name="userId" value="${p.id}">
      <div class="notice c-sun">${avatar(p, 30)}<span>${esc(p.nama)} · saldo ${fmtNum(saldoPoin(p.id))} poin. Koreksi selalu tercatat atas namamu.</span></div>
      <div class="field"><label for="kPoin">Perubahan poin (pakai minus untuk mengurangi)</label><input class="input input-lg num" id="kPoin" name="poin" type="number" required placeholder="contoh: 5 atau -3"></div>
      <div class="field"><label for="kAlasan">Alasan</label><input class="input" id="kAlasan" name="alasan" required placeholder="contoh: belanja kemarin belum tercatat"></div></form>`, 'sun',
      `<button class="btn btn-ghost" data-act="close-modal">Batal</button><button class="btn btn-primary" form="koreksiForm" type="submit">Simpan koreksi</button>`);
  },

  'fee-tab': (el) => { ui.feeTab = el.dataset.k; render(); },
  'fee-baru': () => openModal('Catat fee', `
    <form class="form" data-form="fee" id="feeForm">
      <div class="field"><label for="feUser">Penerima</label><select class="input" id="feUser" name="userId">${[...db.profil].sort((a, b) => a.nama.localeCompare(b.nama)).map((p) => `<option value="${p.id}">${esc(p.nama)} (${p.status})</option>`).join('')}</select></div>
      <div class="form-row"><div class="field"><label for="feJenis">Jenis</label><select class="input" id="feJenis" name="jenis"><option>Jaga</option><option>Kepanitiaan</option><option>Danusan</option></select></div><div class="field"><label for="feNom">Nominal</label><input class="input num" id="feNom" name="nominal" type="number" min="0" step="1000" required></div></div>
      <div class="field"><label for="feKeg">Kegiatan</label><input class="input" id="feKeg" name="kegiatan" required placeholder="contoh: Jaga Kopma Mart (6 shift)"></div>
      <div class="form-row"><div class="field"><label for="feTgl">Tanggal</label><input class="input" id="feTgl" name="tanggal" type="date" value="${TODAY}" required></div><div class="field"><label for="feLunas">Status bayar</label><select class="input" id="feLunas" name="lunas"><option value="0">Belum dibayar</option><option value="1">Sudah dibayar</option></select></div></div>
    </form>`, 'pink', `<button class="btn btn-ghost" data-act="close-modal">Batal</button><button class="btn btn-primary" form="feeForm" type="submit">Simpan fee</button>`),
  'fee-toggle': (el) => { const f = db.fee.find((x) => x.id === el.dataset.id); f.lunas = !f.lunas; commit(f.lunas ? 'Fee ditandai dibayar' : 'Fee ditandai belum dibayar', 'mint', 'fee', `Fee ${prof(f.userId).nama} (${f.kegiatan}) → ${f.lunas ? 'dibayar' : 'belum dibayar'}`); },

  'akun-form': () => openModal('Buat akun', `
    <form class="form" data-form="akun" id="akunForm">
      <div class="field"><label for="akNama">Nama lengkap</label><input class="input" id="akNama" name="nama" required></div>
      <div class="form-row"><div class="field"><label for="akNia">NIA</label><input class="input num" id="akNia" name="nia" required autocapitalize="characters"></div><div class="field"><label for="akEmail">Email</label><input class="input" id="akEmail" name="email" type="email" required></div></div>
      <div class="field"><label for="akProdi">Prodi</label><input class="input" id="akProdi" name="prodi" required></div>
      <div class="field"><label>Peran</label><div class="chips">${Object.entries(ROLES).map(([k, r]) => `<label class="chip c-${r.color} ${k === 'anggota' ? 'on' : ''}"><input type="checkbox" name="peran" value="${k}" ${k === 'anggota' ? 'checked' : ''} data-live="rolechip" style="position:absolute;opacity:0;width:0">${r.label}</label>`).join('')}</div><span class="hint">Kata sandi awal dikirim ke email. Untuk demo: kopma123.</span></div>
    </form>`, 'mint', `<button class="btn btn-ghost" data-act="close-modal">Batal</button><button class="btn btn-primary" form="akunForm" type="submit">Buat akun</button>`),
  'peran-form': (el) => {
    const p = prof(el.dataset.id); const rs = rolesOf(p.id);
    openModal(`Peran ${esc(p.nama.split(' ')[0])}`, `<form class="form" data-form="peran" id="peranForm"><input type="hidden" name="id" value="${p.id}">
      <p class="muted">Satu akun boleh punya lebih dari satu peran. Periode ${PERIODE}.</p>
      <div class="chips">${Object.entries(ROLES).map(([k, r]) => `<label class="chip c-${r.color} ${rs.includes(k) ? 'on' : ''}"><input type="checkbox" name="peran" value="${k}" ${rs.includes(k) ? 'checked' : ''} data-live="rolechip" style="position:absolute;opacity:0;width:0">${r.label}</label>`).join('')}</div></form>`, 'mint',
      `<button class="btn btn-ghost" data-act="close-modal">Batal</button><button class="btn btn-primary" form="peranForm" type="submit">Simpan peran</button>`);
  },
  'akun-toggle': (el) => { const p = prof(el.dataset.id); p.aktif = !p.aktif; commit(`Akun ${esc(p.nama)} ${p.aktif ? 'diaktifkan' : 'dinonaktifkan'}`, p.aktif ? 'mint' : 'coral', 'akun', `Akun ${p.nama} ${p.aktif ? 'diaktifkan' : 'dinonaktifkan'}`); },
  'ganti-periode': () => {
    const n = db.peran.filter((r) => r.aktif && !['anggota', 'super_admin'].includes(r.peran)).length;
    confirmBox('Tutup periode kepengurusan?', `${n} peran pengurus periode ${PERIODE} akan dicabut sekaligus. Akun, poin, fee, dan riwayat tetap tersimpan. Peran super admin dan anggota tidak ikut dicabut.`, 'Cabut peran pengurus', () => {
      db.peran.forEach((r) => { if (r.aktif && !['anggota', 'super_admin'].includes(r.peran)) r.aktif = false; });
      commit(`${n} peran pengurus dicabut. Atur peran pengurus baru lewat tombol Peran.`, 'grape', 'akun', `Menutup periode ${PERIODE}: ${n} peran pengurus dicabut`);
    });
  },
  'set-min': (el) => {
    const b = martItems().find((x) => x.id === el.dataset.id);
    openModal('Batas minimum', `<form class="form" data-form="setmin" id="minForm"><input type="hidden" name="id" value="${esc(b.id)}"><p class="muted">${esc(b.nama)} · stok sekarang <b class="num">${b.stok}</b>. Di bawah angka ini, barang masuk daftar perlu belanja. Disimpan di Kopma Hub, data kasir tidak berubah.</p><div class="field"><label for="minVal">Batas minimum</label><input class="input input-lg num" id="minVal" name="min" type="number" min="0" value="${b.min}" required></div></form>`, 'lime', `<button class="btn btn-ghost" data-act="close-modal">Batal</button><button class="btn btn-primary" form="minForm" type="submit">Simpan</button>`);
  },
  'kasir-putus': () => confirmBox('Putuskan dari web kasir?', 'Kopma Hub akan kembali menampilkan data contoh. Data di kasir tidak terpengaruh.', 'Putuskan', async () => { closeModal(); await Kasir.disconnect(); toast('Sambungan ke kasir diputus', 'sky'); }),
  'kasir-backup': async (el) => {
    el.disabled = true; el.textContent = 'Mengambil data…';
    try {
      const data = await Kasir.backup();
      const json = JSON.stringify(data, null, 1);
      const n = Object.entries(data.koleksi).map(([k, v]) => `${k}: ${v.length}`).join(' · ');
      catat('stok', `Cadangan data kasir diunduh (${n})`); save();
      const blob = new Blob([json], { type: 'application/json' }); const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = `cadangan-kasir-${TODAY}.json`; document.body.appendChild(a); a.click(); a.remove();
      render(); toast(`Cadangan diunduh · ${n}`, 'mint');
    } catch (e) { render(); toast(Kasir._pesan(e), 'coral'); }
  },
  'jejak-mod': (el) => { ui.jejakModul = el.dataset.k; render(); },

  export: (el) => {
    const k = el.dataset.kind;
    const T = {
      anggota: isLive() ? [['Nama', 'NIA', 'Fakultas', 'Prodi', 'Status', 'Bidang', 'Angkatan', 'WA', 'Aktif'], Kasir.anggota.map((a) => [a.nama, a.nia, a.fakultas || '', a.prodi || '', a.status, a.bidang || '', a.angkatan || '', a.wa || '', a.aktif === false ? 'Tidak' : 'Ya'])] : [['Nama', 'NIA', 'Prodi', 'Angkatan', 'WA', 'Status', 'Bidang', 'Pendamping', 'Simpanan lunas'], db.profil.map((p) => [p.nama, p.nia, p.prodi, p.angkatan, p.wa, p.status, p.bidang || '', p.pendampingId ? prof(p.pendampingId).nama : '', simpananLunas(p.id) ? 'Ya' : 'Belum'])],
      stok: [['Barang', 'Kategori', 'Harga beli', 'Harga jual', 'Stok', 'Minimum'], martItems().map((b) => [b.nama, b.kategori, b.hargaBeli, b.hargaJual, b.stok, b.min])],
      booking: [['Penyewa', 'WA', 'Barang', 'Unit', 'Ambil', 'Kembali', 'Total', 'Status'], db.booking.map((b) => [b.penyewa, b.wa, db.barangSewa.find((x) => x.id === b.barangId).nama, b.unit, b.ambil, b.kembali, b.total, b.status])],
      poin: Kasir.on ? [['NIA', 'Nama', 'Jumlah belanja', 'Total belanja', 'Poin', 'Terakhir belanja'], [...Kasir.poinPer(db.pengaturan.rpPerPoin).values()].map((d) => [d.nia, anggotaByNia(d.nia)?.nama || '', d.n, d.belanja, d.poin, d.terakhir])] : [['Anggota', 'NIA', 'Belanja', 'Poin', 'Alasan', 'Pencatat', 'Waktu'], db.poin.map((x) => [prof(x.userId).nama, prof(x.userId).nia, x.belanja, x.poin, x.alasan, prof(x.olehId).nama, x.waktu])],
      fee: [['Penerima', 'Jenis', 'Kegiatan', 'Nominal', 'Tanggal', 'Dibayar'], db.fee.map((f) => [prof(f.userId).nama, f.jenis, f.kegiatan, f.nominal, f.tanggal, f.lunas ? 'Ya' : 'Belum'])],
    }[k];
    const csv = [T[0], ...T[1]].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    catat(k === 'booking' ? 'rental' : k, `Ekspor CSV ${k}`); save();
    openModal(`Ekspor ${k}.csv`, `<p class="muted small" style="margin-bottom:10px">${T[1].length} baris. Salin lalu tempel ke spreadsheet, atau unduh filenya.</p><textarea class="csv" id="csvText" readonly>${esc(csv)}</textarea>`, 'sky',
      `<button class="btn btn-ghost" data-act="csv-copy">Salin</button><button class="btn btn-primary" data-act="csv-dl" data-name="kopma-${k}-${TODAY}.csv">${ic('download', 'icon-sm')}Unduh</button>`);
  },
  'csv-copy': () => { const t = $('#csvText'); navigator.clipboard?.writeText(t.value).then(() => toast('CSV disalin', 'sky'), () => { t.select(); toast('Teks dipilih, tekan salin', 'sun'); }) ?? (t.select()); },
  'csv-dl': (el) => { const blob = new Blob(['﻿' + $('#csvText').value], { type: 'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = el.dataset.name; document.body.appendChild(a); a.click(); a.remove(); },
};

function confirmBox(title, text, yes, fn) {
  openModal(title, `<p class="muted">${text}</p>`, 'coral', `<button class="btn btn-ghost" data-act="close-modal">Batal</button><button class="btn btn-primary" id="confirmYes">${yes}</button>`);
  $('#confirmYes').addEventListener('click', fn);
}

/* ================= Input live ================= */
function startTimer() { if (!ui.poinTimer) ui.poinTimer = Date.now(); }
setInterval(() => { const t = $('#poinTimer'); if (t && ui.poinTimer) { const s = Math.round((Date.now() - ui.poinTimer) / 1000); t.textContent = `${s} dtk`; t.parentElement && t.classList.toggle('c-coral', s > 30); t.classList.toggle('c-mint', s <= 30); } }, 500);
function previewPoin() {
  const n = parseInt($('#nominalInput')?.value || '0', 10);
  const pts = Math.floor(n / db.pengaturan.rpPerPoin);
  $('#poinPreview').textContent = `+${fmtNum(pts)}`;
  $('#poinSubmit').disabled = !($('#poinUser').value && n > 0);
}
const LIVE = {
  anggota: (el) => { ui.q.anggota = el.value; $('#listAnggota').innerHTML = listAnggota(); },
  stok: (el) => { ui.q.stok = el.value; $('#listStok').innerHTML = listStok(); },
  akun: (el) => { ui.q.akun = el.value; const v = el.value; render(); const i = document.querySelector('[data-live="akun"]'); i.focus(); i.setSelectionRange(v.length, v.length); },
  booking: previewBooking,
  mutasi: previewMutasi,
  nia: (el) => {
    startTimer();
    $('#poinUser').value = '';
    const q = el.value.toLowerCase().trim();
    const res = q.length < 2 ? [] : db.profil.filter((p) => p.aktif && (p.nia.toLowerCase().includes(q) || p.nama.toLowerCase().includes(q))).slice(0, 5);
    $('#niaSuggest').innerHTML = res.map((p) => `<button type="button" class="row click c-grape" data-act="pilih-anggota" data-id="${p.id}" style="text-align:left;font:inherit">${avatar(p, 32)}<span class="grow"><span class="title" style="display:block">${esc(p.nama)}</span><span class="sub num">${esc(p.nia)}</span></span></button>`).join('') || (q.length >= 2 ? `<span class="small muted">Tidak ada anggota dengan NIA atau nama itu.</span>` : '');
    previewPoin();
  },
  nominal: () => { startTimer(); previewPoin(); },
  akunLive: (el) => { ui.q.akunLive = el.value; const v = el.value; render(); const i = document.querySelector('[data-live="akunLive"]'); if (i) { i.focus(); i.setSelectionRange(v.length, v.length); } },
  anggotaLive: (el) => { ui.q.anggotaLive = el.value; $('#listAnggotaLive').innerHTML = listAnggotaLive(); },
  ceknia: (el) => { ui.q.ceknia = el.value; $('#cekHasil').innerHTML = hasilCekNia(); },
  opname: () => {
    let n = 0, beda = 0;
    document.querySelectorAll('[data-live="opname"]').forEach((i) => {
      const id = i.name; const cell = $('#opd-' + id); const row = $('#op-' + id);
      if (i.value === '') { cell.textContent = '–'; row.classList.remove('diff'); return; }
      n++; const d = parseInt(i.value, 10) - Number(i.dataset.stok);
      cell.innerHTML = d === 0 ? '<span style="color:var(--mint-ink);font-weight:700">0</span>' : `<b style="color:var(--coral-ink)">${d > 0 ? '+' : ''}${d}</b>`;
      row.classList.toggle('diff', d !== 0); if (d !== 0) beda++;
    });
    $('#opSummary').textContent = n ? `${n} barang dihitung, ${beda} selisih (${Math.round((beda / db.barangMart.length) * 100)}% item).` : 'Belum ada yang dihitung.';
  },
  feemonth: (el) => { ui.feeMonth = el.value; render(); },
  rolechip: (el) => el.closest('.chip').classList.toggle('on', el.checked),
};

/* ================= Submit form ================= */
const FORM = {
  login: async (f) => {
    const btn = $('#loginBtn'); btn.disabled = true; btn.textContent = 'Memeriksa…'; ui.loginError = '';
    await Kasir.connect(f.id.value.trim(), f.pass.value);
    if (Kasir.status === 'error') { btn.disabled = false; btn.textContent = 'Masuk'; $('#loginMsg').innerHTML = `<div class="notice c-coral">${ic('alert')}<span>${esc(Kasir.error)}</span></div>`; return; }
    meId = LIVE_ID; Store.setPref('me', LIVE_ID); location.hash = 'dasbor'; render();
  },
  daftar: async (f) => {
    const msg = $('#daftarMsg'); const err = (t) => { msg.innerHTML = `<div class="notice c-coral">${ic('alert')}<span>${esc(t)}</span></div>`; };
    const nia = normNia(f.nia.value); const user = f.user.value.trim();
    if (!/^[A-Z0-9.\-\/]{3,20}$/.test(nia)) return err('NIA hanya boleh huruf, angka, titik, strip, atau garis miring (3-20 karakter).');
    if (!/^[A-Za-z0-9._\-]{3,30}$/.test(user)) return err('Nama pengguna 3-30 karakter: huruf, angka, titik, strip, atau garis bawah, tanpa spasi.');
    if (f.pass.value !== f.pass2.value) return err('Kedua kata sandi tidak sama.');
    const btn = $('#daftarBtn'); btn.disabled = true; btn.textContent = 'Mendaftarkan…';
    await Kasir.daftar({ kode: f.kode.value, nia, username: user, pass: f.pass.value });
    if (Kasir.status === 'error') { btn.disabled = false; btn.textContent = 'Daftar'; return err(Kasir.error); }
    ui.daftar = false; meId = LIVE_ID; Store.setPref('me', LIVE_ID); location.hash = 'dasbor'; render(); toast('Akun berhasil dibuat. Selamat datang!', 'grape');
  },
  hubungkanNia: async (f) => {
    const nia = normNia(f.nia.value); const btn = $('#hnBtn'); const msg = $('#hnMsg');
    if (!/^[A-Z0-9.\-\/]{3,20}$/.test(nia)) { msg.innerHTML = `<div class="notice c-coral">${ic('alert')}<span>Format NIA tidak sesuai.</span></div>`; return; }
    btn.disabled = true; btn.textContent = 'Menghubungkan…';
    try { await Kasir.hubungkanNia(nia); toast('NIA terhubung', 'sky'); render(); }
    catch (e) { btn.disabled = false; btn.textContent = 'Hubungkan NIA'; msg.innerHTML = `<div class="notice c-coral">${ic('alert')}<span>${esc(Kasir._pesan(e))}</span></div>`; }
  },
  peranLive: async (f) => {
    const hub = [...f.querySelectorAll('[name=peran]:checked')].map((i) => i.value); const btn = $('#plBtn'); btn.disabled = true; btn.textContent = 'Menyimpan…';
    try { await Kasir.ubahPeran(f.uid.value, hub); closeModal(); toast('Peran diperbarui', 'mint'); render(); }
    catch (e) { btn.disabled = false; btn.textContent = 'Simpan peran'; $('#plMsg').innerHTML = `<div class="notice c-coral">${ic('alert')}<span>${esc(Kasir._pesan(e))}</span></div>`; }
  },
  anggotaLive: async (f) => {
    const baru = f.baru.value === '1';
    if (f.sendiri.value === '1') {
      const data = { nia: normNia(f.nia.value), nama: f.nama.value.trim().replace(/\s+/g, ' '), fakultas: f.fakultas.value.trim(), prodi: f.prodi.value.trim(), angkatan: f.angkatan.value ? Number(f.angkatan.value) : null, wa: f.wa.value.trim() || null };
      const btn = $('#alSubmit'); btn.disabled = true; btn.textContent = 'Menyimpan…';
      try { await Kasir.simpanAnggota(data, false); closeModal(); toast('Datamu diperbarui', 'sky'); render(); }
      catch (e) { btn.disabled = false; btn.textContent = 'Simpan perubahan'; $('#alMsg').innerHTML = `<div class="notice c-coral">${ic('alert')}<span>${esc(Kasir._pesan(e))}</span></div>`; }
      return;
    }
    const data = { nama: f.nama.value.trim().replace(/\s+/g, ' '), nia: normNia(f.nia.value), fakultas: f.fakultas.value.trim(), prodi: f.prodi.value.trim(), status: f.status.value, bidang: f.bidang.value.trim() || null, angkatan: f.angkatan.value ? Number(f.angkatan.value) : null, wa: f.wa.value.trim() || null };
    if (!baru) data.aktif = !!f.aktif?.checked;
    const msg = $('#alMsg'); const err = (t) => { msg.innerHTML = `<div class="notice c-coral">${ic('alert')}<span>${esc(t)}</span></div>`; };
    if (data.nama.length < 2) return err('Nama minimal 2 huruf.');
    if (!/^[A-Z0-9.\-\/]{3,20}$/.test(data.nia)) return err('NIA hanya boleh huruf, angka, titik, strip, atau garis miring (3-20 karakter).');
    const btn = $('#alSubmit'); btn.disabled = true; btn.textContent = 'Menyimpan…';
    try {
      await Kasir.simpanAnggota(data, baru);
      closeModal(); toast(baru ? `${esc(data.nama)} ditambahkan` : `Data ${esc(data.nama)} diperbarui`, 'sky');
      if (baru) { ui.q.anggotaLive = ''; ui.anggotaLiveFilter = 'semua'; }
      render();
    } catch (e) { btn.disabled = false; btn.textContent = baru ? 'Tambah anggota' : 'Simpan perubahan'; err(Kasir._pesan(e)); }
  },
  lupa: (f) => { closeModal(); toast(`Tautan atur ulang dikirim ke ${esc(f.email.value)} (simulasi)`, 'sky'); },
  booking: (f) => {
    previewBooking(); if ($('#bkSubmit').disabled) return;
    const item = db.barangSewa.find((b) => b.id === f.barangId.value); const unit = parseInt(f.unit.value, 10);
    const b = { id: uid('bk'), penyewa: f.penyewa.value.trim(), wa: f.wa.value.trim(), barangId: item.id, unit, ambil: f.ambil.value, kembali: f.kembali.value, total: hitungBiaya(item, f.ambil.value, f.kembali.value, unit), status: f.status.value, olehId: meId, waktu: nowIso() };
    db.booking.push(b); ui.rentalItem = item.id; ui.calMonth = b.ambil.slice(0, 7);
    commit(`Booking ${esc(b.penyewa)} tersimpan · ${rp(b.total)}`, 'tangerine', 'rental', `Booking baru: ${b.penyewa}, ${item.nama} ×${unit}, ${b.ambil} → ${b.kembali} (${rp(b.total)})`);
  },
  mutasi: (f) => {
    const b = db.barangMart.find((x) => x.id === f.barangId.value); const n = parseInt(f.jumlah.value, 10); const j = f.jenis.value;
    if (!n || (j === 'keluar' && n > b.stok)) return;
    b.stok += j === 'masuk' ? n : -n;
    db.mutasi.push({ id: uid('mt'), barangId: b.id, jenis: j, jumlah: n, alasan: f.alasan.value, olehId: meId, waktu: nowIso() });
    commit(`${esc(b.nama)}: ${j === 'masuk' ? '+' : '−'}${n} · stok ${b.stok}`, 'lime', 'stok', `${j === 'masuk' ? 'Barang masuk' : 'Barang keluar'} ${b.nama} ${n} (${f.alasan.value}), stok jadi ${b.stok}`);
  },
  barang: (f) => {
    const b = { id: uid('m'), nama: f.nama.value.trim(), kategori: f.kategori.value.trim(), hargaBeli: +f.hargaBeli.value, hargaJual: +f.hargaJual.value, stok: +f.stok.value, min: +f.min.value };
    db.barangMart.push(b);
    if (b.stok) db.mutasi.push({ id: uid('mt'), barangId: b.id, jenis: 'masuk', jumlah: b.stok, alasan: 'Stok awal', olehId: meId, waktu: nowIso() });
    commit(`${esc(b.nama)} ditambahkan`, 'lime', 'stok', `Barang baru ${b.nama} (stok awal ${b.stok})`);
  },
  opname: (f) => {
    let n = 0;
    db.barangMart.forEach((b) => {
      const v = f[b.id].value; if (v === '') return;
      const fisik = parseInt(v, 10); const d = fisik - b.stok;
      if (d !== 0) { db.mutasi.push({ id: uid('mt'), barangId: b.id, jenis: 'opname', jumlah: d, alasan: 'Stock opname', olehId: meId, waktu: nowIso() }); b.stok = fisik; n++; }
    });
    ui.stokTab = 'riwayat';
    commit(n ? `Opname tersimpan, ${n} barang disesuaikan` : 'Opname tersimpan, semua cocok', 'grape', 'stok', `Stock opname: ${n} barang disesuaikan`);
  },
  sewa: (f) => {
    const data = { nama: f.nama.value.trim(), spek: f.spek.value.trim(), unit: +f.unit.value, batasHari: +f.batasHari.value, harga24: +f.harga24.value, harga2: +f.harga2.value };
    if (f.id.value) { Object.assign(db.barangSewa.find((x) => x.id === f.id.value), data); commit('Barang sewa diperbarui', 'tangerine', 'rental', `Ubah barang sewa ${data.nama}`); }
    else { const warna = AV_COLORS[db.barangSewa.length % AV_COLORS.length]; db.barangSewa.push({ id: uid('r'), warna, ...data }); commit(`${esc(data.nama)} ditambahkan`, 'tangerine', 'rental', `Barang sewa baru ${data.nama}`); }
  },
  poin: (f, ev) => {
    const u = f.userId.value; const n = parseInt(f.nominal.value, 10); if (!u || !n) return;
    const pts = Math.floor(n / db.pengaturan.rpPerPoin);
    db.poin.push({ id: uid('p'), userId: u, belanja: n, poin: pts, alasan: 'Belanja Kopma Mart', olehId: meId, waktu: nowIso() });
    const s = ui.poinTimer ? Math.round((Date.now() - ui.poinTimer) / 1000) : null; ui.poinTimer = null;
    const btn = $('#poinSubmit').getBoundingClientRect();
    commit(`+${pts} poin untuk ${esc(prof(u).nama.split(' ')[0])}${s !== null ? ` · ${s} detik` : ''}`, 'grape', 'poin', `Belanja ${prof(u).nama} ${rp(n)} → +${pts} poin`);
    confetti(btn.left + btn.width / 2, btn.top);
  },
  koreksi: (f) => {
    const n = parseInt(f.poin.value, 10); if (!n) return;
    db.poin.push({ id: uid('p'), userId: f.userId.value, belanja: 0, poin: n, alasan: 'Koreksi: ' + f.alasan.value.trim(), olehId: meId, waktu: nowIso() });
    commit('Koreksi poin tersimpan', 'sun', 'poin', `Koreksi poin ${prof(f.userId.value).nama} ${n > 0 ? '+' : ''}${n}: ${f.alasan.value.trim()}`);
  },
  kasir: async (f) => { await Kasir.connect(f.email.value.trim(), f.pass.value); if (Kasir.status === 'on' || Kasir.status === 'connecting') catat('stok', 'Menyambungkan Kopma Hub ke data web kasir (baca saja)'); save(); },
  setmin: (f) => { const v = Math.max(0, parseInt(f.min.value, 10) || 0); Store.setPref(Kasir.minKey(f.id.value), String(v)); const b = martItems().find((x) => x.id === f.id.value); commit(`Batas minimum ${esc(b.nama)}: ${v}`, 'lime', 'stok', `Batas minimum ${b.nama} → ${v}`); },
  rumus: (f) => { const v = parseInt(f.rate.value, 10); if (!v) return; const lama = db.pengaturan.rpPerPoin; db.pengaturan.rpPerPoin = v; commit(`Rumus baru: ${rp(v)} = 1 poin`, 'sun', 'poin', `Ubah rumus poin ${rp(lama)} → ${rp(v)} per poin`); },
  fee: (f) => {
    const x = { id: uid('f'), userId: f.userId.value, jenis: f.jenis.value, kegiatan: f.kegiatan.value.trim(), nominal: +f.nominal.value, tanggal: f.tanggal.value, lunas: f.lunas.value === '1', olehId: meId };
    db.fee.push(x); commit(`Fee ${rp(x.nominal)} untuk ${esc(prof(x.userId).nama.split(' ')[0])} tercatat`, 'pink', 'fee', `Fee ${x.jenis} ${prof(x.userId).nama}: ${x.kegiatan} ${rp(x.nominal)}`);
  },
  anggota: (f) => {
    const data = { nama: f.nama.value.trim(), nia: normNia(f.nia.value), angkatan: +f.angkatan.value, prodi: f.prodi.value.trim(), wa: f.wa.value.trim(), status: f.status.value, bidang: f.bidang.value.trim() || null, pendampingId: f.pendampingId.value || null };
    const dup = db.profil.find((p) => p.nia === data.nia && p.id !== f.id.value);
    if (dup) { toast(`NIA ${esc(data.nia)} sudah dipakai ${esc(dup.nama)}`, 'coral'); return; }
    if (f.id.value) { Object.assign(prof(f.id.value), data); commit('Data anggota diperbarui', 'sky', 'anggota', `Ubah data ${data.nama}`); }
    else {
      const id = uid('u'); db.profil.push({ id, ...data, email: data.nama.split(' ')[0].toLowerCase() + '.' + data.nia.slice(-3) + '@kopma.um.ac.id', bergabung: TODAY, aktif: true });
      db.peran.push({ userId: id, peran: 'anggota', periode: PERIODE, aktif: true });
      db.simpanan.push({ id: uid('s'), userId: id, jenis: 'pokok', nominal: 50000, tanggal: TODAY, lunas: false }, { id: uid('s'), userId: id, jenis: 'wajib', nominal: 10000, tanggal: TODAY, lunas: false });
      commit(`${esc(data.nama)} terdaftar sebagai anggota`, 'sky', 'anggota', `Anggota baru ${data.nama} (${data.nia})`);
    }
  },
  akun: (f) => {
    const nia = normNia(f.nia.value); if (db.profil.find((p) => p.nia === nia)) { toast('NIA sudah terdaftar', 'coral'); return; }
    const id = uid('u'); const peran = [...f.querySelectorAll('[name=peran]:checked')].map((i) => i.value);
    db.profil.push({ id, nama: f.nama.value.trim(), nia, email: f.email.value.trim(), prodi: f.prodi.value.trim(), angkatan: new Date().getFullYear(), wa: '', status: peran.some((r) => r !== 'anggota') ? 'pengurus' : 'anggota', bidang: null, pendampingId: null, bergabung: TODAY, aktif: true });
    peran.forEach((r) => db.peran.push({ userId: id, peran: r, periode: PERIODE, aktif: true }));
    db.simpanan.push({ id: uid('s'), userId: id, jenis: 'pokok', nominal: 50000, tanggal: TODAY, lunas: false });
    commit(`Akun ${esc(f.nama.value.trim())} dibuat`, 'mint', 'akun', `Akun baru ${f.nama.value.trim()} dengan peran ${peran.map((r) => ROLES[r].label).join(', ')}`);
  },
  peran: (f) => {
    const id = f.id.value; const pilih = [...f.querySelectorAll('[name=peran]:checked')].map((i) => i.value);
    if (id === meId && !pilih.includes('super_admin')) { toast('Kamu tidak bisa mencabut super admin dari akunmu sendiri', 'coral'); return; }
    db.peran.forEach((r) => { if (r.userId === id && r.aktif && !pilih.includes(r.peran)) r.aktif = false; });
    pilih.forEach((r) => { if (!rolesOf(id).includes(r)) db.peran.push({ userId: id, peran: r, periode: PERIODE, aktif: true }); });
    commit('Peran diperbarui', 'mint', 'akun', `Peran ${prof(id).nama}: ${pilih.map((r) => ROLES[r].label).join(', ') || '—'}`);
  },
};

/* ================= Event wiring ================= */
document.addEventListener('click', (e) => {
  const back = e.target.id === 'modalBack' ? e.target : null;
  if (back) { closeModal(); return; }
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const fn = ACT[el.dataset.act];
  if (!fn) return;
  if (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button') e.preventDefault();
  fn(el, e);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"][data-act]')) { e.preventDefault(); e.target.click(); }
});
document.addEventListener('input', (e) => { const k = e.target.dataset?.live; if (k && LIVE[k]) LIVE[k](e.target); });
document.addEventListener('change', (e) => { const k = e.target.dataset?.live; if (k && (e.target.tagName === 'SELECT' || e.target.type === 'checkbox' || e.target.type === 'date') && LIVE[k]) LIVE[k](e.target); });
document.addEventListener('submit', (e) => { const f = e.target; const k = f.dataset.form; if (!k) return; e.preventDefault(); FORM[k](f, e); });
window.addEventListener('hashchange', () => { closeModal(); render(); window.scrollTo(0, 0); });

/* ================= Mulai ================= */
(() => {
  const t = Store.getPref('theme', ''); if (t) document.documentElement.dataset.theme = t;
  if (meId === '') meId = null;
  Kasir.onChange = () => {
    if (isLive() && !Kasir.on) { if (!$('#loginForm')) render(); return; }
    if (!me() || !['stok', 'dasbor', 'poin', 'anggota', 'akun'].includes(ui.view) || $('#modalBack')) return;
    const a = document.activeElement;
    if (a && a.matches('input, select, textarea') && $('#main')?.contains(a)) { if ($('#listStok')) $('#listStok').innerHTML = listStok(); if ($('#listAnggotaLive')) $('#listAnggotaLive').innerHTML = listAnggotaLive(); return; }
    render();
  };
  Kasir.resume(); // memulihkan sesi login dulu (langsung berstatus "connecting"), baru menggambar halaman
  render();
})();
