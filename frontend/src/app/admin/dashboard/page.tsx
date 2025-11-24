'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { authService } from '@/lib/auth'
import api from '@/lib/api'
import Link from 'next/link'
import { useAdminTheme } from '@/contexts/admin-theme.context'
import { AdminA2Layout } from '@/components/admin/admin-a2-layout'

export default function AdminDashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const { theme } = useAdminTheme()

  useEffect(() => {
    setMounted(true)
    
    // Wait a bit for cookies to be available after redirect
    const checkAuth = () => {
      const currentUser = authService.getUser()
      
      if (currentUser && currentUser.role === 'admin') {
        setUser(currentUser)
      } else {
        // If no user found, check token to see if it's still loading
        const token = authService.isAuthenticated()
        if (!token) {
          router.push('/login/admin')
        } else {
          // Token exists but user not parsed yet, retry after a moment
          setTimeout(() => {
            const retryUser = authService.getUser()
            if (retryUser && retryUser.role === 'admin') {
              setUser(retryUser)
            } else {
              router.push('/login/admin')
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

  // Fetch dashboard data - MUST be called before any conditional returns
  const { data: studentsData } = useQuery({
    queryKey: ['dashboard-students'],
    queryFn: async () => {
      const response = await api.get('/admin/students', { params: { page: 1, limit: 1 } })
      return response.data
    },
    enabled: !!user && theme === 'a2',
  })

  const { data: teachersData } = useQuery({
    queryKey: ['dashboard-teachers'],
    queryFn: async () => {
      const response = await api.get('/admin/teachers', { params: { page: 1, limit: 1 } })
      return response.data
    },
    enabled: !!user && theme === 'a2',
  })

  const { data: coursesData } = useQuery({
    queryKey: ['dashboard-courses'],
    queryFn: async () => {
      const response = await api.get('/admin/courses', { params: { page: 1, limit: 100 } })
      return response.data
    },
    enabled: !!user && theme === 'a2',
  })

  const { data: attendanceData } = useQuery({
    queryKey: ['dashboard-attendance'],
    queryFn: async () => {
      const response = await api.get('/admin/attendance/sessions', { params: { page: 1, limit: 100 } })
      return response.data
    },
    enabled: !!user && theme === 'a2',
  })

  const { data: doctorsData } = useQuery({
    queryKey: ['dashboard-doctors'],
    queryFn: async () => {
      const response = await api.get('/admin/doctors')
      return response.data
    },
    enabled: !!user && theme === 'a2',
  })

  const { data: reportsData } = useQuery({
    queryKey: ['dashboard-reports'],
    queryFn: async () => {
      const response = await api.get('/admin/health-system/reports')
      return response.data
    },
    enabled: !!user && theme === 'a2',
  })

  // Calculate stats - MUST be called before any conditional returns
  const stats = useMemo(() => {
    const totalStudents = studentsData?.total || 0
    const totalTeachers = teachersData?.total || 0
    const totalCourses = coursesData?.total || 0
    const totalSessions = attendanceData?.total || 0
    const totalDoctors = doctorsData?.data?.length || 0
    const totalReports = Array.isArray(reportsData) ? reportsData.length : 0

    // Calculate attendance rate from sessions
    const closedSessions = attendanceData?.data?.filter((s: any) => s.status === 'closed') || []
    const totalAttendanceRecords = closedSessions.reduce((sum: number, session: any) => {
      return sum + (session.attendance_count || 0)
    }, 0)
    const totalExpected = closedSessions.reduce((sum: number, session: any) => {
      return sum + (session.expected_count || 0)
    }, 0)
    const overallAttendanceRate = totalExpected > 0 
      ? Math.round((totalAttendanceRecords / totalExpected) * 100) 
      : 0

    // Get recent sessions
    const recentSessions = (attendanceData?.data || [])
      .slice(0, 5)
      .map((s: any) => ({
        id: s.id,
        course: s.course?.name || 'Bilinmeyen',
        date: s.session_date,
        status: s.status,
        attendance: s.attendance_count || 0,
        expected: s.expected_count || 0,
      }))

    // Course distribution
    const courseDistribution = (coursesData?.data || []).slice(0, 5).map((c: any) => ({
      name: c.name,
      code: c.code,
      students: c.enrollments_count || 0,
    }))

    return {
      totalStudents,
      totalTeachers,
      totalCourses,
      totalSessions,
      totalDoctors,
      totalReports,
      overallAttendanceRate,
      recentSessions,
      courseDistribution,
    }
  }, [studentsData, teachersData, coursesData, attendanceData, doctorsData, reportsData])

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!user) return null

  const handleLogout = () => {
    authService.logout()
    router.push('/login/admin')
  }

  const legacyContent = (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-600">
              Welcome, {user.first_name} {user.last_name}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Teachers Card */}
          <Link href="/admin/teachers">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Teachers</h3>
              <p className="text-sm text-gray-600">
                Manage teacher accounts and permissions
              </p>
            </div>
          </Link>

          {/* Courses Card */}
          <Link href="/admin/courses">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Courses</h3>
              <p className="text-sm text-gray-600">
                Manage courses and assign teachers
              </p>
            </div>
          </Link>

          {/* Student Imports Card */}
          <Link href="/admin/imports">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Student Imports</h3>
              <p className="text-sm text-gray-600">
                Import and manage student rosters via CSV
              </p>
            </div>
          </Link>

          {/* Attendance Card */}
          <Link href="/admin/attendance">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Attendance</h3>
              <p className="text-sm text-gray-600">
                View attendance records across all courses
              </p>
            </div>
          </Link>

          {/* Fraud Signals Card */}
          <Link href="/admin/fraud-signals">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Fraud Signals</h3>
              <p className="text-sm text-gray-600">
                Review suspicious attendance activity
              </p>
            </div>
          </Link>

          {/* Students Card */}
          <Link href="/admin/students">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer bg-purple-50">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">👥 Students</h3>
              <p className="text-sm text-purple-700">
                View all students with course enrollments and absence stats
              </p>
            </div>
          </Link>

          {/* System Settings Card */}
          <Link href="/admin/settings">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">System Settings</h3>
              <p className="text-sm text-gray-600">
                Configure anti-fraud rules and limits
              </p>
            </div>
          </Link>

          {/* Audit Logs Card */}
          <Link href="/admin/audit-logs">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer bg-blue-50">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">📋 Audit Logs</h3>
              <p className="text-sm text-blue-700">
                View all teacher manual attendance actions
              </p>
            </div>
          </Link>

          {/* Doctors Card */}
          <Link href="/admin/doctors">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer bg-green-50">
              <h3 className="text-lg font-semibold text-green-900 mb-2">👨‍⚕️ Doctors</h3>
              <p className="text-sm text-green-700">
                Manage doctor accounts for medical reports
              </p>
            </div>
          </Link>

          {/* Health System Card */}
          <Link href="/admin/health-system">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer bg-yellow-50">
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">🏥 Health System</h3>
              <p className="text-sm text-yellow-700">
                Import students for health system
              </p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  )

  if (theme === 'a2') {
    return (
      <AdminA2Layout user={user} onLogout={handleLogout}>
        <section className="space-y-6">
          {/* Hero Section */}
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-8 shadow-lg border border-gray-700">
            <p className="text-sm uppercase tracking-[0.2em] text-gray-300">Genel Bakış</p>
            <h1 className="text-3xl font-semibold text-white mt-2">
              Hoş Geldiniz, {user?.first_name || 'Admin'}
            </h1>
            <p className="text-gray-300 mt-2">
              Sistemin genel durumunu ve istatistiklerini buradan takip edebilirsiniz.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Students Card */}
            <Link
              href="/admin/students"
              className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-6 border border-blue-200 hover:shadow-lg transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-blue-600 bg-blue-200 px-2 py-1 rounded-full">
                  Toplam
                </span>
              </div>
              <p className="text-sm text-blue-600 font-medium mb-1">Öğrenciler</p>
              <p className="text-3xl font-bold text-blue-900">{stats.totalStudents}</p>
              <p className="text-xs text-blue-600 mt-2">Aktif kayıtlar</p>
            </Link>

            {/* Teachers Card */}
            <Link
              href="/admin/teachers"
              className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-3xl p-6 border border-purple-200 hover:shadow-lg transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-purple-600 bg-purple-200 px-2 py-1 rounded-full">
                  Toplam
                </span>
              </div>
              <p className="text-sm text-purple-600 font-medium mb-1">Öğretmenler</p>
              <p className="text-3xl font-bold text-purple-900">{stats.totalTeachers}</p>
              <p className="text-xs text-purple-600 mt-2">Aktif hesaplar</p>
            </Link>

            {/* Courses Card */}
            <Link
              href="/admin/courses"
              className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-3xl p-6 border border-emerald-200 hover:shadow-lg transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-200 px-2 py-1 rounded-full">
                  Toplam
                </span>
              </div>
              <p className="text-sm text-emerald-600 font-medium mb-1">Dersler</p>
              <p className="text-3xl font-bold text-emerald-900">{stats.totalCourses}</p>
              <p className="text-xs text-emerald-600 mt-2">Aktif dersler</p>
            </Link>

            {/* Attendance Rate Card */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-3xl p-6 border border-amber-200 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-amber-600 bg-amber-200 px-2 py-1 rounded-full">
                  Ortalama
                </span>
              </div>
              <p className="text-sm text-amber-600 font-medium mb-1">Katılım Oranı</p>
              <p className="text-3xl font-bold text-amber-900">{stats.overallAttendanceRate}%</p>
              <p className="text-xs text-amber-600 mt-2">Tüm oturumlar</p>
            </div>
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Sessions Card */}
            <Link
              href="/admin/attendance"
              className="bg-white rounded-3xl p-6 border border-gray-100 hover:border-gray-200 transition shadow-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Yoklama Oturumları</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalSessions}</p>
                </div>
              </div>
            </Link>

            {/* Doctors Card */}
            <Link
              href="/admin/doctors"
              className="bg-white rounded-3xl p-6 border border-gray-100 hover:border-gray-200 transition shadow-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Doktorlar</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalDoctors}</p>
                </div>
              </div>
            </Link>

            {/* Reports Card */}
            <Link
              href="/admin/health-system/reports"
              className="bg-white rounded-3xl p-6 border border-gray-100 hover:border-gray-200 transition shadow-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Sağlık Raporları</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalReports}</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Charts and Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Course Distribution Chart */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <p className="text-sm uppercase tracking-[0.15em] text-gray-400 mb-4">Ders Dağılımı</p>
              <div className="space-y-4">
                {stats.courseDistribution.length > 0 ? (
                  stats.courseDistribution.map((course: any, idx: number) => {
                    const maxStudents = Math.max(...stats.courseDistribution.map((c: any) => c.students), 1)
                    const percentage = (course.students / maxStudents) * 100
                    return (
                      <div key={idx}>
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{course.name}</p>
                            <p className="text-xs text-gray-500">{course.code}</p>
                          </div>
                          <span className="text-sm font-semibold text-gray-700">{course.students} öğrenci</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">Henüz ders kaydı yok</p>
                )}
              </div>
            </div>

            {/* Recent Sessions */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm uppercase tracking-[0.15em] text-gray-400">Son Oturumlar</p>
                <Link href="/admin/attendance" className="text-xs text-gray-500 hover:text-gray-900">
                  Tümünü Gör →
                </Link>
              </div>
              <div className="space-y-3">
                {stats.recentSessions.length > 0 ? (
                  stats.recentSessions.map((session: any) => (
                    <Link
                      key={session.id}
                      href={`/admin/session-details/${session.id}`}
                      className="flex items-center justify-between p-3 rounded-2xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{session.course}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(session.date).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            session.status === 'closed'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {session.status === 'closed' ? 'Kapalı' : 'Açık'}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {session.attendance}/{session.expected}
                        </p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">Henüz oturum yok</p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <p className="text-sm uppercase tracking-[0.15em] text-gray-400 mb-4">Hızlı Erişim</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { title: 'Öğrenciler', href: '/admin/students', icon: '👥' },
                { title: 'Yoklamalar', href: '/admin/attendance', icon: '📊' },
                { title: 'Öğretmenler', href: '/admin/teachers', icon: '👨‍🏫' },
                { title: 'Dersler', href: '/admin/courses', icon: '📚' },
                { title: 'İçe Aktarma', href: '/admin/imports', icon: '📥' },
                { title: 'Doktorlar', href: '/admin/doctors', icon: '👨‍⚕️' },
                { title: 'Sağlık Sistemi', href: '/admin/health-system', icon: '🏥' },
                { title: 'Ayarlar', href: '/admin/settings', icon: '⚙️' },
              ].map((link) => (
              <Link
                  key={link.title}
                  href={link.href}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition text-center"
                >
                  <span className="text-2xl mb-2">{link.icon}</span>
                  <span className="text-sm font-medium text-gray-900">{link.title}</span>
              </Link>
            ))}
            </div>
          </div>
        </section>
      </AdminA2Layout>
    )
  }

  return legacyContent
}

