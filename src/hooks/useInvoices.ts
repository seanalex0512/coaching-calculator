import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Invoice, InvoiceStatus, Session } from '../types'
import { useAuth } from '../contexts/AuthContext'

export const useInvoices = () => {
  const { user } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch all invoices for the current user
  const fetchInvoices = async () => {
    if (!user) {
      setInvoices([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      // Map database fields (snake_case) to TypeScript interface (camelCase)
      const mappedInvoices: Invoice[] = (data || []).map((invoice: any) => ({
        id: invoice.id,
        studentId: invoice.student_id,
        invoiceNumber: invoice.invoice_number,
        totalAmount: parseFloat(invoice.total_amount),
        status: invoice.status,
        createdAt: invoice.created_at,
        sentAt: invoice.sent_at,
        paidAt: invoice.paid_at,
        notes: invoice.notes,
      }))

      setInvoices(mappedInvoices)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch invoices')
      console.error('Error fetching invoices:', err)
    } finally {
      setLoading(false)
    }
  }

  // Generate next invoice number
  const generateInvoiceNumber = async (studentId: string): Promise<string> => {
    // Get count of invoices for this student
    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('user_id', user?.id)

    const nextNumber = (count || 0) + 1
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')

    return `INV-${year}${month}-${String(nextNumber).padStart(3, '0')}`
  }

  // Create a new invoice and link sessions to it
  const createInvoice = async (
    studentId: string,
    sessionIds: string[],
    totalAmount: number,
    notes?: string
  ): Promise<Invoice> => {
    if (!user) throw new Error('User not authenticated')

    try {
      setError(null)

      const invoiceNumber = await generateInvoiceNumber(studentId)

      // Create the invoice
      const { data: invoiceData, error: insertError } = await supabase
        .from('invoices')
        .insert([
          {
            student_id: studentId,
            invoice_number: invoiceNumber,
            total_amount: totalAmount,
            status: 'draft',
            notes: notes || null,
            user_id: user.id,
          },
        ])
        .select()
        .single()

      if (insertError) throw insertError

      // Link sessions to this invoice
      if (sessionIds.length > 0) {
        const { error: updateError } = await supabase
          .from('sessions')
          .update({ invoice_id: invoiceData.id })
          .in('id', sessionIds)

        if (updateError) throw updateError
      }

      // Refresh the list
      await fetchInvoices()

      return {
        id: invoiceData.id,
        studentId: invoiceData.student_id,
        invoiceNumber: invoiceData.invoice_number,
        totalAmount: parseFloat(invoiceData.total_amount),
        status: invoiceData.status,
        createdAt: invoiceData.created_at,
        sentAt: invoiceData.sent_at,
        paidAt: invoiceData.paid_at,
        notes: invoiceData.notes,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create invoice'
      setError(message)
      console.error('Error creating invoice:', err)
      throw new Error(message)
    }
  }

  // Update invoice status
  const updateInvoiceStatus = async (id: string, status: InvoiceStatus) => {
    try {
      setError(null)
      const updateData: any = { status }

      if (status === 'sent') {
        updateData.sent_at = new Date().toISOString()
      } else if (status === 'paid') {
        updateData.paid_at = new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', id)

      if (updateError) throw updateError

      // Refresh the list
      await fetchInvoices()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update invoice'
      setError(message)
      console.error('Error updating invoice:', err)
      throw new Error(message)
    }
  }

  // Delete an invoice (unlinks sessions)
  const deleteInvoice = async (id: string) => {
    try {
      setError(null)

      // First, unlink all sessions from this invoice
      const { error: unlinkError } = await supabase
        .from('sessions')
        .update({ invoice_id: null })
        .eq('invoice_id', id)

      if (unlinkError) throw unlinkError

      // Then delete the invoice
      const { error: deleteError } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      // Refresh the list
      await fetchInvoices()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete invoice'
      setError(message)
      console.error('Error deleting invoice:', err)
      throw new Error(message)
    }
  }

  // Get sessions for a specific invoice
  const getInvoiceSessions = async (invoiceId: string): Promise<Session[]> => {
    const { data, error: fetchError } = await supabase
      .from('sessions')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('session_date', { ascending: true })

    if (fetchError) throw fetchError

    return (data || []).map((session: any) => ({
      id: session.id,
      studentId: session.student_id,
      category: session.category,
      sessionDate: session.session_date,
      durationMinutes: session.duration_minutes,
      price: session.price,
      notes: session.notes,
      status: session.status,
      scheduleSlotId: session.schedule_slot_id,
      invoiceId: session.invoice_id,
      rescheduledToDate: session.rescheduled_to_date,
      rescheduledToTime: session.rescheduled_to_time,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
    }))
  }

  // Get uninvoiced sessions for a student
  const getUninvoicedSessions = async (studentId: string): Promise<Session[]> => {
    const { data, error: fetchError } = await supabase
      .from('sessions')
      .select('*')
      .eq('student_id', studentId)
      .eq('status', 'completed')
      .is('invoice_id', null)
      .order('session_date', { ascending: true })

    if (fetchError) throw fetchError

    return (data || []).map((session: any) => ({
      id: session.id,
      studentId: session.student_id,
      category: session.category,
      sessionDate: session.session_date,
      durationMinutes: session.duration_minutes,
      price: session.price,
      notes: session.notes,
      status: session.status,
      scheduleSlotId: session.schedule_slot_id,
      invoiceId: session.invoice_id,
      rescheduledToDate: session.rescheduled_to_date,
      rescheduledToTime: session.rescheduled_to_time,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
    }))
  }

  // Initial fetch
  useEffect(() => {
    fetchInvoices()
  }, [user])

  return {
    invoices,
    loading,
    error,
    createInvoice,
    updateInvoiceStatus,
    deleteInvoice,
    getInvoiceSessions,
    getUninvoicedSessions,
    refetch: fetchInvoices,
  }
}
