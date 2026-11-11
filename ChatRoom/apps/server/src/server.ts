import { createServer } from "node:http";

import { app } from "./app.js";
import { env } from "./config/env.js";
import { createSocketServer } from "./socket/index.js";

const httpServer = createServer(app);
const { io, stopCleanupScheduler, rateLimitCleanupInterval } =
  createSocketServer(httpServer);

const port = Number(process.env.PORT ?? 3001);
if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be a valid TCP port");
}

httpServer.listen(port, "0.0.0.0", () => {
  console.log(`ChatRoom server running at http://localhost:${env.PORT}`);

  console.log(`Socket.IO ready on port ${env.PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);
});

let shuttingDown = false;

function shutdown(signal: string) {
  if (shuttingDown) return;

  shuttingDown = true;
  console.log(`${signal} received. Shutting down...`);

  io.close((error?: Error) => {
    if (error) {
      console.error("Shutdown error:", error);
      process.exitCode = 1;
    }

    stopCleanupScheduler();
    clearInterval(rateLimitCleanupInterval);

    console.log("Socket.IO and HTTP server closed.");
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
