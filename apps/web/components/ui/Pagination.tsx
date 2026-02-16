"use client"

import { Button } from "@/components/ui/Button"

type PaginationProps = {
  page: number
  pageSize: number
  total: number
  onPageChange: (next: number) => void
}

export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="mt-3 flex items-center justify-between gap-3">
      <p className="muted text-xs">
        Page {page} / {totalPages} - {total} item(s)
      </p>
      <div className="flex gap-2">
        <Button type="button" variant="secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Prev
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}