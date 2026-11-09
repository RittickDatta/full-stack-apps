import { Outlet } from "react-router-dom";

import { Header } from "./Header";
import { Footer } from "./Footer";
import { RouteFocusManager } from "./RouteFocusManager";
import { SessionNotice } from "./SessionNotice";

export function AppLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main-content"
        className="sr-only fixed left-4 top-4 z-50 rounded-lg bg-indigo-700 px-4 py-3 font-semibold text-white focus:not-sr-only"
      >
        Skip to main content
      </a>

      <RouteFocusManager />

      <Header />

      <SessionNotice />

      <main id="main-content" tabIndex={-1} className="min-w-0 flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
