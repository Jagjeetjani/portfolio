/* ============================================
   audio.js — Web Audio Manager
   External Background Music (MP3 Track),
   lazy-init AudioContext, synthesized click sounds.
   ============================================ */

(function () {
  'use strict';

  class AudioManager {
    constructor() {
      /** @type {AudioContext|null} */
      this.ctx = null;
      /** @type {GainNode|null} */
      this.masterGain = null;
      /** @type {HTMLAudioElement|null} */
      this.bgmAudio = null;

      this.isPlaying     = false;
      this.isInitialized = false;

      // DOM references
      this.toggleBtn = document.getElementById('audioToggle');
      this.iconEl    = document.getElementById('audioIcon');

      this._bindUI();
    }

    // ——— Lazy AudioContext initialization ———

    async init() {
      if (this.isInitialized) return;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      // Resume if suspended
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      // Master gain -> destination (for clicks only)
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3; // Always unmuted for clicks
      this.masterGain.connect(this.ctx.destination);

      // Initialize HTML5 Audio for BGM (bypasses local CORS)
      this.bgmAudio = new Audio('assets/audio/The_Geometry_of_Rest.mp3');
      this.bgmAudio.loop = true;
      this.bgmAudio.volume = 0;

      this.isInitialized = true;
    }

    // ─── Custom Volume Fader ───
    
    _fadeAudio(targetVolume, durationMs) {
      if (!this.bgmAudio) return;
      const startVolume = this.bgmAudio.volume;
      const startTime = performance.now();
      
      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / durationMs, 1);
        
        // Easing (ease-in-out)
        const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
        
        this.bgmAudio.volume = startVolume + (targetVolume - startVolume) * ease;
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else if (targetVolume === 0) {
          this.bgmAudio.pause();
        }
      };
      requestAnimationFrame(animate);
    }

    // ——— Synthesized click sound ———

    playClick() {
      if (!this.isInitialized || !this.isPlaying) return;

      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

      const clickGain = this.ctx.createGain();
      clickGain.gain.setValueAtTime(0.1, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(clickGain);
      clickGain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.1);
    }

    // â”€â”€â”€ Toggle mute / unmute â”€â”€â”€

    async toggle() {
      if (!this.isInitialized) {
        await this.init();
      }

      this.isPlaying = !this.isPlaying;
      
      if (this.isPlaying) {
        if (this.bgmAudio) {
          this.bgmAudio.play().catch(e => console.log("Audio play prevented:", e));
          this._fadeAudio(0.5, 1000); // Fade in to 50% volume over 1s
        }
      } else {
        if (this.bgmAudio) {
          this._fadeAudio(0, 1000); // Fade out to 0% over 1s
        }
      }

      this._updateUI();

      try {
        localStorage.setItem('audioEnabled', this.isPlaying ? '1' : '0');
      } catch (_) {}
    }

    // â”€â”€â”€ UI wiring â”€â”€â”€

    _bindUI() {
      if (this.toggleBtn) {
        this.toggleBtn.addEventListener('click', () => this.toggle());
      }
      this._loadPreference();
      this._attachClickSounds();
    }

    _loadPreference() {
      try {
        const stored = localStorage.getItem('audioEnabled');
        if (stored === '1') {
          this._pendingAutoEnable = true;
        }
      } catch (_) {}
    }

    _attachClickSounds() {
      document.addEventListener('click', (e) => {
        if (this._pendingAutoEnable && !this.isInitialized) {
          this._pendingAutoEnable = false;
          this.init().then(() => {
            this.isPlaying = true;
            this._updateUI();
            if (this.bgmAudio) {
              this.bgmAudio.play().catch(e => console.log("Audio play prevented:", e));
              this._fadeAudio(0.5, 1000);
            }
            this.playClick();
          });
          return;
        }

        const interactive = e.target.closest('button, a, .bento-card, .skill-card');
        if (interactive) {
          this.playClick();
        }
      }, { passive: true });
    }

    _updateUI() {
      if (this.toggleBtn) {
        this.toggleBtn.classList.toggle('playing', this.isPlaying);
      }
      if (this.iconEl) {
        this.iconEl.textContent = this.isPlaying ? '🔊' : '🔇';
      }
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    window.audioManager = new AudioManager();
  });
})();
