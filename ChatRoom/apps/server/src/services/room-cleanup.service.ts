
import type {
  RoomRepository,
} from "../repositories/room.repository.js";

import type {
  RoomRecord,
} from "../repositories/room-record.js";

import {
  DEFAULT_ROOM_LIFECYCLE_CONFIG,
  type RoomLifecycleConfig,
} from "../config/room-lifecycle.js";

export type RoomExpirationReason =
  | "unstarted"
  | "empty"
  | "closed";

export interface ExpiredRoom {
  roomCode: string;
  reason: RoomExpirationReason;
}

export class RoomCleanupService {
  constructor(
    private readonly repository: RoomRepository,
    private readonly config: RoomLifecycleConfig =
      DEFAULT_ROOM_LIFECYCLE_CONFIG,
    private readonly now: () => number = Date.now,
  ) {}

  findExpirationReason(
    room: RoomRecord,
  ): RoomExpirationReason | null {
    const now = this.now();

    if (room.status === "created") {
      const age =
        now - Date.parse(room.createdAt);

      return age >= this.config.unstartedRoomTtlMs
        ? "unstarted"
        : null;
    }

    if (room.status === "closed") {
      const closedAt =
        room.closedAt ?? room.createdAt;

      const age = now - Date.parse(closedAt);

      return age >= this.config.closedRoomTtlMs
        ? "closed"
        : null;
    }

    if (
      room.status === "active" ||
      room.status === "locked"
    ) {
      const hasConnectedParticipants = [
        ...room.participants.values(),
      ].some((participant) => participant.isConnected);

      if (hasConnectedParticipants) {
        return null;
      }

      const emptySince =
        room.emptySince ??
        room.startedAt ??
        room.createdAt;

      const age = now - Date.parse(emptySince);

      return age >= this.config.emptyRoomTtlMs
        ? "empty"
        : null;
    }

    return null;
  }

  cleanupExpiredRooms(): ExpiredRoom[] {
    const expired: ExpiredRoom[] = [];

    for (const room of this.repository.findAll()) {
      const reason = this.findExpirationReason(room);

      if (!reason) continue;

      // Recheck immediately before deletion.
      const current =
        this.repository.findByCode(room.code);

      if (!current) continue;

      const currentReason =
        this.findExpirationReason(current);

      if (!currentReason) continue;

      const deleted = this.repository.delete(
        current.code,
      );

      if (!deleted) continue;

      expired.push({
        roomCode: current.code,
        reason: currentReason,
      });
    }

    return expired;
  }
}
