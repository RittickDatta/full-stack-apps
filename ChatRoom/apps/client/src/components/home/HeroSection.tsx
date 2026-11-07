
import { Link } from "react-router-dom";

import { PageContainer } from "../ui/PageContainer";
import { ChatPreview } from "./ChatPreview";

export function HeroSection() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden bg-linear-to-b from-indigo-50 via-white to-slate-50"
    >
      <PageContainer>
        <div className="grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:py-28">
          <div className="text-center lg:text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm">
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full bg-green-500"
              />
              Simple. Fast. Real-time.
            </div>

            <h1
              id="hero-heading"
              className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl"
            >
              Your space to{" "}
              <span className="text-indigo-600">
                connect and chat.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-600 lg:mx-0">
              Create a room, share a unique code, and
              start conversations with your people.
              No accounts or complicated setup required.
            </p>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Link
                to="/create"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-indigo-600 px-7 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                Create a room
                <span aria-hidden="true" className="ml-2">
                  →
                </span>
              </Link>

              <Link
                to="/join"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-7 py-3 text-base font-semibold text-slate-800 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                Join a room
              </Link>
            </div>

            <p className="mt-6 text-sm text-slate-500">
              No signup required · Up to 20 participants
            </p>
          </div>

          <ChatPreview />
        </div>
      </PageContainer>
    </section>
  );
}
