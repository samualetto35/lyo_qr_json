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

export default function AdminTeachersPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [user, setUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
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

  const { data: teachers, isLoading } = useQuery({
    queryKey: ['teachers', search],
    queryFn: async () => {
      const response = await api.get('/admin/teachers', {
        params: { search },
      })
      return response.data
    },
    enabled: !!user,
  })

  const createTeacherMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.post('/admin/teachers', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
      setShowModal(false)
      setFormData({ email: '', first_name: '', last_name: '', password: '' })
      alert('Teacher created successfully!')
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to create teacher')
    },
  })

  const handleLogout = () => {
    authService.logout()
    router.push('/login/admin')
  }

  const modal = showModal && (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-xl">
        <h3 className="text-xl font-semibold mb-4">Öğretmen Ekle</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createTeacherMutation.mutate(formData)
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700">E-posta</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="ornek@sabanciuniv.edu"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md placeholder:text-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Ad</label>
            <input
              type="text"
              required
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              placeholder="Ad"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md placeholder:text-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Soyad</label>
            <input
              type="text"
              required
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              placeholder="Soyad"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md placeholder:text-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Şifre</label>
            <input
              type="password"
              minLength={8}
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="En az 8 karakter"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md placeholder:text-gray-400"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
              Vazgeç
            </Button>
            <Button type="submit" disabled={createTeacherMutation.isPending}>
              {createTeacherMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )

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
            <h1 className="text-2xl font-bold text-gray-900">Teachers</h1>
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
        {/* Search and Add Button */}
        <div className="mb-6 flex gap-4">
          <input
            type="text"
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          />
          <Button onClick={() => setShowModal(true)}>Add Teacher</Button>
        </div>

        {/* Teachers Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Courses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teachers?.data?.map((teacher: any) => (
                  <tr key={teacher.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {teacher.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {teacher.first_name} {teacher.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          teacher.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {teacher.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {teacher.courses_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-primary-600 hover:text-primary-900">Edit</button>
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
              placeholder="Öğretmen e-posta veya isim ara"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 rounded-2xl border border-gray-200 px-4 py-2 text-sm"
            />
            <Button
              onClick={() => setShowModal(true)}
              className="rounded-full bg-[#0C2A5E] hover:bg-[#123679]"
            >
              Öğretmen Ekle
            </Button>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Öğretmenler</h2>
              <p className="text-sm text-gray-500">Toplam {teachers?.data?.length || 0} kayıt</p>
            </div>
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Öğretmenler yükleniyor...</div>
            ) : teachers?.data?.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Öğretmen bulunamadı.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100 text-sm">
                  <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                    <tr>
                      <th className="px-6 py-3 text-left">E-posta</th>
                      <th className="px-6 py-3 text-left">İsim</th>
                      <th className="px-6 py-3 text-left">Durum</th>
                      <th className="px-6 py-3 text-left">Ders Sayısı</th>
                      <th className="px-6 py-3 text-left">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {teachers?.data?.map((teacher: any) => (
                      <tr key={teacher.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 whitespace-nowrap font-medium">{teacher.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {teacher.first_name} {teacher.last_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              teacher.is_active
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-red-50 text-red-600'
                            }`}
                          >
                            {teacher.is_active ? 'Aktif' : 'Pasif'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{teacher.courses_count}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button className="text-primary-600 hover:underline text-sm">Düzenle</button>
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

