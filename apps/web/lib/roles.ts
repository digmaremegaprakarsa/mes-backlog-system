export type UserRole = "admin" | "supervisor" | "operator" | "viewer"

export const roles: UserRole[] = ["admin", "supervisor", "operator", "viewer"]

export const roleRank: Record<UserRole, number> = {
  viewer: 0,
  operator: 1,
  supervisor: 2,
  admin: 3
}

export const canAccess = (role: UserRole, minimumRole: UserRole) => roleRank[role] >= roleRank[minimumRole]
