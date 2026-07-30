import { createContext, useContext, useState, ReactNode } from 'react'
import { UserProfile } from '@/types'
import { INITIAL_USER } from '@/lib/mock-data'

interface AuthContextType {
  user: UserProfile | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  updateProfile: (data: Partial<UserProfile>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('bestcontent_user')
    return saved ? JSON.parse(saved) : INITIAL_USER
  })

  const login = async (email: string) => {
    const loggedUser: UserProfile = {
      ...INITIAL_USER,
      email,
    }
    setUser(loggedUser)
    localStorage.setItem('bestcontent_user', JSON.stringify(loggedUser))
    return true
  }

  const register = async (name: string, email: string) => {
    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      name,
      email,
      avatar: `https://img.usecurling.com/ppl/medium?gender=female&seed=${Date.now()}`,
      plan: 'Pro Plan',
    }
    setUser(newUser)
    localStorage.setItem('bestcontent_user', JSON.stringify(newUser))
    return true
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('bestcontent_user')
  }

  const updateProfile = (data: Partial<UserProfile>) => {
    if (!user) return
    const updated = { ...user, ...data }
    setUser(updated)
    localStorage.setItem('bestcontent_user', JSON.stringify(updated))
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateProfile,
      }}
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
