import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { getProgress } from "@/services/progress.service"

type UseProgressParams = {
  page: number
  pageSize: number
}

export const useProgress = (params: UseProgressParams) => {
  return useQuery({
    queryKey: ["progress", params],
    queryFn: () => getProgress(params),
    placeholderData: keepPreviousData
  })
}