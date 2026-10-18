# Votexa Database Design

## Collections

### 1. `users`
Persists account credentials, plan tier, and creation metrics.
```json
{
  "_id": "ObjectId",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "passwordHash": "$2a$10$...",
  "plan": "free" | "premium",
  "pollCreationCount": 0,
  "role": "user",
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```
**Indexes:**
- `{ email: 1 }` (Unique)

---

### 2. `polls`
Durable store for questions, options, and settings.
```json
{
  "_id": "ObjectId",
  "code": "vx-a8f9c1",
  "ownerId": "ObjectId",
  "ownerName": "Jane Doe",
  "question": "Which tech stack do you prefer?",
  "description": "Team survey",
  "options": [
    { "id": "opt-1", "text": "Go + React", "voteCount": 14 },
    { "id": "opt-2", "text": "Node + Vue", "voteCount": 8 }
  ],
  "totalVotes": 22,
  "status": "active" | "closed",
  "settings": {
    "anonymousVoting": true,
    "requireAuth": false,
    "allowMultipleVotes": false,
    "showResultsLive": true,
    "theme": "brand"
  },
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```
**Indexes:**
- `{ code: 1 }` (Unique)
- `{ ownerId: 1, createdAt: -1 }`

---

### 3. `votes`
Granular vote audit trail.
```json
{
  "_id": "ObjectId",
  "pollId": "ObjectId",
  "pollCode": "vx-a8f9c1",
  "optionId": "opt-1",
  "voterUserId": "ObjectId (optional)",
  "voterFingerprint": "sha256_hash",
  "voterIp": "127.0.0.1",
  "createdAt": "ISODate"
}
```
**Indexes:**
- `{ pollId: 1, voterUserId: 1 }` (Unique partial filter when voterUserId != null)
- `{ pollId: 1, voterFingerprint: 1 }` (Unique)
