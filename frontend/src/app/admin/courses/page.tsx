'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authService } from '@/lib/auth'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useAdminTheme } from '@/contexts/admin-theme.context'
import { AdminA2Layout } from '@/components/admin/admin-a2-layout'

export default function AdminCoursesPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [user, setUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    teacher_id: '',
  })
  const { theme } = useAdminTheme()

  useEffect(() => {
    setMounted(true)
    const currentUser = authService.getUser()
    setUser(currentUser)
    
    if (!currentUser || currentUser.role !== 'admin') {
      router.push('/login/admin')
    }
  }, [router])

  const { data: courses, isLoading } = useQuery({
    queryKey: ['admin-courses', search],
    queryFn: async () => {
      const response = await api.get('/admin/courses', {
        params: { search },
      })
      return response.data
    },
    enabled: !!user,
  })

  const { data: teachers } = useQuery({
    queryKey: ['teachers-list'],
    queryFn: async () => {
      const response = await api.get('/admin/teachers')
      return response.data
    },
    enabled: !!user,
  })

  const createCourseMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.post('/admin/courses', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] })
      setShowModal(false)
      setFormData({ name: '', code: '', description: '', teacher_id: '' })
      alert('Course created successfully!')
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to create course')
    },
  })

  const handleLogout = () => {
    authService.logout()
    router.push('/login/admin')
  }

  const modal = showModal && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-xl">
        <h3 className="text-xl font-semibold mb-4">Yeni Ders Oluştur</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createCourseMutation.mutate(formData)
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700">Ders Adı</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Ders Kodu</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Öğretmen</label>
              <select
                required
                value={formData.teacher_id}
                onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Öğretmen seçin</option>
                {teachers?.data?.map((teacher: any) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.first_name} {teacher.last_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Açıklama</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
              Vazgeç
            </Button>
            <Button type="submit" disabled={createCourseMutation.isPending}>
              {createCourseMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )

  if (!mounted || !user) return null

  const legacyContent = (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="text-primary-600 hover:text-primary-700">
              ← Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
          </div>
          <button onClick={handleLogout} className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900">
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex gap-4">
          <input
            type="text"
            placeholder="Search by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md"
          />
          <Button onClick={() => setShowModal(true)}>Add Course</Button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {courses?.map((course: any) => (
                  <tr key={course.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">{course.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{course.code || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{course.teacher.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{course.students_count}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 text-xs font-semibold rounded-full ${
                        course.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {course.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Link href={`/admin/courses/${course.id}/students`} className="text-primary-600 hover:text-primary-900">
                        View Students
                      </Link>
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
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Ders adı veya kodu ara"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 rounded-2xl border border-gray-200 px-4 py-2 text-sm"
            />
            <Button
              onClick={() => setShowModal(true)}
              className="rounded-full bg-[#0C2A5E] hover:bg-[#123679]"
            >
              Yeni Ders
            </Button>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Dersler</h2>
              <p className="text-sm text-gray-500">Toplam {courses?.length || 0} kayıt</p>
            </div>
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Dersler yükleniyor...</div>
            ) : courses?.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Ders bulunamadı.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100 text-sm">
                  <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                    <tr>
                      <th className="px-6 py-3 text-left">Ders</th>
                      <th className="px-6 py-3 text-left">Kod</th>
                      <th className="px-6 py-3 text-left">Öğretmen</th>
                      <th className="px-6 py-3 text-left">Öğrenci</th>
                      <th className="px-6 py-3 text-left">Durum</th>
                      <th className="px-6 py-3 text-left">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {courses?.map((course: any) => (
                      <tr key={course.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <p className="font-medium">{course.name}</p>
                          <p className="text-xs text-gray-500">{course.description || '—'}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{course.code || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{course.teacher?.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{course.students_count}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              course.is_active
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {course.is_active ? 'Aktif' : 'Pasif'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href={`/admin/courses/${course.id}/students`}
                            className="text-primary-600 hover:underline text-sm"
                          >
                            Öğrencileri Gör
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
        {modal}
      </AdminA2Layout>
    )
  }

  return (
    <>
      {legacyContent}
      {modal}
    </>
  )
}

