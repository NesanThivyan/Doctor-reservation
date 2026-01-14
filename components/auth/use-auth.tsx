"use client"

import { createContext, useContext, useEffect, useState } from "react"

export interface User {
  id: string
  email: string
  name: string
}

interface AuthContextType {
  user: User | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signOut: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("medibook-user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem("medibook-user")
      }
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (data.success && data.user) {
        setUser(data.user)
        localStorage.setItem("medibook-user", JSON.stringify(data.user))
      } else {
        throw new Error(data.error || "Sign in failed")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      })

      const data = await response.json()

      if (data.success && data.user) {
        setUser(data.user)
        localStorage.setItem("medibook-user", JSON.stringify(data.user))
      } else {
        throw new Error(data.error || "Sign up failed")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = () => {
    setUser(null)
    localStorage.removeItem("medibook-user")
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
