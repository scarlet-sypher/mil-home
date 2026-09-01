type StatusTone = "neutral" | "good" | "warn" | "bad";

const STATUS_TONE: Record<string, StatusTone> = {
  VACANT: "good",
  RESERVED: "warn",
  OCCUPIED: "neutral",
  UNDER_MAINTENANCE: "warn",
  FIT: "good",
  UNFIT: "bad",
  WAITING: "warn",
  ALLOTTED: "good",
  PENDING: "warn",
  APPROVED: "good",
  OPEN: "warn",
  CLOSED: "good",
  INSPECTED: "neutral",
  CLEARED: "good",
  DEFECTS: "bad",
};

const TONE_CLASSES: Record<StatusTone, string> = {
  neutral: "bg-slate-100 text-slate-700",
  good: "bg-emerald-100 text-emerald-800",
  warn: "bg-amber-100 text-amber-800",
  bad: "bg-red-100 text-red-800",
};

export function StatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONE[status] ?? "neutral";
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${TONE_CLASSES[tone]}`}
    >
      {status}
    </span>
  );
}
