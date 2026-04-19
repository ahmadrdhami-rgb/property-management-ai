import { useAuth } from '../context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  MessageSquare, CreditCard, FileText,
  Wrench, LogOut, Building2, AlertTriangle
} from 'lucide-react'

const navItems = [
  { icon: MessageSquare, label: 'AI Assistant', path: '/dashboard/chat' },
  { icon: CreditCard, label: 'Payments', path: '/dashboard/payments' },
  { icon: FileText, label: 'Documents', path: '/dashboard/documents' },
  { icon: Wrench, label: 'Maintenance', path: '/dashboard/maintenance' },
  { icon: AlertTriangle, label: 'Disputes', path: '/dashboard/disputes' },
]

export default function Sidebar() {
  const { tenant, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="w-64 min-h-screen bg-[#1a1d27] border-r border-[#2a2d3a] flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-[#2a2d3a]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
            <Building2 size={20} className="text-white" />
          </div>
          <div>
            <div className="font-display font-black text-white text-sm">Sunrise Heights</div>
            <div className="text-xs text-gray-500">PMS Portal</div>
          </div>
        </div>
      </div>

      {/* Tenant Info */}
      <div className="p-4 mx-3 mt-4 bg-[#0f1117] rounded-xl border border-[#2a2d3a]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm">
            {tenant?.name?.charAt(0) || 'T'}
          </div>
          <div>
            <div className="text-sm font-semibold text-white">{tenant?.name || 'Tenant'}</div>
            <div className="text-xs text-gray-500">{tenant?.unit || ''}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 mt-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = location.pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-[#0f1117] hover:text-white'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-[#2a2d3a]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  )
}
