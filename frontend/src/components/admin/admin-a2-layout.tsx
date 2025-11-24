'use client'

import Link from 'next/link'
import { ReactNode, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { AdminThemeSwitcher } from '@/components/ui/admin-theme-switcher'
import { useAdminTheme } from '@/contexts/admin-theme.context'
import { authService } from '@/lib/auth'
import clsx from 'clsx'

type AdminNavKey =
  | 'dashboard'
  | 'students'
  | 'attendance'
  | 'teachers'
  | 'courses'
  | 'imports'
  | 'health'
  | 'settings'

const navItems: { key: AdminNavKey; label: string; href: string }[] = [
  { key: 'dashboard', label: 'Dashboard', href: '/admin/dashboard' },
  { key: 'students', label: 'Öğrenciler', href: '/admin/students' },
  { key: 'attendance', label: 'Yoklamalar', href: '/admin/attendance' },
  { key: 'teachers', label: 'Öğretmenler', href: '/admin/teachers' },
  { key: 'courses', label: 'Dersler', href: '/admin/courses' },
  { key: 'imports', label: 'Öğrenci Ekle', href: '/admin/imports' },
  { key: 'health', label: 'Sağlık', href: '/admin/health-system' },
  { key: 'settings', label: 'Ayarlar', href: '/admin/settings' },
]

interface AdminA2LayoutProps {
  children: ReactNode
  user: any
  onLogout?: () => void
}

export function AdminA2Layout({ children, user, onLogout }: AdminA2LayoutProps) {
  const pathname = usePathname()
  const { theme } = useAdminTheme()
  const navRef = useRef<HTMLUListElement | null>(null)

  const activeKey =
    navItems.find((item) => pathname.startsWith(item.href))?.key ?? 'dashboard'

  if (theme !== 'a2') {
    return <>{children}</>
  }

  const handleLogout = () => {
    if (onLogout) {
      onLogout()
      return
    }
    authService.logout()
  }

  useEffect(() => {
    const nav = navRef.current
    if (!nav) return

    const stored = sessionStorage.getItem('admin-nav-scroll')
    if (stored) {
      nav.scrollLeft = Number(stored)
    }

    const handleScroll = () => {
      sessionStorage.setItem('admin-nav-scroll', String(nav.scrollLeft))
    }

    nav.addEventListener('scroll', handleScroll)
    return () => {
      nav.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#F3F5F7] text-gray-900">
      <header className="bg-[#F3F5F7]">
        <div className="max-w-6xl mx-auto px-4 lg:px-0 py-6 flex flex-wrap items-center gap-4 justify-between">
          <div className="flex-1 min-w-[220px]">
            <p className="text-[13px] uppercase tracking-[0.2em] text-gray-400">
              Admin Portalı
            </p>
            <p className="text-2xl font-semibold text-gray-900 mt-1 flex items-center gap-2">
              Hoşgeldin, {user?.first_name || 'Admin'}
              <span role="img" aria-label="wave">
                👋
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <AdminThemeSwitcher />
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-[#D9534F] border border-[#F3C1BE] rounded-full hover:bg-[#FFF4F3] transition whitespace-nowrap"
            >
              Çıkış Yap
            </button>
          </div>
        </div>

        <nav>
          <div className="max-w-6xl mx-auto px-4 lg:px-0 pt-2">
            <ul
              ref={navRef}
              className="flex overflow-x-auto gap-2 text-sm font-medium text-gray-500 scroll-smooth"
            >
              {navItems.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className={clsx(
                      'inline-flex items-center px-4 py-3 rounded-full whitespace-nowrap transition',
                      activeKey === item.key
                        ? 'bg-gray-900 text-white'
                        : 'hover:text-gray-900'
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 lg:px-0 py-10">{children}</main>
    </div>
  )
}


