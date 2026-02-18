import { useCallback } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { markNotificationRead, getNotifications } from "@/services/notification.service"
import { useRealtime } from "@/hooks/useRealtime"

export const useNotifications = () => {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: () => getNotifications(100)
  })

  useRealtime(
    "notifications",
    useCallback(() => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] })
    }, [queryClient])
  )

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] })
    }
  })

  return {
    ...query,
    markRead: markReadMutation.mutate,
    isMarkingRead: markReadMutation.isPending
  }
}
