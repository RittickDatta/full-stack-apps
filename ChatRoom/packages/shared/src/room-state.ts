
import type { RoomStatus } from "./room.js";

export const ROOM_TRANSITIONS: Readonly<
  Record<RoomStatus, readonly RoomStatus[]>
> = {
  created: ["active", "closed"],
  active: ["locked", "closed"],
  locked: ["closed"],
  closed: [],
};

export function canTransitionRoom(
  current: RoomStatus,
  next: RoomStatus,
): boolean {
  return ROOM_TRANSITIONS[current].includes(next);
}

export function assertRoomTransition(
  current: RoomStatus,
  next: RoomStatus,
): void {
  if (!canTransitionRoom(current, next)) {
    throw new Error(
      `Invalid room transition: ${current} -> ${next}`,
    );
  }
}

export function canJoinRoom(
  status: RoomStatus,
): boolean {
  return status === "active";
}

export function canSendMessage(
  status: RoomStatus,
): boolean {
  return status === "active" || status === "locked";
}

export function canLockRoom(
  status: RoomStatus,
): boolean {
  return status === "active";
}

export function canStartRoom(
  status: RoomStatus,
): boolean {
  return status === "created";
}

export function isRoomClosed(
  status: RoomStatus,
): boolean {
  return status === "closed";
}
