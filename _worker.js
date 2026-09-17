// sonersoylu.com — Pages advanced mode worker
// Statik dosyalar ASSETS'ten servis edilir.
// /api/abone  → e-posta kaydı (KV)
// /api/arama  → sonuç bulunamayan aramaların kaydı (KV)
// /api/ruzgar → Open-Meteo tahmin verisi (uçta 15 dk önbellekli)
// /api/soru   → sahadan gelen soruların kaydı (KV)
// /api/olcum  → sayfa içi davranış sayaçları (KV, anonim ve toplu)
// /api/olcum/rapor → sayaçların özeti (anahtarla korumalı)
// www.sonersoylu.com → sonersoylu.com kalıcı yönlendirme (SEO: tek kanonik alan adı)

const MAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Rüzgâr sayfasının sabit saha listesi. Serbest koordinat kabul edilmez:
// hem kötüye kullanımı hem de adres satırında konum taşınmasını engeller.
const SAHALAR = {
  aliaga:   [38.85, 27.00],
  bergama:  [39.12, 27.30],
  cesme:    [38.55, 26.50],
  bandirma: [40.30, 27.90],
  bozcaada: [39.83, 26.05],
  datca:    [36.72, 27.70],
  bahce:    [37.20, 36.55],
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.hostname === 'www.sonersoylu.com') {
      url.hostname = 'sonersoylu.com';
      return Response.redirect(url.toString(), 301);
    }

    if (url.pathname === '/api/abone') {
      if (request.method === 'POST') return aboneKaydet(request, env);
      if (request.method === 'GET') return json({ ok: true, bilgi: 'POST ile e-posta gonderin' });
      return json({ ok: false, hata: 'yontem-desteklenmiyor' }, 405);
    }

    if (url.pathname === '/api/arama') {
      if (request.method === 'POST') return aramaKaydet(request, env);
      return json({ ok: false, hata: 'yontem-desteklenmiyor' }, 405);
    }

    if (url.pathname === '/api/ruzgar') {
      if (request.method === 'GET') return ruzgar(url);
      return json({ ok: false, hata: 'yontem-desteklenmiyor' }, 405);
    }

    if (url.pathname === '/api/soru') {
      if (request.method === 'POST') return soruKaydet(request, env);
      return json({ ok: false, hata: 'yontem-desteklenmiyor' }, 405);
    }

    if (url.pathname === '/api/olcum') {
      if (request.method === 'POST') return olcumKaydet(request, env);
      return json({ ok: false, hata: 'yontem-desteklenmiyor' }, 405);
    }

    if (url.pathname === '/api/olcum/rapor') {
      if (request.method === 'GET') return olcumRapor(url, env);
      return json({ ok: false, hata: 'yontem-desteklenmiyor' }, 405);
    }

    return env.ASSETS.fetch(request);
  },
};

// ---------------------------------------------------------------- rüzgâr
async function ruzgar(url) {
  const k = String(url.searchParams.get('s') || '').toLowerCase();
  const yer = SAHALAR[k];
  if (!yer) return json({ ok: false, hata: 'bilinmeyen-saha' }, 400);

  const u = new URL('https://api.open-meteo.com/v1/forecast');
  u.searchParams.set('latitude', String(yer[0]));
  u.searchParams.set('longitude', String(yer[1]));
  u.searchParams.set('current',
    'wind_speed_10m,wind_speed_80m,wind_speed_120m,wind_direction_120m,wind_gusts_10m,' +
    'temperature_2m,pressure_msl,weather_code,is_day');
  u.searchParams.set('hourly',
    'wind_speed_120m,wind_speed_80m,wind_direction_120m,temperature_2m,pressure_msl,weather_code');
  // günlük satırlar 10 günlük tahmin panelini besliyor; göbek yüksekliğindeki
  // en düşük–en yüksek rüzgârı saatlik seriden kendimiz hesaplıyoruz.
  u.searchParams.set('daily',
    'weather_code,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant,' +
    'temperature_2m_max,temperature_2m_min,sunrise,sunset');
  u.searchParams.set('wind_speed_unit', 'ms');
  u.searchParams.set('timezone', 'Europe/Istanbul');
  u.searchParams.set('forecast_days', '10');

  try {
    const r = await fetch(u.toString(), {
      cf: { cacheTtl: 900, cacheEverything: true },
      headers: { accept: 'application/json' },
    });
    if (!r.ok) return json({ ok: false, hata: 'kaynak-hatasi' }, 502);
    const d = await r.json();
    return new Response(JSON.stringify(d), {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'public, max-age=600',
        'x-veri-kaynagi': 'open-meteo.com (CC BY 4.0)',
      },
    });
  } catch {
    return json({ ok: false, hata: 'ulasilamadi' }, 502);
  }
}

// ---------------------------------------------------------------- soru
async function soruKaydet(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ ok: false, hata: 'gecersiz-istek' }, 400); }

  const soru = String(body.soru || '').trim().slice(0, 1200);
  const ad = String(body.ad || '').trim().slice(0, 60);
  const eposta = String(body.eposta || '').trim().toLowerCase().slice(0, 190);
  const konu = String(body.konu || 'genel').slice(0, 30);
  const kapan = String(body.website || '');           // bot tuzağı: dolu geliyorsa bot

  if (kapan) return json({ ok: true });               // sessizce yut
  if (soru.length < 15) return json({ ok: false, hata: 'kisa-soru' }, 400);
  if (eposta && !MAIL.test(eposta)) return json({ ok: false, hata: 'gecersiz-eposta' }, 400);
  if (!env.ABONE) return json({ ok: false, hata: 'depolama-yok' }, 503);

  // basit hız sınırı: aynı IP'den saatte 5 soru
  const ip = request.headers.get('cf-connecting-ip') || '';
  const kova = 'hiz:soru:' + (await ozet(ip)) + ':' + Math.floor(Date.now() / 3600000);
  try {
    const n = parseInt((await env.ABONE.get(kova)) || '0', 10);
    if (n >= 5) return json({ ok: false, hata: 'cok-fazla' }, 429);
    await env.ABONE.put(kova, String(n + 1), { expirationTtl: 7200 });
  } catch { /* sayaç yazılamazsa soruyu yine de al */ }

  const id = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14) + '-' +
             Math.random().toString(36).slice(2, 7);
  try {
    await env.ABONE.put('soru:' + id, JSON.stringify({
      id, soru, ad, eposta, konu,
      tarih: new Date().toISOString(),
      ulke: request.headers.get('cf-ipcountry') || '',
      durum: 'yeni',
    }));
    return json({ ok: true, id });
  } catch { return json({ ok: false, hata: 'yazilamadi' }, 500); }
}

// IP'yi ham hâliyle saklamamak için kısa özet
async function ozet(s) {
  const b = new TextEncoder().encode('ss:' + s);
  const h = await crypto.subtle.digest('SHA-256', b);
  return [...new Uint8Array(h)].slice(0, 6).map((x) => x.toString(16).padStart(2, '0')).join('');
}

// ---------------------------------------------------------------- abone
async function aboneKaydet(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ ok: false, hata: 'gecersiz-istek' }, 400); }

  const email = String(body.email || '').trim().toLowerCase();
  const kaynak = String(body.kaynak || 'site').slice(0, 40);

  if (!MAIL.test(email) || email.length > 190) return json({ ok: false, hata: 'gecersiz-eposta' }, 400);
  if (!env.ABONE) return json({ ok: false, hata: 'depolama-yok' }, 503);

  const kayit = {
    email, kaynak,
    tarih: new Date().toISOString(),
    ulke: request.headers.get('cf-ipcountry') || '',
  };

  try {
    await env.ABONE.put('abone:' + email, JSON.stringify(kayit));
    return json({ ok: true });
  } catch { return json({ ok: false, hata: 'yazilamadi' }, 500); }
}

// Aranıp bulunamayan kelimeler. Kişisel veri tutulmaz; sadece kelime ve sayaç.
async function aramaKaydet(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ ok: false }, 400); }

  const q = String(body.q || '').trim().toLowerCase().slice(0, 60);
  const nerede = String(body.nerede || 'sozluk').slice(0, 20);
  if (q.length < 2 || !/[a-zçğıöşü0-9]/i.test(q)) return json({ ok: false, hata: 'gecersiz' }, 400);
  if (!env.ABONE) return json({ ok: false, hata: 'depolama-yok' }, 503);

  const anahtar = 'arama:' + nerede + ':' + q;
  try {
    const eski = await env.ABONE.get(anahtar, { type: 'json' });
    const kayit = {
      q, nerede,
      sayi: (eski && eski.sayi ? eski.sayi : 0) + 1,
      ilk: (eski && eski.ilk) || new Date().toISOString(),
      son: new Date().toISOString(),
    };
    await env.ABONE.put(anahtar, JSON.stringify(kayit));
    return json({ ok: true });
  } catch { return json({ ok: false, hata: 'yazilamadi' }, 500); }
}

// ---------------------------------------------------------------- ölçüm
// Kişi bazlı kayıt yok: her istek yalnızca o günün sayaçlarına ekleniyor.
const SURE_KOVA = ['0-10', '10-30', '30-60', '60-180', '180+'];
const GUNLUK_TAVAN = 3000;                 // KV yazma bütçesini koruyan üst sınır

function art(o, k) { if (k) o[k] = (o[k] || 0) + 1; }

function temizEtiket(t) {
  return String(t || '').replace(/[^\w:/.#\-]/g, '').slice(0, 40);
}

function bugunKey() {
  return 'olcum:g:' + new Date().toISOString().slice(0, 10);
}

async function olcumKaydet(request, env) {
  let b;
  try { b = await request.json(); } catch { return json({ ok: false }, 400); }
  if (!env.ABONE) return new Response(null, { status: 204 });

  const yol = ('/' + String(b.yol || '/')).replace(/[^\w/\-]/g, '')
              .replace(/\/{2,}/g, '/').slice(0, 60) || '/';
  const derinlik = Math.max(0, Math.min(100, parseInt(b.derinlik, 10) || 0));
  const kova = derinlik >= 95 ? '100' : derinlik >= 75 ? '75'
             : derinlik >= 50 ? '50' : derinlik >= 25 ? '25' : '0';
  const sure = SURE_KOVA.indexOf(b.sure) >= 0 ? b.sure : '0-10';
  const bolum = String(b.bolum || '').replace(/[^\w\-]/g, '').slice(0, 30);
  const cihaz = b.cihaz === 'mobil' ? 'mobil' : 'masaustu';
  const tik = Array.isArray(b.tik) ? b.tik.slice(0, 12).map(temizEtiket).filter(Boolean) : [];

  try {
    const anahtar = bugunKey();
    const e = (await env.ABONE.get(anahtar, { type: 'json' })) ||
      { gun: anahtar.slice(-10), toplam: 0, yol: {}, derinlik: {}, sure: {}, bolum: {}, tik: {}, cihaz: {} };
    if (e.toplam >= GUNLUK_TAVAN) return new Response(null, { status: 204 });
    e.toplam += 1;
    art(e.yol, yol); art(e.derinlik, kova); art(e.sure, sure); art(e.cihaz, cihaz);
    art(e.bolum, bolum);
    for (const t of tik) art(e.tik, t);
    await env.ABONE.put(anahtar, JSON.stringify(e), { expirationTtl: 31536000 });
  } catch { /* ölçüm hiçbir zaman sayfayı etkilemez */ }
  return new Response(null, { status: 204 });
}

function birlestir(hedef, kaynak) {
  for (const k in kaynak) hedef[k] = (hedef[k] || 0) + kaynak[k];
}

async function olcumRapor(url, env) {
  if (!env.OLCUM_ANAHTAR) return json({ ok: false, hata: 'anahtar-tanimsiz' }, 503);
  if (url.searchParams.get('anahtar') !== env.OLCUM_ANAHTAR) {
    return json({ ok: false, hata: 'yetkisiz' }, 401);
  }
  if (!env.ABONE) return json({ ok: false, hata: 'depolama-yok' }, 503);

  const n = Math.min(90, Math.max(1, parseInt(url.searchParams.get('gun'), 10) || 30));
  const simdi = Date.now();
  const gunler = [];
  for (let i = 0; i < n; i++) gunler.push(new Date(simdi - i * 86400000).toISOString().slice(0, 10));

  const parcalar = await Promise.all(gunler.map((g) =>
    env.ABONE.get('olcum:g:' + g, { type: 'json' }).catch(() => null)));

  const top = { toplam: 0, yol: {}, derinlik: {}, sure: {}, bolum: {}, tik: {}, cihaz: {} };
  const seri = [];
  parcalar.forEach((p, i) => {
    seri.push({ gun: gunler[i], toplam: p ? p.toplam : 0 });
    if (!p) return;
    top.toplam += p.toplam || 0;
    ['yol', 'derinlik', 'sure', 'bolum', 'tik', 'cihaz'].forEach((k) => birlestir(top[k], p[k] || {}));
  });
  seri.reverse();

  // bulunamayan aramalar: ziyaretçinin aradığı ama sitede karşılığı olmayan kelimeler
  let aramalar = [];
  try {
    const l = await env.ABONE.list({ prefix: 'arama:', limit: 200 });
    const kayitlar = await Promise.all(l.keys.slice(0, 60).map((k) =>
      env.ABONE.get(k.name, { type: 'json' }).catch(() => null)));
    aramalar = kayitlar.filter(Boolean)
      .map((r) => ({ q: r.q, nerede: r.nerede, sayi: r.sayi, son: r.son }))
      .sort((a, b) => b.sayi - a.sayi).slice(0, 25);
  } catch { /* arama kaydı yoksa boş geçer */ }

  return json({ ok: true, gun: n, uretildi: new Date().toISOString(), ozet: top, seri, aramalar });
}

function json(veri, status = 200) {
  return new Response(JSON.stringify(veri), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}
