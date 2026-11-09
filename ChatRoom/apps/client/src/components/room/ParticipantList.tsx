
import type { Participant } from "@chatroom/shared";

interface ParticipantListProps {
  participants: Participant[];
  currentParticipantId: string;
  maxParticipants: number;
}

export function ParticipantList({
  participants,
  currentParticipantId,
  maxParticipants,
}: ParticipantListProps) {
  return (
    <section
      aria-labelledby="participants-heading"
      className="rounded-xl border border-slate-200 bg-white p-5"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2
          id="participants-heading"
          className="font-bold text-slate-900"
        >
          Participants
        </h2>

        <span className="text-sm text-slate-500">
          {participants.length} / {maxParticipants}
        </span>
      </div>

      {participants.length === 0 ? (
        <p className="text-sm text-slate-500">
          No participants to display.
        </p>
      ) : (
        <ul className="space-y-4">
          {participants.map((participant) => (
            <li
              key={participant.id}
              className="flex items-center gap-3"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                {participant.displayName
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {participant.displayName}

                  {participant.id === currentParticipantId && (
                    <span className="ml-1 font-normal text-slate-500">
                      (You)
                    </span>
                  )}
                </p>

                <p className="text-xs capitalize text-slate-500">
                  {participant.role}
                </p>
              </div>

              <span
                className={`flex items-center gap-1.5 text-xs ${
                  participant.isConnected
                    ? "text-green-700"
                    : "text-slate-500"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`h-2 w-2 rounded-full ${
                    participant.isConnected
                      ? "bg-green-500"
                      : "bg-slate-400"
                  }`}
                />

                {participant.isConnected
                  ? "Online"
                  : "Offline"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
