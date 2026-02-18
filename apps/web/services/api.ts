import { supabase } from "@/lib/supabaseClient"

export type ApiResult<T> = {
  data: T
  error: null
} | {
  data: null
  error: Error
}

export const unwrap = <T>(data: T | null, error: Error | null): T => {
  if (error) throw error
  if (data == null) throw new Error("No data returned from API")
  return data
}

export const withApi = async <T>(run: () => Promise<{ data: T | null; error: Error | null }>): Promise<ApiResult<T>> => {
  try {
    const { data, error } = await run()
    if (error) return { data: null, error }
    if (data == null) return { data: null, error: new Error("No data returned from API") }
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

export const api = {
  supabase,
  unwrap,
  withApi
}
