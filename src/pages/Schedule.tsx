import { useState } from 'react'
import { useSchedule } from '../hooks/useSchedule'
import { useStudents } from '../hooks/useStudents'
import { ScheduleSlot, Category, CATEGORIES } from '../types'
import { PlusIcon, ClockIcon, TrashIcon } from '../components/ui/Icons'

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const Schedule = () => {
  const { scheduleSlots, loading, error, addScheduleSlot, updateScheduleSlot, deleteScheduleSlot } =
    useSchedule()
  const { students } = useStudents()
  const [showForm, setShowForm] = useState(false)
  const [editingSlot, setEditingSlot] = useState<ScheduleSlot | null>(null)

  const activeStudents = students.filter((s) => s.isActive)

  // Group slots by day of week
  const slotsByDay = DAYS_OF_WEEK.map((_, dayIndex) => {
    return scheduleSlots.filter((slot) => slot.dayOfWeek === dayIndex && slot.isActive)
  })

  const handleAddClick = () => {
    setEditingSlot(null)
    setShowForm(true)
  }

  const handleEditClick = (slot: ScheduleSlot) => {
    setEditingSlot(slot)
    setShowForm(true)
  }

  const handleDeleteSlot = async (id: string) => {
    if (confirm('Delete this time slot? Sessions already created will not be affected.')) {
      await deleteScheduleSlot(id)
    }
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

  if (loading) {
    return (
      <div className="px-4 pt-12 pb-4 max-w-lg mx-auto flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-500">Loading schedule...</p>
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-1">My Schedule</h1>
        <p className="text-slate-500">Manage your recurring weekly classes</p>
      </div>

      {/* Weekly Schedule */}
      {scheduleSlots.filter((s) => s.isActive).length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ClockIcon size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No recurring classes yet</h3>
          <p className="text-slate-500 mb-6">
            Set up your weekly schedule to quickly check in each day
          </p>
          <button onClick={handleAddClick} className="btn-primary">
            Add Time Slot
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {DAYS_OF_WEEK.map((day, dayIndex) => {
            const daySlots = slotsByDay[dayIndex]
            if (daySlots.length === 0) return null

            return (
              <div key={day}>
                {/* Day Header */}
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  {day}
                </h2>

                {/* Time Slots for this day */}
                <div className="space-y-3">
                  {daySlots.map((slot) => {
                    const student = students.find((s) => s.id === slot.studentId)
                    const catInfo = CATEGORIES[slot.category]

                    return (
                      <div
                        key={slot.id}
                        onClick={() => handleEditClick(slot)}
                        className="card p-4 flex items-center gap-4 active:scale-[0.98] transition-all cursor-pointer"
                        style={{ borderLeft: `4px solid ${catInfo.color}` }}
                      >
                        {/* Avatar */}
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white"
                          style={{ backgroundColor: catInfo.color }}
                        >
                          {student?.name.charAt(0) || '?'}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-900 truncate">
                              {getStudentName(slot.studentId)}
                            </h3>
                            <span
                              className="px-2 py-0.5 text-[10px] font-medium rounded-full"
                              style={{ backgroundColor: catInfo.bgColor, color: catInfo.color }}
                            >
                              {catInfo.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <ClockIcon size={14} />
                            <span>
                              {formatTime(slot.startTime)} · {formatDuration(slot.durationMinutes)}
                            </span>
                          </div>
                        </div>

                        {/* Price */}
                        <p className="text-lg font-bold text-emerald-600">
                          ${slot.price.toFixed(0)}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={handleAddClick}
        className="fixed bottom-28 right-6 w-14 h-14 bg-slate-900 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-slate-800 active:scale-95 transition-all z-40"
        aria-label="Add time slot"
      >
        <PlusIcon size={24} />
      </button>

      {/* Schedule Form Modal */}
      {showForm && (
        <ScheduleForm
          slot={editingSlot}
          students={activeStudents}
          onClose={() => {
            setShowForm(false)
            setEditingSlot(null)
          }}
          onSave={async (data) => {
            if (data.id) {
              await updateScheduleSlot(data.id, data)
            } else {
              await addScheduleSlot(data)
            }
            setShowForm(false)
            setEditingSlot(null)
          }}
          onDelete={
            editingSlot
              ? async () => {
                  await handleDeleteSlot(editingSlot.id)
                  setShowForm(false)
                  setEditingSlot(null)
                }
              : undefined
          }
        />
      )}
    </div>
  )
}

// Schedule Form Component
interface ScheduleFormProps {
  slot: ScheduleSlot | null
  students: Array<{ id: string; name: string; hourlyRate: number; category: Category }>
  onClose: () => void
  onSave: (data: {
    id?: string
    studentId: string
    dayOfWeek: number
    startTime: string
    durationMinutes: number
    category: Category
    price: number
  }) => Promise<void>
  onDelete?: () => void
}

const ScheduleForm = ({ slot, students, onClose, onSave, onDelete }: ScheduleFormProps) => {
  const [studentId, setStudentId] = useState(slot?.studentId || '')
  const [dayOfWeek, setDayOfWeek] = useState(slot?.dayOfWeek.toString() || '')
  const [startTime, setStartTime] = useState(slot?.startTime || '')
  const [durationMinutes, setDurationMinutes] = useState(
    slot?.durationMinutes.toString() || '60'
  )
  const [price, setPrice] = useState(slot?.price.toString() || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedStudent = students.find((s) => s.id === studentId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentId || !dayOfWeek || !startTime || !durationMinutes || !price) {
      setError('Please fill in all fields')
      return
    }

    setSaving(true)
    setError(null)

    try {
      await onSave({
        ...(slot?.id && { id: slot.id }),
        studentId,
        dayOfWeek: parseInt(dayOfWeek),
        startTime,
        durationMinutes: parseInt(durationMinutes),
        category: selectedStudent!.category,
        price: parseFloat(price),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save time slot')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
      <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              {slot ? 'Edit Time Slot' : 'Add Time Slot'}
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Student */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Student *</label>
            <select
              value={studentId}
              onChange={(e) => {
                setStudentId(e.target.value)
                const student = students.find((s) => s.id === e.target.value)
                if (student && !slot) {
                  setPrice(student.hourlyRate.toString())
                }
              }}
              className="input-field"
              required
            >
              <option value="">Select a student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          </div>

          {/* Day of Week */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Day *</label>
            <select value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)} className="input-field" required>
              <option value="">Select a day</option>
              {DAYS_OF_WEEK.map((day, index) => (
                <option key={day} value={index}>
                  {day}
                </option>
              ))}
            </select>
          </div>

          {/* Time & Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Time *</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Duration (min) *
              </label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="input-field"
                min="1"
                step="1"
                required
              />
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Price ($) *</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="input-field"
              min="0"
              step="0.01"
              required
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="btn-secondary text-red-600 border-red-200 hover:bg-red-50 flex-1"
              >
                <TrashIcon size={20} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? 'Saving...' : slot ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Schedule
