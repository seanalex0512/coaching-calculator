import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { LogOutIcon, FileTextIcon } from '../components/ui/Icons'

const More = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="px-4 pt-12 pb-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Settings</h1>
        <p className="text-slate-500">Manage your account and preferences</p>
      </div>

      {/* Account Info */}
      <div className="card p-6 mb-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
          Account
        </h2>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-900">{user?.email}</p>
            <p className="text-sm text-slate-500">Signed in with Google</p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="card overflow-hidden mb-4">
        <Link
          to="/invoices"
          className="w-full px-6 py-4 flex items-center gap-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100"
        >
          <FileTextIcon size={20} className="text-slate-700" />
          <div className="flex-1">
            <p className="font-medium text-slate-900">Invoices</p>
            <p className="text-sm text-slate-500">Generate student invoices</p>
          </div>
          <svg
            className="w-5 h-5 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>

      {/* Actions */}
      <div className="card overflow-hidden">
        <button
          onClick={handleSignOut}
          className="w-full px-6 py-4 flex items-center gap-3 text-left hover:bg-slate-50 transition-colors"
        >
          <LogOutIcon size={20} className="text-red-600" />
          <div className="flex-1">
            <p className="font-medium text-red-600">Sign Out</p>
            <p className="text-sm text-slate-500">Sign out of your account</p>
          </div>
        </button>
      </div>

      {/* App Info */}
      <div className="mt-8 text-center text-sm text-slate-400">
        <p>Coaching Calculator v1.0.0</p>
        <p className="mt-1">Built with React + Supabase</p>
      </div>
    </div>
  )
}

export default More
