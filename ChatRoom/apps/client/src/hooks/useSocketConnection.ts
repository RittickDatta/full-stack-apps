
import { useEffect, useState } from "react";

import type {
  ConnectionInfo,
} from "@chatroom/shared/socket-events";

import { socket } from "../lib/socket";

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export function useSocketConnection() {
  const [status, setStatus] =
    useState<ConnectionStatus>("connecting");

  const [connectionInfo, setConnectionInfo] =
    useState<ConnectionInfo | null>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onConnect() {
      setStatus("connected");
      setError(null);
    }

    function onDisconnect() {
      setStatus("disconnected");
      setConnectionInfo(null);
    }

    function onConnectError(err: Error) {
      setStatus("error");
      setError(err.message);
    }

    function onReady(info: ConnectionInfo) {
      setConnectionInfo(info);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("connection:ready", onReady);

    if (socket.connected) {
      onConnect();
    } else {
      setStatus("connecting");
      socket.connect();
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("connection:ready", onReady);

      socket.disconnect();
    };
  }, []);

  return {
    status,
    connectionInfo,
    error,
  };
}
