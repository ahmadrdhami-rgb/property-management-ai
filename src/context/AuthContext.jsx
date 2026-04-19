import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../services/supabase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const timeout = setTimeout(() => {
      if (mounted) setLoading(false)
    }, 4000)

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timeout)
      if (!mounted) return
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchTenant(session.user.email, session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchTenant(session.user.email, session.user.id)
      } else {
        setTenant(null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      clearTimeout(timeout)
      listener.subscription.unsubscribe()
    }
  }, [])

  const fetchTenant = async (email, userId) => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('email', email)
        .maybeSingle()
        
      if (error) throw error
        
      if (data) {
        setTenant(data)
      } else {
        setTenant({
          id: userId,
          name: email.split('@')[0],
          unit: 'Not Assigned',
          email: email,
          phone: ''
        })
      }
    } catch (err) {
      console.error('Fetch tenant error:', err)
      setTenant({ id: userId, email })
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setTenant(null)
  }

  return (
    <AuthContext.Provider value={{ user, tenant, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
