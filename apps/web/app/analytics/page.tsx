"use client"

import { useQuery } from "@tanstack/react-query"
import { Card } from "@/components/ui/Card"
import { getBacklogs } from "@/services/backlog.service"
import { getProgress } from "@/services/progress.service"

export default function AnalyticsPage() {
  const { data: backlogPage } = useQuery({
    queryKey: ["backlogs", { page: 1, pageSize: 200 }],
    queryFn: () => getBacklogs({ page: 1, pageSize: 200 })
  })

  const { data: progressPage } = useQuery({
    queryKey: ["progress", { page: 1, pageSize: 200 }],
    queryFn: () => getProgress({ page: 1, pageSize: 200 })
  })

  const totalBacklogs = backlogPage?.count ?? 0
  const totalProgress = progressPage?.count ?? 0
  const avgProgressPerWo = totalBacklogs > 0 ? (totalProgress / totalBacklogs).toFixed(2) : "0"

  return (
    <main className="page-shell space-y-4">
      <div>
        <h1 className="page-title">Analytics</h1>
        <p className="muted mt-1 text-sm">Ringkasan KPI proses dan performa backlog</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card title="Total Progress Logs">{totalProgress}</Card>
        <Card title="Avg Progress / WO">{avgProgressPerWo}</Card>
      </div>
    </main>
  )
}