import { useState, useEffect } from 'react'
import { Session, Category, CATEGORIES, Student } from '../../types'
import { XIcon, TrashIcon } from '../ui/Icons'

interface SessionFormProps {
  session: Session | null
  students: Student[]
  onClose: () => void
  onSave: (data: {
    id?: string
    studentId: string
    category: Category
    sessionDate: string
    durationMinutes: number
    price: number
    notes?: string
    status: 'completed' | 'missed' | 'cancelled'
  }) => Promise<void>
  onDelete?: (id: string) => Promise<void>
}

type SessionStatus = 'completed' | 'missed' | 'cancelled'

const SessionForm = ({ session, students, onClose, onSave, onDelete }: SessionFormProps) => {
  const [studentId, setStudentId] = useState('')
  const [sessionDate, setSessionDate] = useState('')
  const [hours, setHours] = useState('1')
  const [minutes, setMinutes] = useState('0')
  const [notes, setNotes] = useState('')
  const [category, setCategory] = useState<Category>('gym')
  const [status, setStatus] = useState<SessionStatus>('completed')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeStudents = students.filter((s) => s.isActive)

  useEffect(() => {
    if (session) {
      setStudentId(session.studentId)
      setSessionDate(session.sessionDate)
      const sessionHours = Math.floor(session.durationMinutes / 60)
      const sessionMinutes = session.durationMinutes % 60
      setHours(sessionHours.toString())
      setMinutes(sessionMinutes.toString())
      setNotes(session.notes || '')
      setCategory(session.category)
      setStatus(session.status)
    } else {
      const today = new Date().toISOString().split('T')[0]
      setSessionDate(today)
    }
  }, [session])

  const calculatePrice = () => {
    if (!studentId) return 0
    const student = students.find((s) => s.id === studentId)
    if (!student) return 0

    const totalMinutes = parseInt(hours || '0') * 60 + parseInt(minutes || '0')
    return (totalMinutes / 60) * student.hourlyRate
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const totalMinutes = parseInt(hours || '0') * 60 + parseInt(minutes || '0')
      const price = status === 'completed' ? calculatePrice() : 0

      await onSave({
        ...(session?.id && { id: session.id }),
        studentId,
        category,
        sessionDate,
        durationMinutes: totalMinutes,
        price,
        notes,
        status,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save session')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = async () => {
    if (!session || !onDelete) return
    setSaving(true)
    setError(null)

    try {
      await onDelete(session.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete session')
      setSaving(false)
    }
  }

  const selectedStudent = students.find((s) => s.id === studentId)
  const calculatedPrice = calculatePrice()
  const totalMinutes = parseInt(hours || '0') * 60 + parseInt(minutes || '0')

  return (
    <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl shadow-modal max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-900">
            {session ? 'Edit Session' : 'New Session'}
          </h3>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
          >
            <XIcon size={24} className="text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Student Select */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Student
            </label>
            <select
              value={studentId}
              onChange={(e) => {
                setStudentId(e.target.value)
                const student = students.find((s) => s.id === e.target.value)
                if (student) setCategory(student.category)
              }}
              className="input-field appearance-none"
              required
            >
              <option value="">Select a student</option>
              {activeStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} · ${student.hourlyRate}/hr · {CATEGORIES[student.category].name}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(CATEGORIES) as Category[]).map((cat) => {
                const catInfo = CATEGORIES[cat]
                const isSelected = category === cat
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`py-2 px-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5`}
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

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus('completed')}
                className={`py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                  status === 'completed'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                Completed
              </button>
              <button
                type="button"
                onClick={() => setStatus('missed')}
                className={`py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                  status === 'missed' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700'
                }`}
              >
                Missed
              </button>
              <button
                type="button"
                onClick={() => setStatus('cancelled')}
                className={`py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                  status === 'cancelled'
                    ? 'bg-slate-600 text-white'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                Cancelled
              </button>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="input-field"
              required
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Duration
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <input
                  type="number"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="input-field pr-16"
                  min="0"
                  max="23"
                  placeholder="0"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                  hours
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  className="input-field pr-12"
                  min="0"
                  max="59"
                  step="15"
                  placeholder="0"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                  min
                </span>
              </div>
            </div>
          </div>

          {/* Price Preview */}
          {selectedStudent && totalMinutes > 0 && (
            <div className={`rounded-xl p-4 ${status === 'completed' ? 'bg-emerald-50' : 'bg-slate-50'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    {status === 'completed' ? 'Calculated Price' : 'No Charge'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {hours}h {minutes}m @ ${selectedStudent.hourlyRate}/hr
                  </p>
                </div>
                <p className={`text-2xl font-bold ${status === 'completed' ? 'text-emerald-600' : 'text-slate-400 line-through'}`}>
                  ${calculatedPrice.toFixed(2)}
                </p>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Notes <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field resize-none"
              rows={3}
              placeholder="Add session notes..."
            />
          </div>

          {/* Actions */}
          <div className="pt-4 space-y-3">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : session ? 'Save Changes' : 'Add Session'}
            </button>

            {session && onDelete && (
              <button
                type="button"
                onClick={handleDeleteClick}
                disabled={saving}
                className="w-full py-3 flex items-center justify-center gap-2 text-red-600 font-medium hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <TrashIcon size={18} />
                Delete Session
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default SessionForm
