
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    menuToggle.classList.toggle('active');
});

// Scroll Progress Indicator
window.addEventListener('scroll', () => {
    const scrolled = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
    document.querySelector('.scroll-indicator').style.width = scrolled + '%';
});

// Smooth Scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});


// Download CV Function with enhanced content
function downloadCV() {
    const pdfPath = "CV.pdf"; // nombre del archivo en tu carpeta
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = pdfPath;
    a.download = "CV_RicardoHernándezCastro.pdf"; // nombre con el que se descarga
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Notificación (si tienes implementado showNotification)
    showNotification("CV descargado exitosamente", "success");
}

// Enhanced Contact Form Handler
(function(){
    emailjs.init("P8_29jAf2zFc0kVSV"); // solo la pública
  })();

  document.addEventListener('DOMContentLoaded', function() {
      const contactForm = document.querySelector('.contact-form');
      if (contactForm) {
          contactForm.addEventListener('submit', function(e) {
              e.preventDefault();

              const formData = new FormData(this);
              const name = formData.get('name').trim();
              const email = formData.get('email').trim();
              const message = formData.get('message').trim();

              if (!name || !email || !message) {
                  showNotification('Por favor, completa todos los campos', 'error');
                  return;
              }

              if (!isValidEmail(email)) {
                  showNotification('Por favor, ingresa un email válido', 'error');
                  return;
              }

              showLoadingSpinner(true);

              emailjs.send("service_dfnkfw8", "template_ci74phj", {
                  from_name: name,
                  from_email: email,
                  message: message
              }).then(() => {
                  showLoadingSpinner(false);
                  showNotification(`¡Gracias ${name}! Tu mensaje ha sido enviado exitosamente.`, 'success');
                  contactForm.reset();
              }).catch((error) => {
                  showLoadingSpinner(false);
                  showNotification('Error al enviar el mensaje, intenta más tarde', 'error');
                  console.error(error);
              });
          });
      }
  });

  function isValidEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
  }

// Elegant notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.innerHTML = `
        <div class="notification__content">
            <i class="notification__icon fas ${getNotificationIcon(type)}"></i>
            <span class="notification__message">${message}</span>
        </div>
        <button class="notification__close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#000000' : type === 'error' ? '#dc2626' : '#4a4a4a'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        min-width: 300px;
        font-family: 'Inter', sans-serif;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-size: 0.9rem;
        animation: slideInRight 0.3s ease-out;
    `;
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        .notification__content {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .notification__close {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 0.25rem;
            opacity: 0.7;
            transition: opacity 0.2s;
        }
        .notification__close:hover {
            opacity: 1;
        }
    `;
    
    if (!document.querySelector('#notification-styles')) {
        style.id = 'notification-styles';
        document.head.appendChild(style);
    }
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function getNotificationIcon(type) {
    switch(type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        default: return 'fa-info-circle';
    }
}

// Loading spinner for form submission
function showLoadingSpinner(show) {
    const submitButton = document.querySelector('.contact-form .btn-primary');
    if (!submitButton) return;
    
    if (show) {
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    } else {
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Mensaje';
    }
}

// Enhanced Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in-up');
            // Add stagger effect for multiple elements
            if (entry.target.classList.contains('blog-card') || entry.target.classList.contains('skill-tag')) {
                const delay = Array.from(entry.target.parentElement.children).indexOf(entry.target) * 100;
                entry.target.style.animationDelay = `${delay}ms`;
            }
        }
    });
}, observerOptions);

// Observe all sections and cards
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.section, .blog-card, .contact-item, .skill-tag').forEach(element => {
        observer.observe(element);
    });
});

// Enhanced interactive effects for blog cards
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.blog-card').forEach(card => {
        // Animación hover
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });

        card.addEventListener('click', function() {
        const title = this.querySelector('h3').textContent;
        showNotification(`Abriendo proyecto: "${title}"`, 'info');

        const link = this.querySelector('.read-more');
        if (link) {
            setTimeout(() => {
                window.location.href = link.getAttribute('href');
            }, 800); // pequeño delay para que se vea la notificación
        }
        });
    });
});

// Social links functionality with platform detection
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.social-link').forEach(link => {
        link.addEventListener('click', function(e) {
            // Solo prevenir el comportamiento por defecto si el enlace es un placeholder (#)
            if (this.href.includes('#') && this.href.split('#')[1] === '') {
                e.preventDefault();
                const icon = this.querySelector('i');
                let platform = '';
                
                if (icon.classList.contains('fa-twitch')) platform = 'Twitch';
                else if (icon.classList.contains('fa-instagram')) platform = 'Instagram';
                else if (icon.classList.contains('fa-github')) platform = 'GitHub';
                else if (icon.classList.contains('fa-tiktok')) platform = 'TikTok';
                else if (icon.classList.contains('fa-discord')) platform = 'Discord';
                
                showNotification(`Por favor, configura tu enlace de ${platform}`, 'info');
            }
            // Si el enlace es real, dejarlo funcionar normalmente
        });
    });
});

// Keyboard navigation enhancement
document.addEventListener('keydown', function(e) {
    // ESC key closes notifications
    if (e.key === 'Escape') {
        const notifications = document.querySelectorAll('.notification');
        notifications.forEach(notification => notification.remove());
    }
    
    // Enter key on focused elements
    if (e.key === 'Enter' && document.activeElement.classList.contains('blog-card')) {
        document.activeElement.click();
    }
});

// Smooth page load animation
window.addEventListener('load', function() {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease-in-out';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

// Enhanced scroll-to-top functionality
let scrollToTopButton;

function createScrollToTopButton() {
    scrollToTopButton = document.createElement('button');
    scrollToTopButton.innerHTML = '<i class="fas fa-arrow-up"></i>';
    scrollToTopButton.className = 'scroll-to-top';
    scrollToTopButton.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        background: #000000;
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        z-index: 1000;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    `;
    
    scrollToTopButton.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    document.body.appendChild(scrollToTopButton);
}

// Show/hide scroll to top button
window.addEventListener('scroll', function() {
    if (!scrollToTopButton) createScrollToTopButton();
    
    if (window.scrollY > 500) {
        scrollToTopButton.style.opacity = '1';
        scrollToTopButton.style.visibility = 'visible';
    } else {
        scrollToTopButton.style.opacity = '0';
        scrollToTopButton.style.visibility = 'hidden';
    }
});

// Performance optimization: Debounced scroll handler
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply debounced scroll handlers
const debouncedScrollHandler = debounce(() => {
    // Your scroll-intensive operations here
}, 16); // ~60fps

window.addEventListener('scroll', debouncedScrollHandler);