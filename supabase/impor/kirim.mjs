import { ProxyAgent, setGlobalDispatcher } from 'undici';
setGlobalDispatcher(new ProxyAgent(process.env.HTTPS_PROXY));
import { createClient } from '@supabase/supabase-js'; import fs from 'node:fs';
const D = process.argv[2]; const TOKEN = fs.readFileSync(D + '/token.txt', 'utf8').trim();
const sb = createClient('https://uggwjrbialdivyegydia.supabase.co', 'sb_publishable_0vUFj-TLhkV-6VPs7wYZ0Q__QUn_u3G', { auth: { persistSession: false } });
for (const [jenis, ukuran] of [['anggota', 100], ['akun', 50], ['produk', 100], ['transaksi', 100], ['modal', 100]]) {
  const isi = JSON.parse(fs.readFileSync(`${D}/muatan/${jenis}.json`, 'utf8'));
  let hasil = 0;
  for (let i = 0; i < isi.length; i += ukuran) {
    const { data, error } = await sb.rpc('impor_kopma_sementara', { p_token: TOKEN, p_jenis: jenis, p_data: isi.slice(i, i + ukuran) });
    if (error) { console.log(`GAGAL ${jenis} bagian ${i}: ${error.message}`); process.exit(1); }
    hasil = data;
  }
  console.log(`${jenis.padEnd(10)} dikirim ${isi.length} → hasil ${hasil}`);
}
