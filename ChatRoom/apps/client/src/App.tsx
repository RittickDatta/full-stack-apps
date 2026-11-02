
import {
  ArrowRight,
  MessageCircle,
  Moon,
  ShieldCheck,
  Smartphone,
  Users,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Real-time chat",
    description: "Messages delivered instantly.",
  },
  {
    icon: Users,
    title: "Private rooms",
    description: "Connect using a room code.",
  },
  {
    icon: ShieldCheck,
    title: "No signup",
    description: "Just enter a name and chat.",
  },
];

function App() {
  return (
    <div className="min-h-screen bg-app-bg text-app-text">
      <header className="border-b border-app-border bg-app-surface">
        <div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-app-primary text-white">
              <MessageCircle size={23} strokeWidth={1.75} />
            </div>

            <span className="text-xl font-extrabold tracking-tight">
              ChatRoom
            </span>
          </div>

          <div
            className="flex size-10 items-center justify-center rounded-xl border border-app-border text-app-text-muted"
            title="Theme toggle coming in RC-030"
          >
            <Moon size={20} strokeWidth={1.75} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-app-border bg-app-surface px-4 py-2 text-sm text-app-text-muted">
            <Smartphone size={16} />
            Mobile-first real-time messaging
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            Conversations made{" "}
            <span className="text-app-primary">simple.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-app-text-muted sm:text-lg">
            Create a room, share a code, and start chatting.
            No accounts. No complicated setup.
          </p>

          <div className="mt-8 inline-flex items-center gap-2 rounded-xl bg-app-primary px-5 py-3 font-semibold text-white">
            ChatRoom is taking shape
            <ArrowRight size={18} />
          </div>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-app-border bg-app-surface p-6 shadow-sm"
            >
              <div className="mb-5 flex size-12 items-center justify-center rounded-xl bg-app-surface-secondary text-app-primary">
                <Icon size={24} strokeWidth={1.75} />
              </div>

              <h2 className="text-lg font-bold">{title}</h2>

              <p className="mt-2 text-sm leading-6 text-app-text-muted">
                {description}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-12 text-center text-sm text-app-text-muted">
          Frontend foundation · RC-002
        </p>
      </main>
    </div>
  );
}

export default App;
