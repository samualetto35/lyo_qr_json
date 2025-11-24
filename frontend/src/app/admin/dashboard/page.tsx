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
    
    const checkAuth = () => {
      const currentUser = authService.getUser()
      
      if (currentUser && currentUser.role === 'admin') {
        setUser(currentUser)
      } else {
        const token = authService.isAuthenticated()
        if (!token) {
          router.push('/login/admin')
        } else {
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
    
    checkAuth()
    const timeout = setTimeout(checkAuth, 300)
    
    return () => clearTimeout(timeout)
  }, [router])

  // Fetch dashboard data
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
      const response = await api.get('/admin/teachers', { params: { page: 1, pageSize: 1 } })
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
      const response = await api.get('/admin/attendance-sessions', { params: { limit: 100 } })
      return response.data
    },
    enabled: !!user && theme === 'a2',
  })

  const { data: fraudData } = useQuery({
    queryKey: ['dashboard-fraud'],
    queryFn: async () => {
      try {
        const response = await api.get('/admin/fraud-signals')
        return response.data
      } catch {
        return []
      }
    },
    enabled: !!user && theme === 'a2',
  })

  // Calculate comprehensive stats
  const stats = useMemo(() => {
    const allSessions = Array.isArray(attendanceData) ? attendanceData : []
    const closedSessions = allSessions.filter((s: any) => !s.isOpen)
    const openSessions = allSessions.filter((s: any) => s.isOpen)

    // Today's sessions
    const todayDateStr = new Date().toISOString().split('T')[0]
    const todaySessions = allSessions.filter((s: any) => {
      const sessionDate = new Date(s.sessionDate || s.session_date).toISOString().split('T')[0]
      return sessionDate === todayDateStr
    })

    // Weekly trend (last 7 days)
    const today = new Date()
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      return date.toISOString().split('T')[0]
    }).reverse()

    const weeklyTrend = last7Days.map((date) => {
      const daySessions = allSessions.filter((s: any) => {
        const sessionDate = new Date(s.sessionDate || s.session_date).toISOString().split('T')[0]
        return sessionDate === date
      })
      return {
        date,
        count: daySessions.length,
        attendance: daySessions.reduce((sum: number, s: any) => sum + (s.attendance_count || 0), 0),
      }
    })

    // Monthly comparison
    const thisMonth = new Date().getMonth()
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1
    const thisMonthSessions = allSessions.filter((s: any) => {
      const date = new Date(s.sessionDate || s.session_date)
      return date.getMonth() === thisMonth
    })
    const lastMonthSessions = allSessions.filter((s: any) => {
      const date = new Date(s.sessionDate || s.session_date)
      return date.getMonth() === lastMonth
    })

    // Attendance calculations
    const totalAttendance = closedSessions.reduce((sum: number, s: any) => sum + (s.attendance_count || 0), 0)
    const totalExpected = closedSessions.reduce((sum: number, s: any) => {
      return sum + (s.expected_count || s.course?.enrollments?.length || 0)
    }, 0)
    const overallAttendanceRate = totalExpected > 0 
      ? Math.round((totalAttendance / totalExpected) * 100) 
      : 0

    // Top courses by activity
    const courseActivity = (coursesData?.data || []).map((course: any) => {
      const courseSessions = allSessions.filter((s: any) => s.course?.id === course.id || s.courseId === course.id)
      return {
        ...course,
        sessionCount: courseSessions.length,
        totalAttendance: courseSessions.reduce((sum: number, s: any) => sum + (s.attendance_count || 0), 0),
      }
    }).sort((a: any, b: any) => b.sessionCount - a.sessionCount).slice(0, 5)

    // Fraud signals trend
    const fraudSignals = fraudData?.data || []
    const recentFraud = fraudSignals.slice(0, 5)

    // Today's attendance distribution by hour
    const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => {
      const hourSessions = todaySessions.filter((s: any) => {
        const sessionTime = new Date(s.sessionDate || s.session_date || s.createdAt)
        return sessionTime.getHours() === hour
      })
      return {
        hour,
        count: hourSessions.length,
        attendance: hourSessions.reduce((sum: number, s: any) => sum + (s.attendance_count || 0), 0),
      }
    })

    return {
      totalStudents: studentsData?.total || 0,
      totalTeachers: teachersData?.meta?.total || 0,
      totalCourses: Array.isArray(coursesData) ? coursesData.length : 0,
      totalSessions: allSessions.length,
      openSessions: openSessions.length,
      closedSessions: closedSessions.length,
      todaySessions: todaySessions.length,
      overallAttendanceRate,
      totalAttendance,
      totalExpected,
      weeklyTrend,
      hourlyDistribution,
      courseActivity,
      recentFraud,
      fraudCount: Array.isArray(fraudData) ? fraudData.length : 0,
    }
  }, [studentsData, teachersData, coursesData, attendanceData, fraudData])

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400">Yükleniyor...</div>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/admin/teachers">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Teachers</h3>
              <p className="text-sm text-gray-600">Manage teacher accounts and permissions</p>
            </div>
          </Link>
          <Link href="/admin/courses">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Courses</h3>
              <p className="text-sm text-gray-600">Manage courses and assign teachers</p>
            </div>
          </Link>
          <Link href="/admin/imports">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Student Imports</h3>
              <p className="text-sm text-gray-600">Import and manage student rosters via CSV</p>
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
          {/* Welcome Header */}
          <div className="bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-3xl p-4 md:p-8 border border-gray-200">
            <p className="text-[10px] md:text-sm uppercase tracking-[0.2em] text-gray-400 mb-1 md:mb-2">Genel Bakış</p>
            <h1 className="text-lg md:text-3xl font-semibold text-gray-800">
              Hoş Geldiniz, {user?.first_name || 'Admin'}
            </h1>
            <p className="text-gray-600 mt-1 md:mt-2 text-[11px] md:text-sm">
              Sistem performansını ve önemli metrikleri buradan takip edebilirsiniz.
            </p>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2 md:gap-4">
            {/* Active Sessions */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-3 md:p-6 border border-blue-100">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-200 rounded-xl flex items-center justify-center">
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-[10px] md:text-xs font-medium text-blue-600 bg-blue-100 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full">
                  Canlı
                </span>
              </div>
              <p className="text-[10px] md:text-xs text-blue-600 mb-1">Açık</p>
              <p className="text-xl md:text-2xl font-bold text-blue-900">{stats.openSessions}</p>
              <p className="text-[10px] md:text-xs text-blue-500 mt-1">Toplam: {stats.totalSessions}</p>
            </div>

            {/* Attendance Rate */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-3 md:p-6 border border-emerald-100">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-200 rounded-xl flex items-center justify-center">
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className={`text-[10px] md:text-xs font-medium px-1.5 md:px-2 py-0.5 md:py-1 rounded-full ${
                  stats.overallAttendanceRate >= 80 ? 'text-emerald-600 bg-emerald-100' :
                  stats.overallAttendanceRate >= 60 ? 'text-amber-600 bg-amber-100' :
                  'text-rose-600 bg-rose-100'
                }`}>
                  {stats.overallAttendanceRate >= 80 ? 'İyi' : stats.overallAttendanceRate >= 60 ? 'Orta' : 'Düşük'}
                </span>
              </div>
              <p className="text-[10px] md:text-xs text-emerald-600 mb-1">Katılım</p>
              <p className="text-xl md:text-2xl font-bold text-emerald-900">{stats.overallAttendanceRate}%</p>
              <p className="text-[10px] md:text-xs text-emerald-500 mt-1">{stats.totalAttendance}/{stats.totalExpected}</p>
            </div>

            {/* Today's Sessions */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-3 md:p-6 border border-purple-100">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-200 rounded-xl flex items-center justify-center">
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-[10px] md:text-xs font-medium text-purple-600 bg-purple-100 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full">
                  Bugün
                </span>
              </div>
              <p className="text-[10px] md:text-xs text-purple-600 mb-1">Oturumlar</p>
              <p className="text-xl md:text-2xl font-bold text-purple-900">{stats.todaySessions}</p>
              <p className="text-[10px] md:text-xs text-purple-500 mt-1">Bu gün</p>
            </div>

            {/* Fraud Signals */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-3 md:p-6 border border-amber-100 col-span-3 md:col-span-1">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-amber-200 rounded-xl flex items-center justify-center">
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <span className="text-[10px] md:text-xs font-medium text-amber-600 bg-amber-100 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full">
                  Uyarı
                </span>
              </div>
              <div className="flex items-center justify-between md:block">
                <div className="md:mb-1">
                  <p className="text-[10px] md:text-xs text-amber-600 mb-1">Şüpheli Sinyaller</p>
                  <p className="text-xl md:text-2xl font-bold text-amber-900">{stats.fraudCount}</p>
                </div>
                <Link href="/admin/fraud-signals" className="text-[10px] md:text-xs text-amber-500 hover:underline md:block md:mt-1">
                  Detay →
                </Link>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Trend Chart */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <p className="text-sm uppercase tracking-[0.15em] text-gray-400 mb-4">Haftalık Trend</p>
              <div className="space-y-3">
                {stats.weeklyTrend.map((day: any, idx: number) => {
                  const maxCount = Math.max(...stats.weeklyTrend.map((d: any) => d.count), 1)
                  const percentage = (day.count / maxCount) * 100
                  const date = new Date(day.date)
                  const dayName = date.toLocaleDateString('tr-TR', { weekday: 'short' })
                  return (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">{dayName}</span>
                        <span className="text-xs font-medium text-gray-700">{day.count} oturum</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Hourly Distribution */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <p className="text-sm uppercase tracking-[0.15em] text-gray-400 mb-4">Bugünkü Saatlik Dağılım</p>
              {stats.hourlyDistribution.filter((h: any) => h.count > 0).length > 0 ? (
                <div className="relative">
                  <svg className="w-full h-48" viewBox="0 0 400 200" preserveAspectRatio="none">
                    {stats.hourlyDistribution
                      .filter((h: any) => h.count > 0)
                      .map((hour: any, idx: number, arr: any[]) => {
                        const maxCount = Math.max(...stats.hourlyDistribution.map((h: any) => h.count), 1)
                        const barHeight = (hour.count / maxCount) * 180
                        const barWidth = 380 / arr.length
                        const x = (idx * barWidth) + 10
                        const y = 190 - barHeight
                        return (
                          <g key={idx}>
                            <rect
                              x={x}
                              y={y}
                              width={barWidth - 4}
                              height={barHeight}
                              fill="url(#blueGradient)"
                              rx="4"
                              className="hover:opacity-80 transition-opacity cursor-pointer"
                            />
                            <text
                              x={x + (barWidth - 4) / 2}
                              y={195}
                              textAnchor="middle"
                              className="text-[8px] fill-gray-600"
                              fontSize="10"
                            >
                              {String(hour.hour).padStart(2, '0')}
                            </text>
                            <text
                              x={x + (barWidth - 4) / 2}
                              y={y - 5}
                              textAnchor="middle"
                              className="text-[8px] fill-gray-700 font-medium"
                              fontSize="10"
                            >
                              {hour.count}
                            </text>
                          </g>
                        )
                      })}
                    <defs>
                      <linearGradient id="blueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#60a5fa" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">Bugün henüz oturum yok</p>
              )}
            </div>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/admin/students"
              className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-5 border border-indigo-100 hover:shadow-md transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-200 rounded-xl flex items-center justify-center">
                  <span className="text-xl">👥</span>
                </div>
                <div>
                  <p className="text-xs text-indigo-600 mb-1">Toplam Öğrenci</p>
                  <p className="text-2xl font-bold text-indigo-900">{stats.totalStudents}</p>
                </div>
              </div>
            </Link>

            <div className="grid grid-cols-2 md:grid-cols-1 gap-4 md:gap-0">
              <Link
                href="/admin/teachers"
                className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-5 border border-violet-100 hover:shadow-md transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-violet-200 rounded-xl flex items-center justify-center">
                    <span className="text-xl">👨‍🏫</span>
                  </div>
                  <div>
                    <p className="text-xs text-violet-600 mb-1">Toplam Öğretmen</p>
                    <p className="text-2xl font-bold text-violet-900">{stats.totalTeachers}</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/admin/courses"
                className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-5 border border-teal-100 hover:shadow-md transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-teal-200 rounded-xl flex items-center justify-center">
                    <span className="text-xl">📚</span>
                  </div>
                  <div>
                    <p className="text-xs text-teal-600 mb-1">Toplam Ders</p>
                    <p className="text-2xl font-bold text-teal-900">{stats.totalCourses}</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <p className="text-sm uppercase tracking-[0.15em] text-gray-400 mb-4">Hızlı İşlemler</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { title: 'Yoklamalar', href: '/admin/attendance', icon: '📊', color: 'from-blue-50 to-cyan-50' },
                { title: 'İçe Aktarma', href: '/admin/imports', icon: '📥', color: 'from-emerald-50 to-teal-50' },
                { title: 'Doktorlar', href: '/admin/doctors', icon: '👨‍⚕️', color: 'from-rose-50 to-pink-50' },
                { title: 'Sağlık', href: '/admin/health-system', icon: '🏥', color: 'from-amber-50 to-orange-50' },
              ].map((action) => (
                <Link
                  key={action.title}
                  href={action.href}
                  className={`bg-gradient-to-br ${action.color} rounded-2xl p-4 border border-gray-100 hover:shadow-md transition text-center`}
                >
                  <span className="text-2xl block mb-2">{action.icon}</span>
                  <span className="text-sm font-medium text-gray-700">{action.title}</span>
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
