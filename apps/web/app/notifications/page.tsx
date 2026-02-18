"use client"

import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { useNotifications } from "@/hooks/useNotifications"

export default function NotificationsPage() {
  const { data = [], isLoading, markRead, isMarkingRead } = useNotifications()

  return (
    <main className="page-shell space-y-4">
      <div>
        <h1 className="page-title">Notifications</h1>
        <p className="muted mt-1 text-sm">Realtime updates untuk aktivitas work order dan proses produksi.</p>
      </div>

      <Card title="Inbox">
        {isLoading ? <p className="muted text-sm">Loading notifications...</p> : null}
        {!isLoading && data.length === 0 ? <p className="muted text-sm">Belum ada notifikasi.</p> : null}

        <div className="space-y-2">
          {data.map((item) => (
            <div key={item.id} className="glass-panel flex items-start justify-between gap-3 p-3">
              <div>
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="muted text-sm">{item.message}</p>
                <p className="muted mt-1 text-xs">{new Date(item.created_at).toLocaleString()}</p>
              </div>
              {!item.is_read ? (
                <Button type="button" variant="secondary" disabled={isMarkingRead} onClick={() => markRead(item.id)}>
                  Mark Read
                </Button>
              ) : (
                <span className="muted text-xs">Read</span>
              )}
            </div>
          ))}
        </div>
      </Card>
    </main>
  )
}
