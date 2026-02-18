import { supabase } from "@/lib/supabaseClient"

export const resolveWorkshopId = async () => {
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError

  const userId = authData.user?.id
  if (!userId) throw new Error("User not authenticated")

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("workshop_id")
    .eq("id", userId)
    .maybeSingle()

  if (profileError) throw profileError

  if (!profile?.workshop_id) {
    throw new Error("Profile workshop_id belum di-set. Set workshop_id user di tabel profiles terlebih dahulu.")
  }

  return profile.workshop_id
}
