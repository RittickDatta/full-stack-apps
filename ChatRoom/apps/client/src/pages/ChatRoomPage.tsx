
import {
  Link,
  useParams,
} from "react-router-dom";

import {
  CreatorLobby,
} from "../components/room/CreatorLobby";

import {
  PageContainer,
} from "../components/ui/PageContainer";

import {
  useRoomSession,
} from "../hooks/useRoomSession";

export function ChatRoomPage() {
  const { roomCode } = useParams<{
    roomCode: string;
  }>();

  const { session } = useRoomSession();

  const normalizedRoomCode =
    roomCode?.trim().toUpperCase() ?? "";

  const hasMatchingSession =
    session?.roomCode === normalizedRoomCode;

  if (!hasMatchingSession) {
    return (
      <PageContainer>
        <section className="mx-auto max-w-xl py-16 text-center">
          <h1 className="text-3xl font-bold text-slate-900">
            Room session unavailable
          </h1>

          <p className="mt-4 text-slate-600">
            You don't have an active session for
            this room in the current browser tab.
          </p>

          <div className="mt-8 flex justify-center gap-4">
            <Link
              to="/create"
              className="font-semibold text-indigo-700 hover:underline"
            >
              Create a room
            </Link>

            <Link
              to="/join"
              className="font-semibold text-indigo-700 hover:underline"
            >
              Join a room
            </Link>
          </div>
        </section>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <section className="mx-auto max-w-2xl py-10 sm:py-16">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <CreatorLobby />
        </div>
      </section>
    </PageContainer>
  );
}
