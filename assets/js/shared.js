/* ═══════════════════════════════════════════════════
   SHARED.JS — Sub-páginas (app, bot, web)
   Auto-contenido: sin imports de ES modules.
   Se carga con <script src="assets/js/shared.js"> al
   final del <body> en app.html, bot.html y web.html.

   TABLA DE CONTENIDOS
   ────────────────────────────────────────────────────
   1.  SCROLL STATE        — variable global _scrollY
   2.  PAGE FADE-IN        — body.loaded en window load
   3.  PAGE TRANSITION     — overlay de salida entre páginas
   4.  NAVBAR              — clase .scrolled al bajar > 40 px
   5.  HAMBURGER           — drawer lateral en móvil
   6.  SCROLL-TO-TOP       — botón flotante creado por JS
   7.  SCROLL PROGRESS BAR — línea 1 px de lectura en la cima
   8.  CINEMATIC PARALLAX  — fondo animado con RAF único
   9.  SCROLL REVEAL       — fade-in con IntersectionObserver
   10. BLUR-IN             — reveal palabra por palabra
   11. TEXT SHIMMER        — gradiente animado en logo y badges
   12. SKILL TAGS STAGGER  — aparición escalonada de etiquetas
   13. ABOUT CARD TILT     — efecto 3-D tilt con mouse
   14. CAROUSEL            — galería de imágenes con dots y swipe
   ═══════════════════════════════════════════════════ */


/* ───────────────────────────────────────────────────
   1. SCROLL STATE
   Mantiene _scrollY actualizado para que todos los
   módulos lean un solo valor por frame sin releer el
   layout (evita forced reflows innecesarios).
   ─────────────────────────────────────────────────── */
let _scrollY = window.scrollY;
window.addEventListener('scroll', () => { _scrollY = window.scrollY; }, { passive: true });
// passive:true indica al browser que nunca llamaremos
// preventDefault() en este listener → puede optimizar el scroll.


/* ───────────────────────────────────────────────────
   2. PAGE FADE-IN
   El body arranca con opacity:0 en shared.css.
   Al disparar 'load' (todo cargado: imágenes, fuentes)
   se añade .loaded → la transición CSS lo lleva a 1.
   requestAnimationFrame() asegura que el browser ya
   calculó el layout antes de cambiar el estado.
   ─────────────────────────────────────────────────── */
window.addEventListener('load', () => {
  requestAnimationFrame(() => document.body.classList.add('loaded'));
});


/* ───────────────────────────────────────────────────
   3. PAGE TRANSITION OVERLAY
   Al hacer clic en cualquier link interno, se activa
   #pageTransition (overlay negro) que cubre la pantalla
   antes de navegar, dando la sensación de corte de cine.
   Links externos, anclas (#) y _blank se ignoran.
   ─────────────────────────────────────────────────── */
(function () {
  const overlay = document.getElementById('pageTransition');
  if (!overlay) return; // guard: el elemento debe existir en el HTML

  document.addEventListener('click', e => {
    const link = e.target.closest('a[href]');
    if (!link) return;

    const href = link.getAttribute('href');

    // Ignora anclas locales, links externos y pestañas nuevas
    if (
      !href ||
      href.startsWith('#') ||
      href.startsWith('http') ||
      href.startsWith('mailto') ||
      link.target === '_blank'
    ) return;

    e.preventDefault();
    overlay.classList.add('entering'); // CSS anima translateY(-100% → 0)
    // Espera a que la animación termine (420 ms) antes de cambiar de URL
    setTimeout(() => { window.location.href = href; }, 420);
  });
})();


/* ───────────────────────────────────────────────────
   4. NAVBAR — Clase .scrolled
   Cuando el scroll supera 40 px se activa el blur y el
   borde inferior de la barra de navegación (definido en
   shared.css con .navbar.scrolled).
   wasScrolled evita modificar el DOM en cada evento
   scroll si el estado no cambió.
   ─────────────────────────────────────────────────── */
(function () {
  const nav = document.getElementById('navbar');
  if (!nav) return;

  let wasScrolled = false;

  window.addEventListener('scroll', () => {
    const isScrolled = _scrollY > 40; // umbral en px para activar el efecto
    if (isScrolled !== wasScrolled) {
      nav.classList.toggle('scrolled', isScrolled);
      wasScrolled = isScrolled;
    }
  }, { passive: true });
})();


/* ───────────────────────────────────────────────────
   5. HAMBURGER MENU — Drawer lateral en móvil
   Elementos:
     #menuToggle  → botón hamburger / X
     #navDrawer   → panel lateral deslizable
     #navOverlay  → fondo oscuro semitransparente

   Cierra al: click en overlay, click en link del drawer
   o tecla Escape (accesibilidad).
   ─────────────────────────────────────────────────── */
(function () {
  const toggle  = document.getElementById('menuToggle');
  const drawer  = document.getElementById('navDrawer');
  const overlay = document.getElementById('navOverlay');
  if (!toggle || !drawer) return;

  function openMenu() {
    toggle.classList.add('active');         // anima las 3 líneas → X
    drawer.classList.add('open');           // desliza el panel desde la derecha
    overlay?.classList.add('open');         // muestra el fondo oscuro
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden'; // bloquea el scroll del body
  }

  function closeMenu() {
    toggle.classList.remove('active');
    drawer.classList.remove('open');
    overlay?.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = ''; // restaura el scroll
  }

  // Alterna abierto/cerrado al hacer clic en el botón
  toggle.addEventListener('click', () =>
    drawer.classList.contains('open') ? closeMenu() : openMenu()
  );

  // Click en el overlay oscuro cierra el drawer
  overlay?.addEventListener('click', closeMenu);

  // Click en cualquier link dentro del drawer cierra el menú
  drawer.addEventListener('click', e => {
    const link = e.target.closest('a');
    if (link) closeMenu();
  });

  // Escape cierra el drawer (accesibilidad de teclado)
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) closeMenu();
  });
})();


/* ───────────────────────────────────────────────────
   6. SCROLL-TO-TOP BUTTON
   JS crea el botón dinámicamente y lo inserta al final
   del body. Aparece cuando el scroll supera 400 px.
   .visible activa opacity:1 + visibility:visible (CSS).
   ─────────────────────────────────────────────────── */
(function () {
  // Crea el botón y lo agrega al DOM
  const btn = document.createElement('button');
  btn.innerHTML = '<i class="fas fa-arrow-up"></i>';
  btn.setAttribute('aria-label', 'Volver arriba');
  btn.className = 'scroll-top-btn';
  document.body.appendChild(btn);

  let btnVisible = false;

  window.addEventListener('scroll', () => {
    const shouldShow = _scrollY > 400; // umbral en px para que aparezca
    if (shouldShow !== btnVisible) {
      btn.classList.toggle('visible', shouldShow);
      btnVisible = shouldShow;
    }
  }, { passive: true });

  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();


/* ───────────────────────────────────────────────────
   7. SCROLL PROGRESS BAR
   Actualiza el scaleX del elemento #scrollBar (línea
   1 px en la cima) en cada frame de scroll.
   Usar scaleX en lugar de width evita reflow.
   ticking previene múltiples RAFs por evento scroll.
   ─────────────────────────────────────────────────── */
(function () {
  const bar = document.getElementById('scrollBar');
  if (!bar) return;

  // scrollMax se recalcula en resize porque la altura del doc puede cambiar
  let scrollMax = document.documentElement.scrollHeight - window.innerHeight;
  window.addEventListener('resize', () => {
    scrollMax = document.documentElement.scrollHeight - window.innerHeight;
  }, { passive: true });

  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        // scaleX va de 0 (tope) a 1 (final de página)
        bar.style.transform = `scaleX(${_scrollY / (scrollMax || 1)})`;
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();


/* ───────────────────────────────────────────────────
   8. CINEMATIC PARALLAX — Fondo animado
   Cada sub-página tiene su propio conjunto de imágenes
   (PAGE_SETS) y tintes de color (tints).
   data-page en <body> determina qué set se usa.

   Decisiones de rendimiento:
   - smoothY usa lerp (interpolación lineal) con guard
     de 0.12 px → el loop RAF se detiene al converger.
   - Los layers solo cambian cuando cruzan el umbral
     de tercio de página (setLayer).
   - CSS maneja filter; JS solo cambia transform y
     la alternancia de .active / .previous.
   ─────────────────────────────────────────────────── */
(function () {
  // data-page en <body> selecciona el set de imágenes correcto
  const page = document.body.dataset.page || 'app';

  // Imágenes de fondo por sub-página (se alternan con el scroll)
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

  // Tinte de color sobre el fondo para cada sub-página
  const tints = {
    app: ['rgba(5,15,30,0.07)', 'rgba(5,20,40,0.06)'],
    bot: ['rgba(10,5,30,0.07)', 'rgba(5,10,25,0.06)'],
    web: ['rgba(5,25,10,0.07)', 'rgba(10,20,5,0.06)'],
  };

  const images    = PAGE_SETS[page] || PAGE_SETS.app;
  const pageTints = tints[page]     || tints.app;

  // Crea #cinema-bg si no existe en el HTML
  let cBg = document.getElementById('cinema-bg');
  if (!cBg) {
    cBg = document.createElement('div');
    cBg.id = 'cinema-bg';
    document.body.insertBefore(cBg, document.body.firstChild);
  }

  // Crea #cinema-tint (overlay de color) si no existe
  let tintEl = document.getElementById('cinema-tint');
  if (!tintEl) {
    tintEl = document.createElement('div');
    tintEl.id = 'cinema-tint';
    document.body.insertBefore(tintEl, document.body.firstChild);
  }

  // Crea una .cinema-layer por imagen y las agrega a #cinema-bg
  const layers = images.map((src, i) => {
    const div = document.createElement('div');
    div.className = 'cinema-layer' + (i === 0 ? ' active' : ''); // primera activa
    div.style.backgroundImage = `url('${src}')`;
    cBg.appendChild(div);
    return div;
  });

  // Sincroniza la imagen del hero-parallax-bg con la primera imagen del set
  const hero   = document.querySelector('.hero');
  const heroBg = hero?.querySelector('.hero-parallax-bg');
  if (heroBg) heroBg.style.backgroundImage = `url('${images[0]}')`;

  // heroH se usa para el cálculo de opacidad del hero-content al hacer scroll
  let heroH = hero ? hero.offsetHeight : 0;
  window.addEventListener('resize', () => { heroH = hero ? hero.offsetHeight : 0; }, { passive: true });

  /* Configuración de profundidad según dispositivo.
     En móvil se reducen los valores para evitar motion sickness. */
  let current = 0, targetY = _scrollY, smoothY = targetY, rafId = 0;
  const mqMobile = window.matchMedia('(max-width: 900px)');

  function getConfig() {
    return mqMobile.matches
      ? { depthBase: 0.11, depthStep: 0.022, heroDepth: 0.22, lerp: 0.11 }
      : { depthBase: 0.17, depthStep: 0.032, heroDepth: 0.34, lerp: 0.08 };
    // depthBase  → velocidad base de las capas de fondo
    // depthStep  → diferencia de velocidad entre capas (crea profundidad)
    // heroDepth  → velocidad del fondo dentro del hero
    // lerp       → factor de suavizado (0 = inmóvil, 1 = sin suavizado)
  }

  /* Transición entre capas de imagen al cruzar un tercio de página.
     La capa saliente recibe .previous → CSS transiciona su opacity a 0.
     La capa entrante recibe .active   → CSS transiciona su opacity a 1.
     Se limpia .previous con transitionend (+ timeout de seguridad). */
  function setLayer(idx) {
    if (idx === current) return; // sin cambios si es la misma capa
    const prev = layers[current];
    prev.classList.remove('active');
    prev.classList.add('previous');
    current = idx;
    layers[current].classList.add('active');
    if (tintEl) tintEl.style.background = pageTints[idx] || 'transparent';

    const cleanup = () => prev.classList.remove('previous');
    prev.addEventListener('transitionend', cleanup, { once: true });
    setTimeout(cleanup, 1700); // fallback si transitionend no dispara
  }

  /* Loop principal de animación — corre solo mientras hay scroll activo.
     smoothY converge hacia targetY con lerp; el guard de 0.12 px lo detiene
     para no encadenar RAFs indefinidamente cuando la página está quieta. */
  function update() {
    rafId = 0;
    const { depthBase, depthStep, heroDepth, lerp } = getConfig();

    // Interpolación lineal hacia el scroll objetivo
    smoothY += (targetY - smoothY) * lerp;
    if (Math.abs(targetY - smoothY) < 0.12) smoothY = targetY; // guard de convergencia

    const sy       = smoothY;
    const maxH     = document.documentElement.scrollHeight - window.innerHeight;
    const progress = sy / (maxH || 1); // 0 = inicio, 1 = final de página

    /* Mueve cada layer con una velocidad distinta (profundidad).
       scale(1.35) asegura que nunca haya bordes visibles al hacer parallax. */
    for (let i = 0; i < layers.length; i++) {
      layers[i].style.transform = `translateY(${sy * (depthBase + i * depthStep)}px) scale(1.35)`;
      // El filter (brillo/saturación) lo gestiona CSS, no JS, para cachear la capa pintada.
      layers[i].style.filter = `brightness(${(0.12 + progress * 0.06).toFixed(3)}) saturate(0.28) grayscale(0.5)`;
    }

    // El fondo del hero usa su propio factor de profundidad (heroDepth)
    if (heroBg) heroBg.style.transform = `translateY(${sy * heroDepth}px) scale(1.5)`;

    /* Desvanece el texto del hero al hacer scroll.
       hp va de 0 a 1 durante el primer 60% de la altura del hero. */
    const heroContent = hero?.querySelector('.hero-content');
    if (heroContent) {
      const hp = Math.min(sy / (heroH * 0.6 || 1), 1);
      heroContent.style.opacity   = Math.max(0, 1 - hp * 1.8).toString();
      heroContent.style.transform = `translateY(${sy * 0.08}px)`;
    }

    // Cambia la imagen de fondo según en qué tercio de la página estamos
    setLayer(Math.min(Math.floor(progress * images.length), images.length - 1));

    // Continúa el loop solo si todavía hay diferencia perceptible
    if (Math.abs(targetY - smoothY) > 0.12) rafId = requestAnimationFrame(update);
  }

  // Dispara el loop al hacer scroll
  window.addEventListener('scroll', () => {
    targetY = _scrollY;
    if (!rafId) rafId = requestAnimationFrame(update);
  }, { passive: true });

  update(); // arranca con el scroll actual al cargar la página
})();


/* ───────────────────────────────────────────────────
   9. SCROLL REVEAL — IntersectionObserver
   Agrega .visible a elementos con clase .reveal,
   .reveal-left, .reveal-right o .reveal-scale cuando
   entran al viewport. CSS maneja la transición.
   Se deja de observar el elemento una vez revelado
   (observer.unobserve) para no gastar recursos.
   ─────────────────────────────────────────────────── */
(function () {
  const els = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
  if (!els.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // una vez revelado, deja de observarlo
      }
    });
  }, {
    threshold: 0.10,                 // % del elemento visible para disparar
    rootMargin: '0px 0px -40px 0px' // margen negativo inferior: dispara un poco antes del borde
  });

  els.forEach(el => observer.observe(el));
})();


/* ───────────────────────────────────────────────────
   10. BLUR-IN — Reveal palabra por palabra
   Divide el texto de .about-text p y [data-blur-in] en
   spans .blur-word, cada uno con --wi (índice de palabra).
   CSS usa --wi para calcular el transition-delay
   escalonado de cada palabra.
   Se ignora si el usuario prefiere movimiento reducido.
   ─────────────────────────────────────────────────── */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* Divide el texto del elemento en spans .blur-word.
     Se marca con data-blurReady para evitar doble proceso. */
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
      span.style.setProperty('--wi', i); // índice para el delay escalonado en CSS
      el.appendChild(span);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' ')); // espacio entre palabras
    });
  }

  // Al entrar en viewport se añade .visible → CSS dispara las transiciones
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.about-text p, [data-blur-in]').forEach(el => {
    wrapWords(el);
    obs.observe(el);
  });
})();


/* ───────────────────────────────────────────────────
   11. TEXT SHIMMER — Gradiente animado en logo y badges
   JS agrega las clases CSS; la animación shimmerMove
   está definida en shared.css.
   .shimmer-text-strong → logo (.logo) — más brillante
   .shimmer-text        → .project-badge
   Se ignora si el usuario prefiere movimiento reducido.
   ─────────────────────────────────────────────────── */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Logo de la navbar
  const logo = document.querySelector('.logo');
  if (logo) logo.classList.add('shimmer-text-strong');

  // Badges de proyecto (etiquetas de tecnología en el hero)
  document.querySelectorAll('.project-badge').forEach(el => el.classList.add('shimmer-text'));
})();


/* ───────────────────────────────────────────────────
   12. SKILL TAGS STAGGER — Aparición escalonada
   Cuando el contenedor .skills entra en el viewport,
   cada .skill-tag recibe .visible con un delay
   proporcional a su índice (60 ms entre cada una).
   CSS maneja la transición de opacity + translateY.
   ─────────────────────────────────────────────────── */
(function () {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      entry.target.querySelectorAll('.skill-tag').forEach((tag, i) => {
        tag.style.setProperty('--stagger-i', i); // no usado por CSS en shared, pero útil si se extiende
        setTimeout(() => tag.classList.add('visible'), i * 60); // delay de 60 ms entre etiquetas
      });

      obs.unobserve(entry.target);
    });
  }, { threshold: 0.2 });

  document.querySelectorAll('.skills').forEach(el => obs.observe(el));
})();


/* ───────────────────────────────────────────────────
   13. ABOUT CARD TILT — Efecto 3-D con mouse
   Al mover el mouse sobre .about-main se calcula
   la posición relativa (dx, dy de -0.5 a 0.5) y
   se aplica rotateX/rotateY con perspective.
   --about-glow-x/y mueven el glow radial del ::before
   definido en shared.css.
   Se ignora si el usuario prefiere movimiento reducido.
   ─────────────────────────────────────────────────── */
(function () {
  const card = document.querySelector('.about-main');
  if (!card) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let raf = 0;

  card.addEventListener('mousemove', e => {
    if (raf) return; // throttle: máximo 1 RAF por frame
    raf = requestAnimationFrame(() => {
      raf = 0;
      const r  = card.getBoundingClientRect();
      // dx/dy: -0.5 (esquina superior izquierda) → +0.5 (esquina inferior derecha)
      const dx = (e.clientX - r.left) / r.width  - 0.5;
      const dy = (e.clientY - r.top)  / r.height - 0.5;

      // rotateX → inclinación horizontal | rotateY → inclinación vertical
      card.style.transform = `perspective(900px) rotateX(${(-dy * 1.8).toFixed(2)}deg) rotateY(${(dx * 2.4).toFixed(2)}deg) translateY(-3px)`;

      // Mueve el glow radial del ::before siguiendo el cursor
      card.style.setProperty('--about-glow-x', `${(dx + 0.5) * 100}%`);
      card.style.setProperty('--about-glow-y', `${(dy + 0.5) * 100}%`);
    });
  });

  // Al salir, resetea la tarjeta a su estado original
  card.addEventListener('mouseleave', () => {
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    card.style.transform = '';
  });
})();


/* ───────────────────────────────────────────────────
   14. CAROUSEL — Galería de imágenes
   Elementos:
     #carouselTrack → contenedor con imágenes (translateX)
     #prevBtn / #nextBtn → botones anterior / siguiente
     #carouselDots  → contenedor de dots creados por JS

   Funciones:
     goTo(idx)    → va a un slide concreto
     startAuto()  → inicia la rotación automática (3.8 s)
     resetAuto()  → reinicia el timer tras interacción manual

   Soporta:
     - Touch swipe (umbral de 50 px)
     - Pausa al hacer hover sobre #carousel
   ─────────────────────────────────────────────────── */
(function () {
  const track    = document.getElementById('carouselTrack');
  const prevBtn  = document.getElementById('prevBtn');
  const nextBtn  = document.getElementById('nextBtn');
  const dotsWrap = document.getElementById('carouselDots');
  if (!track || !dotsWrap) return;

  const total = track.children.length;
  if (total === 0) return;

  let current = 0, autoTimer = 0;

  /* Crea un dot por cada slide usando DocumentFragment para
     un solo reflow al insertarlos todos juntos. */
  const frag = document.createDocumentFragment();
  for (let i = 0; i < total; i++) {
    const dot = document.createElement('button');
    dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Slide ${i + 1}`);
    frag.appendChild(dot);
  }
  dotsWrap.appendChild(frag);
  const dots = dotsWrap.children; // HTMLCollection viva

  /* Navega al slide indicado.
     Se usa módulo positivo para permitir wrap-around
     (siguiente en el último → vuelve al primero). */
  function goTo(idx) {
    dots[current].classList.remove('active');
    current = ((idx % total) + total) % total; // wrap-around seguro con negativos
    track.style.transform = `translateX(-${current * 100}%)`; // mueve el track
    dots[current].classList.add('active');
  }

  // Delegación de eventos en el contenedor de dots (más eficiente que un listener por dot)
  dotsWrap.addEventListener('click', e => {
    const dot = e.target.closest('.carousel-dot');
    if (dot) { goTo([...dots].indexOf(dot)); resetAuto(); }
  });

  prevBtn?.addEventListener('click', () => { goTo(current - 1); resetAuto(); });
  nextBtn?.addEventListener('click', () => { goTo(current + 1); resetAuto(); });

  function startAuto() {
    clearInterval(autoTimer);
    autoTimer = setInterval(() => goTo(current + 1), 3800); // avance automático cada 3.8 s
  }
  function resetAuto() { startAuto(); } // alias semántico

  startAuto();

  // Pausa la rotación automática mientras el mouse está sobre el carousel
  const wrap = document.getElementById('carousel');
  wrap?.addEventListener('mouseenter', () => clearInterval(autoTimer));
  wrap?.addEventListener('mouseleave', startAuto);

  /* Soporte de swipe táctil.
     Se registra la posición X inicial en touchstart y se
     compara en touchend; si el delta supera 50 px se navega. */
  let startX = 0, deltaX = 0;

  track.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
  }, { passive: true });

  track.addEventListener('touchmove', e => {
    deltaX = e.touches[0].clientX - startX;
  }, { passive: true });

  track.addEventListener('touchend', () => {
    if (Math.abs(deltaX) > 50) { // umbral mínimo de swipe en px
      goTo(deltaX < 0 ? current + 1 : current - 1); // izquierda → siguiente, derecha → anterior
      resetAuto();
    }
    deltaX = 0; // resetea el delta para el próximo gesto
  });
})();