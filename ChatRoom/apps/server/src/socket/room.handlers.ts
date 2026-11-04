
import type { Socket } from "socket.io";

import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "@chatroom/shared";

import type {
  RoomService,
} from "../services/room.service.js";

type RoomSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export function registerRoomHandlers(
  socket: RoomSocket,
  roomService: RoomService,
): void {
  socket.on("room:create", (payload, acknowledge) => {
    try {
      const result = roomService.createRoom(payload);

      acknowledge(result);
    } catch (error) {
      console.error(
        "Room creation failed:",
        error instanceof Error
          ? error.message
          : "Unknown error",
      );

      acknowledge({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message:
            "Unable to create the room. Please try again.",
        },
      });
    }
  });

  socket.on("room:start", async (payload, acknowledge) => {
    try {
      const result = roomService.startRoom(payload);

      if (!result.success) {
        acknowledge(result);
        return;
      }

      const roomCode = result.data.room.code;

      await socket.join(roomCode);

      socket.data.roomCode = roomCode;
      socket.data.participantId =
        result.data.participantId;
      socket.data.isCreator = true;

      acknowledge(result);

      socket.to(roomCode).emit("room:updated", {
        room: result.data.room,
      });
    } catch (error) {
      console.error(
        "Room start failed:",
        error instanceof Error
          ? error.message
          : "Unknown error",
      );

      acknowledge({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message:
            "Unable to start the room. Please try again.",
        },
      });
    }
  });
}
