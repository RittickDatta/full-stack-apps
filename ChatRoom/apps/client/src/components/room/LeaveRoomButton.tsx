
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useRoomSession } from "../../hooks/useRoomSession";
import { RoomActionDialog } from "./RoomActionDialog";

export function LeaveRoomButton() {
  const navigate = useNavigate();

  const {
    session,
    isBusy,
    leaveRoom,
  } = useRoomSession();

  const [confirming, setConfirming] = useState(false);

  if (!session) return null;

  async function handleLeave() {
    const success = await leaveRoom();

    if (success) {
      setConfirming(false);
      navigate("/", { replace: true });
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={isBusy}
        onClick={() => setConfirming(true)}
        className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        Leave room
      </button>

      <RoomActionDialog
        open={confirming}
        title="Leave this room?"
        description={
          session.role === "creator"
            ? "You'll leave the room, but it will remain open for other participants. Your creator session will not be recoverable in this MVP."
            : "You'll leave this conversation and return to the home page."
        }
        confirmLabel="Leave room"
        isBusy={isBusy}
        onConfirm={() => {
          void handleLeave();
        }}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
