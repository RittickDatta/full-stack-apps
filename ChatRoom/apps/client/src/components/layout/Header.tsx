
import { Link, NavLink } from "react-router-dom";
import { PageContainer } from "../ui/PageContainer";

const navigation = [
  { label: "Home", to: "/" },
  { label: "Create", to: "/create" },
  { label: "Join", to: "/join" },
];

export function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <PageContainer>
        <div className="flex min-h-16 flex-wrap items-center justify-between gap-4 py-3">
          <Link
            to="/"
            className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900"
            aria-label="RoomChat home"
          >
            <span
              aria-hidden="true"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white"
            >
              RC
            </span>
            RoomChat
          </Link>

          <nav
            aria-label="Main navigation"
            className="flex items-center gap-1 sm:gap-3"
          >
            {navigation.map(({ label, to }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  [
                    "rounded-lg px-3 py-2 text-sm font-medium",
                    "transition-colors",
                    "focus-visible:outline-none",
                    "focus-visible:ring-2 focus-visible:ring-indigo-500",
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  ].join(" ")
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </PageContainer>
    </header>
  );
}
