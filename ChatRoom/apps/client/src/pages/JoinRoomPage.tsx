
import { Link } from "react-router-dom";

import { JoinRoomForm } from "../components/room/JoinRoomForm";
import { PageContainer } from "../components/ui/PageContainer";

export function JoinRoomPage() {
  return (
    <PageContainer>
      <section className="mx-auto max-w-xl py-12 sm:py-20">
        <div className="mb-8 text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">
            Join the conversation
          </p>

          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Join a room
          </h1>

          <p className="mt-4 text-slate-600">
            Enter the room code shared with you and
            choose a display name to join.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <JoinRoomForm />
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Want to start your own conversation?{" "}
          <Link
            to="/create"
            className="font-semibold text-indigo-700 hover:underline"
          >
            Create a room
          </Link>
        </p>
      </section>
    </PageContainer>
  );
}
