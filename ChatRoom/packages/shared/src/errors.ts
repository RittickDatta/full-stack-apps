
export const ROOM_ERROR_CODES = [
  "INVALID_PAYLOAD",
  "ROOM_NOT_FOUND",
  "ROOM_NOT_ACTIVE",
  "ROOM_LOCKED",
  "ROOM_CLOSED",
  "ROOM_FULL",
  "NOT_AUTHORIZED",
  "PARTICIPANT_NOT_FOUND",
  "ALREADY_STARTED",
  "RATE_LIMITED",
  "INTERNAL_ERROR",
] as const;

export type RoomErrorCode =
  (typeof ROOM_ERROR_CODES)[number];

export interface RoomError {
  code: RoomErrorCode;
  message: string;
}

export type AckResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: RoomError;
    };
