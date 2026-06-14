/* ============================================
   animations.js — Scroll-Triggered Animation Controller
   Handles: scroll reveals, stat counters, hero text split, skill bars
   ============================================ */

(function () {
  'use strict';

  // ── 1. Scroll-Reveal Observer (fallback for browsers without CSS scroll-driven animations) ──

  /**
   * Sets up an IntersectionObserver for '.animate-on-scroll' elements.
   * Only activates when CSS scroll-driven animations are NOT supported,
   * providing a JS fallback that adds a 'visible' class on first intersection.
   */
  function initScrollReveal() {
    const elements = document.querySelectorAll('.animate-on-scroll');
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const el = entry.target;
          el.classList.add('visible');

          // Stagger grouped siblings: add increasing transition-delay
          applyStagger(el);

          // One-shot — stop watching once revealed
          observer.unobserve(el);
        });
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    elements.forEach((el) => observer.observe(el));
  }

  /**
   * Adds staggered transition-delay to siblings that share the same parent
   * and the '.animate-on-scroll' class, so they cascade in 0.1 s increments.
   */
  function applyStagger(el) {
    const parent = el.parentElement;
    if (!parent) return;

    const siblings = parent.querySelectorAll(':scope > .animate-on-scroll');
    if (siblings.length <= 1) return;

    siblings.forEach((sibling, i) => {
      sibling.style.transitionDelay = `${i * 0.1}s`;
    });
  }

  // ── 2. Stat Counter Animation ──

  /**
   * Animates '.stat-number[data-count]' elements from 0 to their target value
   * when the parent '.about-stats' container scrolls into view.
   * Uses requestAnimationFrame with ease-out easing over 2 seconds.
   */
  function initStatCounters() {
    const statsContainer = document.querySelector('.about-stats');
    if (!statsContainer) return;

    const statNumbers = statsContainer.querySelectorAll('.stat-number[data-count]');
    if (!statNumbers.length) return;

    let hasFired = false;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || hasFired) return;
          hasFired = true;
          observer.unobserve(entry.target);

          statNumbers.forEach((numEl) => {
            const target = parseInt(numEl.getAttribute('data-count'), 10);
            animateCount(numEl, 0, target, 2000);
          });
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(statsContainer);
  }

  /**
   * Smoothly counts an element's textContent from `start` to `end`
   * over `duration` ms with an ease-out curve.
   */
  function animateCount(el, start, end, duration) {
    const startTime = performance.now();

    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out: 1 - (1 - t)^3
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * eased);

      el.textContent = current;

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    }

    requestAnimationFrame(tick);
  }

  function initHeroTextSplit() {
    // Disabled: splitting text into transformed spans breaks CSS background-clip: text in webkit.
    // The entrance animation is now handled by a wrapper div in index.html.
    return;
  }

  // ── 4. Skill Bar Animation ──

  /**
   * Observes '.skill-bar' elements. When visible, sets the CSS variable
   * --level (for the fill width) and animates the .skill-percent text
   * from 0 to the target level.
   */
  function initSkillBars() {
    const skillBars = document.querySelectorAll('.skill-bar');
    if (!skillBars.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const bar = entry.target;
          const level = parseInt(bar.getAttribute('data-level'), 10);

          // Drive the CSS fill width
          bar.style.setProperty('--level', `${level}%`);
          bar.classList.add('visible');

          // Animate the percentage text
          const percentEl = bar.querySelector('.skill-percent');
          if (percentEl) {
            animateSkillPercent(percentEl, 0, level, 1500);
          }

          observer.unobserve(bar);
        });
      },
      {
        threshold: 0.2,
        rootMargin: '0px 0px -30px 0px',
      }
    );

    skillBars.forEach((bar) => observer.observe(bar));
  }

  /**
   * Counts a skill-percent element from `start`% to `end`% with ease-out.
   */
  function animateSkillPercent(el, start, end, duration) {
    const startTime = performance.now();

    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * eased);

      el.textContent = `${current}%`;

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    }

    requestAnimationFrame(tick);
  }

  // ── Bootstrap ──

  /**
   * Initialize all animation observers once the preloader finishes.
   * The hero text split fires immediately on preloaderDone;
   * observers begin watching the DOM for scroll-based triggers.
   */
  document.addEventListener('preloaderDone', () => {
    initHeroTextSplit();
    initScrollReveal();
    initStatCounters();
    initSkillBars();
  });
})();
