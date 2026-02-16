import { supabase } from "@/lib/supabaseClient"
import { resolveWorkshopId } from "@/lib/workshopContext"
import type { PaginatedResult, PaginationParams, ProgressLog, ProgressLogInput } from "@/types/models"

export const getProgress = async ({ page, pageSize }: PaginationParams): Promise<PaginatedResult<ProgressLog>> => {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from("work_order_progress")
    .select("id, workshop_id, work_order_id, stage, note, updated_at", { count: "exact" })
    .order("updated_at", { ascending: false })
    .range(from, to)

  if (error) throw error

  return {
    data: (data ?? []) as ProgressLog[],
    count: count ?? 0,
    page,
    pageSize
  }
}

export const createProgress = async (payload: ProgressLogInput) => {
  const workshopId = payload.workshop_id ?? (await resolveWorkshopId())
  const body = { ...payload, workshop_id: workshopId }
  const { data, error } = await supabase.from("work_order_progress").insert(body).select("*").single()
  if (error) throw error
  return data as ProgressLog
}

export const updateProgress = async (id: string, payload: Partial<ProgressLogInput>) => {
  const { data, error } = await supabase
    .from("work_order_progress")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single()
  if (error) throw error
  return data as ProgressLog
}

export const deleteProgress = async (id: string) => {
  const { error } = await supabase.from("work_order_progress").delete().eq("id", id)
  if (error) throw error
}