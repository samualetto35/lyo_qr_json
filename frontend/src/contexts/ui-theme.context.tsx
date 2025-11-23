'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type UITheme = 'l1' | 'l2'

interface UIThemeContextType {
  theme: UITheme
  setTheme: (theme: UITheme) => void
}

const UIThemeContext = createContext<UIThemeContextType | undefined>(undefined)

export function UIThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<UITheme>('l1')

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('ui-theme') as UITheme
    if (savedTheme && (savedTheme === 'l1' || savedTheme === 'l2')) {
      setThemeState(savedTheme)
    }
  }, [])

  const setTheme = (newTheme: UITheme) => {
    setThemeState(newTheme)
    localStorage.setItem('ui-theme', newTheme)
  }

  return (
    <UIThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </UIThemeContext.Provider>
  )
}

export function useUITheme() {
  const context = useContext(UIThemeContext)
  if (context === undefined) {
    throw new Error('useUITheme must be used within a UIThemeProvider')
  }
  return context
}

