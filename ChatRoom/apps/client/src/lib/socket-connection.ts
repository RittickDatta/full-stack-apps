
import {
  socket,
} from "./socket";

export function ensureSocketConnected(): Promise<void> {
  if (socket.connected) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(
        new Error(
          "Connection timed out. Please try again.",
        ),
      );
    }, 10000);

    function cleanup() {
      window.clearTimeout(timeout);
      socket.off("connect", onConnect);
      socket.off("connect_error", onError);
    }

    function onConnect() {
      cleanup();
      resolve();
    }

    function onError() {
      cleanup();
      reject(
        new Error(
          "Unable to connect to the chat server.",
        ),
      );
    }

    socket.once("connect", onConnect);
    socket.once("connect_error", onError);

    if (!socket.active) {
      socket.connect();
    }
  });
}
