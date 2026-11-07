
import { Link } from "react-router-dom";
import { PageContainer } from "../components/ui/PageContainer";

export function HomePage() {
  return (
    <PageContainer>
      <section className="flex min-h-[65vh] flex-col items-center justify-center py-16 text-center">
        <div className="mb-6 rounded-full bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-700">
          Welcome to RoomChat
        </div>

        <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
          Conversations made simple.
        </h1>

        <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
          Create a room, invite your friends, and enjoy
          real-time conversations in one simple place.
        </p>

        <div className="mt-10 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
          <Link
            to="/create"
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-indigo-600 px-7 py-3 font-semibold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            Create a room
          </Link>

          <Link
            to="/join"
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-300 bg-white px-7 py-3 font-semibold text-slate-800 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
          >
            Join a room
          </Link>
        </div>

        <p className="mt-8 text-sm text-slate-500">
          No account required. Just create, share, and chat.
        </p>
      </section>
    </PageContainer>
  );
}
