import jsPDF from 'jspdf'
import { Session, Student } from '../types'

interface InvoiceData {
  student: Student
  sessions: Session[]
  startDate?: string
  endDate?: string
}

export const generateInvoicePDF = (data: InvoiceData) => {
  const { student, sessions, startDate, endDate } = data

  // Create new PDF (A4 size)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  // Calculate totals
  const totalAmount = sessions.reduce((sum, s) => sum + s.price, 0)
  const totalHours = sessions.reduce((sum, s) => sum + s.durationMinutes, 0) / 60

  // Colors
  const darkGray = '#0f172a'
  const mediumGray = '#64748b'
  const lightGray = '#94a3b8'

  // Header background
  doc.setFillColor(15, 23, 42) // slate-900
  doc.rect(0, 0, 210, 60, 'F')

  // Invoice title
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.text('INVOICE', 20, 25)

  // Student name (right side)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text(student.name, 190, 25, { align: 'right' })

  // Date (right side, below name)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(203, 213, 225) // slate-300
  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
  doc.text(today, 190, 32, { align: 'right' })

  // Summary boxes
  const summaryY = 45
  doc.setFontSize(8)
  doc.setTextColor(148, 163, 184) // slate-400
  doc.text('SESSIONS', 20, summaryY)
  doc.text('HOURS', 80, summaryY)
  doc.text('TOTAL', 140, summaryY)

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text(sessions.length.toString(), 20, summaryY + 7)
  doc.text(totalHours.toFixed(1), 80, summaryY + 7)
  doc.text(`MYR ${totalAmount.toFixed(2)}`, 140, summaryY + 7)

  // Reset text color for body
  doc.setTextColor(darkGray)

  // Date range (if applicable)
  let currentY = 75
  if (startDate && endDate) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(mediumGray)
    const formattedStart = new Date(startDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
    const formattedEnd = new Date(endDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
    doc.text(`Period: ${formattedStart} - ${formattedEnd}`, 20, currentY)
    currentY += 10
  }

  // Session Details heading
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(mediumGray)
  doc.text('SESSION DETAILS', 20, currentY)
  currentY += 8

  // Table headers
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(lightGray)
  doc.text('DATE', 20, currentY)
  doc.text('DURATION', 80, currentY)
  doc.text('RATE', 130, currentY)
  doc.text('AMOUNT', 170, currentY)

  // Header line
  currentY += 2
  doc.setDrawColor(226, 232, 240) // slate-200
  doc.line(20, currentY, 190, currentY)
  currentY += 6

  // Session rows
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)

  sessions.forEach((session) => {
    // Check if we need a new page
    if (currentY > 270) {
      doc.addPage()
      currentY = 20
    }

    const sessionDate = new Date(session.sessionDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })

    const hours = Math.floor(session.durationMinutes / 60)
    const mins = session.durationMinutes % 60
    const duration = hours > 0
      ? (mins > 0 ? `${hours}h ${mins}m` : `${hours}h`)
      : `${mins}m`

    doc.setTextColor(darkGray)
    doc.text(sessionDate, 20, currentY)
    doc.text(duration, 80, currentY)
    doc.setTextColor(mediumGray)
    doc.text(`MYR ${student.hourlyRate}/hr`, 130, currentY)
    doc.setTextColor(darkGray)
    doc.setFont('helvetica', 'bold')
    doc.text(`MYR ${session.price.toFixed(2)}`, 170, currentY)
    doc.setFont('helvetica', 'normal')

    currentY += 8
  })

  // Total line
  currentY += 5
  doc.setDrawColor(15, 23, 42) // slate-900
  doc.setLineWidth(0.8)
  doc.line(20, currentY, 190, currentY)
  currentY += 8

  // Total Due
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(darkGray)
  doc.text('TOTAL DUE', 20, currentY)
  doc.setFontSize(16)
  doc.text(`MYR ${totalAmount.toFixed(2)}`, 170, currentY)

  // Generate filename
  const filename = `invoice-${student.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`

  // Save the PDF
  doc.save(filename)
}
