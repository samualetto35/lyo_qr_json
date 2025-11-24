'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type AdminTheme = 'a1' | 'a2'

interface AdminThemeContextType {
  theme: AdminTheme
  setTheme: (theme: AdminTheme) => void
}

const AdminThemeContext = createContext<AdminThemeContextType | undefined>(undefined)

export function AdminThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AdminTheme>('a2')

  useEffect(() => {
    // Always use a2 as default, no theme switching
    setThemeState('a2')
  }, [])

  const setTheme = (newTheme: AdminTheme) => {
    setThemeState(newTheme)
    localStorage.setItem('admin-theme', newTheme)
  }

  return (
    <AdminThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </AdminThemeContext.Provider>
  )
}

export function useAdminTheme() {
  const context = useContext(AdminThemeContext)
  if (!context) {
    throw new Error('useAdminTheme must be used within AdminThemeProvider')
  }
  return context
}


