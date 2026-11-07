
import { Link } from "react-router-dom";
import { PageContainer } from "../components/ui/PageContainer";

export function NotFoundPage() {
  return (
    <PageContainer>
      <section className="flex min-h-[65vh] flex-col items-center justify-center py-16 text-center">
        <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">
          Error 404
        </p>

        <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
          Page not found
        </h1>

        <p className="mt-4 max-w-md text-slate-600">
          The page you're looking for doesn't exist
          or may have moved.
        </p>

        <Link
          to="/"
          className="mt-8 inline-flex rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          Go to home
        </Link>
      </section>
    </PageContainer>
  );
}
