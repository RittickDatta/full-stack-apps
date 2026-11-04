
import type { RoomService } from "../services/room.service.js";
import type { RoomSocket } from "./types.js";

export function registerPresenceHandlers(
  socket: RoomSocket,
  roomService: RoomService,
): void {
  socket.on("disconnect", (reason) => {
    const roomCode = socket.data.roomCode;
    const participantId = socket.data.participantId;

    if (!roomCode || !participantId) {
      return;
    }

    try {
      const updatedRoom =
        roomService.setParticipantPresence(
          roomCode,
          participantId,
          false,
        );

      if (!updatedRoom) {
        return;
      }

      // Use the namespace, not socket.to(...).
      // The disconnected socket has already left its rooms.
      socket.nsp.to(roomCode).emit("room:updated", {
        room: updatedRoom,
      });

      console.log(
        `Participant ${participantId} disconnected (${reason})`,
      );
    } catch (error) {
      console.error(
        "Presence disconnect handling failed:",
        error instanceof Error
          ? error.message
          : "Unknown error",
      );
    }
  });
}
