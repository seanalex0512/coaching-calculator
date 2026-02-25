import { useState } from 'react'
import { Session } from '../types'
import { DownloadIcon, FileTextIcon } from '../components/ui/Icons'
import { useStudents } from '../hooks/useStudents'
import { useSessions } from '../hooks/useSessions'

const Invoices = () => {
  const { students, loading: studentsLoading } = useStudents()
  const { sessions, loading: sessionsLoading } = useSessions()
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const loading = studentsLoading || sessionsLoading
  const activeStudents = students.filter((s) => s.isActive)

  const getFilteredSessions = (): Session[] => {
    if (!selectedStudentId) return []

    return sessions
      .filter((session) => {
        // Only include completed sessions in invoices
        if (session.status !== 'completed') return false
        if (session.studentId !== selectedStudentId) return false
        if (startDate && session.sessionDate < startDate) return false
        if (endDate && session.sessionDate > endDate) return false
        return true
      })
      .sort((a, b) => a.sessionDate.localeCompare(b.sessionDate))
  }

  const filteredSessions = getFilteredSessions()
  const selectedStudent = students.find((s) => s.id === selectedStudentId)
  const totalAmount = filteredSessions.reduce((sum, session) => sum + session.price, 0)
  const totalHours = filteredSessions.reduce((sum, session) => sum + session.durationMinutes, 0) / 60

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins}m`
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}m`
  }

  const handleExport = () => {
    console.log('Export invoice as PDF')
  }

  if (loading) {
    return (
      <div className="px-4 pt-12 pb-4 max-w-lg mx-auto flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-500">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-12 pb-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Invoices</h1>
        <p className="text-slate-500">Generate invoices for your students</p>
      </div>

      {/* Filters */}
      <div className="card p-5 space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Student
          </label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="input-field appearance-none"
          >
            <option value="">Select a student</option>
            {activeStudents.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              From
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              To
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Invoice Preview */}
      {selectedStudent && filteredSessions.length > 0 ? (
        <div className="card overflow-hidden">
          {/* Invoice Header */}
          <div className="bg-slate-900 text-white p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">Invoice</h2>
                <p className="text-slate-300 text-sm">
                  {new Date().toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-slate-300 text-sm">Bill To</p>
                <p className="text-lg font-semibold">{selectedStudent.name}</p>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Sessions</p>
                <p className="text-xl font-bold">{filteredSessions.length}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Hours</p>
                <p className="text-xl font-bold">{totalHours.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Total</p>
                <p className="text-xl font-bold">${totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Session List */}
          <div className="p-6">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Session Details
            </h3>
            <div className="space-y-3">
              {filteredSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
                >
                  <div>
                    <p className="font-medium text-slate-900">{formatDate(session.sessionDate)}</p>
                    <p className="text-sm text-slate-500">
                      {formatDuration(session.durationMinutes)} @ ${selectedStudent.hourlyRate}/hr
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-slate-900">
                    ${session.price.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between pt-4 mt-4 border-t-2 border-slate-900">
              <p className="text-lg font-bold text-slate-900">Total Due</p>
              <p className="text-2xl font-bold text-slate-900">${totalAmount.toFixed(2)}</p>
            </div>
          </div>

          {/* Export Button */}
          <div className="p-6 pt-0">
            <button
              onClick={handleExport}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              <DownloadIcon size={20} />
              Download PDF
            </button>
            <p className="text-xs text-center text-slate-400 mt-3">
              PDF export coming in Phase 4
            </p>
          </div>
        </div>
      ) : selectedStudent && filteredSessions.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileTextIcon size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No sessions found</h3>
          <p className="text-slate-500">Try adjusting your date range</p>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileTextIcon size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Generate an Invoice</h3>
          <p className="text-slate-500">Select a student to get started</p>
        </div>
      )}
    </div>
  )
}

export default Invoices
