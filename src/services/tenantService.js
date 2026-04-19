import { createClient } from '@supabase/supabase-js'
import { supabase } from './supabase'


export const getPayments = async (tenantId) => {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export const getDocuments = async (tenantId) => {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('uploaded_at', { ascending: false })
  if (error) throw error
  return data || []
}

export const getMaintenanceRequests = async (tenantId) => {
  const { data, error } = await supabase
    .from('maintenance_requests')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export const getDisputes = async (tenantId) => {
  const { data, error } = await supabase
    .from('disputes')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export const createMaintenanceRequest = async (tenantId, issue, description, priority) => {
  const { data, error } = await supabase
    .from('maintenance_requests')
    .insert([{ tenant_id: tenantId, issue, description, priority, status: 'Pending' }])
    .select()
    .single()
  if (error) throw error
  return data
}

export const createEnquiry = async (tenantId, message) => {
  const { data, error } = await supabase
    .from('enquiries')
    .insert([{ tenant_id: tenantId, message }])
    .select()
    .single()
  if (error) throw error
  return data
}

export const createDispute = async (tenantId, title, description) => {
  const { data, error } = await supabase
    .from('disputes')
    .insert([{ tenant_id: tenantId, title, description, status: 'Open' }])
    .select()
    .single()
  if (error) throw error
  return data
}

export const uploadDocument = async (tenantId, file) => {
  const fileExt = file.name.split('.').pop()
  const fileName = tenantId + '/' + Date.now() + '.' + fileExt

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(fileName, file, { upsert: true })
  if (uploadError) throw uploadError

  const { data: urlData } = supabase.storage
    .from('documents')
    .getPublicUrl(fileName)

  const { data, error } = await supabase
    .from('documents')
    .insert([{
      tenant_id: tenantId,
      name: file.name,
      type: file.type.includes('pdf') ? 'PDF' : 'Image',
      size: (file.size / 1024 / 1024).toFixed(1) + ' MB',
      url: urlData.publicUrl
    }])
    .select()
    .single()
  if (error) throw error
  return data
}

export const deleteDocument = async (docId, url) => {
  if (url && !url.includes('example.com')) {
    const path = url.split('/documents/')[1]
    if (path) await supabase.storage.from('documents').remove([path])
  }
  const { error } = await supabase.from('documents').delete().eq('id', docId)
  if (error) throw error
}

export const getAllTenants = async () => {
  const { data, error } = await supabase
    .from('tenants')
    .select('*, payments(*), maintenance_requests(*), disputes(*), documents(*)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export const addTenant = async (name, email, phone, unit, password) => {
  const { data: { user } } = await supabase.auth.getUser()
  const adminId = user?.id

  const tempClient = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )

  const { error: authError } = await tempClient.auth.signUp({
    email,
    password,
    options: { data: { name, phone, unit, owner_id: adminId } }
  })

  if (authError && !authError.message.includes('already registered')) {
    throw authError
  }

  await new Promise(r => setTimeout(r, 2000))

  return { success: true }
}

export const addPaymentForTenant = async (tenantId, month, amount, dueDate) => {
  const { data, error } = await supabase
    .from('payments')
    .insert([{
      tenant_id: tenantId,
      month,
      amount,
      status: 'Due',
      due_date: dueDate
    }])
    .select()
    .single()
  if (error) throw error
  return data
}

export const getAllDisputesForOwner = async () => {
  const { data, error } = await supabase
    .from('disputes')
    .select('*, tenants(name, unit, email)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export const updateDisputeStatus = async (disputeId, status, response) => {
  const { data, error } = await supabase
    .from('disputes')
    .update({ status, owner_response: response })
    .eq('id', disputeId)
    .select()
    .single()
  if (error) throw error
  return data
}

export const getAllMaintenanceForOwner = async () => {
  const { data, error } = await supabase
    .from('maintenance_requests')
    .select('*, tenants(name, unit, email)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export const updateMaintenanceStatus = async (id, status) => {
  const { data, error } = await supabase
    .from('maintenance_requests')
    .update({ status })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}
