/* ═══════════════════════════════════════════════════
   SHARED.JS — Sub-pages (app, bot, web)
   Self-contained: no ES module imports
   ═══════════════════════════════════════════════════ */

/* ── Shared scroll state ──────────────────────────── */
let _scrollY = window.scrollY;
window.addEventListener('scroll', () => { _scrollY = window.scrollY; }, { passive: true });

/* ── Page fade-in ─────────────────────────────────── */
window.addEventListener('load', () => {
  requestAnimationFrame(() => document.body.classList.add('loaded'));
});

/* ── Page transition overlay ──────────────────────── */
(function () {
  const overlay = document.getElementById('pageTransition');
  if (!overlay) return;
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto') || link.target === '_blank') return;
    e.preventDefault();
    overlay.classList.add('entering');
    setTimeout(() => { window.location.href = href; }, 420);
  });
})();

/* ── Navbar scroll state ──────────────────────────── */
(function () {
  const nav = document.getElementById('navbar');
  if (!nav) return;
  let wasScrolled = false;
  window.addEventListener('scroll', () => {
    const isScrolled = _scrollY > 40;
    if (isScrolled !== wasScrolled) {
      nav.classList.toggle('scrolled', isScrolled);
      wasScrolled = isScrolled;
    }
  }, { passive: true });
})();

/* ── Hamburger menu ───────────────────────────────── */
(function () {
  const toggle  = document.getElementById('menuToggle');
  const drawer  = document.getElementById('navDrawer');
  const overlay = document.getElementById('navOverlay');
  if (!toggle || !drawer) return;

  function openMenu() {
    toggle.classList.add('active');
    drawer.classList.add('open');
    overlay?.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function closeMenu() {
    toggle.classList.remove('active');
    drawer.classList.remove('open');
    overlay?.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  toggle.addEventListener('click', () => drawer.classList.contains('open') ? closeMenu() : openMenu());
  overlay?.addEventListener('click', closeMenu);
  drawer.addEventListener('click', e => {
    const link = e.target.closest('a');
    if (link) closeMenu();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) closeMenu();
  });
})();

/* ── Scroll-to-top button ─────────────────────────── */
(function () {
  const btn = document.createElement('button');
  btn.innerHTML = '<i class="fas fa-arrow-up"></i>';
  btn.setAttribute('aria-label', 'Volver arriba');
  btn.className = 'scroll-top-btn';
  document.body.appendChild(btn);

  let btnVisible = false;
  window.addEventListener('scroll', () => {
    const shouldShow = _scrollY > 400;
    if (shouldShow !== btnVisible) {
      btn.classList.toggle('visible', shouldShow);
      btnVisible = shouldShow;
    }
  }, { passive: true });

  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

/* ── Scroll progress bar ──────────────────────────── */
(function () {
  const bar = document.getElementById('scrollBar');
  if (!bar) return;
  let scrollMax = document.documentElement.scrollHeight - window.innerHeight;
  window.addEventListener('resize', () => {
    scrollMax = document.documentElement.scrollHeight - window.innerHeight;
  }, { passive: true });
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        bar.style.transform = `scaleX(${_scrollY / (scrollMax || 1)})`;
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();

/* ── Cinematic parallax ───────────────────────────── */
(function () {
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
  const tints = {
    app: ['rgba(5,15,30,0.07)', 'rgba(5,20,40,0.06)'],
    bot: ['rgba(10,5,30,0.07)', 'rgba(5,10,25,0.06)'],
    web: ['rgba(5,25,10,0.07)', 'rgba(10,20,5,0.06)'],
  };

  const images   = PAGE_SETS[page] || PAGE_SETS.app;
  const pageTints = tints[page]    || tints.app;

  let cBg = document.getElementById('cinema-bg');
  if (!cBg) {
    cBg = document.createElement('div');
    cBg.id = 'cinema-bg';
    document.body.insertBefore(cBg, document.body.firstChild);
  }
  let tintEl = document.getElementById('cinema-tint');
  if (!tintEl) {
    tintEl = document.createElement('div');
    tintEl.id = 'cinema-tint';
    document.body.insertBefore(tintEl, document.body.firstChild);
  }

  const layers = images.map((src, i) => {
    const div = document.createElement('div');
    div.className = 'cinema-layer' + (i === 0 ? ' active' : '');
    div.style.backgroundImage = `url('${src}')`;
    cBg.appendChild(div);
    return div;
  });

  const hero = document.querySelector('.hero');
  const heroBg = hero?.querySelector('.hero-parallax-bg');
  if (heroBg) heroBg.style.backgroundImage = `url('${images[0]}')`;

  let heroH = hero ? hero.offsetHeight : 0;
  window.addEventListener('resize', () => { heroH = hero ? hero.offsetHeight : 0; }, { passive: true });

  let current = 0, targetY = _scrollY, smoothY = targetY, rafId = 0;
  const mqMobile = window.matchMedia('(max-width: 900px)');

  function getConfig() {
    return mqMobile.matches
      ? { depthBase: 0.11, depthStep: 0.022, heroDepth: 0.22, lerp: 0.11 }
      : { depthBase: 0.17, depthStep: 0.032, heroDepth: 0.34, lerp: 0.08 };
  }

  function setLayer(idx) {
    if (idx === current) return;
    const prev = layers[current];
    prev.classList.remove('active'); prev.classList.add('previous');
    current = idx; layers[current].classList.add('active');
    if (tintEl) tintEl.style.background = pageTints[idx] || 'transparent';
    const cleanup = () => prev.classList.remove('previous');
    prev.addEventListener('transitionend', cleanup, { once: true });
    setTimeout(cleanup, 1700);
  }

  function update() {
    rafId = 0;
    const { depthBase, depthStep, heroDepth, lerp } = getConfig();
    smoothY += (targetY - smoothY) * lerp;
    if (Math.abs(targetY - smoothY) < 0.12) smoothY = targetY;

    const sy       = smoothY;
    const maxH     = document.documentElement.scrollHeight - window.innerHeight;
    const progress = sy / (maxH || 1);
    const bri      = (0.12 + progress * 0.06).toFixed(3);
    const filterStr = `brightness(${bri}) saturate(0.28) grayscale(0.5)`;

    for (let i = 0; i < layers.length; i++) {
      layers[i].style.transform = `translateY(${sy * (depthBase + i * depthStep)}px) scale(1.35)`;
      layers[i].style.filter    = filterStr;
    }

    if (heroBg) heroBg.style.transform = `translateY(${sy * heroDepth}px) scale(1.5)`;

    const heroContent = hero?.querySelector('.hero-content');
    if (heroContent) {
      const hp = Math.min(sy / (heroH * 0.6 || 1), 1);
      heroContent.style.opacity   = Math.max(0, 1 - hp * 1.8).toString();
      heroContent.style.transform = `translateY(${sy * 0.08}px)`;
    }

    setLayer(Math.min(Math.floor(progress * images.length), images.length - 1));

    if (Math.abs(targetY - smoothY) > 0.12) rafId = requestAnimationFrame(update);
  }

  window.addEventListener('scroll', () => {
    targetY = _scrollY;
    if (!rafId) rafId = requestAnimationFrame(update);
  }, { passive: true });

  update();
})();

/* ── Scroll reveal (IntersectionObserver) ────────── */
(function () {
  const els = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
  if (!els.length) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.10, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => observer.observe(el));
})();

/* ── Blur-in word by word ─────────────────────────── */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function wrapWords(el) {
    if (el.dataset.blurReady) return;
    el.dataset.blurReady = '1';
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = '';
    el.classList.add('blur-in-text');
    words.forEach((word, i) => {
      const span = document.createElement('span');
      span.className = 'blur-word';
      span.textContent = word;
      span.style.setProperty('--wi', i);
      el.appendChild(span);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
  }

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.about-text p, [data-blur-in]').forEach(el => {
    wrapWords(el); obs.observe(el);
  });
})();

/* ── Text shimmer ─────────────────────────────────── */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const logo = document.querySelector('.logo');
  if (logo) logo.classList.add('shimmer-text-strong');
  document.querySelectorAll('.project-badge').forEach(el => el.classList.add('shimmer-text'));
})();

/* ── Skill tags stagger ───────────────────────────── */
(function () {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.querySelectorAll('.skill-tag').forEach((tag, i) => {
        tag.style.setProperty('--stagger-i', i);
        setTimeout(() => tag.classList.add('visible'), i * 60);
      });
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.2 });
  document.querySelectorAll('.skills').forEach(el => obs.observe(el));
})();

/* ── About card tilt ──────────────────────────────── */
(function () {
  const card = document.querySelector('.about-main');
  if (!card) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let raf = 0;
  card.addEventListener('mousemove', e => {
    const r  = card.getBoundingClientRect();
    const dx = (e.clientX - r.left) / r.width  - 0.5;
    const dy = (e.clientY - r.top)  / r.height - 0.5;
    if (!raf) {
      raf = requestAnimationFrame(() => {
        raf = 0;
        card.style.transform = `perspective(900px) rotateX(${(-dy * 1.8).toFixed(2)}deg) rotateY(${(dx * 2.4).toFixed(2)}deg) translateY(-3px)`;
        card.style.setProperty('--about-glow-x', `${(dx + 0.5) * 100}%`);
        card.style.setProperty('--about-glow-y', `${(dy + 0.5) * 100}%`);
      });
    }
  });
  card.addEventListener('mouseleave', () => {
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    card.style.transform = '';
  });
})();

/* ── Carousel ─────────────────────────────────────── */
(function () {
  const track    = document.getElementById('carouselTrack');
  const prevBtn  = document.getElementById('prevBtn');
  const nextBtn  = document.getElementById('nextBtn');
  const dotsWrap = document.getElementById('carouselDots');
  if (!track || !dotsWrap) return;

  const total = track.children.length;
  if (total === 0) return;
  let current = 0, autoTimer = 0;

  const frag = document.createDocumentFragment();
  for (let i = 0; i < total; i++) {
    const dot = document.createElement('button');
    dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
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

  dotsWrap.addEventListener('click', e => {
    const dot = e.target.closest('.carousel-dot');
    if (dot) { goTo([...dots].indexOf(dot)); resetAuto(); }
  });
  prevBtn?.addEventListener('click', () => { goTo(current - 1); resetAuto(); });
  nextBtn?.addEventListener('click', () => { goTo(current + 1); resetAuto(); });

  function startAuto() { clearInterval(autoTimer); autoTimer = setInterval(() => goTo(current + 1), 3800); }
  function resetAuto() { startAuto(); }
  startAuto();

  const wrap = document.getElementById('carousel');
  wrap?.addEventListener('mouseenter', () => clearInterval(autoTimer));
  wrap?.addEventListener('mouseleave', startAuto);

  let startX = 0, deltaX = 0;
  track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchmove',  e => { deltaX = e.touches[0].clientX - startX; }, { passive: true });
  track.addEventListener('touchend',   () => {
    if (Math.abs(deltaX) > 50) { goTo(deltaX < 0 ? current + 1 : current - 1); resetAuto(); }
    deltaX = 0;
  });
})();
