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

export default function AdminImportsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [user, setUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const { theme } = useAdminTheme()

  useEffect(() => {
    setMounted(true)
    const currentUser = authService.getUser()
    setUser(currentUser)
    
    if (!currentUser || currentUser.role !== 'admin') {
      router.push('/login/admin')
    }
  }, [router])

  const { data: batches, isLoading } = useQuery({
    queryKey: ['import-batches'],
    queryFn: async () => {
      const response = await api.get('/admin/import/students/batches')
      return response.data
    },
    enabled: !!user,
  })

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return await api.post('/admin/import/students/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import-batches'] })
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      alert('File uploaded successfully!')
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

  const batchList = Array.isArray(batches)
    ? batches
    : Array.isArray(batches?.data)
    ? batches.data
    : []

  const legacyContent = (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="text-primary-600 hover:text-primary-700">
              ← Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Student Imports</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Upload Student Roster</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select CSV or Excel File
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
            </div>
            <div className="text-xs text-gray-500">
              <p>Expected columns: student_id, first_name, last_name, gender (optional), program (optional)</p>
            </div>
            <Button onClick={handleUpload} disabled={!selectedFile || uploadMutation.isPending}>
              {uploadMutation.isPending ? 'Uploading...' : 'Upload File'}
            </Button>
          </div>
        </div>

        {/* Import Batches Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Import History</h2>
          </div>
          {isLoading ? (
            <div className="p-8 text-center">Loading...</div>
        ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Filename</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rows</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {batchList.map((batch: any) => (
                  <tr key={batch.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">{batch.original_filename}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 text-xs font-semibold rounded-full ${
                        batch.status === 'committed' ? 'bg-green-100 text-green-800' :
                        batch.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {batch.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {batch.course ? `${batch.course.name} (${batch.course.code})` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{batch.rows_count}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(batch.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Link
                        href={`/admin/imports/${batch.id}`}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        View Details
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
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
            <div className="flex flex-col gap-2 mb-6">
              <p className="text-sm uppercase tracking-[0.2em] text-gray-400">Öğrenci Ekle</p>
              <h1 className="text-2xl font-semibold text-gray-900">Toplu Öğrenci Yükleme</h1>
              <p className="text-sm text-gray-500">CSV veya Excel dosyasıyla öğrencileri sisteme ekleyin.</p>
            </div>
            <div className="space-y-4">
              <label className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-wide text-gray-400">Dosya Seçin</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-gray-900 file:text-white hover:file:bg-gray-700"
                />
              </label>
              <p className="text-xs text-gray-500">
                Beklenen kolonlar: student_id, first_name, last_name, gender (opsiyonel), program (opsiyonel)
              </p>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploadMutation.isPending}
                className="rounded-full bg-[#0C2A5E] hover:bg-[#123679]"
              >
                {uploadMutation.isPending ? 'Yükleniyor...' : 'Dosyayı Yükle'}
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Yükleme Geçmişi</h2>
                <p className="text-sm text-gray-500">Son {batchList.length} işlem</p>
              </div>
            </div>
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Geçmiş yükleniyor...</div>
            ) : batchList.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Henüz yüklenmiş dosya yok.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100 text-sm">
                  <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                    <tr>
                      <th className="px-6 py-3 text-left">Dosya</th>
                      <th className="px-6 py-3 text-left">Durum</th>
                      <th className="px-6 py-3 text-left">Ders</th>
                      <th className="px-6 py-3 text-left">Satır</th>
                      <th className="px-6 py-3 text-left">Tarih</th>
                      <th className="px-6 py-3 text-left">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {batchList.map((batch: any) => (
                      <tr key={batch.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <p className="font-medium">{batch.original_filename}</p>
                          <p className="text-xs text-gray-500">
                            Mod: {batch.import_mode || 'Belirtilmedi'}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              batch.status === 'committed'
                                ? 'bg-emerald-50 text-emerald-600'
                                : batch.status === 'failed'
                                ? 'bg-rose-50 text-rose-600'
                                : 'bg-yellow-50 text-yellow-600'
                            }`}
                          >
                            {batch.status === 'committed' ? 'Tamamlandı' : batch.status === 'failed' ? 'Hatalı' : 'Bekliyor'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {batch.course
                            ? `${batch.course.name} (${batch.course.code})`
                            : 'Atanmadı'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{batch.rows_count}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(batch.created_at).toLocaleString('tr-TR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href={`/admin/imports/${batch.id}`}
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

