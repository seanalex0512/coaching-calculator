import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { LogOutIcon, FileTextIcon, BellIcon } from '../components/ui/Icons'
import { useNotifications } from '../hooks/useNotifications'

const More = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { settings, updateSettings, requestPushPermission } = useNotifications()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const handleToggleSessionReminder = () => {
    if (settings) {
      updateSettings({ sessionReminderEnabled: !settings.sessionReminderEnabled })
    }
  }

  const handleToggleInvoiceReminder = () => {
    if (settings) {
      updateSettings({ invoiceReminderEnabled: !settings.invoiceReminderEnabled })
    }
  }

  const handleEnablePush = async () => {
    const success = await requestPushPermission()
    if (!success) {
      alert('Could not enable push notifications. Please check your browser settings.')
    }
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
          className="w-full px-6 py-4 flex items-center gap-3 text-left hover:bg-slate-50 transition-colors"
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

      {/* Notifications */}
      <div className="card p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <BellIcon size={20} className="text-slate-700" />
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
            Notifications
          </h2>
        </div>

        {/* Session Reminders */}
        <div className="flex items-center justify-between py-3 border-b border-slate-100">
          <div>
            <p className="font-medium text-slate-900">Session Reminders</p>
            <p className="text-sm text-slate-500">Daily reminder at 10:00 AM</p>
          </div>
          <button
            onClick={handleToggleSessionReminder}
            className={`relative w-12 h-7 rounded-full transition-colors ${
              settings?.sessionReminderEnabled ? 'bg-slate-900' : 'bg-slate-300'
            }`}
          >
            <span
              className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                settings?.sessionReminderEnabled ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Invoice Reminders */}
        <div className="flex items-center justify-between py-3 border-b border-slate-100">
          <div>
            <p className="font-medium text-slate-900">Invoice Reminders</p>
            <p className="text-sm text-slate-500">Weekly reminder on Sundays</p>
          </div>
          <button
            onClick={handleToggleInvoiceReminder}
            className={`relative w-12 h-7 rounded-full transition-colors ${
              settings?.invoiceReminderEnabled ? 'bg-slate-900' : 'bg-slate-300'
            }`}
          >
            <span
              className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                settings?.invoiceReminderEnabled ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Push Notifications */}
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="font-medium text-slate-900">Push Notifications</p>
            <p className="text-sm text-slate-500">
              {settings?.pushEnabled ? 'Enabled' : 'Get notified even when app is closed'}
            </p>
          </div>
          {settings?.pushEnabled ? (
            <span className="text-sm text-green-600 font-medium">Active</span>
          ) : (
            <button
              onClick={handleEnablePush}
              className="px-3 py-1.5 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Enable
            </button>
          )}
        </div>
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
