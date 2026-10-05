# ⚡ Dodge Rush - Browser Arcade Game

**Dodge Rush** is a complete, polished, lightweight web arcade game designed as a production-ready application for testing and demonstrating **DevSight AI** — an AI-powered cloud-agnostic DevOps monitoring and intelligent incident management platform.

How long can you survive the cosmic hazard stream? Dodge falling asteroids and plasma bolts, grab shields, and compete for the highest score!

---

## 🚀 Features

- **Classic Arcade Gameplay**: Fast-paced survival game with smooth 60 FPS Canvas rendering.
- **Controls**: Full support for Keyboard (`←` `→` / `A` `D` / `Space` / `M`) and Mobile Touch controls (On-screen pads and direct touch dragging).
- **Dynamic Difficulty**: Hazard fall speed and spawn frequency scale dynamically as survival time increases.
- **Power-Ups**: Collect glowing Shields to absorb hit damage or Bonus Orbs for extra points.
- **Web Audio API**: Built-in sound effect synthesis without relying on external audio files.
- **High Scores & LocalStorage**: Automatic local score persistence.
- **DevOps Observability Ready**: Built with structured application logging and lightweight in-memory statistics & health endpoints for easy agent integration.
- **Zero-Dependency Frontend**: Pure Vanilla JavaScript, HTML5 Canvas, and modern CSS3.
- **Render Ready**: Optimized for 1-click deployment on Render, Railway, Heroku, or Docker containers.

---

## 🛠️ Technologies Used

- **Backend**: Node.js, Express.js, CORS
- **Frontend**: HTML5, CSS3 (Glassmorphism + CSS Animations), Vanilla JavaScript (HTML5 Canvas API, Web Audio API)
- **Deployment & Containerization**: Docker, Render Web Services

---

## 💻 Local Installation & How to Run

### Prerequisites

- Node.js (v18.x or v20.x recommended)
- npm (v9.x or higher)

### Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/dodge-rush.git
   cd dodge-rush
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the application**:
   ```bash
   npm start
   ```

4. **Access the game in your browser**:
   Open [http://localhost:3000](http://localhost:3000)

---

## ☁️ How to Deploy to Render

1. Push this codebase to a GitHub or GitLab repository.
2. Sign in to [Render](https://render.com) and click **New +** -> **Web Service**.
3. Connect your repository.
4. Fill in the service configuration:
   - **Name**: `dodge-rush`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Port**: Render automatically sets the `PORT` environment variable.
5. Click **Create Web Service**. Render will automatically build and deploy your application.

---

## 📊 Health & Statistics Endpoints (DevSight Integration)

The application exposes standard endpoints for health checking and telemetry collection by monitoring agents such as **DevSight AI**:

### Health Check

```http
GET /health
```

**Response (`200 OK`)**:
```json
{
  "status": "healthy",
  "service": "dodge-rush"
}
```

### Application Statistics

```http
GET /api/stats
```

**Response (`200 OK`)**:
```json
{
  "status": "success",
  "stats": {
    "totalGamesStarted": 15,
    "totalGamesCompleted": 12,
    "activeGames": 1,
    "highestScore": 4200,
    "uptimeSeconds": 3600
  }
}
```

### Application Logs

Structured console logs are produced for key application lifecycle events:
- Application started
- Game started
- Game over (with final score and survival duration)
- High score updated
- Invalid API requests
- Unexpected application errors

---

## 📂 Project Structure

```
dodge-rush/
│
├── public/
│   ├── index.html       # Game structure, HUD overlay, and screens
│   ├── style.css        # Modern glassmorphic neon design system
│   └── game.js          # Canvas engine, sound synth, controls & API calls
│
├── server.js            # Express server, health & stats endpoints, logging
├── package.json         # Dependencies and start scripts
├── README.md            # Documentation
├── .gitignore           # Git ignore configuration
└── Dockerfile           # Production Docker build container
```

---

## 📝 License

Distributed under the MIT License. Built for DevSight AI Demo.
