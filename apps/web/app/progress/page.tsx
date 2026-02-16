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
import { Textarea } from "@/components/ui/Textarea"
import { TableShell } from "@/components/tables/TableShell"
import { getBacklogOptions } from "@/services/backlog.service"
import { createProgress, deleteProgress, getProgress, updateProgress } from "@/services/progress.service"
import { DEFAULT_WORKSHOP_ID } from "@/lib/constants"
import type { PaginatedResult, ProgressLog, ProgressLogInput } from "@/types/models"

const emptyForm: ProgressLogInput = {
  work_order_id: "",
  stage: "received",
  note: ""
}

const pageSize = 10

export default function ProgressPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<ProgressLogInput>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const params = useMemo(() => ({ page, pageSize }), [page])

  const { data: progressPage } = useQuery({
    queryKey: ["progress", params],
    queryFn: () => getProgress(params),
    placeholderData: keepPreviousData
  })

  const { data: backlogOptions } = useQuery({
    queryKey: ["backlog-options"],
    queryFn: getBacklogOptions
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingId) return updateProgress(editingId, form)
      return createProgress(form)
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["progress", params] })
      const previous = queryClient.getQueryData<PaginatedResult<ProgressLog>>(["progress", params])

      if (previous) {
        if (editingId) {
          queryClient.setQueryData<PaginatedResult<ProgressLog>>(["progress", params], {
            ...previous,
            data: previous.data.map((row) => (row.id === editingId ? { ...row, ...form } : row))
          })
        } else {
          const optimisticRow: ProgressLog = {
            id: `temp-${Date.now()}`,
            workshop_id: DEFAULT_WORKSHOP_ID,
            work_order_id: form.work_order_id,
            stage: form.stage,
            note: form.note ?? null,
            updated_at: new Date().toISOString()
          }
          queryClient.setQueryData<PaginatedResult<ProgressLog>>(["progress", params], {
            ...previous,
            data: [optimisticRow, ...previous.data].slice(0, pageSize),
            count: previous.count + 1
          })
        }
      }

      return { previous }
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["progress", params], context.previous)
    },
    onSuccess: () => {
      setForm(emptyForm)
      setEditingId(null)
      toast.success(editingId ? "Progress updated" : "Progress created")
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["progress"] })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProgress(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["progress", params] })
      const previous = queryClient.getQueryData<PaginatedResult<ProgressLog>>(["progress", params])

      if (previous) {
        queryClient.setQueryData<PaginatedResult<ProgressLog>>(["progress", params], {
          ...previous,
          data: previous.data.filter((row) => row.id !== id),
          count: Math.max(0, previous.count - 1)
        })
      }
      return { previous }
    },
    onError: (_error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(["progress", params], context.previous)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["progress"] })
    },
    onSuccess: () => {
      toast.success("Progress deleted")
    }
  })

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    saveMutation.mutate()
  }

  const rows = progressPage?.data ?? []
  const totalRows = progressPage?.count ?? 0

  return (
    <main className="page-shell space-y-4">
      <div>
        <h1 className="page-title">Progress</h1>
        <p className="muted mt-1 text-sm">Pantau tahapan proses tiap work order</p>
      </div>

      <Card title={editingId ? "Edit Progress" : "Create Progress"}>
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" onSubmit={submit}>
          <Select
            value={form.work_order_id}
            onChange={(event) => setForm((prev) => ({ ...prev, work_order_id: event.target.value }))}
            required
          >
            <option value="">Select Work Order</option>
            {(backlogOptions ?? []).map((wo) => (
              <option key={wo.id} value={wo.id}>
                {wo.wo_number}
              </option>
            ))}
          </Select>
          <Input
            value={form.stage}
            onChange={(event) => setForm((prev) => ({ ...prev, stage: event.target.value }))}
            placeholder="Stage"
            required
          />
          <div className="sm:col-span-2 lg:col-span-3">
            <Textarea
              value={form.note}
              onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
              placeholder="Progress note"
              rows={3}
            />
          </div>
          <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
            <Button type="submit">{editingId ? "Update" : "Create"}</Button>
            {editingId ? (
              <Button type="button" variant="secondary" onClick={() => setEditingId(null)}>
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      <Card title="Progress Logs">
        <TableShell>
          <table className="w-full table-auto border-collapse">
            <thead className="bg-white/80">
              <tr>
                <th className="p-2 text-left text-sm">Work Order</th>
                <th className="p-2 text-left text-sm">Stage</th>
                <th className="p-2 text-left text-sm">Note</th>
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
                  <td className="p-2 text-sm">{item.work_order_id}</td>
                  <td className="p-2 text-sm">{item.stage}</td>
                  <td className="p-2 text-sm">{item.note ?? "-"}</td>
                  <td className="p-2 text-sm">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setEditingId(item.id)
                          setForm({
                            work_order_id: item.work_order_id,
                            stage: item.stage,
                            note: item.note ?? ""
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
