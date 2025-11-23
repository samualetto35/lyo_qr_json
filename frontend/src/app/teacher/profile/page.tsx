'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { authService } from '@/lib/auth'
import api from '@/lib/api'
import { useTeacherTheme } from '@/contexts/teacher-theme.context'
import { TeacherThemeSwitcher } from '@/components/ui/teacher-theme-switcher'
import Link from 'next/link'

export default function TeacherProfilePage() {
  const router = useRouter()
  const { theme } = useTeacherTheme()
  const [user, setUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const currentUser = authService.getUser()
    setUser(currentUser)
    
    if (!currentUser || currentUser.role !== 'teacher') {
      router.push('/login/teacher')
    }
  }, [router])

  const { data: profile, isLoading } = useQuery({
    queryKey: ['teacher-profile'],
    queryFn: async () => {
      const response = await api.get('/teacher/me')
      return response.data
    },
    enabled: !!user,
  })

  const handleLogout = () => {
    authService.logout()
    router.push('/login/teacher')
  }

  if (!mounted || !user) return null

  return (
    <div className={`min-h-screen ${theme === 't2' ? 'bg-[#FAFAFA]' : 'bg-gray-100'}`}>
      {/* Header */}
      <header className={theme === 't2' ? 'bg-transparent' : 'bg-white shadow'}>
        <div className={`${theme === 't2' ? 'max-w-5xl' : 'max-w-7xl'} mx-auto px-4 sm:px-6 lg:px-8 ${theme === 't2' ? 'py-4' : 'py-4'} flex flex-row justify-between items-center`}>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className={`${theme === 't2' ? 'text-[24px] font-semibold text-gray-900' : 'text-2xl font-bold text-gray-900'}`}>
                {theme === 't2' ? 'Akademisyen Portalı' : 'Teacher Dashboard'}
              </h1>
              <div className="hidden md:block">
                <TeacherThemeSwitcher />
              </div>
            </div>
            <p className={`${theme === 't2' ? 'text-xs text-gray-400 font-normal' : 'text-sm text-gray-600'}`}>
              {theme === 't2' ? (
                <>Hoşgeldiniz, {user.first_name || 'Öğretmen'} {user.last_name || ''}</>
              ) : (
                <>Welcome, {user.first_name || 'Teacher'} {user.last_name || ''}</>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="md:hidden">
              <TeacherThemeSwitcher />
            </div>
            <button
              onClick={handleLogout}
              className={theme === 't2' 
                ? 'px-3 py-1.5 text-xs font-normal text-[#D96A6A] bg-white border border-[#D96A6A] rounded-full shadow-[0px_4px_40px_rgba(0,0,0,0.06)] hover:bg-gray-50 transition-colors'
                : 'px-4 py-2 text-sm text-gray-700 hover:text-gray-900'
              }
            >
              {theme === 't2' ? 'Çıkış Yap' : 'Logout'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 ${theme === 't2' ? 'pt-4 pb-12 sm:pb-16' : 'py-8'}`}>
        {/* Back Button */}
        {theme === 't2' && (
          <Link
            href="/teacher/dashboard"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Geri Git
          </Link>
        )}

        {/* Title */}
        <h2 className={`${theme === 't2' ? 'text-[28px] font-semibold text-gray-900 mb-6' : 'text-2xl font-bold text-gray-900 mb-6'}`}>
          {theme === 't2' ? 'Profilim' : 'My Profile'}
        </h2>

        {isLoading ? (
          <div className="text-center py-12">{theme === 't2' ? 'Yükleniyor...' : 'Loading...'}</div>
        ) : (
          <div className={`${theme === 't2' ? 'bg-white rounded-2xl shadow-[0px_4px_40px_rgba(0,0,0,0.06)]' : 'bg-white rounded-lg shadow'} overflow-hidden`}>
            <div className={`px-6 py-4 ${theme === 't2' ? 'bg-gray-900 text-white' : 'bg-primary-600 text-white'}`}>
              <h2 className="text-xl font-semibold">
                {theme === 't2' ? 'Öğretmen Bilgileri' : 'Teacher Information'}
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className={`grid ${theme === 't2' ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-3'} gap-4`}>
                  <div className="text-sm font-medium text-gray-500">{theme === 't2' ? 'E-posta:' : 'Email:'}</div>
                  <div className={`${theme === 't2' ? 'col-span-1 sm:col-span-2' : 'col-span-2'} text-sm text-gray-900`}>{profile?.email}</div>
                </div>
                <div className={`grid ${theme === 't2' ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-3'} gap-4`}>
                  <div className="text-sm font-medium text-gray-500">{theme === 't2' ? 'Ad:' : 'First Name:'}</div>
                  <div className={`${theme === 't2' ? 'col-span-1 sm:col-span-2' : 'col-span-2'} text-sm text-gray-900`}>{profile?.first_name}</div>
                </div>
                <div className={`grid ${theme === 't2' ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-3'} gap-4`}>
                  <div className="text-sm font-medium text-gray-500">{theme === 't2' ? 'Soyad:' : 'Last Name:'}</div>
                  <div className={`${theme === 't2' ? 'col-span-1 sm:col-span-2' : 'col-span-2'} text-sm text-gray-900`}>{profile?.last_name}</div>
                </div>
                <div className={`grid ${theme === 't2' ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-3'} gap-4`}>
                  <div className="text-sm font-medium text-gray-500">{theme === 't2' ? 'Ders Sayısı:' : 'Number of Courses:'}</div>
                  <div className={`${theme === 't2' ? 'col-span-1 sm:col-span-2' : 'col-span-2'} text-sm text-gray-900`}>{profile?.courses_count}</div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold mb-4">{theme === 't2' ? 'Hızlı Bağlantılar' : 'Quick Links'}</h3>
                <div className="space-y-2">
                  <Link
                    href="/teacher/courses"
                    className="block px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-md"
                  >
                    → {theme === 't2' ? 'Derslerim' : 'My Courses'}
                  </Link>
                  <Link
                    href="/teacher/dashboard"
                    className="block px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-md"
                  >
                    → {theme === 't2' ? 'Ana Sayfa' : 'Dashboard'}
                  </Link>
                </div>
              </div>

              <div className="mt-8 p-4 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>{theme === 't2' ? 'Not:' : 'Note:'}</strong> {theme === 't2' ? 'Profil bilgilerinizi güncellemek için lütfen sistem yöneticinizle iletişime geçin.' : 'To update your profile information, please contact your system administrator.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

