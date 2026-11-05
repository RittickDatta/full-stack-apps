
import type {
  RoomCleanupService,
  ExpiredRoom,
} from "./room-cleanup.service.js";

import {
  DEFAULT_ROOM_LIFECYCLE_CONFIG,
  type RoomLifecycleConfig,
} from "../config/room-lifecycle.js";

export function startRoomCleanupScheduler(
  cleanupService: RoomCleanupService,
  config: RoomLifecycleConfig =
    DEFAULT_ROOM_LIFECYCLE_CONFIG,
  onExpired?: (room: ExpiredRoom) => void,
): () => void {
  const timer = setInterval(() => {
    try {
      const expired =
        cleanupService.cleanupExpiredRooms();

      for (const room of expired) {
        console.log(
          `[cleanup] Removed room ${room.roomCode} (${room.reason})`,
        );

        onExpired?.(room);
      }
    } catch (error) {
      console.error(
        "[cleanup] Room cleanup failed:",
        error,
      );
    }
  }, config.cleanupIntervalMs);

  // Do not keep the Node.js process alive
  // solely because of this background timer.
  timer.unref();

  return () => clearInterval(timer);
}
