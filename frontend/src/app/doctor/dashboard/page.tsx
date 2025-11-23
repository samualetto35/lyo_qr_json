'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/auth'
import { useDoctorTheme } from '@/contexts/doctor-theme.context'
import { DoctorThemeSwitcher } from '@/components/ui/doctor-theme-switcher'
import Link from 'next/link'

export default function DoctorDashboardPage() {
  const router = useRouter()
  const { theme } = useDoctorTheme()
  const [user, setUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const currentUser = authService.getUser()
    setUser(currentUser)
    
    if (!currentUser || currentUser.role !== 'doctor') {
      router.push('/login/doctor')
    }
  }, [router])

  const handleLogout = () => {
    authService.logout()
    router.push('/login/doctor')
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className={theme === 'd2' ? 'bg-transparent' : 'bg-white shadow'}>
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center ${theme === 'd2' ? 'border-b-0' : ''}`}>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {theme === 'd2' ? 'Doktor Portalı' : 'Doctor Portal'}
              </h1>
              <div className="hidden md:block">
                <DoctorThemeSwitcher />
              </div>
            </div>
            <p className="text-sm text-gray-600">
              {theme === 'd2' ? (
                <>Hoşgeldiniz, {user.first_name} {user.last_name}</>
              ) : (
                <>Welcome, {user.first_name} {user.last_name}</>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="md:hidden">
              <DoctorThemeSwitcher />
            </div>
            <button
              onClick={handleLogout}
              className={theme === 'd2' 
                ? 'px-6 py-2 text-sm font-medium text-red-600 border-2 border-red-600 rounded-full hover:bg-red-50 transition bg-transparent'
                : 'px-4 py-2 text-sm text-gray-700 hover:text-gray-900'
              }
            >
              {theme === 'd2' ? 'Çıkış Yap' : 'Logout'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {theme === 'd2' ? (
          <div className="space-y-4">
            {/* First Row - Full Width New Report Button */}
            <Link href="/doctor/reports/new">
              <div className="bg-green-500 hover:bg-green-600 rounded-xl shadow-lg p-8 hover:shadow-xl transition cursor-pointer text-white">
                <h3 className="text-2xl font-bold mb-2">➕ Yeni Rapor Ekle</h3>
                <p className="text-green-50">
                  Öğrenci için yeni bir tıbbi rapor ekleyin
                </p>
              </div>
            </Link>

            {/* Second Row - Two Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Reports Card */}
              <Link href="/doctor/reports">
                <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition cursor-pointer border-2 border-blue-200 hover:border-blue-400">
                  <h3 className="text-2xl font-bold text-blue-900 mb-2">📋 Raporlar</h3>
                  <p className="text-sm text-blue-700">
                    Tüm tıbbi raporları görüntüleyin
                  </p>
                </div>
              </Link>

              {/* Students Card */}
              <Link href="/doctor/students">
                <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition cursor-pointer border-2 border-purple-200 hover:border-purple-400">
                  <h3 className="text-2xl font-bold text-purple-900 mb-2">👥 Öğrenciler</h3>
                  <p className="text-sm text-purple-700">
                    Tüm sağlık sistemi öğrencilerini görüntüleyin
                  </p>
                </div>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* New Report Card */}
            <Link href="/doctor/reports/new">
              <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer bg-green-50">
                <h3 className="text-lg font-semibold text-green-900 mb-2">➕ New Report</h3>
                <p className="text-sm text-green-700">
                  Add a new medical report for a student
                </p>
              </div>
            </Link>

            {/* Reports Card */}
            <Link href="/doctor/reports">
              <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer bg-blue-50">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">📋 Reports</h3>
                <p className="text-sm text-blue-700">
                  View all medical reports
                </p>
              </div>
            </Link>

            {/* Students Card */}
            <Link href="/doctor/students">
              <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer bg-purple-50">
                <h3 className="text-lg font-semibold text-purple-900 mb-2">👥 Students</h3>
                <p className="text-sm text-purple-700">
                  View all health system students
                </p>
              </div>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}

