export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      work_orders: {
        Row: {
          id: string
          wo_number: string
          customer_name: string
          status: string
          created_at: string
        }
      }
    }
  }
}
