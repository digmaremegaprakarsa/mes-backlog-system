import { supabase } from "@/lib/supabaseClient"

export type NotificationPayload = {
  user_id: string
  title: string
  message: string
  is_read?: boolean
}

export const sendNotification = async (payload: NotificationPayload) => {
  const { data, error } = await supabase.from("notifications").insert(payload).select("*")
  if (error) throw error
  return data
}
