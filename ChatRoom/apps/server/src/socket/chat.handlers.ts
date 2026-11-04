
import type { RoomService } from "../services/room.service.js";

import { ackError } from "./acknowledgements.js";
import { executeSocketHandler } from "./handler-wrapper.js";

import type { RoomSocket } from "./types.js";

export function registerChatHandlers(
  socket: RoomSocket,
  roomService: RoomService,
): void {
  socket.on("chat:send", (payload, acknowledge) => {
    void executeSocketHandler(
      "chat:send",
      acknowledge,
      (ack) => {
        const sessionRoomCode = socket.data.roomCode;
        const participantId = socket.data.participantId;

        if (
          !sessionRoomCode ||
          !participantId ||
          !socket.rooms.has(sessionRoomCode)
        ) {
          ack(
            ackError(
              "NOT_AUTHORIZED",
              "You must join a room before sending messages.",
            ),
          );
          return;
        }

        const requestedRoomCode =
          typeof payload?.roomCode === "string"
            ? payload.roomCode.trim().toUpperCase()
            : null;

        if (requestedRoomCode !== sessionRoomCode) {
          ack(
            ackError(
              "NOT_AUTHORIZED",
              "You cannot send messages to another room.",
            ),
          );
          return;
        }

        const result = roomService.sendMessage(
          payload,
          participantId,
        );

        if (!result.success) {
          ack(result);
          return;
        }

        socket.nsp
          .to(sessionRoomCode)
          .emit("chat:message", result.data);

        ack(result);
      },
    );
  });
}
