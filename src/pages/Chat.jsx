import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getPayments, getDocuments, getMaintenanceRequests, createMaintenanceRequest, createEnquiry } from '../services/tenantService'
import { askAI } from '../services/geminiService'
import { Send, Wrench, X, Bot, User } from 'lucide-react'
import toast from 'react-hot-toast'

const quickActions = [
  { label: '💸 Next Rent Due', msg: 'When is my next rent payment due?' },
  { label: '📄 My Documents', msg: 'What documents are uploaded under my profile?' },
  { label: '🧾 Last Receipt', msg: 'Show my last payment receipt' },
  { label: '📋 My Requests', msg: 'Show my maintenance requests' },
  { label: '🔄 Renew Contract', msg: 'How can I renew my contract?' },
  { label: '📞 Contact Office', msg: 'How do I contact the property management office?' },
]

export default function Chat() {
  const { tenant } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [payments, setPayments] = useState([])
  const [documents, setDocuments] = useState([])
  const [maintenanceList, setMaintenanceList] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ issue: '', priority: 'Normal', description: '' })
  const [submitting, setSubmitting] = useState(false)
  const [conversationHistory, setConversationHistory] = useState([])
  const chatEndRef = useRef(null)

  useEffect(() => {
    if (tenant?.id) loadData()
  }, [tenant])

  useEffect(() => {
    if (tenant?.name) {
      setMessages([{
        role: 'assistant',
        content: 'Assalam-o-Alaikum, **' + tenant.name + '!**\n\nI am your AI Property Assistant for **' + tenant.unit + '**. I can help you with:\n\n• 💸 Payment information and receipts\n• 📄 Your documents\n• 🔧 Maintenance requests\n• ❓ General property enquiries\n\nHow can I assist you today?',
        time: new Date()
      }])
    }
  }, [tenant])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadData = async () => {
    try {
      const [p, d, m] = await Promise.all([
        getPayments(tenant.id),
        getDocuments(tenant.id),
        getMaintenanceRequests(tenant.id)
      ])
      setPayments(p)
      setDocuments(d)
      setMaintenanceList(m)
    } catch (err) {
      console.error('Data load error:', err)
    }
  }

  const detectMaintenance = (text) => {
    const lower = text.toLowerCase()
    const excludeKeywords = [
      'contact', 'office', 'phone', 'email', 'how do i',
      'how can i', 'renew', 'payment', 'document', 'receipt',
      'when is', 'show me', 'what is', 'who is', 'my name',
      'history', 'status'
    ]
    const maintenanceKeywords = [
      'not working', 'broken', 'leaking', 'repair',
      'needs fixing', 'plumbing', 'electrical issue',
      'raise a request', 'maintenance request', 'submit a request',
      'want to raise', 'ac issue', 'water issue'
    ]
    const hasExclude = excludeKeywords.some(k => lower.includes(k))
    if (hasExclude) return false
    return maintenanceKeywords.some(k => lower.includes(k))
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMsg = { role: 'user', content: input, time: new Date() }
    setMessages(prev => [...prev, userMsg])
    const currentInput = input
    setInput('')
    setLoading(true)

    if (detectMaintenance(currentInput)) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I see you have a maintenance issue: **"' + currentInput + '"**\n\nPlease click the button below to submit a formal maintenance ticket.',
        time: new Date(),
        action: 'maintenance',
        issueText: currentInput
      }])
      setForm(prev => ({ ...prev, issue: currentInput }))
      setLoading(false)
      return
    }

    // Update conversation history
    const newHistory = [...conversationHistory, { role: 'user', content: currentInput }]

    try {
      // ✅ REAL-TIME FIX: Fetch fresh data from DB right before asking AI
      const [freshPayments, freshDocs, freshMaint] = await Promise.all([
        getPayments(tenant.id),
        getDocuments(tenant.id),
        getMaintenanceRequests(tenant.id)
      ])
      
      // Update local state with latest records
      setPayments(freshPayments)
      setDocuments(freshDocs)
      setMaintenanceList(freshMaint)

      // Send the freshest data to the AI
      const reply = await askAI(currentInput, tenant, freshPayments, freshDocs, freshMaint, newHistory)

      // Save history with assistant reply
      setConversationHistory([...newHistory, { role: 'assistant', content: reply }])

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: reply,
        time: new Date()
      }])
    } catch (err) {
      toast.error('AI response failed. Try again.')
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        time: new Date()
      }])
    }
    setLoading(false)
  }

  const handleSubmitMaintenance = async () => {
    if (!form.issue.trim()) return toast.error('Issue title required')
    setSubmitting(true)
    try {
      const newRequest = await createMaintenanceRequest(
        tenant.id, form.issue, form.description, form.priority
      )
      await createEnquiry(tenant.id, 'Maintenance Request: ' + form.issue)
      
      // ✅ Real time sync — list update karo
      setMaintenanceList(prev => [newRequest, ...prev])
      
      toast.success('Maintenance request submitted!')
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Your maintenance request has been submitted!\n\n• **Ticket ID:** ' + newRequest.id.slice(0, 8).toUpperCase() + '\n• **Issue:** ' + form.issue + '\n• **Priority:** ' + form.priority + '\n• **Status:** Pending\n\nOur team will contact you within 3-5 working days.',
        time: new Date()
      }])
      setShowModal(false)
      setForm({ issue: '', priority: 'Normal', description: '' })
    } catch (err) {
      toast.error('Submission failed: ' + err.message)
    }
    setSubmitting(false)
  }

  const formatContent = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>')
  }

  return (
    <div className="flex flex-col h-screen bg-[#0f1117]">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[#2a2d3a] bg-[#1a1d27] flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
          <Bot size={18} className="text-white" />
        </div>
        <div>
          <div className="font-semibold text-white text-sm">AI Property Assistant</div>
          <div className="text-xs text-gray-500 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"></span>
            Online — Powered by Groq AI
          </div>
        </div>
        <div className="ml-auto text-xs text-gray-600">
          Tenant: {tenant?.name}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-3 border-b border-[#2a2d3a] bg-[#1a1d27] overflow-x-auto flex-shrink-0">
        <div className="flex gap-2 min-w-max">
          {quickActions.map((qa, i) => (
            <button
              key={i}
              onClick={() => setInput(qa.msg)}
              className="px-3 py-1.5 rounded-full border border-[#2a2d3a] bg-[#0f1117] text-gray-400 text-xs hover:border-blue-500 hover:text-blue-400 transition whitespace-nowrap"
            >
              {qa.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot size={14} className="text-white" />
              </div>
            )}
            <div className="max-w-lg">
              <div
                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-sm'
                    : 'bg-[#1e2130] border border-[#2a2d3a] text-gray-200 rounded-tl-sm'
                }`}
                dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
              />
              {msg.action === 'maintenance' && (
                <button
                  onClick={() => { setForm(prev => ({ ...prev, issue: msg.issueText })); setShowModal(true) }}
                  className="mt-2 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition"
                >
                  <Wrench size={14} />
                  Raise Maintenance Request
                </button>
              )}
              <div className="text-xs text-gray-600 mt-1 px-1">
                {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-[#2a2d3a] flex items-center justify-center flex-shrink-0 mt-1">
                <User size={14} className="text-gray-400" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 items-end">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <Bot size={14} className="text-white" />
            </div>
            <div className="px-4 py-3 bg-[#1e2130] border border-[#2a2d3a] rounded-2xl rounded-tl-sm flex gap-1.5 items-center">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[#2a2d3a] bg-[#1a1d27] flex-shrink-0">
        <div className="flex gap-3">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Ask anything about your property..."
            className="flex-1 bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500 transition"
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="w-12 h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl flex items-center justify-center transition flex-shrink-0"
          >
            <Send size={18} className="text-white" />
          </button>
        </div>
      </div>

      {/* Maintenance Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-black text-white text-lg">🔧 Maintenance Request</h3>
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
                  placeholder="Describe the issue in detail..."
                  rows={3}
                  className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl border border-[#2a2d3a] text-gray-400 text-sm font-semibold hover:bg-[#0f1117] transition"
                >Cancel</button>
                <button
                  onClick={handleSubmitMaintenance}
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold transition"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
