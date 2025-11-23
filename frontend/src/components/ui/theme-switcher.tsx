'use client'

import { useUITheme } from '@/contexts/ui-theme.context'
import { Button } from '@/components/ui/button'

export function ThemeSwitcher() {
  const { theme, setTheme } = useUITheme()

  const toggleTheme = () => {
    setTheme(theme === 'l1' ? 'l2' : 'l1')
  }

  return (
    <Button
      onClick={toggleTheme}
      variant="outline"
      size="sm"
      className="fixed top-4 right-4 z-50 text-xs px-2 py-1 h-7"
    >
      {theme === 'l1' ? 'L1' : 'L2'}
    </Button>
  )
}

