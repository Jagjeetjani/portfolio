/* ============================================
   CUSTOM CURSOR
   Smooth lerp cursor trail without big circle.
   Skipped on touch devices.
   ============================================ */
(function () {
  'use strict';

  var TRAIL_LERP  = 0.3;
  var TRAIL_COUNT = 10;
  var MAX_DOT_SIZE = 6;   // px, first dot (default)
  var MIN_DOT_SIZE = 1;   // px, last dot
  var MAX_DOT_OPACITY = 0.7;
  var MIN_DOT_OPACITY = 0.1;

  function isTouchDevice() {
    return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  }

  function CustomCursor() {
    if (isTouchDevice()) return;

    // Hide native cursor
    document.body.style.cursor = 'none';

    // Mouse position (raw)
    this.mouseX = -100;
    this.mouseY = -100;

    // Trail dots
    this.dots     = [];
    this.dotPos   = []; // { x, y } for each dot

    this.active   = false;  // cursor visible?
    this.isHovering = false;
    this.hoverMultiplier = 1.0;

    this.createTrail();
    this.bindEvents();
    this.loop();
  }

  CustomCursor.prototype.createTrail = function () {
    for (var i = 0; i < TRAIL_COUNT; i++) {
      var dot   = document.createElement('div');
      dot.className = 'trail-dot';

      // Linearly interpolated size and opacity
      var t       = i / (TRAIL_COUNT - 1);
      var size    = MAX_DOT_SIZE - t * (MAX_DOT_SIZE - MIN_DOT_SIZE);
      var opacity = MAX_DOT_OPACITY - t * (MAX_DOT_OPACITY - MIN_DOT_OPACITY);

      dot.style.width      = size + 'px';
      dot.style.height     = size + 'px';
      dot.style.opacity    = opacity;
      dot.style.position   = 'fixed';
      dot.style.top        = '-10px'; // Offset slightly so it perfectly aligns with cursor tip
      dot.style.left       = '-10px';
      dot.style.pointerEvents = 'none';
      dot.style.zIndex     = '9998';
      dot.style.borderRadius = '50%';
      dot.style.background = '#7c3aed';
      dot.style.transform  = 'translate(-100px, -100px)';
      dot.style.willChange = 'transform, width, height';
      dot.style.transition = 'width 0.1s, height 0.1s'; // Smooth scaling

      document.body.appendChild(dot);
      this.dots.push(dot);
      this.dotPos.push({ x: -100, y: -100 });
    }
  };

  CustomCursor.prototype.bindEvents = function () {
    var self = this;

    document.addEventListener('mousemove', function (e) {
      self.mouseX = e.clientX;
      self.mouseY = e.clientY;

      if (!self.active) {
        self.active = true;
        for (var i = 0; i < TRAIL_COUNT; i++) {
          self.dots[i].style.opacity = MAX_DOT_OPACITY - (i / (TRAIL_COUNT - 1)) * (MAX_DOT_OPACITY - MIN_DOT_OPACITY);
        }
      }
    });

    // Hover detection on [data-cursor-hover], a tags, buttons
    var hoverEls = document.querySelectorAll('[data-cursor-hover], a, button');
    for (var i = 0; i < hoverEls.length; i++) {
      hoverEls[i].addEventListener('mouseenter', function () {
        self.isHovering = true;
      });
      hoverEls[i].addEventListener('mouseleave', function () {
        self.isHovering = false;
      });
    }
  };

  CustomCursor.prototype.loop = function () {
    var self = this;

    // Smooth lerp for the size multiplier
    var targetMultiplier = this.isHovering ? 3.0 : 1.0; // 3x size on hover
    this.hoverMultiplier += (targetMultiplier - this.hoverMultiplier) * 0.15;

    // Trail: each dot follows the previous position
    for (var i = 0; i < TRAIL_COUNT; i++) {
      var target;
      if (i === 0) {
        target = { x: this.mouseX, y: this.mouseY };
      } else {
        target = this.dotPos[i - 1];
      }
      this.dotPos[i].x += (target.x - this.dotPos[i].x) * TRAIL_LERP;
      this.dotPos[i].y += (target.y - this.dotPos[i].y) * TRAIL_LERP;
      
      this.dots[i].style.transform =
        'translate(' + this.dotPos[i].x + 'px, ' + this.dotPos[i].y + 'px)';

      // Update size dynamically based on hover state
      var t       = i / (TRAIL_COUNT - 1);
      var size    = (MAX_DOT_SIZE - t * (MAX_DOT_SIZE - MIN_DOT_SIZE)) * this.hoverMultiplier;
      this.dots[i].style.width = size + 'px';
      this.dots[i].style.height = size + 'px';
    }

    requestAnimationFrame(function () {
      self.loop();
    });
  };

  // ── Bootstrap ──────────────────────────────
  document.addEventListener('preloaderDone', function () {
    window.customCursor = new CustomCursor();
  });
})();
