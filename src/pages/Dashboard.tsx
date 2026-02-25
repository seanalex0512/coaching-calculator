import { useState, useEffect } from 'react'
import { useStudents } from '../hooks/useStudents'
import { useSessions } from '../hooks/useSessions'
import { useSchedule } from '../hooks/useSchedule'
import { TrendingUpIcon, ClockIcon, CheckIcon, XIcon } from '../components/ui/Icons'
import { CATEGORIES, Session } from '../types'
import RescheduleModal from '../components/RescheduleModal'

const Dashboard = () => {
  const { students, loading: studentsLoading } = useStudents()
  const { sessions, loading: sessionsLoading, addSession, updateSession } = useSessions()
  const { scheduleSlots } = useSchedule()
  const [processingSessionId, setProcessingSessionId] = useState<string | null>(null)
  const [rescheduleItem, setRescheduleItem] = useState<{ type: 'slot' | 'session', data: any } | null>(null)

  const loading = studentsLoading || sessionsLoading

  // Calculate earnings data (only completed sessions)
  const totalEarnings = sessions
    .filter((s) => s.status === 'completed')
    .reduce((sum, session) => sum + session.price, 0)

  // Get last 6 months of data for the chart
  const getMonthlyData = () => {
    const months: { month: string; label: string; earnings: number }[] = []
    const now = new Date()

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      // Fix timezone issue - construct monthKey directly from year and month
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const monthKey = `${year}-${month}`
      const monthLabel = date.toLocaleDateString('en-US', { month: 'short' })

      const monthEarnings = sessions
        .filter((s) => s.sessionDate.startsWith(monthKey) && s.status === 'completed')
        .reduce((sum, s) => sum + s.price, 0)

      months.push({ month: monthKey, label: monthLabel, earnings: monthEarnings })
    }
    return months
  }

  const monthlyData = getMonthlyData()
  const maxEarnings = Math.max(...monthlyData.map((m) => m.earnings), 1)
  const currentMonth = monthlyData[monthlyData.length - 1]
  const lastMonth = monthlyData[monthlyData.length - 2]

  // Calculate growth percentage
  const growth = lastMonth.earnings > 0
    ? ((currentMonth.earnings - lastMonth.earnings) / lastMonth.earnings) * 100
    : 0

  // Get today's day of week (0 = Sunday, 1 = Monday, etc.)
  const todayDayOfWeek = new Date().getDay()
  const todayDate = new Date().toISOString().split('T')[0]

  // Get today's schedule slots
  const todaySlots = scheduleSlots.filter((slot) => {
    return slot.dayOfWeek === todayDayOfWeek && slot.isActive
  }).sort((a, b) => a.startTime.localeCompare(b.startTime))

  // Get today's sessions to check which slots have been marked
  const todaySessions = sessions.filter((s) => s.sessionDate === todayDate)

  // Filter out slots that already have a session (completed, missed, or rescheduled)
  const pendingSlots = todaySlots.filter(slot => {
    const hasSession = todaySessions.some(s => s.scheduleSlotId === slot.id)
    return !hasSession
  })

  // Get pending rescheduled sessions for today (sessions without scheduleSlotId and status='pending')
  const pendingRescheduledSessions = sessions.filter(s =>
    s.sessionDate === todayDate &&
    s.status === 'pending' &&
    !s.scheduleSlotId
  ).sort((a, b) => (a.rescheduledToTime || '').localeCompare(b.rescheduledToTime || ''))

  // Combine both regular slots and rescheduled sessions
  const allPendingItems = [
    ...pendingSlots.map(slot => ({ type: 'slot' as const, data: slot })),
    ...pendingRescheduledSessions.map(session => ({ type: 'session' as const, data: session }))
  ]

  const handleMarkDone = async (item: typeof allPendingItems[0]) => {
    const id = item.type === 'slot' ? item.data.id : item.data.id
    // Prevent duplicate clicks
    if (processingSessionId === id) return

    setProcessingSessionId(id)

    try {
      if (item.type === 'slot') {
        // Create a completed session for a regular slot
        await addSession({
          studentId: item.data.studentId,
          category: item.data.category,
          sessionDate: todayDate,
          durationMinutes: item.data.durationMinutes,
          price: item.data.price,
          status: 'completed',
          scheduleSlotId: item.data.id,
        })
      } else {
        // Update rescheduled session to completed
        await updateSession(item.data.id, { status: 'completed' })
      }
    } catch (err) {
      console.error('Error marking session as done:', err)
    } finally {
      setProcessingSessionId(null)
    }
  }

  const handleMarkMissed = async (item: typeof allPendingItems[0]) => {
    const id = item.type === 'slot' ? item.data.id : item.data.id
    // Prevent duplicate clicks
    if (processingSessionId === id) return

    setProcessingSessionId(id)

    try {
      if (item.type === 'slot') {
        // Create a missed session for a regular slot
        await addSession({
          studentId: item.data.studentId,
          category: item.data.category,
          sessionDate: todayDate,
          durationMinutes: item.data.durationMinutes,
          price: item.data.price,
          status: 'missed',
          scheduleSlotId: item.data.id,
        })
      } else {
        // Update rescheduled session to missed
        await updateSession(item.data.id, { status: 'missed' })
      }
    } catch (err) {
      console.error('Error marking session as missed:', err)
    } finally {
      setProcessingSessionId(null)
    }
  }

  const handleReschedule = (item: typeof allPendingItems[0]) => {
    setRescheduleItem(item)
  }

  const handleRescheduleConfirm = async (newDate: string, newTime: string) => {
    if (!rescheduleItem) return

    const id = rescheduleItem.type === 'slot' ? rescheduleItem.data.id : rescheduleItem.data.id
    setProcessingSessionId(id)

    try {
      if (rescheduleItem.type === 'slot') {
        // Mark original slot as rescheduled
        await addSession({
          studentId: rescheduleItem.data.studentId,
          category: rescheduleItem.data.category,
          sessionDate: todayDate,
          durationMinutes: rescheduleItem.data.durationMinutes,
          price: rescheduleItem.data.price,
          status: 'rescheduled',
          scheduleSlotId: rescheduleItem.data.id,
          rescheduledToDate: newDate,
          rescheduledToTime: newTime,
        })

        // Create new pending session for the new date
        await addSession({
          studentId: rescheduleItem.data.studentId,
          category: rescheduleItem.data.category,
          sessionDate: newDate,
          durationMinutes: rescheduleItem.data.durationMinutes,
          price: rescheduleItem.data.price,
          status: 'pending',
          rescheduledToTime: newTime,
        })
      } else {
        // Update existing rescheduled session with new date/time
        await updateSession(rescheduleItem.data.id, {
          sessionDate: newDate,
          rescheduledToTime: newTime,
        })
      }
    } catch (err) {
      console.error('Error rescheduling session:', err)
    } finally {
      setProcessingSessionId(null)
      setRescheduleItem(null)
    }
  }

  const handleRescheduleCancel = () => {
    setRescheduleItem(null)
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins}m`
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}m`
  }

  const getStudentName = (studentId: string) => {
    return students.find((s) => s.id === studentId)?.name || 'Unknown'
  }

  const getTodayFormatted = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const today = new Date()
    return `${days[today.getDay()]}, ${today.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })}`
  }

  if (loading) {
    return (
      <div className="px-4 pt-12 pb-4 max-w-lg mx-auto flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-12 pb-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Dashboard</h1>
        <p className="text-slate-500">Track your coaching business</p>
      </div>

      {/* Total Earnings Card */}
      <div className="card p-6 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">Total Earnings</p>
            <p className="text-4xl font-bold text-slate-900">
              ${totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          {growth !== 0 && (
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium ${
              growth > 0
                ? 'bg-success-50 text-success-600'
                : 'bg-red-50 text-red-600'
            }`}>
              <TrendingUpIcon size={14} className={growth < 0 ? 'rotate-180' : ''} />
              <span>{Math.abs(growth).toFixed(0)}%</span>
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="mt-6">
          <div className="flex items-end justify-between gap-2 h-32 mb-2">
            {monthlyData.map((month, i) => {
              const height = maxEarnings > 0
                ? (month.earnings / maxEarnings) * 100
                : 0
              const isCurrentMonth = i === monthlyData.length - 1

              return (
                <div key={month.month} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col items-center justify-end h-28">
                    {month.earnings > 0 && (
                      <span className="text-[10px] text-slate-500 font-medium mb-1">
                        ${month.earnings >= 1000
                          ? `${(month.earnings / 1000).toFixed(1)}k`
                          : month.earnings.toFixed(0)}
                      </span>
                    )}
                    <div
                      className={`w-full max-w-[40px] rounded-t-lg transition-all duration-300 ${
                        isCurrentMonth
                          ? 'bg-slate-900'
                          : 'bg-slate-200'
                      }`}
                      style={{ height: month.earnings > 0 ? `${height}%` : '2px' }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex justify-between gap-2">
            {monthlyData.map((month, i) => (
              <div
                key={month.month}
                className={`flex-1 text-center text-xs font-medium ${
                  i === monthlyData.length - 1 ? 'text-slate-900' : 'text-slate-400'
                }`}
              >
                {month.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="card p-4">
          <p className="text-slate-500 text-xs font-medium mb-1">This Month</p>
          <p className="text-2xl font-bold text-slate-900">
            ${currentMonth.earnings.toFixed(0)}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-slate-500 text-xs font-medium mb-1">Active Students</p>
          <p className="text-2xl font-bold text-slate-900">
            {students.filter((s) => s.isActive).length}
          </p>
        </div>
      </div>

      {/* Today's Classes */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Today's Classes</h2>
            <p className="text-xs text-slate-500">{getTodayFormatted()}</p>
          </div>
        </div>

        {allPendingItems.length === 0 ? (
          <div className="card p-8 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <ClockIcon size={24} className="text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium mb-1">No classes today</p>
            <p className="text-sm text-slate-400">Enjoy your day off!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allPendingItems.map((item) => {
              const { type, data } = item
              const studentId = type === 'slot' ? data.studentId : data.studentId
              const category = type === 'slot' ? data.category : data.category
              const durationMinutes = type === 'slot' ? data.durationMinutes : data.durationMinutes
              const price = type === 'slot' ? data.price : data.price
              const time = type === 'slot' ? data.startTime : data.rescheduledToTime
              const id = data.id

              const student = students.find((s) => s.id === studentId)
              const catInfo = CATEGORIES[category]
              const isProcessing = processingSessionId === id

              return (
                <div
                  key={id}
                  className={`card p-4 transition-all duration-300 ${
                    isProcessing ? 'opacity-50 scale-[0.98]' : ''
                  }`}
                >
                  {/* Session Info */}
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                      style={{ backgroundColor: catInfo.color }}
                    >
                      {student?.name.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900">{getStudentName(studentId)}</h3>
                        <span
                          className="px-2 py-0.5 text-[10px] font-medium rounded-full"
                          style={{ backgroundColor: catInfo.bgColor, color: catInfo.color }}
                        >
                          {catInfo.name}
                        </span>
                        {type === 'session' && (
                          <span className="px-2 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-600 rounded-full">
                            Rescheduled
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <ClockIcon size={14} />
                        <span>
                          {time ? formatTime(time) : 'No time'} · {formatDuration(durationMinutes)}
                        </span>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-emerald-600">${price.toFixed(0)}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMarkMissed(item)}
                      disabled={isProcessing}
                      className="btn-secondary flex-1 py-2.5 text-red-600 border-red-200 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <XIcon size={18} />
                      Missed
                    </button>
                    <button
                      onClick={() => handleReschedule(item)}
                      disabled={isProcessing}
                      className="btn-secondary flex-1 py-2.5 text-blue-600 border-blue-200 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <ClockIcon size={18} />
                      Reschedule
                    </button>
                    <button
                      onClick={() => handleMarkDone(item)}
                      disabled={isProcessing}
                      className="btn-primary flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <CheckIcon size={18} />
                      Done
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      {rescheduleItem && (
        <RescheduleModal
          studentName={getStudentName(
            rescheduleItem.type === 'slot'
              ? rescheduleItem.data.studentId
              : rescheduleItem.data.studentId
          )}
          onConfirm={handleRescheduleConfirm}
          onCancel={handleRescheduleCancel}
        />
      )}
    </div>
  )
}

export default Dashboard
