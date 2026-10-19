<div align="center">

# ⚡ VOTEXA
### *Real-Time Audience Polling & Live Intelligence Engine*

[![Frontend](https://img.shields.io/badge/Live%20App-Vercel-black?style=for-the-badge&logo=vercel)](https://votexa-hcl-hackathon.vercel.app)
[![Backend](https://img.shields.io/badge/API-Render-46E3B7?style=for-the-badge&logo=render&logoColor=black)](https://votexa-backend-5xek.onrender.com)
[![Go](https://img.shields.io/badge/Go-1.24-00ADD8?style=for-the-badge&logo=go&logoColor=white)](https://go.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com/)
[![WebSocket](https://img.shields.io/badge/Realtime-Gorilla%20WS-8B5CF6?style=for-the-badge)](https://github.com/gorilla/websocket)

**HCL Hackathon 2026 Submission**  
Crafted with ❤️ by **Rethika S** (Pre-Final Year, B.E. CSE · Jerusalem College of Engineering, Chennai)

---

### 🌐 [Launch Web App](https://votexa-hcl-hackathon.vercel.app) • 📹 [Watch Demo Video (with Outro)](./votexa_demo.mp4) • ⚡ [API Health](https://votexa-backend-5xek.onrender.com/api/health)

---

</div>

## 📌 Executive Summary

**Votexa** is a high-concurrency, real-time polling and telemetry platform designed for auditoriums, hackathons, classrooms, and live keynotes. It allows presenters to spin up live polls on a laptop and have hundreds of audience members vote instantly from their mobile devices via QR code or direct link with sub-second WebSocket synchronization.

---

## 🚀 Live Deployments

| Component | Platform | URL | Status |
| :--- | :--- | :--- | :--- |
| **Frontend Web App** | **Vercel** | [https://votexa-hcl-hackathon.vercel.app](https://votexa-hcl-hackathon.vercel.app) | 🟢 Production |
| **Backend REST & WS Engine** | **Render** | [https://votexa-backend-5xek.onrender.com](https://votexa-backend-5xek.onrender.com) | 🟢 Healthy |
| **Database Cluster** | **MongoDB Atlas** | `votexacluster.ovt3gfq.mongodb.net` | 🟢 Sharded Replica |

---

## 🎬 Walkthrough Video & Outro

The repository includes a complete video walkthrough demonstrating account creation, instant poll creation, mobile QR code sharing, real-time vote synchronization across devices, and live voter activity feeds:

▶️ **[Download / Watch `votexa_demo.mp4`](./votexa_demo.mp4)**

*The updated video includes the cute pastel dual-screen mockup outro illustrating real-time laptop and smartphone voting sync with scannable QR codes.*

---

## ✨ Key Capabilities

- ⚡ **Sub-Second Real-Time Vote Sync**: WebSocket broadcasting with Gorilla WS and per-poll channels.
- 📱 **Instant Mobile Handshake**: Scan-to-vote QR codes and native Web Share (WhatsApp, AirDrop, Messages) immediately after poll creation.
- 👥 **LinkedIn-Style Voter Feed**: Presenters see who voted and what option was chosen in real-time.
- 🛡️ **Anti-Duplicate Voting**: SHA-256 client fingerprinting coupled with MongoDB unique compound indexes.
- 🔒 **Concurrency-Safe Free Tier Limit**: 10-poll limit enforced atomically at the database level (`$inc` + `$lt: 10`).
- 🌗 **Adaptive Dual Theme**: Fully tailored dark and light glassmorphic palettes.
- 📊 **Pro Telemetry Export**: One-click CSV export of voting activity and timestamps.

---

## 🏗️ Architecture & Concurrency Model

```
                    ┌─────────────────────────┐
                    │    Audience (Mobile)    │
                    │   Vercel React 19 SPA   │
                    └───────────┬─────────────┘
                                │ HTTP / WS
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                 Go High-Performance Engine                  │
│       Gin REST API Router  •  Gorilla WebSocket Hub         │
│               Atomic $inc Guard  •  JWT Auth                │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               ▼
      ┌─────────────────┐             ┌─────────────────┐
      │  MongoDB Atlas  │             │   Redis Pub/Sub │
      │  Persistent DB  │             │   (Opt. Broker) │
      └─────────────────┘             └─────────────────┘
```

---

## 🛠️ Technology Stack

```
Frontend ────── React 19  •  TypeScript  •  Vite  •  Tailwind CSS  •  Framer Motion  •  QRCode.react
Backend ─────── Go 1.24+  •  Gin Framework  •  Gorilla WebSocket  •  mongo-driver/v2  •  JWT (HS256)
Cloud ───────── Vercel (SPA)  •  Render (Dockerized Go)  •  MongoDB Atlas (Cloud Cluster)
```

---

## ⚡ Quickstart (Local Development)

### 1. Clone & Set Environment
```bash
git clone https://github.com/Rethika-2782/Votexa---HCL-hackathon.git
cd Votexa
```

### 2. Start Backend (Go)
```bash
cd backend
go run ./cmd/server
```
*Defaults to port `8080` with MongoDB on `mongodb://localhost:27017`.*

### 3. Start Frontend (React + Vite)
```bash
cd ../frontend
npm install
npm run dev
```
*Runs locally on `http://localhost:5173`.*

---

<details>
<summary><b>📡 REST & WebSocket API Reference (Click to expand)</b></summary>

### Authentication
- `POST /api/auth/register` — Create new user account with bcrypt password hashing
- `POST /api/auth/login` — Sign in and receive HS256 JWT bearer token
- `GET /api/auth/me` — Retrieve authenticated user profile and poll usage

### Poll Operations
- `POST /api/polls` — Create poll *(atomically checks free plan limit)*
- `GET /api/polls` — Get authenticated creator's polls
- `GET /api/polls/public/:code` — Public poll details & voter ballot
- `POST /api/polls/public/:code/vote` — Cast vote with device fingerprint
- `GET /api/polls/public/:code/votes` — Retrieve live voter activity feed
- `GET /api/polls/:code/export` — Export telemetry to CSV *(Pro tier)*

### Real-Time WebSocket
- `GET /api/ws/polls/:code` — Bidirectional WebSocket channel with 25s heartbeat

</details>

---

<details>
<summary><b>💪 Engineering Challenges & How They Were Solved (Click to expand)</b></summary>

### 1. Sub-Second Real-Time Synchronization Across Devices
* **Challenge:** Ensuring that a vote cast on mobile instantly updates the bar graph and audience feed on the presenter's laptop without page refreshes.
* **Solution:** Implemented Gorilla WebSocket Hubs with per-poll rooms and non-blocking channel broadcasts.

### 2. Race-Condition Proof Free Tier Enforcement
* **Challenge:** Free accounts allow up to 10 polls. Concurrent requests could bypass application-level checks.
* **Solution:** Used MongoDB's atomic `UpdateOne` with a conditional filter `{ pollCreationCount: { $lt: 10 } }` and `$inc: { pollCreationCount: 1 }`.

### 3. Duplicate Vote Prevention for Anonymous Attendees
* **Challenge:** Attendees vote without creating accounts.
* **Solution:** Generated a client SHA-256 fingerprint combining IP address, user agent, and browser entropy, bound to a unique composite MongoDB index on `{ pollId: 1, voterFingerprint: 1 }`.

### 4. Zero-Downtime Cloud Deployment
* **Challenge:** Deploying Go + MongoDB on free cloud infrastructure without port-blocking hurdles.
* **Solution:** Configured MongoDB Atlas with global IP whitelist, containerized Go into a lightweight multi-stage Alpine Docker image on Render, and linked SPA routing via Vercel rewrites.

</details>

---

## 🧪 Automated Integration Tests

To run the complete test suite verifying auth, poll creation, duplicate voting guards, and plan upgrade workflows:

```bash
cd backend
go test -v ./tests
```

---

<div align="center">

### Built for **HCL Hackathon 2026**

**Rethika S**  
*Department of Computer Science & Engineering*  
*Jerusalem College of Engineering, Chennai*

</div>
