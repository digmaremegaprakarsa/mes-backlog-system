"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError("")

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    setLoading(false)

    if (signInError) {
      setError(signInError.message)
      return
    }

    if (data.session?.access_token) {
      const maxAge = data.session.expires_in ?? 3600
      document.cookie = `sb-access-token=${data.session.access_token}; Path=/; Max-Age=${maxAge}; SameSite=Lax; Secure`
    }

    router.push("/dashboard")
  }

  return (
    <main className="page-shell flex min-h-screen items-center justify-center">
      <div className="glass-panel w-full max-w-md p-6">
        <h1 className="text-2xl font-semibold">Login</h1>
        <p className="muted mt-2 text-sm">Masuk menggunakan akun Supabase untuk akses modul MES.</p>
        <form className="mt-5 space-y-3" onSubmit={onSubmit}>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Email</span>
            <input
              className="w-full rounded-xl border border-white/80 bg-white/80 px-3 py-2 text-sm outline-none ring-slate-300 focus:ring"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@company.com"
              required
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Password</span>
            <input
              className="w-full rounded-xl border border-white/80 bg-white/80 px-3 py-2 text-sm outline-none ring-slate-300 focus:ring"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              required
            />
          </label>

          {error ? <p className="text-sm text-rose-700">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Masuk..." : "Masuk"}
          </button>
        </form>
      </div>
    </main>
  )
}
