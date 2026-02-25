import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Student, Category } from '../types'

export const useStudents = () => {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch all students
  const fetchStudents = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('students')
        .select('*')
        .eq('is_active', true)  // Only fetch active students
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      // Map database fields (snake_case) to TypeScript interface (camelCase)
      const mappedStudents: Student[] = (data || []).map((student: any) => ({
        id: student.id,
        name: student.name,
        hourlyRate: student.hourly_rate,
        category: student.category,
        isActive: student.is_active,
        createdAt: student.created_at,
        updatedAt: student.updated_at,
      }))

      setStudents(mappedStudents)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch students')
      console.error('Error fetching students:', err)
    } finally {
      setLoading(false)
    }
  }

  // Add a new student
  const addStudent = async (student: {
    name: string
    hourlyRate: number
    category: Category
  }) => {
    try {
      setError(null)
      const { data, error: insertError } = await supabase
        .from('students')
        .insert([
          {
            name: student.name,
            hourly_rate: student.hourlyRate,
            category: student.category,
          } as any,
        ])
        .select()
        .single()

      if (insertError) throw insertError

      // Refresh the list
      await fetchStudents()
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add student'
      setError(message)
      console.error('Error adding student:', err)
      throw new Error(message)
    }
  }

  // Update an existing student
  const updateStudent = async (
    id: string,
    updates: {
      name?: string
      hourlyRate?: number
      category?: Category
      isActive?: boolean
    }
  ) => {
    try {
      setError(null)
      const updateData: any = {}
      if (updates.name !== undefined) updateData.name = updates.name
      if (updates.hourlyRate !== undefined) updateData.hourly_rate = updates.hourlyRate
      if (updates.category !== undefined) updateData.category = updates.category
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive

      const { data, error: updateError } = await supabase
        .from('students')
        .update(updateData as any)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      // Refresh the list
      await fetchStudents()
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update student'
      setError(message)
      console.error('Error updating student:', err)
      throw new Error(message)
    }
  }

  // Soft delete a student (set is_active to false)
  const deleteStudent = async (id: string) => {
    try {
      setError(null)
      console.log('Deleting student with ID:', id)

      const { data, error: deleteError } = await supabase
        .from('students')
        .update({ is_active: false } as any)
        .eq('id', id)
        .select()

      console.log('Delete result:', { data, error: deleteError })

      if (deleteError) throw deleteError

      // Refresh the list
      await fetchStudents()
      console.log('Student list refreshed after delete')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete student'
      setError(message)
      console.error('Error deleting student:', err)
      throw new Error(message)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchStudents()
  }, [])

  return {
    students,
    loading,
    error,
    addStudent,
    updateStudent,
    deleteStudent,
    refetch: fetchStudents,
  }
}
