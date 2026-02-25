import { useState, useEffect } from 'react'
import { Student, Category, CATEGORIES } from '../../types'
import { useSchedule } from '../../hooks/useSchedule'
import { XIcon, TrashIcon, PlusIcon, ClockIcon, CheckIcon } from '../ui/Icons'

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface ScheduleSlotForm {
  id?: string
  daysOfWeek: number[]  // Changed to array for multi-select
  startTime: string
  durationMinutes: number
  category: Category
  price: number
}

interface StudentFormProps {
  student: Student | null
  onClose: () => void
  onDelete?: () => void
  onSave: (data: {
    id?: string
    name: string
    hourlyRate: number
    category: Category
  }) => Promise<string>
}

const StudentForm = ({ student, onClose, onDelete, onSave }: StudentFormProps) => {
  const { scheduleSlots, addScheduleSlot, deleteScheduleSlot } = useSchedule()
  const [name, setName] = useState('')
  const [hourlyRate, setHourlyRate] = useState('')
  const [schedules, setSchedules] = useState<ScheduleSlotForm[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (student) {
      setName(student.name)
      setHourlyRate(student.hourlyRate.toString())

      // Load existing schedule slots for this student
      // Group slots by category, time, duration, and price
      const studentSlots = scheduleSlots.filter(s => s.studentId === student.id && s.isActive)

      // Group slots that have the same category, time, duration, and price
      const groupedSchedules = new Map<string, ScheduleSlotForm>()

      studentSlots.forEach(slot => {
        const key = `${slot.category}-${slot.startTime}-${slot.durationMinutes}-${slot.price}`
        const existing = groupedSchedules.get(key)

        if (existing) {
          existing.daysOfWeek.push(slot.dayOfWeek)
        } else {
          groupedSchedules.set(key, {
            id: slot.id,  // Keep first ID for reference
            daysOfWeek: [slot.dayOfWeek],
            startTime: slot.startTime,
            durationMinutes: slot.durationMinutes,
            category: slot.category,
            price: slot.price
          })
        }
      })

      setSchedules(Array.from(groupedSchedules.values()))
    }
  }, [student, scheduleSlots])

  const handleAddSchedule = () => {
    setSchedules([
      ...schedules,
      {
        daysOfWeek: [], // Start with no days selected
        startTime: '09:00',
        durationMinutes: 60,
        category: 'gym',
        price: parseFloat(hourlyRate) || 0
      }
    ])
  }

  const handleRemoveSchedule = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index))
  }

  const handleScheduleChange = (index: number, field: keyof ScheduleSlotForm, value: any) => {
    const updated = [...schedules]
    updated[index] = { ...updated[index], [field]: value }

    // Auto-calculate price if duration changes
    if (field === 'durationMinutes' && hourlyRate) {
      const hours = value / 60
      updated[index].price = parseFloat(hourlyRate) * hours
    }

    setSchedules(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      // Save student and get the ID (either existing or newly created)
      // Use the first schedule's category as the student's default category
      const defaultCategory = schedules.length > 0 ? schedules[0].category : 'gym'

      const studentId = await onSave({
        ...(student?.id && { id: student.id }),
        name,
        hourlyRate: parseFloat(hourlyRate),
        category: defaultCategory,
      })

      // Delete all existing slots for this student (we'll recreate them)
      if (student?.id) {
        const existingSlots = scheduleSlots.filter(s => s.studentId === studentId && s.isActive)
        for (const slot of existingSlots) {
          await deleteScheduleSlot(slot.id)
        }
      }

      // Create individual schedule slots for each selected day
      for (const schedule of schedules) {
        for (const dayOfWeek of schedule.daysOfWeek) {
          await addScheduleSlot({
            studentId: studentId,
            dayOfWeek: dayOfWeek,
            startTime: schedule.startTime,
            durationMinutes: schedule.durationMinutes,
            category: schedule.category,
            price: schedule.price
          })
        }
      }

      onClose()
    } catch (err) {
      console.error('Error saving student:', err)
      setError(err instanceof Error ? err.message : 'Failed to save student')
    } finally {
      setSaving(false)
    }
  }


  return (
    <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl shadow-modal max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-900">
            {student ? 'Edit Student' : 'New Student'}
          </h3>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
          >
            <XIcon size={24} className="text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Student Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Student Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="Enter student name"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Hourly Rate
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">
                  $
                </span>
                <input
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => {
                    setHourlyRate(e.target.value)
                    // Update all schedule prices
                    const rate = parseFloat(e.target.value) || 0
                    setSchedules(schedules.map(s => ({
                      ...s,
                      price: (s.durationMinutes / 60) * rate
                    })))
                  }}
                  className="input-field pl-8"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                  per hour
                </span>
              </div>
            </div>
          </div>

          {/* Schedule Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-slate-900">Weekly Schedule</h4>
              <button
                type="button"
                onClick={handleAddSchedule}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1"
              >
                <PlusIcon size={16} />
                Add Class
              </button>
            </div>

            {schedules.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-xl">
                <ClockIcon size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm text-slate-500 mb-3">No recurring classes yet</p>
                <button
                  type="button"
                  onClick={handleAddSchedule}
                  className="btn-secondary text-sm"
                >
                  Add First Class
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {schedules.map((schedule, index) => {
                  return (
                    <div
                      key={index}
                      className="p-4 border-2 border-slate-200 rounded-xl space-y-3"
                    >
                      {/* Category Tabs */}
                      <div className="flex gap-2">
                        {(Object.keys(CATEGORIES) as Category[]).map((cat) => {
                          const info = CATEGORIES[cat]
                          const isSelected = schedule.category === cat
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => handleScheduleChange(index, 'category', cat)}
                              className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                                isSelected
                                  ? 'text-white'
                                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                              }`}
                              style={isSelected ? { backgroundColor: info.color } : {}}
                            >
                              {info.name}
                            </button>
                          )
                        })}
                      </div>

                      {/* Days of Week (Multi-select) */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">
                          Repeat
                        </label>
                        <div className="bg-slate-50 rounded-lg overflow-hidden">
                          {DAYS_OF_WEEK.map((day, dayIndex) => {
                            const isSelected = schedule.daysOfWeek.includes(dayIndex)
                            return (
                              <button
                                key={dayIndex}
                                type="button"
                                onClick={() => {
                                  const newDays = isSelected
                                    ? schedule.daysOfWeek.filter(d => d !== dayIndex)
                                    : [...schedule.daysOfWeek, dayIndex].sort()
                                  handleScheduleChange(index, 'daysOfWeek', newDays)
                                }}
                                className={`w-full px-3 py-2.5 flex items-center justify-between border-b border-slate-200 last:border-b-0 transition-colors ${
                                  isSelected ? 'bg-white' : 'hover:bg-slate-100'
                                }`}
                              >
                                <span className="text-sm text-slate-900">Every {day}</span>
                                {isSelected && (
                                  <CheckIcon size={18} className="text-orange-500" />
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Time */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">
                          Time
                        </label>
                        <div className="relative bg-slate-50 rounded-lg p-2 h-32 overflow-hidden">
                          {/* Selection highlight bar */}
                          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-10 bg-slate-200/60 rounded-lg pointer-events-none z-10" />

                          <div className="flex h-full">
                            {/* Hour picker */}
                            <div className="flex-1 relative">
                              <select
                                value={parseInt(schedule.startTime.split(':')[0])}
                                onChange={(e) => {
                                  const hour = e.target.value.padStart(2, '0')
                                  const minute = schedule.startTime.split(':')[1] || '00'
                                  handleScheduleChange(index, 'startTime', `${hour}:${minute}`)
                                }}
                                className="w-full h-full bg-transparent border-none text-center text-2xl font-medium text-slate-900 cursor-pointer focus:outline-none appearance-none"
                                style={{
                                  backgroundImage: 'none',
                                  paddingRight: '0'
                                }}
                              >
                                {Array.from({ length: 24 }, (_, i) => (
                                  <option key={i} value={i}>
                                    {i === 0 ? '12' : i > 12 ? i - 12 : i}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Minute picker */}
                            <div className="flex-1 relative">
                              <select
                                value={schedule.startTime.split(':')[1] || '00'}
                                onChange={(e) => {
                                  const hour = schedule.startTime.split(':')[0]
                                  handleScheduleChange(index, 'startTime', `${hour}:${e.target.value}`)
                                }}
                                className="w-full h-full bg-transparent border-none text-center text-2xl font-medium text-slate-900 cursor-pointer focus:outline-none appearance-none"
                                style={{
                                  backgroundImage: 'none',
                                  paddingRight: '0'
                                }}
                              >
                                {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => (
                                  <option key={m} value={m.toString().padStart(2, '0')}>
                                    {m.toString().padStart(2, '0')}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* AM/PM picker */}
                            <div className="flex-1 relative">
                              <select
                                value={parseInt(schedule.startTime.split(':')[0]) >= 12 ? 'PM' : 'AM'}
                                onChange={(e) => {
                                  const currentHour = parseInt(schedule.startTime.split(':')[0])
                                  const minute = schedule.startTime.split(':')[1]
                                  let newHour = currentHour

                                  if (e.target.value === 'PM' && currentHour < 12) {
                                    newHour = currentHour + 12
                                  } else if (e.target.value === 'AM' && currentHour >= 12) {
                                    newHour = currentHour - 12
                                  }

                                  handleScheduleChange(index, 'startTime', `${newHour.toString().padStart(2, '0')}:${minute}`)
                                }}
                                className="w-full h-full bg-transparent border-none text-center text-2xl font-medium text-slate-900 cursor-pointer focus:outline-none appearance-none"
                                style={{
                                  backgroundImage: 'none',
                                  paddingRight: '0'
                                }}
                              >
                                <option value="AM">AM</option>
                                <option value="PM">PM</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Duration & Price */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1.5">
                            Duration (min)
                          </label>
                          <input
                            type="number"
                            value={schedule.durationMinutes}
                            onChange={(e) =>
                              handleScheduleChange(index, 'durationMinutes', parseInt(e.target.value))
                            }
                            className="input-field text-sm py-2"
                            min="1"
                            step="1"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1.5">
                            Price
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                              $
                            </span>
                            <input
                              type="number"
                              value={schedule.price}
                              onChange={(e) =>
                                handleScheduleChange(index, 'price', parseFloat(e.target.value))
                              }
                              className="input-field text-sm py-2 pl-6"
                              step="0.01"
                              min="0"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveSchedule(index)}
                        className="w-full py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-4 space-y-3">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : student ? 'Save Changes' : 'Add Student'}
            </button>

            {student && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="w-full py-3 flex items-center justify-center gap-2 text-red-600 font-medium hover:bg-red-50 rounded-xl transition-colors"
              >
                <TrashIcon size={18} />
                Delete Student
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default StudentForm
