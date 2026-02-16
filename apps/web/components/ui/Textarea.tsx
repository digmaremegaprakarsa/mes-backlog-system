"use client"

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

export function Textarea({ className = "", ...props }: TextareaProps) {
  return (
    <textarea
      className={`w-full rounded-xl border border-white/80 bg-white/80 px-3 py-2 text-sm outline-none ring-slate-300 focus:ring ${className}`}
      {...props}
    />
  )
}