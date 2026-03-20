"use client";

type UiToastProps = {
  message: string;
  tone?: "success" | "warning" | "error" | "info";
  onClose?: () => void;
};

export default function UiToast({
  message,
  tone = "info",
  onClose,
}: UiToastProps) {
  if (!message) return null;

  const styles =
    tone === "success"
      ? "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-200"
      : tone === "warning"
      ? "border-amber-500/20 bg-amber-500/[0.06] text-amber-200"
      : tone === "error"
      ? "border-red-500/20 bg-red-500/[0.06] text-red-200"
      : "border-sky-500/20 bg-sky-500/[0.06] text-sky-200";

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm ${styles}`}
    >
      <p>{message}</p>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-white/10 bg-black/10 px-2 py-1 text-xs uppercase tracking-[0.12em]"
        >
          Close
        </button>
      )}
    </div>
  );
}