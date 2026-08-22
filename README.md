# full-stack-apps
A collection of fullstack apps built with React + Node.js

Ideas for full-stack applications
1. Social Network
2. E-commerce
3. Modern SaaS Admin Panel

If you're limiting yourself to **three projects**, I'd change the strategy: don't try to demonstrate every concept independently. Make each project represent a **different category of production application**, with the three collectively covering most full-stack engineering concerns.

One small correction: since you said React + Node.js, I'm assuming you mean **three full-stack projects**, not backend-only projects.

I'd pick these three:

| Project                                | Application style           | Main engineering story                            |
| -------------------------------------- | --------------------------- | ------------------------------------------------- |
| **1. Project Management SaaS**         | Traditional multi-user SaaS | CRUD, auth, RBAC, relational data, complex UI     |
| **2. Real-Time Collaboration App**     | Event-driven/realtime       | WebSockets, presence, concurrency, optimistic UI  |
| **3. E-Commerce / Ticketing Platform** | Transactional system        | payments, inventory, queues, caching, reliability |

Together, they're much stronger than three variations of CRUD applications.

---

# 1. Project Management SaaS

Think **mini Linear / Jira / Trello**, but don't try to clone everything.

### Product

Users create organizations:

```text
Organization
    │
    ├── Members
    │
    ├── Projects
    │      │
    │      └── Issues
    │
    └── Teams
```

UI:

```text
┌─────────────┬─────────────────────────────────┐
│ Workspace   │ Project Alpha                   │
│             │                                 │
│ Inbox       │ TODO      DOING       DONE      │
│ Projects    │ ┌──────┐  ┌──────┐              │
│ Teams       │ │ #123 │  │ #119 │              │
│             │ └──────┘  └──────┘              │
│             │ ┌──────┐                        │
│             │ │ #124 │                        │
│             │ └──────┘                        │
└─────────────┴─────────────────────────────────┘
```

### Backend concepts

This becomes your **traditional SaaS architecture** project.

Implement:

```text
Authentication
├── login
├── logout
├── sessions
└── password reset

Authorization
├── organization roles
├── project permissions
└── resource ownership

API
├── REST
├── validation
├── pagination
├── filtering
└── error handling

Database
├── relationships
├── transactions
├── indexes
└── migrations
```

PostgreSQL is perfect.

Your schema might contain:

```text
users
organizations
organization_members

projects
issues
comments
labels

issue_labels
```

This lets you demonstrate actual relational modeling rather than:

```text
users
todos
```

---

## Frontend concepts

This project is where I'd demonstrate most of your **React application architecture**.

Use:

```text
React
TypeScript
React Router
TanStack Query
React Hook Form
Zod
dnd-kit
```

Demonstrate:

```text
Server state
URL state
Local UI state
Forms
Modals
Optimistic updates
Pagination
Filtering
Drag & drop
Responsive design
Accessibility
```

For example, issue filters should live in the URL:

```text
/projects/alpha/issues
    ?status=todo
    &priority=high
    &assignee=123
```

That's a small detail that makes it feel like a real application.

---

# 2. Real-Time Collaborative Workspace

For project two, deliberately leave the CRUD/SaaS comfort zone.

Build something like a **collaborative notes/whiteboard/chat application**.

For example:

```text
Workspace: Backend Architecture

Rittick is editing...

┌────────────────────────────────────┐
│ Architecture Proposal              │
│                                    │
│ The API gateway will handle...     │
│                         ▲          │
│                         │ Alice    │
│                                    │
└────────────────────────────────────┘

3 people online
```

You don't necessarily need Google Docs-level collaborative text editing. A shared workspace with notes, comments, cursors/presence and chat is enough.

### Architecture

```text
              ┌─────────────┐
              │ PostgreSQL  │
              └──────▲──────┘
                     │
                     │
React ← WebSocket → Node.js
  ↑                  │
  │                  ↓
  │               Redis
  │               Pub/Sub
  │
  └──── realtime updates
```

This demonstrates a completely different application architecture.

---

## Backend concepts

Focus on:

```text
WebSockets
Redis Pub/Sub
Presence
Rooms/channels
Connection lifecycle
Event-driven architecture
```

For example:

```json id="c59r55"
{
  "type": "cursor.moved",
  "workspaceId": "123",
  "userId": "456",
  "position": {
    "x": 418,
    "y": 231
  }
}
```

And:

```json id="y5n0f1"
{
  "type": "comment.created",
  "workspaceId": "123",
  "comment": {
    "id": "789",
    "text": "What about caching this?"
  }
}
```

---

## Handle connection problems

Don't just demonstrate the happy path.

Show:

```text
CONNECTED
    ↓
connection lost
    ↓
RECONNECTING
    ↓
exponential backoff
    ↓
CONNECTED
    ↓
synchronize missed state
```

That's where the project starts feeling production-oriented.

---

## Frontend concepts

This project can demonstrate:

```text
Optimistic UI
Realtime state
WebSocket lifecycle
Presence
Conflict handling
Offline state
Reconnection
Toast notifications
Complex state synchronization
```

For example:

```text
User writes comment
       ↓
Immediately render it

Comment
"Looks good"     Sending...
       ↓

WebSocket/API confirms

Comment
"Looks good"     ✓
```

If it fails:

```text
"Looks good"     Failed — Retry
```

That gives you great material to discuss during interviews.

---

# 3. Ticket Booking / E-Commerce Platform

For the third project, I'd build something **transaction-heavy**.

A ticket booking system is actually more interesting technically than a generic Amazon clone.

Imagine:

```text
Concert
Coldplay — Warsaw

Section A

[A1] [A2] [A3] [A4]
[B1] [B2] [B3] [B4]

Available
Reserved
Sold
```

Users:

```text
Browse events
     ↓
Choose seats
     ↓
Temporarily reserve
     ↓
Checkout
     ↓
Payment
     ↓
Confirmation
```

Now you've created a lot of real backend problems.

---

# The interesting problem: concurrency

Imagine only seat `A12` remains.

```text
User A ─────┐
            │
            ├──→ Seat A12
            │
User B ─────┘
```

Both click simultaneously.

Only one should succeed.

Your backend needs to deal with:

```text
Transactions
Row locking
Race conditions
Reservation expiration
Idempotency
```

For example:

```text
BEGIN

SELECT *
FROM seats
WHERE id = 'A12'
FOR UPDATE

if available:
    reserve seat

COMMIT
```

This immediately gives you a great interview discussion.

---

# Add Redis

When a user selects seats:

```text
A12
A13
```

reserve them for:

```text
10 minutes
```

You can model temporary reservations with Redis TTLs.

```text
seat:A12:reservation
    ↓
user:123

TTL = 600 seconds
```

Frontend:

```text
Your seats are reserved for

09:42

[ Complete checkout ]
```

Now Redis has a genuine reason to exist rather than being included because "backend developers should know Redis."

---

# Add payments

Use something like [Stripe](https://stripe.com?utm_source=chatgpt.com) test mode.

Architecture:

```text
React
   ↓
Node API
   ↓
Stripe

Stripe
   ↓
Webhook
   ↓
Node
   ↓
Order confirmed
```

This teaches an important full-stack lesson:

```text
Browser says payment succeeded
```

shouldn't necessarily be your authoritative source.

Instead:

```text
Stripe webhook
      ↓
Backend verifies
      ↓
Order → PAID
```

---

# Add background jobs

After purchase:

```text
Payment confirmed
       ↓
     Queue
    /     \
   ↓       ↓
Email    Generate
receipt   ticket
```

Use something like [BullMQ](https://bullmq.io/?utm_source=chatgpt.com).

Demonstrate:

```text
Background processing
Retries
Exponential backoff
Failed jobs
Idempotent workers
```

---

# Add caching

Event information is read frequently:

```http
GET /events
GET /events/:id
```

So:

```text
Request
   ↓
 Redis
  /   \
HIT    MISS
 ↓       ↓
return PostgreSQL
          ↓
        cache
          ↓
        return
```

Now one project naturally demonstrates **PostgreSQL + Redis + queues + payments + concurrency**.

---

# The three architectures become very different

That's the main reason I'd choose these projects.

### Project 1 — SaaS

```text
React
   ↓
REST API
   ↓
Node
   ↓
PostgreSQL
```

Primary engineering concerns:

```text
CRUD
Authentication
Authorization
Relational modeling
Forms
Filtering
Application architecture
```

### Project 2 — Realtime

```text
React
   ↕
WebSockets
   ↕
Node
   ↕
Redis Pub/Sub
   ↓
PostgreSQL
```

Primary concerns:

```text
Realtime communication
Events
Presence
Optimistic UI
Connection management
State synchronization
```

### Project 3 — Transactional

```text
              Redis
                ↑
React → Node → PostgreSQL
          │
          ├── Queue → Workers
          │
          └── Payment provider
```

Primary concerns:

```text
Transactions
Concurrency
Caching
Queues
Payments
Idempotency
Reliability
```

---

# I'd use roughly the same core stack

Don't change technology just for the sake of changing it.

```text
Frontend
├── React
├── TypeScript
├── Vite
├── TanStack Query
├── React Hook Form
├── Zod
└── Tailwind / CSS

Backend
├── Node.js
├── TypeScript
├── Fastify / Express
├── PostgreSQL
├── Redis
└── Zod

Infrastructure
├── Docker
├── Docker Compose
├── GitHub Actions
└── nginx (optional)

Testing
├── Vitest
├── React Testing Library
├── Playwright
└── Testcontainers
```

The repetition is actually useful. You're showing how the **same fundamental stack adapts to different architectural problems**.

## Make production concerns common to all three

I'd require every project to have:

```text
✓ TypeScript
✓ Docker Compose
✓ Database migrations
✓ Seed data
✓ Environment validation
✓ Structured logging
✓ Centralized error handling
✓ Request validation
✓ Unit tests
✓ Integration tests
✓ E2E happy-path test
✓ CI pipeline
✓ Accessible UI
✓ Responsive UI
✓ Loading/error/empty states
✓ README architecture diagram
```

And add health endpoints:

```http
GET /health
GET /ready
```

with graceful shutdown handling on the Node side.

---

# The final GitHub profile story

I'd name the repositories as actual products rather than:

```text
❌ react-node-project-1
❌ fullstack-demo
❌ node-practice
```

For example:

```text
github.com/you/

├── orbit
│   Multi-tenant project management SaaS
│
├── syncspace
│   Real-time collaborative workspace
│
└── ticketly
    Concurrent ticket reservation platform
```

Then pin those three repositories.

Someone looking at your profile can immediately see:

**Orbit** → "They understand how SaaS applications are built."

**Syncspace** → "They understand realtime/event-driven applications."

**Ticketly** → "They understand transactional systems, concurrency, caching, queues and external integrations."

That's a much stronger full-stack portfolio than three large apps that all boil down to **React → Express → CRUD → MongoDB**.

