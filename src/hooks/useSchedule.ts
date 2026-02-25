import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { ScheduleSlot, Category } from '../types'

export const useSchedule = () => {
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch all schedule slots
  const fetchScheduleSlots = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('schedule_slots')
        .select('*')
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true })

      if (fetchError) throw fetchError

      // Map database fields (snake_case) to TypeScript interface (camelCase)
      const mappedSlots: ScheduleSlot[] = (data || []).map((slot: any) => ({
        id: slot.id,
        studentId: slot.student_id,
        dayOfWeek: slot.day_of_week,
        startTime: slot.start_time,
        durationMinutes: slot.duration_minutes,
        category: slot.category,
        price: slot.price,
        isActive: slot.is_active,
        createdAt: slot.created_at,
      }))

      setScheduleSlots(mappedSlots)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch schedule slots')
      console.error('Error fetching schedule slots:', err)
    } finally {
      setLoading(false)
    }
  }

  // Add a new schedule slot
  const addScheduleSlot = async (slot: {
    studentId: string
    dayOfWeek: number
    startTime: string
    durationMinutes: number
    category: Category
    price: number
  }) => {
    try {
      setError(null)
      const { data, error: insertError } = await supabase
        .from('schedule_slots')
        // @ts-ignore - Supabase type inference issue
        .insert([
          {
            student_id: slot.studentId,
            day_of_week: slot.dayOfWeek,
            start_time: slot.startTime,
            duration_minutes: slot.durationMinutes,
            category: slot.category,
            price: slot.price,
          },
        ])
        .select()
        .single()

      if (insertError) throw insertError

      // Refresh the list
      await fetchScheduleSlots()
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add schedule slot'
      setError(message)
      console.error('Error adding schedule slot:', err)
      throw new Error(message)
    }
  }

  // Update an existing schedule slot
  const updateScheduleSlot = async (
    id: string,
    updates: {
      studentId?: string
      dayOfWeek?: number
      startTime?: string
      durationMinutes?: number
      category?: Category
      price?: number
      isActive?: boolean
    }
  ) => {
    try {
      setError(null)
      const updateData: any = {}
      if (updates.studentId !== undefined) updateData.student_id = updates.studentId
      if (updates.dayOfWeek !== undefined) updateData.day_of_week = updates.dayOfWeek
      if (updates.startTime !== undefined) updateData.start_time = updates.startTime
      if (updates.durationMinutes !== undefined)
        updateData.duration_minutes = updates.durationMinutes
      if (updates.category !== undefined) updateData.category = updates.category
      if (updates.price !== undefined) updateData.price = updates.price
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive

      const { data, error: updateError } = await supabase
        .from('schedule_slots')
        // @ts-ignore - Supabase type inference issue
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      // Refresh the list
      await fetchScheduleSlots()
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update schedule slot'
      setError(message)
      console.error('Error updating schedule slot:', err)
      throw new Error(message)
    }
  }

  // Delete a schedule slot
  const deleteScheduleSlot = async (id: string) => {
    try {
      setError(null)
      const { error: deleteError } = await supabase
        .from('schedule_slots')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      // Refresh the list
      await fetchScheduleSlots()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete schedule slot'
      setError(message)
      console.error('Error deleting schedule slot:', err)
      throw new Error(message)
    }
  }

  // Get schedule slots for a specific day
  const getScheduleForDay = (dayOfWeek: number) => {
    return scheduleSlots.filter((slot) => slot.dayOfWeek === dayOfWeek && slot.isActive)
  }

  // Initial fetch
  useEffect(() => {
    fetchScheduleSlots()
  }, [])

  return {
    scheduleSlots,
    loading,
    error,
    addScheduleSlot,
    updateScheduleSlot,
    deleteScheduleSlot,
    getScheduleForDay,
    refetch: fetchScheduleSlots,
  }
}
