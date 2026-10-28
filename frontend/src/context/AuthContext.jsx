/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import { authApi, clearTokens, getApiError, setTokens } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const restoreSession = async () => {
      if (!localStorage.getItem('seatlock_access_token')) {
        setLoading(false)
        return
      }
      try {
        const response = await authApi.me()
        setUser(response.data.user)
      } catch {
        clearTokens()
      } finally {
        setLoading(false)
      }
    }
    restoreSession()
  }, [])

  const login = async (credentials) => {
    const response = await authApi.login(credentials)
    setTokens(response.data)
    setUser(response.data.user)
    return response.data.user
  }

  const register = async (payload) => {
    await authApi.register(payload)
    return login({ email: payload.email, password: payload.password })
  }

  const logout = async () => {
    const refreshToken = localStorage.getItem('seatlock_refresh_token')
    try {
      if (refreshToken) await authApi.logout(refreshToken)
    } finally {
      clearTokens()
      setUser(null)
    }
  }

  const role = user?.role || 'USER'

  return (
    <AuthContext.Provider value={{ user, role, isAdmin: role === 'ADMIN', loading, isAuthenticated: Boolean(user), login, register, logout, getApiError }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
