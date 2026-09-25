/* ses.js — "Türbine gir" için isteğe bağlı saha sesleri. Varsayılan KAPALI; yalnızca ziyaretçi
 * "Ses" düğmesine basınca yüklenir. Hiçbir ses dosyası indirilmez: rüzgâr, kule içi uğultusu,
 * asansör tahriki, halat sürtünmesi, kapı ve kilit sesleri Web Audio ile burada üretilir.
 * Seviyeler bilerek düşüktür: sinema efekti değil, sahadaki arka plan. */
export function sesKur() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  const ctx = new AC();
  const ana = ctx.createGain(); ana.gain.value = 0; ana.connect(ctx.destination);
  ana.gain.setTargetAtTime(0.75, ctx.currentTime, 0.4);

  // ortak gürültü kaynağı (2 sn, döngü)
  const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), d = buf.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < d.length; i++) {   // pembeye yakın gürültü: doğal rüzgâr dokusu
    const w = Math.random() * 2 - 1; b0 = 0.997 * b0 + w * 0.029; b1 = 0.985 * b1 + w * 0.032; b2 = 0.95 * b2 + w * 0.048; d[i] = (b0 + b1 + b2 + w * 0.02) * 0.9;
  }
  const kaynak = () => { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.loopStart = Math.random(); s.start(); return s; };
  const zincir = (...n) => { for (let i = 0; i < n.length - 1; i++) n[i].connect(n[i + 1]); return n[n.length - 1]; };
  const kazanc = v => { const g = ctx.createGain(); g.gain.value = v; return g; };
  const suzgec = (tip, f, q = 0.7) => { const b = ctx.createBiquadFilter(); b.type = tip; b.frequency.value = f; b.Q.value = q; return b; };

  // dışarıda rüzgâr
  const ruzF = suzgec('lowpass', 420, 0.5), ruzG = kazanc(0);
  zincir(kaynak(), ruzF, ruzG, ana);
  // kule içi: kapalı hacmin alçak uğultusu + yapısal titreşim
  const kuleG = kazanc(0);
  zincir(kaynak(), suzgec('bandpass', 95, 0.8), kuleG, ana);
  const ugul = ctx.createOscillator(); ugul.type = 'sine'; ugul.frequency.value = 43; const ugulG = kazanc(0); zincir(ugul, ugulG, ana); ugul.start();
  // asansör tahriki: motor + dişli ıslığı + halat sürtünmesi
  const motor = ctx.createOscillator(); motor.type = 'sawtooth'; motor.frequency.value = 52;
  const motorG = kazanc(0); zincir(motor, suzgec('lowpass', 300, 0.9), motorG, ana); motor.start();
  const islik = ctx.createOscillator(); islik.type = 'sine'; islik.frequency.value = 840; const islikG = kazanc(0); zincir(islik, islikG, ana); islik.start();
  const halatG = kazanc(0); zincir(kaynak(), suzgec('highpass', 2600, 0.6), halatG, ana);
  // nasel: dönen aktarma organlarının uğultusu
  const naselG = kazanc(0);
  for (const [f, v] of [[50, 1], [100, 0.5], [148, 0.25]]) { const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f; const g = kazanc(v); zincir(o, g, naselG); o.start(); }
  naselG.connect(ana);

  // tek seferlik sesler: kapı kilidi (tok vuruş), sürgü (kısa sürtünme)
  function vurus(guc = 1) {
    const t = ctx.currentTime, s = kaynak(), f = suzgec('lowpass', 700, 1), g = kazanc(0); zincir(s, f, g, ana);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.5 * guc, t + 0.005); g.gain.exponentialRampToValueAtTime(0.001, t + 0.16); s.stop(t + 0.2);
    const o = ctx.createOscillator(), og = kazanc(0); o.frequency.value = 72; zincir(o, og, ana); o.start(t);
    og.gain.setValueAtTime(0.35 * guc, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.12); o.stop(t + 0.15);
  }
  function surgu(sure = 0.55) {
    const t = ctx.currentTime, s = kaynak(), f = suzgec('bandpass', 1300, 1.2), g = kazanc(0); zincir(s, f, g, ana);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.12, t + 0.06); g.gain.linearRampToValueAtTime(0.08, t + sure - 0.1); g.gain.linearRampToValueAtTime(0, t + sure); s.stop(t + sure + 0.05);
  }

  let onceKapi = 0, onceKabin = 1, ruzgarlik = 0;
  const hedef = (p, v, tc = 0.25) => p.setTargetAtTime(v, ctx.currentTime, tc);
  return {
    guncelle(s) {
      if (ctx.state === 'suspended') ctx.resume();
      ruzgarlik += (Math.random() - 0.5) * 0.08; ruzgarlik = Math.max(-0.3, Math.min(0.3, ruzgarlik * 0.995));
      const disari = s.disari * (1 - 0.6 * s.kule);
      hedef(ruzG.gain, disari * (0.28 + ruzgarlik * 0.25), 0.6); hedef(ruzF.frequency, 360 + ruzgarlik * 260, 0.8);
      hedef(kuleG.gain, s.kule * 0.22, 0.8); hedef(ugulG.gain, s.kule * 0.035, 0.8);
      const m = Math.min(1, s.asnHiz / 2.2);
      hedef(motorG.gain, m * 0.16, 0.35); hedef(motor.frequency, 46 + m * 12, 0.5);
      hedef(islikG.gain, m * 0.012, 0.35); hedef(islik.frequency, 700 + m * 180, 0.5); hedef(halatG.gain, m * 0.018, 0.3);
      const nasel = s.p > 0.465 && s.p < 0.96 ? 1 : 0; hedef(naselG.gain, nasel * 0.05, 0.9);
      // olaylar
      if (s.kapi > 0.02 && onceKapi <= 0.02) vurus(0.8);
      if (s.kabinKapi < 0.97 && onceKabin >= 0.97) surgu(0.6);
      if (s.kabinKapi <= 0.01 && onceKabin > 0.01) vurus(1);
      if (s.kabinKapi > 0.01 && onceKabin <= 0.01) { vurus(0.7); setTimeout(() => surgu(0.5), 180); }
      onceKapi = s.kapi; onceKabin = s.kabinKapi;
    },
    kapat() { ana.gain.setTargetAtTime(0, ctx.currentTime, 0.15); setTimeout(() => ctx.close(), 600); },
  };
}
