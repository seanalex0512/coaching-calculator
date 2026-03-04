import { useState } from 'react'
import { Invoice, Session, Student, CATEGORIES } from '../types'
import { useInvoices } from '../hooks/useInvoices'
import { useStudents } from '../hooks/useStudents'
import { generateInvoicePDF } from '../lib/pdf'
import { PlusIcon, CheckIcon, ChevronRightIcon, DownloadIcon, ChevronLeftIcon } from '../components/ui/Icons'

type ViewMode = 'list' | 'create' | 'detail'

const Invoices = () => {
  const { invoices, loading, error, createInvoice, updateInvoiceStatus, deleteInvoice, getUninvoicedSessions, getInvoiceSessions } = useInvoices()
  const { students } = useStudents()

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [uninvoicedSessions, setUninvoicedSessions] = useState<Session[]>([])
  const [selectedSessions, setSelectedSessions] = useState<string[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [invoiceSessions, setInvoiceSessions] = useState<Session[]>([])
  const [loadingSessions, setLoadingSessions] = useState(false)

  const getStudentName = (studentId: string) => {
    return students.find((s) => s.id === studentId)?.name || 'Unknown'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatSessionDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-100 text-emerald-700'
      case 'sent':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-slate-100 text-slate-600'
    }
  }

  const handleCreateClick = () => {
    setViewMode('create')
    setSelectedStudent(null)
    setUninvoicedSessions([])
    setSelectedSessions([])
  }

  const handleStudentSelect = async (student: Student) => {
    setSelectedStudent(student)
    setLoadingSessions(true)
    try {
      const sessions = await getUninvoicedSessions(student.id)
      setUninvoicedSessions(sessions)
      // Auto-select all sessions
      setSelectedSessions(sessions.map(s => s.id))
    } catch (err) {
      console.error('Error fetching uninvoiced sessions:', err)
    } finally {
      setLoadingSessions(false)
    }
  }

  const handleSessionToggle = (sessionId: string) => {
    setSelectedSessions(prev =>
      prev.includes(sessionId)
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    )
  }

  const handleCreateInvoice = async () => {
    if (!selectedStudent || selectedSessions.length === 0) return

    const totalAmount = uninvoicedSessions
      .filter(s => selectedSessions.includes(s.id))
      .reduce((sum, s) => sum + s.price, 0)

    try {
      await createInvoice(selectedStudent.id, selectedSessions, totalAmount)
      setViewMode('list')
    } catch (err) {
      console.error('Error creating invoice:', err)
    }
  }

  const handleInvoiceClick = async (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setViewMode('detail')
    setLoadingSessions(true)
    try {
      const sessions = await getInvoiceSessions(invoice.id)
      setInvoiceSessions(sessions)
    } catch (err) {
      console.error('Error fetching invoice sessions:', err)
    } finally {
      setLoadingSessions(false)
    }
  }

  const handleMarkAsSent = async () => {
    if (!selectedInvoice) return
    try {
      await updateInvoiceStatus(selectedInvoice.id, 'sent')
      setSelectedInvoice({ ...selectedInvoice, status: 'sent', sentAt: new Date().toISOString() })
    } catch (err) {
      console.error('Failed to mark as sent:', err)
    }
  }

  const handleMarkAsPaid = async () => {
    if (!selectedInvoice) return
    try {
      await updateInvoiceStatus(selectedInvoice.id, 'paid')
      setSelectedInvoice({ ...selectedInvoice, status: 'paid', paidAt: new Date().toISOString() })
    } catch (err) {
      console.error('Failed to mark as paid:', err)
    }
  }

  const handleDeleteInvoice = async () => {
    if (!selectedInvoice) return
    if (!confirm('Delete this invoice? Sessions will become uninvoiced again.')) return
    await deleteInvoice(selectedInvoice.id)
    setViewMode('list')
  }

  const handleExportPDF = () => {
    if (!selectedInvoice) return
    const student = students.find(s => s.id === selectedInvoice.studentId)
    if (!student) return

    generateInvoicePDF({
      student,
      sessions: invoiceSessions,
      startDate: invoiceSessions[0]?.sessionDate || '',
      endDate: invoiceSessions[invoiceSessions.length - 1]?.sessionDate || '',
    })
  }

  const handleBack = () => {
    if (viewMode === 'create' && selectedStudent) {
      setSelectedStudent(null)
      setUninvoicedSessions([])
      setSelectedSessions([])
    } else {
      setViewMode('list')
      setSelectedStudent(null)
      setSelectedInvoice(null)
    }
  }

  if (loading) {
    return (
      <div className="px-4 pt-12 pb-4 max-w-lg mx-auto flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-500">Loading invoices...</p>
        </div>
      </div>
    )
  }

  // Create Invoice View
  if (viewMode === 'create') {
    return (
      <div className="px-4 pt-12 pb-4 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handleBack}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100"
          >
            <ChevronLeftIcon size={24} className="text-slate-500" />
          </button>
          <h1 className="text-2xl font-bold text-slate-900">
            {selectedStudent ? 'Select Sessions' : 'Create Invoice'}
          </h1>
        </div>

        {!selectedStudent ? (
          // Student Selection
          <div>
            <p className="text-slate-500 mb-4">Select a student</p>
            <div className="space-y-2">
              {students.filter(s => s.isActive).map(student => {
                const catInfo = CATEGORIES[student.category]
                return (
                  <button
                    key={student.id}
                    onClick={() => handleStudentSelect(student)}
                    className="w-full card p-4 flex items-center gap-4 text-left hover:bg-slate-50"
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white"
                      style={{ backgroundColor: catInfo.color }}
                    >
                      {student.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{student.name}</p>
                      <p className="text-sm text-slate-500">MYR {student.hourlyRate}/hr</p>
                    </div>
                    <ChevronRightIcon size={20} className="text-slate-300" />
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          // Session Selection
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: CATEGORIES[selectedStudent.category].color }}
              >
                {selectedStudent.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-slate-900">{selectedStudent.name}</p>
                <p className="text-sm text-slate-500">Select sessions to invoice</p>
              </div>
            </div>

            {loadingSessions ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
              </div>
            ) : uninvoicedSessions.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl">
                <p className="text-slate-500">No uninvoiced sessions</p>
                <p className="text-sm text-slate-400 mt-1">All completed sessions have been invoiced</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-6">
                  {uninvoicedSessions.map(session => {
                    const isSelected = selectedSessions.includes(session.id)
                    const catInfo = CATEGORIES[session.category]
                    return (
                      <button
                        key={session.id}
                        onClick={() => handleSessionToggle(session.id)}
                        className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-3 ${
                          isSelected
                            ? 'border-slate-900 bg-slate-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? 'border-slate-900 bg-slate-900' : 'border-slate-300'
                          }`}
                        >
                          {isSelected && <CheckIcon size={14} className="text-white" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">
                            {formatSessionDate(session.sessionDate)}
                          </p>
                          <p className="text-sm text-slate-500">
                            {catInfo.name} · {session.durationMinutes} min
                          </p>
                        </div>
                        <p className="font-semibold text-slate-900">
                          MYR {session.price.toFixed(2)}
                        </p>
                      </button>
                    )
                  })}
                </div>

                {/* Total and Create Button */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-slate-500">
                      {selectedSessions.length} session{selectedSessions.length !== 1 ? 's' : ''} selected
                    </p>
                    <p className="text-xl font-bold text-slate-900">
                      MYR {uninvoicedSessions
                        .filter(s => selectedSessions.includes(s.id))
                        .reduce((sum, s) => sum + s.price, 0)
                        .toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={handleCreateInvoice}
                    disabled={selectedSessions.length === 0}
                    className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create Invoice
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    )
  }

  // Invoice Detail View
  if (viewMode === 'detail' && selectedInvoice) {
    const student = students.find(s => s.id === selectedInvoice.studentId)
    const totalHours = invoiceSessions.reduce((sum, s) => sum + s.durationMinutes, 0) / 60

    return (
      <div className="px-4 pt-12 pb-4 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handleBack}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100"
          >
            <ChevronLeftIcon size={24} className="text-slate-500" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">{selectedInvoice.invoiceNumber}</h1>
            <p className="text-slate-500">{student?.name}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(selectedInvoice.status)}`}>
            {selectedInvoice.status}
          </span>
        </div>

        {/* Invoice Card */}
        <div className="card overflow-hidden mb-6">
          {/* Invoice Header */}
          <div className="bg-slate-900 text-white p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold mb-1">Invoice</h2>
                <p className="text-slate-300 text-sm">{formatDate(selectedInvoice.createdAt)}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">{student?.name}</p>
                <p className="text-slate-300 text-sm">{selectedInvoice.invoiceNumber}</p>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Sessions</p>
                <p className="text-xl font-bold">{invoiceSessions.length}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Hours</p>
                <p className="text-xl font-bold">{totalHours.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Total</p>
                <p className="text-xl font-bold">MYR {selectedInvoice.totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Session List */}
          <div className="p-6">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Session Details
            </h3>
            {loadingSessions ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {invoiceSessions.map(session => {
                  const catInfo = CATEGORIES[session.category]
                  return (
                    <div
                      key={session.id}
                      className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
                    >
                      <div>
                        <p className="font-medium text-slate-900">
                          {formatSessionDate(session.sessionDate)}
                        </p>
                        <p className="text-sm text-slate-500">
                          {session.durationMinutes} min · {catInfo.name}
                        </p>
                      </div>
                      <p className="font-semibold text-slate-900">
                        MYR {session.price.toFixed(2)}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Total */}
            <div className="flex items-center justify-between pt-4 mt-4 border-t-2 border-slate-900">
              <p className="text-lg font-bold text-slate-900">Total Due</p>
              <p className="text-2xl font-bold text-slate-900">MYR {selectedInvoice.totalAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Status Info */}
        {(selectedInvoice.sentAt || selectedInvoice.paidAt) && (
          <div className="card p-4 mb-6 space-y-2">
            {selectedInvoice.sentAt && (
              <div className="flex justify-between items-center">
                <p className="text-slate-500">Sent</p>
                <p className="font-medium text-slate-900">{formatDate(selectedInvoice.sentAt)}</p>
              </div>
            )}
            {selectedInvoice.paidAt && (
              <div className="flex justify-between items-center">
                <p className="text-slate-500">Paid</p>
                <p className="font-medium text-emerald-600">{formatDate(selectedInvoice.paidAt)}</p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleExportPDF}
            className="w-full py-3 border-2 border-slate-900 text-slate-900 font-semibold rounded-xl hover:bg-slate-50 flex items-center justify-center gap-2"
          >
            <DownloadIcon size={20} />
            Download PDF
          </button>

          {selectedInvoice.status === 'draft' && (
            <button
              onClick={handleMarkAsSent}
              className="btn-primary w-full py-3"
            >
              Mark as Sent
            </button>
          )}
          {selectedInvoice.status === 'sent' && (
            <button
              onClick={handleMarkAsPaid}
              className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700"
            >
              Mark as Paid
            </button>
          )}
          {selectedInvoice.status !== 'paid' && (
            <button
              onClick={handleDeleteInvoice}
              className="w-full py-3 text-red-600 font-medium hover:bg-red-50 rounded-xl"
            >
              Delete Invoice
            </button>
          )}
        </div>
      </div>
    )
  }

  // Invoice List View
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
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Invoices</h1>
        <p className="text-slate-500">{invoices.length} total</p>
      </div>

      {/* Invoice List */}
      {invoices.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <PlusIcon size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No invoices yet</h3>
          <p className="text-slate-500 mb-6">Create your first invoice to track payments</p>
          <button onClick={handleCreateClick} className="btn-primary">
            Create Invoice
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map(invoice => {
            const student = students.find(s => s.id === invoice.studentId)
            const catInfo = student ? CATEGORIES[student.category] : CATEGORIES.gym
            return (
              <button
                key={invoice.id}
                onClick={() => handleInvoiceClick(invoice)}
                className="w-full card p-4 flex items-center gap-4 text-left hover:bg-slate-50"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white"
                  style={{ backgroundColor: catInfo.color }}
                >
                  {student?.name.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900 truncate">
                      {student?.name || 'Unknown'}
                    </p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">
                    {invoice.invoiceNumber} · {formatDate(invoice.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold text-slate-900">
                    MYR {invoice.totalAmount.toFixed(0)}
                  </p>
                  <ChevronRightIcon size={20} className="text-slate-300" />
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={handleCreateClick}
        className="fixed bottom-28 right-6 w-14 h-14 bg-slate-900 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-slate-800 active:scale-95 transition-all z-40"
        aria-label="Create invoice"
      >
        <PlusIcon size={24} />
      </button>
    </div>
  )
}

export default Invoices
