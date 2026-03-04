import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { HomeIcon, UsersIcon, CalendarIcon, PieChartIcon, MoreHorizontalIcon, BellIcon } from '../ui/Icons'
import { useNotifications } from '../../hooks/useNotifications'
import NotificationPanel from '../notifications/NotificationPanel'

const Layout = () => {
  const location = useLocation()
  const [showNotifications, setShowNotifications] = useState(false)
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications()

  const navItems = [
    { path: '/', label: 'Home', Icon: HomeIcon },
    { path: '/insights', label: 'Insights', Icon: PieChartIcon },
    { path: '/sessions', label: 'Sessions', Icon: CalendarIcon },
    { path: '/students', label: 'Students', Icon: UsersIcon },
    { path: '/more', label: 'More', Icon: MoreHorizontalIcon },
  ]

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-100">
      {/* Notification Bell - Fixed Top Right */}
      <button
        onClick={() => setShowNotifications(true)}
        className="fixed top-4 right-4 z-40 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-slate-50 transition-colors"
      >
        <BellIcon size={22} className="text-slate-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Main Content */}
      <main className="flex-1 pb-28">
        <Outlet />
      </main>

      {/* Notification Panel */}
      {showNotifications && (
        <NotificationPanel
          notifications={notifications}
          onClose={() => setShowNotifications(false)}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onDelete={deleteNotification}
        />
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 safe-area-bottom">
        <div className="flex justify-around max-w-lg mx-auto">
          {navItems.map(({ path, label, Icon }) => {
            const active = isActive(path)
            return (
              <Link
                key={path}
                to={path}
                className={`nav-item flex-1 ${active ? 'active' : ''}`}
              >
                <Icon
                  size={24}
                  className={`transition-all duration-150 ${
                    active ? 'stroke-[2.5]' : 'stroke-2'
                  }`}
                />
                <span className={`text-[11px] font-medium ${
                  active ? 'text-slate-900' : 'text-slate-400'
                }`}>
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

export default Layout
