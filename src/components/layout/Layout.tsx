import { Outlet, Link, useLocation } from 'react-router-dom'
import { HomeIcon, UsersIcon, CalendarIcon, PieChartIcon, MoreHorizontalIcon } from '../ui/Icons'

const Layout = () => {
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Home', Icon: HomeIcon },
    { path: '/insights', label: 'Insights', Icon: PieChartIcon },
    { path: '/sessions', label: 'Sessions', Icon: CalendarIcon },
    { path: '/students', label: 'Students', Icon: UsersIcon },
    { path: '/invoices', label: 'Invoice', Icon: MoreHorizontalIcon },
  ]

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-100">
      {/* Main Content */}
      <main className="flex-1 pb-24">
        <Outlet />
      </main>

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
