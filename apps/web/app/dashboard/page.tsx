"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useBacklog } from "@/hooks/useBacklog"
import { BacklogChart } from "@/components/charts/BacklogChart"
import { Card } from "@/components/ui/Card"
import { getInventory } from "@/services/inventory.service"
import { getSchedules } from "@/services/scheduling.service"

export default function DashboardPage() {
  const { data: backlogPage } = useBacklog({ page: 1, pageSize: 200 })
  const { data: inventoryPage } = useQuery({
    queryKey: ["inventory", { page: 1, pageSize: 200 }],
    queryFn: () => getInventory({ page: 1, pageSize: 200 })
  })
  const { data: schedulePage } = useQuery({
    queryKey: ["schedules", { page: 1, pageSize: 200 }],
    queryFn: () => getSchedules({ page: 1, pageSize: 200 })
  })

  const backlogs = backlogPage?.data ?? []
  const inventory = inventoryPage?.data ?? []
  const schedules = schedulePage?.data ?? []

  const chartData = useMemo(() => {
    const grouped = new Map<string, number>()
    backlogs.forEach((wo) => {
      grouped.set(wo.status, (grouped.get(wo.status) ?? 0) + 1)
    })
    return Array.from(grouped.entries()).map(([status, count]) => ({ status, count }))
  }, [backlogs])

  const lowStockCount = inventory.filter((item) => item.stock <= item.minimum_stock).length

  return (
    <main className="page-shell space-y-4">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="muted mt-1 text-sm">Ringkasan operasional produksi bengkel</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card title="Work Orders">Total: {backlogPage?.count ?? 0}</Card>
        <Card title="Low Stock Alert">Items: {lowStockCount}</Card>
        <Card title="Schedules">Open: {schedules.filter((it) => it.status !== "completed").length}</Card>
      </div>

      <Card title="Backlog by Status">
        <BacklogChart data={chartData} />
      </Card>
    </main>
  )
}