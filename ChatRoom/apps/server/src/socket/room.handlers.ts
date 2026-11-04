import type { RoomService } from "../services/room.service.js";

import { ackError } from "./acknowledgements.js";
import { executeSocketHandler } from "./handler-wrapper.js";

import { assignSocketSession, isSocketInRoom } from "./socket-session.js";

import type { RoomSocket } from "./types.js";

export function registerRoomHandlers(
  socket: RoomSocket,
  roomService: RoomService,
): void {
  // CREATE ROOM
  socket.on("room:create", (payload, acknowledge) => {
    void executeSocketHandler("room:create", acknowledge, (ack) => {
      const result = roomService.createRoom(payload);
      ack(result);
    });
  });

  // START ROOM
  socket.on("room:start", (payload, acknowledge) => {
    void executeSocketHandler("room:start", acknowledge, async (ack) => {
      if (isSocketInRoom(socket)) {
        ack(
          ackError("NOT_AUTHORIZED", "This connection is already in a room."),
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

      const updatedRoom = roomService.setParticipantPresence(
        room.code,
        participantId,
        true,
      );

      if (!updatedRoom) {
        ack(ackError("INTERNAL_ERROR", "Unable to update creator presence."));
        return;
      }

      ack({
        success: true,
        data: {
          room: updatedRoom,
          participantId,
        },
      });

      socket.to(room.code).emit("room:updated", {
        room: updatedRoom,
      });
    });
  });

  // JOIN ROOM
  socket.on("room:join", (payload, acknowledge) => {
    void executeSocketHandler("room:join", acknowledge, async (ack) => {
      if (isSocketInRoom(socket)) {
        ack(
          ackError("NOT_AUTHORIZED", "This connection is already in a room."),
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
        roomService.removeJoinedParticipant(room.code, participantId);

        ack(ackError("INTERNAL_ERROR", "Unable to initialize participant."));
        return;
      }

      try {
        await socket.join(room.code);
      } catch (error) {
        roomService.removeJoinedParticipant(room.code, participantId);

        throw error;
      }

      assignSocketSession(socket, {
        roomCode: room.code,
        participantId,
        isCreator: false,
      });

      const updatedRoom = roomService.setParticipantPresence(
        room.code,
        participantId,
        true,
      );

      if (!updatedRoom) {
        ack(
          ackError("INTERNAL_ERROR", "Unable to update participant presence."),
        );
        return;
      }

      ack({
        success: true,
        data: {
          room: updatedRoom,
          participantId,
        },
      });

      socket.to(room.code).emit("participant:joined", {
        roomCode: room.code,
        participant,
      });

      socket.to(room.code).emit("room:updated", {
        room: updatedRoom,
      });
    });
  });

  // LOCK ROOM
  socket.on("room:lock", (payload, acknowledge) => {
    void executeSocketHandler("room:lock", acknowledge, (ack) => {
      const sessionRoomCode = socket.data.roomCode;
      const participantId = socket.data.participantId;

      if (
        !sessionRoomCode ||
        !participantId ||
        socket.data.isCreator !== true ||
        !socket.rooms.has(sessionRoomCode)
      ) {
        ack(
          ackError(
            "NOT_AUTHORIZED",
            "Only the connected room creator can lock this room.",
          ),
        );
        return;
      }

      const requestedRoomCode =
        typeof payload?.roomCode === "string"
          ? payload.roomCode.trim().toUpperCase()
          : null;

      if (requestedRoomCode !== sessionRoomCode) {
        ack(ackError("NOT_AUTHORIZED", "You cannot lock another room."));
        return;
      }

      const result = roomService.lockRoom(payload);

      if (!result.success) {
        ack(result);
        return;
      }

      // The service returns a summary.
      // The broadcast needs a complete room snapshot.
      const snapshot = roomService.getRoomSnapshot(sessionRoomCode);

      if (snapshot) {
        socket.nsp.to(sessionRoomCode).emit("room:updated", { room: snapshot });
      }

      ack(result);
    });
  });
}
