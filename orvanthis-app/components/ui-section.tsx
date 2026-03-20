import { ReactNode } from "react";

export function UiSection({
  eyebrow,
  title,
  children,
  right,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-white/8 bg-[#111318] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
            {eyebrow}
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-zinc-100">{title}</h3>
        </div>

        {right ? <div>{right}</div> : null}
      </div>

      <div className="mt-5">{children}</div>
    </section>
  );
}

export function UiEmptyState({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/8 bg-[#0c0e12] p-6">
      <p className="text-sm font-semibold text-zinc-200">{title}</p>
      <p className="mt-2 text-sm leading-6 text-zinc-500">{text}</p>
    </div>
  );
}

export function UiLoadingState({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-[#0c0e12] p-5 text-sm text-zinc-400">
      {text}
    </div>
  );
}