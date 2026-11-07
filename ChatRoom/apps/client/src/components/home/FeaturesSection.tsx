
import { PageContainer } from "../ui/PageContainer";

interface Feature {
  title: string;
  description: string;
  icon: string;
}

const features: Feature[] = [
  {
    title: "Real-time messaging",
    description:
      "Send and receive messages instantly while everyone stays connected.",
    icon: "⚡",
  },
  {
    title: "Simple room codes",
    description:
      "Create a room and share its unique code with the people you want to invite.",
    icon: "🔑",
  },
  {
    title: "Room controls",
    description:
      "Room creators can start, lock, and close conversations when needed.",
    icon: "🛡️",
  },
];

export function FeaturesSection() {
  return (
    <section
      aria-labelledby="features-heading"
      className="bg-white py-20 sm:py-24"
    >
      <PageContainer>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">
            Why RoomChat?
          </p>

          <h2
            id="features-heading"
            className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
          >
            Everything you need to stay connected.
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            A straightforward way to bring people
            together in one conversation.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-shadow hover:shadow-md"
            >
              <div
                aria-hidden="true"
                className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-50 text-3xl"
              >
                {feature.icon}
              </div>

              <h3 className="mt-6 text-xl font-bold text-slate-900">
                {feature.title}
              </h3>

              <p className="mt-3 leading-7 text-slate-600">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </PageContainer>
    </section>
  );
}
