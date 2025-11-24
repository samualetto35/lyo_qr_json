'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authService } from '@/lib/auth'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useAdminTheme } from '@/contexts/admin-theme.context'
import { AdminA2Layout } from '@/components/admin/admin-a2-layout'

export default function AdminHealthSystemPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [user, setUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
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
  const { data: doctors } = useQuery({
    queryKey: ['admin-doctors-health'],
    queryFn: async () => {
      const response = await api.get('/admin/doctors')
      return response.data
    },
    enabled: !!user,
  })

    queryKey: ['health-system-students', search],
    queryFn: async () => {
      const response = await api.get('/admin/health-system/students', {
        params: { search },
      })
      return response.data
    },
    enabled: !!user,
  })

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return await api.post('/admin/health-system/students/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['health-system-students'] })
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      alert(`Upload successful! Created: ${data.data.created}, Updated: ${data.data.updated}`)
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to upload file')
    },
  })

  const handleUpload = () => {
    if (!selectedFile) {
      alert('Please select a file')
      return
    }

    const formData = new FormData()
    formData.append('file', selectedFile)
    uploadMutation.mutate(formData)
  }

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
        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Import Students</h2>
          <p className="text-sm text-gray-600 mb-4">
            Upload CSV or Excel file with columns: student_id, name, surname (optional: gender, program)
          </p>
          <div className="flex gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="flex-1"
            />
            <Button onClick={handleUpload} disabled={!selectedFile || uploadMutation.isPending}>
              {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </div>

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
                {students?.data?.map((student: any) => (
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
                      {student.reports_count}
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

  const totalReports = students?.data?.reduce(
    (sum: number, student: any) => sum + (student.reports_count || 0),
    0
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
              href="/admin/students"
              className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:border-gray-200 transition"
            >
              <p className="text-sm uppercase tracking-[0.2em] text-gray-400">Raporlar</p>
              <h2 className="text-3xl font-semibold text-gray-900 mt-2">
                {totalReports || 0}{' '}
                <span className="text-base font-normal text-gray-500">aktif rapor</span>
              </h2>
              <p className="text-sm text-gray-500 mt-2">
                Öğrencilerin rapor geçmişini görüntülemek için Öğrenciler sayfasına gidin.
              </p>
            </Link>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
            <div className="flex flex-col gap-2 mb-6">
              <p className="text-sm uppercase tracking-[0.2em] text-gray-400">Sağlık Sistemi</p>
              <h1 className="text-2xl font-semibold text-gray-900">Öğrenci Listesi</h1>
              <p className="text-sm text-gray-500">Dosya yükleyerek sağlık sistemindeki verileri güncelleyin.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                ref={fileInputRef}
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-gray-900 file:text-white hover:file:bg-gray-700"
              />
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploadMutation.isPending}
                className="rounded-full bg-[#0C2A5E] hover:bg-[#123679]"
              >
                {uploadMutation.isPending ? 'Yükleniyor...' : 'Dosyayı Yükle'}
              </Button>
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
              ) : (
                <table className="min-w-full divide-y divide-gray-100 text-sm">
                  <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                    <tr>
                      <th className="px-6 py-3 text-left">Öğrenci ID</th>
                      <th className="px-6 py-3 text-left">İsim</th>
                      <th className="px-6 py-3 text-left">Program</th>
                      <th className="px-6 py-3 text-left">Rapor Sayısı</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {students?.data?.map((student: any) => (
                      <tr key={student.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 whitespace-nowrap">{student.student_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {student.first_name} {student.last_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{student.program || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{student.reports_count}</td>
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

