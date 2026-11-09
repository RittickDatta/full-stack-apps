import { createServer } from "node:http";

import { app } from "./app.js";
import { env } from "./config/env.js";
import { createSocketServer } from "./socket/index.js";

const httpServer = createServer(app);
const { io, stopCleanupScheduler, rateLimitCleanupInterval } =
  createSocketServer(httpServer);

httpServer.listen(env.PORT, () => {
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
