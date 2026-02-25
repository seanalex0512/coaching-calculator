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
      students: {
        Row: {
          id: string
          name: string
          hourly_rate: number
          category: 'gym' | 'swimming' | 'math'
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          hourly_rate: number
          category: 'gym' | 'swimming' | 'math'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          hourly_rate?: number
          category?: 'gym' | 'swimming' | 'math'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          student_id: string
          category: 'gym' | 'swimming' | 'math'
          session_date: string
          duration_minutes: number
          price: number
          notes: string | null
          status: 'completed' | 'missed' | 'cancelled' | 'pending' | 'rescheduled'
          schedule_slot_id: string | null
          rescheduled_to_date: string | null
          rescheduled_to_time: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          category: 'gym' | 'swimming' | 'math'
          session_date: string
          duration_minutes: number
          price: number
          notes?: string | null
          status?: 'completed' | 'missed' | 'cancelled' | 'pending' | 'rescheduled'
          schedule_slot_id?: string | null
          rescheduled_to_date?: string | null
          rescheduled_to_time?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          category?: 'gym' | 'swimming' | 'math'
          session_date?: string
          duration_minutes?: number
          price?: number
          notes?: string | null
          status?: 'completed' | 'missed' | 'cancelled' | 'pending' | 'rescheduled'
          schedule_slot_id?: string | null
          rescheduled_to_date?: string | null
          rescheduled_to_time?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      schedule_slots: {
        Row: {
          id: string
          student_id: string
          day_of_week: number
          start_time: string
          duration_minutes: number
          category: 'gym' | 'swimming' | 'math'
          price: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          day_of_week: number
          start_time: string
          duration_minutes?: number
          category: 'gym' | 'swimming' | 'math'
          price: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          day_of_week?: number
          start_time?: string
          duration_minutes?: number
          category?: 'gym' | 'swimming' | 'math'
          price?: number
          is_active?: boolean
          created_at?: string
        }
      }
    }
  }
}
