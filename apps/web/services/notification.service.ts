import { supabase } from "@/lib/supabaseClient"
import type { NotificationItem } from "@/types/models"

export type NotificationPayload = {
  user_id: string
  title: string
  message: string
  workshop_id?: string | null
  kind?: string
  action_url?: string | null
  is_read?: boolean
}

export const sendNotification = async (payload: NotificationPayload) => {
  const { data, error } = await supabase.from("notifications").insert(payload).select("*").single()
  if (error) throw error
  return data as NotificationItem
}

export const getNotifications = async (limit = 50) => {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, user_id, workshop_id, title, message, kind, action_url, is_read, created_at")
    .order("created_at", { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as NotificationItem[]
}

export const markNotificationRead = async (id: string) => {
  const { data, error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id).select("*").single()
  if (error) throw error
  return data as NotificationItem
}
