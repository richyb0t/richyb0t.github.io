/* ── EmailJS ──────────────────────────────────────── */
(function () {
  if (typeof emailjs !== 'undefined') emailjs.init('P8_29jAf2zFc0kVSV');
})();

/* ── Shared scroll state ──────────────────────────── */
let _scrollY = window.scrollY;
window.addEventListener('scroll', () => { _scrollY = window.scrollY; }, { passive: true });

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
    if (!link) return;
    const href = link.getAttribute('href');
    if (href && href.startsWith('#')) {
      e.preventDefault();
      closeMenu();
      const target = document.querySelector(href);
      if (target) setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 320);
    } else { closeMenu(); }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) closeMenu();
  });
})();

/* ── Smooth scroll for nav links ──────────────────── */
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const target = document.querySelector(a.getAttribute('href'));
  if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
});

/* ─────────────────────────────────────────────────────
   CINEMATIC PARALLAX — GPU-only, single RAF loop

   KEY FIXES vs previous version:
   1. filter REMOVED from the RAF loop → stays as static CSS value on each layer.
      filter forces a composited paint on the oversized (-15% inset) layer every frame;
      moving it to CSS lets the browser cache the painted surface and only composite.
   2. Lerp converge guard raised 0.12 → 1.0 to stop needless extra frames.
   3. heroLeft scroll-transform and mouse-transform unified into one write per frame
      using separate offset variables; no more fighting between two RAF loops.
   4. Canvas particles paused via IntersectionObserver when hero exits viewport.
   ───────────────────────────────────────────────────── */
(function initParallax() {
  const images = [
    'https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=1800&auto=format&fit=crop&q=75',
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1800&auto=format&fit=crop&q=75',
    'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1800&auto=format&fit=crop&q=75',
  ];
  const tints = [
    'rgba(5,10,30,0.08)',
    'rgba(10,20,10,0.06)',
    'rgba(30,10,5,0.06)',
  ];

  let cBg    = document.getElementById('cinema-bg');
  let tintEl = document.getElementById('cinema-tint');
  if (!cBg)    { cBg    = document.createElement('div'); cBg.id    = 'cinema-bg';   document.body.insertBefore(cBg,    document.body.firstChild); }
  if (!tintEl) { tintEl = document.createElement('div'); tintEl.id = 'cinema-tint'; document.body.insertBefore(tintEl, document.body.firstChild); }

  const hero   = document.querySelector('.hero');
  const heroBg = hero && hero.querySelector('.hero-parallax-bg');

  const mqMobile = window.matchMedia('(max-width: 900px)');
  let isMobile = mqMobile.matches;
  let depthBase, depthStep, heroDepth, lerpFactor;

  function applyMotionConfig() {
    isMobile   = mqMobile.matches;
    depthBase  = isMobile ? 0.11 : 0.17;
    depthStep  = isMobile ? 0.022 : 0.032;
    heroDepth  = isMobile ? 0.22 : 0.34;
    lerpFactor = isMobile ? 0.13 : 0.10;   // slightly faster → converges in fewer frames
  }
  applyMotionConfig();
  mqMobile.addEventListener('change', applyMotionConfig);

  const layers = images.map((src, i) => {
    const div = document.createElement('div');
    div.className = 'cinema-layer' + (i === 0 ? ' active' : '');
    div.style.backgroundImage = `url('${src}')`;
    cBg.appendChild(div);
    return div;
  });

  if (heroBg) heroBg.style.backgroundImage = `url('${images[0]}')`;

  let heroH = hero ? hero.offsetHeight : 0;
  window.addEventListener('resize', () => { heroH = hero ? hero.offsetHeight : 0; }, { passive: true });

  let current = 0, rafId = 0;
  let targetY = window.scrollY, smoothY = targetY;

  const heroLeft = hero && hero.querySelector('.hero-left');
  let heroLeftReady = false;
  if (heroLeft) {
    heroLeft.addEventListener('animationend', () => { heroLeftReady = true; }, { once: true });
    setTimeout(() => { heroLeftReady = true; }, 800);
  }

  // Separate scroll-offset and mouse-offset for heroLeft; combined in one write per frame
  let hlScrollTy = 0, hlScrollOp = 1;
  let hlMouseX = 0, hlMouseY = 0;

  function setLayer(idx) {
    if (idx === current) return;
    const prev = layers[current];
    prev.classList.remove('active'); prev.classList.add('previous');
    current = idx; layers[current].classList.add('active');
    if (tintEl) tintEl.style.background = tints[idx] || 'transparent';
    const cleanup = () => prev.classList.remove('previous');
    prev.addEventListener('transitionend', cleanup, { once: true });
    setTimeout(cleanup, 1700);
  }

  function update() {
    rafId = 0;

    smoothY += (targetY - smoothY) * lerpFactor;
    if (Math.abs(targetY - smoothY) < 1.0) smoothY = targetY;

    const sy       = smoothY;
    const maxH     = document.documentElement.scrollHeight - window.innerHeight;
    const progress = sy / (maxH || 1);
    const vh       = window.innerHeight;

    // Cinema layers: use a viewport-normalized offset so the background keeps moving
    // through all sections without ever drifting out of the -15% inset margin.
    // Formula: map scroll progress [0..1] → translateY range [-8vh .. +8vh].
    // Each layer gets a slightly different range (depthStep) for depth separation.
    for (let i = 0; i < layers.length; i++) {
      const range = vh * (0.08 + i * 0.03);           // e.g. 8vh, 11vh, 14vh
      const ty    = (progress - 0.5) * range * 2;     // centered: -range at top, +range at bottom
      layers[i].style.transform = `translateY(${ty.toFixed(1)}px) scale(1.26)`;
    }

    // heroBg inside the hero section still uses raw scroll (only visible in hero viewport)
    if (heroBg) {
      heroBg.style.transform = `translateY(${sy * heroDepth}px) scale(1.32)`;
    }

    if (heroLeft) {
      const hp = Math.min(sy / (heroH * 0.6 || 1), 1);
      hlScrollTy = sy * 0.08;
      hlScrollOp = Math.max(0, 1 - hp * 1.6);

      heroLeft.style.transform = `translate(${hlMouseX}px, ${hlScrollTy + hlMouseY}px)`;
      if (heroLeftReady) heroLeft.style.opacity = hlScrollOp.toString();
    }

    setLayer(Math.min(Math.floor(progress * images.length), images.length - 1));

    if (Math.abs(targetY - smoothY) > 1.0) rafId = requestAnimationFrame(update);
  }

  window.addEventListener('scroll', () => {
    targetY = _scrollY;
    if (!rafId) rafId = requestAnimationFrame(update);
  }, { passive: true });

  // Mouse parallax on heroBg background-position (cheap — no layout)
  if (hero && heroBg && !isMobile) {
    let rafMouse = 0;
    hero.addEventListener('mousemove', e => {
      if (rafMouse) return;
      rafMouse = requestAnimationFrame(() => {
        rafMouse = 0;
        const rect = hero.getBoundingClientRect();
        const mx   = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
        const my   = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;
        heroBg.style.backgroundPosition = `${50 + mx * 2.6}% ${50 + my * 2}%`;

        // FIX: update mouse offset vars, trigger unified write via main RAF
        if (heroLeft) {
          const strength = (e.clientX - rect.left) < rect.width * 0.6 ? 1 : 0.4;
          hlMouseX = (mx / 2) * 10 * strength;
          hlMouseY = (my / 2) *  6 * strength;
          if (!rafId) rafId = requestAnimationFrame(update);
        }
      });
    }, { passive: true });

    hero.addEventListener('mouseleave', () => {
      heroBg.style.backgroundPosition = '50% 50%';
      if (heroLeft) {
        hlMouseX = 0; hlMouseY = 0;
        heroLeft.style.transition = 'transform 0.7s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s';
        heroLeft.style.transform  = `translate(0px, ${hlScrollTy}px)`;
        heroLeft.addEventListener('transitionend', () => { heroLeft.style.transition = ''; }, { once: true });
      }
    });
  }

  targetY = window.scrollY;
  smoothY = targetY;
  update();
})();

/* ── Visitor counter ──────────────────────────────── */
(function () {
  const el = document.getElementById('visitorCount');
  if (!el) return;
  try {
    const key   = 'rhc_visits';
    const count = (parseInt(localStorage.getItem(key) || '0', 10) || 0) + 1;
    localStorage.setItem(key, count);
    el.textContent = `${count} visita${count === 1 ? '' : 's'} · v3.0`;
  } catch {
    el.textContent = 'visitas no disponibles · v3.0';
  }
})();

/* ── About section tilt ───────────────────────────── */
(function () {
  const aboutCard = document.querySelector('.about-main');
  if (!aboutCard) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let rafA = 0;
  aboutCard.addEventListener('mousemove', e => {
    const r  = aboutCard.getBoundingClientRect();
    const dx = (e.clientX - r.left) / r.width  - 0.5;
    const dy = (e.clientY - r.top)  / r.height - 0.5;
    if (!rafA) {
      rafA = requestAnimationFrame(() => {
        rafA = 0;
        aboutCard.style.transform = `perspective(900px) rotateX(${(-dy * 1.8).toFixed(2)}deg) rotateY(${(dx * 2.4).toFixed(2)}deg) translateY(-3px)`;
        aboutCard.style.setProperty('--about-glow-x', `${(dx + 0.5) * 100}%`);
        aboutCard.style.setProperty('--about-glow-y', `${(dy + 0.5) * 100}%`);
      });
    }
  });
  aboutCard.addEventListener('mouseleave', () => {
    if (rafA) { cancelAnimationFrame(rafA); rafA = 0; }
    aboutCard.style.transform = '';
    aboutCard.style.setProperty('--about-glow-x', '50%');
    aboutCard.style.setProperty('--about-glow-y', '50%');
  });
})();

/* ── Toast ────────────────────────────────────────── */
function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className = 'toast show' + (type ? ' ' + type : '');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.className = 'toast' + (type ? ' ' + type : ''); }, 4000);
}

/* ── Contact form ─────────────────────────────────── */
const _emailRE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

document.addEventListener('DOMContentLoaded', () => {
  const form    = document.getElementById('contactForm');
  const btnSend = document.getElementById('btnSend');
  if (!form || !btnSend) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const name    = form.name.value.trim();
    const email   = form.email.value.trim();
    const message = form.message.value.trim();

    if (!name || !email || !message) { showToast('completa todos los campos', 'error'); return; }
    if (!_emailRE.test(email))        { showToast('email inválido', 'error'); return; }

    btnSend.disabled = true;
    btnSend.innerHTML = '<i class="fas fa-spinner fa-spin"></i> enviando...';

    const reset = () => {
      btnSend.disabled = false;
      btnSend.innerHTML = '<i class="fas fa-paper-plane"></i> enviar mensaje';
    };

    if (typeof emailjs !== 'undefined') {
      emailjs.send('service_dfnkfw8', 'template_ci74phj', { from_name: name, from_email: email, message })
        .then(() => { reset(); showToast('mensaje enviado. gracias ' + name + '!', 'success'); form.reset(); })
        .catch(() => { reset(); showToast('error al enviar, intenta más tarde', 'error'); });
    } else {
      setTimeout(() => { reset(); showToast('emailjs no disponible', 'error'); }, 800);
    }
  });
});

/* ── Download CV ──────────────────────────────────── */
function downloadCV() {
  const a = document.createElement('a');
  a.href = 'assets/docs/CV.pdf';
  a.download = 'CV_RicardoHernandezCastro.pdf';
  a.click();
  showToast('descargando CV...', 'success');
}

/* ── Scroll reveal ────────────────────────────────── */
(function () {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => observer.observe(el));
})();

/* ── Hero micro-animations ────────────────────────── */
(function () {
  /* 1. Character-by-character reveal */
  const heroName = document.querySelector('.hero-name');
  if (heroName) {
    function wrapChars(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        for (const ch of node.textContent) {
          if (ch === ' ') { frag.appendChild(document.createTextNode(' ')); continue; }
          const s = document.createElement('span');
          s.className = 'hero-char'; s.textContent = ch;
          frag.appendChild(s);
        }
        node.parentNode.replaceChild(frag, node);
      } else if (node.nodeName === 'EM') {
        Array.from(node.childNodes).forEach(wrapChars);
      }
    }
    Array.from(heroName.childNodes).forEach(wrapChars);
    heroName.querySelectorAll('.hero-char').forEach((el, i) => el.style.setProperty('--ci', i));
  }

  /* 2. Decorative line */
  const heroSub = document.querySelector('.hero-sub');
  if (heroSub) {
    const line = document.createElement('div');
    line.className = 'hero-deco-line';
    heroSub.insertAdjacentElement('afterend', line);
    heroSub.classList.add('hero-sub-reveal');
  }

  /* 3. Magnetic nav links */
  document.querySelectorAll('.hero-nav a').forEach(link => {
    let rafM = 0;
    link.addEventListener('mousemove', e => {
      if (rafM) return;
      rafM = requestAnimationFrame(() => {
        rafM = 0;
        const r  = link.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width  / 2)) * 0.28;
        const dy = (e.clientY - (r.top  + r.height / 2)) * 0.28;
        link.style.transform = `translate(${dx}px, ${dy}px)`;
      });
    });
    link.addEventListener('mouseleave', () => {
      link.style.transition = 'transform 0.55s cubic-bezier(0.34,1.56,0.64,1), color 0.25s, gap 0.25s';
      link.style.transform  = '';
      link.addEventListener('transitionend', () => { link.style.transition = ''; }, { once: true });
    });
  });

  /* 4. Floating particles (canvas)
     FIX: IntersectionObserver pauses the RAF loop when hero is off-screen,
     so we're not burning GPU time drawing into an invisible canvas. */
  const heroLeft = document.querySelector('.hero-left');
  const hero     = document.querySelector('.hero');
  if (!hero || !heroLeft) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'hero-particle-canvas';
  hero.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let W, H, pts, rafP = 0, resizeTimer;
  let heroVisible = true; // assume visible at start

  function resize() {
    W = canvas.width  = hero.offsetWidth;
    H = canvas.height = hero.offsetHeight;
    mkPts();
  }

  function mkPts() {
    pts = Array.from({ length: 28 }, () => ({
      x: Math.random() * W * 0.45,
      y: Math.random() * H,
      r: Math.random() * 1.2 + 0.2,
      dx: (Math.random() - 0.5) * 0.15,
      dy: -(Math.random() * 0.2 + 0.04),
      a: Math.random() * 0.28 + 0.06,
      ph: Math.random() * Math.PI * 2,
    }));
  }

  function draw() {
    // FIX: stop loop if tab hidden OR hero scrolled out of view
    if (document.hidden || !heroVisible) { rafP = 0; return; }
    ctx.clearRect(0, 0, W, H);
    for (const p of pts) {
      p.ph += 0.009;
      const alpha = p.a * (0.55 + 0.45 * Math.sin(p.ph));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(212,212,200,${alpha.toFixed(3)})`;
      ctx.fill();
      p.x += p.dx; p.y += p.dy;
      if (p.y < -4) { p.y = H + 4; p.x = Math.random() * W * 0.45; }
    }
    rafP = requestAnimationFrame(draw);
  }

  function startDraw() { if (!rafP) rafP = requestAnimationFrame(draw); }

  // Pause when hero leaves viewport, resume when it returns
  const heroObs = new IntersectionObserver(entries => {
    heroVisible = entries[0].isIntersecting;
    if (heroVisible) startDraw();
    // if not visible, draw() self-cancels on its next frame
  }, { threshold: 0 });
  heroObs.observe(hero);

  document.addEventListener('visibilitychange', () => { if (!document.hidden) startDraw(); });

  resize();
  startDraw();

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 100);
  }, { passive: true });
})();

/* ── Page fade-in ─────────────────────────────────── */
window.addEventListener('load', () => {
  requestAnimationFrame(() => document.body.classList.add('loaded'));
});

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

/* ── Text Shimmer ─────────────────────────────────── */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('.hero-sub').forEach(el => el.classList.add('shimmer-text'));
  const logo = document.querySelector('.nav-logo');
  if (logo) logo.classList.add('shimmer-text-strong');
  document.querySelectorAll('[data-shimmer]').forEach(el => {
    el.classList.add(el.dataset.shimmer === 'strong' ? 'shimmer-text-strong' : 'shimmer-text');
  });
})();

/* ── Blur-In word by word ─────────────────────────── */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const SELECTORS = ['.about-bio', '.contact-sub', '[data-blur-in]'];

  function wrapWords(el) {
    if (el.dataset.blurReady) return;
    el.dataset.blurReady = '1';
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = '';
    el.classList.add('blur-in-text');
    if (el.dataset.blurIn === 'fast') el.classList.add('blur-in-fast');
    words.forEach((word, i) => {
      const span = document.createElement('span');
      span.className = 'blur-word'; span.textContent = word;
      span.style.setProperty('--wi', i);
      el.appendChild(span);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible'); observer.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll(SELECTORS.join(', ')).forEach(el => { wrapWords(el); observer.observe(el); });
})();

/* ── Number Ticker ────────────────────────────────── */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function animateTicker(el, from, to, duration) {
    const start = performance.now();
    function easeOutExpo(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }
    function step(now) {
      const elapsed = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(from + (to - from) * easeOutExpo(elapsed)).toLocaleString('es-MX');
      if (elapsed < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  const ticker_observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const to = parseInt(el.dataset.tickerTarget || el.textContent, 10);
      if (isNaN(to)) return;
      animateTicker(el, parseInt(el.dataset.tickerFrom || '0', 10), to, 1400);
      ticker_observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  const vcEl = document.getElementById('visitorCount');
  if (vcEl) {
    const mu = new MutationObserver(() => {
      const num = parseInt(vcEl.textContent, 10);
      if (!isNaN(num) && num > 0) {
        mu.disconnect();
        vcEl.dataset.tickerTarget = num;
        vcEl.dataset.tickerFrom   = Math.max(1, num - Math.min(num, 20));
        ticker_observer.observe(vcEl);
      }
    });
    mu.observe(vcEl, { childList: true, subtree: true, characterData: true });
  }

  document.querySelectorAll('[data-ticker]').forEach(el => {
    const to = parseInt(el.dataset.ticker, 10);
    if (isNaN(to)) return;
    el.dataset.tickerTarget = to; el.dataset.tickerFrom = '0';
    ticker_observer.observe(el);
  });
})();

/* ── Magnetic Button ──────────────────────────────── */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.matchMedia('(hover: none)').matches) return;

  const STRENGTH_OUTER = 0.38, STRENGTH_INNER = 0.62, RADIUS_FACTOR = 0.6;

  function makeMagnetic(btn) {
    if (btn.dataset.magneticReady) return;
    btn.dataset.magneticReady = '1';
    btn.classList.add('magnetic-btn');

    const inner = document.createElement('span');
    inner.className = 'magnetic-inner';
    while (btn.firstChild) inner.appendChild(btn.firstChild);
    btn.appendChild(inner);

    let raf = 0;
    function applyForce(cx, cy) {
      const r    = btn.getBoundingClientRect();
      const dx   = cx - (r.left + r.width  / 2);
      const dy   = cy - (r.top  + r.height / 2);
      const radius = Math.max(r.width, r.height) * RADIUS_FACTOR;
      if (Math.hypot(dx, dy) < radius) {
        btn.style.transform   = `translate(${(dx * STRENGTH_OUTER).toFixed(2)}px, ${(dy * STRENGTH_OUTER).toFixed(2)}px)`;
        inner.style.transform = `translate(${(dx * (STRENGTH_INNER - STRENGTH_OUTER)).toFixed(2)}px, ${(dy * (STRENGTH_INNER - STRENGTH_OUTER)).toFixed(2)}px)`;
      } else {
        btn.style.transform = inner.style.transform = '';
      }
    }
    function onMove(e) {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; applyForce(e.clientX, e.clientY); });
    }
    window.addEventListener('mousemove', onMove, { passive: true });
    btn.addEventListener('mouseleave', () => { btn.style.transform = inner.style.transform = ''; });
  }

  document.querySelectorAll('.btn-cv, .btn-send, [data-magnetic]').forEach(makeMagnetic);
})();