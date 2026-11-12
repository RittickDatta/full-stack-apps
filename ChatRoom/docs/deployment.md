# RoomChat Deployment Guide

## Architecture

RoomChat uses separate frontend and backend hosting.

- **Frontend:** Vercel
- **Backend:** Render
- **Real-time transport:** Socket.IO over secure WebSocket
- **Shared package:** Built as part of the npm workspace

## Backend — Render

Configure a Node.js web service.

**Root directory:** `ChatRoom` if the repository contains RoomChat in that subdirectory; otherwise use the repository root.

**Build command:**

```bash
npm ci --include=dev && npm run build -w @chatroom/shared && npm run build -w @chatroom/server
```

**Start command:**

```bash
npm run start -w @chatroom/server
```

The production start script must execute compiled JavaScript without requiring a local `.env` file.

Example:

```json
{
  "start": "node dist/server.js"
}
```

### Backend environment variables

```dotenv
NODE_ENV=production
CLIENT_ORIGIN=https://chatroom-client-eta.vercel.app/
LOG_LEVEL=info
```

Add the rate-limit and other settings required by your actual server configuration.

Render normally supplies the `PORT` variable.

### Health check

Configure:

```text
/health
```

## Frontend — Vercel

**Framework:** Vite

**Root directory:** `ChatRoom` if RoomChat is nested in a larger repository; otherwise use the repository root.

**Install command:**

```bash
npm ci
```

**Build command:**

```bash
npm run build -w @chatroom/shared && npm run build -w @chatroom/client
```

**Output directory:**

```text
apps/client/dist
```

### Frontend environment variable

```dotenv
VITE_SOCKET_URL=https://roomchat-api.onrender.com/
```

### React Router support

Add `vercel.json` to the Vercel project root:

```json
{
  "rewrites": [
    {
      "source": "/((?!assets/).*)",
      "destination": "/index.html"
    }
  ]
}
```

## Production Verification

1. Confirm the frontend loads over HTTPS.
2. Confirm `/health` responds successfully.
3. Open the frontend on two devices.
4. Create a room.
5. Start the room.
6. Join from the second device.
7. Exchange messages.
8. Lock and close the room.
9. Review Render logs for unexpected errors.

## Known Hosting Limitations

RoomChat uses in-memory storage and is intended to run on one backend instance.

Restarting the backend removes active rooms.

Depending on the hosting plan, idle instances may spin down and require additional startup time.
