
import { useState } from "react";

import { Button } from "../ui/Button";

import {
  useRoomSession,
} from "../../hooks/useRoomSession";

export function CreatorLobby() {
  const {
    session,
    startRoom,
    isBusy,
    error,
  } = useRoomSession();

  const [copied, setCopied] = useState(false);

  if (!session) return null;

  async function copyRoomCode() {
    if (!session) return;

    try {
      await navigator.clipboard.writeText(
        session.roomCode,
      );

      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const isCreated = session.phase === "created";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Creator lobby
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            {isCreated
              ? "Your room is ready!"
              : "Your room is active"}
          </h1>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            isCreated
              ? "bg-amber-100 text-amber-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          {isCreated ? "Waiting to start" : "Active"}
        </span>
      </div>

      <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-700">
          Room code
        </p>

        <p className="mt-4 break-all font-mono text-4xl font-extrabold tracking-widest text-slate-900 sm:text-5xl">
          {session.roomCode}
        </p>

        <button
          type="button"
          onClick={copyRoomCode}
          className="mt-5 rounded-lg border border-indigo-200 bg-white px-5 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          {copied ? "Copied!" : "Copy room code"}
        </button>

        <p
          aria-live="polite"
          className="mt-3 text-sm text-indigo-700"
        >
          {copied
            ? "Room code copied to clipboard."
            : "Share this code with your friends."}
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm text-slate-600">
          Signed in as{" "}
          <span className="font-semibold text-slate-900">
            {session.displayName}
          </span>
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {isCreated ? (
        <div className="space-y-3">
          <Button
            type="button"
            fullWidth
            disabled={isBusy}
            onClick={() => {
              void startRoom();
            }}
          >
            {isBusy ? "Starting room..." : "Start room"}
          </Button>

          <p className="text-center text-sm text-slate-500">
            Start the room when you're ready to begin
            the conversation.
          </p>
        </div>
      ) : (
        <div
          role="status"
          className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
        >
          Your room is active. The full chat interface
          will be implemented in RC-022.
        </div>
      )}
    </div>
  );
}
