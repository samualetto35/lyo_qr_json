'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/auth'
import { useTeacherTheme } from '@/contexts/teacher-theme.context'
import { TeacherThemeSwitcher } from '@/components/ui/teacher-theme-switcher'
import Link from 'next/link'

export default function TeacherDashboardPage() {
  const router = useRouter()
  const { theme } = useTeacherTheme()
  const [user, setUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Wait a bit for cookies to be available after redirect
    const checkAuth = () => {
      const currentUser = authService.getUser()
      
      if (currentUser && currentUser.role === 'teacher') {
        setUser(currentUser)
      } else {
        // If no user found, check token to see if it's still loading
        const token = authService.isAuthenticated()
        if (!token) {
          router.push('/login/teacher')
        } else {
          // Token exists but user not parsed yet, retry after a moment
          setTimeout(() => {
            const retryUser = authService.getUser()
            if (retryUser && retryUser.role === 'teacher') {
              setUser(retryUser)
            } else {
              router.push('/login/teacher')
            }
          }, 200)
        }
      }
    }
    
    // Check immediately and also after a short delay
    checkAuth()
    const timeout = setTimeout(checkAuth, 300)
    
    return () => clearTimeout(timeout)
  }, [router])

  const handleLogout = () => {
    authService.logout()
    router.push('/login/teacher')
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
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${theme === 't2' ? 'pt-0 pb-12 sm:pb-16' : 'py-8'}`}>
        {theme === 't2' ? (
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Main Hero Card - My Courses */}
            <Link href="/teacher/courses">
              <div className="group relative overflow-hidden bg-[#E3E3E3] rounded-3xl shadow-[0px_4px_40px_rgba(0,0,0,0.06)] cursor-pointer transition-all duration-300 hover:shadow-[0px_8px_60px_rgba(0,0,0,0.08)]">
                {/* Background Image */}
                <div
                  className="w-full h-[280px] sm:h-[360px] bg-cover bg-center"
                  style={{ backgroundImage: 'url(/a_clean_minimal_ui_button_background_representing_my_courses_for_an_educational_platform_include_su_bgatak3m9cznbbsp0xhs_0.png)' }}
                ></div>

                {/* Gradient Overlay */}
                <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-t from-black/45 via-black/30 to-transparent backdrop-blur-[25px] flex flex-col justify-end pb-3 pt-8 px-6 sm:pb-4 sm:p-8">
                  <h2 className="text-[18px] sm:text-[20px] font-semibold text-white mb-2">
                    Derslerim
                  </h2>
                  <p className="text-[13px] sm:text-[14px] text-white/70 leading-relaxed max-w-2xl">
                    Derslerinizi görüntüleyin ve yönetin
                  </p>
                </div>
              </div>
            </Link>

            {/* Second Row Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Start Attendance Card */}
              <Link href="/teacher/courses">
                <div className="group relative overflow-hidden bg-[#E3E3E3] rounded-3xl shadow-[0px_4px_40px_rgba(0,0,0,0.06)] cursor-pointer transition-all duration-300 hover:shadow-[0px_8px_60px_rgba(0,0,0,0.08)]">
                  <div
                    className="w-full h-[180px] bg-cover bg-center"
                    style={{ backgroundImage: 'url(/a_sleek_action-oriented_ui_button_background_for_a_start_attendance_session_feature_in_a_school_man_bs8phopy1q8sf1wk7zqr_1.png)' }}
                  ></div>
                  <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-t from-black/45 via-black/30 to-transparent backdrop-blur-[25px] flex flex-col justify-end pb-3 pt-6 px-6 sm:pb-4 sm:p-8">
                    <h3 className="text-[17px] sm:text-[18px] font-semibold text-white mb-2">
                      Yoklama Başlat
                    </h3>
                    <p className="text-[12px] sm:text-[13px] text-white/70 leading-relaxed">
                      Yeni bir QR yoklama oturumu oluşturun
                    </p>
                  </div>
                </div>
              </Link>

              {/* Profile Card */}
              <Link href="/teacher/profile">
                <div className="group relative overflow-hidden bg-[#E3E3E3] rounded-3xl shadow-[0px_4px_40px_rgba(0,0,0,0.06)] cursor-pointer transition-all duration-300 hover:shadow-[0px_8px_60px_rgba(0,0,0,0.08)]">
                  <div
                    className="w-full h-[180px] bg-cover bg-center"
                    style={{ backgroundImage: 'url(/a_sleek_minimal_ui_button_background_representing_profile_for_an_educational_or_admin_dashboard_inc_eypp2nbtptjfv8vi7v5v_2.png)' }}
                  ></div>
                  <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-t from-black/45 via-black/30 to-transparent backdrop-blur-[25px] flex flex-col justify-end pb-3 pt-6 px-6 sm:pb-4 sm:p-8">
                    <h3 className="text-[17px] sm:text-[18px] font-semibold text-white mb-2">
                      Profil
                    </h3>
                    <p className="text-[12px] sm:text-[13px] text-white/70 leading-relaxed">
                      Profil bilgilerinizi görüntüleyin
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* My Courses Card */}
              <Link href="/teacher/courses">
                <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">My Courses</h3>
                  <p className="text-sm text-gray-600">
                    View and manage your courses
                  </p>
                </div>
              </Link>

              {/* Start Attendance Card */}
              <Link href="/teacher/courses">
                <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer bg-primary-50">
                  <h3 className="text-lg font-semibold text-primary-900 mb-2">
                    Start Attendance Session
                  </h3>
                  <p className="text-sm text-primary-700">
                    Create a new QR attendance session
                  </p>
                </div>
              </Link>

              {/* Profile Card */}
              <Link href="/teacher/profile">
                <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile</h3>
                  <p className="text-sm text-gray-600">
                    View your profile information
                  </p>
                </div>
              </Link>
            </div>

            {/* Quick Info */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Quick Guide</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                <li>Go to "My Courses" to view your courses</li>
                <li>Select a course and click "Start Attendance Session"</li>
                <li>Display the generated QR code to your students</li>
                <li>Students scan and enter their Student ID</li>
                <li>View real-time attendance submissions</li>
              </ol>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

