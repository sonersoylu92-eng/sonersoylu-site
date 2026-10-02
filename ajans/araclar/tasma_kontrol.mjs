// Otomatik etiket kontrolü (K-003'e ek). Kullanım:
//   node tasma_kontrol.mjs [proje_dizini] [saniyeler,virgüllü]   (varsayılan: .. ve her 0,5 sn)
// Denetler, her saniyede görünür olan her SVG <text> için:
//   1) KART: içinde başladığı kardeş <rect> kartın dışına taşıyor mu / sağda 24 px'ten az boşluk var mı
//   2) BOŞLUK: aynı satırdaki (aynı kart) başka yazıyla arası 16 px'ten az mı
//   3) KESİŞME: bir çizgi/eğri/şekil yazının içinden geçiyor mu (isPointInStroke/Fill örnekleme).
//      Yazı bir dolu şeklin tamamen içindeyse (şekil üstü etiket) sayılmaz.
//      Yazının koyu halesi (stroke + paint-order:stroke) varsa "haleli" diye ayrı işaretlenir.
// HyperFrames çalışma zamanı olmadan açar: .clip öğelerini data-start/duration'a göre kendisi gizler.
import pw from '/opt/npm-tools/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const dizin = path.resolve(process.argv[2] || path.join(path.dirname(new URL(import.meta.url).pathname), '..'));
const anlar = process.argv[3] ? process.argv[3].split(',').map(Number)
  : Array.from({ length: 104 }, (_, i) => +(i * 0.5 + 0.25).toFixed(2));
const MIN_SAG = 24, MIN_BOSLUK = 16;

const tip = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.wav': 'audio/wav' };
const srv = http.createServer((q, r) => {
  const f = path.join(dizin, decodeURIComponent(q.url.split('?')[0]).replace(/^\/$/, '/index.html'));
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'content-type': tip[path.extname(f)] || 'application/octet-stream' }); r.end(d); } });
}).listen(0);
const port = srv.address().port;

const b = await pw.chromium.launch({ executablePath: process.env.HYPERFRAMES_BROWSER_PATH || undefined });
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await p.addInitScript(() => { window.__timelines = {}; });
await p.goto(`http://localhost:${port}/index.html`, { waitUntil: 'load' });
await p.evaluate(() => document.fonts.ready);

const sonuc = await p.evaluate(({ anlar, MIN_SAG, MIN_BOSLUK }) => {
  const tl = window.__timelines.main;
  const clips = [...document.querySelectorAll('.clip[data-start]')];
  const gorunur = el => {
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) return false;
    }
    return true;
  };
  const ad = t => (t.id ? '#' + t.id + ' ' : '') + '"' + t.textContent.trim() + '"';
  const panelOf = el => el.closest('.clip')?.id || '?';
  const bulgular = new Map();
  const ekle = (anahtar, t, metin) => {
    if (!bulgular.has(anahtar)) bulgular.set(anahtar, { ilk: t, son: t, metin });
    else bulgular.get(anahtar).son = t;
  };
  for (const t of anlar) {
    clips.forEach(c => { const s = +c.dataset.start, d = +c.dataset.duration; c.style.display = (t >= s && t < s + d) ? '' : 'none'; });
    tl.seek(t, false);
    const yazilar = [...document.querySelectorAll('svg text')].filter(gorunur);
    for (const tx of yazilar) {
      const bb = tx.getBBox();
      if (!bb.width) continue;
      const par = tx.parentNode;
      // 1) kart: yazının sol-üst köşesini içeren kardeş rect
      const kartlar = [...par.children].filter(e => e.tagName === 'rect' && gorunur(e)).map(e => [e, e.getBBox()])
        .filter(([, r]) => r.width > 60 && r.height > 40 && bb.x >= r.x - 1 && bb.x <= r.x + r.width && bb.y + bb.height / 2 >= r.y && bb.y + bb.height / 2 <= r.y + r.height);
      for (const [, r] of kartlar) {
        const sag = r.x + r.width - (bb.x + bb.width), alt = r.y + r.height - (bb.y + bb.height);
        if (sag < MIN_SAG) ekle(`kart|${panelOf(tx)}|${ad(tx)}`, t, `KART  ${panelOf(tx)} ${ad(tx)}: sağ boşluk ${sag.toFixed(1)} px (< ${MIN_SAG})${sag < 0 ? ' — TAŞIYOR' : ''}`);
        if (alt < 0 || bb.y < r.y) ekle(`kartd|${panelOf(tx)}|${ad(tx)}`, t, `KART  ${panelOf(tx)} ${ad(tx)}: dikeyde taşıyor`);
      }
      // 2) aynı satırdaki yazılarla yatay boşluk
      for (const o of yazilar) {
        if (o === tx || o.parentNode !== par) continue;
        const ob = o.getBBox();
        const ayniSatir = Math.abs((ob.y + ob.height / 2) - (bb.y + bb.height / 2)) < Math.min(bb.height, ob.height) * 0.5;
        if (!ayniSatir || ob.x < bb.x) continue;
        const bosluk = ob.x - (bb.x + bb.width);
        if (bosluk < MIN_BOSLUK) ekle(`bos|${panelOf(tx)}|${ad(tx)}|${ad(o)}`, t, `BOŞLUK ${panelOf(tx)} ${ad(tx)} → ${ad(o)}: ${bosluk.toFixed(1)} px (< ${MIN_BOSLUK})`);
      }
      // 3) kesişme: yazı kutusu içinde ızgara noktaları, diğer geometri öğeleriyle
      const tm = tx.getScreenCTM();
      const halo = getComputedStyle(tx).paintOrder.startsWith('stroke') && getComputedStyle(tx).stroke !== 'none';
      const svg = tx.ownerSVGElement;
      const sekiller = [...svg.querySelectorAll('path,line,rect,circle,ellipse,polygon,polyline')].filter(e => gorunur(e) && !e.closest('defs'));
      const pts = [];
      for (let i = 1; i < 24; i++) for (let j = 0; j < 5; j++) pts.push(new DOMPoint(bb.x + bb.width * i / 24, bb.y + bb.height * (0.2 + 0.6 * j / 4)).matrixTransform(tm));
      for (const s of sekiller) {
        const sb = s.getBBox();
        const kart = s.tagName === 'rect' && kartlar.some(([k]) => k === s);
        if (kart) continue;
        // dolu bir kartın altında kalan (DOM'da karttan önce çizilen) şekil görünmez: sayma
        if (kartlar.some(([k]) => getComputedStyle(k).fill !== 'none' && (s.compareDocumentPosition(k) & Node.DOCUMENT_POSITION_FOLLOWING))) continue;
        const cs = getComputedStyle(s);
        if (+cs.fillOpacity * +cs.opacity < 0.05 && (cs.stroke === 'none' || +cs.strokeOpacity < 0.05)) continue;
        let inv;
        try { inv = s.getScreenCTM().inverse(); } catch { continue; }  // ölçeği 0 olan (henüz açılmamış) öğe
        let n = 0;
        for (const P of pts) {
          const L = P.matrixTransform(inv);
          const st = cs.stroke !== 'none' && s.isPointInStroke(L);
          const fl = cs.fill !== 'none' && !cs.fill.startsWith('url') && s.isPointInFill(L);
          if (st || fl) n++;
        }
        if (n >= 1 && n < pts.length) {   // tamamı içerideyse bilinçli 'şekil üstü yazı' (ör. mıknatısta N/S)
          const kim = s.id ? '#' + s.id : (s.closest('[id]')?.id ? 'in #' + s.closest('[id]').id : s.tagName);
          ekle(`kes|${panelOf(tx)}|${ad(tx)}|${kim}`, t, `KESİŞME ${panelOf(tx)} ${ad(tx)} ← ${s.tagName} ${kim} (${n}/${pts.length} nokta)${halo ? ' [haleli]' : ''}`);
        }
      }
    }
  }
  return [...bulgular.values()].map(v => `${v.ilk.toFixed(2)}–${v.son.toFixed(2)} sn  ${v.metin}`);
}, { anlar, MIN_SAG, MIN_BOSLUK });

await b.close(); srv.close();
const hatalar = sonuc.filter(s => !s.includes('[haleli]'));
console.log(sonuc.length ? sonuc.join('\n') : 'Bulgu yok');
console.log(`\nToplam ${sonuc.length} bulgu, ${hatalar.length} düzeltilmesi gereken (haleli kesişmeler hariç).`);
process.exit(hatalar.length ? 1 : 0);
