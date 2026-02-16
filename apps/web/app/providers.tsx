"use client"

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import { Toaster, toast } from "react-hot-toast"
import { getErrorMessage } from "@/lib/errors"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => {
            toast.error(`Query failed: ${getErrorMessage(error)}`)
          }
        }),
        mutationCache: new MutationCache({
          onError: (error) => {
            toast.error(`Mutation failed: ${getErrorMessage(error)}`)
          }
        }),
        defaultOptions: {
          queries: {
            retry: 2,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
            refetchOnWindowFocus: false
          },
          mutations: {
            retry: 1,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 4000)
          }
        }
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.7)",
            background: "rgba(255,255,255,0.86)",
            color: "#0f172a",
            backdropFilter: "blur(10px)"
          }
        }}
      />
    </QueryClientProvider>
  )
}