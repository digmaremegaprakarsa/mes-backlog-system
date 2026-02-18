export type PaginationParams = {
  page: number
  pageSize: number
}

export type PaginatedResult<T> = {
  data: T[]
  count: number
  page: number
  pageSize: number
}

export type WorkOrder = {
  id: string
  workshop_id: string | null
  wo_number: string
  customer_name: string
  description: string | null
  status: string
  priority: string
  due_date: string | null
  created_at: string
  updated_at: string
}

export type WorkOrderInput = {
  workshop_id?: string
  wo_number: string
  customer_name: string
  description?: string
  status: string
  priority: string
  due_date?: string
}

export type ProgressLog = {
  id: string
  workshop_id: string | null
  work_order_id: string
  stage: string
  note: string | null
  updated_at: string
}

export type ProgressLogInput = {
  workshop_id?: string
  work_order_id: string
  stage: string
  note?: string
}

export type InventoryItem = {
  id: string
  workshop_id: string | null
  part_number: string
  part_name: string
  stock: number
  minimum_stock: number
  updated_at: string
}

export type InventoryItemInput = {
  workshop_id?: string
  part_number: string
  part_name: string
  stock: number
  minimum_stock: number
}

export type ScheduleItem = {
  id: string
  workshop_id: string
  work_order_id: string | null
  station: string
  planned_start: string
  planned_end: string
  status: string
  created_at: string
}

export type ScheduleInput = {
  workshop_id?: string
  work_order_id?: string
  station: string
  planned_start: string
  planned_end: string
  status: string
}

export type WorkshopSettings = {
  workshop_id: string
  timezone: string
  workday_start: string
  workday_end: string
  sla_hours: number
}

export type Attachment = {
  id: string
  workshop_id: string
  work_order_id: string
  uploaded_by: string | null
  file_name: string
  file_path: string
  content_type: string | null
  file_size: number | null
  created_at: string
}

export type AuditLog = {
  id: string
  workshop_id: string | null
  actor_id: string | null
  table_name: string
  record_id: string | null
  action: "INSERT" | "UPDATE" | "DELETE"
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  created_at: string
}

export type SessionProfile = {
  id: string
  full_name: string | null
  role: "admin" | "supervisor" | "operator" | "viewer"
  workshop_id: string | null
}

export type NotificationItem = {
  id: string
  user_id: string
  workshop_id: string | null
  title: string
  message: string
  kind: string
  action_url: string | null
  is_read: boolean
  created_at: string
}
