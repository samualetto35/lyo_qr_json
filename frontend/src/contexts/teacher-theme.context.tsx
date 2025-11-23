'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type TeacherTheme = 't1' | 't2'

interface TeacherThemeContextType {
  theme: TeacherTheme
  setTheme: (theme: TeacherTheme) => void
}

const TeacherThemeContext = createContext<TeacherThemeContextType | undefined>(undefined)

export function TeacherThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<TeacherTheme>('t1')

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('teacher-theme') as TeacherTheme
    if (savedTheme && (savedTheme === 't1' || savedTheme === 't2')) {
      setThemeState(savedTheme)
    }
  }, [])

  const setTheme = (newTheme: TeacherTheme) => {
    setThemeState(newTheme)
    localStorage.setItem('teacher-theme', newTheme)
  }

  return (
    <TeacherThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </TeacherThemeContext.Provider>
  )
}

export function useTeacherTheme() {
  const context = useContext(TeacherThemeContext)
  if (context === undefined) {
    throw new Error('useTeacherTheme must be used within a TeacherThemeProvider')
  }
  return context
}

