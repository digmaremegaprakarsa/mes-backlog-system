"use client"

import { FormEvent, useMemo, useState } from "react"
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Pagination } from "@/components/ui/Pagination"
import { Select } from "@/components/ui/Select"
import { TableShell } from "@/components/tables/TableShell"
import { createSchedule, deleteSchedule, getSchedules, updateSchedule } from "@/services/scheduling.service"
import { DEFAULT_WORKSHOP_ID } from "@/lib/constants"
import type { PaginatedResult, ScheduleInput, ScheduleItem } from "@/types/models"

const emptyForm: ScheduleInput = {
  station: "",
  planned_start: "",
  planned_end: "",
  status: "planned"
}

const pageSize = 10

export default function SchedulingPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<ScheduleInput>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const params = useMemo(() => ({ page, pageSize }), [page])

  const { data: schedulePage } = useQuery({
    queryKey: ["schedules", params],
    queryFn: () => getSchedules(params),
    placeholderData: keepPreviousData
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingId) return updateSchedule(editingId, form)
      return createSchedule(form)
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["schedules", params] })
      const previous = queryClient.getQueryData<PaginatedResult<ScheduleItem>>(["schedules", params])

      if (previous) {
        if (editingId) {
          queryClient.setQueryData<PaginatedResult<ScheduleItem>>(["schedules", params], {
            ...previous,
            data: previous.data.map((row) => (row.id === editingId ? { ...row, ...form } : row))
          })
        } else {
          const optimisticRow: ScheduleItem = {
            id: `temp-${Date.now()}`,
            workshop_id: DEFAULT_WORKSHOP_ID,
            work_order_id: form.work_order_id ?? null,
            station: form.station,
            planned_start: form.planned_start,
            planned_end: form.planned_end,
            status: form.status,
            created_at: new Date().toISOString()
          }
          queryClient.setQueryData<PaginatedResult<ScheduleItem>>(["schedules", params], {
            ...previous,
            data: [optimisticRow, ...previous.data].slice(0, pageSize),
            count: previous.count + 1
          })
        }
      }

      return { previous }
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["schedules", params], context.previous)
    },
    onSuccess: () => {
      setForm(emptyForm)
      setEditingId(null)
      toast.success(editingId ? "Schedule updated" : "Schedule created")
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["schedules"] })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSchedule(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["schedules", params] })
      const previous = queryClient.getQueryData<PaginatedResult<ScheduleItem>>(["schedules", params])

      if (previous) {
        queryClient.setQueryData<PaginatedResult<ScheduleItem>>(["schedules", params], {
          ...previous,
          data: previous.data.filter((row) => row.id !== id),
          count: Math.max(0, previous.count - 1)
        })
      }
      return { previous }
    },
    onError: (_error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(["schedules", params], context.previous)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["schedules"] })
    },
    onSuccess: () => {
      toast.success("Schedule deleted")
    }
  })

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    saveMutation.mutate()
  }

  const rows = schedulePage?.data ?? []
  const totalRows = schedulePage?.count ?? 0

  return (
    <main className="page-shell space-y-4">
      <div>
        <h1 className="page-title">Scheduling</h1>
        <p className="muted mt-1 text-sm">Perencanaan stasiun kerja dan slot waktu</p>
      </div>

      <Card title={editingId ? "Edit Schedule" : "Create Schedule"}>
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" onSubmit={submit}>
          <Input
            value={form.station}
            onChange={(event) => setForm((prev) => ({ ...prev, station: event.target.value }))}
            placeholder="Station"
            required
          />
          <Input
            type="datetime-local"
            value={form.planned_start}
            onChange={(event) => setForm((prev) => ({ ...prev, planned_start: event.target.value }))}
            required
          />
          <Input
            type="datetime-local"
            value={form.planned_end}
            onChange={(event) => setForm((prev) => ({ ...prev, planned_end: event.target.value }))}
            required
          />
          <Select
            value={form.status}
            onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
          >
            <option value="planned">planned</option>
            <option value="in_progress">in_progress</option>
            <option value="completed">completed</option>
          </Select>
          <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
            <Button type="submit">{editingId ? "Update" : "Create"}</Button>
            {editingId ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setForm(emptyForm)
                  setEditingId(null)
                }}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      <Card title="Schedule List">
        <TableShell>
          <table className="w-full table-auto border-collapse">
            <thead className="bg-white/80">
              <tr>
                <th className="p-2 text-left text-sm">Station</th>
                <th className="p-2 text-left text-sm">Start</th>
                <th className="p-2 text-left text-sm">End</th>
                <th className="p-2 text-left text-sm">Status</th>
                <th className="p-2 text-left text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item, index) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.2 }}
                  className="border-t border-white/70"
                >
                  <td className="p-2 text-sm">{item.station}</td>
                  <td className="p-2 text-sm">{item.planned_start}</td>
                  <td className="p-2 text-sm">{item.planned_end}</td>
                  <td className="p-2 text-sm">{item.status}</td>
                  <td className="p-2 text-sm">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setEditingId(item.id)
                          setForm({
                            station: item.station,
                            planned_start: item.planned_start.slice(0, 16),
                            planned_end: item.planned_end.slice(0, 16),
                            status: item.status,
                            work_order_id: item.work_order_id ?? undefined
                          })
                        }}
                      >
                        Edit
                      </Button>
                      <Button type="button" variant="danger" onClick={() => deleteMutation.mutate(item.id)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </TableShell>
        <Pagination page={page} pageSize={pageSize} total={totalRows} onPageChange={setPage} />
      </Card>
    </main>
  )
}
