import { useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"

export const useRealtime = (table: string, callback: (payload: unknown) => void) => {
  useEffect(() => {
    const channel = supabase
      .channel(table)
      .on("postgres_changes", { event: "*", schema: "public", table }, callback)
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [table, callback])
}
