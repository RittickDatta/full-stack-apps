
import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";

import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "@chatroom/shared";

import { env } from "../config/env.js";

import {
  roomRepository,
} from "../repositories/room-repository.instance.js";

import {
  RoomService,
} from "../services/room.service.js";

import {
  registerRoomHandlers,
} from "./room.handlers.js";

import {
  registerChatHandlers,
} from "./chat.handlers.js";

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

  const roomService = new RoomService(roomRepository);

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

    socket.on("disconnect", (reason) => {
      console.log(
        `Socket disconnected: ${socket.id} (${reason})`,
      );
    });
  });

  return io;
}
