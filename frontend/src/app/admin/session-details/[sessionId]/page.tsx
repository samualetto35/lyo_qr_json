'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { authService } from '@/lib/auth'
import api from '@/lib/api'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { formatDate, formatDateTime } from '@/lib/utils'
import { useAdminTheme } from '@/contexts/admin-theme.context'
import { AdminA2Layout } from '@/components/admin/admin-a2-layout'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

export default function AdminSessionDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const sessionId = params.sessionId as string
  const [user, setUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const { theme } = useAdminTheme()
  
  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    setMounted(true)
    const currentUser = authService.getUser()
    setUser(currentUser)
    
    if (!currentUser || currentUser.role !== 'admin') {
      router.push('/login/admin')
    }
  }, [router])

  // Get session details
  const { data: sessionDetails, isLoading } = useQuery({
    queryKey: ['admin-session-details', sessionId, search, statusFilter],
    queryFn: async () => {
      const params: any = {}
      if (search) params.search = search
      if (statusFilter) params.status_filter = statusFilter
      
      const response = await api.get(`/admin/session-details/${sessionId}`, { params })
      return response.data
    },
    enabled: !!user && !!sessionId,
  })

  const handleLogout = () => {
    authService.logout()
    router.push('/login/admin')
  }

  // Calculate submission method distribution
  const submissionMethodData = useMemo(() => {
    if (!sessionDetails?.present_students) return []
    
    const methods = {
      qr: 0,
      manual: 0,
    }
    
    sessionDetails.present_students.forEach((student: any) => {
      if (student.submitted_via === 'manual') {
        methods.manual++
      } else {
        methods.qr++
      }
    })
    
    return [
      { name: 'QR Kod', value: methods.qr, color: '#3b82f6' },
      { name: 'Manuel', value: methods.manual, color: '#10b981' },
    ].filter(d => d.value > 0)
  }, [sessionDetails])

  // Prepare chart data
  const attendanceChartData = useMemo(() => {
    const stats = sessionDetails?.statistics
    if (!stats) return []
    
    return [
      { name: 'Katılan', value: stats.total_present || 0, color: '#10b981' },
      { name: 'Katılmayan', value: stats.total_absent || 0, color: '#ef4444' },
    ]
  }, [sessionDetails])

  if (!mounted || !user) return null

  const session = sessionDetails?.session
  const course = sessionDetails?.course
  const teacher = sessionDetails?.teacher
  const stats = sessionDetails?.statistics
  const presentStudents = sessionDetails?.present_students || []
  const absentStudents = sessionDetails?.absent_students || []

  const content = (
    <>
      {isLoading ? (
        <div className="text-center py-6 text-gray-500">Yükleniyor...</div>
      ) : !sessionDetails ? (
        <div className="text-center py-6 text-gray-500">Oturum bulunamadı</div>
      ) : (
        <div className="space-y-4">
          {/* Session Info Card - Compact */}
          <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <h3 className="text-[10px] uppercase tracking-[0.15em] text-gray-400 mb-1">Oturum Adı</h3>
                <p className="text-sm font-semibold text-gray-900">
                  {session?.session_name || 'İsimsiz Oturum'}
                </p>
              </div>
              <div>
                <h3 className="text-[10px] uppercase tracking-[0.15em] text-gray-400 mb-1">Ders</h3>
                <p className="text-sm font-semibold text-gray-900">{course?.name}</p>
                <p className="text-[11px] text-gray-500">{course?.code}</p>
              </div>
              <div>
                <h3 className="text-[10px] uppercase tracking-[0.15em] text-gray-400 mb-1">Öğretmen</h3>
                <p className="text-sm font-semibold text-gray-900">{teacher?.name}</p>
                <p className="text-[11px] text-gray-500">{teacher?.email}</p>
              </div>
              <div>
                <h3 className="text-[10px] uppercase tracking-[0.15em] text-gray-400 mb-1">Tarih & Durum</h3>
                <p className="text-sm font-semibold text-gray-900">
                  {formatDate(session?.session_date)}
                </p>
                <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full mt-1 ${
                  session?.is_open 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {session?.is_open ? 'Açık' : 'Kapalı'}
                </span>
              </div>
            </div>
          </div>

          {/* Statistics Cards - Compact */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 rounded-3xl p-3 border border-blue-100">
              <h3 className="text-[10px] uppercase tracking-[0.15em] text-blue-600 mb-1">Toplam Kayıtlı</h3>
              <p className="text-xl font-bold text-blue-900">{stats?.total_enrolled || 0}</p>
            </div>
            <div className="bg-green-50 rounded-3xl p-3 border border-green-100">
              <h3 className="text-[10px] uppercase tracking-[0.15em] text-green-600 mb-1">Katılan</h3>
              <p className="text-xl font-bold text-green-900">{stats?.total_present || 0}</p>
              <p className="text-[10px] text-green-700 mt-0.5">
                {stats?.total_enrolled > 0 
                  ? Math.round((stats.total_present / stats.total_enrolled) * 100) 
                  : 0}% katılım
              </p>
            </div>
            <div className="bg-red-50 rounded-3xl p-3 border border-red-100">
              <h3 className="text-[10px] uppercase tracking-[0.15em] text-red-600 mb-1">Katılmayan</h3>
              <p className="text-xl font-bold text-red-900">{stats?.total_absent || 0}</p>
              <p className="text-[10px] text-red-700 mt-0.5">
                {stats?.total_enrolled > 0 
                  ? Math.round((stats.total_absent / stats.total_enrolled) * 100) 
                  : 0}% eksik
              </p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Attendance Distribution Pie Chart */}
            <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm">
              <p className="text-[10px] uppercase tracking-[0.15em] text-gray-400 mb-3">Katılım Dağılımı</p>
              {attendanceChartData.some(d => d.value > 0) ? (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={attendanceChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {attendanceChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[180px] flex items-center justify-center text-gray-400 text-sm">
                  Veri yok
                </div>
              )}
            </div>

            {/* Submission Method Distribution */}
            <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm">
              <p className="text-[10px] uppercase tracking-[0.15em] text-gray-400 mb-3">Katılım Yöntemi Dağılımı</p>
              {submissionMethodData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={submissionMethodData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent, value }) => `${name}: ${value} (${((percent || 0) * 100).toFixed(0)}%)`}
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {submissionMethodData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[180px] flex items-center justify-center text-gray-400 text-sm">
                  Veri yok
                </div>
              )}
            </div>
          </div>

          {/* Filters - Compact */}
          <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm">
            <h3 className="text-sm font-semibold mb-3">Öğrenci Filtrele</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">Ara</label>
                <input
                  type="text"
                  placeholder="ID veya isim ile ara..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">Durum</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
                >
                  <option value="">Tüm Öğrenciler</option>
                  <option value="present">Sadece Katılanlar</option>
                  <option value="absent">Sadece Katılmayanlar</option>
                </select>
              </div>
            </div>
          </div>

          {/* Present Students - Compact */}
          {(!statusFilter || statusFilter === 'present') && presentStudents.length > 0 && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm">
              <div className="px-4 py-3 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-green-700">
                  ✓ Katılan Öğrenciler ({presentStudents.length})
                </h2>
              </div>
              <div className="p-4">
                <div className="flex flex-wrap gap-2">
                  {presentStudents.map((student: any) => (
                    <div
                      key={student.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-green-50 border border-green-200 rounded-lg hover:shadow-md transition text-xs"
                    >
                      <span className="px-1.5 py-0.5 bg-green-200 text-green-800 font-bold rounded text-[10px]">
                        {student.student_id}
                      </span>
                      <span className="font-medium text-green-900">
                        {student.full_name}
                      </span>
                      {student.submitted_via === 'manual' && (
                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px]">
                          Manuel
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Absent Students - Compact */}
          {(!statusFilter || statusFilter === 'absent') && absentStudents.length > 0 && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm">
              <div className="px-4 py-3 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-red-700">
                  ✗ Katılmayan Öğrenciler ({absentStudents.length})
                </h2>
              </div>
              <div className="p-4">
                <div className="flex flex-wrap gap-2">
                  {absentStudents.map((student: any) => (
                    <div
                      key={student.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-red-50 border border-red-200 rounded-lg hover:shadow-md transition text-xs"
                    >
                      <span className="px-1.5 py-0.5 bg-red-200 text-red-800 font-bold rounded text-[10px]">
                        {student.student_id}
                      </span>
                      <span className="font-medium text-red-900">
                        {student.full_name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* No Results */}
          {presentStudents.length === 0 && absentStudents.length === 0 && (
            <div className="bg-white rounded-3xl p-6 text-center text-gray-500 border border-gray-100 shadow-sm">
              Filtrelerinize uygun öğrenci bulunamadı.
            </div>
          )}
        </div>
      )}
    </>
  )

  if (theme === 'a2') {
    return (
      <AdminA2Layout user={user} onLogout={handleLogout}>
        {content}
      </AdminA2Layout>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin/attendance" className="text-primary-600 hover:text-primary-700">
              ← Yoklamalara Dön
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Oturum Detayları</h1>
          </div>
          <button onClick={handleLogout} className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900">
            Çıkış
          </button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {content}
      </main>
    </div>
  )
}

