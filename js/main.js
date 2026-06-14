/* ============================================
   MAIN  — orchestrator
   Initialises every interactive feature after
   the preloaderDone custom event.
   ============================================ */
(function () {
  'use strict';

  document.addEventListener('preloaderDone', init);

  function init() {
    scrollProgress();
    navbar();
    globalBlob();
    smoothScroll();
    backToTop();
    contactForm();
    tiltEffect();
  }

  /* ──────────────────────────────────────────
     1. Scroll Progress Bar (JS fallback)
     ────────────────────────────────────────── */
  function scrollProgress() {
    // If the browser supports pure‑CSS scroll‑driven animations, bail out.
    if (CSS && CSS.supports && CSS.supports('animation-timeline', 'scroll()')) return;

    var bar = document.getElementById('scroll-progress');
    if (!bar) return;

    window.addEventListener('scroll', function () {
      var scrollTop   = document.documentElement.scrollTop || document.body.scrollTop;
      var scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      var progress    = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
      bar.style.transform = 'scaleX(' + progress + ')';
    }, { passive: true });
  }

  /* ──────────────────────────────────────────
     2. Navbar
     ────────────────────────────────────────── */
  function navbar() {
    var nav       = document.getElementById('navbar');
    var toggle    = document.getElementById('navToggle');
    var navLinks  = document.getElementById('navLinks');

    if (!nav) return;

    // Glassmorphism on scroll
    window.addEventListener('scroll', function () {
      if (window.scrollY > 100) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    }, { passive: true });

    // Mobile toggle
    if (toggle && navLinks) {
      toggle.addEventListener('click', function () {
        var isOpen = navLinks.classList.toggle('active');
        toggle.classList.toggle('active');
        toggle.setAttribute('aria-expanded', String(isOpen));
      });

      // Close mobile menu on link click
      var links = navLinks.querySelectorAll('.nav-link');
      for (var i = 0; i < links.length; i++) {
        links[i].addEventListener('click', function () {
          navLinks.classList.remove('active');
          toggle.classList.remove('active');
          toggle.setAttribute('aria-expanded', 'false');
        });
      }
    }

    // Active section highlighting via IntersectionObserver
    var sections  = document.querySelectorAll('section[id]');
    var allLinks  = document.querySelectorAll('.nav-link[data-section]');

    if ('IntersectionObserver' in window && sections.length && allLinks.length) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var id = entry.target.getAttribute('id');
            allLinks.forEach(function (link) {
              if (link.getAttribute('data-section') === id) {
                link.classList.add('active');
              } else {
                link.classList.remove('active');
              }
            });
          }
        });
      }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

      sections.forEach(function (sec) { observer.observe(sec); });
    }
  }

  /* ──────────────────────────────────────────
     3. Global gradient blob
     ────────────────────────────────────────── */
  function globalBlob() {
    var blob = document.querySelector('.global-gradient-blob');
    if (!blob) return;

    var blobX = window.innerWidth / 2;
    var blobY = window.innerHeight / 2;
    var targetX = blobX;
    var targetY = blobY;

    document.addEventListener('mousemove', function (e) {
      // 200 is half of the blob's width/height (400px)
      targetX = e.clientX - 200;
      targetY = e.clientY - 200;
    });

    function animateBlob() {
      blobX += (targetX - blobX) * 0.05;
      blobY += (targetY - blobY) * 0.05;
      blob.style.transform = 'translate(' + blobX + 'px, ' + blobY + 'px)';
      requestAnimationFrame(animateBlob);
    }
    requestAnimationFrame(animateBlob);
  }

  /* ──────────────────────────────────────────
     4. Smooth scroll for anchor links
     ────────────────────────────────────────── */
  function smoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        var href   = this.getAttribute('href');
        if (!href || href === '#') return;
        var target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  /* ──────────────────────────────────────────
     5. Back to Top
     ────────────────────────────────────────── */
  function backToTop() {
    var btn = document.getElementById('backToTop');
    if (!btn) return;

    var threshold = window.innerHeight;

    window.addEventListener('scroll', function () {
      if (window.scrollY > threshold) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    }, { passive: true });

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }



  /* ──────────────────────────────────────────
     7. Contact Form
     ────────────────────────────────────────── */
  function contactForm() {
    var form      = document.getElementById('contactForm');
    var submitBtn = document.getElementById('submitBtn');
    if (!form || !submitBtn) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var name    = document.getElementById('contactName');
      var email   = document.getElementById('contactEmail');
      var message = document.getElementById('contactMessage');

      // Basic client‑side validation
      if (!name.value.trim() || !email.value.trim() || !message.value.trim()) {
        highlightInvalid(name);
        highlightInvalid(email);
        highlightInvalid(message);
        return;
      }

      if (!isValidEmail(email.value.trim())) {
        highlightInvalid(email);
        return;
      }

      var userName = name.value.trim();

      // Add loading state
      submitBtn.classList.add('loading');
      submitBtn.disabled = true;
      var btnText = submitBtn.querySelector('.btn-text');
      if (btnText) btnText.textContent = 'Sending…';

      var payload = {
        name: name.value.trim(),
        email: email.value.trim(),
        message: message.value.trim()
      };

      fetch("https://formsubmit.co/ajax/jagjeetsinghjani3@gmail.com", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      })
      .then(function (response) {
        if (response.ok) {
          showFormSuccess(userName);
        } else {
          showFormError();
        }
      })
      .catch(function () {
        showFormError();
      });
    });

    function showFormSuccess(userName) {
      form.innerHTML = [
        '<div class="form-success-card" style="text-align: center; padding: 2rem 1rem; animation: scaleIn 0.5s var(--ease-out-expo) both;">',
        '  <div class="success-icon" style="font-size: 3.5rem; margin-bottom: 1.5rem; filter: drop-shadow(0 0 15px rgba(132, 204, 22, 0.4));">✅</div>',
        '  <h3 class="success-title" style="margin-bottom: 0.75rem; background: var(--gradient-text); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: 1.75rem; font-family: var(--font-heading); font-weight: 800;">Message Sent!</h3>',
        '  <p class="success-text" style="color: var(--text-secondary); line-height: 1.6; font-size: 1.05rem;">Thanks for reaching out, ' + userName + '!<br>I have received your message and will respond to you shortly.</p>',
        '</div>'
      ].join('\n');
    }

    function showFormError() {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
      var btnText = submitBtn.querySelector('.btn-text');
      if (btnText) btnText.textContent = 'Send Message';

      var errEl = form.querySelector('.form-error-msg');
      if (!errEl) {
        errEl = document.createElement('div');
        errEl.className = 'form-error-msg';
        errEl.style.cssText = 'color: var(--accent-magenta); text-align: center; margin-top: 1rem; font-size: 0.9rem; font-weight: 500; animation: fadeInUp 0.4s ease;';
        form.appendChild(errEl);
      }
      errEl.textContent = '⚠️ Failed to send message. Please try again or email me directly.';

      setTimeout(function () {
        if (errEl) errEl.remove();
      }, 6000);
    }

    function highlightInvalid(input) {
      if (!input.value.trim() || (input.type === 'email' && !isValidEmail(input.value))) {
        input.classList.add('invalid');
        input.addEventListener('input', function handler() {
          input.classList.remove('invalid');
          input.removeEventListener('input', handler);
        });
      }
    }

    function isValidEmail(str) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
    }
  }

  /* ──────────────────────────────────────────
     8. 3D Tilt Effect
     ────────────────────────────────────────── */
  function tiltEffect() {
    var cards = document.querySelectorAll('[data-tilt]');
    if (!cards.length) return;

    cards.forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x    = e.clientX - rect.left;
        var y    = e.clientY - rect.top;

        // Dynamic scale down for larger cards to keep physical edge displacement consistent
        var maxTilt = Math.min(5, 2000 / Math.max(rect.width, rect.height));

        var rotateY = ((x / rect.width)  - 0.5) *  maxTilt * 2;
        var rotateX = ((y / rect.height) - 0.5) * -maxTilt * 2;

        card.style.transform  = 'perspective(1200px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg)';
        card.style.transition = 'transform 0.1s ease';
      });

      card.addEventListener('mouseleave', function () {
        card.style.transform  = 'perspective(1200px) rotateX(0deg) rotateY(0deg)';
        card.style.transition = 'transform 0.5s ease';
      });
    });
  }
})();
