
export interface RoomLifecycleConfig {
  unstartedRoomTtlMs: number;
  emptyRoomTtlMs: number;
  closedRoomTtlMs: number;
  cleanupIntervalMs: number;
}

export const DEFAULT_ROOM_LIFECYCLE_CONFIG:
  RoomLifecycleConfig = {
    unstartedRoomTtlMs: 15 * 60 * 1000,
    emptyRoomTtlMs: 30 * 60 * 1000,
    closedRoomTtlMs: 5 * 60 * 1000,
    cleanupIntervalMs: 60 * 1000,
  };
