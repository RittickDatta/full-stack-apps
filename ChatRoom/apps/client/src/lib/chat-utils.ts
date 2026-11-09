
import type {
  RoomMessage,
  RoomSnapshot,
  RoomSummary,
} from "@chatroom/shared";

export function isRoomSnapshot(
  room: RoomSummary | RoomSnapshot,
): room is RoomSnapshot {
  return (
    "messages" in room &&
    Array.isArray(room.messages) &&
    "participants" in room &&
    Array.isArray(room.participants)
  );
}

export function getRoomMessages(
  room: RoomSummary | RoomSnapshot,
): RoomMessage[] {
  return isRoomSnapshot(room)
    ? room.messages
    : [];
}


export function appendUniqueMessage(
  messages: RoomMessage[],
  incoming: RoomMessage,
): RoomMessage[] {
  if (messages.some((message) => message.id === incoming.id)) {
    return messages;
  }

  return [...messages, incoming].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() -
      new Date(b.createdAt).getTime(),
  );
}


export function formatMessageTime(
  timestamp: string,
): string {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
