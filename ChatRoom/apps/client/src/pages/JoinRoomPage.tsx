
import { Link } from "react-router-dom";
import { PageContainer } from "../components/ui/PageContainer";

export function JoinRoomPage() {
  return (
    <PageContainer>
      <section className="mx-auto max-w-xl py-16">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Join a room
          </h1>

          <p className="mt-3 text-slate-600">
            Enter a room code to join an existing
            conversation.
          </p>

          <div className="mt-8 rounded-xl border border-dashed border-indigo-200 bg-indigo-50 p-6 text-center">
            <p className="font-medium text-indigo-900">
              Room joining form coming soon.
            </p>
            <p className="mt-2 text-sm text-indigo-700">
              We'll implement this in RC-021.
            </p>
          </div>

          <Link
            to="/"
            className="mt-6 inline-block text-sm font-semibold text-indigo-700 hover:underline"
          >
            Back to home
          </Link>
        </div>
      </section>
    </PageContainer>
  );
}
