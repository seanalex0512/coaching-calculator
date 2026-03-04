import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Notification as AppNotification, NotificationSettings, NotificationType } from '../types'
import { useAuth } from '../contexts/AuthContext'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || ''

// Database row types
interface NotificationSettingsRow {
  id: string
  user_id: string
  push_enabled: boolean
  session_reminder_time: string
  session_reminder_enabled: boolean
  invoice_reminder_enabled: boolean
  invoice_reminder_day: number
  push_subscription: any
  created_at: string
  updated_at: string
}

export const useNotifications = () => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([])
      setUnreadCount(0)
      setLoading(false)
      return
    }

    try {
      setError(null)
      const now = new Date().toISOString()

      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .or(`scheduled_for.is.null,scheduled_for.lte.${now}`)
        .order('created_at', { ascending: false })
        .limit(50)

      if (fetchError) throw fetchError

      const mapped: AppNotification[] = (data || []).map((n: any) => ({
        id: n.id,
        userId: n.user_id,
        type: n.type,
        title: n.title,
        message: n.message,
        isRead: n.is_read,
        data: n.data,
        scheduledFor: n.scheduled_for,
        createdAt: n.created_at,
      }))

      setNotifications(mapped)
      setUnreadCount(mapped.filter(n => !n.isRead).length)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications')
      console.error('Error fetching notifications:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  // Fetch notification settings
  const fetchSettings = useCallback(async () => {
    if (!user) {
      setSettings(null)
      return
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is fine for new users
        throw fetchError
      }

      if (data) {
        const row = data as NotificationSettingsRow
        setSettings({
          id: row.id,
          userId: row.user_id,
          pushEnabled: row.push_enabled,
          sessionReminderTime: row.session_reminder_time,
          sessionReminderEnabled: row.session_reminder_enabled,
          invoiceReminderEnabled: row.invoice_reminder_enabled,
          invoiceReminderDay: row.invoice_reminder_day,
          pushSubscription: row.push_subscription,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })
      } else {
        // Create default settings for new user
        await createDefaultSettings()
      }
    } catch (err) {
      console.error('Error fetching notification settings:', err)
    }
  }, [user])

  // Create default notification settings
  const createDefaultSettings = async () => {
    if (!user) return

    try {
      const { data, error: insertError } = await (supabase
        .from('notification_settings') as any)
        .insert([{
          user_id: user.id,
          push_enabled: false,
          session_reminder_time: '10:00:00',
          session_reminder_enabled: true,
          invoice_reminder_enabled: true,
          invoice_reminder_day: 0, // Sunday
        }])
        .select()
        .single()

      if (insertError) throw insertError

      if (data) {
        const row = data as NotificationSettingsRow
        setSettings({
          id: row.id,
          userId: row.user_id,
          pushEnabled: row.push_enabled,
          sessionReminderTime: row.session_reminder_time,
          sessionReminderEnabled: row.session_reminder_enabled,
          invoiceReminderEnabled: row.invoice_reminder_enabled,
          invoiceReminderDay: row.invoice_reminder_day,
          pushSubscription: row.push_subscription,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })
      }
    } catch (err) {
      console.error('Error creating default settings:', err)
    }
  }

  // Create a notification
  const createNotification = async (
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, any>,
    scheduledFor?: string
  ) => {
    if (!user) return

    try {
      const { error: insertError } = await (supabase
        .from('notifications') as any)
        .insert([{
          user_id: user.id,
          type,
          title,
          message,
          data,
          scheduled_for: scheduledFor || null,
        }])

      if (insertError) throw insertError

      await fetchNotifications()
    } catch (err) {
      console.error('Error creating notification:', err)
    }
  }

  // Mark notification as read
  const markAsRead = async (id: string) => {
    try {
      const { error: updateError } = await (supabase
        .from('notifications') as any)
        .update({ is_read: true })
        .eq('id', id)

      if (updateError) throw updateError

      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user) return

    try {
      const { error: updateError } = await (supabase
        .from('notifications') as any)
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (updateError) throw updateError

      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Error marking all as read:', err)
    }
  }

  // Delete a notification
  const deleteNotification = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      const notif = notifications.find(n => n.id === id)
      setNotifications(prev => prev.filter(n => n.id !== id))
      if (notif && !notif.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error('Error deleting notification:', err)
    }
  }

  // Update notification settings
  const updateSettings = async (updates: Partial<NotificationSettings>) => {
    if (!user || !settings) return

    try {
      const updateData: any = {}
      if (updates.pushEnabled !== undefined) updateData.push_enabled = updates.pushEnabled
      if (updates.sessionReminderTime !== undefined) updateData.session_reminder_time = updates.sessionReminderTime
      if (updates.sessionReminderEnabled !== undefined) updateData.session_reminder_enabled = updates.sessionReminderEnabled
      if (updates.invoiceReminderEnabled !== undefined) updateData.invoice_reminder_enabled = updates.invoiceReminderEnabled
      if (updates.invoiceReminderDay !== undefined) updateData.invoice_reminder_day = updates.invoiceReminderDay
      if (updates.pushSubscription !== undefined) updateData.push_subscription = updates.pushSubscription

      const { error: updateError } = await (supabase
        .from('notification_settings') as any)
        .update(updateData)
        .eq('id', settings.id)

      if (updateError) throw updateError

      setSettings(prev => prev ? { ...prev, ...updates } : null)
    } catch (err) {
      console.error('Error updating settings:', err)
    }
  }

  // Request push notification permission
  const requestPushPermission = async (): Promise<boolean> => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      console.log('Push notifications not supported')
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        return false
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      // Save subscription to database
      await updateSettings({
        pushEnabled: true,
        pushSubscription: subscription.toJSON(),
      })

      return true
    } catch (err) {
      console.error('Error requesting push permission:', err)
      return false
    }
  }

  // Check for and create today's session reminders
  const checkSessionReminders = useCallback(async () => {
    if (!user || !settings?.sessionReminderEnabled) return

    const today = new Date()
    const dayOfWeek = today.getDay()
    const todayStr = today.toISOString().split('T')[0]

    // Get today's scheduled sessions
    const { data: scheduleSlots } = await supabase
      .from('schedule_slots')
      .select('*, students(name)')
      .eq('user_id', user.id)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)

    if (!scheduleSlots || scheduleSlots.length === 0) return

    // Check if we already created a reminder for today
    const { data: existingReminders } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', 'session_reminder')
      .gte('created_at', todayStr)

    if (existingReminders && existingReminders.length > 0) return

    // Create session reminder
    const sessionCount = scheduleSlots.length
    const studentNames = scheduleSlots.map((s: any) => s.students?.name).filter(Boolean)

    await createNotification(
      'session_reminder',
      `${sessionCount} session${sessionCount > 1 ? 's' : ''} today`,
      `You have classes with ${studentNames.join(', ')} today`,
      { date: todayStr, sessionCount }
    )
  }, [user, settings])

  // Check for Sunday invoice reminders
  const checkInvoiceReminders = useCallback(async () => {
    if (!user || !settings?.invoiceReminderEnabled) return

    const today = new Date()
    const dayOfWeek = today.getDay()
    const todayStr = today.toISOString().split('T')[0]

    // Check if it's the reminder day (default Sunday = 0)
    if (dayOfWeek !== settings.invoiceReminderDay) return

    // Check if we already created a reminder for today
    const { data: existingReminders } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', 'invoice_ready')
      .gte('created_at', todayStr)

    if (existingReminders && existingReminders.length > 0) return

    // Check for uninvoiced completed sessions
    const { data: uninvoicedSessions } = await supabase
      .from('sessions')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .is('invoice_id', null)

    if (!uninvoicedSessions || uninvoicedSessions.length === 0) return

    await createNotification(
      'invoice_ready',
      'Weekly invoices ready',
      `You have ${uninvoicedSessions.length} uninvoiced session${uninvoicedSessions.length > 1 ? 's' : ''} ready to bill`,
      { sessionCount: uninvoicedSessions.length }
    )
  }, [user, settings])

  // Initial fetch
  useEffect(() => {
    fetchNotifications()
    fetchSettings()
  }, [user])

  // Check for reminders when app opens
  useEffect(() => {
    if (settings) {
      checkSessionReminders()
      checkInvoiceReminders()
    }
  }, [settings])

  return {
    notifications,
    settings,
    unreadCount,
    loading,
    error,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updateSettings,
    requestPushPermission,
    refetch: fetchNotifications,
  }
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
