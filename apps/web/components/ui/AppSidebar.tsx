"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/backlog", label: "Backlog" },
  { href: "/progress", label: "Progress" },
  { href: "/analytics", label: "Analytics" },
  { href: "/notifications", label: "Notifications" },
  { href: "/inventory", label: "Inventory" },
  { href: "/scheduling", label: "Scheduling" },
  { href: "/settings", label: "Settings" }
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden min-h-screen w-64 p-4 md:block">
      <div className="glass-panel sticky top-4 p-4">
        <h2 className="mb-1 text-lg font-bold">MES Lite</h2>
        <p className="muted mb-4 text-xs">Workshop Operations</p>
        <nav className="space-y-1">
          {links.map((item) => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-xl px-3 py-2 text-sm font-medium transition ${active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-white/80"}`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
