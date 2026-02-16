"use client"

import { motion } from "framer-motion"

type ButtonVariant = "primary" | "secondary" | "danger"

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
}

const byVariant: Record<ButtonVariant, string> = {
  primary: "bg-slate-900 text-white hover:bg-slate-800",
  secondary: "bg-white/70 text-slate-900 hover:bg-white",
  danger: "bg-rose-600 text-white hover:bg-rose-500"
}

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 450, damping: 24 }}
      className="inline-block"
    >
      <button
        className={`rounded-xl px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-60 ${byVariant[variant]} ${className}`}
        {...props}
      />
    </motion.div>
  )
}