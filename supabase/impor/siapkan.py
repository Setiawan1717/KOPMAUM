# Ubah ekspor Firebase menjadi muatan impor Supabase. ID tetap (uuid5) supaya impor ulang tidak dobel.
import json, uuid, sys, re, datetime
D = sys.argv[1]
fs = json.load(open(f'{D}/data/firestore.json'))['koleksi']
import os
# akun.json & signer_key.txt hanya perlu saat ada akun baru / kata sandi berubah; tanpa itu akun dilewati
ADA_AKUN = os.path.exists(f'{D}/data/akun.json') and os.path.exists(f'{D}/data/signer_key.txt')
akun_fb = json.load(open(f'{D}/data/akun.json'))['users'] if ADA_AKUN else []
SIGNER = open(f'{D}/data/signer_key.txt').read().strip() if ADA_AKUN else ''
HASH = dict(n=14, r=8, ss='Bw==')     # mem_cost 14, rounds 8, salt separator Bw==
uid = lambda jenis, x: str(uuid.uuid5(uuid.NAMESPACE_URL, f'kopma-um/firebase/{jenis}/{x}'))
ms = lambda v: datetime.datetime.fromtimestamp(int(v) / 1000, datetime.timezone.utc).isoformat() if v else None
angka = lambda v: int(round(float(v))) if v not in (None, '') else 0
laporan = []

users = {u['_id']: u for u in fs['users']}
PERAN = {'ketua', 'sekretaris', 'bendahara', 'bidang_usaha', 'petugas_jaga', 'pengurus'}
akun, anggota, lewati = [], [], []
for a in akun_fb:
    u = users.get(a['localId'])
    if not u: lewati.append(a['email'].split('@')[0]); continue
    hub = u.get('hub') or []
    if isinstance(hub, str): hub = [hub]
    hub = [h.strip().lower() for h in hub if h and h.strip().lower() in PERAN]
    nia = (u.get('nia') or '').replace(' ', '').upper() or None
    if nia: anggota.append({'nia': nia, 'nama': u.get('nama') or u['username'], 'status': 'pengurus' if hub else 'anggota'})
    akun.append({'id': uid('akun', a['localId']), 'email': a['email'], 'username': u['username'], 'role': u.get('role') or 'anggota', 'hub': hub,
                 'nama': u.get('nama') or '', 'nia': nia, 'dibuat': ms(a.get('createdAt')), 'masuk': ms(a.get('lastSignedInAt')),
                 'hash': f"$fbscrypt$v=1,n={HASH['n']},r={HASH['r']},p=1,ss={HASH['ss']},sk={SIGNER}${a['salt']}${a['passwordHash']}"})
# tautan transaksi → akun kasir: ID akun sama dengan impor sebelumnya (uuid5 dari ID Firebase di dokumen users)
idakun = {u['username']: uid('akun', u['_id']) for u in fs['users']}
if not ADA_AKUN:   # anggota untuk NIA akun tetap disiapkan walau akun tidak diimpor ulang
    for u in fs['users']:
        nia = (u.get('nia') or '').replace(' ', '').upper()
        if nia: anggota.append({'nia': nia, 'nama': u.get('nama') or u['username'], 'status': 'pengurus' if u.get('hub') else 'anggota'})

produk = []
for p in fs['products']:
    stok = angka(p.get('stok'))
    if stok < 0: laporan.append(f"stok {p['nama']} {stok} → 0"); stok = 0
    bm = p.get('batasMinimum')
    produk.append({'id': uid('produk', p['_id']), 'nama': p['nama'], 'kategori': p.get('kategori') or 'Lainnya', 'barcode': p.get('barcode') or '',
                   'harga_modal': angka(p.get('hargaModal')), 'harga_jual': angka(p.get('hargaJual')), 'stok': stok,
                   'batas_minimum': int(bm) if isinstance(bm, (int, float)) and bm >= 0 else None})
ada_produk = {p['_id'] for p in fs['products']}

trx = []
for t in fs['transactions']:
    nia = (t.get('niaAnggota') or '').replace(' ', '').upper()
    if nia and not re.match(r'^[A-Z0-9./-]{3,20}$', nia): nia = ''
    item = [{'produk_id': uid('produk', i['id']) if i.get('id') in ada_produk else None, 'nama': i.get('nama') or '(tanpa nama)', 'kategori': i.get('kategori'),
             'harga_jual': angka(i.get('hargaJual')), 'harga_modal': angka(i.get('hargaModal')), 'qty': angka(i.get('qty'))} for i in (t.get('item') or [])]
    if isinstance(t.get('diskon'), str): laporan.append(f"diskon teks {t['diskon']!r} → 0 ({t['tanggal']})")
    trx.append({'id': uid('trx', t['_id']), 'tanggal': t['tanggal'], 'kasir': t.get('kasir') or 'kasir', 'kasir_id': idakun.get(t.get('kasir')),
                'nia': nia, 'subtotal': angka(t.get('subtotal')), 'diskon': angka(t.get('diskon')), 'total': angka(t.get('total')),
                'metode': t.get('metodeBayar') or 'Tunai', 'uang_diterima': angka(t.get('uangDiterima')),
                'nomor_antrian': angka(t.get('nomorAntrian')) if t.get('nomorAntrian') not in (None, '') else None, 'item': item})

modal = [{'tanggal': m.get('tanggal') or m['_id'], 'modal_cash': angka(m.get('modalCash')), 'modal_qris': angka(m.get('modalQris')),
          'oleh': m.get('diupdateOleh') or 'impor', 'updated_at': m.get('updatedAt')} for m in fs['modal_harian']]

for nama, isi in [('anggota', anggota), ('akun', akun), ('produk', produk), ('transaksi', trx), ('modal', modal)]:
    json.dump(isi, open(f'{D}/muatan/{nama}.json', 'w'))
ringkas = {'akun': len(akun), 'akun_dilewati': lewati, 'anggota_dibuat': len(anggota), 'produk': len(produk), 'transaksi': len(trx),
           'item': sum(len(t['item']) for t in trx), 'item_tanpa_produk': sum(1 for t in trx for i in t['item'] if not i['produk_id']),
           'total_rp': sum(t['total'] for t in trx), 'modal': len(modal), 'catatan': laporan}
json.dump(ringkas, open(f'{D}/muatan/ringkas.json', 'w'))
print(json.dumps(ringkas, ensure_ascii=False, indent=1))
