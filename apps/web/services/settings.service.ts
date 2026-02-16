import { DEFAULT_WORKSHOP_ID } from "@/lib/constants"
import { supabase } from "@/lib/supabaseClient"
import { resolveWorkshopId } from "@/lib/workshopContext"
import type { WorkshopSettings } from "@/types/models"

export const getSettings = async () => {
  const workshopId = await resolveWorkshopId()

  const { data, error } = await supabase
    .from("workshop_settings")
    .select("workshop_id, timezone, workday_start, workday_end, sla_hours")
    .eq("workshop_id", workshopId)
    .maybeSingle()

  if (error) throw error

  return (
    data ?? {
      workshop_id: workshopId ?? DEFAULT_WORKSHOP_ID,
      timezone: "Asia/Jakarta",
      workday_start: "08:00:00",
      workday_end: "17:00:00",
      sla_hours: 24
    }
  ) as WorkshopSettings
}

export const upsertSettings = async (payload: WorkshopSettings) => {
  const workshopId = payload.workshop_id || (await resolveWorkshopId())

  const { data, error } = await supabase
    .from("workshop_settings")
    .upsert({ ...payload, workshop_id: workshopId }, { onConflict: "workshop_id" })
    .select("workshop_id, timezone, workday_start, workday_end, sla_hours")
    .single()
  if (error) throw error
  return data as WorkshopSettings
}