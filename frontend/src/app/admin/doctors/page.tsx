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

export default function AdminDoctorsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [user, setUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const { theme } = useAdminTheme()
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
  })

  useEffect(() => {
    setMounted(true)
    const currentUser = authService.getUser()
    setUser(currentUser)
    
    if (!currentUser || currentUser.role !== 'admin') {
      router.push('/login/admin')
    }
  }, [router])

  const { data: doctors, isLoading } = useQuery({
    queryKey: ['doctors', search],
    queryFn: async () => {
      const response = await api.get('/admin/doctors', {
        params: { search },
      })
      return response.data
    },
    enabled: !!user,
  })

  const createDoctorMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.post('/admin/doctors', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] })
      setShowModal(false)
      setFormData({ email: '', first_name: '', last_name: '', password: '' })
      alert('Doctor created successfully!')
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to create doctor')
    },
  })

  const handleLogout = () => {
    authService.logout()
    router.push('/login/admin')
  }

  if (!mounted || !user) return null
  const doctorList = doctors?.data ?? []
  const totalDoctors = doctorList.length
  const activeDoctors = doctorList.filter((doctor: any) => doctor.is_active).length
  const inactiveDoctors = Math.max(totalDoctors - activeDoctors, 0)

  const legacyContent = (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="text-primary-600 hover:text-primary-700">
              ← Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Doctors</h1>
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
          <Button onClick={() => setShowModal(true)}>Add Doctor</Button>
        </div>

        {/* Doctors Table */}
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
                    Reports
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {doctorList.map((doctor: any) => (
                  <tr key={doctor.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {doctor.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {doctor.first_name} {doctor.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          doctor.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {doctor.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doctor.reports_count}
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

  const modal = showModal ? (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">
          {theme === 'a2' ? 'Yeni Doktor Ekle' : 'Add New Doctor'}
        </h3>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createDoctorMutation.mutate(formData)
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {theme === 'a2' ? 'İsim' : 'First Name'}
              </label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {theme === 'a2' ? 'Soyisim' : 'Last Name'}
              </label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <div className="mt-6 flex gap-2">
            <Button type="submit" disabled={createDoctorMutation.isPending}>
              {createDoctorMutation.isPending
                ? theme === 'a2'
                  ? 'Oluşturuluyor...'
                  : 'Creating...'
                : theme === 'a2'
                ? 'Doktoru Oluştur'
                : 'Create Doctor'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowModal(false)}
            >
              {theme === 'a2' ? 'İptal' : 'Cancel'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  ) : null

  if (theme === 'a2') {
    return (
      <>
        <AdminA2Layout user={user} onLogout={handleLogout}>
          <section className="space-y-6">
            <Link
              href="/admin/health-system"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Sağlık Paneli
            </Link>

            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-gray-400">Doktor Yönetimi</p>
                  <h1 className="text-2xl font-semibold text-gray-900 mt-2">Doktor Hesapları</h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Sağlık raporlarını görüntüleyen ve yöneten ekibi buradan kontrol edin.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center w-full lg:w-auto">
                  <input
                    type="text"
                    placeholder="Email veya isim ara..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 rounded-2xl border border-gray-200 px-4 py-2 text-sm"
                  />
                  <Button onClick={() => setShowModal(true)} className="sm:w-auto w-full">
                    + Doktor Ekle
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-gray-100 p-4 bg-gray-50">
                  <p className="text-xs uppercase tracking-wide text-gray-400">Toplam Doktor</p>
                  <p className="text-3xl font-semibold text-gray-900 mt-2">{totalDoctors}</p>
                </div>
                <div className="rounded-2xl border border-green-100 p-4 bg-green-50/70">
                  <p className="text-xs uppercase tracking-wide text-green-600">Aktif</p>
                  <p className="text-3xl font-semibold text-green-700 mt-2">{activeDoctors}</p>
                </div>
                <div className="rounded-2xl border border-amber-100 p-4 bg-amber-50/70">
                  <p className="text-xs uppercase tracking-wide text-amber-600">Pasif</p>
                  <p className="text-3xl font-semibold text-amber-700 mt-2">{inactiveDoctors}</p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-gray-100">
                {isLoading ? (
                  <div className="p-8 text-center text-gray-500">Doktor listesi yükleniyor...</div>
                ) : doctorList.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">Herhangi bir doktor bulunamadı.</div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-100 text-sm">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                      <tr>
                        <th className="px-6 py-3 text-left">Email</th>
                        <th className="px-6 py-3 text-left">İsim</th>
                        <th className="px-6 py-3 text-left">Durum</th>
                        <th className="px-6 py-3 text-left">Rapor Sayısı</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      {doctorList.map((doctor: any) => (
                        <tr key={doctor.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 whitespace-nowrap">{doctor.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {doctor.first_name} {doctor.last_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                doctor.is_active
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {doctor.is_active ? 'Aktif' : 'Pasif'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {doctor.reports_count ?? 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </section>
        </AdminA2Layout>
        {modal}
      </>
    )
  }

  return (
    <>
      {legacyContent}
      {modal}
    </>
  )
}

