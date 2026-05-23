'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

export interface User {
  id: string
  name: string
  email: string
  accountType: 'free' | 'gold'
  experience: string
  joinedDate: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string, experience: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const STORAGE_KEY = '5gm_gold_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setUser(JSON.parse(stored))
    } catch {}
    setIsLoading(false)
  }, [])

  const login = async (email: string, _password: string) => {
    await new Promise(r => setTimeout(r, 900))
    const mockUser: User = {
      id: 'usr_' + Math.random().toString(36).slice(2, 8),
      name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      email,
      accountType: 'free',
      experience: 'intermediate',
      joinedDate: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser))
    setUser(mockUser)
    router.push('/dashboard')
  }

  const signup = async (name: string, email: string, _password: string, experience: string) => {
    await new Promise(r => setTimeout(r, 1100))
    const mockUser: User = {
      id: 'usr_' + Math.random().toString(36).slice(2, 8),
      name,
      email,
      accountType: 'free',
      experience,
      joinedDate: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser))
    setUser(mockUser)
    router.push('/dashboard')
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
    router.push('/')
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
