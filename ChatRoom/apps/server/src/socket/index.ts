
import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";

import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "@chatroom/shared";

import { env } from "../config/env.js";

export function createSocketServer(httpServer: HttpServer) {
  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: env.CLIENT_ORIGIN,
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.emit("connection:ready", {
      socketId: socket.id,
      connectedAt: new Date().toISOString(),
    });

    socket.on("connection:ping", (payload, acknowledge) => {
      const message =
        typeof payload?.message === "string"
          ? payload.message.slice(0, 100)
          : "";

      console.log(`Ping from ${socket.id}: ${message}`);

      acknowledge({
        success: true,
        message: `Server received: ${message}`,
        receivedAt: new Date().toISOString(),
      });
    });

    socket.on("disconnect", (reason) => {
      console.log(
        `Socket disconnected: ${socket.id} (${reason})`,
      );
    });
  });

  return io;
}
