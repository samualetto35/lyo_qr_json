'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { authService } from '@/lib/auth'
import api from '@/lib/api'
import Link from 'next/link'
import { formatDate, formatDateTime } from '@/lib/utils'
import { useAdminTheme } from '@/contexts/admin-theme.context'
import { AdminA2Layout } from '@/components/admin/admin-a2-layout'

export default function AdminAttendancePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const { theme } = useAdminTheme()
  
  // Filters
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [courseFilter, setCourseFilter] = useState('')
  const [teacherFilter, setTeacherFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  
  // Sorting
  const [sortBy, setSortBy] = useState('session_date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    setMounted(true)
    const currentUser = authService.getUser()
    setUser(currentUser)
    
    if (!currentUser || currentUser.role !== 'admin') {
      router.push('/login/admin')
    }
  }, [router])

  // Get teachers list for filter
  const { data: teachers } = useQuery({
    queryKey: ['admin-teachers-list'],
    queryFn: async () => {
      const response = await api.get('/admin/teachers-list')
      return response.data
    },
    enabled: !!user,
  })

  // Get courses list for filter
  const { data: courses } = useQuery({
    queryKey: ['admin-courses-list'],
    queryFn: async () => {
      const response = await api.get('/admin/courses-list')
      return response.data
    },
    enabled: !!user,
  })

  // Get attendance sessions
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['admin-attendance-sessions', fromDate, toDate, courseFilter, teacherFilter, statusFilter, sortBy, sortOrder],
    queryFn: async () => {
      const params: any = {}
      if (fromDate) params.from_date = fromDate
      if (toDate) params.to_date = toDate
      if (courseFilter) params.course_id = courseFilter
      if (teacherFilter) params.teacher_id = teacherFilter
      if (statusFilter) params.status = statusFilter
      if (sortBy) params.sort_by = sortBy
      if (sortOrder) params.sort_order = sortOrder
      
      const response = await api.get('/admin/attendance-sessions', { params })
      return response.data
    },
    enabled: !!user,
  })

  const handleLogout = () => {
    authService.logout()
    router.push('/login/admin')
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      // Toggle order
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return '⇅'
    return sortOrder === 'asc' ? '↑' : '↓'
  }

  if (!mounted || !user) return null

  const legacyContent = (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="text-primary-600 hover:text-primary-700">
              ← Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Attendance Records</h1>
          </div>
          <button onClick={handleLogout} className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900">
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All Courses</option>
                {courses?.map((course: any) => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Teacher</label>
              <select
                value={teacherFilter}
                onChange={(e) => setTeacherFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All Teachers</option>
                {teachers?.map((teacher: any) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sessions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Attendance Sessions ({sessions?.length || 0})</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="session_date">Session Date</option>
                <option value="close_time">Close Time</option>
                <option value="updated">Last Modified</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
              >
                {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
              </button>
            </div>
          </div>
          {isLoading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : sessions && sessions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No attendance sessions found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Session
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Teacher
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Close Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100" onClick={() => handleSort('attendance_rate')}>
                      Attendance Rate {getSortIcon('attendance_rate')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Missing
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sessions?.map((session: any) => (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">
                        <div className="font-medium text-gray-900">
                          {session.session_name || 'Untitled Session'}
                        </div>
                        <div className="text-xs text-gray-500 font-mono truncate max-w-xs">
                          {session.id.substring(0, 12)}...
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>{session.course.name}</div>
                        <div className="text-xs text-gray-500">{session.course.code}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {session.teacher_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {formatDate(session.session_date)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          session.is_open 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {session.is_open ? 'Open' : 'Closed'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {session.end_time ? formatDateTime(session.end_time) : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                session.attendance_rate >= 80
                                  ? 'bg-green-500'
                                  : session.attendance_rate >= 50
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${session.attendance_rate}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700 min-w-[3rem] text-right">
                            {session.attendance_rate}%
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {session.attendance_count} / {session.enrolled_count} students
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-red-100 text-red-800">
                          <span className="font-bold text-lg">{session.enrolled_count - session.attendance_count}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Absent</div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Link href={`/admin/session-details/${session.id}`}>
                          <button className="px-3 py-1 text-xs font-medium text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded-md transition">
                            View Details →
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )

  if (theme === 'a2') {
    return (
      <AdminA2Layout user={user} onLogout={handleLogout}>
        <section className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
            <div className="flex flex-col gap-2 mb-6">
              <p className="text-sm uppercase tracking-[0.2em] text-gray-400">Yoklama Yönetimi</p>
              <h1 className="text-2xl font-semibold text-gray-900">Yoklama Oturumları</h1>
              <p className="text-sm text-gray-500">
                Öğretmen, ders ve tarih filtreleri ile yoklama geçmişini inceleyin.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-400 mb-1">Başlangıç</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-400 mb-1">Bitiş</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-2 text-sm"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-xs uppercase tracking-wide text-gray-400 mb-1">Ders</label>
                <select
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-2 text-sm"
                >
                  <option value="">Tüm Dersler</option>
                  {courses?.map((course: any) => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-400 mb-1">Öğretmen</label>
                <select
                  value={teacherFilter}
                  onChange={(e) => setTeacherFilter(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-2 text-sm"
                >
                  <option value="">Tüm Öğretmenler</option>
                  {teachers?.map((teacher: any) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-400 mb-1">Durum</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-2 text-sm"
                >
                  <option value="">Tümü</option>
                  <option value="open">Açık</option>
                  <option value="closed">Kapalı</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3 justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Son Yoklamalar</h2>
                <p className="text-xs text-gray-500">Toplam {sessions?.length || 0} kayıt</p>
              </div>
              <div className="flex gap-2 text-xs">
                <button
                  className="px-3 py-1 rounded-full border border-gray-200"
                  onClick={() => handleSort('session_date')}
                >
                  Tarihe Göre {sortBy === 'session_date' ? getSortIcon('session_date') : ''}
                </button>
                <button
                  className="px-3 py-1 rounded-full border border-gray-200"
                  onClick={() => handleSort('close_time')}
                >
                  Kapanışa Göre {sortBy === 'close_time' ? getSortIcon('close_time') : ''}
                </button>
              </div>
            </div>
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Yoklamalar yükleniyor...</div>
            ) : sessions?.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Yoklama kaydı bulunamadı.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100 text-sm">
                  <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                    <tr>
                      <th className="px-6 py-3 text-left">Ders</th>
                      <th className="px-6 py-3 text-left">Öğretmen</th>
                      <th className="px-6 py-3 text-left">Tarih</th>
                      <th className="px-6 py-3 text-left">Durum</th>
                      <th className="px-6 py-3 text-left">Katılım</th>
                      <th className="px-6 py-3 text-left">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {sessions?.map((session: any) => (
                      <tr key={session.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <p className="font-medium">{session.course_name}</p>
                          <p className="text-xs text-gray-500">{session.course_code}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{session.teacher_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {formatDateTime(session.session_date)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              session.status === 'open'
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {session.status === 'open' ? 'Açık' : 'Kapalı'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {session.present_count}/{session.total_students}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href={`/admin/session-details/${session.id}`}
                            className="text-primary-600 hover:underline text-sm"
                          >
                            Detayları Gör
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </AdminA2Layout>
    )
  }

  return legacyContent
}
