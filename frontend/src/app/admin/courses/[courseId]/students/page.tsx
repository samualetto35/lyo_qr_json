'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { authService } from '@/lib/auth'
import api from '@/lib/api'
import Link from 'next/link'
import { useAdminTheme } from '@/contexts/admin-theme.context'
import { AdminA2Layout } from '@/components/admin/admin-a2-layout'

export default function AdminCourseStudentsPage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.courseId as string
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
    queryKey: ['admin-course-students', courseId, search],
    queryFn: async () => {
      const response = await api.get(`/admin/courses/${courseId}/students`, {
        params: { q: search },
      })
      return response.data
    },
    enabled: !!user && !!courseId,
  })

  const handleLogout = () => {
    authService.logout()
    router.push('/login/admin')
  }

  const studentsTable = (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {isLoading ? (
        <div className="p-8 text-center">{theme === 'a2' ? 'Öğrenciler yükleniyor...' : 'Loading...'}</div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {theme === 'a2' ? 'Öğrenci ID' : 'Student ID'}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {theme === 'a2' ? 'İsim' : 'Name'}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {theme === 'a2' ? 'Cinsiyet' : 'Gender'}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {theme === 'a2' ? 'Program' : 'Program'}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students?.map((student: any) => (
              <tr key={student.enrollment_id}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{student.student_id}</td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {student.first_name} {student.last_name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{student.gender || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{student.program || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )

  if (!mounted || !user) return null

  if (theme === 'a2') {
    return (
      <AdminA2Layout user={user} onLogout={handleLogout}>
        <section className="space-y-6">
          <Link
            href="/admin/courses"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Derslere Dön
          </Link>

          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Öğrenci ID veya isim ara"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 rounded-2xl border border-gray-200 px-4 py-2 text-sm"
            />
          </div>

          {studentsTable}
        </section>
      </AdminA2Layout>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin/courses" className="text-primary-600 hover:text-primary-700">
              ← Back to Courses
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Course Students</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by student ID or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {studentsTable}
      </main>
    </div>
  )
}

