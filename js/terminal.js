/* ============================================
   terminal.js — Interactive Terminal Easter Egg
   Toggle: Ctrl + `  |  Close: Escape / exit / close button
   ============================================ */

(function () {
  'use strict';

  class Terminal {
    constructor() {
      // DOM references
      this.overlay = document.getElementById('terminalOverlay');
      this.input   = document.getElementById('terminalInput');
      this.output  = document.getElementById('terminalOutput');
      this.closeBtn = document.getElementById('terminalClose');
      this.body    = document.getElementById('terminalBody');

      // State
      this.history      = [];
      this.historyIndex = -1;
      this.isOpen       = false;

      // Bind methods so we can add / remove listeners cleanly
      this._onKeyDown  = this._handleGlobalKeyDown.bind(this);
      this._onInputKey = this._handleInputKeyDown.bind(this);
      this._onClose    = this.close.bind(this);

      this._initListeners();
    }

    // ── Listener setup ──

    _initListeners() {
      // Global toggle shortcut (Ctrl + `)
      document.addEventListener('keydown', this._onKeyDown);

      // Input handling
      if (this.input) {
        this.input.addEventListener('keydown', this._onInputKey);
      }

      // Close button
      if (this.closeBtn) {
        this.closeBtn.addEventListener('click', this._onClose);
      }
    }

    // ── Open / Close ──

    open() {
      if (!this.overlay) return;
      this.isOpen = true;
      this.overlay.classList.add('active');
      this.overlay.setAttribute('aria-hidden', 'false');

      // Print welcome message on first open (or if output is empty)
      if (this.output && !this.output.hasChildNodes()) {
        this.printLine('Welcome to Jagjeet\'s Terminal! Type "help" for commands.', 'info');
      }

      // Focus the input
      requestAnimationFrame(() => this.input && this.input.focus());
    }

    close() {
      if (!this.overlay) return;
      this.isOpen = false;
      this.overlay.classList.remove('active');
      this.overlay.setAttribute('aria-hidden', 'true');
    }

    toggle() {
      this.isOpen ? this.close() : this.open();
    }

    // ── Keyboard handlers ──

    _handleGlobalKeyDown(e) {
      // Ctrl + ` → toggle
      if (e.ctrlKey && e.key === '`') {
        e.preventDefault();
        this.toggle();
        return;
      }

      // Escape → close
      if (e.key === 'Escape' && this.isOpen) {
        e.preventDefault();
        this.close();
      }
    }

    _handleInputKeyDown(e) {
      if (!this.isOpen) return;

      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          this._executeCommand(this.input.value);
          break;

        case 'ArrowUp':
          e.preventDefault();
          this._navigateHistory(-1);
          break;

        case 'ArrowDown':
          e.preventDefault();
          this._navigateHistory(1);
          break;
      }
    }

    // ── History navigation ──

    _navigateHistory(direction) {
      if (!this.history.length) return;

      this.historyIndex += direction;

      // Clamp
      if (this.historyIndex < 0) this.historyIndex = 0;
      if (this.historyIndex >= this.history.length) {
        this.historyIndex = this.history.length;
        this.input.value = '';
        return;
      }

      this.input.value = this.history[this.historyIndex];
    }

    // ── Command execution ──

    _executeCommand(raw) {
      const trimmed = raw.trim();

      // Echo the command with prompt
      this.printLine(`jagjeet@portfolio:~$ ${trimmed}`, 'command');

      if (trimmed) {
        // Add to history
        this.history.push(trimmed);
        this.historyIndex = this.history.length;

        // Parse and run
        const result = this._parseAndRun(trimmed);
        if (result) this.printLine(result, 'output');
      }

      // Reset input
      this.input.value = '';
      this._scrollToBottom();
    }

    _parseAndRun(cmd) {
      const lower = cmd.toLowerCase();

      // Special multi-word commands
      if (lower === 'sudo hire me') return this.commands['sudo hire me']();
      if (lower.startsWith('echo '))  return this.commands.echo(cmd.slice(5));

      // Single-word lookup
      const handler = this.commands[lower];
      if (handler) return handler();

      return `Command not found: ${cmd}. Type "help" for available commands.`;
    }

    // ── Output helpers ──

    printLine(text, type = 'output') {
      if (!this.output) return;

      const div = document.createElement('div');
      div.classList.add('terminal-line');
      if (type) div.classList.add(`terminal-line--${type}`);

      // Support multi-line strings
      div.innerHTML = text.replace(/\n/g, '<br>');
      this.output.appendChild(div);

      this._scrollToBottom();
    }

    _scrollToBottom() {
      if (this.output) {
        this.output.scrollTop = this.output.scrollHeight;
      }
    }

    // ── Commands ──

    get commands() {
      return {
        help: () => [
          '<strong>Available Commands:</strong>',
          '  help          — Show this help message',
          '  about         — Learn about Jagjeet',
          '  skills        — View skill bars',
          '  projects      — List featured projects',
          '  contact       — Contact information',
          '  education     — Academic background',
          '  neofetch      — System info (portfolio style)',
          '  whoami        — Who are you?',
          '  ls            — List portfolio sections',
          '  echo [text]   — Print text to terminal',
          '  matrix        — Enter the Matrix 🟩',
          '  clear         — Clear terminal output',
          '  exit          — Close terminal',
          '  sudo hire me  — You know what to do 😉',
        ].join('\n'),

        about: () => [
          'Hey! I\'m <strong>Jagjeet Singh</strong> — a first-year Computer Science',
          'student at Chandigarh University who ships fast and learns faster.',
          '',
          'In one year I went from "Hello World" to architecting a full-stack',
          'service marketplace with Flutter, Firebase & Cloud Functions.',
          '',
          'I live for solving complex problems, contributing to open-source,',
          'and exploring every technology that crosses my path.',
        ].join('\n'),

        skills: () => {
          const bars = [
            { name: 'C / C++      ', pct: 70 },
            { name: 'Dart/Flutter  ', pct: 80 },
            { name: 'HTML / CSS   ', pct: 75 },
            { name: 'JavaScript   ', pct: 60 },
            { name: 'Firebase     ', pct: 75 },
            { name: 'Git / GitHub ', pct: 65 },
            { name: 'Problem Solv.', pct: 85 },
            { name: 'DSA          ', pct: 75 },
          ];

          return bars
            .map((s) => {
              const filled = Math.round(s.pct / 5);
              const empty  = 20 - filled;
              return `${s.name} ${'█'.repeat(filled)}${'░'.repeat(empty)} ${s.pct}%`;
            })
            .join('\n');
        },

        projects: () => [
          '<strong>Featured Projects:</strong>',
          '',
          '1. <strong>Vendr</strong> — Full-stack service marketplace',
          '   Flutter · Firebase · Riverpod · Cloud Functions · Razorpay',
          '',
          '2. <strong>CampusConnect</strong> — College utility website',
          '   HTML · CSS · JavaScript',
          '',
          '3. <strong>NexusEngine</strong> — Terminal-based game engine',
          '   C++ · STL · Algorithms',
          '',
          '4. <strong>ESP32 RoboCar</strong> — IoT robotic car',
          '   C/C++ · ESP32 · WebSocket · IoT',
        ].join('\n'),

        contact: () => [
          'Email:    jagjeetsinghjani3@gmail.com',
          'GitHub:   github.com/jagjeetsingh',
          'LinkedIn: linkedin.com/in/jagjeetsingh',
        ].join('\n'),

        education: () => [
          'B.E. Computer Science & Engineering',
          'Chandigarh University | 2025 – 2029',
          'Status: First Year Completed ✅',
        ].join('\n'),

        clear: () => {
          if (this.output) this.output.innerHTML = '';
          return '';
        },

        exit: () => {
          this.close();
          return '';
        },

        whoami: () => 'visitor — welcome to my portfolio! 🎉',

        ls: () => 'about/  skills/  projects/  timeline/  education/  contact/',

        'sudo hire me': () =>
          '🎉 Excellent taste! Let\'s talk → jagjeetsinghjani3@gmail.com',

        neofetch: () => {
          const art = [
            '       ╔═══╗       ',
            '       ║ J ║       ',
            '       ║ S ║       ',
            '       ╚═══╝       ',
            '      ╱     ╲      ',
            '     ╱ ▓▓▓▓▓ ╲     ',
            '    ╱ ▓▓▓▓▓▓▓ ╲    ',
            '   ╱───────────╲   ',
          ];

          const info = [
            '<strong>jagjeet</strong>@portfolio',
            '──────────────────',
            `<strong>Name:</strong>       Jagjeet Singh`,
            `<strong>Role:</strong>       CSE Student & Developer`,
            `<strong>University:</strong>  Chandigarh University`,
            `<strong>Languages:</strong>   C/C++, Dart, JS, HTML/CSS`,
            `<strong>Frameworks:</strong>  Flutter, Firebase, Node.js`,
            `<strong>Tools:</strong>       Git, VS Code, Android Studio`,
            `<strong>Projects:</strong>    4+`,
            `<strong>Status:</strong>      Always building 🚀`,
          ];

          // Combine art + info side by side
          const maxArtWidth = 20;
          const lines = [];
          const total = Math.max(art.length, info.length);
          for (let i = 0; i < total; i++) {
            const a = (art[i] || '').padEnd(maxArtWidth);
            const b = info[i] || '';
            lines.push(`${a}  ${b}`);
          }

          return lines.join('\n');
        },

        matrix: () => {
          this._triggerMatrix();
          return 'Entering the Matrix... 🟩';
        },

        echo: (args) => args || '',
      };
    }

    // ── Matrix Rain Effect ──

    _triggerMatrix() {
      if (!this.body) return;

      const canvas = document.createElement('canvas');
      canvas.classList.add('matrix-canvas');
      canvas.style.cssText =
        'position:absolute;top:0;left:0;width:100%;height:100%;z-index:10;pointer-events:none;';
      this.body.style.position = 'relative';
      this.body.appendChild(canvas);

      const ctx = canvas.getContext('2d');
      canvas.width  = this.body.offsetWidth;
      canvas.height = this.body.offsetHeight;

      const fontSize = 14;
      const columns  = Math.floor(canvas.width / fontSize);
      const drops    = new Array(columns).fill(1);
      const chars    = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ';

      let frameId;

      function draw() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#0f0';
        ctx.font = `${fontSize}px JetBrains Mono, monospace`;

        for (let i = 0; i < drops.length; i++) {
          const char = chars[Math.floor(Math.random() * chars.length)];
          ctx.fillText(char, i * fontSize, drops[i] * fontSize);

          if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
          }
          drops[i]++;
        }

        frameId = requestAnimationFrame(draw);
      }

      frameId = requestAnimationFrame(draw);

      // Auto-remove after 5 seconds
      setTimeout(() => {
        cancelAnimationFrame(frameId);
        canvas.remove();
      }, 5000);
    }
  }

  // ── Initialize on DOMContentLoaded ──
  // Keyboard listener is always active so the user can summon the terminal at any time.

  document.addEventListener('DOMContentLoaded', () => {
    window.terminal = new Terminal();
  });
})();
