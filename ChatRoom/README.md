# ChatRoom

ChatRoom is a full-stack, lightweight real-time chat application built with React, TypeScript, Express, and Socket.IO. It features temporary rooms, live messaging, participant presence, creator controls, shared validation, automated tests, and cloud deployment.

## Features (planned)

- Create and join rooms using shareable codes
- Real-time room-based messaging
- Participant presence
- Creator-controlled room locking and closure
- Responsive mobile-first interface
- Light and dark themes
- No signup or login required

## Tech Stack

| Layer                   | Technologies                          |
| ----------------------- | ------------------------------------- |
| Frontend                | React, TypeScript, Vite, Tailwind CSS |
| Routing                 | React Router                          |
| Backend                 | Node.js, Express, TypeScript          |
| Real-time communication | Socket.IO                             |
| Validation              | Zod                                   |
| Monorepo                | npm workspaces                        |
| Backend testing         | Node.js built-in test runner          |
| End-to-end testing      | Playwright                            |
| Frontend deployment     | Vercel                                |
| Backend deployment      | Render                                |

## Architecture

ChatRoom is organized as an npm-workspaces monorepo.

```text
ChatRoom/
├── apps/
│   ├── client/       # React frontend
│   └── server/       # Express + Socket.IO backend
├── packages/
│   └── shared/       # Shared schemas, types, and constants
├── e2e/              # Playwright browser tests
├── docs/             # Technical documentation
└── package.json
```

The frontend and backend share TypeScript contracts through `@chatroom/shared`, reducing inconsistencies between client requests and server responses.

The backend uses an in-memory room repository. Rooms and messages are temporary and are removed when the server restarts.

See [Architecture Documentation](docs/architecture.md) for more details.

## Getting Started

### Prerequisites

- Node.js 24 or a compatible version supported by the project
- npm
- Git

### Clone the repository

```bash
git clone https://github.com/RittickDatta/full-stack-apps
cd full-stack-apps/ChatRoom
```

If the repository contains ChatRoom in a nested `ChatRoom` directory, change into that directory before running npm commands.

### Install dependencies

```bash
npm ci
```

### Configure environment variables

Create `apps/server/.env`:

```dotenv
NODE_ENV=development
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
```

Add any other variables required by the server configuration, using `apps/server/.env.example` as the source of truth.

Create `apps/client/.env`:

```dotenv
VITE_SOCKET_URL=http://localhost:3001
```

### Start the application

```bash
npm run dev
```

Open:

http://localhost:5173

The backend runs at:

http://localhost:3001

## How to Use

1. Open ChatRoom and select **Create Room**.
2. Enter your display name.
3. Copy the generated room code.
4. Start the room.
5. Share the room code with another user.
6. The other user selects **Join Room** and enters the code.
7. Exchange messages in real time.
8. Use creator controls to lock or close the room.

## Testing

Run TypeScript checks:

```bash
npm run typecheck
```

Build the project:

```bash
npm run build
```

Run backend tests:

```bash
npm run test -w @chatroom/server
```

Run Playwright tests:

```bash
npm run test:e2e
```

Install Playwright browser binaries if required:

```bash
npx playwright install
```

## Security

ChatRoom includes:

- Runtime input validation
- Room creator authorization
- Server-side participant and room membership checks
- Socket.IO origin restrictions
- Rate limiting
- Payload-size limits
- Structured error acknowledgements

ChatRoom is an ephemeral chat application, not an end-to-end encrypted messaging service.

See [Security Documentation](docs/security.md).

## Deployment

The application is deployed using:

- **Vercel:** React frontend
- **Render:** Node.js and Socket.IO backend

The frontend connects to the backend using the `VITE_SOCKET_URL` environment variable.

See [Deployment Documentation](docs/deployment.md).

## Known Limitations

- Rooms and messages are stored in memory.
- Backend restarts remove active rooms.
- Sessions are not restored after disconnection.
- The backend is intended to run as a single instance.

### Keywords

react
typescript
nodejs
express
socket-io
real-time-chat
full-stack
vite
tailwindcss
playwright
monorepo
