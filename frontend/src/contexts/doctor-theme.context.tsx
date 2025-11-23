'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type DoctorTheme = 'd1' | 'd2'

interface DoctorThemeContextType {
  theme: DoctorTheme
  setTheme: (theme: DoctorTheme) => void
}

const DoctorThemeContext = createContext<DoctorThemeContextType | undefined>(undefined)

export function DoctorThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<DoctorTheme>('d1')

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('doctor-theme') as DoctorTheme
    if (savedTheme && (savedTheme === 'd1' || savedTheme === 'd2')) {
      setThemeState(savedTheme)
    }
  }, [])

  const setTheme = (newTheme: DoctorTheme) => {
    setThemeState(newTheme)
    localStorage.setItem('doctor-theme', newTheme)
  }

  return (
    <DoctorThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </DoctorThemeContext.Provider>
  )
}

export function useDoctorTheme() {
  const context = useContext(DoctorThemeContext)
  if (context === undefined) {
    throw new Error('useDoctorTheme must be used within a DoctorThemeProvider')
  }
  return context
}

