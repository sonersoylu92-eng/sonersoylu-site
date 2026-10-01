/* film.js — "Türbinin içine" yolculuğunun önceden çekilmiş film sürümü.
 * Gerçek 3B sahne (deneyim.js) yüksek kalitede kare kare çekildi; burada kaydırmayla oynatılır.
 * Her cihazda aynı akıcılık: kare başına yalnızca bir resim çizimi, WebGL yok.
 *
 * Paketler: kareler 12 pakete dağıtılmıştır (paket b: i ≡ SIRA[b] mod 12). İlk paket bütün
 * yolculuğu seyrek karelerle kapsar; sonraki paketler araya girer. Böylece film birkaç yüz KB
 * ile oynamaya başlar, kalan kareler geldikçe akıcılık artar.
 * Arayüz geri çağrıları deneyim.js ile aynıdır (ilerleme, noktalar, etiketler, cizim, hazir, hata). */

export { DURAKLAR } from '/assets/deneyim/duraklar.js?v=1';

const FILM_SURUM = '1';

export function filmBaslat(tuval, bolum, cb = {}, secenek = {}) {
  const kok = secenek.kok || '/assets/film/';
  const dikey = innerHeight > innerWidth * 1.05;
  const set = dikey ? 'dikey' : 'yatay';
  const ctx = tuval.getContext('2d', { alpha: false, desynchronized: true });
  if (!ctx) return null;
  const sahneEl = tuval.parentElement;

  let M = null;                    // film.json
  const veri = [];                 // kare → Blob
  const bmp = new Map();           // kare → ImageBitmap (yakın çevre önbelleği)
  const cozuluyor = new Set();
  let durdu = false, rafId = 0, ilkCizim = false, sonCizilen = -1, sonFi = -1;
  let istT = 0, takilmaSay = 0;
  const ONBELLEK = dikey ? 28 : 36;

  function ilerleme() {
    const r = bolum.getBoundingClientRect(), yol = r.height - (sahneEl.clientHeight || innerHeight);
    return yol <= 0 ? 0 : Math.min(1, Math.max(0, -r.top / yol));
  }

  function olcek() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = Math.round(tuval.clientWidth * dpr), h = Math.round(tuval.clientHeight * dpr);
    if (w && h && (tuval.width !== w || tuval.height !== h)) { tuval.width = w; tuval.height = h; sonCizilen = -1; }
  }
  // "cover" yerleşimi: kare tuvali doldurur, taşan kenar kırpılır
  function yerlesim() {
    const s = Math.max(tuval.width / M.w, tuval.height / M.h);
    return { s, ox: (tuval.width - M.w * s) / 2, oy: (tuval.height - M.h * s) / 2 };
  }

  function coz(i) {
    if (bmp.has(i) || cozuluyor.has(i) || !veri[i]) return;
    cozuluyor.add(i);
    createImageBitmap(veri[i]).then(b => {
      cozuluyor.delete(i);
      if (durdu) { b.close && b.close(); return; }
      bmp.set(i, b); temizle(); iste();
    }).catch(() => cozuluyor.delete(i));
  }
  function temizle() {
    if (bmp.size <= ONBELLEK) return;
    const merkez = sonFi < 0 ? 0 : sonFi;
    const sirali = [...bmp.keys()].sort((a, b) => Math.abs(b - merkez) - Math.abs(a - merkez));
    while (bmp.size > ONBELLEK) { const k = sirali.shift(); const b = bmp.get(k); bmp.delete(k); b && b.close && b.close(); }
  }
  // gidilen yöne doğru birkaç kare önden çözülür
  let yon = 1;
  function onden(fi) {
    const i0 = Math.floor(fi);
    for (let d = 0; d <= 8; d++) {
      const a = i0 + d * yon, b = i0 - Math.ceil(d / 3) * yon;
      if (a >= 0 && a < M.n) coz(a);
      if (b >= 0 && b < M.n) coz(b);
    }
  }
  // istenen kareye en yakın çözülmüş kare
  function enYakin(i) {
    if (bmp.has(i)) return i;
    for (let d = 1; d < M.n; d++) {
      if (bmp.has(i - d)) return i - d;
      if (bmp.has(i + d)) return i + d;
    }
    return -1;
  }

  function ciz(fi) {
    const i0 = Math.floor(fi), f = fi - i0;
    const a = enYakin(i0); if (a < 0) return false;
    const L = yerlesim();
    const A = bmp.get(a);
    ctx.globalAlpha = 1;
    ctx.drawImage(A, L.ox, L.oy, M.w * L.s, M.h * L.s);
    // iki kare arası yumuşak geçiş (yalnız iki komşu kare de hazırsa)
    if (a === i0 && f > 0.02 && i0 + 1 < M.n && bmp.has(i0 + 1)) {
      ctx.globalAlpha = f;
      ctx.drawImage(bmp.get(i0 + 1), L.ox, L.oy, M.w * L.s, M.h * L.s);
      ctx.globalAlpha = 1;
    }
    return true;
  }

  const ARA = (a, b, t) => a + (b - a) * t;
  function bildir(fi, p) {
    const i = Math.min(M.n - 1, Math.max(0, Math.round(fi)));
    const k = M.k[i], k1 = M.k[Math.min(M.n - 1, Math.floor(fi) + 1)], k0 = M.k[Math.floor(fi)];
    const t = fi - Math.floor(fi);
    const y = ARA(k0[1], k1[1], t);
    if (cb.cizim) cb.cizim(ARA(k0[3], k1[3], t));
    if (cb.ilerleme) cb.ilerleme(p, y, k[2]);
    const L = yerlesim(), dpr = tuval.width / Math.max(1, tuval.clientWidth);
    const donustur = (x, y) => [(x * L.s + L.ox) / dpr, (y * L.s + L.oy) / dpr];
    if (cb.noktalar && M.nid) cb.noktalar(M.nid.map((id, j) => {
      const n = k[4][j]; if (!n) return { id, gor: false, x: 0, y: 0, d: 99 };
      const [x, yy] = donustur(n[0], n[1]); return { id, gor: true, x, y: yy, d: n[2] };
    }));
    if (cb.etiketler && M.eid) cb.etiketler(M.eid.map((id, j) => {
      const e = k[5][j]; if (!e) return { id, x: -999, y: -999, ekranda: false };
      const [x, yy] = donustur(e[0], e[1]);
      const w = tuval.clientWidth, h = tuval.clientHeight;
      return { id, x, y: yy, ekranda: x > w * 0.04 && x < w * 0.96 && yy > h * 0.1 && yy < h * 0.9 };
    }), p);
  }

  function kare(t) {
    rafId = 0; if (durdu || !M) return;
    // takılma: kaydırma olayından çizime kadar geçen süre 200 ms'yi aşarsa kaydedilir
    const gecikme = performance.now() - istT;
    if (istT && gecikme > 200 && !document.hidden && cb.takilma && takilmaSay < 6) {
      takilmaSay++; cb.takilma({ p: Math.round(ilerleme() * 1000) / 1000, ms: Math.round(gecikme), is: 0, prog: 0, geo: 0, tex: 0, vh: innerHeight + '', kalite: 0 });
    }
    istT = 0;
    olcek();
    const p = ilerleme(), fi = p * (M.n - 1);
    if (fi !== sonFi) yon = fi >= sonFi ? 1 : -1;
    onden(fi);
    const anahtar = Math.round(fi * 64);
    if (anahtar !== sonCizilen) {
      if (ciz(fi)) {
        sonCizilen = anahtar;
        if (!ilkCizim) { ilkCizim = true; tuval.classList.add('hazir'); if (cb.hazir) cb.hazir(); }
        bildir(fi, p);
      }
    }
    sonFi = fi;
  }
  function iste() { if (!rafId && !durdu) { istT = performance.now(); rafId = requestAnimationFrame(kare); } }
  addEventListener('scroll', iste, { passive: true });
  addEventListener('resize', () => { sonCizilen = -1; iste(); });
  document.addEventListener('visibilitychange', iste);

  // yükleme: önce dizin, sonra paketler sırayla (en fazla iki eşzamanlı)
  fetch(kok + set + '/film.json?v=' + FILM_SURUM).then(r => { if (!r.ok) throw new Error('film.json ' + r.status); return r.json(); }).then(m => {
    M = m;
    let sira = 0, akan = 0, biten = 0;
    const sonraki = () => {
      while (akan < 2 && sira < M.paket.length) {
        const pk = M.paket[sira++]; akan++;
        fetch(kok + set + '/' + pk.ad + '?v=' + FILM_SURUM).then(r => { if (!r.ok) throw new Error(pk.ad + ' ' + r.status); return r.arrayBuffer(); }).then(buf => {
          for (const [i, bas, uz] of pk.k) veri[i] = new Blob([buf.slice(bas, bas + uz)], { type: 'image/webp' });
          akan--; biten++; sonCizilen = -1; iste(); sonraki();
        }).catch(e => { akan--; if (biten === 0 && cb.hata) cb.hata('film-paket: ' + e.message, {}); });
      }
    };
    sonraki();
  }).catch(e => { if (cb.hata) cb.hata('film-dizin: ' + e.message, {}); });

  return {
    film: true,
    fare() {},
    durum: () => ({ kalite: 0, kare_ms: 0, birakildi: durdu }),
    birak(neden) {
      if (durdu) return; durdu = true;
      if (rafId) cancelAnimationFrame(rafId);
      bmp.forEach(b => b.close && b.close()); bmp.clear();
      tuval.classList.remove('hazir');
      if (cb.hata) cb.hata(neden || 'birakildi', {});
    },
  };
}
