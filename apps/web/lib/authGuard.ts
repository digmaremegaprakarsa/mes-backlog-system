import { canAccess, type UserRole } from "@/lib/roles"

export const hasRole = (userRole: UserRole, allowed: UserRole[]) => allowed.includes(userRole)

export const hasMinimumRole = (userRole: UserRole, minimumRole: UserRole) => canAccess(userRole, minimumRole)
