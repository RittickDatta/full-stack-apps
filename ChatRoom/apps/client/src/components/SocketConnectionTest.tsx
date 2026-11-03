
import { useState } from "react";
import {
  CheckCircle2,
  LoaderCircle,
  Send,
  Wifi,
  WifiOff,
} from "lucide-react";

import { socket } from "../lib/socket";
import { useSocketConnection } from "../hooks/useSocketConnection";

export function SocketConnectionTest() {
  const { status, connectionInfo, error } =
    useSocketConnection();

  const [response, setResponse] = useState<string | null>(
    null,
  );

  const [sending, setSending] = useState(false);

  const isConnected = status === "connected";

  async function sendPing() {
    if (!socket.connected || sending) return;

    setSending(true);
    setResponse(null);

    try {
      const acknowledgement = await socket
        .timeout(5000)
        .emitWithAck("connection:ping", {
          message: "Hello from React!",
        });

      setResponse(acknowledgement.message);
    } catch {
      setResponse(
        "The server did not acknowledge the ping in time.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="mx-auto mt-10 max-w-xl rounded-2xl border border-app-border bg-app-surface p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-xl bg-app-surface-secondary text-app-primary">
          {isConnected ? (
            <Wifi size={22} strokeWidth={1.75} />
          ) : (
            <WifiOff size={22} strokeWidth={1.75} />
          )}
        </div>

        <div>
          <h2 className="font-bold">
            Real-time Connection Test
          </h2>
          <p className="text-sm text-app-text-muted">
            Socket.IO · RC-004
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-app-surface-secondary p-4">
        <div className="flex items-center gap-2">
          <span
            className={`size-2.5 rounded-full ${
              isConnected
                ? "bg-green-500"
                : status === "connecting"
                  ? "bg-amber-500"
                  : "bg-red-500"
            }`}
          />

          <span
            className="text-sm font-semibold capitalize"
            role="status"
          >
            {status}
          </span>
        </div>

        {connectionInfo && (
          <p className="mt-3 break-all text-xs text-app-text-muted">
            Socket ID: {connectionInfo.socketId}
          </p>
        )}

        {error && (
          <p className="mt-3 text-sm text-red-500" role="alert">
            {error}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={sendPing}
        disabled={!isConnected || sending}
        className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-app-primary px-4 py-3 font-semibold text-white transition-colors hover:bg-app-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {sending ? (
          <LoaderCircle
            size={18}
            className="animate-spin"
          />
        ) : (
          <Send size={18} />
        )}

        {sending ? "Sending..." : "Send Test Ping"}
      </button>

      {response && (
        <div
          role="status"
          className="mt-4 flex items-start gap-2 rounded-xl border border-app-border p-4"
        >
          <CheckCircle2
            size={18}
            className="mt-0.5 shrink-0 text-green-500"
          />

          <p className="wrap-break-word text-sm">{response}</p>
        </div>
      )}
    </section>
  );
}
