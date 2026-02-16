import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

export const useAuth = () => {
  const [user, setUser] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })
  }, [])

  return { user, loading }
}
