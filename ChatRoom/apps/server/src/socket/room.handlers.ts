
import type { RoomService } from "../services/room.service.js";

import {
  ackError,
} from "./acknowledgements.js";
import { executeSocketHandler } from "./handler-wrapper.js";



import {
  assignSocketSession,
  isSocketInRoom,
} from "./socket-session.js";

import type {
  RoomSocket,
} from "./types.js";

export function registerRoomHandlers(
  socket: RoomSocket,
  roomService: RoomService,
): void {
  // CREATE ROOM
  socket.on("room:create", (payload, acknowledge) => {
    void executeSocketHandler(
      "room:create",
      acknowledge,
      (ack) => {
        const result = roomService.createRoom(payload);
        ack(result);
      },
    );
  });

  // START ROOM
  socket.on("room:start", (payload, acknowledge) => {
    void executeSocketHandler(
      "room:start",
      acknowledge,
      async (ack) => {
        if (isSocketInRoom(socket)) {
          ack(
            ackError(
              "NOT_AUTHORIZED",
              "This connection is already in a room.",
            ),
          );
          return;
        }

        const result = roomService.startRoom(payload);

        if (!result.success) {
          ack(result);
          return;
        }

        const { room, participantId } = result.data;

        await socket.join(room.code);

        assignSocketSession(socket, {
          roomCode: room.code,
          participantId,
          isCreator: true,
        });

        ack(result);

        socket.to(room.code).emit("room:updated", {
          room,
        });
      },
    );
  });

  // JOIN ROOM
  socket.on("room:join", (payload, acknowledge) => {
    void executeSocketHandler(
      "room:join",
      acknowledge,
      async (ack) => {
        if (isSocketInRoom(socket)) {
          ack(
            ackError(
              "NOT_AUTHORIZED",
              "This connection is already in a room.",
            ),
          );
          return;
        }

        const result = roomService.joinRoom(payload);

        if (!result.success) {
          ack(result);
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

          ack(
            ackError(
              "INTERNAL_ERROR",
              "Unable to initialize participant.",
            ),
          );
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

        assignSocketSession(socket, {
          roomCode: room.code,
          participantId,
          isCreator: false,
        });

        ack(result);

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
      },
    );
  });
}
