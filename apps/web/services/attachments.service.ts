import { ATTACHMENT_BUCKET } from "@/lib/constants"
import { supabase } from "@/lib/supabaseClient"
import { resolveWorkshopId } from "@/lib/workshopContext"
import type { Attachment, PaginatedResult, PaginationParams } from "@/types/models"

type AttachmentQuery = PaginationParams & {
  workOrderId: string
}

const sanitizeFileName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, "_")

export const getAttachments = async ({ workOrderId, page, pageSize }: AttachmentQuery): Promise<PaginatedResult<Attachment>> => {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from("attachments")
    .select("*", { count: "exact" })
    .eq("work_order_id", workOrderId)
    .order("created_at", { ascending: false })
    .range(from, to)

  if (error) throw error

  return {
    data: (data ?? []) as Attachment[],
    count: count ?? 0,
    page,
    pageSize
  }
}

export const uploadAttachment = async ({ workOrderId, file }: { workOrderId: string; file: File }) => {
  const workshopId = await resolveWorkshopId()
  const timestamp = Date.now()
  const path = `${workshopId}/${workOrderId}/${timestamp}-${sanitizeFileName(file.name)}`

  const { error: uploadError } = await supabase.storage.from(ATTACHMENT_BUCKET).upload(path, file)
  if (uploadError) throw uploadError

  const payload = {
    workshop_id: workshopId,
    work_order_id: workOrderId,
    file_name: file.name,
    file_path: path,
    content_type: file.type || null,
    file_size: file.size
  }

  const { data, error } = await supabase.from("attachments").insert(payload).select("*").single()
  if (error) throw error

  return data as Attachment
}

export const deleteAttachment = async ({ id, filePath }: { id: string; filePath: string }) => {
  const { error: storageError } = await supabase.storage.from(ATTACHMENT_BUCKET).remove([filePath])
  if (storageError) throw storageError

  const { error } = await supabase.from("attachments").delete().eq("id", id)
  if (error) throw error
}

export const getAttachmentSignedUrl = async (filePath: string) => {
  const { data, error } = await supabase.storage.from(ATTACHMENT_BUCKET).createSignedUrl(filePath, 60)
  if (error) throw error
  return data.signedUrl
}