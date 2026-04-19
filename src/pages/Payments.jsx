import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/supabase'
import { CreditCard, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Payments() {
  const { tenant } = useAuth()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  const loadPayments = async () => {
    if (!tenant?.id) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setPayments(data || [])
    } catch (err) {
      toast.error('Error: ' + err.message)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (tenant?.id) loadPayments()
  }, [tenant?.id])

  const handlePayNow = async (payment) => {
    const confirmed = window.confirm(
      'Pay PKR ' + Number(payment.amount).toLocaleString() + ' for ' + payment.month + '?\n\n' +
      'Bank: HBL 0123-4567890\nJazzCash: 0311-1234567\n\nClick OK after transfer.'
    )
    if (!confirmed) return

    const { error } = await supabase
      .from('payments')
      .update({
        status: 'Paid',
        paid_date: new Date().toISOString().split('T')[0],
        receipt_no: 'REC-' + Date.now()
      })
      .eq('id', payment.id)

    if (error) {
      toast.error('Error: ' + error.message)
    } else {
      toast.success('Payment recorded!')
      loadPayments()
    }
  }

  const totalPaid = payments
    .filter(p => p.status === 'Paid')
    .reduce((s, p) => s + Number(p.amount), 0)
  
  const nextDue = payments.find(p => p.status === 'Due')

  const statusStyle = (status) => {
    if (status === 'Paid') return 'bg-green-500/10 text-green-400 border-green-500/20'
    return 'bg-red-500/10 text-red-400 border-red-500/20'
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-black text-white">Payments</h1>
        <p className="text-gray-500 text-sm mt-1">Your rent payment history</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <CreditCard size={18} className="text-blue-400" />
            </div>
            <span className="text-xs text-gray-500">Monthly Rent</span>
          </div>
          <div className="text-2xl font-bold text-white">PKR 45,000</div>
        </div>

        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center">
              <CheckCircle size={18} className="text-green-400" />
            </div>
            <span className="text-xs text-gray-500">Total Paid</span>
          </div>
          <div className="text-2xl font-bold text-white">
            PKR {totalPaid.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {payments.filter(p => p.status === 'Paid').length} payments
          </div>
        </div>

        <div className={`border rounded-2xl p-5 ${nextDue ? 'bg-red-500/5 border-red-500/20' : 'bg-green-500/5 border-green-500/20'}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${nextDue ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
              <AlertCircle size={18} className={nextDue ? 'text-red-400' : 'text-green-400'} />
            </div>
            <span className="text-xs text-gray-500">Next Due</span>
          </div>
          <div className={`text-xl font-bold ${nextDue ? 'text-red-400' : 'text-green-400'}`}>
            {nextDue ? 'PKR ' + Number(nextDue.amount).toLocaleString() : 'All Clear!'}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {nextDue ? 'Due: ' + nextDue.due_date : 'No pending payments'}
          </div>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-12 text-center">
          <CreditCard size={32} className="text-gray-600 mx-auto mb-3" />
          <div className="text-gray-400 text-sm">No payment records found</div>
          <div className="text-gray-600 text-xs mt-1">Contact admin to add payment schedule</div>
        </div>
      ) : (
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#2a2d3a]">
            <h2 className="font-semibold text-white text-sm">Payment History</h2>
          </div>
          <div className="divide-y divide-[#2a2d3a]">
            {payments.map(payment => (
              <div key={payment.id} className="px-6 py-4 flex items-center justify-between hover:bg-[#0f1117] transition">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#0f1117] flex items-center justify-center">
                    {payment.status === 'Paid'
                      ? <CheckCircle size={16} className="text-green-400" />
                      : <Clock size={16} className="text-red-400" />
                    }
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{payment.month}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {payment.status === 'Paid'
                        ? 'Paid: ' + payment.paid_date + (payment.receipt_no ? ' • ' + payment.receipt_no : '')
                        : 'Due: ' + payment.due_date
                      }
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-bold text-white">
                    PKR {Number(payment.amount).toLocaleString()}
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${statusStyle(payment.status)}`}>
                    {payment.status}
                  </span>
                  {payment.status === 'Due' && (
                    <button
                      onClick={() => handlePayNow(payment)}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition"
                    >
                      Pay Now
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
        <p className="text-xs text-yellow-400">
          ⚠️ Late fee PKR 2,000 after 10 days. Pay via JazzCash, EasyPaisa or HBL 0123-4567890
        </p>
      </div>
    </div>
  )
}
