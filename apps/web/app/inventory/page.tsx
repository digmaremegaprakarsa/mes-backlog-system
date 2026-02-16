"use client"

import { FormEvent, useMemo, useState } from "react"
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Pagination } from "@/components/ui/Pagination"
import { TableShell } from "@/components/tables/TableShell"
import {
  createInventoryItem,
  deleteInventoryItem,
  getInventory,
  updateInventoryItem
} from "@/services/inventory.service"
import { DEFAULT_WORKSHOP_ID } from "@/lib/constants"
import type { InventoryItem, InventoryItemInput, PaginatedResult } from "@/types/models"

const emptyForm: InventoryItemInput = {
  part_number: "",
  part_name: "",
  stock: 0,
  minimum_stock: 0
}

const pageSize = 10

export default function InventoryPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<InventoryItemInput>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const params = useMemo(() => ({ page, pageSize }), [page])

  const { data: inventoryPage } = useQuery({
    queryKey: ["inventory", params],
    queryFn: () => getInventory(params),
    placeholderData: keepPreviousData
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingId) return updateInventoryItem(editingId, form)
      return createInventoryItem(form)
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["inventory", params] })
      const previous = queryClient.getQueryData<PaginatedResult<InventoryItem>>(["inventory", params])

      if (previous) {
        if (editingId) {
          queryClient.setQueryData<PaginatedResult<InventoryItem>>(["inventory", params], {
            ...previous,
            data: previous.data.map((row) => (row.id === editingId ? { ...row, ...form } : row))
          })
        } else {
          const optimisticRow: InventoryItem = {
            id: `temp-${Date.now()}`,
            workshop_id: DEFAULT_WORKSHOP_ID,
            part_number: form.part_number,
            part_name: form.part_name,
            stock: form.stock,
            minimum_stock: form.minimum_stock,
            updated_at: new Date().toISOString()
          }
          queryClient.setQueryData<PaginatedResult<InventoryItem>>(["inventory", params], {
            ...previous,
            data: [optimisticRow, ...previous.data].slice(0, pageSize),
            count: previous.count + 1
          })
        }
      }

      return { previous }
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["inventory", params], context.previous)
    },
    onSuccess: () => {
      setForm(emptyForm)
      setEditingId(null)
      toast.success(editingId ? "Inventory updated" : "Inventory item created")
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["inventory"] })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteInventoryItem(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["inventory", params] })
      const previous = queryClient.getQueryData<PaginatedResult<InventoryItem>>(["inventory", params])

      if (previous) {
        queryClient.setQueryData<PaginatedResult<InventoryItem>>(["inventory", params], {
          ...previous,
          data: previous.data.filter((row) => row.id !== id),
          count: Math.max(0, previous.count - 1)
        })
      }
      return { previous }
    },
    onError: (_error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(["inventory", params], context.previous)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["inventory"] })
    },
    onSuccess: () => {
      toast.success("Inventory item deleted")
    }
  })

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    saveMutation.mutate()
  }

  const rows = inventoryPage?.data ?? []
  const totalRows = inventoryPage?.count ?? 0

  return (
    <main className="page-shell space-y-4">
      <div>
        <h1 className="page-title">Inventory</h1>
        <p className="muted mt-1 text-sm">Kelola stok dan ambang minimum part</p>
      </div>

      <Card title={editingId ? "Edit Inventory Item" : "Create Inventory Item"}>
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" onSubmit={submit}>
          <Input
            value={form.part_number}
            onChange={(event) => setForm((prev) => ({ ...prev, part_number: event.target.value }))}
            placeholder="Part Number"
            required
          />
          <Input
            value={form.part_name}
            onChange={(event) => setForm((prev) => ({ ...prev, part_name: event.target.value }))}
            placeholder="Part Name"
            required
          />
          <Input
            type="number"
            value={form.stock}
            onChange={(event) => setForm((prev) => ({ ...prev, stock: Number(event.target.value) }))}
            placeholder="Stock"
            required
          />
          <Input
            type="number"
            value={form.minimum_stock}
            onChange={(event) => setForm((prev) => ({ ...prev, minimum_stock: Number(event.target.value) }))}
            placeholder="Minimum Stock"
            required
          />
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

      <Card title="Inventory List">
        <TableShell>
          <table className="w-full table-auto border-collapse">
            <thead className="bg-white/80">
              <tr>
                <th className="p-2 text-left text-sm">Part Number</th>
                <th className="p-2 text-left text-sm">Part Name</th>
                <th className="p-2 text-left text-sm">Stock</th>
                <th className="p-2 text-left text-sm">Min Stock</th>
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
                  <td className="p-2 text-sm">{item.part_number}</td>
                  <td className="p-2 text-sm">{item.part_name}</td>
                  <td className="p-2 text-sm">{item.stock}</td>
                  <td className="p-2 text-sm">{item.minimum_stock}</td>
                  <td className="p-2 text-sm">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setEditingId(item.id)
                          setForm({
                            part_number: item.part_number,
                            part_name: item.part_name,
                            stock: item.stock,
                            minimum_stock: item.minimum_stock
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
