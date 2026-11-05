
import type { RoomSocket } from "./types.js";
import type { RoomService } from "../services/room.service.js";

export function registerPresenceHandlers(
  socket: RoomSocket,
  roomService: RoomService,
): void {
  socket.on("disconnect", () => {
    const roomCode = socket.data.roomCode;
    const participantId = socket.data.participantId;

    if (!roomCode || !participantId) {
      return;
    }

    const updatedRoom = roomService.setParticipantPresence(
      roomCode,
      participantId,
      false,
    );

    if (!updatedRoom) {
      return;
    }

    socket.nsp.to(roomCode).emit("room:updated", {
      room: updatedRoom,
    });
  });
}
