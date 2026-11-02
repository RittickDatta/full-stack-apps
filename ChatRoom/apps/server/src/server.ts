import { createServer } from "http";

import { app } from "./app.js";
import { env } from "./config/env.js";

const httpServer = createServer(app);

httpServer.listen(env.PORT, () => {
  console.log(`ChatRoom server running at http://localhost:${env.PORT}`);

  console.log(`Environment: ${env.NODE_ENV}`);
});

function shutdown(signal: string) {
  console.log(`${signal} received, shutting down server...`);

  httpServer.close((err) => {
    if (err) {
      console.error("Error closing HTTP server:", err);
      process.exitCode = 1;
    }

    process.exit();
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
