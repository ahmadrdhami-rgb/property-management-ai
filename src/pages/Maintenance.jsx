import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getMaintenanceRequests, createMaintenanceRequest } from '../services/tenantService'
import { Wrench, Plus, X, Clock, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Maintenance() {
  const { tenant } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ issue: '', priority: 'Normal', description: '' })

  useEffect(() => {
    if (tenant?.id) loadRequests()
  }, [tenant])

  const loadRequests = async () => {
    const data = await getMaintenanceRequests(tenant.id)
    setRequests(data)
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!form.issue.trim()) return toast.error('Issue title required')
    setSubmitting(true)
    try {
      const newReq = await createMaintenanceRequest(
        tenant.id, form.issue, form.description, form.priority
      )
      setRequests(prev => [newReq, ...prev])
      toast.success('Maintenance request submitted!')
      setShowModal(false)
      setForm({ issue: '', priority: 'Normal', description: '' })
    } catch {
      toast.error('Submission failed. Try again.')
    }
    setSubmitting(false)
  }

  const statusConfig = {
    Pending: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
    'In Progress': { icon: Loader, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    Resolved: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  }

  const priorityColor = {
    Normal: 'text-gray-400',
    Urgent: 'text-orange-400',
    Emergency: 'text-red-400'
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-blue-400 animate-pulse">Loading requests...</div>
    </div>
  )

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-black text-white">Maintenance</h1>
          <p className="text-gray-500 text-sm mt-1">Track and submit maintenance requests</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition"
        >
          <Plus size={16} />
          New Request
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {['Pending', 'In Progress', 'Resolved'].map(status => {
          const count = requests.filter(r => r.status === status).length
          const config = statusConfig[status]
          const Icon = config.icon
          return (
            <div key={status} className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-4">
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center mb-3 ${config.bg}`}>
                <Icon size={16} className={config.color} />
              </div>
              <div className="text-2xl font-black text-white font-display">{count}</div>
              <div className="text-xs text-gray-500 mt-1">{status}</div>
            </div>
          )
        })}
      </div>

      {/* Requests List */}
      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2a2d3a]">
          <h2 className="font-semibold text-white text-sm">All Requests</h2>
        </div>
        {requests.length === 0 ? (
          <div className="p-12 text-center">
            <Wrench size={32} className="text-gray-600 mx-auto mb-3" />
            <div className="text-gray-500 text-sm">No maintenance requests yet</div>
          </div>
        ) : (
          <div className="divide-y divide-[#2a2d3a]">
            {requests.map((req) => {
              const config = statusConfig[req.status] || statusConfig['Pending']
              const Icon = config.icon
              return (
                <div key={req.id} className="px-6 py-4 flex items-center justify-between hover:bg-[#0f1117] transition">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                      <Icon size={16} className={config.color} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{req.issue}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {req.created_at?.split('T')[0]} •
                        <span className={' ' + priorityColor[req.priority]}> {req.priority}</span>
                      </div>
                      {req.description && (
                        <div className="text-xs text-gray-600 mt-1">{req.description}</div>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${config.bg} ${config.color}`}>
                    {req.status}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-black text-white text-lg">New Request</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white transition">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 block mb-2">Issue Title *</label>
                <input
                  value={form.issue}
                  onChange={e => setForm({ ...form, issue: e.target.value })}
                  placeholder="e.g. AC not working"
                  className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-2">Priority</label>
                <select
                  value={form.priority}
                  onChange={e => setForm({ ...form, priority: e.target.value })}
                  className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition"
                >
                  <option>Normal</option>
                  <option>Urgent</option>
                  <option>Emergency</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-2">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the issue..."
                  rows={3}
                  className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl border border-[#2a2d3a] text-gray-400 text-sm font-semibold hover:bg-[#0f1117] transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold transition"
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
