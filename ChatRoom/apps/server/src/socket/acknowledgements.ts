
import type {
  AckResult,
  RoomErrorCode,
} from "@chatroom/shared";

import type {
  RoomAck,
} from "./types.js";

export function ackSuccess<T>(
  data: T,
): AckResult<T> {
  return {
    success: true,
    data,
  };
}

export function ackError<T = never>(
  code: RoomErrorCode,
  message: string,
): AckResult<T> {
  return {
    success: false,
    error: {
      code,
      message,
    },
  };
}

export function createSafeAcknowledgement<T>(
  acknowledge: RoomAck<T>,
): RoomAck<T> {
  let acknowledged = false;

  return (result) => {
    if (acknowledged) {
      return;
    }

    acknowledged = true;
    acknowledge(result);
  };
}
