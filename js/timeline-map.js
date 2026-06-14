/* ============================================
   WINDING MAP TIMELINE
   Generates a dynamic SVG Bezier curve connecting all timeline dots,
   and animates a glowing stroke along the path based on scroll position.
   ============================================ */
(function () {
  'use strict';

  function initTimelineMap() {
    const timeline = document.querySelector('.timeline');
    const bgPath = document.querySelector('.timeline-path-bg');
    const fillPath = document.querySelector('.timeline-path-fill');
    
    if (!timeline || !bgPath || !fillPath) return;

    let pathLength = 0;

    function drawPath() {
      const dots = Array.from(timeline.querySelectorAll('.timeline-dot'));
      if (dots.length === 0) return;

      const timelineRect = timeline.getBoundingClientRect();
      
      let d = '';

      // Start the line at the exact top-center of the timeline wrapper
      const startX = timelineRect.width / 2;
      const startY = 0; 
      
      d += `M ${startX} ${startY} `;

      dots.forEach((dot, index) => {
        const rect = dot.getBoundingClientRect();
        // Calculate the exact center of each dot relative to the timeline wrapper
        const x = (rect.left + rect.width / 2) - timelineRect.left;
        const y = (rect.top + rect.height / 2) - timelineRect.top;

        if (index === 0) {
          // Curve from the top-center start to the first dot
          const cpY = startY + (y - startY) / 2;
          d += `C ${startX} ${cpY}, ${x} ${cpY}, ${x} ${y} `;
        } else {
          // Curve to the next dot
          const prevRect = dots[index - 1].getBoundingClientRect();
          const prevX = (prevRect.left + prevRect.width / 2) - timelineRect.left;
          const prevY = (prevRect.top + prevRect.height / 2) - timelineRect.top;

          // Simple Bezier Curve: Control points halfway vertically
          const cpY = prevY + (y - prevY) / 2;
          d += `C ${prevX} ${cpY}, ${x} ${cpY}, ${x} ${y} `;
        }
      });

      // Continue the line to the exact bottom-center of the timeline wrapper
      const lastDot = dots[dots.length - 1].getBoundingClientRect();
      const lastX = (lastDot.left + lastDot.width / 2) - timelineRect.left;
      const lastY = (lastDot.top + lastDot.height / 2) - timelineRect.top;
      
      const endX = timelineRect.width / 2;
      const endY = timelineRect.height;

      const endCpY = lastY + (endY - lastY) / 2;
      d += `C ${lastX} ${endCpY}, ${endX} ${endCpY}, ${endX} ${endY}`;

      // Apply the generated path data to the SVG paths
      bgPath.setAttribute('d', d);
      fillPath.setAttribute('d', d);

      // Get the exact physical length of the generated curve
      pathLength = fillPath.getTotalLength();
      
      // Set up the CSS stroke-dash properties for the scroll animation
      fillPath.style.strokeDasharray = pathLength;
      fillPath.style.strokeDashoffset = pathLength; // Hide entirely on load

      // Trigger an immediate scroll update to calculate the initial offset
      updateScroll();
    }

    function updateScroll() {
      if (pathLength === 0) return;

      const timelineRect = timeline.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // We trigger the tracing when the top of the timeline is 80% down the screen,
      // and we finish when the bottom of the timeline reaches 50% up the screen.
      const startTrigger = windowHeight * 0.8; 
      
      // Calculate how far we've scrolled past the trigger point
      const scrolledPast = startTrigger - timelineRect.top;
      
      // The total scroll distance for the line to trace from 0 to 100%
      const totalScroll = timelineRect.height + (windowHeight * 0.3);

      let progress = scrolledPast / totalScroll;
      
      // Clamp between 0 and 1
      progress = Math.max(0, Math.min(1, progress));

      // Calculate and apply the dash offset
      const offset = pathLength - (pathLength * progress);
      fillPath.style.strokeDashoffset = offset;
    }

    let drawFrameId = null;
    function requestDrawPath() {
      if (drawFrameId) {
        cancelAnimationFrame(drawFrameId);
      }
      drawFrameId = requestAnimationFrame(drawPath);
    }

    // Initialize the path drawing
    requestDrawPath();

    // Re-calculate the curve math whenever the browser window is resized
    window.addEventListener('resize', requestDrawPath, { passive: true });

    // Re-calculate when the page is fully loaded (images, stylesheets, fonts)
    window.addEventListener('load', requestDrawPath, { passive: true });

    // Re-calculate when fonts are ready
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(requestDrawPath);
    }

    // Re-calculate when preloader is done
    document.addEventListener('preloaderDone', () => {
      setTimeout(requestDrawPath, 50);
    });

    // Re-calculate when preloader is completely cleaned up (scrollbars restored)
    document.addEventListener('preloaderCleanedUp', requestDrawPath);

    // Use ResizeObserver to detect layout/size changes of the timeline container
    if (window.ResizeObserver) {
      const resizeObserver = new ResizeObserver(requestDrawPath);
      resizeObserver.observe(timeline);
    }

    // Use IntersectionObserver to draw the path when the timeline becomes visible
    if (window.IntersectionObserver) {
      const visibilityObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            requestDrawPath();
            visibilityObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.05 });
      visibilityObserver.observe(timeline);
    }

    // Update the glowing stroke offset as the user scrolls
    window.addEventListener('scroll', updateScroll, { passive: true });
  }

  // Initialize once the DOM is ready
  document.addEventListener('DOMContentLoaded', initTimelineMap);
})();
