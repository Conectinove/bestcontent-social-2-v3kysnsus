import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'
import { UserProfile } from '@/types'
import { getErrorMessage, extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'

interface AuthContextType {
  user: UserProfile | null
  isAuthenticated: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<{ error: string | null }>
  register: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{ error: string | null; fieldErrors?: FieldErrors }>
  logout: () => void
  updateProfile: (data: Record<string, unknown>) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function mapUser(record: any): UserProfile {
  const avatar = record.avatar
    ? `${import.meta.env.VITE_POCKETBASE_URL}/api/files/${record.collectionId}/${record.id}/${record.avatar}`
    : `https://img.usecurling.com/ppl/medium?gender=male&seed=${record.id || 'ronaldo'}`
  return {
    id: record.id,
    name: record.name || 'Ronaldo Barreto',
    email: record.email || '',
    avatar,
    plan: 'Pro Plan',
    bio: record.bio || '',
    profession: record.profession || '',
    company: record.company || '',
    instagram: record.instagram || '',
    website: record.website || '',
    menu_layout: record.menu_layout || 'sidebar',
    app_color: record.app_color || 'purple',
    share_community: record.share_community ?? true,
    notif_app: record.notif_app ?? true,
    notif_email: record.notif_email ?? true,
    notif_push: record.notif_push ?? false,
    referral_code: record.referral_code || 'RONALDD89L',
    onboarding_completed: record.onboarding_completed ?? false,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() =>
    pb.authStore.isValid && pb.authStore.record ? mapUser(pb.authStore.record) : null,
  )
  const [isAuthenticated, setIsAuthenticated] = useState(pb.authStore.isValid)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((_token, record) => {
      if (pb.authStore.isValid && record) {
        setUser(mapUser(record))
      } else {
        setUser(null)
      }
      setIsAuthenticated(pb.authStore.isValid)
    })

    if (pb.authStore.isValid) {
      pb.collection('users')
        .authRefresh()
        .catch(() => pb.authStore.clear())
        .finally(() => setLoading(false))
    } else {
      if (pb.authStore.record) pb.authStore.clear()
      setLoading(false)
    }

    return () => {
      unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      await pb.collection('users').authWithPassword(email, password)
      return { error: null }
    } catch (err) {
      return { error: getErrorMessage(err) }
    }
  }

  const register = async (name: string, email: string, password: string) => {
    try {
      await pb.collection('users').create({ name, email, password, passwordConfirm: password })
      await pb.collection('users').authWithPassword(email, password)
      return { error: null }
    } catch (err) {
      return { error: getErrorMessage(err), fieldErrors: extractFieldErrors(err) }
    }
  }

  const logout = () => {
    pb.authStore.clear()
  }

  const updateProfile = async (data: Record<string, unknown>) => {
    if (!pb.authStore.record) return { error: 'Não autenticado' }
    try {
      const updated = await pb.collection('users').update(pb.authStore.record.id, data)
      pb.authStore.save(pb.authStore.token, updated)
      return { error: null }
    } catch (err) {
      return { error: getErrorMessage(err) }
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, loading, login, register, logout, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
