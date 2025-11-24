'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { authService } from '@/lib/auth'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { useAdminTheme } from '@/contexts/admin-theme.context'
import { AdminA2Layout } from '@/components/admin/admin-a2-layout'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts'

export default function StudentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const studentId = params.id as string
  const [user, setUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const [courseFilter, setCourseFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const { theme } = useAdminTheme()

  useEffect(() => {
    setMounted(true)
    const currentUser = authService.getUser()
    setUser(currentUser)

    if (!currentUser || currentUser.role !== 'admin') {
      router.push('/login/admin')
    }
  }, [router])

  const { data: student, isLoading } = useQuery({
    queryKey: ['admin-student-detail', studentId],
    queryFn: async () => {
      const response = await api.get(`/admin/students/${studentId}`)
      return response.data
    },
    enabled: !!user && !!studentId,
  })

  // Calculate overall attendance stats
  const overallStats = useMemo(() => {
    if (!student?.courses) return { present: 0, absent: 0, medical: 0, total: 0 }
    
    let present = 0
    let absent = 0
    let medical = 0
    let total = 0
    
    student.courses.forEach((course: any) => {
      present += course.present_count || 0
      absent += course.absent_count || 0
      medical += course.medical_report_count || 0
      total += course.total_sessions || 0
    })
    
    return { present, absent, medical, total }
  }, [student])

  // Prepare attendance distribution chart data
  const attendanceChartData = useMemo(() => {
    return [
      { name: 'Katılan', value: overallStats.present, color: '#10b981' },
      { name: 'Katılmayan', value: overallStats.absent, color: '#ef4444' },
      { name: 'Tıbbi Rapor', value: overallStats.medical, color: '#a855f7' },
    ].filter(d => d.value > 0)
  }, [overallStats])

  // Prepare course attendance rate chart data
  const courseAttendanceData = useMemo(() => {
    if (!student?.courses) return []
    
    return student.courses
      .filter((course: any) => courseFilter === 'all' || course.course_id === courseFilter)
      .map((course: any) => ({
        name: course.course_code,
        katılım: course.attendance_rate || 0,
        katılan: course.present_count || 0,
        katılmayan: course.absent_count || 0,
      }))
  }, [student, courseFilter])

  // Prepare monthly attendance trend
  const monthlyTrend = useMemo(() => {
    if (!student?.courses) return []
    
    const monthlyData: { [key: string]: { present: number; absent: number; medical: number } } = {}
    
    student.courses.forEach((course: any) => {
      course.attendance_records?.forEach((record: any) => {
        if (record.session_date) {
          const date = new Date(record.session_date)
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { present: 0, absent: 0, medical: 0 }
          }
          
          if (record.status === 'present' || record.status === 'manual_present') {
            monthlyData[monthKey].present++
          } else if (record.status === 'medical_report') {
            monthlyData[monthKey].medical++
          } else {
            monthlyData[monthKey].absent++
          }
        }
      })
    })
    
    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month: month.split('-')[1] + '/' + month.split('-')[0],
        Katılan: data.present,
        Katılmayan: data.absent,
        'Tıbbi Rapor': data.medical,
      }))
  }, [student])

  if (!mounted || !user) return null

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Yükleniyor...</div>
      </div>
    )
  }

  if (!student) {
    const notFoundContent = (
      <div className="bg-white rounded-3xl p-6 text-center border border-gray-100 shadow-sm">
        <p className="text-gray-500">Öğrenci bulunamadı</p>
        <Link href="/admin/students">
          <Button className="mt-4">Öğrencilere Dön</Button>
        </Link>
      </div>
    )
    
    if (theme === 'a2') {
      return (
        <AdminA2Layout user={user}>
          {notFoundContent}
        </AdminA2Layout>
      )
    }
    
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {notFoundContent}
        </div>
      </div>
    )
  }

  const handleLogout = () => {
    authService.logout()
    router.push('/login/admin')
  }

  const content = (
    <div className="space-y-4">
      {/* Student Info - Compact */}
      <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{student.full_name}</h1>
            <p className="text-xs text-gray-600 mt-0.5">
              {student.student_id} {student.program && `• ${student.program}`}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-gray-400 mb-1">Öğrenci ID</p>
            <p className="text-sm font-medium">{student.student_id}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-gray-400 mb-1">Ad Soyad</p>
            <p className="text-sm font-medium">{student.full_name}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-gray-400 mb-1">Cinsiyet</p>
            <p className="text-sm font-medium">{student.gender || '-'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-gray-400 mb-1">Program</p>
            <p className="text-sm font-medium">{student.program || '-'}</p>
          </div>
        </div>
      </div>

      {/* Overall Stats - Compact */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-blue-50 rounded-3xl p-3 border border-blue-100">
          <h3 className="text-[10px] uppercase tracking-[0.15em] text-blue-600 mb-1">Toplam Oturum</h3>
          <p className="text-xl font-bold text-blue-900">{overallStats.total}</p>
        </div>
        <div className="bg-green-50 rounded-3xl p-3 border border-green-100">
          <h3 className="text-[10px] uppercase tracking-[0.15em] text-green-600 mb-1">Katılan</h3>
          <p className="text-xl font-bold text-green-900">{overallStats.present}</p>
        </div>
        <div className="bg-red-50 rounded-3xl p-3 border border-red-100">
          <h3 className="text-[10px] uppercase tracking-[0.15em] text-red-600 mb-1">Katılmayan</h3>
          <p className="text-xl font-bold text-red-900">{overallStats.absent}</p>
        </div>
        <div className="bg-purple-50 rounded-3xl p-3 border border-purple-100">
          <h3 className="text-[10px] uppercase tracking-[0.15em] text-purple-600 mb-1">Tıbbi Rapor</h3>
          <p className="text-xl font-bold text-purple-900">{overallStats.medical}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Attendance Distribution Pie Chart */}
        <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm">
          <p className="text-[10px] uppercase tracking-[0.15em] text-gray-400 mb-3">Genel Katılım Dağılımı</p>
          {attendanceChartData.length > 0 ? (
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

        {/* Course Attendance Rate Bar Chart */}
        <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm">
          <p className="text-[10px] uppercase tracking-[0.15em] text-gray-400 mb-3">Ders Bazında Katılım Oranı</p>
          {courseAttendanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={courseAttendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  domain={[0, 100]}
                  label={{ value: 'Katılım %', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Katılım Oranı']}
                />
                <Bar dataKey="katılım" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-gray-400 text-sm">
              Veri yok
            </div>
          )}
        </div>
      </div>

      {/* Monthly Trend Chart */}
      {monthlyTrend.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] text-gray-400 mb-3">Aylık Katılım Trendi</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 10 }}
              />
              <YAxis 
                tick={{ fontSize: 10 }}
              />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Katılan" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="Katılmayan" stroke="#ef4444" strokeWidth={2} />
              <Line type="monotone" dataKey="Tıbbi Rapor" stroke="#a855f7" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Medical Reports - Compact */}
      <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm">
        <h2 className="text-sm font-semibold mb-3">Tıbbi Raporlar ({student.medical_reports?.length || 0})</h2>
        {student.medical_reports && student.medical_reports.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-[0.1em]">
                    Rapor Tarihi
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-[0.1em]">
                    Doktor
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-[0.1em]">
                    Oluşturulma
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {student.medical_reports.map((report: any) => (
                  <tr key={report.id}>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      {new Date(report.report_date).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      {report.doctor_name}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                      {new Date(report.created_at).toLocaleDateString('tr-TR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Tıbbi rapor bulunamadı</p>
        )}
      </div>

      {/* Filters - Compact */}
      {student.courses && student.courses.length > 0 && (
        <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm">
          <h2 className="text-sm font-semibold mb-3">Filtreler</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-1">Derse Göre Filtrele</label>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Tüm Dersler" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Dersler</SelectItem>
                  {student.courses.map((course: any) => (
                    <SelectItem key={course.course_id} value={course.course_id}>
                      {course.course_code} - {course.course_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-1">Duruma Göre Filtrele</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Tüm Durumlar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Durumlar</SelectItem>
                  <SelectItem value="present">Katılan</SelectItem>
                  <SelectItem value="absent">Katılmayan</SelectItem>
                  <SelectItem value="medical_report">Tıbbi Rapor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Courses and Attendance - Compact */}
      {student.courses && student.courses.length > 0 && (
        <div className="space-y-4">
          {student.courses
            .filter((course: any) => courseFilter === 'all' || course.course_id === courseFilter)
            .map((course: any) => {
              // Filter attendance records by status
              const filteredRecords = course.attendance_records?.filter((record: any) => {
                if (statusFilter === 'all') return true
                if (statusFilter === 'present') {
                  return record.status === 'present' || record.status === 'manual_present'
                }
                if (statusFilter === 'absent') {
                  return record.status === 'absent'
                }
                if (statusFilter === 'medical_report') {
                  return record.status === 'medical_report'
                }
                return true
              }) || []

              return (
                <div key={course.course_id} className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm">
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold">{course.course_name}</h3>
                    <p className="text-xs text-gray-600">{course.course_code}</p>
                  </div>

                  {/* Course Stats - Compact */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
                      <p className="text-[10px] text-blue-600 mb-0.5">Toplam</p>
                      <p className="text-lg font-bold text-blue-900">{course.total_sessions}</p>
                    </div>
                    <div className="bg-green-50 p-2 rounded-lg border border-green-100">
                      <p className="text-[10px] text-green-600 mb-0.5">Katılan</p>
                      <p className="text-lg font-bold text-green-900">{course.present_count}</p>
                    </div>
                    <div className="bg-red-50 p-2 rounded-lg border border-red-100">
                      <p className="text-[10px] text-red-600 mb-0.5">Katılmayan</p>
                      <p className="text-lg font-bold text-red-900">{course.absent_count}</p>
                    </div>
                    <div className="bg-purple-50 p-2 rounded-lg border border-purple-100">
                      <p className="text-[10px] text-purple-600 mb-0.5">Tıbbi Rapor</p>
                      <p className="text-lg font-bold text-purple-900">{course.medical_report_count || 0}</p>
                    </div>
                  </div>

                  {/* Attendance Rate - Compact */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700">Katılım Oranı</span>
                      <span className="text-xs font-bold">{course.attendance_rate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          course.attendance_rate >= 75
                            ? 'bg-green-500'
                            : course.attendance_rate >= 50
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${course.attendance_rate}%` }}
                      />
                    </div>
                  </div>

                  {/* Session Details - Compact */}
                  <div>
                    <h4 className="text-xs font-semibold mb-2">Oturum Detayları</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-[0.1em]">
                              Tarih
                            </th>
                            <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-[0.1em]">
                              Oturum
                            </th>
                            <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-[0.1em]">
                              Durum
                            </th>
                            <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-[0.1em]">
                              Gönderilme
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredRecords.length > 0 ? (
                            filteredRecords.map((record: any) => (
                              <tr key={record.session_id}>
                                <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-900">
                                  {new Date(record.session_date).toLocaleDateString('tr-TR')}
                                </td>
                                <td className="px-2 py-1.5 text-xs text-gray-900">
                                  {record.session_name || '-'}
                                </td>
                                <td className="px-2 py-1.5 whitespace-nowrap">
                                  {record.status === 'present' || record.status === 'manual_present' ? (
                                    <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-green-100 text-green-800">
                                      Katılan
                                    </span>
                                  ) : record.status === 'medical_report' ? (
                                    <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-purple-100 text-purple-800">
                                      Tıbbi Rapor
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-red-100 text-red-800">
                                      Katılmayan
                                    </span>
                                  )}
                                </td>
                                <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-500">
                                  {record.submitted_at
                                    ? new Date(record.submitted_at).toLocaleString('tr-TR')
                                    : '-'}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="px-2 py-3 text-center text-gray-500 text-xs">
                                Katılım kaydı bulunamadı
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      )}
    </div>
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
            <Link href="/admin/students" className="text-primary-600 hover:text-primary-700">
              ← Öğrencilere Dön
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{student.full_name}</h1>
              <p className="text-sm text-gray-600">
                {student.student_id} {student.program && `• ${student.program}`}
              </p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="outline">
            Çıkış
          </Button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {content}
      </main>
    </div>
  )
}

