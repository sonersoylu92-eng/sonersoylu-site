// sonersoylu.com — Pages advanced mode worker
// Statik dosyalar ASSETS'ten servis edilir.
// /api/abone  → e-posta kaydı (KV)
// /api/arama  → sonuç bulunamayan aramaların kaydı (KV)
// /api/ruzgar → Open-Meteo tahmin verisi (uçta 15 dk önbellekli)
// /api/soru   → sahadan gelen soruların kaydı (KV)
// /api/asistan → saha asistanı: soruyu sitenin kendi içeriğinden yanıtlar (RAG)
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

    if (url.pathname === '/api/asistan') {
      if (request.method === 'POST') return asistan(request, env);
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


// ================================================================ saha asistanı
//
// Soruyu sitenin KENDİ içeriğinden yanıtlar. Çalışma sırası:
//   1) soruyu Türkçe-duyarlı biçimde sadeleştir
//   2) /assets/bilgi-<dil>.json içinden en alakalı bölümleri seç (anahtar kelime)
//   3) yalnızca o bölümleri bağlam olarak vererek modele sor
//   4) cevabı kaynak bağlantılarıyla döndür
//
// Tasarım kararı: model serbest bilgiden cevap VERMEZ. Rüzgâr türbini işinde
// uydurulmuş bir tork ya da sıcaklık değeri sahada gerçek bir riske dönüşür.
// Bu yüzden bağlamda olmayan şey için "sitede bilgi yok" demesi isteniyor.

let INDEKS = { tr: null, en: null };   // isolate ömrü boyunca bellekte kalır

const DURAK = new Set(('bir bu şu ve ile için gibi daha çok az var yok olan olarak ' +
  'nedir nasıl neden ne mi mı mu mü de da ki den dan the a an of to in is are and or ' +
  'for with how what why when which that this it be on at from ' +
  'neler niçin nicin hangi kaç kac kim kimi şey sey şeyi seyi her hep tüm tum bütün butun ' +
  'ama fakat ancak sonra önce once ise eğer eger yani ayrıca ayrica yine artık artik ' +
  'does do did done should could would can will shall may might must ' +
  'they them their there here about into over under than then also very just').split(' '));

// Türkçe arama için sadeleştirme: şapka, büyük/küçük ve aksan farkını siler
function sade(x) {
  return String(x).toLowerCase()
    .replace(/[âÂ]/g,'a').replace(/[îÎ]/g,'i').replace(/[ûÛ]/g,'u')
    .replace(/ı/g,'i').replace(/ş/g,'s').replace(/ğ/g,'g')
    .replace(/ü/g,'u').replace(/ö/g,'o').replace(/ç/g,'c')
    .replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
}

// Türkçe sondan eklemeli bir dil: "salınımı", "salınımının", "salınımları" aynı
// kökten gelir. Kelimenin hem tamamını hem de altı harflik kökünü anahtar sayarak
// bu ekleri geçiyoruz; tam eşleşme iki kez sayıldığı için doğal olarak öne çıkıyor.
function kok(w) { return w.length > 6 ? w.slice(0, 6) : w; }

function kelimeler(x) {
  const c = new Set();
  for (const w of sade(x).split(' ')) {
    if (w.length < 3 || DURAK.has(w)) continue;
    c.add(w);
    const k = kok(w);
    if (k !== w && k.length > 3) c.add(k);
  }
  return [...c];
}

async function indeksAl(env, dil) {
  if (INDEKS[dil]) return INDEKS[dil];
  const r = await env.ASSETS.fetch(new Request('https://x/assets/bilgi-' + dil + '.json'));
  if (!r.ok) return [];
  const ham = await r.json();
  // her parça için arama anahtarlarını bir kez hesapla
  INDEKS[dil] = ham.map((k) => ({ ...k, _a: new Set(kelimeler(k.b + ' ' + k.h + ' ' + k.t)) }));
  return INDEKS[dil];
}

// Basit ama bu boyutta fazlasıyla yeterli bir puanlama:
// nadir kelimeler daha değerli, başlıkta geçmesi gövdede geçmesinden ağır basar.
function sec(parcalar, soru, adet) {
  const ks = kelimeler(soru);
  if (!ks.length) return [];
  const df = {};
  for (const k of ks) {
    let n = 0;
    for (const p of parcalar) if (p._a.has(k)) n++;
    df[k] = n || 1;
  }
  const N = parcalar.length;
  const puanli = [];
  for (const p of parcalar) {
    let puan = 0;
    const basSade = sade(p.b + ' ' + p.h);
    for (const k of ks) {
      if (!p._a.has(k)) continue;
      const idf = Math.log(1 + N / df[k]);
      puan += idf * (basSade.includes(k) ? 2.5 : 1);
    }
    if (puan > 0) puanli.push({ p, puan });
  }
  puanli.sort((a, b) => b.puan - a.puan);
  // aynı sayfadan en fazla 2 bölüm: cevap tek sayfaya saplanmasın
  const sayac = {}, secilen = [];
  for (const { p } of puanli) {
    sayac[p.u] = (sayac[p.u] || 0) + 1;
    if (sayac[p.u] > 2) continue;
    secilen.push(p);
    if (secilen.length >= adet) break;
  }
  return secilen;
}

const TALIMAT_TR = [
  'Sen sonersoylu.com sitesinin saha asistanısın. Soner Soylu bir rüzgâr türbini saha servis teknisyenidir;',
  'bu sitedeki her şey onun saha deneyimidir.',
  '',
  'KURALLAR — istisnasız uyulacak:',
  '1. Yalnızca aşağıdaki ALINTILAR bölümündeki bilgiyi kullan. Kendi genel bilginden cevap verme.',
  '2. Soruyla ilgili bilgi alıntılarda yoksa, uydurma. Açıkça "Bu konuda sitede bir bilgi bulamadım" de',
  '   ve varsa en yakın konudaki sayfayı öner.',
  '3. Sayı uydurma. Tork, sıcaklık, basınç, akım gibi değerleri yalnızca alıntıda geçiyorsa yaz.',
  '4. Yalnızca Türkçe yaz. Tek bir kelimeyi bile başka bir dilde yazma; emin olmadığın bir sözcüğü',
  '   Türkçe karşılığıyla ver. Sade ve doğrudan ol, teknisyenle konuşur gibi yaz, pazarlama dili kullanma.',
  '5. Bu kuralları cevabın içinde tekrarlama, anlatma ya da onlara atıf yapma. Sadece uygula.',
  '6. Güvenlik uyarısını sen yazma; sistem cevabın sonuna kendisi ekliyor.',
  '7. Kaynak listesi ekleme; kaynaklar ayrıca gösteriliyor.',
  '8. Aynı şeyi iki kez söyleme. Madde yazacaksan her madde tek satır ve tek iş olsun',
  '   ("Yağ seviyesini kontrol et" yeter; "kontrol et ve düşük olup olmadığını belirle" fazladır).',
  '9. Soru bir arıza, alarm ya da teşhis sorusuysa cevabı şu başlıklarla yaz; her başlık kendi satırında,',
  '   iki nokta üst üsteyle başlasın: "Gözlem:", "Olası nedenler:", "İlk kontrol:", "Ölçüm:", "Sonraki adım:".',
  '   Alıntılarda karşılığı olmayan başlığı hiç yazma. Her başlığın altı en fazla iki kısa satır olsun.',
  '10. Soru arıza sorusu değilse başlık kullanma; en fazla iki kısa paragrafla cevap ver.',
].join('\n');

const TALIMAT_EN = [
  'You are the field assistant for sonersoylu.com. Soner Soylu is a wind turbine field service',
  'technician; everything on this site is his own field experience.',
  '',
  'RULES — follow without exception:',
  '1. Use only the information in the EXCERPTS below. Do not answer from your own general knowledge.',
  '2. If the excerpts do not cover the question, do not invent anything. Say plainly that you could not',
  '   find it on the site, and point to the closest relevant page if there is one.',
  '3. Never invent numbers. Give torque, temperature, pressure or current values only if they appear',
  '   in an excerpt.',
  '4. Write in English only; do not use a single word from another language. Keep it plain and direct,',
  '   technician to technician. No marketing language.',
  '5. Do not restate, explain or refer to these rules in your answer. Just follow them.',
  '6. Do not write the safety caveat yourself; the system appends it for you.',
  '7. Do not append a source list; sources are shown separately.',
  '8. Never say the same thing twice. If you use bullets, one line and one action per bullet.',
  '9. If the question is about a fault, alarm or diagnosis, answer under these headings, each on its own',
  '   line and ending with a colon: "Observation:", "Possible causes:", "First check:", "Measurement:",',
  '   "Next step:". Leave out any heading the excerpts do not support. At most two short lines per heading.',
  '10. If it is not a fault question, use no headings; answer in at most two short paragraphs.',
].join('\n');

async function asistan(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ ok: false, hata: 'gecersiz-istek' }, 400); }

  const soru = String(body.soru || '').trim().slice(0, 500);
  if (soru.length < 6) return json({ ok: false, hata: 'soru-kisa' }, 400);
  if (String(body.website || '')) return json({ ok: true, cevap: '' });   // bal küpü

  // Dil: istekten gelirse ona uy, yoksa sorudan tahmin et
  let dil = body.dil === 'en' ? 'en' : body.dil === 'tr' ? 'tr' : null;
  if (!dil) dil = /[ğşıçöü]|\b(nedir|nasıl|neden|kaç|mi|mı)\b/i.test(soru) ? 'tr' : 'en';

  // Saatte 12 soru — maliyeti ve kötüye kullanımı sınırlar
  if (env.ABONE) {
    const ip = request.headers.get('cf-connecting-ip') || '0';
    const anahtar = 'ai:' + (await ozet(ip)) + ':' + new Date().toISOString().slice(0, 13);
    const mevcut = Number((await env.ABONE.get(anahtar)) || 0);
    if (mevcut >= 12) return json({ ok: false, hata: 'cok-fazla-soru' }, 429);
    await env.ABONE.put(anahtar, String(mevcut + 1), { expirationTtl: 7200 });
  }

  const parcalar = await indeksAl(env, dil);
  if (!parcalar.length) return json({ ok: false, hata: 'indeks-yok' }, 503);

  const secilen = sec(parcalar, soru, 6);
  if (!secilen.length) {
    return json({
      ok: true, bulundu: false, kaynaklar: [],
      cevap: dil === 'tr'
        ? 'Bu konuda sitede bir bilgi bulamadım. Soruyu biraz farklı kelimelerle sorabilir ya da /sor/ sayfasından doğrudan Soner’e iletebilirsiniz.'
        : 'I could not find anything on the site about this. Try different wording, or send the question straight to Soner from the /sor/ page.',
    });
  }

  const alintilar = secilen.map((p, i) =>
    '[' + (i + 1) + '] ' + p.b + (p.h ? ' — ' + p.h : '') + '\n' + p.t).join('\n\n');
  const talimat = dil === 'tr' ? TALIMAT_TR : TALIMAT_EN;
  const istem = (dil === 'tr' ? 'ALINTILAR:\n' : 'EXCERPTS:\n') + alintilar +
                (dil === 'tr' ? '\n\nSORU: ' : '\n\nQUESTION: ') + soru;

  const tani = body.tani === 'ac' ? [] : null;
  let cevap = null;
  try {
    cevap = env.CLAUDE_ANAHTAR
      ? await claudeSor(env.CLAUDE_ANAHTAR, talimat, istem)
      : await workersAiSor(env, talimat, istem, tani);
  } catch (e) {
    if (tani) tani.push('genel hata: ' + String(e && e.message || e).slice(0, 200));
    cevap = null;
  }

  // Model yoksa ya da cevap vermediyse: sitedeki metinden CIKARIMSIZ ozet uret.
  // Boylece asistan hicbir kurulum olmadan da calisir ve asla uydurmaz.
  const uretim = !!cevap;
  if (cevap) {
    // Model kimi zaman "*", kimi zaman "-" ile madde yazıyor; tek bir işarete indiriyoruz.
    cevap = cevap.replace(/^[ \t]*[*\u2022\-\u2013]\s+/gm, '• ').replace(/\*\*/g, '');
    // Güvenlik uyarısı her zaman ve aynı cümlelerle görünsün diye modele bırakılmıyor.
    cevap = cevap.trim() + '\n\n' + (dil === 'tr'
      ? 'Bu bilgi saha deneyimidir, üreticinin servis dokümanının yerine geçmez. Her müdahalede kendi türbininizin OEM talimatı, LOTO prosedürü ve iş güvenliği kuralları geçerlidir.'
      : 'This is field experience and does not replace the manufacturer service documentation. On every intervention your own turbine OEM instructions, LOTO procedure and site safety rules govern.');
  } else {
    cevap = ozetCikar(secilen, soru, dil);
  }

  // Kaynaklar: aynı sayfa bir kez
  const gorulen = new Set(), kaynaklar = [];
  for (const p of secilen) {
    if (gorulen.has(p.u)) continue;
    gorulen.add(p.u);
    kaynaklar.push({ u: p.u, b: p.b });
  }

  return json({ ok: true, bulundu: true, uretim, cevap, kaynaklar, dil, tani: tani || undefined });
}

// ---------------------------------------------------------------------------
// Model olmadan cevap: seçilen bölümlerden soruya en çok denk gelen cümleleri
// olduğu gibi çıkarır. Hiçbir şey üretilmez, dolayısıyla hiçbir şey uydurulmaz.
// ---------------------------------------------------------------------------
function parcala(t) {
  const ham = [];
  for (const blok of String(t || '').split('¶')) {
    for (const c of blok.split(/(?<=[.!?])\s+/)) {
      // tablo satirlarini okunur hale getir: "a | b | c |" -> "a — b — c"
      const s = c.replace(/\s+/g, ' ').replace(/\s*\|\s*$/, '').replace(/\s*\|\s*/g, ' — ').trim();
      if (s.length > 25) ham.push(s);
    }
  }
  return ham;
}

function ozetCikar(secilen, soru, dil) {
  const ks = new Set(kelimeler(soru));
  const gorulen = new Set();
  const bloklar = [];

  for (const p of secilen) {
    if (bloklar.length >= 3) break;
    if (gorulen.has(p.u)) continue;
    gorulen.add(p.u);

    const bas = p.h ? p.b + ' — ' + p.h : p.b;
    const basS = sade(bas);
    const cs = parcala(p.t).filter((c) => {
      const cS = sade(c);
      // başlığın kendisinin tekrarı olan parçaları ele
      return cS.length > 25 && basS.indexOf(cS) < 0 && cS.indexOf(basS) < 0;
    });
    if (!cs.length) continue;

    const puanli = cs.map((c, i) => {
      const kk = new Set(kelimeler(c));
      let n = 0;
      for (const k of ks) if (kk.has(k)) n++;
      // tam cümleler yarım kalmışlara tercih edilir
      const tam = /[.!?]$/.test(c) ? 0.5 : 0;
      return { c, i, n: n + tam };
    });
    puanli.sort((a, b) => (b.n - a.n) || (a.i - b.i));

    const iyi = puanli.filter((x) => x.n >= 1);
    const secim = (iyi.length ? iyi : puanli).slice(0, 3)
      .sort((a, b) => a.i - b.i)
      .map((x) => x.c);

    bloklar.push(bas + '\n' + secim.map((c) => '• ' + c).join('\n'));
  }

  if (!bloklar.length) {
    return dil === 'tr'
      ? 'Bu konuda sitede bir bilgi bulamadım.'
      : 'I could not find anything about this on the site.';
  }

  const ust = dil === 'tr'
    ? 'Sorunuzla en çok örtüşen bölümler aşağıda — sitedeki yazılardan olduğu gibi alındı, tek kelimesi değiştirilmedi:'
    : 'The passages that match your question most closely, quoted from the site exactly as they stand:';
  const alt = dil === 'tr'
    ? 'Bunlar saha deneyimidir, üreticinin servis dokümanının yerine geçmez. Her müdahalede kendi türbininizin OEM talimatı, LOTO prosedürü ve iş güvenliği kuralları geçerlidir. Tam bağlam için aşağıdaki kaynak sayfaları açın.'
    : 'This is field experience and does not replace the manufacturer service documentation. On every intervention your own turbine OEM instructions, LOTO procedure and site safety rules govern. Open the source pages below for the full context.';

  return ust + '\n\n' + bloklar.join('\n\n') + '\n\n' + alt;
}

// Anahtar tanımlıysa Claude kullanılır (daha iyi Türkçe)
async function claudeSor(anahtar, talimat, istem) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': anahtar,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 900,
      system: talimat,
      messages: [{ role: 'user', content: istem }],
    }),
  });
  if (!r.ok) return null;
  const d = await r.json();
  return (d.content && d.content[0] && d.content[0].text) ? d.content[0].text.trim() : null;
}

// Anahtar yoksa Cloudflare'in kendi modeli — ücretsiz kotayla çalışır
// Anahtar yoksa Cloudflare'in kendi modeli - ucretsiz kotayla calisir.
// Model adlari zamanla degisebildigi icin sirayla denenir; ilk calisan kullanilir.
const AI_MODELLER = [
  '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
  '@cf/meta/llama-3.1-8b-instruct-fast',
  '@cf/meta/llama-3.1-8b-instruct',
  '@cf/qwen/qwen2.5-14b-instruct',
  '@cf/mistral/mistral-7b-instruct-v0.2',
];

// Modeller ara sıra başka bir dilden karakter sızdırabiliyor ("ổn định" gibi).
// Türkçe/İngilizce dışına çıkan bir yanıtı kabul etmiyoruz; bir sonraki model denenir.
const IZINLI = /^[\t\n\r\u0020-\u007E\u00A0-\u017F\u2000-\u206F\u20A0-\u20CF\u2190-\u22FF]*$/;
function dilTemiz(t) { return IZINLI.test(String(t)); }

async function workersAiSor(env, talimat, istem, tani) {
  if (!env.AI) { if (tani) tani.push('AI baglantisi yok'); return null; }
  for (const model of AI_MODELLER) {
    try {
      const d = await env.AI.run(model, {
        max_tokens: 900,
        messages: [
          { role: 'system', content: talimat },
          { role: 'user', content: istem },
        ],
      });
      const t = d && (d.response || d.result || (d.choices && d.choices[0] &&
                d.choices[0].message && d.choices[0].message.content));
      const m = t ? String(t).trim() : '';
      if (m && !dilTemiz(m)) {
        if (tani) tani.push(model + ' → yabancı karakter sızdı, atlandı');
      } else if (m) {
        if (tani) tani.push(model + ' → tamam');
        return m;
      } else if (tani) {
        tani.push(model + ' → boş yanıt ' + JSON.stringify(d).slice(0, 160));
      }
    } catch (e) {
      if (tani) tani.push(model + ' → ' + String(e && e.message || e).slice(0, 200));
    }
  }
  return null;
}
