import { useMemo } from "react"
import { useSessionProfile } from "@/hooks/useSessionProfile"

export const useAuth = () => {
  const { data: profile, isLoading, error } = useSessionProfile()

  return useMemo(
    () => ({
      user: profile,
      role: profile?.role ?? "viewer",
      workshopId: profile?.workshop_id ?? null,
      loading: isLoading,
      error
    }),
    [profile, isLoading, error]
  )
}
