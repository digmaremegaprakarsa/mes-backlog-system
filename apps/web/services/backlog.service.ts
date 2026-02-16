import { supabase } from "@/lib/supabaseClient"
import { resolveWorkshopId } from "@/lib/workshopContext"
import type { PaginatedResult, PaginationParams, WorkOrder, WorkOrderInput } from "@/types/models"

type BacklogQuery = PaginationParams & {
  search?: string
  status?: string
}

export const getBacklogs = async ({ page, pageSize, search, status }: BacklogQuery): Promise<PaginatedResult<WorkOrder>> => {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from("work_orders")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to)

  if (search && search.trim()) {
    const term = `%${search.trim()}%`
    query = query.or(`wo_number.ilike.${term},customer_name.ilike.${term}`)
  }

  if (status && status !== "all") {
    query = query.eq("status", status)
  }

  const { data, error, count } = await query
  if (error) throw error

  return {
    data: (data ?? []) as WorkOrder[],
    count: count ?? 0,
    page,
    pageSize
  }
}

export const getBacklogOptions = async () => {
  const { data, error } = await supabase
    .from("work_orders")
    .select("id, wo_number")
    .order("created_at", { ascending: false })
    .range(0, 199)

  if (error) throw error
  return (data ?? []) as Array<{ id: string; wo_number: string }>
}

export const createBacklog = async (payload: WorkOrderInput) => {
  const workshopId = payload.workshop_id ?? (await resolveWorkshopId())
  const body = { ...payload, workshop_id: workshopId }
  const { data, error } = await supabase.from("work_orders").insert(body).select("*").single()
  if (error) throw error
  return data as WorkOrder
}

export const updateBacklog = async (id: string, payload: Partial<WorkOrderInput>) => {
  const { data, error } = await supabase
    .from("work_orders")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single()
  if (error) throw error
  return data as WorkOrder
}

export const deleteBacklog = async (id: string) => {
  const { error } = await supabase.from("work_orders").delete().eq("id", id)
  if (error) throw error
}