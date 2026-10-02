// Ana sayfa · "Son paylaşım" kartı
// /api/youtube kanalın son paylaşımlarını verir; ilk karttaki video en yenisiyle değişir.
// Ulaşılamazsa kartta sitenin kendi video kopyası kalır.
(() => {
  const kart = document.querySelector('[data-son-video]');
  if (!kart) return;
  const haric = (kart.dataset.haric || '').split(',').filter(Boolean);

  const yukle = () => {
    fetch('/api/youtube', { headers: { accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d || !d.ok || !Array.isArray(d.videolar)) return;
        const v = d.videolar.find((x) => !haric.includes(x.id));
        if (!v || !/^[\w-]{6,20}$/.test(v.id)) return;

        const baslik = (v.baslik || '').replace(/\s*#shorts\b/gi, '').trim() || 'The Turbine Tech';
        const f = document.createElement('iframe');
        f.src = 'https://www.youtube-nocookie.com/embed/' + v.id;
        f.title = baslik;
        f.loading = 'lazy';
        f.allowFullscreen = true;
        f.allow = 'accelerometer; encrypted-media; gyroscope; picture-in-picture';
        kart.querySelector('.an-video-kutu').replaceChildren(f);

        const fc = kart.querySelector('figcaption');
        const rozet = document.createElement('span');
        rozet.className = 'an-video-yeni';
        rozet.textContent = 'Son paylaşım';
        const a = document.createElement('a');
        a.href = (v.kisa ? 'https://www.youtube.com/shorts/' : 'https://www.youtube.com/watch?v=') + v.id;
        a.target = '_blank';
        a.rel = 'noreferrer noopener';
        a.textContent = baslik;
        fc.replaceChildren(rozet, ' ', a);
        kart.dataset.kaynak = 'youtube';
      })
      .catch(() => {});
  };

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((g) => {
      if (g.some((x) => x.isIntersecting)) { io.disconnect(); yukle(); }
    }, { rootMargin: '600px 0px' });
    io.observe(kart);
  } else {
    yukle();
  }
})();
