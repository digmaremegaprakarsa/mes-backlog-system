"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const links = [
  { href: "/dashboard", label: "Home" },
  { href: "/backlog", label: "Backlog" },
  { href: "/progress", label: "Progress" },
  { href: "/inventory", label: "Stock" },
  { href: "/settings", label: "Settings" }
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed inset-x-3 bottom-3 z-50 glass-panel p-2 md:hidden">
      <div className="grid grid-cols-5 gap-1">
        {links.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-1 py-2 text-center text-xs font-medium transition ${active ? "bg-slate-900 text-white" : "text-slate-700"}`}
            >
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}