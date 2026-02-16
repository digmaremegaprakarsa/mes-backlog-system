"use client"

export function StatusBadge({ value }: { value: string }) {
  const tone =
    value === "completed"
      ? "bg-emerald-100 text-emerald-700"
      : value === "in_progress"
        ? "bg-amber-100 text-amber-700"
        : "bg-slate-100 text-slate-700"

  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${tone}`}>{value}</span>
}
