/**
 * DODGE RUSH - Game Engine & Application Script
 * Complete, polished vanilla JS arcade game with API Telemetry & Sound Synthesis
 */

document.addEventListener('DOMContentLoaded', () => {

  // -------------------------------------------------------------------------
  // 1. STATE & UTILITIES
  // -------------------------------------------------------------------------
  
  const LOCAL_STORAGE_KEY = 'dodge_rush_high_score';
  let highScore = parseInt(localStorage.getItem(LOCAL_STORAGE_KEY), 10) || 0;
  let soundEnabled = true;
  let audioCtx = null;

  // Game state flags
  let gameState = 'START'; // 'START' | 'PLAYING' | 'GAMEOVER'
  let animationFrameId = null;
  let lastTime = 0;

  // Score & Gameplay Metrics
  let score = 0;
  let survivalTime = 0; // in seconds
  let dodgedCount = 0;
  let speedMultiplier = 1.0;
  let shieldActive = false;

  // Input states
  const keys = {
    left: false,
    right: false
  };

  // DOM Elements
  const startScreen = document.getElementById('start-screen');
  const gameScreen = document.getElementById('game-screen');
  const gameOverScreen = document.getElementById('game-over-screen');

  const startBtn = document.getElementById('start-btn');
  const restartBtn = document.getElementById('restart-btn');
  const menuBtn = document.getElementById('menu-btn');
  const soundBtn = document.getElementById('sound-btn');
  const soundIcon = document.getElementById('sound-icon');

  const landingHighScoreEl = document.getElementById('landing-high-score');
  const hudScoreEl = document.getElementById('hud-score');
  const hudMultiplierEl = document.getElementById('hud-multiplier');
  const hudTimeEl = document.getElementById('hud-time');
  const hudBestEl = document.getElementById('hud-best');
  const shieldIndicator = document.getElementById('shield-indicator');

  const goFinalScoreEl = document.getElementById('go-final-score');
  const goBestScoreEl = document.getElementById('go-best-score');
  const goSurvivalTimeEl = document.getElementById('go-survival-time');
  const goDodgedCountEl = document.getElementById('go-dodged-count');
  const newHighScoreBanner = document.getElementById('new-high-score-banner');

  const statActiveEl = document.getElementById('stat-active');
  const statGlobalBestEl = document.getElementById('stat-global-best');
  const statTotalEl = document.getElementById('stat-total');

  const btnLeft = document.getElementById('btn-left');
  const btnRight = document.getElementById('btn-right');

  // Initialize UI High Score
  landingHighScoreEl.textContent = highScore.toLocaleString();
  hudBestEl.textContent = highScore.toLocaleString();

  // -------------------------------------------------------------------------
  // 2. WEB AUDIO SYNTHESIZER (No external audio files required)
  // -------------------------------------------------------------------------

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playSound(type) {
    if (!soundEnabled || !audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      const now = audioCtx.currentTime;

      if (type === 'start') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'powerup') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'shield-break') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'hit') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  // -------------------------------------------------------------------------
  // 3. BACKGROUND STARFIELD CANVAS
  // -------------------------------------------------------------------------

  const bgCanvas = document.getElementById('bg-canvas');
  const bgCtx = bgCanvas.getContext('2d');
  let bgStars = [];

  function resizeBgCanvas() {
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
    initBgStars();
  }

  function initBgStars() {
    bgStars = [];
    const count = Math.floor((bgCanvas.width * bgCanvas.height) / 4000);
    for (let i = 0; i < count; i++) {
      bgStars.push({
        x: Math.random() * bgCanvas.width,
        y: Math.random() * bgCanvas.height,
        size: Math.random() * 1.8 + 0.5,
        speed: Math.random() * 0.8 + 0.2,
        alpha: Math.random() * 0.7 + 0.3
      });
    }
  }

  function renderBgStars() {
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    bgCtx.fillStyle = '#ffffff';

    for (let star of bgStars) {
      star.y += star.speed * (gameState === 'PLAYING' ? speedMultiplier * 1.2 : 0.8);
      if (star.y > bgCanvas.height) {
        star.y = 0;
        star.x = Math.random() * bgCanvas.width;
      }
      bgCtx.globalAlpha = star.alpha;
      bgCtx.beginPath();
      bgCtx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      bgCtx.fill();
    }
    bgCtx.globalAlpha = 1.0;
    requestAnimationFrame(renderBgStars);
  }

  window.addEventListener('resize', resizeBgCanvas);
  resizeBgCanvas();
  renderBgStars();

  // -------------------------------------------------------------------------
  // 4. GAME CANVAS ENGINE & OBJECTS
  // -------------------------------------------------------------------------

  const gameCanvas = document.getElementById('game-canvas');
  const ctx = gameCanvas.getContext('2d');

  let width = 0;
  let height = 0;

  function resizeGameCanvas() {
    const parent = document.getElementById('game-viewport');
    width = parent.clientWidth;
    height = parent.clientHeight;
    gameCanvas.width = width;
    gameCanvas.height = height;

    if (player) {
      player.y = height - 50;
      if (player.x > width) player.x = width / 2;
    }
  }

  // Player Object Definition
  class Player {
    constructor() {
      this.width = 36;
      this.height = 42;
      this.x = width / 2;
      this.y = height - 50;
      this.vx = 0;
      this.speed = 8;
      this.friction = 0.85;
      this.trail = [];
    }

    update() {
      if (keys.left) {
        this.vx -= 1.4;
      }
      if (keys.right) {
        this.vx += 1.4;
      }

      // Apply friction and speed limit
      this.vx *= this.friction;
      if (this.vx > this.speed) this.vx = this.speed;
      if (this.vx < -this.speed) this.vx = -this.speed;

      this.x += this.vx;

      // Keep within bounds
      const halfW = this.width / 2;
      if (this.x < halfW) {
        this.x = halfW;
        this.vx = 0;
      }
      if (this.x > width - halfW) {
        this.x = width - halfW;
        this.vx = 0;
      }

      // Add thruster trail particle
      if (Math.random() < 0.7) {
        particles.push(new Particle(
          this.x + (Math.random() * 8 - 4),
          this.y + 15,
          (Math.random() - 0.5) * 1.5,
          Math.random() * 2 + 2,
          Math.random() * 3 + 2,
          '#00f0ff',
          0.4
        ));
      }
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);

      // Shield Effect
      if (shieldActive) {
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(0, 0, 28, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Ship body (Neon Cyberpunk Triangle)
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(0, -this.height / 2); // Nose
      ctx.lineTo(this.width / 2, this.height / 2); // Right wing
      ctx.lineTo(0, this.height / 3); // Engine notch
      ctx.lineTo(-this.width / 2, this.height / 2); // Left wing
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Core Crystal
      ctx.fillStyle = '#ff007f';
      ctx.shadowColor = '#ff007f';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  // Obstacle Object Definition
  class Obstacle {
    constructor() {
      this.size = Math.random() * 24 + 18; // Radius/size
      this.x = Math.random() * (width - this.size * 2) + this.size;
      this.y = -this.size - 10;
      this.speed = (Math.random() * 2.5 + 2.5) * speedMultiplier;
      this.rotation = 0;
      this.rotSpeed = (Math.random() - 0.5) * 0.08;
      
      // Randomize Obstacle Type
      const types = ['meteor', 'hazard', 'laser'];
      this.type = types[Math.floor(Math.random() * types.length)];

      if (this.type === 'meteor') {
        this.color = '#ff3366';
        this.glow = '#ff0055';
      } else if (this.type === 'hazard') {
        this.color = '#ffb700';
        this.glow = '#ff9900';
      } else {
        this.color = '#e040fb';
        this.glow = '#d500f9';
      }
    }

    update() {
      this.y += this.speed;
      this.rotation += this.rotSpeed;
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.shadowColor = this.glow;
      ctx.shadowBlur = 10;
      ctx.fillStyle = this.color;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;

      if (this.type === 'meteor') {
        // Jagged asteroid shape
        ctx.beginPath();
        const numPoints = 6;
        for (let i = 0; i < numPoints; i++) {
          const angle = (i / numPoints) * Math.PI * 2;
          const r = this.size * (0.8 + Math.sin(i * 3) * 0.2);
          const px = Math.cos(angle) * r;
          const py = Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (this.type === 'hazard') {
        // Rotating Diamond Star
        ctx.beginPath();
        ctx.moveTo(0, -this.size);
        ctx.lineTo(this.size * 0.6, 0);
        ctx.lineTo(0, this.size);
        ctx.lineTo(-this.size * 0.6, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        // Fast laser orb
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  // Power-up Object Definition
  class PowerUp {
    constructor() {
      this.type = Math.random() < 0.4 ? 'shield' : 'score';
      this.size = 14;
      this.x = Math.random() * (width - 40) + 20;
      this.y = -30;
      this.speed = Math.random() * 1.5 + 2;
      this.pulse = 0;
    }

    update() {
      this.y += this.speed;
      this.pulse += 0.08;
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);

      const glowColor = this.type === 'shield' ? '#00f0ff' : '#ffb700';
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 12 + Math.sin(this.pulse) * 4;

      ctx.fillStyle = glowColor;
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.fill();

      // Icon overlay
      ctx.fillStyle = '#000';
      ctx.font = '12px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.type === 'shield' ? '🛡️' : '★', 0, 1);

      ctx.restore();
    }
  }

  // Particle Effect Object
  class Particle {
    constructor(x, y, vx, vy, size, color, alphaFade = 0.03) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.size = size;
      this.color = color;
      this.alpha = 1.0;
      this.alphaFade = alphaFade;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.alpha -= this.alphaFade;
    }

    draw() {
      if (this.alpha <= 0) return;
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Active game entity arrays
  let player = null;
  let obstacles = [];
  let powerups = [];
  let particles = [];
  let spawnTimer = 0;
  let powerupTimer = 0;

  function createExplosion(x, y, color, count = 20) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 1;
      particles.push(new Particle(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        Math.random() * 4 + 2,
        color,
        Math.random() * 0.03 + 0.02
      ));
    }
  }

  // Collision detection helper (Circle to Circle / Box approximation)
  function checkCollision(objA, radiusA, objB, radiusB) {
    const dx = objA.x - objB.x;
    const dy = objA.y - objB.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (radiusA + radiusB);
  }

  // -------------------------------------------------------------------------
  // 5. GAME LOOP & STATE MANAGEMENT
  // -------------------------------------------------------------------------

  function startNewGame() {
    initAudio();
    playSound('start');

    // Reset game metrics
    score = 0;
    survivalTime = 0;
    dodgedCount = 0;
    speedMultiplier = 1.0;
    shieldActive = false;

    // Reset game objects
    player = new Player();
    obstacles = [];
    powerups = [];
    particles = [];
    spawnTimer = 0;
    powerupTimer = 0;
    lastTime = performance.now();

    // UI Updates
    shieldIndicator.classList.add('hidden');
    hudScoreEl.textContent = '0';
    hudTimeEl.textContent = '00:00.0';
    hudMultiplierEl.textContent = '1.0x';

    showScreen('game');
    gameState = 'PLAYING';

    // Notify backend of game start
    fetch('/api/game/start', { method: 'POST' }).catch(() => {});

    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(gameLoop);
  }

  function gameOver() {
    gameState = 'GAMEOVER';
    playSound('hit');

    // Create dramatic ship explosion
    createExplosion(player.x, player.y, '#00f0ff', 35);
    createExplosion(player.x, player.y, '#ff007f', 25);

    const finalScore = Math.floor(score);
    const finalSurvivalStr = formatTime(survivalTime);

    // High Score Check
    let isNewHigh = false;
    if (finalScore > highScore) {
      highScore = finalScore;
      localStorage.setItem(LOCAL_STORAGE_KEY, highScore);
      isNewHigh = true;
      landingHighScoreEl.textContent = highScore.toLocaleString();
      hudBestEl.textContent = highScore.toLocaleString();

      fetch('/api/game/highscore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: highScore })
      }).catch(() => {});
    }

    // Populate Game Over screen
    goFinalScoreEl.textContent = finalScore.toLocaleString();
    goBestScoreEl.textContent = highScore.toLocaleString();
    goSurvivalTimeEl.textContent = finalSurvivalStr;
    goDodgedCountEl.textContent = dodgedCount.toLocaleString();

    if (isNewHigh) {
      newHighScoreBanner.classList.remove('hidden');
    } else {
      newHighScoreBanner.classList.add('hidden');
    }

    // Notify backend of game over
    fetch('/api/game/over', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score: finalScore, survivalTime: finalSurvivalStr })
    }).catch(() => {});

    // Delay showing modal slightly so explosion plays out
    setTimeout(() => {
      showScreen('game-over');
      fetchGlobalStats();
    }, 900);
  }

  function gameLoop(now) {
    if (gameState !== 'PLAYING') return;

    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    // 1. Update Survival Metrics & Speed scaling
    survivalTime += dt;
    score += dt * 10 * speedMultiplier;
    speedMultiplier = 1.0 + Math.floor(survivalTime / 8) * 0.15; // Speed increases every 8 seconds

    // HUD Text Updates
    hudScoreEl.textContent = Math.floor(score).toLocaleString();
    hudTimeEl.textContent = formatTime(survivalTime);
    hudMultiplierEl.textContent = `${speedMultiplier.toFixed(1)}x`;

    // 2. Clear & Draw Canvas
    ctx.clearRect(0, 0, width, height);

    // 3. Update Player
    player.update();
    player.draw();

    // 4. Spawn Obstacles
    spawnTimer += dt;
    const currentSpawnInterval = Math.max(0.35, 1.2 / speedMultiplier);
    if (spawnTimer > currentSpawnInterval) {
      spawnTimer = 0;
      obstacles.push(new Obstacle());
    }

    // 5. Spawn Powerups (occasional)
    powerupTimer += dt;
    if (powerupTimer > 12) {
      powerupTimer = 0;
      if (Math.random() < 0.6) {
        powerups.push(new PowerUp());
      }
    }

    // 6. Process Obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.update();
      obs.draw();

      // Check player collision
      if (checkCollision(player, 16, obs, obs.size * 0.75)) {
        if (shieldActive) {
          // Shield absorbs hit
          shieldActive = false;
          shieldIndicator.classList.add('hidden');
          playSound('shield-break');
          createExplosion(obs.x, obs.y, '#00f0ff', 15);
          obstacles.splice(i, 1);
          continue;
        } else {
          // Direct hit -> Game Over
          gameOver();
          return;
        }
      }

      // Check if off screen (Successfully dodged)
      if (obs.y > height + obs.size) {
        dodgedCount++;
        score += 5; // Bonus for successful dodge
        obstacles.splice(i, 1);
      }
    }

    // 7. Process Powerups
    for (let i = powerups.length - 1; i >= 0; i--) {
      const p = powerups[i];
      p.update();
      p.draw();

      // Check player collection
      if (checkCollision(player, 20, p, p.size)) {
        playSound('powerup');
        createExplosion(p.x, p.y, p.type === 'shield' ? '#00f0ff' : '#ffb700', 12);

        if (p.type === 'shield') {
          shieldActive = true;
          shieldIndicator.classList.remove('hidden');
        } else {
          score += 250;
        }
        powerups.splice(i, 1);
        continue;
      }

      // Off screen
      if (p.y > height + 30) {
        powerups.splice(i, 1);
      }
    }

    // 8. Process Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.update();
      pt.draw();
      if (pt.alpha <= 0) {
        particles.splice(i, 1);
      }
    }

    animationFrameId = requestAnimationFrame(gameLoop);
  }

  // -------------------------------------------------------------------------
  // 6. SCREEN ROUTING & UI LISTENERS
  // -------------------------------------------------------------------------

  function showScreen(name) {
    startScreen.classList.remove('active');
    gameScreen.classList.remove('active');
    gameOverScreen.classList.remove('active');

    if (name === 'start') {
      startScreen.classList.add('active');
    } else if (name === 'game') {
      gameScreen.classList.add('active');
      resizeGameCanvas();
    } else if (name === 'game-over') {
      gameOverScreen.classList.add('active');
    }
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    const mm = mins.toString().padStart(2, '0');
    const ss = secs.toString().padStart(2, '0');
    return `${mm}:${ss}.${ms}`;
  }

  // Keyboard Controls
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      keys.left = true;
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      keys.right = true;
    }
    if (e.key === ' ' || e.key === 'Enter') {
      if (gameState === 'START' || gameState === 'GAMEOVER') {
        startNewGame();
      }
    }
    if (e.key === 'm' || e.key === 'M') {
      toggleSound();
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      keys.left = false;
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      keys.right = false;
    }
  });

  // Mobile Touch Pad Buttons
  function bindTouch(element, actionKey) {
    const handleStart = (e) => {
      e.preventDefault();
      initAudio();
      keys[actionKey] = true;
    };
    const handleEnd = (e) => {
      e.preventDefault();
      keys[actionKey] = false;
    };
    element.addEventListener('touchstart', handleStart, { passive: false });
    element.addEventListener('touchend', handleEnd, { passive: false });
    element.addEventListener('mousedown', handleStart);
    element.addEventListener('mouseup', handleEnd);
  }

  bindTouch(btnLeft, 'left');
  bindTouch(btnRight, 'right');

  // Mobile Drag / Direct Touch on Canvas
  gameCanvas.addEventListener('touchmove', (e) => {
    if (gameState !== 'PLAYING' || !player) return;
    const touch = e.touches[0];
    const rect = gameCanvas.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    player.x = Math.max(player.width / 2, Math.min(width - player.width / 2, touchX));
  }, { passive: true });

  // Sound Toggle
  function toggleSound() {
    soundEnabled = !soundEnabled;
    soundIcon.textContent = soundEnabled ? '🔊' : '🔇';
    soundBtn.style.opacity = soundEnabled ? '1' : '0.5';
  }

  soundBtn.addEventListener('click', () => {
    initAudio();
    toggleSound();
  });

  // Button Listeners
  startBtn.addEventListener('click', startNewGame);
  restartBtn.addEventListener('click', startNewGame);
  menuBtn.addEventListener('click', () => showScreen('start'));

  // Window Resize
  window.addEventListener('resize', resizeGameCanvas);

  // -------------------------------------------------------------------------
  // 7. TELEMETRY & GLOBAL STATS POLLING
  // -------------------------------------------------------------------------

  function fetchGlobalStats() {
    fetch('/api/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.stats) {
          statActiveEl.textContent = data.stats.activeGames || 0;
          statGlobalBestEl.textContent = (data.stats.highestScore || 0).toLocaleString();
          statTotalEl.textContent = data.stats.totalGamesStarted || 0;
        }
      })
      .catch(() => {});
  }

  // Poll stats every 10 seconds
  fetchGlobalStats();
  setInterval(fetchGlobalStats, 10000);

});
