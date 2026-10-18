<![CDATA[<div align="center">

# ⚡ VOTEXA — Real-Time Polling & Audience Intelligence

### *Every Voice. One Live Pulse.*

**HCL Hackathon 2026 Submission**

Built by **Rethika S** — Pre-Final Year, B.E. Computer Science Engineering  
Jerusalem College of Engineering, Chennai

---

[![Go](https://img.shields.io/badge/Backend-Go_1.27-00ADD8?style=for-the-badge&logo=go&logoColor=white)](https://go.dev/)
[![React](https://img.shields.io/badge/Frontend-React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB_8-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com/)
[![Redis](https://img.shields.io/badge/Realtime-Redis_8_PubSub-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org/)

</div>

---

## 📋 Table of Contents

- [About the Project](#-about-the-project)
- [Demo Video](#-demo-video)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Architecture Overview](#-architecture-overview)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Endpoints](#-api-endpoints)
- [Challenges I Faced](#-challenges-i-faced--what-was-tough-to-handle)
- [Where I Went Wrong (Honestly)](#-where-i-went-wrong-honestly)
- [What I Learned](#-what-i-learned)
- [Future Improvements](#-future-improvements)
- [Test Suite](#-automated-test-suite)

---

## 🎯 About the Project

**Votexa** is a full-stack, real-time polling SaaS platform I built from scratch for the **HCL Hackathon 2026**. The idea was to create something that could be used in conferences, classrooms, live streams, and team standups — where someone creates a poll, shares a link or QR code, and everyone's votes appear *instantly* without refreshing the page.

I'm **Rethika**, a pre-final year CSE student at **Jerusalem College of Engineering**, and this is my attempt at building something production-grade with real-time WebSocket streaming, a Go backend, and a React frontend — all coordinated through Redis Pub/Sub.

The platform supports:
- **Shareable poll links & QR codes** — anyone with the link can vote
- **Sub-second live vote updates** — powered by WebSockets + Redis Pub/Sub
- **LinkedIn-style voter activity feed** — the poll creator can see who voted and what they chose, in real-time (like seeing likes on LinkedIn)
- **Free & Premium tiers** — free users get 10 polls, premium gets unlimited + CSV export
- **Duplicate vote prevention** — using device fingerprinting + MongoDB unique composite indexes

---

## 🎬 Demo Video

> A complete screen-recorded walkthrough of every feature with AI voiceover narration.

📹 **[Watch the Demo Video →](./votexa_demo.mp4)**

The video covers:
1. Fresh user registration (no hardcoded credentials)
2. Creating a poll with multiple options
3. Copying the shareable link and opening it in a new tab
4. Voting from the new tab and seeing real-time updates in the creator's tab
5. The LinkedIn-style voter activity feed showing who voted and their choice
6. Dark mode toggle, QR code generation, and the upgrade flow

---

## ✨ Key Features

| Feature | Description |
|:--------|:------------|
| **Real-Time Voting** | Sub-second vote synchronization via WebSocket + Redis Pub/Sub channels |
| **Shareable Links & QR** | Every poll gets a unique code (e.g., `vx-9a2f1b`) and scannable QR |
| **LinkedIn-Style Activity Feed** | Poll creators see voter names and their choices in real-time — like LinkedIn post reactions |
| **Concurrency-Safe Free Plan** | 10-poll limit enforced atomically at the MongoDB query level (`$inc` with `$lt: 10`) |
| **Premium Plan** | Unlimited polls + CSV telemetry export |
| **Dark/Light Theme** | Full dark mode support with smooth transitions |
| **Duplicate Vote Protection** | SHA-256 device fingerprinting + MongoDB unique composite indexes |
| **Enterprise Security** | Bcrypt password hashing, HS256 JWT tokens, CORS-safe API |
| **Live Connection Status** | Visual WebSocket heartbeat indicator (ping/pong every 25s) |
| **Voter Name Capture** | Voters can enter their name before voting — visible to the poll creator |

---

## 🛠 Technology Stack

### Frontend
| Technology | Purpose |
|:-----------|:--------|
| **React 19** | Component-based UI framework |
| **TypeScript** | Type-safe development |
| **Vite** | Lightning-fast dev server and build tool |
| **Tailwind CSS** | Utility-first responsive styling with custom design tokens |
| **Framer Motion** | Smooth micro-animations and transitions |
| **Lucide React** | Beautiful, consistent SVG icon library |
| **qrcode.react** | Client-side QR code generation for mobile voting |

### Backend
| Technology | Purpose |
|:-----------|:--------|
| **Go 1.27** | High-performance compiled backend language |
| **Gin Framework** | Fast HTTP router and middleware chain |
| **Gorilla WebSocket** | Real-time bidirectional communication |
| **MongoDB 8.x** (Official Go Driver v2) | Persistent document store with atomic operations |
| **Redis 8.x** (go-redis v9) | Pub/Sub message broker for live vote broadcasting |
| **golang-jwt/jwt v5** | Signed HS256 JWT token generation and verification |
| **bcrypt** | Industry-standard password hashing |

### Infrastructure
| Technology | Purpose |
|:-----------|:--------|
| **Docker Compose** | Multi-service orchestration (MongoDB + Redis + Go + React) |
| **MongoDB Unique Indexes** | Email uniqueness, poll code uniqueness, duplicate vote prevention |
| **Redis Pub/Sub Channels** | Per-poll channels (`poll:<code>`) for scoped real-time updates |

---

## 🏗 Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                             │
│                                                                      │
│  React 19 + TypeScript + Tailwind CSS + Framer Motion                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐    │
│  │ Landing  │  │Dashboard │  │  Create  │  │  Poll Live View  │    │
│  │  Page    │  │  Page    │  │  Poll    │  │  + Voter Feed    │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘    │
│        │              │            │               │     ▲          │
│        └──────────────┴────────────┴───────────────┘     │          │
│                         REST API (fetch)           WebSocket        │
└──────────────────────────────────┬───────────────────────┬──────────┘
                                   │                       │
                           HTTP :8080                WS :8080
                                   │                       │
┌──────────────────────────────────┴───────────────────────┴──────────┐
│                      GO BACKEND (Gin Framework)                      │
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────────┐  │
│  │  Auth    │  │  Poll    │  │  Vote    │  │  WebSocket Hub     │  │
│  │ Handler  │  │ Handler  │  │ Handler  │  │  (per-poll rooms)  │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬───────────┘  │
│       │              │             │                  │              │
│  ┌────┴──────────────┴─────────────┴──────────────────┴───────────┐  │
│  │              Service Layer (Business Logic)                    │  │
│  │    AuthService  ·  PollService  ·  JWT  ·  Bcrypt  ·  SHA256  │  │
│  └────────────────────────┬───────────────────────────────────────┘  │
│                           │                                          │
│  ┌────────────────────────┴───────────────────────────────────────┐  │
│  │                    Repository Layer                             │  │
│  │    MongoDB CRUD  ·  Atomic $inc  ·  Unique Indexes             │  │
│  └────────────┬───────────────────────────────┬───────────────────┘  │
└───────────────┼───────────────────────────────┼──────────────────────┘
                │                               │
        ┌───────┴────────┐             ┌────────┴──────────┐
        │   MongoDB 8.x  │             │    Redis 8.x      │
        │                │             │    Pub/Sub         │
        │  users         │             │                    │
        │  polls         │             │  poll:<code>       │
        │  votes         │             │  channels          │
        └────────────────┘             └───────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v20+ & npm
- **Go** v1.24+
- **MongoDB** running on `mongodb://localhost:27017`
- **Redis** server running on `localhost:6379`

### Step 1: Start Redis & MongoDB
```powershell
# Start Redis (Windows - if installed via winget)
redis-server

# MongoDB should already be running as a service
```

### Step 2: Start the Go Backend (Port 8080)
```powershell
cd backend
$env:PORT = "8080"
$env:MONGODB_URI = "mongodb://localhost:27017"
$env:REDIS_URL = "redis://localhost:6379/0"
go run ./cmd/server
```

You should see:
```
[MongoDB] Connected successfully to database 'votexa'
[Redis] Connected successfully to Redis server
[Votexa API] Server listening on http://localhost:8080
```

### Step 3: Start the React Frontend (Port 5173)
```powershell
cd frontend
npm install
npm run dev
```

Open **`http://localhost:5173`** in your browser.

---

## 🔐 Environment Variables

### Backend (`backend/.env` or environment)
```env
PORT=8080
APP_ENV=development
FRONTEND_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=votexa
REDIS_URL=redis://localhost:6379/0
JWT_SECRET=votexa-super-secret-jwt-key-2026-production-grade
JWT_EXPIRATION=72
FREE_POLL_LIMIT=10
PREMIUM_POLL_LIMIT=1000
PREMIUM_UNLIMITED_POLLS=true
PUBLIC_APP_URL=http://localhost:5173
ADMIN_SECRET_KEY=votexa-admin-secret-provision-2026
```

### Frontend (`frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_WS_BASE_URL=ws://localhost:8080/api/ws
```

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `POST` | `/api/auth/register` | Create account (bcrypt hashed password) |
| `POST` | `/api/auth/login` | Login and receive JWT token |
| `GET` | `/api/auth/me` | Get authenticated user profile + usage |

### Poll Management (Authenticated)
| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `POST` | `/api/polls` | Create poll (enforces 10-poll free limit atomically) |
| `GET` | `/api/polls` | Get all polls owned by the user |
| `POST` | `/api/polls/:code/close` | Close poll to further votes |
| `DELETE` | `/api/polls/:code` | Delete poll permanently |
| `GET` | `/api/polls/:code/export` | CSV export (Premium only) |

### Public Voting
| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `GET` | `/api/polls/public/:code` | Get public poll data and voter status |
| `POST` | `/api/polls/public/:code/vote` | Cast a vote with voter name |
| `GET` | `/api/polls/public/:code/votes` | Get voter activity feed for the poll |

### Real-Time WebSocket
| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `GET` | `/api/ws/polls/:code` | WebSocket connection with 25s heartbeat |

### Plans
| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `GET` | `/api/plans` | List available plans |
| `POST` | `/api/plans/upgrade` | Upgrade user plan |

---

## 💪 Challenges I Faced & What Was Tough to Handle

### 1. 🔴 Real-Time Synchronization Across Multiple Tabs
**The Problem:** Getting votes from one browser tab to instantly appear in another tab without page refresh was the single hardest challenge. I needed WebSockets, Redis Pub/Sub, and MongoDB atomic updates to all work together seamlessly.

**What Made It Hard:** When a vote is cast, the flow is: MongoDB atomic write → Redis Pub/Sub publish → WebSocket Hub broadcasts to all connected clients → React state updates. Any break in this chain and the real-time illusion breaks. I spent nearly 2 days debugging a race condition where the WebSocket Hub would sometimes miss Redis messages because the subscription wasn't fully established before the first vote came in.

**How I Solved It:** I added a small `time.Sleep(100ms)` delay after Redis subscription and ensured the Hub's goroutine was running before any client could connect. Not elegant, but it works reliably.

---

### 2. 🔴 Concurrency-Safe Poll Limit Enforcement
**The Problem:** Free users are limited to 10 polls. But what if two requests arrive at the exact same millisecond? A naive `if count < 10` check followed by insert creates a TOCTOU race condition — two requests could both see count=9 and both succeed, giving the user 11 polls.

**What Made It Hard:** I had to do this at the database level, not the application level. MongoDB's `UpdateOne` with a conditional filter (`pollCreationCount: {$lt: 10}`) and `$inc` makes the check-and-increment atomic. If the condition fails, `MatchedCount` is 0 and I return `POLL_LIMIT_REACHED`. This took me a while to figure out because I initially tried application-level locking which was fragile.

---

### 3. 🟡 Duplicate Vote Prevention Without User Accounts
**The Problem:** Anonymous users (not logged in) can vote. But how do you prevent them from voting twice? You can't rely on user IDs because they don't have accounts.

**What Made It Hard:** I used a combination of client-side device fingerprinting (random token stored in localStorage) combined with a server-side SHA-256 hash of `IP + UserAgent + ClientFingerprint`. This composite hash is stored in MongoDB with a unique index on `(pollId, voterFingerprint)`. If someone tries to vote again, MongoDB's duplicate key error triggers `ALREADY_VOTED`. The tricky part was handling edge cases — different browsers on the same machine, incognito mode, VPN changes.

---

### 4. 🟡 WebSocket Connection Lifecycle Management
**The Problem:** WebSocket connections die silently. Users close their laptop, their WiFi drops, or they just navigate away. If I don't clean up dead connections, the Hub accumulates zombie clients and memory leaks.

**What Made It Hard:** I implemented a ping/pong heartbeat every 25 seconds. If a client doesn't respond to a ping within the read deadline (60s), the connection is closed and the client is unregistered from the Hub. When the last client for a poll disconnects, the Redis subscription for that poll is also cancelled. Getting this cleanup lifecycle right without introducing deadlocks (the Hub uses a `sync.RWMutex`) was painful.

---

### 5. 🟡 Making the LinkedIn-Style Voter Activity Feed Real-Time
**The Problem:** The poll creator wanted to see WHO voted and WHAT they chose, in real-time — similar to how LinkedIn shows "X liked your post." This required passing voter names through the entire pipeline: Vote API → MongoDB → Redis Pub/Sub → WebSocket → React state.

**What Made It Hard:** The original architecture didn't carry voter names through the Redis message. I had to modify the `Vote` model, the `PollUpdateMessage` struct, the `CastVote` service method, and the frontend WebSocket handler to all support `voterName` and `optionText` fields. Any mismatch in the JSON field names between Go structs and TypeScript interfaces caused silent failures.

---

### 6. 🟢 Tailwind CSS Dark Mode Consistency
**The Problem:** Every single component needed to look good in both light and dark mode. With 5 pages and 4 components, that's hundreds of `dark:` class variants.

**What Made It Hard:** It's not technically hard, it's just tedious and easy to miss spots. I found several contrast issues in dark mode during final testing — text colors that were readable on white but invisible on dark backgrounds. Using a `ThemeContext` with `localStorage` persistence and `prefers-color-scheme` detection helped, but the manual work of auditing every element was brutal.

---

## 😅 Where I Went Wrong (Honestly)

### 1. ❌ I Initially Hardcoded Demo Credentials
**What Happened:** In my first version, the auth flow had a hardcoded demo email and password for quick testing. I forgot to remove it before the final submission. The login form would pre-fill with `demo@votexa.io` / `password123`. This is a terrible practice and a security anti-pattern.

**What I Fixed:** I completely removed all hardcoded credentials. The auth modal now opens with empty fields every time. Users must register with their own email and password, which gets bcrypt-hashed and stored in MongoDB. I also added a `useEffect` that resets all form fields whenever the modal opens.

---

### 2. ❌ I Underestimated the WebSocket Complexity
**What Happened:** I initially thought WebSockets were just "open a connection, send messages." I didn't account for connection drops, heartbeat requirements, cleanup on disconnect, or the fact that Redis Pub/Sub subscriptions need their own goroutines. My first WebSocket implementation leaked memory because dead connections were never cleaned up.

**What I Should Have Done:** Research WebSocket lifecycle patterns more thoroughly before coding. The Gorilla WebSocket library has great examples with pump patterns that I eventually adopted — but only after wasting a day with a broken implementation.

---

### 3. ❌ I Didn't Build the Voter Activity Feed From Day One
**What Happened:** The original design only showed vote counts and percentages. A friend suggested adding a "who voted what" feed (like LinkedIn reactions). I had to retrofit this feature into the existing architecture, which meant modifying backend models, services, handlers, routes, Redis messages, AND the frontend — a chain of 8+ files.

**What I Should Have Done:** Planned the voter tracking feature from the start. Adding it as an afterthought made the code changes much more invasive and error-prone.

---

### 4. ❌ I Initially Had No Voter Name Capture
**What Happened:** Votes were completely anonymous — even the poll creator couldn't see who voted. This made the voter activity feed useless because every entry just said "Audience Member."

**What I Fixed:** I added a voter name input on the poll view page. Logged-in users auto-fill with their account name, and anonymous users can type their name. The name flows through the entire pipeline: API request → MongoDB vote document → Redis Pub/Sub message → WebSocket broadcast → React voter feed.

---

### 5. ❌ I Used `console.log` Instead of Proper Error Handling
**What Happened:** In my rush to get features working, I used `console.log` and `console.error` extensively instead of proper error boundaries and user-facing error messages. Some API failures would silently fail without any UI feedback.

**What I Fixed (Partially):** I added error state variables and UI error banners in all major components. But I know this still isn't production-grade — I should have used an error boundary component and a toast notification system.

---

### 6. ❌ The CSV Export Required Complete Page Refresh
**What Happened:** After exporting a CSV, the download worked but the UI didn't give any visual feedback. The user had to check their downloads folder to confirm it worked.

**What I Should Have Done:** Added a toast notification or at least a temporary "Download started!" message. Small UX details like this matter and I cut corners here.

---

## 📚 What I Learned

1. **Go is incredibly fast for backend APIs** — the Gin framework handles concurrent WebSocket connections with minimal resource usage compared to Node.js
2. **Redis Pub/Sub is not a message queue** — messages are fire-and-forget. If no subscriber is listening, the message is lost. This is fine for real-time voting but wouldn't work for critical data.
3. **MongoDB atomic operations are powerful** — the `$inc` with conditional `$lt` filter for enforcing poll limits is elegant and race-condition-proof
4. **WebSocket lifecycle management is harder than the actual messaging** — 70% of the effort went into handling connections, not into the message format
5. **TypeScript + Go JSON serialization mismatches are silent killers** — if Go's `json:"pollCode"` doesn't match TypeScript's `pollCode` exactly, data just disappears with no error
6. **Dark mode is a multiplier on design effort** — every color choice needs to be audited in both themes
7. **Building something end-to-end (frontend + backend + database + real-time) is incredibly rewarding** but humbling — you realize how much you don't know

---

## 🔮 Future Improvements

If I had more time, I would add:

- [ ] **OAuth 2.0 login** (Google, GitHub) instead of just email/password
- [ ] **Poll templates** — pre-built poll types for common use cases (feedback, quizzes, elections)
- [ ] **Scheduled poll auto-close** — set a deadline and the poll closes automatically
- [ ] **Rich analytics dashboard** — charts showing vote distribution over time, geographic breakdown
- [ ] **Mobile-native app** (React Native) for better mobile voting experience
- [ ] **Rate limiting** on the API to prevent abuse
- [ ] **Proper toast notification system** for better UX feedback
- [ ] **End-to-end encryption** for sensitive polls
- [ ] **Webhook integrations** — notify Slack/Discord when votes come in
- [ ] **Poll embedding** — embed polls in external websites via iframe

---

## 🧪 Automated Test Suite

Run the comprehensive backend integration tests:

```powershell
cd backend
go test -v ./tests
```

The test suite verifies:
1. **User Registration** — Creates account with bcrypt hashing, starts on `free` plan
2. **User Login** — Verifies password hash, returns JWT token
3. **Poll Creation** — Creates poll with options, receives unique code
4. **Live Voting + Redis** — Casts vote, verifies count, confirms Redis Pub/Sub message
5. **Duplicate Vote Prevention** — Second vote attempt returns `ALREADY_VOTED`
6. **Concurrency-Safe Free Limit** — Creating poll beyond limit returns `POLL_LIMIT_REACHED`
7. **Premium Upgrade** — Upgrading to premium unlocks unlimited polls
8. **Post-Upgrade Creation** — Premium user can create polls beyond the free limit

---

## 📁 Project Structure

```
Votexa/
├── backend/
│   ├── cmd/server/          # Application entry point
│   ├── internal/
│   │   ├── config/          # Environment configuration loader
│   │   ├── database/        # MongoDB connection & index setup
│   │   ├── handlers/        # HTTP request handlers (controllers)
│   │   ├── middleware/      # JWT auth middleware
│   │   ├── models/          # Data models (User, Poll, Vote, etc.)
│   │   ├── redis/           # Redis Pub/Sub service
│   │   ├── repositories/    # MongoDB CRUD operations
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Business logic layer
│   │   ├── validators/      # Input validation
│   │   └── websocket/       # WebSocket Hub, Client, Pump handlers
│   ├── tests/               # Integration test suite
│   ├── go.mod
│   └── go.sum
├── frontend/
│   ├── src/
│   │   ├── components/      # AuthModal, Navbar, Logo, UpgradeModal
│   │   ├── context/         # AuthContext, ThemeContext
│   │   ├── pages/           # Landing, Dashboard, Create, PollView, Pricing
│   │   ├── services/        # API client (fetch wrapper)
│   │   └── types/           # TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts
├── docs/                    # API & database documentation
├── docker-compose.yml       # Multi-service orchestration
├── votexa_demo.mp4          # Demo video with AI voiceover
└── README.md                # This file
```

---

## 📜 License

This project was built for the **HCL Hackathon 2026** as an educational and demonstration project.

---

<div align="center">

**Built with ❤️ by Rethika S**  
*Pre-Final Year · B.E. Computer Science Engineering*  
*Jerusalem College of Engineering, Chennai*

**HCL Hackathon 2026**

</div>
]]>
