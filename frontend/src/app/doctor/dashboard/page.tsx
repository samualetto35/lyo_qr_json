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
    <div className={`min-h-screen ${theme === 'd2' ? 'bg-[#FAFAFA]' : 'bg-gray-100'}`}>
      {/* Header */}
      <header className={theme === 'd2' ? 'bg-transparent' : 'bg-white shadow'}>
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${theme === 'd2' ? 'py-4' : 'py-4'} flex flex-row justify-between items-center`}>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className={`${theme === 'd2' ? 'text-[24px] font-semibold text-gray-900' : 'text-2xl font-bold text-gray-900'}`}>
                {theme === 'd2' ? 'Doktor Paneli' : 'Doctor Portal'}
              </h1>
              <div className="hidden md:block">
                <DoctorThemeSwitcher />
              </div>
            </div>
            <p className={`${theme === 'd2' ? 'text-xs text-gray-400 font-normal' : 'text-sm text-gray-600'}`}>
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
                ? 'px-3 py-1.5 text-xs font-normal text-[#D96A6A] bg-white border border-[#D96A6A] rounded-full shadow-[0px_4px_40px_rgba(0,0,0,0.06)] hover:bg-gray-50 transition-colors'
                : 'px-4 py-2 text-sm text-gray-700 hover:text-gray-900'
              }
            >
              {theme === 'd2' ? 'Çıkış Yap' : 'Logout'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${theme === 'd2' ? 'pt-4 pb-12 sm:pb-16' : 'py-8'}`}>
        {theme === 'd2' ? (
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Main Hero Card - New Report */}
            <Link href="/doctor/reports/new">
              <div className="group relative overflow-hidden rounded-3xl shadow-[0px_4px_40px_rgba(0,0,0,0.06)] cursor-pointer transition-all duration-300 hover:shadow-[0px_8px_60px_rgba(0,0,0,0.08)]">
                {/* Background Image */}
                <div 
                  className="w-full h-[280px] sm:h-[360px] bg-cover bg-center"
                  style={{
                    backgroundImage: 'url(/a_clean_professional_and_minimal_ui_button_background_representing_medical_reports_for_a_modern_hea_ba7s6q4npyx617xaak5m_1.png)'
                  }}
                ></div>
                
                {/* Gradient Overlay */}
                <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-t from-black/45 via-black/30 to-transparent backdrop-blur-[25px] flex flex-col justify-end p-6 sm:p-8">
                  <h2 className="text-[18px] sm:text-[20px] font-semibold text-white mb-2">
                    Rapor Ekle +
                  </h2>
                  <p className="text-[13px] sm:text-[14px] text-white/70 leading-relaxed max-w-2xl">
                    Kayıtlı öğrenciyi ve tarihi seçerek veri tabanına yeni rapor ekleyin
                  </p>
                </div>
              </div>
            </Link>

            {/* Second Row - Two Equal Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Reports Card */}
              <Link href="/doctor/reports">
                <div className="group relative overflow-hidden rounded-3xl shadow-[0px_4px_40px_rgba(0,0,0,0.06)] cursor-pointer transition-all duration-300 hover:shadow-[0px_8px_60px_rgba(0,0,0,0.08)]">
                  {/* Background Image */}
                  <div 
                    className="w-full h-[200px] sm:h-[240px] bg-cover bg-center"
                    style={{
                      backgroundImage: 'url(/a_clean_professional_and_minimal_ui_button_background_representing_medical_reports_for_a_modern_hea_rpvdcjz05rqu3q85l9xc_3.png)'
                    }}
                  ></div>
                  
                  {/* Gradient Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-t from-black/45 via-black/30 to-transparent backdrop-blur-[25px] flex flex-col justify-end p-6 sm:p-8">
                    <h3 className="text-[17px] sm:text-[18px] font-semibold text-white mb-2">
                      Raporlar
                    </h3>
                    <p className="text-[12px] sm:text-[13px] text-white/70 leading-relaxed">
                      Raporları görüntüleyin
                    </p>
                  </div>
                </div>
              </Link>

              {/* Students Card */}
              <Link href="/doctor/students">
                <div className="group relative overflow-hidden rounded-3xl shadow-[0px_4px_40px_rgba(0,0,0,0.06)] cursor-pointer transition-all duration-300 hover:shadow-[0px_8px_60px_rgba(0,0,0,0.08)]">
                  {/* Background Image */}
                  <div 
                    className="w-full h-[200px] sm:h-[240px] bg-cover bg-center"
                    style={{
                      backgroundImage: 'url(/a_clean_modern_and_minimal_ui_button_background_representing_student_card_for_an_educational_manage_zyq4v27ejagysv634l6b_0.png)'
                    }}
                  ></div>
                  
                  {/* Gradient Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-t from-black/45 via-black/30 to-transparent backdrop-blur-[25px] flex flex-col justify-end p-6 sm:p-8">
                    <h3 className="text-[17px] sm:text-[18px] font-semibold text-white mb-2">
                      Öğrenciler
                    </h3>
                    <p className="text-[12px] sm:text-[13px] text-white/70 leading-relaxed">
                      Kayıtlı öğrencileri ve raporlarını görüntüleyin
                    </p>
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

