/* Soner Soylu — restrained motion layer; native scrolling remains the only scroll source. */
(function () {
  'use strict';
  if (window.__sonerCinematicV5) return;
  window.__sonerCinematicV5 = true;

  var reduced = matchMedia('(prefers-reduced-motion: reduce)');
  var finePointer = matchMedia('(pointer: fine)');
  var body, progressBar, scrollTick = false;
  function qs(selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }

  function onScroll() {
    if (scrollTick) return;
    scrollTick = true;
    requestAnimationFrame(function () {
      scrollTick = false;
      var max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      if (progressBar) progressBar.style.transform = 'scaleX(' + Math.max(0, Math.min(1, scrollY / max)) + ')';
      body.classList.toggle('ss-scrolled', scrollY > 24);
    });
  }
  function progress() {
    var bar = document.createElement('div');
    bar.className = 'ss-cinematic-progress';
    bar.setAttribute('aria-hidden', 'true');
    progressBar = document.createElement('span');
    bar.appendChild(progressBar);
    body.appendChild(bar);
  }
  function reveal() {
    var targets = qs('main section > .ic, main section > .bas, main section > .kartlar, main section > .gal, main section > .vaka, main section > .kanal');
    if (reduced.matches || !('IntersectionObserver' in window)) return;
    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.03 });
    targets.forEach(function (el) {
      if (el.getBoundingClientRect().top < innerHeight * 1.1) return;
      el.classList.add('ss-reveal');
      observer.observe(el);
    });
    reduced.addEventListener('change', function () {
      if (reduced.matches) targets.forEach(function (el) { el.classList.add('is-visible'); });
    });
  }
  function magnetic() {
    if (!finePointer.matches || reduced.matches) return;
    qs('a.dg.birincil, a.plate, .dny-atla').forEach(function (el) {
      el.dataset.ssMagnetic = 'true';
      el.addEventListener('pointermove', function (event) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--ss-mx', Math.max(-3, Math.min(3, (event.clientX - r.left - r.width / 2) * .06)).toFixed(2) + 'px');
        el.style.setProperty('--ss-my', Math.max(-3, Math.min(3, (event.clientY - r.top - r.height / 2) * .06)).toFixed(2) + 'px');
      }, { passive: true });
      el.addEventListener('pointerleave', function () {
        el.style.setProperty('--ss-mx', '0px'); el.style.setProperty('--ss-my', '0px');
      }, { passive: true });
    });
  }
  function performanceMode() {
    var key = 'ss-performance-mode', enabled = false;
    try { enabled = new URLSearchParams(location.search).get('performance') === '1' || localStorage.getItem(key) === '1'; } catch (e) {}
    function apply(value) {
      enabled = value;
      body.classList.toggle('ss-performance-mode', enabled);
      try { localStorage.setItem(key, enabled ? '1' : '0'); } catch (e) {}
      dispatchEvent(new CustomEvent('ss:performance', { detail: { enabled: enabled } }));
    }
    apply(enabled);
    document.addEventListener('keydown', function (event) {
      if (event.altKey && event.key.toLowerCase() === 'p' && !event.repeat) {
        event.preventDefault(); apply(!enabled);
      }
    });
  }
  function boot() {
    body = document.body;
    if (!body || !document.querySelector('main section[id]')) return;
    body.classList.add('ss-cinematic-ready');
    progress(); reveal(); magnetic(); performanceMode();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll, { passive: true });
    onScroll();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}());
