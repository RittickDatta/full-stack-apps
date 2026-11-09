import type { RoomErrorCode } from "@chatroom/shared";

const messages: Partial<Record<RoomErrorCode, string>> = {
  ROOM_NOT_FOUND: "We couldn't find that room. Check the code and try again.",

  ROOM_NOT_ACTIVE: "This room hasn't started yet. Ask the creator to start it.",

  ROOM_LOCKED: "This room is locked and isn't accepting new participants.",

  ROOM_CLOSED: "This room has been closed.",

  ROOM_FULL: "This room is full. Please try another room.",

  INVALID_PAYLOAD: "Please check your room code and display name.",

  NOT_AUTHORIZED: "You aren't authorized to join this room.",

  INTERNAL_ERROR: "Something went wrong on the server. Please try again.",

  RATE_LIMITED:
    "You're making requests too quickly. Please wait a moment and try again.",
};

export function getRoomErrorMessage(
  code: RoomErrorCode,
  fallback: string,
): string {
  return messages[code] ?? fallback;
}
