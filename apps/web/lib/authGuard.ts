import type { UserRole } from "@/lib/roles"

export const hasRole = (userRole: UserRole, allowed: UserRole[]) =>
  allowed.includes(userRole)
