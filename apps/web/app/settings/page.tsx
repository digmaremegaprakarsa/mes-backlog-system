"use client"

import { FormEvent, useMemo, useState } from "react"
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Pagination } from "@/components/ui/Pagination"
import { Select } from "@/components/ui/Select"
import { exportAuditLogsCsv, getAuditLogs } from "@/services/audit.service"
import { getSettings, upsertSettings } from "@/services/settings.service"
import type { WorkshopSettings } from "@/types/models"

const auditPageSize = 10

export default function SettingsPage() {
  const { data } = useQuery({ queryKey: ["settings"], queryFn: getSettings })
  const [form, setForm] = useState<WorkshopSettings | null>(null)
  const [auditPage, setAuditPage] = useState(1)

  const [tableFilter, setTableFilter] = useState("all")
  const [actionFilter, setActionFilter] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const auditParams = useMemo(
    () => ({ page: auditPage, pageSize: auditPageSize, tableName: tableFilter, action: actionFilter, dateFrom, dateTo }),
    [auditPage, tableFilter, actionFilter, dateFrom, dateTo]
  )

  const { data: auditLogs } = useQuery({
    queryKey: ["audit-logs", auditParams],
    queryFn: () => getAuditLogs(auditParams),
    placeholderData: keepPreviousData
  })

  const mutation = useMutation({
    mutationFn: (payload: WorkshopSettings) => upsertSettings(payload),
    onSuccess: (saved) => {
      setForm(saved)
      toast.success("Settings saved")
    }
  })

  const exportMutation = useMutation({
    mutationFn: () => exportAuditLogsCsv({ tableName: tableFilter, action: actionFilter, dateFrom, dateTo }),
    onSuccess: (csv) => {
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(url)
      toast.success("Audit CSV exported")
    }
  })

  const current = form ?? data

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!current) return
    mutation.mutate(current)
  }

  return (
    <main className="page-shell space-y-4">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="muted mt-1 text-sm">Konfigurasi workshop, SLA, dan audit trail</p>
      </div>

      <Card title="Workshop Settings">
        {current ? (
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={submit}>
            <Input value={current.timezone} onChange={(e) => setForm({ ...current, timezone: e.target.value })} />
            <Input
              type="number"
              value={current.sla_hours}
              onChange={(e) => setForm({ ...current, sla_hours: Number(e.target.value) })}
            />
            <Input
              type="time"
              value={current.workday_start.slice(0, 5)}
              onChange={(e) => setForm({ ...current, workday_start: `${e.target.value}:00` })}
            />
            <Input
              type="time"
              value={current.workday_end.slice(0, 5)}
              onChange={(e) => setForm({ ...current, workday_end: `${e.target.value}:00` })}
            />
            <div className="sm:col-span-2">
              <Button type="submit" disabled={mutation.isPending}>
                Save Settings
              </Button>
            </div>
          </form>
        ) : (
          <p className="muted text-sm">Loading settings...</p>
        )}
      </Card>

      <Card title="Audit Logs">
        <div className="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Select value={tableFilter} onChange={(event) => { setTableFilter(event.target.value); setAuditPage(1) }}>
            <option value="all">all tables</option>
            <option value="work_orders">work_orders</option>
            <option value="work_order_progress">work_order_progress</option>
            <option value="inventory_items">inventory_items</option>
            <option value="schedules">schedules</option>
            <option value="attachments">attachments</option>
            <option value="workshop_settings">workshop_settings</option>
          </Select>

          <Select value={actionFilter} onChange={(event) => { setActionFilter(event.target.value); setAuditPage(1) }}>
            <option value="all">all actions</option>
            <option value="INSERT">INSERT</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
          </Select>

          <Input type="date" value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); setAuditPage(1) }} />
          <Input type="date" value={dateTo} onChange={(event) => { setDateTo(event.target.value); setAuditPage(1) }} />

          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending}>
              Export CSV
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setTableFilter("all")
                setActionFilter("all")
                setDateFrom("")
                setDateTo("")
                setAuditPage(1)
              }}
            >
              Reset
            </Button>
          </div>
        </div>

        <div className="glass-panel overflow-x-auto">
          <table className="w-full table-auto border-collapse">
            <thead className="bg-white/80">
              <tr>
                <th className="p-2 text-left text-sm">Time</th>
                <th className="p-2 text-left text-sm">Table</th>
                <th className="p-2 text-left text-sm">Action</th>
                <th className="p-2 text-left text-sm">Record ID</th>
              </tr>
            </thead>
            <tbody>
              {(auditLogs?.data ?? []).map((row) => (
                <tr key={row.id} className="border-t border-white/70">
                  <td className="p-2 text-sm">{new Date(row.created_at).toLocaleString()}</td>
                  <td className="p-2 text-sm">{row.table_name}</td>
                  <td className="p-2 text-sm">{row.action}</td>
                  <td className="p-2 text-sm">{row.record_id ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          page={auditPage}
          pageSize={auditPageSize}
          total={auditLogs?.count ?? 0}
          onPageChange={setAuditPage}
        />
      </Card>
    </main>
  )
}
