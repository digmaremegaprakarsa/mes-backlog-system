"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { keepPreviousData, useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { File as FileIcon, FileImage, FileText } from "lucide-react"
import toast from "react-hot-toast"
import { useBacklog } from "@/hooks/useBacklog"
import { createBacklog, deleteBacklog, updateBacklog } from "@/services/backlog.service"
import { deleteAttachment, getAttachmentSignedUrl, getAttachments, uploadAttachment } from "@/services/attachments.service"
import { DEFAULT_WORKSHOP_ID } from "@/lib/constants"
import type { Attachment, PaginatedResult, WorkOrder, WorkOrderInput } from "@/types/models"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Textarea } from "@/components/ui/Textarea"
import { Pagination } from "@/components/ui/Pagination"
import { TableShell } from "@/components/tables/TableShell"
import { StatusBadge } from "@/components/backlog/StatusBadge"
import { AttachmentPreviewModal } from "@/components/backlog/AttachmentPreviewModal"

const emptyForm: WorkOrderInput = {
  wo_number: "",
  customer_name: "",
  description: "",
  status: "pending",
  priority: "normal",
  due_date: ""
}

const pageSize = 10
const attachmentPageSize = 5
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const isPreviewableImage = (name: string, contentType: string | null) => {
  if (contentType?.startsWith("image/")) return true
  return /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(name)
}

const isPreviewablePdf = (name: string, contentType: string | null) => {
  if (contentType === "application/pdf") return true
  return /\.pdf$/i.test(name)
}

const getAttachmentKind = (name: string, contentType: string | null): "image" | "pdf" | "other" => {
  if (isPreviewableImage(name, contentType)) return "image"
  if (isPreviewablePdf(name, contentType)) return "pdf"
  return "other"
}

export default function BacklogPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<WorkOrderInput>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string | null>(null)
  const [attachmentPage, setAttachmentPage] = useState(1)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewType, setPreviewType] = useState<"image" | "pdf" | null>(null)
  const [previewName, setPreviewName] = useState<string | null>(null)

  const params = useMemo(
    () => ({ page, pageSize, search: search.trim(), status: statusFilter }),
    [page, search, statusFilter]
  )

  const { data: backlogPage } = useBacklog(params)
  const rows = backlogPage?.data ?? []
  const totalRows = backlogPage?.count ?? 0

  useEffect(() => {
    if (!rows.length) {
      setSelectedWorkOrderId(null)
      return
    }

    if (!selectedWorkOrderId || !rows.some((row) => row.id === selectedWorkOrderId)) {
      setSelectedWorkOrderId(rows[0].id)
      setAttachmentPage(1)
    }
  }, [rows, selectedWorkOrderId])

  const isSelectedWorkOrderUuid = Boolean(selectedWorkOrderId && uuidRegex.test(selectedWorkOrderId))

  const { data: attachmentList } = useQuery({
    queryKey: ["attachments", selectedWorkOrderId, attachmentPage],
    queryFn: () =>
      getAttachments({
        workOrderId: selectedWorkOrderId as string,
        page: attachmentPage,
        pageSize: attachmentPageSize
      }),
    enabled: isSelectedWorkOrderUuid,
    placeholderData: keepPreviousData
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingId) return updateBacklog(editingId, form)
      return createBacklog(form)
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["backlogs", params] })
      const previous = queryClient.getQueryData<PaginatedResult<WorkOrder>>(["backlogs", params])

      let tempId: string | null = null
      if (previous) {
        if (editingId) {
          queryClient.setQueryData<PaginatedResult<WorkOrder>>(["backlogs", params], {
            ...previous,
            data: previous.data.map((row) => (row.id === editingId ? { ...row, ...form } : row))
          })
        } else {
          tempId = `temp-${Date.now()}`
          const optimisticRow: WorkOrder = {
            id: tempId,
            workshop_id: DEFAULT_WORKSHOP_ID,
            wo_number: form.wo_number,
            customer_name: form.customer_name,
            description: form.description ?? null,
            status: form.status,
            priority: form.priority,
            due_date: form.due_date ?? null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          queryClient.setQueryData<PaginatedResult<WorkOrder>>(["backlogs", params], {
            ...previous,
            data: [optimisticRow, ...previous.data].slice(0, pageSize),
            count: previous.count + 1
          })
        }
      }

      return { previous, tempId }
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["backlogs", params], context.previous)
    },
    onSuccess: (saved, _vars, context) => {
      if (context?.tempId) {
        const current = queryClient.getQueryData<PaginatedResult<WorkOrder>>(["backlogs", params])
        if (current) {
          queryClient.setQueryData<PaginatedResult<WorkOrder>>(["backlogs", params], {
            ...current,
            data: current.data.map((row) => (row.id === context.tempId ? saved : row))
          })
        }
      }
      setForm(emptyForm)
      setEditingId(null)
      toast.success(editingId ? "Work order updated" : "Work order created")
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["backlogs"] })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBacklog(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["backlogs", params] })
      const previous = queryClient.getQueryData<PaginatedResult<WorkOrder>>(["backlogs", params])

      if (previous) {
        queryClient.setQueryData<PaginatedResult<WorkOrder>>(["backlogs", params], {
          ...previous,
          data: previous.data.filter((row) => row.id !== id),
          count: Math.max(0, previous.count - 1)
        })
      }

      return { previous }
    },
    onError: (_error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(["backlogs", params], context.previous)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["backlogs"] })
    },
    onSuccess: () => {
      toast.success("Work order deleted")
    }
  })

  const uploadMutation = useMutation({
    mutationFn: () => uploadAttachment({ workOrderId: selectedWorkOrderId as string, file: selectedFile as File }),
    onSuccess: () => {
      setSelectedFile(null)
      void queryClient.invalidateQueries({ queryKey: ["attachments", selectedWorkOrderId] })
      toast.success("Attachment uploaded")
    }
  })

  const deleteAttachmentMutation = useMutation({
    mutationFn: (payload: { id: string; filePath: string }) => deleteAttachment(payload),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ["attachments", selectedWorkOrderId, attachmentPage] })
      const key = ["attachments", selectedWorkOrderId, attachmentPage]
      const previous = queryClient.getQueryData<PaginatedResult<Attachment>>(key)
      if (previous) {
        queryClient.setQueryData<PaginatedResult<Attachment>>(key, {
          ...previous,
          data: previous.data.filter((item) => item.id !== id),
          count: Math.max(0, previous.count - 1)
        })
      }
      return { previous, key }
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(context.key, context.previous)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["attachments", selectedWorkOrderId] })
    },
    onSuccess: () => {
      toast.success("Attachment deleted")
    }
  })

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    saveMutation.mutate()
  }

  const startEdit = (row: WorkOrder) => {
    setEditingId(row.id)
    setForm({
      wo_number: row.wo_number,
      customer_name: row.customer_name,
      description: row.description ?? "",
      status: row.status,
      priority: row.priority,
      due_date: row.due_date ?? ""
    })
  }

  const attachmentRows = attachmentList?.data ?? []
  const thumbnailQueries = useQueries({
    queries: attachmentRows.map((file) => ({
      queryKey: ["attachment-thumb", file.file_path],
      queryFn: () => getAttachmentSignedUrl(file.file_path),
      enabled: getAttachmentKind(file.file_name, file.content_type) === "image",
      staleTime: 60_000
    }))
  })

  return (
    <main className="page-shell space-y-4">
      <div>
        <h1 className="page-title">Backlog</h1>
        <p className="muted mt-1 text-sm">Manajemen work order, file attachment, dan status progres</p>
      </div>

      <Card title="Filter">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search WO / customer" />
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">all status</option>
            <option value="pending">pending</option>
            <option value="in_progress">in_progress</option>
            <option value="completed">completed</option>
          </Select>
          <Button type="button" variant="secondary" onClick={() => setPage(1)}>
            Apply
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setSearch("")
              setStatusFilter("all")
              setPage(1)
            }}
          >
            Reset
          </Button>
        </div>
      </Card>

      <Card title={editingId ? "Edit Work Order" : "Create Work Order"}>
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" onSubmit={submit}>
          <Input
            value={form.wo_number}
            onChange={(event) => setForm((prev) => ({ ...prev, wo_number: event.target.value }))}
            placeholder="WO Number"
            required
          />
          <Input
            value={form.customer_name}
            onChange={(event) => setForm((prev) => ({ ...prev, customer_name: event.target.value }))}
            placeholder="Customer Name"
            required
          />
          <Input
            type="date"
            value={form.due_date}
            onChange={(event) => setForm((prev) => ({ ...prev, due_date: event.target.value }))}
          />
          <Select
            value={form.status}
            onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
          >
            <option value="pending">pending</option>
            <option value="in_progress">in_progress</option>
            <option value="completed">completed</option>
          </Select>
          <Select
            value={form.priority}
            onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value }))}
          >
            <option value="low">low</option>
            <option value="normal">normal</option>
            <option value="high">high</option>
            <option value="urgent">urgent</option>
          </Select>
          <div className="sm:col-span-2 lg:col-span-3">
            <Textarea
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Description"
              rows={3}
            />
          </div>
          <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
            <Button type="submit" disabled={saveMutation.isPending}>
              {editingId ? "Update" : "Create"}
            </Button>
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

      <Card title="Work Order List">
        <TableShell>
          <table className="w-full table-auto border-collapse">
            <thead className="bg-white/80 text-slate-700">
              <tr>
                <th className="p-2 text-left text-sm">WO</th>
                <th className="p-2 text-left text-sm">Customer</th>
                <th className="p-2 text-left text-sm">Status</th>
                <th className="p-2 text-left text-sm">Priority</th>
                <th className="p-2 text-left text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((wo, index) => (
                <motion.tr
                  key={wo.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.2 }}
                  className={`border-t border-white/70 ${selectedWorkOrderId === wo.id ? "bg-sky-50/60" : ""}`}
                >
                  <td className="p-2 text-sm">{wo.wo_number}</td>
                  <td className="p-2 text-sm">{wo.customer_name}</td>
                  <td className="p-2 text-sm">
                    <StatusBadge value={wo.status} />
                  </td>
                  <td className="p-2 text-sm">{wo.priority}</td>
                  <td className="p-2 text-sm">
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="secondary" onClick={() => startEdit(wo)}>
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setSelectedWorkOrderId(wo.id)
                          setAttachmentPage(1)
                          setPreviewUrl(null)
                          setPreviewType(null)
                          setPreviewName(null)
                        }}
                      >
                        Files
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        onClick={() => deleteMutation.mutate(wo.id)}
                        disabled={deleteMutation.isPending}
                      >
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

      <Card title="Attachments">
        {selectedWorkOrderId ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="file"
                onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                className="max-w-sm"
              />
              <Button
                type="button"
                onClick={() => selectedFile && uploadMutation.mutate()}
                disabled={!selectedFile || uploadMutation.isPending || !isSelectedWorkOrderUuid}
              >
                Upload File
              </Button>
            </div>

            {!isSelectedWorkOrderUuid ? (
              <p className="muted mt-2 text-sm">Menunggu work order tersimpan sebelum attachment bisa diproses.</p>
            ) : null}

            <div className="mt-3 space-y-2">
              {attachmentRows.length === 0 ? <p className="muted text-sm">No attachment yet.</p> : null}
              {attachmentRows.map((file, index) => (
                <div key={file.id} className="glass-panel flex items-center justify-between gap-2 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-white/80">
                      {getAttachmentKind(file.file_name, file.content_type) === "image" &&
                      thumbnailQueries[index]?.data ? (
                        <img
                          src={thumbnailQueries[index]?.data}
                          alt={file.file_name}
                          className="h-full w-full object-cover"
                        />
                      ) : getAttachmentKind(file.file_name, file.content_type) === "pdf" ? (
                        <FileText className="h-5 w-5 text-rose-600" />
                      ) : getAttachmentKind(file.file_name, file.content_type) === "image" ? (
                        <FileImage className="h-5 w-5 text-sky-600" />
                      ) : (
                        <FileIcon className="h-5 w-5 text-slate-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{file.file_name}</p>
                      <p className="muted text-xs">{file.file_size ?? 0} bytes</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={async () => {
                        const signedUrl = await getAttachmentSignedUrl(file.file_path)
                        if (isPreviewableImage(file.file_name, file.content_type)) {
                          setPreviewType("image")
                          setPreviewUrl(signedUrl)
                          setPreviewName(file.file_name)
                          return
                        }
                        if (isPreviewablePdf(file.file_name, file.content_type)) {
                          setPreviewType("pdf")
                          setPreviewUrl(signedUrl)
                          setPreviewName(file.file_name)
                          return
                        }
                        window.open(signedUrl, "_blank", "noopener,noreferrer")
                      }}
                    >
                      Preview
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={async () => {
                        const signedUrl = await getAttachmentSignedUrl(file.file_path)
                        window.open(signedUrl, "_blank", "noopener,noreferrer")
                      }}
                    >
                      Download
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => deleteAttachmentMutation.mutate({ id: file.id, filePath: file.file_path })}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Pagination
              page={attachmentPage}
              pageSize={attachmentPageSize}
              total={attachmentList?.count ?? 0}
              onPageChange={setAttachmentPage}
            />

          </>
        ) : (
          <p className="muted text-sm">Pilih work order dari tabel untuk melihat lampiran.</p>
        )}
      </Card>

      <AttachmentPreviewModal
        open={Boolean(previewUrl && previewType)}
        type={previewType}
        url={previewUrl}
        name={previewName}
        onClose={() => {
          setPreviewUrl(null)
          setPreviewType(null)
          setPreviewName(null)
        }}
      />
    </main>
  )
}
