'use client'

import { Button } from '@/components/ui/button'
import { useAdminTheme } from '@/contexts/admin-theme.context'

export function AdminThemeSwitcher() {
  const { theme, setTheme } = useAdminTheme()

  const toggle = () => {
    setTheme(theme === 'a1' ? 'a2' : 'a1')
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggle}
      className="h-8 px-3 text-xs rounded-full border-gray-300 text-gray-600"
    >
      {theme.toUpperCase()}
    </Button>
  )
}


