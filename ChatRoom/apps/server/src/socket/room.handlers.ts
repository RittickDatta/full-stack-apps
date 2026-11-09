import type { RoomService } from "../services/room.service.js";

import { ackError } from "./acknowledgements.js";
import { executeSocketHandler } from "./handler-wrapper.js";

import {
  assignSocketSession,
  isSocketInRoom,
  clearSocketSession,
} from "./socket-session.js";

import { RATE_LIMITS } from "../config/rate-limits.js";
import { consumeSocketRateLimit } from "./rate-limit.js";

import type { RoomSocket } from "./types.js";

export function registerRoomHandlers(
  socket: RoomSocket,
  roomService: RoomService,
): void {
  const pendingCreatedRoomCodes = new Set<string>();

  // CREATE ROOM

  socket.on("room:create", (payload, acknowledge) => {
    void executeSocketHandler("room:create", acknowledge, (ack) => {
      const limit = consumeSocketRateLimit(
        socket,
        "room:create",
        RATE_LIMITS.roomCreate,
      );

      if (!limit.allowed) {
        acknowledge({
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: "Too many room creation attempts. Please try again later.",
          },
        });

        return;
      }

      const result = roomService.createRoom(payload);

      if (result.success) {
        pendingCreatedRoomCodes.add(result.data.room.code);
      }

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

      pendingCreatedRoomCodes.delete(room.code);

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
      const limit = consumeSocketRateLimit(
        socket,
        "room:join",
        RATE_LIMITS.roomJoin,
      );

      if (!limit.allowed) {
        acknowledge({
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: "Too many join attempts. Please wait before trying again.",
          },
        });

        return;
      }

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

  // LEAVE ROOM
  socket.on("room:leave", (payload, acknowledge) => {
    void executeSocketHandler("room:leave", acknowledge, async (ack) => {
      const sessionRoomCode = socket.data.roomCode;
      const participantId = socket.data.participantId;

      if (
        !sessionRoomCode ||
        !participantId ||
        !socket.rooms.has(sessionRoomCode)
      ) {
        ack(ackError("NOT_AUTHORIZED", "You must be in a room to leave it."));
        return;
      }

      const requestedRoomCode =
        typeof payload?.roomCode === "string"
          ? payload.roomCode.trim().toUpperCase()
          : null;

      if (requestedRoomCode !== sessionRoomCode) {
        ack(ackError("NOT_AUTHORIZED", "You cannot leave another room."));
        return;
      }

      // Capture the current membership before removing it.
      const currentRoom = roomService.getRoomSnapshot(sessionRoomCode);

      const participant = currentRoom?.participants.find(
        (item) => item.id === participantId,
      );

      if (!participant) {
        ack(
          ackError(
            "PARTICIPANT_NOT_FOUND",
            "Participant not found in this room.",
          ),
        );
        return;
      }

      const result = roomService.leaveRoom(payload, participantId);

      if (!result.success) {
        ack(result);
        return;
      }

      // Immediately revoke this connection's room identity.
      clearSocketSession(socket);

      // Remove the Socket.IO room membership.
      await socket.leave(sessionRoomCode);

      const updatedRoom = roomService.getRoomSnapshot(sessionRoomCode);

      // A successful leave is acknowledged even if the room
      // no longer has any connected participants.
      ack(result);

      socket.nsp.to(sessionRoomCode).emit("participant:left", {
        roomCode: sessionRoomCode,
        participantId,
        // displayName: participant.displayName,
      });

      if (updatedRoom) {
        socket.nsp
          .to(sessionRoomCode)
          .emit("room:updated", { room: updatedRoom });
      }
    });
  });

  socket.on("room:close", (payload, acknowledge) => {
    void executeSocketHandler("room:close", acknowledge, async (ack) => {
      const requestedRoomCode =
        typeof payload?.roomCode === "string"
          ? payload.roomCode.trim().toUpperCase()
          : null;

      if (!requestedRoomCode) {
        ack(ackError("INVALID_PAYLOAD", "Invalid room code."));
        return;
      }

      const currentRoom = roomService.getRoomSnapshot(requestedRoomCode);

      if (!currentRoom) {
        ack(ackError("ROOM_NOT_FOUND", "Room not found."));
        return;
      }

      if (currentRoom.status === "closed") {
        ack(ackError("ROOM_CLOSED", "This room is already closed."));
        return;
      }

      const isPendingCreator =
        currentRoom.status === "created" &&
        pendingCreatedRoomCodes.has(requestedRoomCode);

      const isJoinedCreator =
        (currentRoom.status === "active" || currentRoom.status === "locked") &&
        socket.data.roomCode === requestedRoomCode &&
        Boolean(socket.data.participantId) &&
        socket.data.isCreator === true &&
        socket.rooms.has(requestedRoomCode) &&
        currentRoom.participants.some(
          (participant) =>
            participant.id === socket.data.participantId &&
            participant.role === "creator",
        );

      if (!isPendingCreator && !isJoinedCreator) {
        ack(
          ackError(
            "NOT_AUTHORIZED",
            "Only the room creator can close this room.",
          ),
        );
        return;
      }

      const result = roomService.closeRoom(payload);

      if (!result.success) {
        ack(result);
        return;
      }

      pendingCreatedRoomCodes.delete(requestedRoomCode);

      // Notify everyone before removing their room membership.
      socket.nsp.to(requestedRoomCode).emit("room:closed", {
        roomCode: requestedRoomCode,
        reason: "creator_closed",
      });

      // Clear sessions for all currently joined sockets.
      for (const joinedSocket of socket.nsp.sockets.values()) {
        if (!joinedSocket.rooms.has(requestedRoomCode)) {
          continue;
        }

        clearSocketSession(joinedSocket);
      }

      // Remove all sockets from the closed room.
      socket.nsp.in(requestedRoomCode).socketsLeave(requestedRoomCode);

      ack(result);
    });
  });
}
