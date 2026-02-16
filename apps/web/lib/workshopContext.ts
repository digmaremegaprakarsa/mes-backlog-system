import { DEFAULT_WORKSHOP_ID } from "@/lib/constants"
import { supabase } from "@/lib/supabaseClient"

export const resolveWorkshopId = async () => {
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError

  const userId = authData.user?.id
  if (!userId) return DEFAULT_WORKSHOP_ID

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("workshop_id")
    .eq("id", userId)
    .maybeSingle()

  if (profileError) throw profileError

  return profile?.workshop_id ?? DEFAULT_WORKSHOP_ID
}