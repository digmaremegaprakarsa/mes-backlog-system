"use client"

type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      className={`w-full rounded-xl border border-white/80 bg-white/80 px-3 py-2 text-sm outline-none ring-slate-300 focus:ring ${className}`}
      {...props}
    />
  )
}