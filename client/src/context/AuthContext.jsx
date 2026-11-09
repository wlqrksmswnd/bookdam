/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import { api, tokenStore } from '../api/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(() => Boolean(tokenStore.get()))

  // 새로고침 시 저장된 토큰으로 로그인 상태 복원
  useEffect(() => {
    if (!tokenStore.get()) return
    api
      .me()
      .then((data) => setUser(data.user))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false))
  }, [])

  const handleAuth = ({ token, user }) => {
    tokenStore.set(token)
    setUser(user)
  }

  const value = {
    user,
    loading,
    login: async (form) => handleAuth(await api.login(form)),
    // 회원가입은 계정만 만들고 로그인 상태로 만들지 않음 (로그인 화면에서 다시 로그인)
    register: async (form) => {
      await api.register(form)
    },
    logout: () => {
      tokenStore.clear()
      setUser(null)
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
