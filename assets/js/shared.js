
import {
  setupNavbar, setupHamburger, setupScrollTop, setupScrollReveal
} from './utils.js';

/* ── Init compartido ─── */
setupNavbar();
setupHamburger();
setupScrollTop();
setupScrollReveal('.reveal, .reveal-left, .reveal-right, .reveal-scale', 'visible');

/* ── Page transitions ─── */
(function () {
  const overlay = document.getElementById('pageTransition');
  if (!overlay) return;
  document.body.classList.add('page-loading');
  requestAnimationFrame(() => setTimeout(() => document.body.classList.remove('page-loading'), 60));
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) return;
    e.preventDefault();
    overlay.classList.add('entering');
    setTimeout(() => { window.location.href = href; }, 420);
  });
})();

/* ── Cinematic parallax sub-páginas ─── */
(function () {
  /* Página detectada via atributo en <body> para evitar querySelector frágil */
  const page = document.body.dataset.page || 'app';
  const PAGE_SETS = {
    app: [
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1800&auto=format&fit=crop&q=70',
      'https://images.unsplash.com/photo-1504439468489-c8920d796a29?w=1800&auto=format&fit=crop&q=70',
    ],
    bot: [
      'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=1800&auto=format&fit=crop&q=70',
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1800&auto=format&fit=crop&q=70',
    ],
    web: [
      'https://images.unsplash.com/photo-1547658719-da2b51169166?w=1800&auto=format&fit=crop&q=70',
      'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=1800&auto=format&fit=crop&q=70',
    ],
  };
  const images = PAGE_SETS[page] || PAGE_SETS.app;

  let cBg = document.getElementById('cinema-bg');
  if (!cBg) { cBg = document.createElement('div'); cBg.id = 'cinema-bg'; document.body.insertBefore(cBg, document.body.firstChild); }
  let tintEl = document.getElementById('cinema-tint');
  if (!tintEl) { tintEl = document.createElement('div'); tintEl.id = 'cinema-tint'; document.body.insertBefore(tintEl, document.body.firstChild); }

  const layers = images.map((src, i) => {
    const div = document.createElement('div');
    div.className = 'cinema-layer' + (i === 0 ? ' active' : '');
    div.style.backgroundImage = `url('${src}')`;
    cBg.appendChild(div);
    return div;
  });

  const hero = document.querySelector('.hero');
  if (hero) {
    let heroBg = hero.querySelector('.hero-parallax-bg');
    if (!heroBg) {
      heroBg = document.createElement('div');
      heroBg.className = 'hero-parallax-bg';
      hero.insertBefore(heroBg, hero.firstChild);
    }
    heroBg.style.backgroundImage = `url('${images[0]}')`;
  }

  let heroH = hero ? hero.offsetHeight : 0;
  window.addEventListener('resize', () => { heroH = hero ? hero.offsetHeight : 0; }, { passive: true });

  let current = 0, lastY = 0, ticking = false;

  function setLayer(idx) {
    if (idx === current) return;
    const prev = layers[current];
    prev.classList.remove('active'); prev.classList.add('previous');
    current = idx; layers[current].classList.add('active');
    const cleanup = () => prev.classList.remove('previous');
    prev.addEventListener('transitionend', cleanup, { once: true });
    setTimeout(cleanup, 1700);
  }

  function update() {
    ticking = false;
    const sy       = lastY;
    const maxH     = document.documentElement.scrollHeight - window.innerHeight;
    const progress = sy / (maxH || 1);
    const bri      = (0.12 + progress * 0.04).toFixed(3);
    const filter   = `brightness(${bri}) saturate(0.28) grayscale(0.5)`;

    for (let i = 0; i < layers.length; i++) {
      layers[i].style.transform = `translateY(${sy * (0.2 + i * 0.04)}px) scale(1.35)`;
      layers[i].style.filter    = filter;
    }

    const heroBg = hero?.querySelector('.hero-parallax-bg');
    if (heroBg) heroBg.style.transform = `translateY(${sy * 0.36}px) scale(1.5)`;

    const heroContent = hero?.querySelector('.hero-content');
    if (heroContent) {
      const hp = Math.min(sy / (heroH * 0.6 || 1), 1);
      heroContent.style.opacity   = Math.max(0, 1 - hp * 1.8).toString();
      heroContent.style.transform = `translateY(${sy * 0.08}px)`;
    }

    setLayer(Math.min(Math.floor(progress * images.length), images.length - 1));
  }

  window.addEventListener('scroll', () => {
    lastY = window.scrollY;
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });

  update();
})();

/* ── Carousel ─── */
(function () {
  const track    = document.getElementById('carouselTrack');
  const prevBtn  = document.getElementById('prevBtn');
  const nextBtn  = document.getElementById('nextBtn');
  const dotsWrap = document.getElementById('carouselDots');
  if (!track || !dotsWrap) return;

  const total = track.children.length;
  if (total === 0) return;
  let current = 0, autoTimer = 0;

  /* Dots con fragment (inserción única en DOM) */
  const frag = document.createDocumentFragment();
  for (let i = 0; i < total; i++) {
    const dot = document.createElement('button');
    dot.className  = 'carousel-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Slide ${i + 1}`);
    frag.appendChild(dot);
  }
  dotsWrap.appendChild(frag);
  const dots = dotsWrap.children;

  function goTo(idx) {
    dots[current].classList.remove('active');
    current = ((idx % total) + total) % total;
    track.style.transform = `translateX(-${current * 100}%)`;
    dots[current].classList.add('active');
  }

  /* Delegación: un listener por contenedor */
  dotsWrap.addEventListener('click', e => {
    const dot = e.target.closest('.carousel-dot');
    if (dot) { goTo([...dots].indexOf(dot)); resetAuto(); }
  });

  prevBtn?.addEventListener('click', () => { goTo(current - 1); resetAuto(); });
  nextBtn?.addEventListener('click', () => { goTo(current + 1); resetAuto(); });

  function startAuto() { clearInterval(autoTimer); autoTimer = setInterval(() => goTo(current + 1), 3800); }
  function stopAuto()  { clearInterval(autoTimer); }
  function resetAuto() { startAuto(); }
  startAuto();

  const wrap = document.getElementById('carousel');
  wrap?.addEventListener('mouseenter', stopAuto);
  wrap?.addEventListener('mouseleave', startAuto);

  /* Swipe táctil */
  let startX = 0, deltaX = 0;
  track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchmove',  e => { deltaX = e.touches[0].clientX - startX; }, { passive: true });
  track.addEventListener('touchend',   () => {
    if (Math.abs(deltaX) > 50) { goTo(deltaX < 0 ? current + 1 : current - 1); resetAuto(); }
    deltaX = 0;
  });
})();
