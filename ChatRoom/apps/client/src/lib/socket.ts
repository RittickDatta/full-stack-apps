import { io, type Socket } from "socket.io-client";

import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@chatroom/shared";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ??
  "http://localhost:3001";

export type RoomClientSocket = Socket<
  ServerToClientEvents,
  ClientToServerEvents
>;

export const socket: RoomClientSocket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 10000,
  transports: ["websocket"],
});
