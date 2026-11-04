
import type {
  RoomSocket,
} from "./types.js";

export function isSocketInRoom(
  socket: RoomSocket,
): boolean {
  return Boolean(
    socket.data.roomCode ||
    socket.data.participantId,
  );
}

export function assignSocketSession(
  socket: RoomSocket,
  options: {
    roomCode: string;
    participantId: string;
    isCreator: boolean;
  },
): void {
  socket.data.roomCode = options.roomCode;
  socket.data.participantId = options.participantId;
  socket.data.isCreator = options.isCreator;
}

export function clearSocketSession(
  socket: RoomSocket,
): void {
  delete socket.data.roomCode;
  delete socket.data.participantId;
  delete socket.data.isCreator;
}
