import { useState } from 'react'
import { Student, Category, CATEGORIES } from '../types'
import { useStudents } from '../hooks/useStudents'
import { useSessions } from '../hooks/useSessions'
import { useSchedule } from '../hooks/useSchedule'
import StudentForm from '../components/students/StudentForm'
import DeleteConfirmation from '../components/students/DeleteConfirmation'
import { PlusIcon, ChevronRightIcon } from '../components/ui/Icons'

const Students = () => {
  const { students, loading, error, deleteStudent, addStudent, updateStudent } = useStudents()
  const { sessions } = useSessions()
  const { scheduleSlots } = useSchedule()
  const [showForm, setShowForm] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all')

  // Filter by category based on their schedule slots
  const displayStudents = students.filter((student) => {
    if (categoryFilter === 'all') return true

    // Check if student has any schedule slots with this category
    return scheduleSlots.some(
      slot => slot.studentId === student.id && slot.category === categoryFilter && slot.isActive
    )
  })

  const handleAddClick = () => {
    setEditingStudent(null)
    setShowForm(true)
  }

  const handleEditClick = (student: Student) => {
    setEditingStudent(student)
    setShowForm(true)
  }

  const handleDeleteClick = (student: Student) => {
    setDeletingStudent(student)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingStudent(null)
  }

  const handleSaveStudent = async (data: {
    id?: string
    name: string
    hourlyRate: number
    category: Category
  }): Promise<string> => {
    if (data.id) {
      // Update existing student
      await updateStudent(data.id, {
        name: data.name,
        hourlyRate: data.hourlyRate,
        category: data.category,
      })
      return data.id
    } else {
      // Add new student
      const newStudent: any = await addStudent({
        name: data.name,
        hourlyRate: data.hourlyRate,
        category: data.category,
      })
      return newStudent.id
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingStudent) return
    try {
      await deleteStudent(deletingStudent.id)
      setDeletingStudent(null)
      setShowForm(false)  // Close the edit form after delete
      setEditingStudent(null)  // Clear the editing state
    } catch (err) {
      console.error('Error deleting student:', err)
    }
  }

  const handleDeleteCancel = () => {
    setDeletingStudent(null)
  }

  const getStudentSessionCount = (studentId: string) => {
    return sessions.filter((s) => s.studentId === studentId).length
  }

  const getStudentEarnings = (studentId: string) => {
    return sessions
      .filter((s) => s.studentId === studentId && s.status === 'completed')
      .reduce((sum, s) => sum + s.price, 0)
  }

  if (loading) {
    return (
      <div className="px-4 pt-12 pb-4 max-w-lg mx-auto flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-500">Loading students...</p>
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
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Students</h1>
        <p className="text-slate-500">{displayStudents.length} total</p>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
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

      {/* Student List */}
      {displayStudents.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <PlusIcon size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No students yet</h3>
          <p className="text-slate-500 mb-6">Add your first student to get started</p>
          <button onClick={handleAddClick} className="btn-primary">
            Add Student
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {displayStudents.map((student) => {
            const sessionCount = getStudentSessionCount(student.id)
            const earnings = getStudentEarnings(student.id)
            const catInfo = CATEGORIES[student.category]

            return (
              <div
                key={student.id}
                onClick={() => handleEditClick(student)}
                className="card p-4 flex items-center gap-4 active:scale-[0.98] transition-all cursor-pointer"
              >
                {/* Avatar with category indicator */}
                <div className="relative">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white"
                    style={{ backgroundColor: catInfo.color }}
                  >
                    {student.name.charAt(0)}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate">
                    {student.name}
                  </h3>
                  <p className="text-sm text-slate-500">
                    ${student.hourlyRate}/hr · {sessionCount} sessions
                  </p>
                </div>

                {/* Earnings & Arrow */}
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold text-emerald-600">${earnings.toFixed(0)}</p>
                  <ChevronRightIcon size={20} className="text-slate-300" />
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
        aria-label="Add student"
      >
        <PlusIcon size={24} />
      </button>

      {/* Student Form Modal */}
      {showForm && (
        <StudentForm
          student={editingStudent}
          onClose={handleFormClose}
          onSave={handleSaveStudent}
          onDelete={editingStudent ? () => handleDeleteClick(editingStudent) : undefined}
        />
      )}

      {/* Delete Confirmation */}
      {deletingStudent && (
        <DeleteConfirmation
          student={deletingStudent}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}
    </div>
  )
}

export default Students
