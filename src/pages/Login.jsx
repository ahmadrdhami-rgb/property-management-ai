import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Building2 } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async () => {
    if (!email || !password) return toast.error('Email aur password daalo')
    setLoading(true)
    const error = await login(email, password)
    if (error) {
      toast.error('Login failed')
      setLoading(false)
    } else {
      toast.success('Login successful!')
      navigate('/dashboard/chat')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1117] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 mb-4">
            <Building2 size={28} className="text-white" />
          </div>
          <h1 className="font-display text-2xl font-black text-white">Sunrise Heights</h1>
          <p className="text-sm text-gray-500 mt-1">Property Management System</p>
        </div>
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-8">
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 block mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="ahmad@tenant.com"
                className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500 transition"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="••••••••"
                className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500 transition"
              />
            </div>
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition text-sm"
            >
              {loading ? 'Logging in...' : 'Login →'}
            </button>
          </div>
          <div className="mt-4 p-3 bg-[#0f1117] rounded-xl border border-[#2a2d3a]">
            <p className="text-xs text-gray-500 text-center">
              Demo: ahmad@tenant.com / Ahmad@123
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
