import { Link } from 'react-router-dom'
import { ClockIcon, FileTextIcon, ChevronRightIcon } from '../components/ui/Icons'

const More = () => {
  const menuItems = [
    {
      title: 'My Schedule',
      description: 'Manage recurring weekly classes',
      icon: ClockIcon,
      path: '/schedule',
      color: '#3B82F6',
    },
    {
      title: 'Invoices',
      description: 'Generate invoices for students',
      icon: FileTextIcon,
      path: '/invoices/generate',
      color: '#10B981',
    },
  ]

  return (
    <div className="px-4 pt-12 pb-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-1">More</h1>
        <p className="text-slate-500">Settings and additional features</p>
      </div>

      {/* Menu Items */}
      <div className="space-y-3">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.path}
              to={item.path}
              className="card p-4 flex items-center gap-4 active:scale-[0.98] transition-all"
            >
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${item.color}15` }}
              >
                <div style={{ color: item.color }}>
                  <Icon size={24} />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900">{item.title}</h3>
                <p className="text-sm text-slate-500">{item.description}</p>
              </div>

              {/* Arrow */}
              <ChevronRightIcon size={20} className="text-slate-300" />
            </Link>
          )
        })}
      </div>

      {/* Version Info */}
      <div className="mt-12 text-center text-sm text-slate-400">
        <p>Coaching Calculator v1.0</p>
      </div>
    </div>
  )
}

export default More
