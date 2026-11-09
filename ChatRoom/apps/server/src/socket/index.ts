import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";

import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "@chatroom/shared";

import { env } from "../config/env.js";

import { roomRepository } from "../repositories/room-repository.instance.js";

import { RoomService } from "../services/room.service.js";

import { registerRoomHandlers } from "./room.handlers.js";

import { registerChatHandlers } from "./chat.handlers.js";

import { registerPresenceHandlers } from "./presence.handlers.js";

import { RoomCleanupService } from "../services/room-cleanup.service.js";

import { startRoomCleanupScheduler } from "../services/room-cleanup.scheduler.js";
import { clearSocketSession } from "./socket-session.js";
import { rateLimitService } from "./rate-limit.js";

export function createSocketServer(httpServer: HttpServer) {
  const allowedOrigins = (process.env.CLIENT_ORIGIN ?? "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
    maxHttpBufferSize: 16 * 1024,

    allowRequest: (request, callback) => {
      const origin = request.headers.origin;

      if (typeof origin !== "string" || !allowedOrigins.includes(origin)) {
        callback("Origin not allowed", false);
        return;
      }

      callback(null, true);
    },
  });

  const rateLimitCleanupInterval = setInterval(() => {
    rateLimitService.cleanup();
  }, 60_000);
  rateLimitCleanupInterval.unref();

  const roomService = new RoomService(roomRepository);

  const cleanupService = new RoomCleanupService(roomRepository);

  const stopCleanupScheduler = startRoomCleanupScheduler(
    cleanupService,
    undefined,
    (expiredRoom) => {
      const { roomCode } = expiredRoom;

      for (const connectedSocket of io.sockets.sockets.values()) {
        if (connectedSocket.data.roomCode === roomCode) {
          clearSocketSession(connectedSocket);
        }

        if (connectedSocket.rooms.has(roomCode)) {
          connectedSocket.leave(roomCode);
        }
      }
    },
  );

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

      acknowledge({
        success: true,
        message: `Server received: ${message}`,
        receivedAt: new Date().toISOString(),
      });
    });

    registerRoomHandlers(socket, roomService);
    registerChatHandlers(socket, roomService);
    registerPresenceHandlers(socket, roomService);

    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  return { io, stopCleanupScheduler, rateLimitCleanupInterval };
}
