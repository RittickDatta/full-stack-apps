# Full-Stack Apps

A growing collection of full-stack applications built to explore modern web development, backend architecture, real-time communication, and production engineering.

Each project is developed as a standalone application with its own frontend, backend, documentation, and deployment configuration.

The goal of this repository is to build practical applications that go beyond basic CRUD functionality, with an emphasis on **clean architecture, type safety, security, testing, and deployment**.

## Projects

### 01. RoomChat — Real-Time Chat Application

A lightweight, room-based chat application that lets users create temporary rooms, invite others using a unique room code, and communicate instantly without creating an account.

**Key Features**
- Real-time messaging powered by Socket.IO
- Temporary rooms with unique invitation codes
- Participant presence and room lifecycle management
- Creator controls for starting, locking, and closing rooms
- Input validation, authorization, and rate limiting
- Responsive interface for desktop and mobile
- Automated backend and end-to-end testing

**Tech Stack**

`React` · `TypeScript` · `Vite` · `Tailwind CSS` · `Node.js` · `Express` · `Socket.IO` · `Zod` · `Playwright`

**Links**

- **Live App:** [Launch RoomChat](https://chatroom-client-eta.vercel.app)
- **Source Code:** [ChatRoom/](./ChatRoom)
- **Documentation:** [RoomChat README](./ChatRoom/README.md)

**Architecture:** React frontend deployed on Vercel, Node.js and Socket.IO backend deployed on Render, with shared TypeScript contracts managed through npm workspaces.

---

### More Projects Coming Soon

This repository will continue to grow with applications exploring different full-stack engineering challenges.

Future projects may focus on:

- **SaaS applications** — Authentication, role-based access control, relational data modeling, and complex application workflows.
- **Transactional systems** — Inventory management, concurrent operations, payments, and background processing.
- **Collaborative applications** — Real-time synchronization, presence, and shared state.

Each new application will have its own project directory, live deployment link, and technical documentation.

---

## Technology & Engineering Focus

While individual projects may use different technologies, the collection primarily explores the React and Node.js ecosystem.

| Area | Technologies & Concepts |
|---|---|
| Frontend | React, TypeScript, Vite, responsive UI |
| Backend | Node.js, Express, REST APIs, WebSockets |
| Data | Relational and non-relational databases, in-memory storage |
| Validation | Zod, shared contracts, runtime validation |
| Security | Authentication, authorization, input validation, rate limiting |
| Testing | Unit tests, integration tests, Playwright |
| Architecture | Modular design, layered services, monorepos |
| DevOps | Vercel, Render, environment configuration, monitoring |

*Technologies vary by project. Not every technology listed above is implemented in every application.*

## Repository Structure

```text
full-stack-apps/
├── ChatRoom/
│   ├── apps/
│   │   ├── client/
│   │   └── server/
│   ├── packages/
│   │   └── shared/
│   ├── docs/
│   └── README.md
│
├── README.md
│
└── ... future applications
```

Each application is self-contained and may use its own package manager configuration, dependencies, environment variables, and development commands.

## Getting Started

Clone the repository:

```bash
git clone https://github.com/RittickDatta/full-stack-apps.git
cd full-stack-apps
```

Navigate to the application you want to explore:

```bash
cd ChatRoom
```

Follow that application's README for installation, environment configuration, development commands, and testing instructions.

**Project setup guides**

- [RoomChat — Getting Started](./ChatRoom/README.md#getting-started)

## Development Philosophy

The projects in this repository are built around a few guiding principles:

**Build for real-world behavior.** Handle validation, errors, edge cases, and application lifecycle concerns—not just the happy path.

**Keep architecture intentional.** Separate responsibilities, choose abstractions that solve actual problems, and document important trade-offs.

**Prioritize reliability.** Use type safety, automated tests, and server-side validation to reduce unexpected behavior.

**Treat deployment as part of development.** Include environment configuration, production builds, and operational considerations.

**Learn through different application types.** Explore real-time, transactional, and data-driven systems rather than repeatedly building variations of the same CRUD application.

## About

This repository is maintained by [Rittick Datta](https://github.com/RittickDatta) as a collection of full-stack development projects.

Each application serves as an opportunity to explore a different engineering challenge and document the decisions made along the way.

---

**Explore the projects, review the code, or try the live applications.**
