import type { Socket } from "socket.io";

import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "@chatroom/shared";

import type { RoomService } from "../services/room.service.js";

type RoomSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

function isAlreadyInRoom(socket: RoomSocket): boolean {
  return Boolean(socket.data.roomCode || socket.data.participantId);
}

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
        error instanceof Error ? error.message : "Unknown error",
      );

      acknowledge({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Unable to create the room. Please try again.",
        },
      });
    }
  });

  socket.on("room:start", async (payload, acknowledge) => {
    if (isAlreadyInRoom(socket)) {
      acknowledge({
        success: false,
        error: {
          code: "NOT_AUTHORIZED",
          message: "This connection is already in a room.",
        },
      });
      return;
    }

    try {
      const result = roomService.startRoom(payload);

      if (!result.success) {
        acknowledge(result);
        return;
      }

      const roomCode = result.data.room.code;

      await socket.join(roomCode);

      socket.data.roomCode = roomCode;
      socket.data.participantId = result.data.participantId;
      socket.data.isCreator = true;

      acknowledge(result);

      socket.to(roomCode).emit("room:updated", {
        room: result.data.room,
      });
    } catch (error) {
      console.error(
        "Room start failed:",
        error instanceof Error ? error.message : "Unknown error",
      );

      acknowledge({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Unable to start the room. Please try again.",
        },
      });
    }
  });

  
socket.on("room:join", async (payload, acknowledge) => {
  if (isAlreadyInRoom(socket)) {
    acknowledge({
      success: false,
      error: {
        code: "NOT_AUTHORIZED",
        message: "This connection is already in a room.",
      },
    });
    return;
  }

  try {
    const result = roomService.joinRoom(payload);

    if (!result.success) {
      acknowledge(result);
      return;
    }

    const { room, participantId } = result.data;

    const participant = room.participants.find(
      (item) => item.id === participantId,
    );

    if (!participant) {
      roomService.removeJoinedParticipant(
        room.code,
        participantId,
      );

      acknowledge({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Unable to initialize participant.",
        },
      });
      return;
    }

    try {
      await socket.join(room.code);
    } catch (error) {
      roomService.removeJoinedParticipant(
        room.code,
        participantId,
      );

      throw error;
    }

    socket.data.roomCode = room.code;
    socket.data.participantId = participantId;
    socket.data.isCreator = false;

    acknowledge(result);

    socket.to(room.code).emit("participant:joined", {
      roomCode: room.code,
      participant,
    });

    socket.to(room.code).emit("room:updated", {
      room: {
        code: room.code,
        status: room.status,
        participantCount: room.participantCount,
        maxParticipants: room.maxParticipants,
        createdAt: room.createdAt,
        startedAt: room.startedAt,
      },
    });
  } catch (error) {
    console.error(
      "Room join failed:",
      error instanceof Error
        ? error.message
        : "Unknown error",
    );

    acknowledge({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Unable to join the room.",
      },
    });
  }
});

}
