import { Outlet, Navigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user, loading } = useAuth()

  if (loading) return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
      <div className="text-blue-400 text-sm animate-pulse">Loading...</div>
    </div>
  )

  if (!user) return <Navigate to="/login" />

  return (
    <div className="flex min-h-screen bg-[#0f1117]">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
