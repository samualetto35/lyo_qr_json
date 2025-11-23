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
    <div className={`min-h-screen ${theme === 'd2' ? 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50' : 'bg-gray-100'}`}>
      {/* Header */}
      <header className={theme === 'd2' ? 'bg-white/80 backdrop-blur-sm border-b border-gray-200/50' : 'bg-white shadow'}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className={`${theme === 'd2' ? 'text-3xl font-light tracking-tight text-gray-800' : 'text-2xl font-bold text-gray-900'}`}>
                {theme === 'd2' ? 'Doktor Paneli' : 'Doctor Portal'}
              </h1>
              <div className="hidden md:block">
                <DoctorThemeSwitcher />
              </div>
            </div>
            <p className={`${theme === 'd2' ? 'text-gray-500 font-light' : 'text-sm text-gray-600'}`}>
              {theme === 'd2' ? (
                <>Merhaba, <span className="font-medium text-gray-700">{user.first_name} {user.last_name}</span></>
              ) : (
                <>Welcome, {user.first_name} {user.last_name}</>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="md:hidden">
              <DoctorThemeSwitcher />
            </div>
            <button
              onClick={handleLogout}
              className={theme === 'd2' 
                ? 'px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors'
                : 'px-4 py-2 text-sm text-gray-700 hover:text-gray-900'
              }
            >
              {theme === 'd2' ? 'Çıkış' : 'Logout'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${theme === 'd2' ? 'py-12' : 'py-8'}`}>
        {theme === 'd2' ? (
          <div className="space-y-6">
            {/* Hero Card - New Report */}
            <Link href="/doctor/reports/new">
              <div className="group relative overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-teal-700/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative p-8 sm:p-10 text-white">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-4xl mb-3">📝</div>
                      <h2 className="text-2xl sm:text-3xl font-semibold mb-2">Yeni Rapor Oluştur</h2>
                      <p className="text-emerald-50 text-sm sm:text-base">
                        Öğrenci için yeni bir tıbbi rapor ekleyin
                      </p>
                    </div>
                    <div className="hidden sm:block text-6xl opacity-20 group-hover:opacity-30 transition-opacity">+</div>
                  </div>
                </div>
              </div>
            </Link>

            {/* Secondary Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Reports Card */}
              <Link href="/doctor/reports">
                <div className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 overflow-hidden">
                  <div className="p-6 sm:p-8">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-2xl group-hover:bg-blue-200 transition-colors">
                        📊
                      </div>
                      <h3 className="text-xl sm:text-2xl font-semibold text-gray-800">Raporlar</h3>
                    </div>
                    <p className="text-gray-500 text-sm sm:text-base leading-relaxed">
                      Oluşturduğunuz tüm tıbbi raporları görüntüleyin ve yönetin
                    </p>
                    <div className="mt-6 flex items-center text-blue-600 text-sm font-medium group-hover:gap-2 transition-all">
                      Görüntüle
                      <span className="ml-2 group-hover:ml-3 transition-all">→</span>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Students Card */}
              <Link href="/doctor/students">
                <div className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 overflow-hidden">
                  <div className="p-6 sm:p-8">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center text-2xl group-hover:bg-purple-200 transition-colors">
                        👥
                      </div>
                      <h3 className="text-xl sm:text-2xl font-semibold text-gray-800">Öğrenciler</h3>
                    </div>
                    <p className="text-gray-500 text-sm sm:text-base leading-relaxed">
                      Sistemdeki tüm öğrencileri görüntüleyin ve arayın
                    </p>
                    <div className="mt-6 flex items-center text-purple-600 text-sm font-medium group-hover:gap-2 transition-all">
                      Görüntüle
                      <span className="ml-2 group-hover:ml-3 transition-all">→</span>
                    </div>
                  </div>
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

