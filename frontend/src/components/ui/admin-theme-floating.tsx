'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { AdminThemeSwitcher } from '@/components/ui/admin-theme-switcher'
import { useAdminTheme } from '@/contexts/admin-theme.context'

export function AdminThemeFloatingToggle() {
  const pathname = usePathname()
  const { theme } = useAdminTheme()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) return null
  if (!pathname?.startsWith('/admin')) return null
  if (theme === 'a2') return null

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="rounded-full bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-lg border border-gray-200 px-2 py-1">
        <AdminThemeSwitcher />
      </div>
    </div>
  )
}


