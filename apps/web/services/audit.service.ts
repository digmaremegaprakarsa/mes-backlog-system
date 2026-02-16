import { supabase } from "@/lib/supabaseClient"
import type { AuditLog, PaginatedResult, PaginationParams } from "@/types/models"

type AuditQuery = PaginationParams & {
  tableName?: string
  action?: string
  dateFrom?: string
  dateTo?: string
}

export const getAuditLogs = async ({
  page,
  pageSize,
  tableName,
  action,
  dateFrom,
  dateTo
}: AuditQuery): Promise<PaginatedResult<AuditLog>> => {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from("audit_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to)

  if (tableName && tableName !== "all") query = query.eq("table_name", tableName)
  if (action && action !== "all") query = query.eq("action", action)
  if (dateFrom) query = query.gte("created_at", `${dateFrom}T00:00:00`)
  if (dateTo) query = query.lte("created_at", `${dateTo}T23:59:59`)

  const { data, error, count } = await query
  if (error) throw error

  return {
    data: (data ?? []) as AuditLog[],
    count: count ?? 0,
    page,
    pageSize
  }
}

export const exportAuditLogsCsv = async ({
  tableName,
  action,
  dateFrom,
  dateTo
}: Omit<AuditQuery, "page" | "pageSize">) => {
  const chunkSize = 1000
  let from = 0
  let hasMore = true
  const rows: Array<{
    id: string
    created_at: string
    table_name: string
    action: string
    record_id: string | null
    actor_id: string | null
    workshop_id: string | null
  }> = []

  while (hasMore) {
    let query = supabase
      .from("audit_logs")
      .select("id, created_at, table_name, action, record_id, actor_id, workshop_id")
      .order("created_at", { ascending: false })
      .range(from, from + chunkSize - 1)

    if (tableName && tableName !== "all") query = query.eq("table_name", tableName)
    if (action && action !== "all") query = query.eq("action", action)
    if (dateFrom) query = query.gte("created_at", `${dateFrom}T00:00:00`)
    if (dateTo) query = query.lte("created_at", `${dateTo}T23:59:59`)

    const { data, error } = await query
    if (error) throw error

    const chunk = data ?? []
    rows.push(...chunk)
    hasMore = chunk.length === chunkSize
    from += chunkSize
  }

  const header = ["id", "created_at", "table_name", "action", "record_id", "actor_id", "workshop_id"]

  const csvBody = rows
    .map((row) =>
      [row.id, row.created_at, row.table_name, row.action, row.record_id ?? "", row.actor_id ?? "", row.workshop_id ?? ""]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n")

  return `${header.join(",")}\n${csvBody}`
}
