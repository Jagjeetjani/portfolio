/* ============================================
   skills-chart.js — SVG Radar Chart
   Draws an animated radar/spider chart inside #radarChart
   ============================================ */

(function () {
  'use strict';

  // ── Skills data ──
  const SKILLS = [
    { name: 'HTML/CSS',        value: 75 },
    { name: 'C/C++',           value: 70 },
    { name: 'Flutter',         value: 80 },
    { name: 'Firebase',        value: 75 },
    { name: 'Problem Solving', value: 85 },
    { name: 'Git',             value: 65 },
    { name: 'DSA',             value: 75 },
    { name: 'Node.js/TS',      value: 55 },
  ];

  // ── Chart constants ──
  const SIZE       = 400;
  const CX         = SIZE / 2;   // 200
  const CY         = SIZE / 2;   // 200
  const MAX_RADIUS = 160;
  const RINGS      = 4;          // 25%, 50%, 75%, 100%
  const AXES       = SKILLS.length;
  const ANGLE_STEP = (2 * Math.PI) / AXES;

  // SVG namespace
  const NS = 'http://www.w3.org/2000/svg';

  /**
   * Returns the (x, y) position on the chart for a given axis index and radius fraction (0–1).
   * Rotated -90° so the first axis points straight up.
   */
  function pointOnAxis(index, fraction) {
    const angle = ANGLE_STEP * index - Math.PI / 2;
    return {
      x: CX + Math.cos(angle) * MAX_RADIUS * fraction,
      y: CY + Math.sin(angle) * MAX_RADIUS * fraction,
    };
  }

  /**
   * Builds a polygon points string for a given array of { x, y } coords.
   */
  function toPointsStr(points) {
    return points.map((p) => `${p.x},${p.y}`).join(' ');
  }

  /**
   * Creates and returns an SVG element with optional attributes.
   */
  function svgEl(tag, attrs = {}) {
    const el = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  }

  // ── Main chart builder ──

  /**
   * Generates the full radar chart SVG and appends it to the container.
   * @param {string} containerId — the ID of the wrapper element (#radarChart)
   */
  function createRadarChart(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Prevent duplicate renders
    if (container.querySelector('svg')) return;

    const svg = svgEl('svg', {
      viewBox: `0 0 ${SIZE} ${SIZE}`,
      width: '100%',
      height: '100%',
      class: 'radar-svg',
    });

    // ── SVG Defs: glow filter ──
    const defs = svgEl('defs');

    const filter = svgEl('filter', { id: 'glow', x: '-50%', y: '-50%', width: '200%', height: '200%' });
    const blur   = svgEl('feGaussianBlur', { stdDeviation: '3', result: 'coloredBlur' });
    const merge  = svgEl('feMerge');
    const mNode1 = svgEl('feMergeNode', { in: 'coloredBlur' });
    const mNode2 = svgEl('feMergeNode', { in: 'SourceGraphic' });
    merge.appendChild(mNode1);
    merge.appendChild(mNode2);
    filter.appendChild(blur);
    filter.appendChild(merge);
    defs.appendChild(filter);

    // Inline CSS for the draw-in / scale animation
    const style = svgEl('style');
    style.textContent = `
      .radar-data {
        transform-origin: ${CX}px ${CY}px;
        animation: radarReveal 1s cubic-bezier(.22,1,.36,1) forwards;
        opacity: 0;
      }
      @keyframes radarReveal {
        0%   { transform: scale(0); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
      }
      .radar-dot {
        transform-origin: center;
        animation: dotPop .4s cubic-bezier(.22,1,.36,1) forwards;
        opacity: 0;
      }
      @keyframes dotPop {
        0%   { transform: scale(0); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
      }
    `;
    defs.appendChild(style);
    svg.appendChild(defs);

    // ── Grid group ──
    const gridGroup = svgEl('g', { class: 'radar-grid' });

    // 4 concentric ring polygons (25 %, 50 %, 75 %, 100 %)
    for (let r = 1; r <= RINGS; r++) {
      const fraction = r / RINGS;
      const pts = [];
      for (let i = 0; i < AXES; i++) pts.push(pointOnAxis(i, fraction));

      gridGroup.appendChild(
        svgEl('polygon', {
          points: toPointsStr(pts),
          fill: 'none',
          stroke: 'rgba(255,255,255,0.08)',
          'stroke-width': '1',
        })
      );
    }

    // 8 axis lines from centre to outer ring
    for (let i = 0; i < AXES; i++) {
      const outer = pointOnAxis(i, 1);
      gridGroup.appendChild(
        svgEl('line', {
          x1: CX,
          y1: CY,
          x2: outer.x,
          y2: outer.y,
          stroke: 'rgba(255,255,255,0.05)',
          'stroke-width': '1',
        })
      );
    }

    svg.appendChild(gridGroup);

    // ── Labels ──
    const labelGroup = svgEl('g', { class: 'radar-labels' });
    const LABEL_PAD = 18; // extra px beyond the outer ring

    for (let i = 0; i < AXES; i++) {
      const angle = ANGLE_STEP * i - Math.PI / 2;
      const lx = CX + Math.cos(angle) * (MAX_RADIUS + LABEL_PAD);
      const ly = CY + Math.sin(angle) * (MAX_RADIUS + LABEL_PAD);

      // Determine text-anchor based on horizontal position
      let anchor = 'middle';
      if (Math.cos(angle) < -0.1) anchor = 'end';
      else if (Math.cos(angle) > 0.1) anchor = 'start';

      // Slight vertical adjustment
      let dy = '0.35em';
      if (Math.sin(angle) < -0.5) dy = '0em';
      else if (Math.sin(angle) > 0.5) dy = '0.8em';

      const label = svgEl('text', {
        x: lx,
        y: ly,
        fill: '#94a3b8',
        'font-size': '11',
        'font-family': 'Inter, sans-serif',
        'text-anchor': anchor,
        'dominant-baseline': 'central',
        dy: dy,
      });
      label.textContent = SKILLS[i].name;
      labelGroup.appendChild(label);
    }

    svg.appendChild(labelGroup);

    // ── Data polygon ──
    const dataPoints = SKILLS.map((s, i) => pointOnAxis(i, s.value / 100));

    const dataPoly = svgEl('polygon', {
      points: toPointsStr(dataPoints),
      fill: 'var(--radar-fill, rgba(124,58,237,0.15))',
      stroke: 'var(--accent-violet)',
      'stroke-width': '2',
      'stroke-linejoin': 'round',
      class: 'radar-data',
    });

    svg.appendChild(dataPoly);

    // ── Data dots ──
    const dotsGroup = svgEl('g', { class: 'radar-dots' });

    dataPoints.forEach((p, i) => {
      const dot = svgEl('circle', {
        cx: p.x,
        cy: p.y,
        r: '5',
        fill: 'var(--accent-violet)',
        filter: 'url(#glow)',
        class: 'radar-dot',
        style: `animation-delay: ${1 + i * 0.08}s`,
      });
      dotsGroup.appendChild(dot);
    });

    svg.appendChild(dotsGroup);

    // ── Append to DOM ──
    container.appendChild(svg);
  }

  // Make the builder available globally for other scripts if needed
  window.createRadarChart = createRadarChart;

  // ── Initialization — triggered after preloader, observed on scroll ──

  document.addEventListener('preloaderDone', () => {
    const skillsSection = document.getElementById('skills');
    if (!skillsSection) {
      // Fallback: render immediately
      createRadarChart('radarChart');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          createRadarChart('radarChart');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(skillsSection);
  });
})();
