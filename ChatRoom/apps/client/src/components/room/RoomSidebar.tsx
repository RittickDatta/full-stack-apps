
import type { RoomSession } from "../../types/room-session";

import { isRoomSnapshot } from "../../lib/chat-utils";
import { ParticipantList } from "./ParticipantList";
import { CreatorControls } from "./CreatorControls";
import { LeaveRoomButton } from "./LeaveRoomButton";

interface RoomSidebarProps {
  session: RoomSession;
}

export function RoomSidebar({
  session,
}: RoomSidebarProps) {
  const participants = isRoomSnapshot(session.room)
    ? session.room.participants
    : null;

  return (
    <aside
      aria-label="Room information and controls"
      className="space-y-5"
    >
      {participants ? (
        <ParticipantList
          participants={participants}
          currentParticipantId={session.participantId}
          maxParticipants={session.room.maxParticipants}
        />
      ) : (
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-900">
            Participants
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            {session.room.participantCount} /{" "}
            {session.room.maxParticipants} joined
          </p>

          <p className="mt-2 text-xs text-slate-500">
            Participant details are not available yet.
          </p>
        </section>
      )}

      {session.role === "creator" && (
        <CreatorControls />
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold text-slate-900">
          Your session
        </h2>

        <p className="mt-2 text-sm text-slate-600">
          Signed in as{" "}
          <span className="font-semibold">
            {session.displayName}
          </span>
        </p>

        <div className="mt-4">
          <LeaveRoomButton />
        </div>
      </section>
    </aside>
  );
}
