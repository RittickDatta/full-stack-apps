
import { PageContainer } from "../ui/PageContainer";

const steps = [
  {
    number: "01",
    title: "Create a room",
    description:
      "Choose a display name and generate a unique room code.",
  },
  {
    number: "02",
    title: "Share the code",
    description:
      "Invite your friends by sharing the room code with them.",
  },
  {
    number: "03",
    title: "Start chatting",
    description:
      "Start the room and enjoy real-time conversations together.",
  },
];

export function HowItWorksSection() {
  return (
    <section
      aria-labelledby="how-it-works-heading"
      className="bg-slate-50 py-20 sm:py-24"
    >
      <PageContainer>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">
            Getting started
          </p>

          <h2
            id="how-it-works-heading"
            className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
          >
            Three steps. One conversation.
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Getting everyone together takes just a
            few simple steps.
          </p>
        </div>

        <ol className="mt-14 grid gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <li
              key={step.number}
              className="relative rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
            >
              <span
                aria-hidden="true"
                className="text-5xl font-extrabold tracking-tight text-indigo-200"
              >
                {step.number}
              </span>

              <h3 className="mt-5 text-xl font-bold text-slate-900">
                {step.title}
              </h3>

              <p className="mt-3 leading-7 text-slate-600">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </PageContainer>
    </section>
  );
}
