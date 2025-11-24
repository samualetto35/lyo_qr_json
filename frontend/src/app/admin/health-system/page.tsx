'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { authService } from '@/lib/auth'
import api from '@/lib/api'
import Link from 'next/link'
import { useAdminTheme } from '@/contexts/admin-theme.context'
import { AdminA2Layout } from '@/components/admin/admin-a2-layout'

const getReportCount = (student: any) =>
  student?.reports_count ?? student?.reportsCount ?? student?.reports ?? 0

export default function AdminHealthSystemPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const [search, setSearch] = useState('')
  const { theme } = useAdminTheme()

  useEffect(() => {
    setMounted(true)
    const currentUser = authService.getUser()
    setUser(currentUser)
    
    if (!currentUser || currentUser.role !== 'admin') {
      router.push('/login/admin')
    }
  }, [router])

  const { data: students, isLoading } = useQuery({
    queryKey: ['health-system-students', search],
    queryFn: async () => {
      // Use /admin/students endpoint which includes reports_count
      const response = await api.get('/admin/students', {
        params: { 
          search,
          page: 1,
          limit: 1000, // Get all students with reports
        },
      })
      console.log('[Health] Students API response:', response.data)
      if (response.data?.data) {
        response.data.data.forEach((student: any) => {
          console.log(`[Health] Student ${student.student_id}:`, {
            reports_count: student.reports_count,
            reportsCount: student.reportsCount,
            reports: student.reports,
            allKeys: Object.keys(student),
          })
        })
      }
      return response.data
    },
    enabled: !!user,
  })

  const { data: doctors } = useQuery({
    queryKey: ['admin-doctors-health'],
    queryFn: async () => {
      const response = await api.get('/admin/doctors')
      return response.data
    },
    enabled: !!user,
  })

  const { data: reportsSummary, isLoading: isReportsLoading } = useQuery({
    queryKey: ['admin-health-report-count'],
    queryFn: async () => {
      const response = await api.get('/admin/health-system/reports')
      return response.data
    },
    enabled: !!user,
  })

  const studentsWithReports = useMemo(() => {
    if (!students?.data) return []
    
    console.log('[Health] Total students from API:', students.data.length)
    console.log('[Health] Sample student:', students.data[0])
    
    const filtered = students.data.filter((student: any) => {
      const count = getReportCount(student)
      console.log(`[Health] Student ${student.student_id}: reports_count=${count}`, student)
      return count > 0
    })
    
    console.log('[Health] Students with reports:', filtered.length)
    return filtered
  }, [students])

  const filteredStudents = useMemo(() => {
    if (!search) return studentsWithReports
    const term = search.toLowerCase()
    return studentsWithReports.filter((student: any) => {
      const fullName = `${student.first_name ?? ''} ${student.last_name ?? ''}`.toLowerCase()
      return (
        student.student_id?.toLowerCase().includes(term) ||
        fullName.includes(term)
      )
    })
  }, [studentsWithReports, search])

  const totalReports = Array.isArray(reportsSummary) ? reportsSummary.length : undefined
  const reportsDisplay =
    isReportsLoading || typeof totalReports !== 'number' ? '...' : totalReports

  const handleLogout = () => {
    authService.logout()
    router.push('/login/admin')
  }

  if (!mounted || !user) return null

  const legacyContent = (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="text-primary-600 hover:text-primary-700">
              ← Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Health System Students</h1>
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
        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by student ID or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No students with health reports.</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gender
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Program
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reports
                  </th>
                </tr>
              </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStudents.map((student: any) => (
                  <tr key={student.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.student_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.first_name} {student.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.gender || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.program || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getReportCount(student)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )

  if (theme === 'a2') {
    return (
      <AdminA2Layout user={user} onLogout={handleLogout}>
        <section className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/admin/doctors"
              className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:border-gray-200 transition"
            >
              <p className="text-sm uppercase tracking-[0.2em] text-gray-400">Doktorlar</p>
              <h2 className="text-3xl font-semibold text-gray-900 mt-2">
                {doctors?.data?.length || 0}{' '}
                <span className="text-base font-normal text-gray-500">aktif hesap</span>
              </h2>
              <p className="text-sm text-gray-500 mt-2">
                Doktor yetkilerini yönetmek ve rapor sürecini izlemek için tıklayın.
              </p>
            </Link>
            <Link
              href="/admin/health-system/reports"
              className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:border-gray-200 transition"
            >
              <p className="text-sm uppercase tracking-[0.2em] text-gray-400">Raporlar</p>
              <h2 className="text-3xl font-semibold text-gray-900 mt-2">
                {reportsDisplay}{' '}
                <span className="text-base font-normal text-gray-500">aktif rapor</span>
              </h2>
              <p className="text-sm text-gray-500 mt-2">
                Doktorların paylaştığı tüm raporları liste halinde inceleyin.
              </p>
            </Link>
          </div>

          <div className="rounded-3xl border border-gray-100 p-6 shadow-sm bg-white/90">
            <div className="flex flex-col gap-2 mb-6">
              <p className="text-sm uppercase tracking-[0.2em] text-gray-400">Sağlık Sistemi</p>
              <h1 className="text-2xl font-semibold text-gray-900">Raporlu Öğrenciler</h1>
              <p className="text-sm text-gray-500">
                Doktor panelindeki listeyle eşleşecek şekilde raporu bulunan öğrencileri görüntüleyin.
              </p>
            </div>

            <input
              type="text"
              placeholder="Öğrenci ID veya isim ara"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 px-4 py-2 mb-6 text-sm"
            />

            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="p-8 text-center text-gray-500">Öğrenciler yükleniyor...</div>
              ) : filteredStudents.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Raporu bulunan öğrenci kaydı bulunamadı.
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-100 text-sm">
                  <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                    <tr>
                      <th className="px-6 py-3 text-left">Öğrenci ID</th>
                      <th className="px-6 py-3 text-left">İsim</th>
                      <th className="px-6 py-3 text-left">Cinsiyet</th>
                      <th className="px-6 py-3 text-left">Program</th>
                      <th className="px-6 py-3 text-left">Rapor Sayısı</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {filteredStudents.map((student: any) => (
                      <tr key={student.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 whitespace-nowrap">{student.student_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {student.first_name} {student.last_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{student.gender || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{student.program || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{getReportCount(student)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>
      </AdminA2Layout>
    )
  }

  return legacyContent
}

