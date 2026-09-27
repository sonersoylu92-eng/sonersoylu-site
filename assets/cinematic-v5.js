/* Soner Soylu — additive motion system. No framework, no scroll hijack. */
(function () {
  'use strict';
  if (window.__sonerCinematicV5) return;
  window.__sonerCinematicV5 = true;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  var body, progress, progressBar, rail, sections;
  var scrollTick = false, pointerTick = false;
  var pointer = { x: 0, y: 0, tx: 0, ty: 0 };

  function qs(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }
  function textFor(section) {
    var id = section.getAttribute('aria-labelledby');
    var heading = id && document.getElementById(id);
    return (heading ? heading.textContent : section.id).trim().replace(/\s+/g, ' ');
  }
  function rafScroll() {
    if (scrollTick) return;
    scrollTick = true;
    requestAnimationFrame(function () {
      scrollTick = false;
      var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      var y = Math.max(0, Math.min(1, window.scrollY / max));
      if (progressBar) progressBar.style.transform = 'scaleX(' + y + ')';
      body.classList.toggle('ss-scrolled', window.scrollY > 24);
      var current = window.scrollY;
      body.classList.toggle('ss-scroll-up', current < (body.__ssLastY || 0));
      body.classList.toggle('ss-scroll-down', current > (body.__ssLastY || 0));
      body.__ssLastY = current;
    });
  }
  function addProgress() {
    progress = document.createElement('div');
    progress.className = 'ss-cinematic-progress';
    progress.setAttribute('aria-hidden', 'true');
    progressBar = document.createElement('span');
    progress.appendChild(progressBar);
    document.body.appendChild(progress);
  }
  function addRail() {
    if (sections.length < 3 || reduced || window.matchMedia('(pointer: coarse)').matches) return;
    rail = document.createElement('aside');
    rail.className = 'ss-section-rail';
    rail.setAttribute('aria-label', 'Bölüm göstergesi');
    sections.forEach(function (section, index) {
      var button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', textFor(section));
      button.dataset.section = section.id;
      button.addEventListener('click', function () {
        section.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      });
      rail.appendChild(button);
      section.dataset.ssRailIndex = String(index);
    });
    document.body.appendChild(rail);
  }
  function markActive(section) {
    if (!rail) return;
    qs('button', rail).forEach(function (button) {
      button.classList.toggle('is-active', button.dataset.section === section.id);
    });
  }
  function reveal() {
    var targets = qs('main section > .ic, main section > .dny-sahne, main section > .bas, main section > .kartlar, main section > .gal, main section > .vaka, main section > .kanal, footer .son-orta');
    if (reduced || !('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    targets.forEach(function (el, i) {
      el.classList.add('ss-reveal');
      if (i % 4) el.dataset.ssDelay = String(i % 4);
    });
    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: .08 });
    targets.forEach(function (el) { observer.observe(el); });
  }
  function activeSections() {
    if (!('IntersectionObserver' in window)) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) markActive(entry.target);
      });
    }, { rootMargin: '-42% 0px -42% 0px', threshold: 0 });
    sections.forEach(function (section) { observer.observe(section); });
  }
  function addParallax() {
    if (reduced || !finePointer) return;
    var hero = document.querySelector('.dny-ana .dny-sahne');
    if (!hero) return;
    var layers = qs('.dny-poster, .dny-kararti, .dny-acilis, .dny-kapak-alt, .dny-serit', hero);
    layers.forEach(function (el, i) {
      el.classList.add('ss-parallax');
      el.style.setProperty('--ss-depth', (0.04 + i * 0.025).toFixed(3));
    });
    hero.addEventListener('pointermove', function (event) {
      var rect = hero.getBoundingClientRect();
      pointer.tx = (event.clientX - rect.left) / rect.width * 2 - 1;
      pointer.ty = (event.clientY - rect.top) / rect.height * 2 - 1;
      if (pointerTick) return;
      pointerTick = true;
      requestAnimationFrame(function () {
        pointerTick = false;
        pointer.x += (pointer.tx * 18 - pointer.x) * .12;
        pointer.y += (pointer.ty * 12 - pointer.y) * .12;
        hero.style.setProperty('--ss-px', pointer.x.toFixed(2) + 'px');
        hero.style.setProperty('--ss-py', pointer.y.toFixed(2) + 'px');
      });
    }, { passive: true });
    hero.addEventListener('pointerleave', function () {
      pointer.tx = 0; pointer.ty = 0;
    }, { passive: true });
  }
  function addCursor() {
    if (!finePointer || reduced) return;
    var cursor = document.createElement('div');
    cursor.className = 'ss-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML = '<i></i>';
    document.body.appendChild(cursor);
    var x = -100, y = -100, tx = x, ty = y, tick = false;
    function move(event) {
      tx = event.clientX; ty = event.clientY;
      if (tick) return;
      tick = true;
      requestAnimationFrame(function () {
        tick = false;
        x += (tx - x) * .24; y += (ty - y) * .24;
        cursor.style.setProperty('--ss-cx', x.toFixed(2) + 'px');
        cursor.style.setProperty('--ss-cy', y.toFixed(2) + 'px');
      });
      cursor.classList.add('is-visible');
    }
    document.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerleave', function () { cursor.classList.remove('is-visible'); }, { passive: true });
    qs('a, button, input, textarea, select').forEach(function (el) {
      el.addEventListener('pointerenter', function () { cursor.classList.add('is-hover'); }, { passive: true });
      el.addEventListener('pointerleave', function () { cursor.classList.remove('is-hover'); }, { passive: true });
    });
  }
  function addMagnetic() {
    if (!finePointer || reduced) return;
    var targets = qs('a.plate, a.dg, a.birincil, button.dg, .v-miknatis, .dny-atla');
    targets.forEach(function (el) {
      el.dataset.ssMagnetic = 'true';
      el.addEventListener('pointermove', function (event) {
        var r = el.getBoundingClientRect();
        var x = (event.clientX - (r.left + r.width / 2)) * .12;
        var y = (event.clientY - (r.top + r.height / 2)) * .12;
        el.style.setProperty('--ss-mx', Math.max(-5, Math.min(5, x)).toFixed(2) + 'px');
        el.style.setProperty('--ss-my', Math.max(-4, Math.min(4, y)).toFixed(2) + 'px');
        el.classList.add('is-magnetic');
      }, { passive: true });
      el.addEventListener('pointerleave', function () {
        el.style.setProperty('--ss-mx', '0px');
        el.style.setProperty('--ss-my', '0px');
        el.classList.remove('is-magnetic');
      }, { passive: true });
    });
  }
  function performanceMode() {
    var key = 'ss-performance-mode';
    var enabled = false;
    try { enabled = new URLSearchParams(location.search).get('performance') === '1' || localStorage.getItem(key) === '1'; } catch (e) {}
    function apply(value) {
      enabled = value;
      body.classList.toggle('ss-performance-mode', enabled);
      try { localStorage.setItem(key, enabled ? '1' : '0'); } catch (e) {}
      window.dispatchEvent(new CustomEvent('ss:performance', { detail: { enabled: enabled } }));
    }
    apply(enabled);
    document.addEventListener('keydown', function (event) {
      if (event.altKey && event.key.toLowerCase() === 'p') {
        event.preventDefault();
        apply(!enabled);
      }
    });
  }
  function boot() {
    body = document.body;
    sections = qs('main section[id]');
    if (!body || !sections.length) return;
    body.classList.add('ss-cinematic-ready');
    addProgress();
    addRail();
    reveal();
    activeSections();
    addParallax();
    addCursor();
    addMagnetic();
    performanceMode();
    window.addEventListener('scroll', rafScroll, { passive: true });
    window.addEventListener('resize', rafScroll, { passive: true });
    rafScroll();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}());
