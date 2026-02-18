import { useQuery } from "@tanstack/react-query"
import { getSessionProfile } from "@/services/profile.service"

export const useSessionProfile = () => {
  return useQuery({
    queryKey: ["session-profile"],
    queryFn: getSessionProfile,
    staleTime: 30_000
  })
}
