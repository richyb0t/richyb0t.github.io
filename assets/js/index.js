/* ═══════════════════════════════════════════════════════════════════
   INDEX.JS — Ricardo Hernández Castro · Portfolio
   Todos los módulos son IIFEs independientes (no se pisan entre sí)

   TABLA DE CONTENIDOS
   ─────────────────────────────────────────────────────────────────
   1.  EMAILJS          — inicialización del servicio de correo
   2.  SCROLL STATE     — variable global _scrollY compartida
   3.  SCROLL BAR       — barra de progreso 1px en la cima
   4.  NAVBAR           — clase .scrolled al bajar > 40px
   5.  HAMBURGER        — apertura/cierre del drawer móvil
   6.  SMOOTH SCROLL    — scroll suave para links href="#sección"
   7.  PARALLAX         — fondo cinematográfico con RAF único (GPU-only)
   8.  VISITOR COUNTER  — contador local con localStorage
   9.  ABOUT TILT       — efecto 3D tilt en la tarjeta "sobre mí"
   10. TOAST            — notificaciones de éxito/error
   11. CONTACT FORM     — validación + envío con EmailJS
   12. DOWNLOAD CV      — descarga del PDF
   13. SCROLL REVEAL    — fade-in de elementos al entrar en viewport
   14. HERO ANIMATIONS  — micro-animaciones del hero:
       14a. Reveal letra por letra (.hero-char + charIn CSS)
       14b. Spring hover en el nombre (Text_03 style)
       14c. Línea decorativa bajo el subtítulo
       14d. Links magnéticos de la nav interna
       14e. Partículas flotantes en canvas
   15. PAGE FADE-IN     — body.loaded al terminar window.load
   16. SCROLL-TO-TOP    — botón flotante que aparece al bajar
   17. TEXT SHIMMER     — gradiente animado en logo y subtítulo
   18. BLUR-IN          — reveal palabra por palabra (bio, contact-sub)
   19. NUMBER TICKER    — contador animado de 0 al valor real
   20. MAGNETIC BUTTON  — atracción magnética en botones CV y enviar
   ═══════════════════════════════════════════════════════════════════ */


/* ═══════════════════════════════════════════════════════════════════
   1. EMAILJS — Inicializa el SDK con la clave pública del proyecto
   Docs: https://www.emailjs.com/docs/sdk/init/
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  // Solo inicializa si el script de EmailJS se cargó correctamente
  if (typeof emailjs !== 'undefined') emailjs.init('P8_29jAf2zFc0kVSV');
})();


/* ═══════════════════════════════════════════════════════════════════
   2. SCROLL STATE — Variable global _scrollY compartida
   Todos los módulos leen _scrollY en lugar de window.scrollY
   para evitar múltiples lecturas del layout en el mismo frame.
   ═══════════════════════════════════════════════════════════════════ */
let _scrollY = window.scrollY;
window.addEventListener('scroll', () => { _scrollY = window.scrollY; }, { passive: true });


/* ═══════════════════════════════════════════════════════════════════
   3. SCROLL BAR — Barra de progreso de lectura (línea 1px en la cima)
   Usa scaleX en lugar de width para evitar reflow en cada frame.
   En móvil se actualiza con throttle más agresivo (cada 200ms).
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  const bar = document.getElementById('scrollBar');
  if (!bar) return;

  let scrollMax = document.documentElement.scrollHeight - window.innerHeight;
  window.addEventListener('resize', () => {
    scrollMax = document.documentElement.scrollHeight - window.innerHeight;
  }, { passive: true });

  const isMob = window.matchMedia('(max-width: 900px)').matches;

  if (isMob) {
    // Móvil: throttle a 200ms, sin RAF para no sumar frames al hilo principal
    let lastUpdate = 0;
    window.addEventListener('scroll', () => {
      const now = Date.now();
      if (now - lastUpdate < 200) return;
      lastUpdate = now;
      bar.style.transform = `scaleX(${_scrollY / (scrollMax || 1)})`;
    }, { passive: true });
  } else {
    // Escritorio: RAF normal
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
  }
})();


/* ═══════════════════════════════════════════════════════════════════
   4. NAVBAR — Agrega/quita clase .scrolled para activar el blur
   CSS: .navbar.scrolled { backdrop-filter: blur(20px); ... }
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  const nav = document.getElementById('navbar');
  if (!nav) return;

  let wasScrolled = false;
  window.addEventListener('scroll', () => {
    const isScrolled = _scrollY > 30; // <- umbral en px para activar el blur
    // Solo modifica el DOM si el estado cambió (evita reflows innecesarios)
    if (isScrolled !== wasScrolled) {
      nav.classList.toggle('scrolled', isScrolled);
      wasScrolled = isScrolled;
    }
  }, { passive: true });
})();


/* ═══════════════════════════════════════════════════════════════════
   5. HAMBURGER — Drawer lateral en móvil
   Elementos: #menuToggle (botón), #navDrawer (panel), #navOverlay (fondo oscuro)
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  const toggle  = document.getElementById('menuToggle');
  const drawer  = document.getElementById('navDrawer');
  const overlay = document.getElementById('navOverlay');
  if (!toggle || !drawer) return;

  function openMenu() {
    toggle.classList.add('active');    // anima las 3 líneas -> X
    drawer.classList.add('open');      // desliza el panel desde la derecha
    overlay?.classList.add('open');    // muestra el overlay oscuro
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden'; // evita scroll del body mientras está abierto
  }

  function closeMenu() {
    toggle.classList.remove('active');
    drawer.classList.remove('open');
    overlay?.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  // Click en el botón hamburger: alterna abierto/cerrado
  toggle.addEventListener('click', () =>
    drawer.classList.contains('open') ? closeMenu() : openMenu()
  );

  // Click en el overlay oscuro cierra el drawer
  overlay?.addEventListener('click', closeMenu);

  // Click en un link del drawer: si es ancla (#seccion) hace scroll suave;
  // si es link externo simplemente cierra el drawer
  drawer.addEventListener('click', e => {
    const link = e.target.closest('a');
    if (!link) return;
    const href = link.getAttribute('href');
    if (href && href.startsWith('#')) {
      e.preventDefault();
      closeMenu();
      const target = document.querySelector(href);
      // Espera a que el drawer termine de cerrarse antes de hacer scroll
      if (target) setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 320);
    } else {
      closeMenu();
    }
  });

  // Tecla Escape cierra el drawer (accesibilidad)
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) closeMenu();
  });
})();


/* ═══════════════════════════════════════════════════════════════════
   6. SMOOTH SCROLL — Links con href="#seccion" en cualquier parte de la página
   Complementa el comportamiento del drawer móvil (sección 5)
   ═══════════════════════════════════════════════════════════════════ */
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const target = document.querySelector(a.getAttribute('href'));
  if (target) {
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});


/* ═══════════════════════════════════════════════════════════════════
   7. PARALLAX CINEMATOGRAFICO — Fondo animado con un solo loop RAF
   ─────────────────────────────────────────────────────────────────
   Decisiones de rendimiento:
   - filter se queda en CSS (no se toca en JS) -> el browser cachea la capa pintada
   - smoothY usa lerp con guard de 1px -> el loop se detiene cuando converge
   - heroLeft scroll-offset y mouse-offset se unifican en un solo write por frame
   - Las partículas del canvas se pausan con IntersectionObserver
   ═══════════════════════════════════════════════════════════════════ */
(function initParallax() {

  /* Imágenes de fondo (se alternan según el progreso de scroll)
     Cambia las URLs para cambiar las fotos de fondo del sitio */
  /* Detecta soporte WebP una sola vez */
  const supportsWebP = (() => {
    const c = document.createElement('canvas');
    return c.toDataURL('image/webp').startsWith('data:image/webp');
  })();

  /* Ancho de imágenes según el dispositivo (móvil carga menos píxeles) */
  const imgW = window.innerWidth <= 900 ? 900 : 1800;
  const fmt  = supportsWebP ? '&fm=webp' : '';

  const images = [
    /* fondo1 — postimg no soporta transformaciones; se deja como PNG
       Para reducir su peso, conviértelo a WebP en tu servidor y cambia la URL */
    'https://i.postimg.cc/FH56WxC8/fondo1.webp',
    `https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=${imgW}&auto=format&fit=crop&q=72${fmt}`,
    `https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=${imgW}&auto=format&fit=crop&q=72${fmt}`,
    `https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=${imgW}&auto=format&fit=crop&q=72${fmt}`,
  ];

  /* Tinte de color que se aplica sobre el fondo según la sección activa
     Índice 0 = primer tercio, 1 = segundo, 2 = último                  */
  const tints = [
    'rgba(5,10,30,0.08)',   // azul frio — hero/about
    'rgba(10,20,10,0.06)',  // verde suave — proyectos
    'rgba(30,10,5,0.06)',   // calido rojizo — contacto
  ];

  // Crea los contenedores si no existen en el HTML
  let cBg    = document.getElementById('cinema-bg');
  let tintEl = document.getElementById('cinema-tint');
  if (!cBg)    { cBg    = document.createElement('div'); cBg.id    = 'cinema-bg';   document.body.insertBefore(cBg,    document.body.firstChild); }
  if (!tintEl) { tintEl = document.createElement('div'); tintEl.id = 'cinema-tint'; document.body.insertBefore(tintEl, document.body.firstChild); }

  const hero   = document.querySelector('.hero');
  const heroBg = hero && hero.querySelector('.hero-parallax-bg');

  /* Configuración de profundidad según dispositivo
     Móvil usa valores más pequeños para evitar motion sickness */
  const mqMobile = window.matchMedia('(max-width: 900px)');
  let isMobile = mqMobile.matches;
  let depthBase, depthStep, heroDepth, lerpFactor;

  function applyMotionConfig() {
    isMobile   = mqMobile.matches;
    depthBase  = isMobile ? 0.11 : 0.17;   // velocidad base de las capas
    depthStep  = isMobile ? 0.022 : 0.032; // diferencia de velocidad entre capas (profundidad)
    heroDepth  = isMobile ? 0.22 : 0.34;   // velocidad del fondo dentro del hero
    lerpFactor = isMobile ? 0.13 : 0.10;   // suavizado del scroll (0=inmovil, 1=sin suavizado)
  }
  applyMotionConfig();
  mqMobile.addEventListener('change', applyMotionConfig);

  // Crea una .cinema-layer por imagen
  // La primera capa se carga de inmediato; las demás solo cuando el usuario hace scroll
  const layers = images.map((src, i) => {
    const div = document.createElement('div');
    div.className = 'cinema-layer' + (i === 0 ? ' active' : '');
    if (i === 0) {
      // Carga inmediata: es visible en el first paint
      div.style.backgroundImage = `url('${src}')`;
    } else {
      // Carga diferida: se inyecta la primera vez que setLayer() la activa
      div.dataset.lazySrc = src;
    }
    cBg.appendChild(div);
    return div;
  });

  // La primera imagen también aparece en el fondo del hero
  //if (heroBg) heroBg.style.backgroundImage = `url('${images[0]}')`;

  // heroH se necesita para calcular cuándo desvanece el texto del hero
  let heroH = hero ? hero.offsetHeight : 0;
  window.addEventListener('resize', () => { heroH = hero ? hero.offsetHeight : 0; }, { passive: true });

  let current = 0, rafId = 0;
  let targetY = window.scrollY, smoothY = targetY;

  const heroLeft = hero && hero.querySelector('.hero-left');
  let heroLeftReady = false;
  if (heroLeft) {
    // No modifica opacity hasta que termina la animación CSS de entrada del heroLeft
    heroLeft.addEventListener('animationend', () => { heroLeftReady = true; }, { once: true });
    setTimeout(() => { heroLeftReady = true; }, 800); // fallback por si animationend no dispara
  }

  // Offsets separados para scroll y mouse; se combinan en un solo write por frame
  let hlScrollTy = 0, hlScrollOp = 1;
  let hlMouseX = 0, hlMouseY = 0;

  // Transición entre capas de imagen
  function setLayer(idx) {
    if (idx === current) return;
    const prev = layers[current];
    prev.classList.remove('active');
    prev.classList.add('previous'); // CSS transiciona opacity a 0
    current = idx;
    const next = layers[current];
    // Carga diferida: inyecta el fondo la primera vez que se activa la capa
    if (next.dataset.lazySrc) {
      next.style.backgroundImage = `url('${next.dataset.lazySrc}')`;
      delete next.dataset.lazySrc;
    }
    next.classList.add('active'); // CSS transiciona opacity a 1
    if (tintEl) tintEl.style.background = tints[idx] || 'transparent';
    // Limpia la clase .previous cuando termina la transición
    const cleanup = () => prev.classList.remove('previous');
    prev.addEventListener('transitionend', cleanup, { once: true });
    setTimeout(cleanup, 1700); // fallback si transitionend no dispara
  }

  // Loop principal de animación (se ejecuta cada frame mientras hay movimiento)
  function update() {
    rafId = 0;

    // Lerp: suaviza el scroll real hacia el objetivo
    smoothY += (targetY - smoothY) * lerpFactor;
    // Guard: detiene el lerp cuando la diferencia es menor a 1px
    if (Math.abs(targetY - smoothY) < 1.0) smoothY = targetY;

    const sy       = smoothY;
    const maxH     = document.documentElement.scrollHeight - window.innerHeight;
    const progress = sy / (maxH || 1); // 0 = inicio, 1 = final de página
    const vh       = window.innerHeight;

    /* En escritorio: mueve capas de fondo (parallax) y desvanece el heroLeft.
       En móvil: se omite el transform por frame para reducir Style & Layout. */
    if (!isMobile) {
      // OPT: activa will-change en las layers solo mientras se mueven
      for (let i = 0; i < layers.length; i++) {
        const range = vh * (0.08 + i * 0.03);
        const ty    = (progress - 0.5) * range * 2;
        layers[i].style.transform = `translateY(${ty.toFixed(1)}px) scale(1.26)`;
      }

      if (heroLeft) {
        const hp = Math.min(sy / (heroH * 0.6 || 1), 1);
        hlScrollTy = sy * 0.08;
        hlScrollOp = Math.max(0, 1 - hp * 1.6);
        // OPT: activa will-change mientras se mueve, lo desactiva cuando para
        heroLeft.classList.add('parallax-active');
        heroLeft.style.transform = `translate(${hlMouseX}px, ${hlScrollTy + hlMouseY}px)`;
        if (heroLeftReady) heroLeft.style.opacity = hlScrollOp.toString();
      }
    }

    // Cambia la imagen de fondo según en qué tercio de la página estamos
    setLayer(Math.min(Math.floor(progress * images.length), images.length - 1));

    // Continúa el loop solo si todavía hay diferencia perceptible
    if (Math.abs(targetY - smoothY) > 1.0) {
      rafId = requestAnimationFrame(update);
    } else {
      // OPT: cuando el scroll converge, quita will-change para liberar GPU memory
      if (heroLeft) heroLeft.classList.remove('parallax-active');
    }
  }

  // Dispara el loop cuando el usuario hace scroll
  window.addEventListener('scroll', () => {
    targetY = _scrollY;
    if (!rafId) rafId = requestAnimationFrame(update);
  }, { passive: true });

  /* Parallax de mouse en el hero (solo escritorio)
     heroBg local eliminado — el #cinema-bg global cubre también el hero.
     Solo se mueve el heroLeft según el cursor. */
  if (hero && !isMobile) {
    let rafMouse = 0;
    hero.addEventListener('mousemove', e => {
      if (rafMouse) return;
      rafMouse = requestAnimationFrame(() => {
        rafMouse = 0;
        const rect = hero.getBoundingClientRect();
        const mx = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
        const my = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;
        if (heroLeft) {
          const strength = (e.clientX - rect.left) < rect.width * 0.6 ? 1 : 0.4;
          hlMouseX = (mx / 2) * 10 * strength;
          hlMouseY = (my / 2) *  6 * strength;
          if (!rafId) rafId = requestAnimationFrame(update);
        }
      });
    }, { passive: true });

    hero.addEventListener('mouseleave', () => {
      if (heroLeft) {
        hlMouseX = 0; hlMouseY = 0;
        heroLeft.style.transition = 'transform 0.7s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s';
        heroLeft.style.transform  = `translate(0px, ${hlScrollTy}px)`;
        heroLeft.addEventListener('transitionend', () => { heroLeft.style.transition = ''; }, { once: true });
      }
    });
  }

  // Arranca el loop con el scroll actual (por si la página cargó scrolleada)
  targetY = window.scrollY;
  smoothY = targetY;
  update();
})();


/* ═══════════════════════════════════════════════════════════════════
   8. VISITOR COUNTER — Contador de visitas local con localStorage
   Solo cuenta visitas del mismo navegador; no es un contador real.
   El número se pasa al ticker (sección 19) para animarse al cargar.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  const el = document.getElementById('visitorCount');
  if (!el) return;
  try {
    const key   = 'rhc_visits';
    const count = (parseInt(localStorage.getItem(key) || '0', 10) || 0) + 1;
    localStorage.setItem(key, count);
    el.textContent = `${count} visita${count === 1 ? '' : 's'} · v3.0`;
  } catch {
    // localStorage puede estar bloqueado en modo incógnito estricto
    el.textContent = 'visitas no disponibles · v3.0';
  }
})();


/* ═══════════════════════════════════════════════════════════════════
   9. ABOUT TILT — Efecto 3D en la tarjeta "sobre mí" al mover el mouse
   Usa CSS custom properties --about-glow-x/y para mover el glow radial
   definido en el ::before de .about-main en index.css
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  const aboutCard = document.querySelector('.about-main');
  if (!aboutCard) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let rafA = 0;
  aboutCard.addEventListener('mouseenter', () => { aboutCard.classList.add('tilt-active'); });
  aboutCard.addEventListener('mousemove', e => {
    if (rafA) return; // throttle RAF
    rafA = requestAnimationFrame(() => {
      rafA = 0;
      const r  = aboutCard.getBoundingClientRect();
      // dx/dy: -0.5 (esquina superior izquierda) a +0.5 (esquina inferior derecha)
      const dx = (e.clientX - r.left) / r.width  - 0.5;
      const dy = (e.clientY - r.top)  / r.height - 0.5;
      // rotateX: eje horizontal | rotateY: eje vertical
      aboutCard.style.transform = `perspective(900px) rotateX(${(-dy * 1.8).toFixed(2)}deg) rotateY(${(dx * 2.4).toFixed(2)}deg) translateY(-3px)`;
      // Mueve el glow radial siguiendo el cursor
      aboutCard.style.setProperty('--about-glow-x', `${(dx + 0.5) * 100}%`);
      aboutCard.style.setProperty('--about-glow-y', `${(dy + 0.5) * 100}%`);
    });
  });

  // Al salir, resetea todo al estado original
  aboutCard.addEventListener('mouseleave', () => {
    aboutCard.classList.remove('tilt-active');
    if (rafA) { cancelAnimationFrame(rafA); rafA = 0; }
    aboutCard.style.transform = '';
    aboutCard.style.setProperty('--about-glow-x', '50%');
    aboutCard.style.setProperty('--about-glow-y', '50%');
  });
})();


/* ═══════════════════════════════════════════════════════════════════
   10. TOAST — Notificaciones temporales de éxito / error
   Uso: showToast('mensaje', 'success' | 'error')
   ═══════════════════════════════════════════════════════════════════ */
function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className = 'toast show' + (type ? ' ' + type : '');
  // Reinicia el timer si se llama antes de que desaparezca el anterior
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.className = 'toast' + (type ? ' ' + type : ''); // quita .show -> CSS lo oculta
  }, 4000); // <- tiempo en ms antes de que desaparezca el toast
}


/* ═══════════════════════════════════════════════════════════════════
   11. CONTACT FORM — Validación + envío con EmailJS
   Service ID y Template ID se configuran en emailjs.com
   ═══════════════════════════════════════════════════════════════════ */
const _emailRE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // regex de validación de email

document.addEventListener('DOMContentLoaded', () => {
  const form    = document.getElementById('contactForm');
  const btnSend = document.getElementById('btnSend');
  if (!form || !btnSend) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const name    = form.name.value.trim();
    const email   = form.email.value.trim();
    const message = form.message.value.trim();

    // Validaciones del lado cliente
    if (!name || !email || !message) { showToast('completa todos los campos', 'error'); return; }
    if (!_emailRE.test(email))        { showToast('email inválido', 'error'); return; }

    // Estado de carga — desactiva el botón para evitar doble envío
    btnSend.disabled = true;
    btnSend.innerHTML = '<i class="fas fa-spinner fa-spin"></i> enviando...';

    const reset = () => {
      btnSend.disabled = false;
      btnSend.innerHTML = '<i class="fas fa-paper-plane"></i> enviar mensaje';
    };

    if (typeof emailjs !== 'undefined') {
      // Parámetros que coinciden con las variables {{from_name}} etc. en la plantilla de EmailJS
      emailjs.send('service_dfnkfw8', 'template_ci74phj', { from_name: name, from_email: email, message })
        .then(() => { reset(); showToast('mensaje enviado. gracias ' + name + '!', 'success'); form.reset(); })
        .catch(() => { reset(); showToast('error al enviar, intenta más tarde', 'error'); });
    } else {
      // Fallback si EmailJS no cargó (red lenta, bloqueador de scripts, etc.)
      setTimeout(() => { reset(); showToast('emailjs no disponible', 'error'); }, 800);
    }
  });
});


/* ═══════════════════════════════════════════════════════════════════
   12. DOWNLOAD CV — Descarga el PDF del CV al hacer click
   El archivo debe estar en assets/docs/CV.pdf
   ═══════════════════════════════════════════════════════════════════ */
function downloadCV() {
  const a = document.createElement('a');
  a.href = 'assets/docs/CV.pdf';
  a.download = 'CV_RicardoHernandezCastro.pdf'; // <- nombre del archivo descargado
  a.click();
  showToast('descargando CV...', 'success');
}


/* ═══════════════════════════════════════════════════════════════════
   13. SCROLL REVEAL — Fade-in de elementos al entrar en el viewport
   Agrega .visible a cualquier elemento con clase .reveal cuando
   aparece en pantalla. CSS maneja la transición de opacity + transform.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // deja de observar una vez que apareció
      }
    });
  }, {
    threshold: 0.12,                // <- % del elemento visible para disparar (0-1)
    rootMargin: '0px 0px -40px 0px' // <- margen negativo inferior: dispara antes del borde
  });

  els.forEach(el => observer.observe(el));
})();


/* ═══════════════════════════════════════════════════════════════════
   14. HERO ANIMATIONS — Micro-animaciones del hero
   ═══════════════════════════════════════════════════════════════════ */
(function () {

  /* ── 14a. Reveal letra por letra del nombre ──
     Divide .hero-name en spans .hero-char
     CSS anima cada span con charIn + delay calculado por --ci (índice)
     En móvil se salta el wrap de chars para ahorrar Script Evaluation. */
  const heroName = document.querySelector('.hero-name');
  const isMobileAnim = window.matchMedia('(max-width: 900px)').matches;

  if (heroName && !isMobileAnim) {
    function wrapChars(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        for (const ch of node.textContent) {
          if (ch === ' ') { frag.appendChild(document.createTextNode(' ')); continue; }
          const s = document.createElement('span');
          s.className = 'hero-char';
          s.textContent = ch;
          frag.appendChild(s);
        }
        node.parentNode.replaceChild(frag, node);
      } else if (node.nodeName === 'EM') {
        Array.from(node.childNodes).forEach(wrapChars);
      }
    }
    Array.from(heroName.childNodes).forEach(wrapChars);
    heroName.querySelectorAll('.hero-char').forEach((el, i) => el.style.setProperty('--ci', i));

    /* ── 14b. Spring hover en el nombre — solo escritorio ── */
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {

      function springTo(span, ty, ts_, delay) {
        const K = 300, D = 15; // <- K: rigidez del resorte | D: amortiguación
        if (span._raf) cancelAnimationFrame(span._raf);
        let start = null;

        function step(now) {
          if (!start) start = now;
          // Espera el delay antes de empezar (efecto escalonado entre letras)
          if (now - start < delay) { span._raf = requestAnimationFrame(step); return; }

          const dt = 1 / 60; // paso de tiempo asumiendo 60fps

          // Fisica de translateY
          span._vy = (span._vy || 0) + (-K * ((span._y || 0) - ty) - D * (span._vy || 0)) * dt;
          span._y  = (span._y  || 0) + span._vy * dt;

          // Fisica de scale
          span._vs    = (span._vs    || 0) + (-K * ((span._scale || 1) - ts_) - D * (span._vs || 0)) * dt;
          span._scale = (span._scale || 1) + span._vs * dt;

          span.style.transform = `translateY(${span._y.toFixed(2)}px) scale(${span._scale.toFixed(4)})`;

          // Condición de convergencia: para el loop cuando la letra llegó al destino
          const done = Math.abs(span._y - ty) < .08 && Math.abs(span._vy) < .08
                    && Math.abs(span._scale - ts_) < .001 && Math.abs(span._vs) < .001;
          if (!done) {
            span._raf = requestAnimationFrame(step);
          } else {
            // Fija el valor exacto para evitar drift acumulado
            span._y = ty; span._vy = 0; span._scale = ts_; span._vs = 0;
            span.style.transform = `translateY(${ty}px) scale(${ts_})`;
          }
        }
        span._raf = requestAnimationFrame(step);
      }

      // Hover: cada letra sube -6px y crece a 1.2x con delay escalonado de 30ms
      heroName.addEventListener('mouseenter', () => {
        // OPT: activa will-change en todas las letras solo durante el hover
        heroName.classList.add('hero-chars-hover');
        heroName.querySelectorAll('.hero-char').forEach((s, i) =>
          springTo(s, -6, 1.2, i * 30)); // <- ajusta: -6 (altura), 1.2 (escala), 30 (delay ms)
      });

      // Leave: vuelve a 0 con delay mas corto (18ms) para que se vea fluido
      heroName.addEventListener('mouseleave', () => {
        heroName.querySelectorAll('.hero-char').forEach((s, i) =>
          springTo(s, 0, 1, i * 18));
        // OPT: quita will-change cuando las letras vuelven al reposo
        setTimeout(() => heroName.classList.remove('hero-chars-hover'), 800);
      });
    }
  }

  /* ── 14c. Línea decorativa bajo el subtítulo ──
     JS crea el div; CSS lo anima con lineExpand (de 0 a 180px) */
  const heroSub = document.querySelector('.hero-sub');
  if (heroSub) {
    const line = document.createElement('div');
    line.className = 'hero-deco-line';
    heroSub.insertAdjacentElement('afterend', line);
    heroSub.classList.add('hero-sub-reveal'); // activa la animación CSS de fade-in
  }

  /* ── 14d. Links magnéticos de la nav interna del hero ──
     El link sigue levemente al cursor creando un efecto de atracción */
  document.querySelectorAll('.hero-nav a').forEach(link => {
    let rafM = 0;
    link.addEventListener('mousemove', e => {
      if (rafM) return;
      rafM = requestAnimationFrame(() => {
        rafM = 0;
        const r  = link.getBoundingClientRect();
        // Desplazamiento proporcional a la distancia del cursor al centro del link
        const dx = (e.clientX - (r.left + r.width  / 2)) * 0.28; // <- intensidad X
        const dy = (e.clientY - (r.top  + r.height / 2)) * 0.28; // <- intensidad Y
        link.style.transform = `translate(${dx}px, ${dy}px)`;
      });
    });
    link.addEventListener('mouseleave', () => {
      // Transición spring al volver al origen; se elimina después para no interferir con CSS
      link.style.transition = 'transform 0.55s cubic-bezier(0.34,1.56,0.64,1), color 0.25s, gap 0.25s';
      link.style.transform  = '';
      link.addEventListener('transitionend', () => { link.style.transition = ''; }, { once: true });
    });
  });

  /* ── 14e. Partículas flotantes en canvas ──
     28 puntos que suben lentamente con opacidad pulsante.
     El loop se pausa cuando el hero sale del viewport (IntersectionObserver)
     y cuando la pestaña está oculta (visibilitychange)
     En móvil se omite para reducir el trabajo del hilo principal. */
  const heroLeft = document.querySelector('.hero-left');
  const hero     = document.querySelector('.hero');
  if (!hero || !heroLeft) return;

  // En móvil no hay partículas: ahorran ~300ms de Script Evaluation en dispositivos lentos
  if (window.matchMedia('(max-width: 900px)').matches) return;

  // Crea el canvas y lo inserta dentro del hero
  const canvas = document.createElement('canvas');
  canvas.className = 'hero-particle-canvas';
  hero.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let W, H, pts, rafP = 0, resizeTimer;
  let heroVisible = true; // asume visible al cargar

  function resize() {
    W = canvas.width  = hero.offsetWidth;
    H = canvas.height = hero.offsetHeight;
    mkPts(); // regenera puntos al cambiar tamaño
  }

  function mkPts() {
    // Propiedades de cada partícula:
    // x, y: posición | r: radio | dx, dy: velocidad | a: opacidad max | ph: fase de pulso
    pts = Array.from({ length: 28 }, () => ({   // <- cantidad de partículas
      x:  Math.random() * W * 0.45,             // solo en la mitad izquierda (zona del nombre)
      y:  Math.random() * H,
      r:  Math.random() * 1.2 + 0.2,            // radio entre 0.2 y 1.4px
      dx: (Math.random() - 0.5) * 0.15,         // deriva horizontal suave
      dy: -(Math.random() * 0.2 + 0.04),        // siempre suben (negativo = arriba)
      a:  Math.random() * 0.28 + 0.06,          // opacidad max entre 0.06 y 0.34
      ph: Math.random() * Math.PI * 2,          // fase aleatoria para el pulso
    }));
  }

  function draw() {
    // Pausa el loop si la pestaña está oculta o el hero no está en pantalla
    if (document.hidden || !heroVisible) { rafP = 0; return; }
    ctx.clearRect(0, 0, W, H);
    for (const p of pts) {
      p.ph += 0.009; // <- velocidad del pulso de opacidad
      const alpha = p.a * (0.55 + 0.45 * Math.sin(p.ph)); // oscila entre a*0.1 y a*1
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(212,212,200,${alpha.toFixed(3)})`; // color = --accent
      ctx.fill();
      p.x += p.dx; p.y += p.dy;
      // Cuando sale por arriba, reaparece por abajo en posición X aleatoria
      if (p.y < -4) { p.y = H + 4; p.x = Math.random() * W * 0.45; }
    }
    rafP = requestAnimationFrame(draw);
  }

  function startDraw() { if (!rafP) rafP = requestAnimationFrame(draw); }

  // Pausa cuando el hero sale del viewport; reanuda cuando vuelve
  const heroObs = new IntersectionObserver(entries => {
    heroVisible = entries[0].isIntersecting;
    if (heroVisible) startDraw();
    // Si !heroVisible, draw() se cancela solo en su próximo frame
  }, { threshold: 0 });
  heroObs.observe(hero);

  // Reanuda si el usuario vuelve a la pestaña
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) startDraw();
  });

  resize();
  startDraw();

  // Debounce en resize para no regenerar las partículas en cada pixel
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 100);
  }, { passive: true });
})();


/* ═══════════════════════════════════════════════════════════════════
   15. PAGE FADE-IN — Revela el body cuando todo cargó
   body empieza con opacity:0 en CSS; .loaded lo lleva a opacity:1
   ═══════════════════════════════════════════════════════════════════ */
window.addEventListener('load', () => {
  requestAnimationFrame(() => document.body.classList.add('loaded'));
});


/* ═══════════════════════════════════════════════════════════════════
   16. SCROLL-TO-TOP — Botón flotante que aparece al bajar 400px
   JS crea el botón dinámicamente; CSS en .scroll-top-btn lo posiciona.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  const btn = document.createElement('button');
  btn.innerHTML = '<i class="fas fa-arrow-up"></i>';
  btn.setAttribute('aria-label', 'Volver arriba');
  btn.className = 'scroll-top-btn';
  document.body.appendChild(btn);

  let btnVisible = false;
  window.addEventListener('scroll', () => {
    const shouldShow = _scrollY > 400; // <- px de scroll para que aparezca el botón
    if (shouldShow !== btnVisible) {
      btn.classList.toggle('visible', shouldShow);
      btnVisible = shouldShow;
    }
  }, { passive: true });

  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();


/* ═══════════════════════════════════════════════════════════════════
   17. TEXT SHIMMER — movido a módulo 22 (scheduleIdle) para reducir TBT.
   El shimmer no es crítico en el first paint; se aplica en tiempo idle.
   ═══════════════════════════════════════════════════════════════════ */


/* ═══════════════════════════════════════════════════════════════════
   18. BLUR-IN — Reveal palabra por palabra al entrar en viewport
   Divide el texto en spans .blur-word con --wi (índice de palabra)
   CSS usa --wi para calcular el transition-delay escalonado.
   Aplica a: .about-bio, .contact-sub, [data-blur-in]
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const SELECTORS = ['.about-bio', '.contact-sub', '[data-blur-in]'];

  function wrapWords(el) {
    if (el.dataset.blurReady) return; // evita procesarlo dos veces
    el.dataset.blurReady = '1';
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = '';
    el.classList.add('blur-in-text');
    if (el.dataset.blurIn === 'fast') el.classList.add('blur-in-fast'); // delay más corto

    words.forEach((word, i) => {
      const span = document.createElement('span');
      span.className = 'blur-word';
      span.textContent = word;
      span.style.setProperty('--wi', i); // índice usado por CSS para el delay
      el.appendChild(span);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible'); // dispara las transiciones CSS
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll(SELECTORS.join(', ')).forEach(el => {
    wrapWords(el);
    observer.observe(el);
  });
})();


/* ═══════════════════════════════════════════════════════════════════
   19. NUMBER TICKER — Anima números de 0 al valor real al entrar en viewport
   Usado en #visitorCount y en cualquier [data-ticker="número"] en el HTML.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Anima el textContent de `el` de `from` a `to` en `duration` ms
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
      animateTicker(el, parseInt(el.dataset.tickerFrom || '0', 10), to, 1400); // <- duración ms
      ticker_observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  // Observa #visitorCount después de que el contador (sección 8) lo llene
  const vcEl = document.getElementById('visitorCount');
  if (vcEl) {
    const mu = new MutationObserver(() => {
      const num = parseInt(vcEl.textContent, 10);
      if (!isNaN(num) && num > 0) {
        mu.disconnect();
        vcEl.dataset.tickerTarget = num;
        vcEl.dataset.tickerFrom   = Math.max(1, num - Math.min(num, 20)); // empieza cerca del final
        ticker_observer.observe(vcEl);
      }
    });
    mu.observe(vcEl, { childList: true, subtree: true, characterData: true });
  }

  // También funciona con data-ticker="número" en el HTML
  document.querySelectorAll('[data-ticker]').forEach(el => {
    const to = parseInt(el.dataset.ticker, 10);
    if (isNaN(to)) return;
    el.dataset.tickerTarget = to;
    el.dataset.tickerFrom   = '0';
    ticker_observer.observe(el);
  });
})();


/* ═══════════════════════════════════════════════════════════════════
   20. MAGNETIC BUTTON — El botón sigue al cursor dentro de un radio
   Aplica a: .btn-cv, .btn-send, [data-magnetic]
   STRENGTH_OUTER: cuánto se mueve el borde del botón (0-1)
   STRENGTH_INNER: cuánto se mueve el label interior (debe ser > OUTER)
   RADIUS_FACTOR:  radio de atracción relativo al tamaño del botón
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.matchMedia('(hover: none)').matches) return; // no aplica en tactil

  const STRENGTH_OUTER = 0.38; // <- intensidad del movimiento del contenedor
  const STRENGTH_INNER = 0.62; // <- intensidad del movimiento del label (mas que OUTER)
  const RADIUS_FACTOR  = 0.6;  // <- radio de atraccion = max(w,h) * RADIUS_FACTOR

  function makeMagnetic(btn) {
    if (btn.dataset.magneticReady) return; // evita aplicarlo dos veces
    btn.dataset.magneticReady = '1';
    btn.classList.add('magnetic-btn');

    // Mueve todo el contenido del botón a un span interior (.magnetic-inner)
    // para poder mover el contenedor y el label con distinta intensidad
    const inner = document.createElement('span');
    inner.className = 'magnetic-inner';
    while (btn.firstChild) inner.appendChild(btn.firstChild);
    btn.appendChild(inner);

    let raf = 0;
    function applyForce(cx, cy) {
      const r      = btn.getBoundingClientRect();
      const dx     = cx - (r.left + r.width  / 2); // distancia del cursor al centro X
      const dy     = cy - (r.top  + r.height / 2); // distancia del cursor al centro Y
      const radius = Math.max(r.width, r.height) * RADIUS_FACTOR;

      if (Math.hypot(dx, dy) < radius) {
        // Dentro del radio: aplica atraccion proporcional a la distancia
        btn.style.transform   = `translate(${(dx * STRENGTH_OUTER).toFixed(2)}px, ${(dy * STRENGTH_OUTER).toFixed(2)}px)`;
        inner.style.transform = `translate(${(dx * (STRENGTH_INNER - STRENGTH_OUTER)).toFixed(2)}px, ${(dy * (STRENGTH_INNER - STRENGTH_OUTER)).toFixed(2)}px)`;
      } else {
        // Fuera del radio: resetea (CSS transiciona el regreso)
        btn.style.transform = inner.style.transform = '';
      }
    }

    function onMove(e) {
      if (raf) return; // throttle RAF
      raf = requestAnimationFrame(() => { raf = 0; applyForce(e.clientX, e.clientY); });
    }

    window.addEventListener('mousemove', onMove, { passive: true });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = inner.style.transform = '';
    });
  }

  document.querySelectorAll('.btn-cv, .btn-send, [data-magnetic]').forEach(makeMagnetic);
})();


/* ═══════════════════════════════════════════════════════════════════
   21. LAZY DEVICONS — Carga la fuente TTF de devicon (777 KiB) solo
   cuando la sección #about entra en el viewport por primera vez.
   Esto evita que el navegador la descargue durante el first paint,
   reduciendo el LCP y el TBT en móvil de forma significativa.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  const about = document.getElementById('about');
  if (!about) return;

  let loaded = false;
  const obs = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting || loaded) return;
    loaded = true;
    obs.disconnect();

    // Inyecta el <link> de devicons en el <head> en este momento
    const link = document.createElement('link');
    link.rel  = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/devicon.min.css';
    document.head.appendChild(link);
  }, {
    // Empieza a cargar con ~300px de anticipación para que los iconos
    // estén listos cuando el usuario llegue a la sección
    rootMargin: '300px 0px 0px 0px',
    threshold: 0
  });

  obs.observe(about);
})();


/* ═══════════════════════════════════════════════════════════════════
   22. PASSIVE INIT — Inicializa módulos no-críticos en tiempo idle
   ─────────────────────────────────────────────────────────────────
   OPT: requestIdleCallback (con fallback a setTimeout 200ms) permite que
   el browser termine el first paint y la interacción inicial antes de
   ejecutar código que no es necesario en el primer frame visible.
   Esto reduce el TBT (Total Blocking Time) en móvil.

   Se mueven aquí: shimmer, blur-in, number-ticker, magnetic button.
   Estos no afectan el layout inicial ni son necesarios para que el
   usuario pueda scrollear o hacer click inmediatamente.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  // requestIdleCallback con timeout de seguridad de 500ms
  const scheduleIdle = (fn) => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(fn, { timeout: 500 });
    } else {
      setTimeout(fn, 200);
    }
  };

  scheduleIdle(() => {
    // ── Shimmer en hero-sub y logo ──
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll('.hero-sub').forEach(el => el.classList.add('shimmer-text'));
      const logo = document.querySelector('.nav-logo');
      if (logo) logo.classList.add('shimmer-text-strong');
      document.querySelectorAll('[data-shimmer]').forEach(el => {
        el.classList.add(el.dataset.shimmer === 'strong' ? 'shimmer-text-strong' : 'shimmer-text');
      });
    }
  });
})();

/* ═══════════════════════════════════════════════════════════════════
   23. LIBERAR WILL-CHANGE DESPUÉS DE ANIMACIONES INICIALES
   ─────────────────────────────────────────────────────────────────
   OPT: will-change: opacity/transform en .hero-right se aplica antes
   de la animación CSS (@keyframes heroIn). Una vez que termina la 
   animación, quitar will-change libera la capa de compositor GPU.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  const heroRight = document.querySelector('.hero-right');
  if (!heroRight) return;
  // La animación heroIn dura 1s + 0.28s delay = ~1.3s. Liberamos a los 1.5s.
  setTimeout(() => heroRight.classList.add('anim-done'), 1500);
})();


/* ═══════════════════════════════════════════════════════════════════
   24. PRELOAD DE IMÁGENES DE FONDO RESTANTES EN IDLE TIME
   ─────────────────────────────────────────────────────────────────
   La primera imagen de fondo ya está preloaded en el <head>.
   Las demás se prefetchean en tiempo idle para que estén en caché
   cuando el usuario haga scroll. No bloquea el first paint.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  // Solo en conexiones no metered (evita gastos de datos en móvil con datos limitados)
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (conn && (conn.saveData || conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g')) return;

  const isMob = window.matchMedia('(max-width: 900px)').matches;
  const imgW  = isMob ? 900 : 1800;
  const supportsWebP = (() => {
    try {
      return document.createElement('canvas').toDataURL('image/webp').startsWith('data:image/webp');
    } catch { return false; }
  })();
  const fmt = supportsWebP ? '&fm=webp' : '';

  const bgImages = [
    `https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=${imgW}&auto=format&fit=crop&q=72${fmt}`,
    `https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=${imgW}&auto=format&fit=crop&q=72${fmt}`,
    `https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=${imgW}&auto=format&fit=crop&q=72${fmt}`,
  ];

  const scheduleIdle = (fn) => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(fn, { timeout: 3000 });
    } else {
      setTimeout(fn, 2000);
    }
  };

  // Prefetch una imagen a la vez para no saturar la red
  function prefetchOne(idx) {
    if (idx >= bgImages.length) return;
    scheduleIdle(() => {
      const img = new Image();
      img.onload = () => prefetchOne(idx + 1); // siguiente solo cuando esta cargó
      img.src = bgImages[idx];
    });
  }

  // Empieza a prefetchear después de que el load event termine
  window.addEventListener('load', () => prefetchOne(0), { once: true, passive: true });
})();


/* ═══════════════════════════════════════════════════════════════════
   25. ACTIVE NAV LINKS — Resalta el link de navbar según sección visible
   ─────────────────────────────────────────────────────────────────
   Usa IntersectionObserver en lugar de scroll + getBoundingClientRect
   para evitar layout thrashing. Beneficia al SEO (señal de UX).
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
  if (!sections.length || !navLinks.length) return;

  const linkMap = {};
  navLinks.forEach(a => { linkMap[a.getAttribute('href').slice(1)] = a; });

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const link = linkMap[entry.target.id];
      if (link) link.classList.toggle('active', entry.isIntersecting);
    });
  }, {
    rootMargin: '-40% 0px -55% 0px', // activa cuando la sección ocupa el centro del viewport
    threshold: 0
  });

  sections.forEach(s => obs.observe(s));
})();


/* ═══════════════════════════════════════════════════════════════════
   26. ARIA DEL DRAWER MÓVIL — Sincroniza aria-hidden con el estado del drawer
   ─────────────────────────────────────────────────────────────────
   El aria-hidden en el drawer y overlay ya están en el HTML.
   Este módulo los mantiene sincronizados al abrir/cerrar.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  const drawer  = document.getElementById('navDrawer');
  const overlay = document.getElementById('navOverlay');
  if (!drawer) return;

  // MutationObserver en la clase .open del drawer
  const mo = new MutationObserver(() => {
    const isOpen = drawer.classList.contains('open');
    drawer.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    if (overlay) overlay.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
  });
  mo.observe(drawer, { attributes: true, attributeFilter: ['class'] });
})();