# VOTEXA API & ARCHITECTURE DOCUMENTATION

## Overview
Votexa is a high-throughput, low-latency audience polling and intelligence platform.

- **Frontend:** React 19, TypeScript, Tailwind CSS, Framer Motion, Lucide React, Vite.
- **Backend:** Go 1.27, Gin Web Framework, REST API, Gorilla WebSocket.
- **Durable Database:** MongoDB 8.x with unique composite indexes for email, poll codes, and duplicate voting prevention.
- **Real-Time Distribution:** Redis 8.x Pub/Sub channels broadcasting poll increments without polling.

---

## Authentication Endpoints
- `POST /api/auth/register` — Creates user account with bcrypt salted password hashing.
- `POST /api/auth/login` — Verifies password hash and returns signed HS256 JWT token.
- `GET /api/auth/me` — Returns authenticated user profile and live usage metrics.

## Poll Management Endpoints
- `POST /api/polls` — Creates a new poll. Backend enforces Free tier 10-poll limit atomically (`$lt: 10`).
- `GET /api/polls` — Retrieves all polls belonging to the authenticated account.
- `GET /api/polls/public/:code` — Returns public poll metadata, option list, total votes, and voter status.
- `POST /api/polls/public/:code/vote` — Records a vote atomically in MongoDB and publishes an event to Redis Pub/Sub.
- `POST /api/polls/:code/close` — Closes poll to further votes and broadcasts `POLL_CLOSED` to WebSocket clients.
- `DELETE /api/polls/:code` — Deletes poll.
- `GET /api/polls/:code/export` — Downloads CSV response telemetry (exclusive to Premium tier).

## Real-Time WebSocket Channel
- `GET /api/ws/polls/:code` — Connects client to poll-specific WebSocket hub with 25s ping/pong heartbeat.
