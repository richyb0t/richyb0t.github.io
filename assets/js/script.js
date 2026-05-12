

/* ── Helpers ─────────────────────────────────────── */
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

/* ── Menu toggle ─────────────────────────────────── */
(function () {
  const toggle = $('.menu-toggle');
  const nav    = $('.nav-links');
  if (!toggle || !nav) return;
  toggle.addEventListener('click', () => {
    nav.classList.toggle('active');
    toggle.classList.toggle('active');
  });
})();

/* ── Scroll progress bar (RAF-gated) ─────────────── */
(function () {
  const indicator = $('.scroll-indicator');
  if (!indicator) return;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const pct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight) * 100;
        indicator.style.width = pct + '%';
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();

/* ── Smooth scroll for anchor links ──────────────── */
// Delegated — one listener instead of one per anchor
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const target = document.querySelector(a.getAttribute('href'));
  if (target) {
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

/* ── Cinematic Parallax (index page) ─────────────── */
(function initIndexParallax() {
  const images = [
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1800&auto=format&fit=crop&q=75',
  ];

  const tints = [
    'rgba(10,20,50,0.12)',
    'rgba(20,40,20,0.10)',
    'rgba(50,20,10,0.10)',
    'rgba(10,30,50,0.14)',
  ];

  // Build #cinema-bg
  const cBg = document.createElement('div');
  cBg.id = 'cinema-bg';

  const layers = images.map((src, i) => {
    const div = document.createElement('div');
    div.className = 'cinema-layer' + (i === 0 ? ' active' : '');
    div.style.backgroundImage = `url('${src}')`;
    cBg.appendChild(div);
    return div;
  });

  const tintEl = document.createElement('div');
  tintEl.id = 'cinema-tint';

  // Letterbox bars
  const hero = $('.hero');
  if (hero) {
    const barTop = document.createElement('div');
    barTop.className = 'hero-letterbox-top';
    const barBot = document.createElement('div');
    barBot.className = 'hero-letterbox-bottom';
    hero.append(barTop, barBot);

    let heroBg = hero.querySelector('.hero-parallax-bg');
    if (!heroBg) {
      heroBg = document.createElement('div');
      heroBg.className = 'hero-parallax-bg';
      hero.insertBefore(heroBg, hero.firstChild);
    }
    heroBg.style.backgroundImage = `url('${images[0]}')`;
    setTimeout(() => hero.classList.add('cinematic'), 900);
  }

  document.body.insertBefore(cBg, document.body.firstChild);
  document.body.insertBefore(tintEl, document.body.firstChild);

  let currentLayer = 0;

  function setLayer(idx) {
    if (idx === currentLayer) return;
    const prev = layers[currentLayer];
    prev.classList.remove('active');
    prev.classList.add('previous');
    currentLayer = idx;
    layers[currentLayer].classList.add('active');
    tintEl.style.background = tints[idx] || 'transparent';
    // Use transitionend + safety fallback instead of arbitrary setTimeout
    function cleanup() {
      prev.classList.remove('previous');
      prev.removeEventListener('transitionend', cleanup);
    }
    prev.addEventListener('transitionend', cleanup, { once: true });
    setTimeout(() => prev.classList.remove('previous'), 1500);
  }

  // Cache stable measurements — refresh only on resize
  let heroH = hero ? hero.offsetHeight : 0;
  window.addEventListener('resize', () => { heroH = hero ? hero.offsetHeight : 0; }, { passive: true });

  let lastScrollY = window.scrollY;
  let rafId = 0;

  function onParallaxScroll() {
    rafId = 0;
    const scrollY  = lastScrollY;
    const maxH     = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollY / (maxH || 1);

    for (let i = 0; i < layers.length; i++) {
      layers[i].style.transform = `translateY(${scrollY * (0.22 + i * 0.04)}px) scale(1.35)`;
    }

    const heroBg = hero && hero.querySelector('.hero-parallax-bg');
    if (heroBg) {
      heroBg.style.transform = `translateY(${scrollY * 0.42}px) scale(1.4)`;
      // Filter computed once
      const br = (0.22 + Math.min(progress, 0.5) * 0.08).toFixed(3);
      heroBg.style.filter = `brightness(${br}) saturate(0.6)`;
    }

    const heroContent = hero && hero.querySelector('.hero-content');
    if (heroContent) {
      const hp = Math.min(scrollY / (heroH || 1), 1);
      heroContent.style.opacity   = Math.max(0, 1 - hp * 1.6);
      heroContent.style.transform = `translateY(${scrollY * 0.15}px)`;
    }

    const zone = Math.min(Math.floor(progress * images.length), images.length - 1);
    setLayer(zone);

    // Compute filter string once
    const brightness = (0.22 + progress * 0.06).toFixed(3);
    const filterStr  = `brightness(${brightness}) saturate(0.6)`;
    for (let i = 0; i < layers.length; i++) {
      layers[i].style.filter = filterStr;
    }
  }

  window.addEventListener('scroll', () => {
    lastScrollY = window.scrollY;
    if (!rafId) rafId = requestAnimationFrame(onParallaxScroll);
  }, { passive: true });

  onParallaxScroll();
})();

/* ── Download CV ─────────────────────────────────── */
function downloadCV() {
  const a = document.createElement('a');
  a.href     = 'assets/docs/CV.pdf';
  a.download = 'CV_RicardoHernándezCastro.pdf';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showNotification('CV descargado exitosamente', 'success');
}

/* ── EmailJS init ────────────────────────────────── */
(function () {
  if (typeof emailjs !== 'undefined') emailjs.init('P8_29jAf2zFc0kVSV');
})();

/* ── Notification styles (injected once) ─────────── */
(function () {
  if (document.getElementById('notification-styles')) return;
  const style = document.createElement('style');
  style.id = 'notification-styles';
  style.textContent = `
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to   { transform: translateX(0);    opacity: 1; }
    }
    .notification {
      position: fixed; top: 100px; right: 20px;
      color: #fff; padding: 1rem 1.5rem;
      border-radius: 0; font-size: 0.85rem;
      display: flex; align-items: center; justify-content: space-between;
      gap: 1rem; z-index: 10000; max-width: 360px;
      animation: slideInRight 0.3s ease;
      box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    }
    .notification--success { background: #000; }
    .notification--error   { background: #dc2626; }
    .notification--info    { background: #4a4a4a; }
    .notification__content { display: flex; align-items: center; gap: 0.5rem; }
    .notification__close {
      background: none; border: none; color: #fff;
      cursor: pointer; padding: 0.25rem; opacity: 0.7;
      transition: opacity 0.2s;
    }
    .notification__close:hover { opacity: 1; }
  `;
  document.head.appendChild(style);
})();

/* ── Notification system ─────────────────────────── */
const NOTIFICATION_ICONS = {
  success: 'fa-check-circle',
  error:   'fa-exclamation-circle',
};

function showNotification(message, type = 'info') {
  // Remove any existing notifications (batch removal)
  document.querySelectorAll('.notification').forEach(n => n.remove());

  const icon = NOTIFICATION_ICONS[type] || 'fa-info-circle';
  const el = document.createElement('div');
  el.className = `notification notification--${type}`;
  el.innerHTML = `
    <div class="notification__content">
      <i class="notification__icon fas ${icon}"></i>
      <span class="notification__message">${message}</span>
    </div>
    <button class="notification__close" aria-label="Cerrar"><i class="fas fa-times"></i></button>
  `;
  el.querySelector('.notification__close').addEventListener('click', () => el.remove());

  document.body.appendChild(el);
  const timer = setTimeout(() => el.remove(), 5000);

  // Allow early dismissal to also clear the timer
  el.addEventListener('click', () => { clearTimeout(timer); el.remove(); }, { once: true });
}

/* ── Loading spinner ─────────────────────────────── */
function showLoadingSpinner(show) {
  const btn = document.querySelector('.contact-form .btn-primary');
  if (!btn) return;
  btn.disabled = show;
  btn.innerHTML = show
    ? '<i class="fas fa-spinner fa-spin"></i> Enviando...'
    : '<i class="fas fa-paper-plane"></i> Enviar Mensaje';
}

/* ── Email validation helper ─────────────────────── */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isValidEmail(email) { return EMAIL_RE.test(email); }

/* ── DOMContentLoaded — merged into one listener ─── */
document.addEventListener('DOMContentLoaded', () => {

  /* Contact form */
  const contactForm = document.querySelector('.contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const data = new FormData(this);
      const name    = (data.get('name')    || '').trim();
      const email   = (data.get('email')   || '').trim();
      const message = (data.get('message') || '').trim();

      if (!name || !email || !message) {
        showNotification('Por favor, completa todos los campos', 'error');
        return;
      }
      if (!isValidEmail(email)) {
        showNotification('Por favor, ingresa un email válido', 'error');
        return;
      }

      showLoadingSpinner(true);
      emailjs.send('service_dfnkfw8', 'template_ci74phj', {
        from_name: name, from_email: email, message,
      }).then(() => {
        showLoadingSpinner(false);
        showNotification(`¡Gracias ${name}! Tu mensaje ha sido enviado exitosamente.`, 'success');
        contactForm.reset();
      }).catch(err => {
        showLoadingSpinner(false);
        showNotification('Error al enviar el mensaje, intenta más tarde', 'error');
        console.error(err);
      });
    });
  }

  /* IntersectionObserver for scroll-animated elements */
  const animEls = $$('.section, .blog-card, .contact-item, .skill-tag');
  if (animEls.length) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        // Stagger only for known card types — computed once, not on every hover
        if (el.classList.contains('blog-card') || el.classList.contains('skill-tag')) {
          const idx = Array.prototype.indexOf.call(el.parentElement.children, el);
          el.style.animationDelay = `${idx * 100}ms`;
        }
        el.classList.add('fade-in-up');
        observer.unobserve(el);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    animEls.forEach(el => observer.observe(el));
  }

  /* blog-card hover — delegated (1 listener per grid instead of N per card) */
  document.querySelectorAll('.blog-grid, .projects-grid').forEach(grid => {
    grid.addEventListener('mouseover', e => {
      const card = e.target.closest('.blog-card');
      if (card) card.style.transform = 'translateY(-10px) scale(1.02)';
    });
    grid.addEventListener('mouseout', e => {
      const card = e.target.closest('.blog-card');
      if (card) card.style.transform = '';
    });
    grid.addEventListener('click', e => {
      const card = e.target.closest('.blog-card');
      if (!card) return;
      const title = card.querySelector('h3')?.textContent;
      if (title) showNotification(`Abriendo proyecto: "${title}"`, 'info');
      const link = card.querySelector('.read-more');
      if (link) setTimeout(() => { window.location.href = link.getAttribute('href'); }, 800);
    });
  });

  /* Social links — delegated */
  const socialContainer = document.querySelector('.social-links') || document.body;
  socialContainer.addEventListener('click', e => {
    const link = e.target.closest('.social-link');
    if (!link) return;
    const href = link.getAttribute('href');
    if (href && href.replace(/^.*#/, '') === '') {
      e.preventDefault();
      const icon = link.querySelector('i');
      if (!icon) return;
      const platformMap = {
        'fa-twitch': 'Twitch', 'fa-instagram': 'Instagram',
        'fa-github': 'GitHub', 'fa-tiktok': 'TikTok', 'fa-discord': 'Discord',
      };
      const platform = Object.entries(platformMap).find(([cls]) => icon.classList.contains(cls))?.[1] || 'red social';
      showNotification(`Por favor, configura tu enlace de ${platform}`, 'info');
    }
  });
});

/* ── Keyboard shortcuts ──────────────────────────── */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.notification').forEach(n => n.remove());
  }
  if (e.key === 'Enter' && document.activeElement?.classList.contains('blog-card')) {
    document.activeElement.click();
  }
});

/* ── Page load fade-in ───────────────────────────── */
// Body starts hidden via inline style in HTML or CSS; revealed here
window.addEventListener('load', () => {
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.5s ease-in-out';
  requestAnimationFrame(() => {
    setTimeout(() => { document.body.style.opacity = '1'; }, 100);
  });
});
