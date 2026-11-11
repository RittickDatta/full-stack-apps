
# ChatRoom

A lightweight real-time chat application built with React,
TypeScript, Express, and Socket.IO.

## Features (planned)

- Create and join rooms using shareable codes
- Real-time room-based messaging
- Participant presence
- Creator-controlled room locking and closure
- Responsive mobile-first interface
- Light and dark themes
- No signup or login required

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS
- Backend: Node.js, Express, TypeScript
- Real-time communication: Socket.IO
- Shared contracts: TypeScript
- Storage: In-memory repository

## Repository Structure

- `apps/client` — React frontend
- `apps/server` — Express backend
- `packages/shared` — Shared contracts and models

## Requirements

- Node.js 24 LTS
- npm
- Git

## Development

Project setup is in progress.

See the implementation backlog for upcoming stories.


## Deployment

RoomChat is deployed using:

- Frontend: Vercel
- Backend: Render
- Real-time communication: Socket.IO

### Environment variables

Backend:
- NODE_ENV
- PORT (provided by the hosting platform)
- CLIENT_ORIGIN
- RATE_LIMIT_ROOM_CREATE
- RATE_LIMIT_ROOM_JOIN
- RATE_LIMIT_CHAT_SEND

Frontend:
- VITE_SOCKET_URL

### Production build

npm ci
npm run build

### Verification

npm run typecheck
npm run test -w @chatroom/server
npm run test:e2e

### Known limitations

- Rooms and messages are stored in memory.
- Backend restarts remove active rooms.
- Sessions are not restored after disconnection.
- The backend is intended to run as a single instance.
