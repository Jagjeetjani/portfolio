/* ============================================
   PRELOADER
   Animates loading progress dynamically.
   Calculates a hybrid progress combining a smooth visual curve 
   and actual asset loading indicators (fonts + images).
   ============================================ */
(function () {
  'use strict';

  var HOLD_DELAY = 300;    // ms to hold at 100% before fading
  var FADE_TIME  = 800;    // ms for the CSS fade-out transition
  var TIMEOUT    = 5000;   // max time to wait for assets (fallback)

  document.addEventListener('DOMContentLoaded', function () {
    document.body.classList.add('loading');

    var preloader      = document.getElementById('preloader');
    var preloaderFill   = document.getElementById('preloaderFill');
    var preloaderPercent = document.getElementById('preloaderPercent');

    if (!preloader || !preloaderFill || !preloaderPercent) {
      finish();
      return;
    }

    var assetsLoaded = false;
    var currentPercent = 0;
    var targetPercent = 0;

    // Track critical assets (images + fonts)
    var criticalImages = Array.from(document.querySelectorAll('img')).slice(0, 5); // check first few images (hero, photo)
    var totalAssets = criticalImages.length + 1; // +1 for fonts
    var loadedAssets = 0;

    function assetLoaded() {
      loadedAssets++;
      if (loadedAssets >= totalAssets) {
        assetsLoaded = true;
      }
    }

    // 1. Fonts readiness
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(assetLoaded).catch(assetLoaded);
    } else {
      assetLoaded(); // fallback
    }

    // 2. Critical images readiness
    if (criticalImages.length === 0) {
      assetsLoaded = true; // no images to wait for
    } else {
      criticalImages.forEach(function (img) {
        if (img.complete) {
          assetLoaded();
        } else {
          img.addEventListener('load', assetLoaded);
          img.addEventListener('error', assetLoaded); // count error as loaded so we don't block
        }
      });
    }

    // 3. Fallback timeout to ensure we don't get stuck
    setTimeout(function () {
      assetsLoaded = true;
    }, TIMEOUT);

    // 4. Also listen to window load as a double-check
    window.addEventListener('load', function () {
      assetsLoaded = true;
    });

    var startTimestamp = null;
    var maxFakePercent = 90; // hold at 90% until assets are ready

    function tick(timestamp) {
      if (!startTimestamp) startTimestamp = timestamp;
      var elapsed = timestamp - startTimestamp;

      // Calculate the target percent
      // We want to reach 90% smoothly over 1.8 seconds.
      // Once assets are loaded, we jump the target to 100% and accelerate the progress.
      var baseTarget = Math.min((elapsed / 1800) * maxFakePercent, maxFakePercent);
      
      if (assetsLoaded) {
        targetPercent = 100;
      } else {
        targetPercent = baseTarget;
      }

      // Eased progress increment
      if (currentPercent < targetPercent) {
        // Increment faster if assets are loaded to 100%
        var step = assetsLoaded ? 4 : 1;
        currentPercent = Math.min(currentPercent + step, targetPercent);
      }

      var roundedPercent = Math.round(currentPercent);
      preloaderFill.style.width = roundedPercent + '%';
      preloaderPercent.textContent = roundedPercent + '%';

      if (roundedPercent < 100) {
        requestAnimationFrame(tick);
      } else {
        // Complete! Dispatch event immediately so other scripts start initializing while preloader is still visible
        document.dispatchEvent(new CustomEvent('preloaderDone'));

        setTimeout(function () {
          preloader.classList.add('loaded');
          setTimeout(function () {
            preloader.remove();
            document.body.classList.remove('loading');
          }, FADE_TIME);
        }, HOLD_DELAY);
      }
    }

    requestAnimationFrame(tick);
  });
})();
