
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useRoomSession } from "../../hooks/useRoomSession";
import { RoomActionDialog } from "./RoomActionDialog";

type CreatorAction = "lock" | "close" | null;

export function CreatorControls() {
  const navigate = useNavigate();

  const {
    session,
    isBusy,
    error,
    lockRoom,
    closeRoom,
    clearError,
  } = useRoomSession();

  const [action, setAction] =
    useState<CreatorAction>(null);

  if (!session || session.role !== "creator") {
    return null;
  }

  const canLock = session.room.status === "active";
  const isLocked = session.room.status === "locked";

  async function confirmAction() {
    if (action === "lock") {
      const success = await lockRoom();

      if (success) {
        setAction(null);
      }
    }

    if (action === "close") {
      const success = await closeRoom();

      if (success) {
        setAction(null);
        navigate("/", { replace: true });
      }
    }
  }

  return (
    <section
      aria-label="Creator controls"
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-5"
    >
      <div>
        <h2 className="text-lg font-bold text-slate-900">
          Creator controls
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Manage who can join and when the room ends.
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={!canLock || isBusy}
          onClick={() => {
            clearError();
            setAction("lock");
          }}
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLocked ? "Room locked" : "Lock room"}
        </button>

        <button
          type="button"
          disabled={isBusy}
          onClick={() => {
            clearError();
            setAction("close");
          }}
          className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          Close room
        </button>
      </div>

      {isLocked && (
        <p
          role="status"
          className="text-sm text-amber-700"
        >
          New participants can no longer join.
          Existing participants can still chat.
        </p>
      )}

      <RoomActionDialog
        open={action !== null}
        title={
          action === "lock"
            ? "Lock this room?"
            : "Close this room?"
        }
        description={
          action === "lock"
            ? "New participants won't be able to join. This action cannot be undone in the current version."
            : "This ends the conversation for everyone. Participants will be removed from the room. This action cannot be undone."
        }
        confirmLabel={
          action === "lock"
            ? "Lock room"
            : "Close room"
        }
        destructive={action === "close"}
        isBusy={isBusy}
        onConfirm={() => {
          void confirmAction();
        }}
        onCancel={() => setAction(null)}
      />
    </section>
  );
}
