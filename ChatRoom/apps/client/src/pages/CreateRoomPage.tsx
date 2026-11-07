
import { Link } from "react-router-dom";

import {
  CreateRoomForm,
} from "../components/room/CreateRoomForm";

import {
  PageContainer,
} from "../components/ui/PageContainer";

export function CreateRoomPage() {
  return (
    <PageContainer>
      <section className="mx-auto max-w-xl py-12 sm:py-20">
        <div className="mb-8 text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">
            Start a conversation
          </p>

          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Create your room
          </h1>

          <p className="mt-4 text-slate-600">
            Enter your display name and we'll generate
            a unique room code for you.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <CreateRoomForm />
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have a room code?{" "}
          <Link
            to="/join"
            className="font-semibold text-indigo-700 hover:underline"
          >
            Join a room
          </Link>
        </p>
      </section>
    </PageContainer>
  );
}
