/* ============================================
   PARTICLE SYSTEM
   Canvas‑based particle background with
   connections and mouse repulsion.
   ============================================ */
(function () {
  'use strict';

  // ── Configuration ──────────────────────────
  var COLORS          = ['#7c3aed', '#ec4899', '#06b6d4', '#facc15'];
  var CONNECT_DIST    = 150;
  var REPULSE_DIST    = 120;
  var DESKTOP_COUNT   = 120;
  var MOBILE_COUNT    = 50;
  var MIN_RADIUS      = 0.5;
  var MAX_RADIUS      = 2.5;
  var MIN_OPACITY     = 0.2;
  var MAX_OPACITY     = 0.6;
  var MAX_SPEED       = 0.3;

  // ── Helpers ────────────────────────────────
  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // ── Particle ───────────────────────────────
  function Particle(canvasW, canvasH) {
    this.x       = Math.random() * canvasW;
    this.y       = Math.random() * canvasH;
    this.vx      = rand(-MAX_SPEED, MAX_SPEED);
    this.vy      = rand(-MAX_SPEED, MAX_SPEED);
    this.radius  = rand(MIN_RADIUS, MAX_RADIUS);
    this.color   = pick(COLORS);
    this.opacity = rand(MIN_OPACITY, MAX_OPACITY);
  }

  Particle.prototype.update = function (w, h, mouse) {
    // Move
    this.x += this.vx;
    this.y += this.vy;

    // Bounce off edges
    if (this.x < 0 || this.x > w) this.vx *= -1;
    if (this.y < 0 || this.y > h) this.vy *= -1;

    // Clamp inside canvas
    this.x = Math.max(0, Math.min(w, this.x));
    this.y = Math.max(0, Math.min(h, this.y));

    // Mouse repulsion
    if (mouse) {
      var dx   = this.x - mouse.x;
      var dy   = this.y - mouse.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < REPULSE_DIST && dist > 0) {
        var force = (REPULSE_DIST - dist) / REPULSE_DIST;
        this.x += (dx / dist) * force * 2;
        this.y += (dy / dist) * force * 2;
      }
    }
  };

  Particle.prototype.draw = function (ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color + hexOpacity(this.opacity);
    ctx.fill();
  };

  /** Convert 0‑1 opacity to 2‑char hex suffix */
  function hexOpacity(o) {
    return ('0' + Math.round(o * 255).toString(16)).slice(-2);
  }

  // ── ParticleSystem ─────────────────────────
  function ParticleSystem() {
    this.canvas    = document.getElementById('particleCanvas');
    if (!this.canvas) return;

    this.ctx       = this.canvas.getContext('2d');
    this.particles = [];
    this.mouse     = null;
    this.animId    = null;

    this._onResize     = this.resize.bind(this);
    this._onMouseMove  = this.handleMouseMove.bind(this);
    this._onMouseLeave = this.handleMouseLeave.bind(this);

    this.resize();
    this.bindEvents();
    this.loop();
  }

  ParticleSystem.prototype.getCount = function () {
    return window.innerWidth > 768 ? DESKTOP_COUNT : MOBILE_COUNT;
  };

  ParticleSystem.prototype.createParticles = function () {
    var count = this.getCount();
    this.particles = [];
    for (var i = 0; i < count; i++) {
      this.particles.push(new Particle(this.canvas.width, this.canvas.height));
    }
  };

  ParticleSystem.prototype.resize = function () {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.createParticles();
  };

  ParticleSystem.prototype.handleMouseMove = function (e) {
    this.mouse = { x: e.clientX, y: e.clientY };
  };

  ParticleSystem.prototype.handleMouseLeave = function () {
    this.mouse = null;
  };

  ParticleSystem.prototype.bindEvents = function () {
    window.addEventListener('resize', this._onResize);
    window.addEventListener('mousemove', this._onMouseMove);
    document.body.addEventListener('mouseleave', this._onMouseLeave);
  };

  ParticleSystem.prototype.drawConnections = function () {
    var pts = this.particles;
    var ctx = this.ctx;
    for (var i = 0, len = pts.length; i < len; i++) {
      for (var j = i + 1; j < len; j++) {
        var dx   = pts[i].x - pts[j].x;
        var dy   = pts[i].y - pts[j].y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECT_DIST) {
          var alpha = 1 - dist / CONNECT_DIST;
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.strokeStyle = 'rgba(124, 58, 237, ' + (alpha * 0.15) + ')';
          ctx.lineWidth   = 0.5;
          ctx.stroke();
        }
      }
    }
  };

  ParticleSystem.prototype.loop = function () {
    var self = this;
    var w    = this.canvas.width;
    var h    = this.canvas.height;
    var ctx  = this.ctx;

    ctx.clearRect(0, 0, w, h);

    for (var i = 0; i < this.particles.length; i++) {
      this.particles[i].update(w, h, this.mouse);
      this.particles[i].draw(ctx);
    }

    this.drawConnections();

    this.animId = requestAnimationFrame(function () {
      self.loop();
    });
  };

  // ── Bootstrap ──────────────────────────────
  document.addEventListener('preloaderDone', function () {
    window.particleSystem = new ParticleSystem();
  });
})();
