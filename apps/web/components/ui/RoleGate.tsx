"use client"

import type { ReactNode } from "react"
import type { UserRole } from "@/lib/roles"
import { hasMinimumRole } from "@/lib/authGuard"
import { useSessionProfile } from "@/hooks/useSessionProfile"

type RoleGateProps = {
  minimumRole: UserRole
  fallback?: ReactNode
  children: ReactNode
}

export function RoleGate({ minimumRole, fallback = null, children }: RoleGateProps) {
  const { data: profile } = useSessionProfile()
  if (!profile) return <>{fallback}</>
  if (!hasMinimumRole(profile.role, minimumRole)) return <>{fallback}</>
  return <>{children}</>
}
