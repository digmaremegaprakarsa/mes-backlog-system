"use client"

export function TableShell({ children }: { children: React.ReactNode }) {
  return <div className="glass-panel overflow-x-auto">{children}</div>
}