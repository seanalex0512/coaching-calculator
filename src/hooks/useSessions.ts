import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Session, Category } from '../types'

type SessionStatus = 'completed' | 'missed' | 'cancelled' | 'pending' | 'rescheduled'

export const useSessions = () => {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch all sessions
  const fetchSessions = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('sessions')
        .select('*')
        .order('session_date', { ascending: false })

      if (fetchError) throw fetchError

      // Map database fields (snake_case) to TypeScript interface (camelCase)
      const mappedSessions: Session[] = (data || []).map((session: any) => ({
        id: session.id,
        studentId: session.student_id,
        category: session.category,
        sessionDate: session.session_date,
        durationMinutes: session.duration_minutes,
        price: session.price,
        notes: session.notes,
        status: session.status,
        scheduleSlotId: session.schedule_slot_id,
        rescheduledToDate: session.rescheduled_to_date,
        rescheduledToTime: session.rescheduled_to_time,
        createdAt: session.created_at,
        updatedAt: session.updated_at,
      }))

      setSessions(mappedSessions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions')
      console.error('Error fetching sessions:', err)
    } finally {
      setLoading(false)
    }
  }

  // Add a new session
  const addSession = async (session: {
    studentId: string
    category: Category
    sessionDate: string
    durationMinutes: number
    price: number
    notes?: string
    status?: SessionStatus
    scheduleSlotId?: string
    rescheduledToDate?: string
    rescheduledToTime?: string
  }) => {
    try {
      setError(null)
      const { data, error: insertError } = await supabase
        .from('sessions')
        .insert([
          {
            student_id: session.studentId,
            category: session.category,
            session_date: session.sessionDate,
            duration_minutes: session.durationMinutes,
            price: session.price,
            notes: session.notes || null,
            status: session.status || 'completed',
            schedule_slot_id: session.scheduleSlotId || null,
            rescheduled_to_date: session.rescheduledToDate || null,
            rescheduled_to_time: session.rescheduledToTime || null,
          },
        ])
        .select()
        .single()

      if (insertError) throw insertError

      // Refresh the list
      await fetchSessions()
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add session'
      setError(message)
      console.error('Error adding session:', err)
      throw new Error(message)
    }
  }

  // Update an existing session
  const updateSession = async (
    id: string,
    updates: {
      studentId?: string
      category?: Category
      sessionDate?: string
      durationMinutes?: number
      price?: number
      notes?: string
      status?: SessionStatus
    }
  ) => {
    try {
      setError(null)
      const updateData: any = {}
      if (updates.studentId !== undefined) updateData.student_id = updates.studentId
      if (updates.category !== undefined) updateData.category = updates.category
      if (updates.sessionDate !== undefined) updateData.session_date = updates.sessionDate
      if (updates.durationMinutes !== undefined)
        updateData.duration_minutes = updates.durationMinutes
      if (updates.price !== undefined) updateData.price = updates.price
      if (updates.notes !== undefined) updateData.notes = updates.notes
      if (updates.status !== undefined) updateData.status = updates.status

      const { data, error: updateError } = await supabase
        .from('sessions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      // Refresh the list
      await fetchSessions()
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update session'
      setError(message)
      console.error('Error updating session:', err)
      throw new Error(message)
    }
  }

  // Delete a session
  const deleteSession = async (id: string) => {
    try {
      setError(null)
      const { error: deleteError } = await supabase.from('sessions').delete().eq('id', id)

      if (deleteError) throw deleteError

      // Refresh the list
      await fetchSessions()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete session'
      setError(message)
      console.error('Error deleting session:', err)
      throw new Error(message)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchSessions()
  }, [])

  return {
    sessions,
    loading,
    error,
    addSession,
    updateSession,
    deleteSession,
    refetch: fetchSessions,
  }
}
