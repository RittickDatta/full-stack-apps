
import { Link, useParams } from "react-router-dom";
import { PageContainer } from "../components/ui/PageContainer";

export function ChatRoomPage() {
  const { roomCode } = useParams<{
    roomCode: string;
  }>();

  const normalizedRoomCode =
    roomCode?.trim().toUpperCase() ?? "";

  return (
    <PageContainer>
      <section className="mx-auto max-w-3xl py-10">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Chat room
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight">
              Room {normalizedRoomCode}
            </h1>
          </div>

          <div className="flex min-h-80 flex-col items-center justify-center px-6 py-12 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-xl font-bold text-indigo-700">
              RC
            </div>

            <h2 className="text-xl font-semibold">
              Your conversation starts here.
            </h2>

            <p className="mt-3 max-w-sm text-slate-600">
              The real-time chat interface will be
              implemented in RC-022.
            </p>

            <Link
              to="/"
              className="mt-6 font-semibold text-indigo-700 hover:underline"
            >
              Return home
            </Link>
          </div>
        </div>
      </section>
    </PageContainer>
  );
}
