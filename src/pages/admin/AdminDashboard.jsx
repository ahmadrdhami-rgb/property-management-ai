import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import {
  getAllDisputesForOwner,
  getAllMaintenanceForOwner,
  updateDisputeStatus,
  updateMaintenanceStatus,
  getAllTenants,
  addPaymentForTenant,
  addTenant,
  uploadDocument
} from '../../services/tenantService'
import {
  Users, Wrench, AlertTriangle, LogOut,
  Building2, Plus, X, CheckCircle,
  Clock, CreditCard, Eye, FileUp, Edit
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [tenants, setTenants] = useState([])
  const [disputes, setDisputes] = useState([])
  const [maintenance, setMaintenance] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddTenant, setShowAddTenant] = useState(false)
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [ownerResponse, setOwnerResponse] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [tenantForm, setTenantForm] = useState({
    name: '', email: '', phone: '', unit: '', password: ''
  })
  const [editForm, setEditForm] = useState({
    name: '', phone: '', unit: ''
  })
  const [paymentForm, setPaymentForm] = useState({
    month: '', amount: '', dueDate: ''
  })

  const navigate = useNavigate()

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const { data: tenantsData, error } = await supabase
        .from('tenants')
        .select('*, payments(*), maintenance_requests(*), disputes(*), documents(*)')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setTenants(tenantsData || [])

      const { data: disputesData } = await supabase
        .from('disputes')
        .select('*, tenants(name, unit)')
        .order('created_at', { ascending: false })
      setDisputes(disputesData || [])

      const { data: maintData } = await supabase
        .from('maintenance_requests')
        .select('*, tenants(name, unit)')
        .order('created_at', { ascending: false })
      setMaintenance(maintData || [])

    } catch (err) {
      console.error('loadAll error:', err)
      toast.error('Data load failed: ' + err.message)
    }
    setLoading(false)
  }

  const handleAddTenant = async () => {
    if (!tenantForm.name || !tenantForm.email || !tenantForm.unit || !tenantForm.password) {
      return toast.error('Sab fields bharein')
    }
    if (tenantForm.password.length < 6) {
      return toast.error('Password kam az kam 6 characters ka hona chahiye')
    }
    setSubmitting(true)
    try {
      await addTenant(
        tenantForm.name,
        tenantForm.email,
        tenantForm.phone,
        tenantForm.unit,
        tenantForm.password
      )
      toast.success('Tenant added! Login credentials: ' + tenantForm.email + ' / ' + tenantForm.password)
      setShowAddTenant(false)
      setTenantForm({ name: '', email: '', phone: '', unit: '', password: '' })
      setTimeout(() => loadAll(), 2000)
    } catch (err) {
      toast.error('Error: ' + err.message)
    }
    setSubmitting(false)
  }

  const handleEditTenantSubmit = async () => {
    if (!editForm.name || !editForm.unit) return toast.error('Fields bharein')
    setSubmitting(true)
    try {
      await supabase
        .from('tenants')
        .update({ name: editForm.name, phone: editForm.phone, unit: editForm.unit })
        .eq('id', selectedTenant.id)
      toast.success('Tenant updated!')
      setShowEditModal(false)
      loadAll()
    } catch (err) {
      toast.error('Error: ' + err.message)
    }
    setSubmitting(false)
  }

  const handleAddPayment = async () => {
    if (!paymentForm.month || !paymentForm.amount || !paymentForm.dueDate) {
      return toast.error('Sab fields bharein')
    }
    setSubmitting(true)
    try {
      await addPaymentForTenant(
        selectedTenant.id,
        paymentForm.month,
        paymentForm.amount,
        paymentForm.dueDate
      )
      toast.success('Payment record added!')
      setShowAddPayment(false)
      setPaymentForm({ month: '', amount: '', dueDate: '' })
      setSelectedTenant(null)
      loadAll()
    } catch (err) {
      toast.error('Error: ' + err.message)
    }
    setSubmitting(false)
  }

  const handleDocumentUpload = async () => {
    if (!selectedFile) return toast.error('File select karein')
    setSubmitting(true)
    try {
      await uploadDocument(selectedTenant.id, selectedFile)
      toast.success('Document uploaded!')
      setShowUploadModal(false)
      setSelectedFile(null)
      loadAll()
    } catch (err) {
      toast.error('Upload fail: ' + err.message)
    }
    setSubmitting(false)
  }

  const handleDisputeResolve = async (id, status) => {
    try {
      await updateDisputeStatus(id, status, ownerResponse)
      setDisputes(prev => prev.map(d =>
        d.id === id ? { ...d, status, owner_response: ownerResponse } : d
      ))
      toast.success('Dispute updated!')
      setOwnerResponse('')
    } catch {
      toast.error('Update failed')
    }
  }

  const handleMaintenanceUpdate = async (id, status) => {
    try {
      await updateMaintenanceStatus(id, status)
      setMaintenance(prev => prev.map(m =>
        m.id === id ? { ...m, status } : m
      ))
      toast.success('Status updated!')
    } catch {
      toast.error('Update failed')
    }
  }

  const statusColor = (status) => {
    if (status === 'Resolved' || status === 'Closed' || status === 'Paid')
      return 'text-green-400 bg-green-500/10 border-green-500/20'
    if (status === 'In Progress')
      return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
    return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'tenants', label: 'Tenants', icon: Users },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'disputes', label: 'Disputes', icon: AlertTriangle },
  ]

  if (loading) return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
      <div className="text-purple-400 animate-pulse">Loading admin panel...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0f1117] flex">
      <div className="w-64 bg-[#1a1d27] border-r border-[#2a2d3a] flex flex-col fixed h-full">
        <div className="p-6 border-b border-[#2a2d3a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Building2 size={18} className="text-white" />
            </div>
            <div>
              <div className="font-display font-black text-white text-sm">Admin Panel</div>
              <div className="text-xs text-gray-500">Property Owner</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 mt-4">
          {tabs.map(tab => {
            const Icon = tab.icon
            const badge = tab.id === 'disputes'
              ? disputes.filter(d => d.status === 'Open').length
              : tab.id === 'maintenance'
                ? maintenance.filter(m => m.status === 'Pending').length
                : 0
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${activeTab === tab.id
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:bg-[#0f1117] hover:text-white'
                  }`}
              >
                <Icon size={17} />
                {tab.label}
                {badge > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
        <div className="p-3 border-t border-[#2a2d3a]">
          <button
            onClick={async () => { await supabase.auth.signOut(); navigate('/admin') }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition"
          >
            <LogOut size={17} />Logout
          </button>
        </div>
      </div>

      <div className="flex-1 ml-64 p-8 max-w-5xl">
        {activeTab === 'overview' && (
          <div>
            <h1 className="font-display text-2xl font-black text-white mb-2">Overview</h1>
            <p className="text-gray-500 text-sm mb-8">Property management at a glance</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-5">
                <Users size={18} className="text-blue-400 mb-3" />
                <div className="text-3xl font-black text-white font-display">{tenants.length}</div>
                <div className="text-xs text-gray-500 mt-1">Total Tenants</div>
              </div>
              <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-5">
                <CreditCard size={18} className="text-green-400 mb-3" />
                <div className="text-3xl font-black text-white font-display">
                  {tenants.reduce((sum, t) => sum + (t.payments?.filter(p => p.status === 'Paid').length || 0), 0)}
                </div>
                <div className="text-xs text-gray-500 mt-1">Payments Received</div>
              </div>
              <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-5">
                <Wrench size={18} className="text-yellow-400 mb-3" />
                <div className="text-3xl font-black text-white font-display">
                  {maintenance.filter(m => m.status === 'Pending').length}
                </div>
                <div className="text-xs text-gray-500 mt-1">Pending Maintenance</div>
              </div>
              <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-5">
                <AlertTriangle size={18} className="text-red-400 mb-3" />
                <div className="text-3xl font-black text-white font-display">
                  {disputes.filter(d => d.status === 'Open').length}
                </div>
                <div className="text-xs text-gray-500 mt-1">Open Disputes</div>
              </div>
            </div>
            
            <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-[#2a2d3a] flex justify-between items-center">
                <h2 className="font-semibold text-white text-sm">Recent Tenants</h2>
                <button onClick={() => setActiveTab('tenants')} className="text-xs text-blue-400">View all</button>
              </div>
              {tenants.slice(0, 3).map(t => (
                <div key={t.id} className="px-6 py-4 flex justify-between items-center border-b border-[#2a2d3a] last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-sm font-bold">
                      {t.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{t.name || 'No Name'}</div>
                      <div className="text-xs text-gray-500">{t.unit || 'No unit'}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">{t.email}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tenants' && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="font-display text-2xl font-black text-white mb-1">Tenants</h1>
                <p className="text-gray-500 text-sm">Manage all tenants and their data</p>
              </div>
              <button
                onClick={() => setShowAddTenant(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition"
              >
                <Plus size={16} />Add Tenant
              </button>
            </div>
            <div className="space-y-4">
              {tenants.map(t => (
                <div key={t.id} className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-lg font-bold">
                        {t.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <div className="font-semibold text-white">
                          {t.name || 'Unnamed Tenant'} 
                          <button
                            onClick={() => {
                              setSelectedTenant(t); 
                              setEditForm({ name: t.name || '', phone: t.phone || '', unit: t.unit || '' });
                              setShowEditModal(true);
                            }}
                            className="ml-2 text-gray-500 hover:text-purple-400 transition"
                          >
                            <Edit size={14} className="inline" />
                          </button>
                        </div>
                        <div className="text-xs text-gray-500">{t.unit || 'Not Assigned'} • {t.email} • {t.phone || 'No phone'}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setSelectedTenant(t); setShowUploadModal(true) }}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-semibold rounded-xl transition border border-blue-500/20"
                      >
                        <FileUp size={13} />
                        Upload Doc
                      </button>
                      <button
                        onClick={() => { setSelectedTenant(t); setShowAddPayment(true) }}
                        className="flex items-center gap-2 px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 text-xs font-semibold rounded-xl transition border border-green-500/20"
                      >
                        <CreditCard size={13} />
                        Add Payment
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-3">
                    <div className="bg-[#0f1117] rounded-xl p-3 text-center border-l-2 border-green-500">
                      <div className="text-lg font-black text-white">
                        {t.payments?.filter(p => p.status === 'Paid').length || 0}
                      </div>
                      <div className="text-xs text-gray-500">Paid</div>
                    </div>
                    <div className="bg-[#0f1117] rounded-xl p-3 text-center border-l-2 border-red-500">
                      <div className="text-lg font-black text-red-400">
                        {t.payments?.filter(p => p.status === 'Due').length || 0}
                      </div>
                      <div className="text-xs text-gray-500">Due</div>
                    </div>
                    <div className="bg-[#0f1117] rounded-xl p-3 text-center border-l-2 border-yellow-500">
                      <div className="text-lg font-black text-yellow-400">
                        {t.maintenance_requests?.filter(m => m.status === 'Pending').length || 0}
                      </div>
                      <div className="text-xs text-gray-500">Maint.</div>
                    </div>
                    <div className="bg-[#0f1117] rounded-xl p-3 text-center border-l-2 border-blue-500">
                      <div className="text-lg font-black text-blue-400">
                        {t.documents?.length || 0}
                      </div>
                      <div className="text-xs text-gray-500">Docs</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div>
            <h1 className="font-display text-2xl font-black text-white mb-2">Maintenance</h1>
            <p className="text-gray-500 text-sm mb-8">All tenant maintenance requests</p>
            <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl overflow-hidden">
              {maintenance.map(m => (
                <div key={m.id} className="px-6 py-4 flex items-center justify-between border-b border-[#2a2d3a] last:border-0 hover:bg-[#0f1117] transition">
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white">{m.issue}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {m.tenants?.name} • {m.tenants?.unit} • {m.created_at?.split('T')[0]}
                    </div>
                    {m.description && <div className="text-xs text-gray-600 mt-1">{m.description}</div>}
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${statusColor(m.status)}`}>
                      {m.status}
                    </span>
                    <select
                      value={m.status}
                      onChange={e => handleMaintenanceUpdate(m.id, e.target.value)}
                      className="bg-[#0f1117] border border-[#2a2d3a] text-gray-400 text-xs rounded-lg px-2 py-1.5 outline-none"
                    >
                      <option>Pending</option>
                      <option>In Progress</option>
                      <option>Resolved</option>
                    </select>
                  </div>
                </div>
              ))}
              {maintenance.length === 0 && (
                <div className="p-12 text-center text-gray-500 text-sm">No maintenance requests</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'disputes' && (
          <div>
            <h1 className="font-display text-2xl font-black text-white mb-2">Disputes</h1>
            <p className="text-gray-500 text-sm mb-8">Review and respond to tenant disputes</p>
            <div className="space-y-4">
              {disputes.map(d => (
                <div key={d.id} className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-sm font-semibold text-white">{d.title}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {d.tenants?.name} • {d.tenants?.unit} • {d.created_at?.split('T')[0]}
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${statusColor(d.status)}`}>
                      {d.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">{d.description}</p>
                  {d.owner_response && (
                    <div className="p-3 bg-[#0f1117] rounded-xl border border-purple-500/20 mb-3">
                      <div className="text-xs text-purple-400 mb-1">Your Response:</div>
                      <div className="text-xs text-gray-300">{d.owner_response}</div>
                    </div>
                  )}
                  {d.status === 'Open' && (
                    <div className="space-y-3">
                      <textarea
                        onChange={e => setOwnerResponse(e.target.value)}
                        placeholder="Write your response..."
                        rows={2}
                        className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-4 py-3 text-sm text-white outline-none resize-none focus:border-purple-500 transition"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDisputeResolve(d.id, 'In Progress')}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition"
                        >In Progress</button>
                        <button
                          onClick={() => handleDisputeResolve(d.id, 'Resolved')}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-xl transition"
                        >Resolve</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {disputes.length === 0 && (
                <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-12 text-center text-gray-500 text-sm">
                  No disputes raised
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showAddTenant && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-black text-white text-lg">Add New Tenant</h3>
              <button onClick={() => setShowAddTenant(false)}><X size={20} className="text-gray-500" /></button>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Full Name', key: 'name', placeholder: 'e.g. Ali Hassan' },
                { label: 'Email', key: 'email', placeholder: 'ali@email.com' },
                { label: 'Phone', key: 'phone', placeholder: '0311-1234567' },
                { label: 'Unit', key: 'unit', placeholder: 'e.g. Apt 2A, Sunrise Heights' },
                { label: 'Password (for tenant login)', key: 'password', placeholder: 'Min 6 characters' },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-xs text-gray-400 block mb-2">{field.label}</label>
                  <input
                    type={field.key === 'password' ? 'password' : 'text'}
                    value={tenantForm[field.key]}
                    onChange={e => setTenantForm({ ...tenantForm, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500 transition"
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddTenant(false)}
                  className="flex-1 py-3 rounded-xl border border-[#2a2d3a] text-gray-400 text-sm font-semibold hover:bg-[#0f1117] transition"
                >Cancel</button>
                <button
                  onClick={handleAddTenant}
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-semibold transition"
                >
                  {submitting ? 'Adding...' : 'Add Tenant'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedTenant && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display font-black text-white text-lg">Edit Tenant Data</h3>
                <p className="text-xs text-gray-500 mt-1">For: {selectedTenant.email}</p>
              </div>
              <button onClick={() => { setShowEditModal(false); setSelectedTenant(null) }}>
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 block mb-2">Name</label>
                <input
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500 transition"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-2">Unit</label>
                <input
                  value={editForm.unit}
                  onChange={e => setEditForm({ ...editForm, unit: e.target.value })}
                  className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500 transition"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-2">Phone</label>
                <input
                  value={editForm.phone}
                  onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500 transition"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowEditModal(false); setSelectedTenant(null) }}
                  className="flex-1 py-3 rounded-xl border border-[#2a2d3a] text-gray-400 text-sm font-semibold hover:bg-[#0f1117] transition"
                >Cancel</button>
                <button
                  onClick={handleEditTenantSubmit}
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-semibold transition"
                >
                  {submitting ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showUploadModal && selectedTenant && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display font-black text-white text-lg">Upload Document</h3>
                <p className="text-xs text-gray-500 mt-1">For: {selectedTenant.name || selectedTenant.email}</p>
              </div>
              <button onClick={() => { setShowUploadModal(false); setSelectedTenant(null) }}>
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="border border-dashed border-[#2a2d3a] rounded-xl p-8 text-center bg-[#0f1117]">
                <input
                  type="file"
                  onChange={e => setSelectedFile(e.target.files[0])}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,image/*"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <FileUp size={32} className="text-blue-500 mx-auto mb-3" />
                  <div className="text-sm font-medium text-white mb-1">
                    {selectedFile ? selectedFile.name : 'Click to browse files'}
                  </div>
                  <div className="text-xs text-gray-500">PDF or Images up to 10MB</div>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowUploadModal(false); setSelectedTenant(null) }}
                  className="flex-1 py-3 rounded-xl border border-[#2a2d3a] text-gray-400 text-sm font-semibold hover:bg-[#0f1117] transition"
                >Cancel</button>
                <button
                  onClick={handleDocumentUpload}
                  disabled={submitting || !selectedFile}
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold transition"
                >
                  {submitting ? 'Uploading...' : 'Upload File'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddPayment && selectedTenant && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display font-black text-white text-lg">Add Payment</h3>
                <p className="text-xs text-gray-500 mt-1">For: {selectedTenant.name || selectedTenant.email}</p>
              </div>
              <button onClick={() => { setShowAddPayment(false); setSelectedTenant(null) }}>
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 block mb-2">Month</label>
                <input
                  value={paymentForm.month}
                  onChange={e => setPaymentForm({ ...paymentForm, month: e.target.value })}
                  placeholder="e.g. June 2025"
                  className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-green-500 transition"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-2">Amount (PKR)</label>
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  placeholder="45000"
                  className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-green-500 transition"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-2">Due Date</label>
                <input
                  type="date"
                  value={paymentForm.dueDate}
                  onChange={e => setPaymentForm({ ...paymentForm, dueDate: e.target.value })}
                  className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-green-500 transition"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowAddPayment(false); setSelectedTenant(null) }}
                  className="flex-1 py-3 rounded-xl border border-[#2a2d3a] text-gray-400 text-sm font-semibold hover:bg-[#0f1117] transition"
                >Cancel</button>
                <button
                  onClick={handleAddPayment}
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold transition"
                >
                  {submitting ? 'Adding...' : 'Add Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
