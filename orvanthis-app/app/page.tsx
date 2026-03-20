import Link from "next/link";

const featureCards = [
  {
    title: "AI Assistant Modes",
    text: "Use Chat, Intelligence, Execution, and Trader workflows depending on what you need right now.",
  },
  {
    title: "Smart Calendar",
    text: "Track catalysts, reminders, opportunity reviews, and next actions with AI-oriented planning.",
  },
  {
    title: "Signals + Opportunities",
    text: "Move from signal detection into assistant analysis, workspace reports, and execution planning.",
  },
  {
    title: "Personalized Workspace",
    text: "Generate strategic reports, save execution plans, pin important research, and build repeatable workflows.",
  },
];

const planCards = [
  {
    name: "Free",
    price: "$0",
    text: "Core product access for exploring Orvanthis and testing the workflow.",
  },
  {
    name: "Premium",
    price: "$25",
    text: "Execution tools, premium calendar actions, stronger assistant workflows, and deeper intelligence.",
  },
  {
    name: "Premium Plus",
    price: "$50",
    text: "Highest access tier for full workflows, advanced usage, and future premium agents.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0a0b0f] text-white">
      <section className="mx-auto max-w-7xl px-6 py-8">
        <header className="flex flex-col gap-4 rounded-[32px] border border-white/8 bg-[#111318] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-sky-500/20 bg-sky-500/[0.08] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-sky-200">
              Strategic Intelligence Platform
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-100 md:text-4xl">
              Orvanthis
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400 md:text-base">
              Executive-grade intelligence, AI-assisted execution, smart signals,
              and calendar-driven workflows built to help you move from ideas to action.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-2xl border border-white/8 bg-[#0c0e12] px-5 py-3 text-sm font-medium text-zinc-300 transition hover:border-white/15 hover:text-white"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-2xl border border-white/8 bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-100"
            >
              Get Started
            </Link>
          </div>
        </header>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[32px] border border-white/8 bg-[linear-gradient(180deg,rgba(14,19,27,1),rgba(10,14,20,1))] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              Product Overview
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-100 md:text-5xl">
              See what matters. Plan what’s next. Execute faster.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-400">
              Orvanthis combines signal detection, strategic research, smart calendar
              workflows, execution planning, and personalized AI assistance into one system.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="rounded-2xl border border-white/8 bg-white px-6 py-4 text-sm font-semibold text-black transition hover:bg-zinc-100"
              >
                Create Account
              </Link>
              <Link
                href="/login"
                className="rounded-2xl border border-white/8 bg-[#0c0e12] px-6 py-4 text-sm font-medium text-zinc-300 transition hover:border-white/15 hover:text-white"
              >
                Open Platform
              </Link>
              <Link
                href="/onboarding"
                className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.06] px-6 py-4 text-sm font-medium text-violet-200 transition hover:border-violet-400/30"
              >
                Personalize Experience
              </Link>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {featureCards.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/8 bg-[#0c0e12] p-5"
                >
                  <p className="text-base font-semibold text-zinc-100">
                    {item.title}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-zinc-400">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <section className="rounded-[32px] border border-white/8 bg-[#111318] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Fast Start
              </p>
              <div className="mt-4 space-y-3">
                <Link
                  href="/signup"
                  className="block rounded-2xl border border-sky-500/15 bg-sky-500/[0.05] px-5 py-4 text-sm font-medium text-sky-200"
                >
                  1. Create your account
                </Link>
                <Link
                  href="/onboarding"
                  className="block rounded-2xl border border-violet-500/15 bg-violet-500/[0.05] px-5 py-4 text-sm font-medium text-violet-200"
                >
                  2. Set goals, sectors, and assistant defaults
                </Link>
                <Link
                  href="/dashboard"
                  className="block rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.05] px-5 py-4 text-sm font-medium text-emerald-200"
                >
                  3. Open the dashboard and start operating
                </Link>
              </div>
            </section>

            <section className="rounded-[32px] border border-white/8 bg-[#111318] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Plans
              </p>
              <div className="mt-4 space-y-4">
                {planCards.map((plan) => (
                  <div
                    key={plan.name}
                    className="rounded-2xl border border-white/8 bg-[#0c0e12] p-5"
                  >
                    <div className="flex items-end justify-between gap-3">
                      <p className="text-lg font-semibold text-zinc-100">
                        {plan.name}
                      </p>
                      <p className="text-2xl font-semibold text-zinc-100">
                        {plan.price}
                        <span className="ml-1 text-sm font-normal text-zinc-500">
                          /mo
                        </span>
                      </p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-zinc-400">
                      {plan.text}
                    </p>
                  </div>
                ))}
              </div>

              <Link
                href="/billing"
                className="mt-5 block rounded-2xl border border-white/8 bg-white px-5 py-4 text-center text-sm font-semibold text-black transition hover:bg-zinc-100"
              >
                View Plans
              </Link>
            </section>
          </div>
        </section>
      </section>
    </main>
  );
}