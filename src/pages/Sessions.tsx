import { useState } from 'react'
import { Session, Category, CATEGORIES } from '../types'
import { useSessions } from '../hooks/useSessions'
import { useStudents } from '../hooks/useStudents'
import SessionForm from '../components/sessions/SessionForm'
import { PlusIcon, ClockIcon } from '../components/ui/Icons'

const Sessions = () => {
  const { sessions, loading, error, addSession, updateSession, deleteSession } = useSessions()
  const { students } = useStudents()
  const [showForm, setShowForm] = useState(false)
  const [editingSession, setEditingSession] = useState<Session | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'missed'>('all')

  const handleAddClick = () => {
    setEditingSession(null)
    setShowForm(true)
  }

  const handleEditClick = (session: Session) => {
    setEditingSession(session)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingSession(null)
  }

  const handleSaveSession = async (data: {
    id?: string
    studentId: string
    category: Category
    sessionDate: string
    durationMinutes: number
    price: number
    notes?: string
    status: 'completed' | 'missed' | 'cancelled'
  }) => {
    if (data.id) {
      // Update existing session
      await updateSession(data.id, {
        studentId: data.studentId,
        category: data.category,
        sessionDate: data.sessionDate,
        durationMinutes: data.durationMinutes,
        price: data.price,
        notes: data.notes,
        status: data.status,
      })
    } else {
      // Add new session
      await addSession({
        studentId: data.studentId,
        category: data.category,
        sessionDate: data.sessionDate,
        durationMinutes: data.durationMinutes,
        price: data.price,
        notes: data.notes,
        status: data.status,
      })
    }
  }

  const handleDeleteSession = async (id: string) => {
    await deleteSession(id)
  }

  const getStudentName = (studentId: string) => {
    return students.find((s) => s.id === studentId)?.name || 'Unknown'
  }

  const getStudentInitial = (studentId: string) => {
    const name = getStudentName(studentId)
    return name.charAt(0)
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins}m`
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}m`
  }

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (dateString === today.toISOString().split('T')[0]) {
      return 'Today'
    }
    if (dateString === yesterday.toISOString().split('T')[0]) {
      return 'Yesterday'
    }

    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    })
  }

  // Filter sessions (history only - exclude pending)
  const filteredSessions = sessions.filter((s) => {
    // Exclude pending sessions - only show history
    if (s.status === 'pending') return false

    const categoryMatch = categoryFilter === 'all' || s.category === categoryFilter
    const statusMatch =
      statusFilter === 'all' ||
      (statusFilter === 'completed' && s.status === 'completed') ||
      (statusFilter === 'missed' && (s.status === 'missed' || s.status === 'cancelled' || s.status === 'rescheduled'))
    return categoryMatch && statusMatch
  })

  // Group sessions by date
  const sessionsByDate = filteredSessions
    .sort((a, b) => b.sessionDate.localeCompare(a.sessionDate))
    .reduce((groups, session) => {
      const date = session.sessionDate
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(session)
      return groups
    }, {} as Record<string, Session[]>)

  // Calculate totals for the current month
  const thisMonth = new Date().toISOString().substring(0, 7)
  const thisMonthSessions = filteredSessions.filter(
    (s) => s.sessionDate.startsWith(thisMonth) && s.status === 'completed'
  )
  const thisMonthEarnings = thisMonthSessions.reduce((sum, s) => sum + s.price, 0)

  if (loading) {
    return (
      <div className="px-4 pt-12 pb-4 max-w-lg mx-auto flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-500">Loading sessions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-12 pb-4 max-w-lg mx-auto">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Sessions</h1>
        <p className="text-slate-500">
          {thisMonthSessions.length} this month · ${thisMonthEarnings.toFixed(0)}
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              statusFilter === 'completed'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setStatusFilter('missed')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              statusFilter === 'missed'
                ? 'bg-red-600 text-white'
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
          >
            Missed
          </button>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
              categoryFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Categories
          </button>
          {(Object.keys(CATEGORIES) as Category[]).map((cat) => {
            const catInfo = CATEGORIES[cat]
            const isSelected = categoryFilter === cat
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5`}
                style={{
                  backgroundColor: isSelected ? catInfo.color : catInfo.bgColor,
                  color: isSelected ? 'white' : catInfo.color,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: isSelected ? 'white' : catInfo.color }}
                />
                {catInfo.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Session List */}
      {Object.keys(sessionsByDate).length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ClockIcon size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No sessions yet</h3>
          <p className="text-slate-500 mb-6">Track your first coaching session</p>
          <button onClick={handleAddClick} className="btn-primary">
            Add Session
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(sessionsByDate).map(([date, dateSessions]) => (
            <div key={date}>
              {/* Date Header */}
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                {formatDateHeader(date)}
              </h2>

              {/* Sessions for this date */}
              <div className="space-y-3">
                {dateSessions.map((session) => {
                  const catInfo = CATEGORIES[session.category]
                  const isMissed = session.status === 'missed' || session.status === 'cancelled'
                  const isRescheduled = session.status === 'rescheduled'
                  const isNotEarned = isMissed || isRescheduled

                  return (
                    <div
                      key={session.id}
                      onClick={() => handleEditClick(session)}
                      className={`card p-4 flex items-center gap-4 active:scale-[0.98] transition-all cursor-pointer ${
                        isNotEarned ? 'opacity-60' : ''
                      }`}
                      style={{ borderLeft: `4px solid ${isRescheduled ? '#3b82f6' : isMissed ? '#ef4444' : catInfo.color}` }}
                    >
                      {/* Avatar */}
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white"
                        style={{ backgroundColor: isRescheduled ? '#3b82f6' : isMissed ? '#94a3b8' : catInfo.color }}
                      >
                        {getStudentInitial(session.studentId)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900 truncate">
                            {getStudentName(session.studentId)}
                          </h3>
                          <span
                            className="px-2 py-0.5 text-[10px] font-medium rounded-full"
                            style={{ backgroundColor: catInfo.bgColor, color: catInfo.color }}
                          >
                            {catInfo.name}
                          </span>
                          {isRescheduled && (
                            <span className="px-2 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-600 rounded-full">
                              Rescheduled
                            </span>
                          )}
                          {isMissed && (
                            <span className="px-2 py-0.5 text-[10px] font-medium bg-red-100 text-red-600 rounded-full">
                              {session.status === 'missed' ? 'Missed' : 'Cancelled'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <ClockIcon size={14} />
                          <span>{formatDuration(session.durationMinutes)}</span>
                          {session.notes && (
                            <>
                              <span className="text-slate-300">·</span>
                              <span className="truncate">{session.notes}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Price */}
                      <p className={`text-lg font-bold ${isNotEarned ? 'text-slate-400' : 'text-emerald-600'}`}>
                        {isNotEarned ? '-' : `+$${session.price.toFixed(0)}`}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Action Button */}
      {Object.keys(sessionsByDate).length > 0 && (
        <button
          onClick={handleAddClick}
          className="fixed bottom-24 right-6 w-14 h-14 bg-slate-900 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-slate-800 active:scale-95 transition-all z-10"
          aria-label="Add session"
        >
          <PlusIcon size={24} />
        </button>
      )}

      {/* Session Form Modal */}
      {showForm && (
        <SessionForm
          session={editingSession}
          students={students}
          onClose={handleFormClose}
          onSave={handleSaveSession}
          onDelete={editingSession ? handleDeleteSession : undefined}
        />
      )}
    </div>
  )
}

export default Sessions
