
import { Link } from "react-router-dom";

import { PageContainer } from "../ui/PageContainer";

export function CallToActionSection() {
  return (
    <section
      aria-labelledby="cta-heading"
      className="bg-white py-20 sm:py-24"
    >
      <PageContainer>
        <div className="rounded-3xl bg-indigo-600 px-6 py-14 text-center shadow-lg shadow-indigo-100 sm:px-12 sm:py-20">
          <h2
            id="cta-heading"
            className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
          >
            Ready to start a conversation?
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-indigo-100">
            Bring your people together in one place.
            Create a new room or join an existing one.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/create"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-7 py-3 font-semibold text-indigo-700 transition-colors hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-600"
            >
              Create a room
            </Link>

            <Link
              to="/join"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-indigo-300 px-7 py-3 font-semibold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-600"
            >
              Join a room
            </Link>
          </div>
        </div>
      </PageContainer>
    </section>
  );
}
