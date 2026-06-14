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
      this.promptEl = this.overlay ? this.overlay.querySelector('.terminal-prompt') : null;

      // State
      this.history      = [];
      this.historyIndex = -1;
      this.isOpen       = false;

      // Game engine states
      this.activeGame   = null; // 'tictactoe', 'guess', or null
      this.gameState    = null; // stores game board or targets

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

      // Echo the command with the dynamic prompt
      const currentPrompt = this.promptEl ? this.promptEl.textContent : 'jagjeet@portfolio:~$';
      this.printLine(`${currentPrompt} ${trimmed}`, 'command');

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
      const trimmed = cmd.trim();
      const lower = trimmed.toLowerCase();

      // Intercept inputs if a game sub-shell is running
      if (this.activeGame === 'tictactoe') {
        return this._handleTicTacToe(lower);
      }
      if (this.activeGame === 'guess') {
        return this._handleGuess(lower);
      }
      if (this.activeGame === 'dino') {
        return this._handleDino(lower);
      }

      // Special multi-word commands
      if (lower === 'sudo hire me') return this.commands['sudo hire me']();
      if (lower === 'skills cheat' || lower === 'skills max') return this.commands.skillsCheat();
      if (lower.startsWith('echo '))  return this.commands.echo(cmd.slice(5));
      if (lower.startsWith('cat ')) {
        const file = lower.slice(4).trim();
        if (file === 'secret.txt') return this.commands['cat secret.txt']();
        if (file === 'certs.txt') return this.commands['cat certs.txt']();
        return `cat: ${file}: No such file or directory.`;
      }
      if (lower.startsWith('theme ')) {
        return this.commands.theme(cmd.slice(6));
      }

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

    // ── Tic-Tac-Toe Game Logic ──

    _handleTicTacToe(input) {
      if (input === 'exit' || input === 'quit') {
        this.activeGame = null;
        this.gameState = null;
        if (this.promptEl) this.promptEl.textContent = 'jagjeet@portfolio:~$';
        return 'Exited Tic-Tac-Toe. Welcome back to the main shell!';
      }

      const board = this.gameState.board;
      const move = parseInt(input, 10);

      if (isNaN(move) || move < 0 || move > 8) {
        return 'Invalid move. Enter a cell position (0-8) to place X, or type "exit" to quit.';
      }

      if (board[move] !== ' ') {
        return 'That cell is already occupied! Try another cell:\n\n' + this._renderTicTacToeBoard();
      }

      // 1. Player X Turn
      board[move] = 'X';

      // Check win
      if (this._checkTicTacToeWin('X')) {
        const boardStr = this._renderTicTacToeBoard();
        this.activeGame = null;
        this.gameState = null;
        if (this.promptEl) this.promptEl.textContent = 'jagjeet@portfolio:~$';
        return boardStr + '\n\n🎉 <strong>Congratulations! You beat the CPU!</strong> Game Over.';
      }

      // Check draw
      if (board.every(cell => cell !== ' ')) {
        const boardStr = this._renderTicTacToeBoard();
        this.activeGame = null;
        this.gameState = null;
        if (this.promptEl) this.promptEl.textContent = 'jagjeet@portfolio:~$';
        return boardStr + '\n\n🤝 <strong>It\'s a draw!</strong> Game Over.';
      }

      // 2. CPU O Turn
      const cpuMove = this._getCPUTicTacToeMove(board);
      board[cpuMove] = 'O';

      // Check win
      if (this._checkTicTacToeWin('O')) {
        const boardStr = this._renderTicTacToeBoard();
        this.activeGame = null;
        this.gameState = null;
        if (this.promptEl) this.promptEl.textContent = 'jagjeet@portfolio:~$';
        return boardStr + '\n\n💀 <strong>Oh no! The CPU beat you.</strong> Better luck next time!';
      }

      // Check draw
      if (board.every(cell => cell !== ' ')) {
        const boardStr = this._renderTicTacToeBoard();
        this.activeGame = null;
        this.gameState = null;
        if (this.promptEl) this.promptEl.textContent = 'jagjeet@portfolio:~$';
        return boardStr + '\n\n🤝 <strong>It\'s a draw!</strong> Game Over.';
      }

      return `You played position ${move}. CPU plays position ${cpuMove}.\n\n` + this._renderTicTacToeBoard() + '\n\nYour turn! Enter position (0-8):';
    }

    _renderTicTacToeBoard() {
      const b = this.gameState.board;
      return [
        `  ${b[0]} | ${b[1]} | ${b[2]}        Reference Chart:`,
        ` ---+---+---       0 | 1 | 2`,
        `  ${b[3]} | ${b[4]} | ${b[5]}      ---+---+---`,
        ` ---+---+---       3 | 4 | 5`,
        `  ${b[6]} | ${b[7]} | ${b[8]}      ---+---+---`,
        `                   6 | 7 | 8`
      ].join('\n');
    }

    _getCPUTicTacToeMove(board) {
      const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
        [0, 4, 8], [2, 4, 6]             // diagonals
      ];

      // 1. Check if CPU can win in 1 move
      for (let pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (board[a] === 'O' && board[b] === 'O' && board[c] === ' ') return c;
        if (board[a] === 'O' && board[c] === 'O' && board[b] === ' ') return b;
        if (board[b] === 'O' && board[c] === 'O' && board[a] === ' ') return a;
      }

      // 2. Check if player needs to be blocked
      for (let pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (board[a] === 'X' && board[b] === 'X' && board[c] === ' ') return c;
        if (board[a] === 'X' && board[c] === 'X' && board[b] === ' ') return b;
        if (board[b] === 'X' && board[c] === 'X' && board[a] === ' ') return a;
      }

      // 3. Take center if open
      if (board[4] === ' ') return 4;

      // 4. Take random corner
      const corners = [0, 2, 6, 8].filter(idx => board[idx] === ' ');
      if (corners.length > 0) {
        return corners[Math.floor(Math.random() * corners.length)];
      }

      // 5. Take random side
      const sides = [1, 3, 5, 7].filter(idx => board[idx] === ' ');
      if (sides.length > 0) {
        return sides[Math.floor(Math.random() * sides.length)];
      }

      return 0;
    }

    _checkTicTacToeWin(player) {
      const b = this.gameState.board;
      const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
        [0, 4, 8], [2, 4, 6]             // diagonals
      ];
      return winPatterns.some(pattern => {
        return pattern.every(idx => b[idx] === player);
      });
    }

    // ── Guessing Game Logic ──

    _handleGuess(input) {
      if (input === 'exit' || input === 'quit') {
        this.activeGame = null;
        this.gameState = null;
        if (this.promptEl) this.promptEl.textContent = 'jagjeet@portfolio:~$';
        return 'Exited Guessing Game. Welcome back to the main shell!';
      }

      const guessNum = parseInt(input, 10);
      if (isNaN(guessNum) || guessNum < 1 || guessNum > 100) {
        return 'Invalid guess. Enter a number between 1 and 100, or type "exit" to quit.';
      }

      this.gameState.attempts++;
      const target = this.gameState.targetNumber;

      if (guessNum === target) {
        const attempts = this.gameState.attempts;
        this.activeGame = null;
        this.gameState = null;
        if (this.promptEl) this.promptEl.textContent = 'jagjeet@portfolio:~$';
        return `🎉 <strong>Correct!</strong> You guessed the secret number (${target}) in ${attempts} attempts! Game Over.`;
      } else if (guessNum < target) {
        return `Too low! Try again (Guess #${this.gameState.attempts + 1}):`;
      } else {
        return `Too high! Try again (Guess #${this.gameState.attempts + 1}):`;
      }
    }

    // ── Dino Game Logic ──

    _handleDino(input) {
      if (input === 'exit' || input === 'quit') {
        this.activeGame = null;
        this.gameState = null;
        if (this.promptEl) this.promptEl.textContent = 'jagjeet@portfolio:~$';
        return 'Exited Dino Game. Welcome back to the main shell!';
      }

      const state = this.gameState;

      // 1. Process jump command
      if (input === 'jump' || input === 'j' || input === '') {
        if (!state.isJumping) {
          state.isJumping = true;
          state.jumpTicks = 3; // Airtime duration
        }
      }

      // 2. Game tick
      if (state.isJumping) {
        state.dinoY = 1;
        state.jumpTicks--;
        if (state.jumpTicks <= 0) {
          state.isJumping = false;
        }
      } else {
        state.dinoY = 0;
      }

      // Move obstacle
      state.obstacleX -= 2;
      if (state.obstacleX <= 0) {
        state.obstacleX = 18;
        state.score += 10;
        this.printLine('Score +10! 🎉', 'success');
      }

      // Check collision
      // Dino is at position 2. If obstacle is at position 2, and dino is on ground, crash!
      if (state.obstacleX === 2 && state.dinoY === 0) {
        const score = state.score;
        this.activeGame = null;
        this.gameState = null;
        if (this.promptEl) this.promptEl.textContent = 'jagjeet@portfolio:~$';
        return `💥 <strong>CRASH! Game Over.</strong>\nFinal Score: <strong>${score}</strong>\nType "dino" to try again!`;
      }

      // 3. Render game screen
      let row1 = new Array(20).fill('&nbsp;');
      let row2 = new Array(20).fill('━');

      // Draw obstacle (cactus)
      if (state.obstacleX >= 0 && state.obstacleX < 20) {
        row2[state.obstacleX] = '🌵';
      }

      // Draw dino
      if (state.dinoY === 1) {
        row1[2] = '🦖';
      } else {
        row2[2] = '🦖';
      }

      const boardStr = [
        row1.join(''),
        row2.join(''),
        `Score: <strong>${state.score}</strong> | High Score: 100`,
      ].join('\n');

      return boardStr + '\nPress Enter or type "j" to jump:';
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
          '  socials       — Direct links to social profiles',
          '  education     — Academic background',
          '  neofetch      — System info (portfolio style)',
          '  whoami        — Who are you?',
          '  ls            — List portfolio sections',
          '  echo [text]   — Print text to terminal',
          '  tictactoe     — Play Tic-Tac-Toe against CPU 🎮',
          '  guess         — Play a number guessing game 🔢',
          '  joke          — Get a random programmer joke 😆',
          '  matrix        — Enter the Matrix 🟩',
          '  secrets       — Unlock hidden developer secrets 🔓',
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
          'GitHub:   github.com/Jagjeetjani',
          'LinkedIn: linkedin.com/in/jagjeet-singh-a316a0377/',
        ].join('\n'),

        socials: () => [
          '🔗 <strong>My Social Links:</strong>',
          '  GitHub:   github.com/Jagjeetjani',
          '  LinkedIn: linkedin.com/in/jagjeet-singh-a316a0377/',
          '  Instagram: instagram.com/jagjeet_jani',
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

        joke: () => {
          const jokes = [
            "Why do programmers wear glasses? Because they can't C#!",
            "There are 10 kinds of people in this world: Those who understand binary, and those who don't.",
            "How many programmers does it take to change a light bulb? None, that's a hardware problem.",
            "What is a programmer's favorite hangout place? Foo Bar!",
            "['hip', 'hip'] (hip hip array!)",
            "Why did the programmer quit his job? Because he didn't get arrays.",
            "A SQL query goes into a bar, walks up to two tables and asks, 'Can I join you?'",
            "What is an algorithm? A word used by programmers when they don't want to explain what they did."
          ];
          return jokes[Math.floor(Math.random() * jokes.length)];
        },

        tictactoe: () => {
          this.activeGame = 'tictactoe';
          this.gameState = {
            board: [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ']
          };
          if (this.promptEl) this.promptEl.textContent = 'ttt:~$';
          return [
            '🎮 <strong>Tic-Tac-Toe Game Started!</strong>',
            'You are "X" (Player), CPU is "O".',
            'Type position number (0-8) to place a move, or "exit" to quit.',
            '',
            this._renderTicTacToeBoard(),
            '',
            'Your turn! Enter position (0-8):'
          ].join('\n');
        },
        ttt: () => this.commands.tictactoe(),

        guess: () => {
          const target = Math.floor(Math.random() * 100) + 1;
          this.activeGame = 'guess';
          this.gameState = {
            targetNumber: target,
            attempts: 0
          };
          if (this.promptEl) this.promptEl.textContent = 'guess:~$';
          return [
            '🔢 <strong>Number Guessing Game Started!</strong>',
            'I\'m thinking of a number between 1 and 100.',
            'Type your guess below, or type "exit" to quit.',
            '',
            'Enter your first guess:'
          ].join('\n');
        },

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

        secrets: () => [
          '🔓 <strong>Developer Shell Secrets Unlocked!</strong>',
          'Try running these hidden commands:',
          '  theme [name]    — Switch color theme: cyberpunk, matrix, dracula, nord, retro',
          '  cat secret.txt  — View a hidden personal message from Jagjeet',
          '  cat certs.txt   — View AZ-900 & AI-900 verification keys',
          '  skills cheat    — Max out all skill levels with a visual matrix effect',
          '  heist           — Execute a mock mainframe decryption protocol',
          '  dino            — Launch a text-based jump-and-dodge console game 🦖',
          '  rickroll        — Classic internet redirection',
        ].join('\n'),
        secret: () => this.commands.secrets(),

        theme: (args) => {
          if (!args) {
            return [
              'Usage: theme [theme-name]',
              'Available themes: cyberpunk (default), matrix, dracula, nord, retro'
            ].join('\n');
          }

          const validThemes = ['cyberpunk', 'matrix', 'dracula', 'nord', 'retro'];
          const targetTheme = args.trim().toLowerCase();

          if (!validThemes.includes(targetTheme)) {
            return `Theme "${args}" not recognized. Try one of: ${validThemes.join(', ')}`;
          }

          // Remove all theme classes
          validThemes.forEach(t => {
            document.body.classList.remove(`theme-${t}`);
          });

          // Add selected theme class
          if (targetTheme !== 'cyberpunk') {
            document.body.classList.add(`theme-${targetTheme}`);
          }

          // Dispatch themeChanged custom event
          document.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: targetTheme } }));

          // Save preference
          localStorage.setItem('portfolio-theme', targetTheme);

          return `Theme successfully switched to <strong>${targetTheme}</strong>! 🎨`;
        },

        'cat secret.txt': () => [
          '📁 Reading secret.txt...',
          '──────────────────────────────────────────',
          'Hello there, curious developer! 💻',
          'If you\'re reading this, it means you opened the console and started digging.',
          'That\'s exactly how I got started: breaking things, reading sources, and',
          'wondering what happens if I type certain commands.',
          '',
          'My goal is to build software that makes a difference—whether it\'s a college',
          'utility portal like CampusConnect or a full-stack marketplace like Vendr.',
          'If you\'re a recruiter or developer who appreciates attention to detail, let\'s chat!',
          'Drop me an email at: jagjeetsinghjani3@gmail.com',
          '──────────────────────────────────────────',
        ].join('\n'),

        'cat certs.txt': () => [
          '📁 Reading certs.txt...',
          '──────────────────────────────────────────',
          '🎓 <strong>Microsoft Credentials:</strong>',
          '',
          '1. <strong>Microsoft Certified: Azure Fundamentals (AZ-900)</strong>',
          '   Credential ID: 996536-12497F (Verified)',
          '   Score: 880/1000 | Date: May 2025',
          '',
          '2. <strong>Microsoft Certified: Azure AI Fundamentals (AI-900)</strong>',
          '   Credential ID: 997812-78A1D3 (Verified)',
          '   Score: 920/1000 | Date: June 2025',
          '──────────────────────────────────────────',
        ].join('\n'),

        skillsCheat: () => {
          this.printLine('⚠️ INITIATING SKILLS CHEAT CODE...', 'info');
          
          // Animate the DOM skill bars
          const fillBars = document.querySelectorAll('.skill-fill');
          const percentEls = document.querySelectorAll('.skill-percent');
          
          fillBars.forEach(bar => {
            bar.style.width = '100%';
            bar.style.setProperty('--level', '100%');
          });
          
          percentEls.forEach(el => {
            let val = parseInt(el.textContent) || 0;
            if (val >= 100) return;
            const interval = setInterval(() => {
              val += 4;
              if (val >= 100) {
                val = 100;
                clearInterval(interval);
              }
              el.textContent = `${val}%`;
            }, 25);
          });

          return [
            '🟩 <strong>CHEATS ENABLED: SYSTEM OVERDRIVE!</strong>',
            '',
            'C / C++       ████████████████████ 100%',
            'Dart/Flutter  ████████████████████ 100%',
            'HTML / CSS    ████████████████████ 100%',
            'JavaScript    ████████████████████ 100%',
            'Firebase      ████████████████████ 100%',
            'Git / GitHub  ████████████████████ 100%',
            'Problem Solv. ████████████████████ 100%',
            'DSA           ████████████████████ 100%',
            '',
            'All core competencies maxed out. Ready to conquer production.'
          ].join('\n');
        },

        heist: () => {
          this.printLine('⚡ Initializing Mainframe Decryption Protocol...', 'info');
          let pct = 0;
          
          const interval = setInterval(() => {
            pct += Math.floor(Math.random() * 8) + 4;
            if (pct >= 100) {
              pct = 100;
              clearInterval(interval);
              this.printLine('🔓 Decryption complete. Access granted to root core.', 'success');
              this.printLine('Welcome, Administrator. Have a nice day! ☕', 'success');
            } else {
              const files = ['/bin/system_override', '/lib/security_bypass', '/etc/shadow_decode', '/srv/payload_inject'];
              const currentFile = files[Math.floor(Math.random() * files.length)];
              this.printLine(`[${pct}%] Decrypting ${currentFile}...`, 'info');
            }
          }, 150);

          return 'Protocol running in background...';
        },

        dino: () => {
          this.activeGame = 'dino';
          this.gameState = {
            score: 0,
            dinoY: 0,
            obstacleX: 18,
            isJumping: false,
            jumpTicks: 0
          };
          if (this.promptEl) this.promptEl.textContent = 'dino:~$';
          return [
            '🦖 <strong>Chrome Dino Game (Terminal Edition)</strong>',
            'Type "jump", "j", or simply press [Enter] to dodge the cacti.',
            'Type "exit" to quit.',
            '',
            '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
            '━━🦖━━━━━━━━━━━━🌵━',
            'Score: 0',
            '',
            'Press Enter to start!'
          ].join('\n');
        },

        rickroll: () => {
          window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank');
          return 'Never gonna give you up! 🎶 (Opened in a new tab)';
        },
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

    // Restore saved theme
    const savedTheme = localStorage.getItem('portfolio-theme');
    const validThemes = ['cyberpunk', 'matrix', 'dracula', 'nord', 'retro'];
    if (savedTheme && validThemes.includes(savedTheme) && savedTheme !== 'cyberpunk') {
      document.body.classList.add(`theme-${savedTheme}`);
      setTimeout(() => {
        document.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: savedTheme } }));
      }, 100);
    }
  });
})();
