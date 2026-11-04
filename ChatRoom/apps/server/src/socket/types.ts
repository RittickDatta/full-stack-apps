
import type { Socket } from "socket.io";

import type {
  AckResult,
  ClientToServerEvents,
  InterServerEvents,
  RoomErrorCode,
  ServerToClientEvents,
  SocketData,
} from "@chatroom/shared";

export type RoomSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export type RoomAck<T> = (
  result: AckResult<T>,
) => void;

export interface SocketHandlerError {
  code: RoomErrorCode;
  message: string;
}
