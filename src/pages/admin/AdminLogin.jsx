import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import toast from 'react-hot-toast'
import { Building2 } from 'lucide-react'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async () => {
    if (!email || !password) return toast.error('Fields bharein')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error('Login failed: ' + error.message)
      setLoading(false)
    } else {
      navigate('/admin/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1117] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
            <Building2 size={28} className="text-white" />
          </div>
          <h1 className="font-display text-2xl font-black text-white">Admin Portal</h1>
          <p className="text-sm text-gray-500 mt-1">Sunrise Heights — Owner Access</p>
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
                placeholder="owner@sunriseheights.pk"
                className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500 transition"
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
                className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500 transition"
              />
            </div>
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition text-sm"
            >
              {loading ? 'Logging in...' : 'Admin Login →'}
            </button>
          </div>
          <div className="mt-4 p-3 bg-[#0f1117] rounded-xl border border-[#2a2d3a]">
            <p className="text-xs text-gray-500 text-center">
              owner@sunriseheights.pk / Owner@123
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
