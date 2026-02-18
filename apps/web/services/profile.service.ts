import { supabase } from "@/lib/supabaseClient"
import type { SessionProfile } from "@/types/models"

export const getSessionProfile = async () => {
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError

  const userId = authData.user?.id
  if (!userId) return null

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, workshop_id")
    .eq("id", userId)
    .maybeSingle()

  if (error) throw error
  return (data ?? null) as SessionProfile | null
}
