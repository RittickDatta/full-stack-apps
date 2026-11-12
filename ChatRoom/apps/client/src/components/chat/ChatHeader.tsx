
import type { RoomSummary } from "@chatroom/shared";

interface ChatHeaderProps {
  room: RoomSummary;
  isConnected: boolean;
  displayName: string;
}

export function ChatHeader({
  room,
  isConnected,
  displayName,
}: ChatHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white px-4 py-5 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            ChatRoom
          </p>

          <h1 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
            Room {room.code}
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            {room.participantCount} / {room.maxParticipants} participants
            {" · "}
            <span className="capitalize">
              {room.status}
            </span>
          </p>
        </div>

        <div className="text-right">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
              isConnected
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            <span
              aria-hidden="true"
              className={`h-2 w-2 rounded-full ${
                isConnected
                  ? "bg-green-500"
                  : "bg-red-500"
              }`}
            />

            {isConnected ? "Connected" : "Disconnected"}
          </span>

          <p className="mt-2 text-xs text-slate-500">
            Signed in as {displayName}
          </p>
        </div>
      </div>
    </header>
  );
}
