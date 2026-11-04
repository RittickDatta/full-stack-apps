
import type {
  AckResult,
} from "@chatroom/shared";

import {
  ackError,
  createSafeAcknowledgement,
} from "./acknowledgements.js";

import type {
  RoomAck,
} from "./types.js";

type HandlerOperation<T> = (
  acknowledge: RoomAck<T>,
) => Promise<void> | void;

export async function executeSocketHandler<T>(
  eventName: string,
  acknowledge: RoomAck<T>,
  operation: HandlerOperation<T>,
): Promise<void> {
  const safeAck =
    createSafeAcknowledgement(acknowledge);

  try {
    await operation(safeAck);
  } catch (error) {
    console.error(
      `[Socket.IO] ${eventName} failed:`,
      error instanceof Error
        ? error.message
        : "Unknown error",
    );

    const result: AckResult<T> = ackError(
      "INTERNAL_ERROR",
      "An unexpected server error occurred.",
    );

    safeAck(result);
  }
}
