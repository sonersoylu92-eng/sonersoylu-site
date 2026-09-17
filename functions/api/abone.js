// E-posta abone kaydı — Cloudflare Pages Function
// Kayıtlar "ABONE" adlı KV namespace'ine yazılır.

const MAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, hata: 'gecersiz-istek' }, 400);
  }

  const email = String(body.email || '').trim().toLowerCase();
  const kaynak = String(body.kaynak || 'site').slice(0, 40);

  if (!MAIL.test(email) || email.length > 190) {
    return json({ ok: false, hata: 'gecersiz-eposta' }, 400);
  }

  if (!env.ABONE) {
    // depolama bağlanmamış — sessizce başarı dönme, dürüst ol
    return json({ ok: false, hata: 'depolama-yok' }, 503);
  }

  const kayit = {
    email,
    kaynak,
    tarih: new Date().toISOString(),
    ulke: request.headers.get('cf-ipcountry') || '',
  };

  try {
    await env.ABONE.put('abone:' + email, JSON.stringify(kayit));
    return json({ ok: true });
  } catch {
    return json({ ok: false, hata: 'yazilamadi' }, 500);
  }
}

export async function onRequestGet() {
  return json({ ok: true, bilgi: 'POST ile e-posta gonderin' });
}

function json(veri, status = 200) {
  return new Response(JSON.stringify(veri), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}
