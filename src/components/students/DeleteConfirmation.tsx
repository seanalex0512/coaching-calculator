import { Student } from '../../types'

interface DeleteConfirmationProps {
  student: Student
  onConfirm: () => void
  onCancel: () => void
}

const DeleteConfirmation = ({
  student,
  onConfirm,
  onCancel,
}: DeleteConfirmationProps) => {
  return (
    <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-modal w-full max-w-sm overflow-hidden">
        <div className="p-6 text-center">
          {/* Warning Icon */}
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h3 className="text-xl font-bold text-slate-900 mb-2">
            Delete Student?
          </h3>
          <p className="text-slate-500">
            <strong className="text-slate-700">{student.name}</strong> will be marked as inactive. Their session history will be preserved.
          </p>
        </div>

        <div className="flex border-t border-slate-100">
          <button
            onClick={onCancel}
            className="flex-1 py-4 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <div className="w-px bg-slate-100" />
          <button
            onClick={onConfirm}
            className="flex-1 py-4 text-red-600 font-semibold hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteConfirmation
