
import { useRoomSession } from "../../hooks/useRoomSession";

export function MemberLobby() {
  const { session, error } = useRoomSession();

  if (!session || session.role !== "member") {
    return null;
  }

  const { room } = session;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">
          Member lobby
        </p>

        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          You've joined the room!
        </h1>

        <p className="mt-3 text-slate-600">
          You're connected as{" "}
          <span className="font-semibold text-slate-900">
            {session.displayName}
          </span>
          .
        </p>
      </div>

      <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-700">
          Room code
        </p>

        <p className="mt-3 break-all font-mono text-4xl font-extrabold tracking-widest text-slate-900">
          {session.roomCode}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm text-slate-500">
            Room status
          </p>

          <p className="mt-2 text-lg font-bold capitalize text-slate-900">
            {room.status}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm text-slate-500">
            Participants
          </p>

          <p className="mt-2 text-lg font-bold text-slate-900">
            {room.participantCount} / {room.maxParticipants}
          </p>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <div
        role="status"
        className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-800"
      >
        You're in! The real-time chat interface will
        be added in RC-022.
      </div>
    </div>
  );
}
