import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { getBacklogs } from "@/services/backlog.service"

type UseBacklogParams = {
  page: number
  pageSize: number
  search?: string
  status?: string
}

export const useBacklog = (params: UseBacklogParams) => {
  return useQuery({
    queryKey: ["backlogs", params],
    queryFn: () => getBacklogs(params),
    placeholderData: keepPreviousData
  })
}