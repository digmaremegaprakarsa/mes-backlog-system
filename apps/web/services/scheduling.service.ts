import { supabase } from "@/lib/supabaseClient"
import { resolveWorkshopId } from "@/lib/workshopContext"
import type { PaginatedResult, PaginationParams, ScheduleInput, ScheduleItem } from "@/types/models"

export const getSchedules = async ({ page, pageSize }: PaginationParams): Promise<PaginatedResult<ScheduleItem>> => {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from("schedules")
    .select("*", { count: "exact" })
    .order("planned_start", { ascending: true })
    .range(from, to)

  if (error) throw error

  return {
    data: (data ?? []) as ScheduleItem[],
    count: count ?? 0,
    page,
    pageSize
  }
}

export const createSchedule = async (payload: ScheduleInput) => {
  const workshopId = payload.workshop_id ?? (await resolveWorkshopId())
  const body = { ...payload, workshop_id: workshopId }
  const { data, error } = await supabase.from("schedules").insert(body).select("*").single()
  if (error) throw error
  return data as ScheduleItem
}

export const updateSchedule = async (id: string, payload: Partial<ScheduleInput>) => {
  const { data, error } = await supabase.from("schedules").update(payload).eq("id", id).select("*").single()
  if (error) throw error
  return data as ScheduleItem
}

export const deleteSchedule = async (id: string) => {
  const { error } = await supabase.from("schedules").delete().eq("id", id)
  if (error) throw error
}