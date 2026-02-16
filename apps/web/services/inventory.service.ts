import { supabase } from "@/lib/supabaseClient"
import { resolveWorkshopId } from "@/lib/workshopContext"
import type { InventoryItem, InventoryItemInput, PaginatedResult, PaginationParams } from "@/types/models"

export const getInventory = async ({ page, pageSize }: PaginationParams): Promise<PaginatedResult<InventoryItem>> => {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from("inventory_items")
    .select("*", { count: "exact" })
    .order("updated_at", { ascending: false })
    .range(from, to)

  if (error) throw error

  return {
    data: (data ?? []) as InventoryItem[],
    count: count ?? 0,
    page,
    pageSize
  }
}

export const createInventoryItem = async (payload: InventoryItemInput) => {
  const workshopId = payload.workshop_id ?? (await resolveWorkshopId())
  const body = { ...payload, workshop_id: workshopId }
  const { data, error } = await supabase.from("inventory_items").insert(body).select("*").single()
  if (error) throw error
  return data as InventoryItem
}

export const updateInventoryItem = async (id: string, payload: Partial<InventoryItemInput>) => {
  const { data, error } = await supabase
    .from("inventory_items")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single()
  if (error) throw error
  return data as InventoryItem
}

export const deleteInventoryItem = async (id: string) => {
  const { error } = await supabase.from("inventory_items").delete().eq("id", id)
  if (error) throw error
}