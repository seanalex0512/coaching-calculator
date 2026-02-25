import { useState } from 'react'

interface RescheduleModalProps {
  studentName: string
  onConfirm: (newDate: string, newTime: string) => void
  onCancel: () => void
}

const RescheduleModal = ({ studentName, onConfirm, onCancel }: RescheduleModalProps) => {
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newDate && newTime) {
      onConfirm(newDate, newTime)
    }
  }

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 animate-slide-up">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Reschedule Class</h2>
        <p className="text-slate-500 mb-6">
          Choose a new date and time for {studentName}'s class
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              New Date
            </label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              min={today}
              required
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>

          {/* Time Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              New Time
            </label>
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              required
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newDate || !newTime}
              className="flex-1 px-4 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Reschedule
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RescheduleModal
