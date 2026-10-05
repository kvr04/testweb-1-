const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static assets from public folder
app.use(express.static(path.join(__dirname, 'public')));

// In-Memory Application Statistics
const startTime = Date.now();
const stats = {
  totalGamesStarted: 0,
  totalGamesCompleted: 0,
  activeGames: 0,
  highestScore: 0,
};

// Logger Helper
function log(level, message, metadata = {}) {
  const timestamp = new Date().toISOString();
  const metaString = Object.keys(metadata).length ? ` ${JSON.stringify(metadata)}` : '';
  console.log(`[${timestamp}] [${level.toUpperCase()}] [DODGE-RUSH] ${message}${metaString}`);
}

// ---------------------- API ENDPOINTS ----------------------

// GET /health - Required health endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'dodge-rush'
  });
});

// GET /api/stats - Required application statistics
app.get('/api/stats', (req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  res.status(200).json({
    status: 'success',
    stats: {
      totalGamesStarted: stats.totalGamesStarted,
      totalGamesCompleted: stats.totalGamesCompleted,
      activeGames: Math.max(0, stats.activeGames),
      highestScore: stats.highestScore,
      uptimeSeconds
    }
  });
});

// POST /api/game/start - Track game started event
app.post('/api/game/start', (req, res) => {
  stats.totalGamesStarted += 1;
  stats.activeGames += 1;
  log('INFO', 'Game started', {
    totalStarted: stats.totalGamesStarted,
    activeGames: stats.activeGames
  });
  res.status(200).json({ success: true, activeGames: stats.activeGames });
});

// POST /api/game/over - Track game over event
app.post('/api/game/over', (req, res) => {
  const { score, survivalTime } = req.body || {};
  const numScore = Number(score) || 0;
  
  if (stats.activeGames > 0) {
    stats.activeGames -= 1;
  }
  stats.totalGamesCompleted += 1;

  if (numScore > stats.highestScore) {
    stats.highestScore = numScore;
    log('INFO', 'High score updated', { newHighScore: numScore });
  }

  log('INFO', 'Game over', {
    score: numScore,
    survivalTime: survivalTime || '0s',
    totalCompleted: stats.totalGamesCompleted
  });

  res.status(200).json({
    success: true,
    highestScore: stats.highestScore
  });
});

// POST /api/game/highscore - Track high score updates
app.post('/api/game/highscore', (req, res) => {
  const { score } = req.body || {};
  const numScore = Number(score) || 0;

  if (numScore > stats.highestScore) {
    stats.highestScore = numScore;
    log('INFO', 'High score updated', { newHighScore: numScore });
  }

  res.status(200).json({ success: true, highestScore: stats.highestScore });
});

// Catch-all for unknown /api requests to log invalid API requests
app.all('/api/*', (req, res) => {
  log('WARN', 'Invalid API request', {
    method: req.method,
    path: req.originalUrl,
    ip: req.ip
  });
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Fallback to index.html for single-page app behavior if needed
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  log('ERROR', 'Unexpected application error', {
    error: err.message,
    stack: err.stack,
    path: req.originalUrl
  });
  res.status(500).json({
    error: 'Internal Server Error'
  });
});

// Start Server
app.listen(PORT, () => {
  log('INFO', 'Application started', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
});
