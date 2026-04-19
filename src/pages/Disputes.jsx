import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { createDispute, getDisputes } from '../services/tenantService'
import { AlertTriangle, Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Disputes() {
  const { tenant } = useAuth()
  const [disputes, setDisputes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ title: '', description: '' })

  useEffect(() => {
    if (tenant?.id) {
      getDisputes(tenant.id).then(data => {
        setDisputes(data)
        setLoading(false)
      })
    }
  }, [tenant])

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      return toast.error('Title aur description zaroori hai')
    }
    setSubmitting(true)
    try {
      const newDispute = await createDispute(tenant.id, form.title, form.description)
      setDisputes(prev => [newDispute, ...prev])
      toast.success('Dispute submitted to property management!')
      setShowModal(false)
      setForm({ title: '', description: '' })
    } catch {
      toast.error('Submission failed')
    }
    setSubmitting(false)
  }

  const statusColor = (status) => {
    if (status === 'Resolved') return 'bg-green-500/10 text-green-400 border-green-500/20'
    if (status === 'In Progress') return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-blue-400 animate-pulse">Loading disputes...</div>
    </div>
  )

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-black text-white">Disputes</h1>
          <p className="text-gray-500 text-sm mt-1">Raise and track disputes with property management</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition"
        >
          <Plus size={16} />
          Raise Dispute
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {['Open', 'In Progress', 'Resolved'].map(status => (
          <div key={status} className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-4">
            <div className="text-2xl font-black text-white font-display">
              {disputes.filter(d => d.status === status).length}
            </div>
            <div className="text-xs text-gray-500 mt-1">{status}</div>
          </div>
        ))}
      </div>

      {/* Disputes List */}
      <div className="space-y-4">
        {disputes.map(d => (
          <div key={d.id} className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-sm font-semibold text-white">{d.title}</div>
                <div className="text-xs text-gray-500 mt-1">{d.created_at?.split('T')[0]}</div>
              </div>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${statusColor(d.status)}`}>
                {d.status}
              </span>
            </div>
            <p className="text-sm text-gray-400">{d.description}</p>
            {d.owner_response && (
              <div className="mt-3 p-3 bg-[#0f1117] rounded-xl border border-purple-500/20">
                <div className="text-xs text-purple-400 mb-1">Management Response:</div>
                <div className="text-xs text-gray-300">{d.owner_response}</div>
              </div>
            )}
          </div>
        ))}
        {disputes.length === 0 && (
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-12 text-center">
            <AlertTriangle size={32} className="text-gray-600 mx-auto mb-3" />
            <div className="text-gray-500 text-sm">No disputes raised yet</div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-black text-white text-lg">Raise a Dispute</h3>
              <button onClick={() => setShowModal(false)}>
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 block mb-2">Dispute Title *</label>
                <input
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Incorrect rent charged"
                  className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-red-500 transition"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-2">Description *</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe your dispute in detail..."
                  rows={4}
                  className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-red-500 transition resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl border border-[#2a2d3a] text-gray-400 text-sm font-semibold hover:bg-[#0f1117] transition"
                >Cancel</button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold transition"
                >
                  {submitting ? 'Submitting...' : 'Submit Dispute'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
