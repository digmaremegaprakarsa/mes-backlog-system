"use client"

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>

export function Select({ className = "", ...props }: SelectProps) {
  return (
    <select
      className={`w-full rounded-xl border border-white/80 bg-white/80 px-3 py-2 text-sm outline-none ring-slate-300 focus:ring ${className}`}
      {...props}
    />
  )
}