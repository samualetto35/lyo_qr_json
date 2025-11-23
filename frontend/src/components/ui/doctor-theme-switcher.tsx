'use client'

import { useDoctorTheme } from '@/contexts/doctor-theme.context'
import { Button } from '@/components/ui/button'

export function DoctorThemeSwitcher() {
  const { theme, setTheme } = useDoctorTheme()

  const toggleTheme = () => {
    setTheme(theme === 'd1' ? 'd2' : 'd1')
  }

  return (
    <Button
      onClick={toggleTheme}
      variant="outline"
      size="sm"
      className="text-xs px-2 py-1 h-7"
    >
      {theme === 'd1' ? 'D1' : 'D2'}
    </Button>
  )
}

