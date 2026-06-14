/* ============================================
   PRELOADER
   Animates 0→100 % with accelerating ease,
   fades out, then dispatches 'preloaderDone'.
   ============================================ */
(function () {
  'use strict';

  var DURATION   = 2500;   // ms to go from 0 → 100 %
  var HOLD_DELAY = 300;    // ms to hold at 100 % before fading
  var FADE_TIME  = 800;    // ms for the CSS fade‑out transition

  document.addEventListener('DOMContentLoaded', function () {
    document.body.classList.add('loading');

    var preloader      = document.getElementById('preloader');
    var preloaderFill   = document.getElementById('preloaderFill');
    var preloaderPercent = document.getElementById('preloaderPercent');

    if (!preloader || !preloaderFill || !preloaderPercent) {
      // Elements missing — skip straight to done
      finish();
      return;
    }

    var startTime = null;

    function animateProgress(timestamp) {
      if (!startTime) startTime = timestamp;

      var elapsed  = timestamp - startTime;
      var linear   = Math.min(elapsed / DURATION, 1);

      // Accelerating (ease‑in) curve: starts slow, finishes fast
      var progress = linear * linear;
      var percent  = Math.round(progress * 100);

      preloaderFill.style.width        = percent + '%';
      preloaderPercent.textContent      = percent + '%';

      if (linear < 1) {
        requestAnimationFrame(animateProgress);
      } else {
        // Ensure we show exactly 100 %
        preloaderFill.style.width   = '100%';
        preloaderPercent.textContent = '100%';

        setTimeout(function () {
          // Trigger CSS fade‑out
          preloader.classList.add('loaded');

          setTimeout(function () {
            preloader.remove();
            finish();
          }, FADE_TIME);
        }, HOLD_DELAY);
      }
    }

    requestAnimationFrame(animateProgress);
  });

  function finish() {
    document.body.classList.remove('loading');
    document.dispatchEvent(new CustomEvent('preloaderDone'));
  }
})();
