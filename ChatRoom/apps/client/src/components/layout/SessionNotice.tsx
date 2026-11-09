
import { useRoomSession } from "../../hooks/useRoomSession";

export function SessionNotice() {
  const {
    sessionNotice,
    clearSessionNotice,
  } = useRoomSession();

  if (!sessionNotice) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto mt-4 w-full max-w-6xl px-4"
    >
      <div className="flex items-start justify-between gap-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900">
        <p>{sessionNotice}</p>

        <button
          type="button"
          onClick={clearSessionNotice}
          aria-label="Dismiss room notification"
          className="touch-target shrink-0 rounded-lg px-3 font-semibold text-indigo-800 hover:bg-indigo-100"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
