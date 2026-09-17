/* giris.js — kapağın ilk anı: imleçle gelen derinlik.
 * Kaydırma dönüşümü .kapak-gorsel üstünde, açılış zoomu img/svg üstünde;
 * burası aradaki .kapak-kat katmanına yazıyor, böylece üçü çakışmıyor. */
(function () {
  'use strict';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  var kapak = document.querySelector('.kapak');
  if (!kapak) return;

  var hedefX = 0, hedefY = 0, bekleyen = false;
  function ciz() {
    bekleyen = false;
    kapak.style.setProperty('--pox', hedefX.toFixed(3));
    kapak.style.setProperty('--poy', hedefY.toFixed(3));
  }
  window.addEventListener('pointermove', function (e) {
    var r = kapak.getBoundingClientRect();
    if (r.bottom < 0) return;
    hedefX = Math.max(-1, Math.min(1, (e.clientX / window.innerWidth - 0.5) * 2));
    hedefY = Math.max(-1, Math.min(1, (e.clientY / window.innerHeight - 0.5) * 2));
    if (!bekleyen) { bekleyen = true; requestAnimationFrame(ciz); }
  }, { passive: true });
  window.addEventListener('pointerleave', function () {
    hedefX = hedefY = 0; ciz();
  }, { passive: true });
})();
