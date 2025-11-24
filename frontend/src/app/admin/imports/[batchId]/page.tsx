'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authService } from '@/lib/auth'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useAdminTheme } from '@/contexts/admin-theme.context'
import { AdminA2Layout } from '@/components/admin/admin-a2-layout'

export default function AdminImportBatchDetailPage() {
  const router = useRouter()
  const params = useParams()
  const batchId = params.batchId as string
  const queryClient = useQueryClient()
  const [user, setUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState('')
  const [importMode, setImportMode] = useState('add_only')
  const { theme } = useAdminTheme()

  useEffect(() => {
    setMounted(true)
    const currentUser = authService.getUser()
    setUser(currentUser)
    
    if (!currentUser || currentUser.role !== 'admin') {
      router.push('/login/admin')
    }
  }, [router])

  const { data: batchData, isLoading } = useQuery({
    queryKey: ['import-batch', batchId],
    queryFn: async () => {
      const response = await api.get(`/admin/import/students/batches/${batchId}/preview`)
      return response.data
    },
    enabled: !!user && !!batchId,
  })

  const { data: courses } = useQuery({
    queryKey: ['courses-for-import'],
    queryFn: async () => {
      const response = await api.get('/admin/courses')
      console.log('[Import] Courses API response:', response.data)
      return response.data
    },
    enabled: !!user,
  })

  useEffect(() => {
    if (courses) {
      console.log('[Import] Available courses:', courses)
      courses.forEach((course: any) => {
        console.log(`[Import] Course: ${course.name} (${course.code}) - ID: ${course.id} (type: ${typeof course.id})`)
      })
    }
  }, [courses])

  useEffect(() => {
    if (batchData?.batch?.import_mode) {
      setImportMode(batchData.batch.import_mode)
    }
    if (batchData?.batch?.course_id && !selectedCourse) {
      setSelectedCourse(batchData.batch.course_id)
    }
  }, [batchData, selectedCourse])

  const assignCourseMutation = useMutation({
    mutationFn: async (courseId: string) => {
      if (!courseId) {
        throw new Error('Course ID is required')
      }
      console.log('[Import] Assigning course:', { batchId, courseId })
      try {
        const response = await api.post(`/admin/import/students/batches/${batchId}/assign-course`, {
          course_id: courseId,
        })
        return response
      } catch (error: any) {
        console.error('[Import] Assign course error:', error)
        const errorMessage = error.response?.data?.message || 
                            error.response?.data?.error || 
                            error.message || 
                            'Failed to assign course'
        throw new Error(errorMessage)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import-batch', batchId] })
      alert('Course assigned successfully!')
    },
    onError: (error: any) => {
      console.error('[Import] Assign course mutation error:', error)
      alert(error.message || 'Failed to assign course. Please check the console for details.')
    },
  })

  const setModeMutation = useMutation({
    mutationFn: async (mode: string) => {
      if (!mode) {
        throw new Error('Import mode is required')
      }
      console.log('[Import] Setting mode:', { batchId, mode })
      try {
        const response = await api.post(`/admin/import/students/batches/${batchId}/set-mode`, {
          import_mode: mode,
        })
        return response
      } catch (error: any) {
        console.error('[Import] Set mode error:', error)
        const errorMessage = error.response?.data?.message || 
                            error.response?.data?.error || 
                            error.message || 
                            'Failed to set import mode'
        throw new Error(errorMessage)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import-batch', batchId] })
      alert('Import mode set successfully!')
    },
    onError: (error: any) => {
      console.error('[Import] Set mode mutation error:', error)
      alert(error.message || 'Failed to set import mode. Please check the console for details.')
    },
  })

  const commitMutation = useMutation({
    mutationFn: async () => {
      return await api.post(`/admin/import/students/batches/${batchId}/commit`)
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['import-batch', batchId] })
      const stats = response.data
      alert(
        `Import completed!\n` +
        `Created students: ${stats.created_students}\n` +
        `Updated students: ${stats.updated_students}\n` +
        `Created enrollments: ${stats.created_enrollments}\n` +
        `Skipped rows: ${stats.skipped_rows}`
      )
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to commit import')
    },
  })

  const handleLogout = () => {
    authService.logout()
    router.push('/login/admin')
  }

  if (!mounted || !user) return null

  const batch = batchData?.batch
  const previewRows = batchData?.rows ?? []
  const statusPill =
    batch?.status === 'committed'
      ? 'bg-green-100 text-green-800'
      : batch?.status === 'ready_to_commit'
      ? 'bg-blue-100 text-blue-800'
      : 'bg-yellow-100 text-yellow-800'

  const legacyContent = (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin/imports" className="text-primary-600 hover:text-primary-700">
              ← Back to Imports
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Import Batch Details</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <>
            {/* Batch Info */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Batch Information</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Filename:</span>
                  <span className="ml-2 font-medium">{batch?.original_filename}</span>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded ${statusPill}`}>
                    {batch?.status}
                  </span>
                </div>
              </div>

              {/* Course Assignment */}
              {batch?.status !== 'committed' && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign to Course
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={selectedCourse || batch?.course_id || ''}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Select a course</option>
                      {courses?.map((course: any) => (
                        <option key={course.id} value={course.id}>
                          {course.name} ({course.code})
                        </option>
                      ))}
                    </select>
                    <Button
                      onClick={() => selectedCourse && assignCourseMutation.mutate(selectedCourse)}
                      disabled={!selectedCourse || assignCourseMutation.isPending}
                    >
                      Assign
                    </Button>
                  </div>
                </div>
              )}

              {/* Import Mode */}
              {batch?.status !== 'committed' && batch?.course_id && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Import Mode
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="add_only"
                        checked={importMode === 'add_only'}
                        onChange={(e) => setImportMode(e.target.value)}
                        className="mr-2"
                      />
                      <span>Add Only - Create new students only</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="add_or_update"
                        checked={importMode === 'add_or_update'}
                        onChange={(e) => setImportMode(e.target.value)}
                        className="mr-2"
                      />
                      <span>Add or Update - Create or update existing students</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="sync_with_deactivation"
                        checked={importMode === 'sync_with_deactivation'}
                        onChange={(e) => setImportMode(e.target.value)}
                        className="mr-2"
                      />
                      <span>Sync with Deactivation - Full sync, remove missing</span>
                    </label>
                  </div>
                  <Button
                    onClick={() => setModeMutation.mutate(importMode)}
                    disabled={setModeMutation.isPending}
                    className="mt-3"
                  >
                    Set Import Mode
                  </Button>
                </div>
              )}

              {/* Commit Button */}
              {batch?.status === 'ready_to_commit' && (
                <div className="mt-6">
                  <Button
                    onClick={() => commitMutation.mutate()}
                    disabled={commitMutation.isPending}
                    variant="default"
                  >
                    {commitMutation.isPending ? 'Committing...' : 'Commit Import'}
                  </Button>
                </div>
              )}
            </div>

            {/* Preview Rows */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold">Preview ({previewRows.length} rows shown)</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Row #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">First Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gender</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Program</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previewRows.map((row: any) => (
                      <tr key={row.row_number}>
                        <td className="px-6 py-4 text-sm text-gray-500">{row.row_number}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {row.parsed_student_id || row.raw_student_id}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{row.raw_first_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{row.raw_last_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{row.raw_gender || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{row.raw_program || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )

  if (theme === 'a2') {
    return (
      <AdminA2Layout user={user} onLogout={handleLogout}>
        <section className="space-y-6">
          <Link
            href="/admin/imports"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Yüklemelere Dön
          </Link>

          {isLoading || !batch ? (
            <div className="rounded-3xl border border-gray-100 p-10 text-center text-gray-500 bg-white">
              Yükleme detayları getiriliyor...
            </div>
          ) : (
            <>
              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
                <div className="flex flex-col gap-1">
                  <p className="text-sm uppercase tracking-[0.2em] text-gray-400">Yükleme Detayı</p>
                  <h1 className="text-2xl font-semibold text-gray-900">{batch.original_filename}</h1>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        batch.status === 'committed'
                          ? 'bg-emerald-50 text-emerald-600'
                          : batch.status === 'ready_to_commit'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-amber-50 text-amber-600'
                      }`}
                    >
                      {batch.status === 'committed'
                        ? 'Tamamlandı'
                        : batch.status === 'ready_to_commit'
                        ? 'Onaya Hazır'
                        : 'Bekliyor'}
                    </span>
                    <span>{previewRows.length} satır önizleniyor</span>
                  </div>
                </div>

                {batch.status !== 'committed' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Ders Ataması</p>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <select
                          value={selectedCourse || batch.course_id || ''}
                          onChange={(e) => {
                            const value = e.target.value
                            console.log('[Import] Course selected:', value, 'Type:', typeof value)
                            setSelectedCourse(value)
                          }}
                          className="flex-1 rounded-2xl border border-gray-200 px-4 py-2 text-sm"
                        >
                          <option value="">Ders seçin</option>
                          {courses?.map((course: any) => {
                            const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(course.id)
                            if (!isValidUUID) {
                              console.warn(`[Import] Invalid UUID for course: ${course.name} - ID: ${course.id}`)
                            }
                            return (
                              <option key={course.id} value={course.id}>
                                {course.name} ({course.code})
                              </option>
                            )
                          })}
                        </select>
                        <Button
                          onClick={() => selectedCourse && assignCourseMutation.mutate(selectedCourse)}
                          disabled={!selectedCourse || assignCourseMutation.isPending}
                          className="rounded-full"
                        >
                          {assignCourseMutation.isPending ? 'Atanıyor...' : 'Dersi Ata'}
                        </Button>
                      </div>
                    </div>

                    { (batch.course_id || selectedCourse) && (
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">İçe Aktarma Modu</p>
                        <div className="grid grid-cols-1 gap-2">
                          {[
                            { value: 'add_only', label: 'Sadece Ekle', desc: 'Yeni kayıtlar eklenir.' },
                            {
                              value: 'add_or_update',
                              label: 'Ekle veya Güncelle',
                              desc: 'Var olan öğrenciler güncellenir.',
                            },
                            {
                              value: 'sync_with_deactivation',
                              label: 'Tam Senkron + Pasifleştirme',
                              desc: 'Listede olmayan öğrenciler pasifleştirilir.',
                            },
                          ].map((option) => (
                            <label
                              key={option.value}
                              className={`border rounded-2xl px-4 py-3 cursor-pointer transition ${
                                importMode === option.value
                                  ? 'border-gray-900 bg-gray-900/5'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <input
                                type="radio"
                                value={option.value}
                                checked={importMode === option.value}
                                onChange={(e) => setImportMode(e.target.value)}
                                className="mr-2"
                              />
                              <span className="font-medium text-gray-900">{option.label}</span>
                              <p className="text-xs text-gray-500 mt-1">{option.desc}</p>
                            </label>
                          ))}
                        </div>
                        <Button
                          onClick={() => setModeMutation.mutate(importMode)}
                          disabled={setModeMutation.isPending}
                          className="mt-3 rounded-full"
                        >
                          {setModeMutation.isPending ? 'Kaydediliyor...' : 'Modu Kaydet'}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {batch.status === 'ready_to_commit' && (
                  <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
                    <p className="text-sm text-gray-500 flex-1">
                      Ders ve mod belirlendi, içe aktarmayı tamamlayabilirsiniz.
                    </p>
                    <Button
                      onClick={() => commitMutation.mutate()}
                      disabled={commitMutation.isPending}
                      className="rounded-full bg-[#0C2A5E] hover:bg-[#123679]"
                    >
                      {commitMutation.isPending ? 'İşleniyor...' : 'İçe Aktarmayı Tamamla'}
                    </Button>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                <div className="flex flex-col gap-1 mb-4">
                  <p className="text-sm uppercase tracking-[0.2em] text-gray-400">Önizleme</p>
                  <h2 className="text-lg font-semibold text-gray-900">
                    İlk {previewRows.length} Satır
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100 text-sm">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                      <tr>
                        <th className="px-6 py-3 text-left">Satır</th>
                        <th className="px-6 py-3 text-left">Öğrenci ID</th>
                        <th className="px-6 py-3 text-left">Ad</th>
                        <th className="px-6 py-3 text-left">Soyad</th>
                        <th className="px-6 py-3 text-left">Cinsiyet</th>
                        <th className="px-6 py-3 text-left">Program</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      {previewRows.map((row: any) => (
                        <tr key={row.row_number} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                            #{row.row_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-medium">
                            {row.parsed_student_id || row.raw_student_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">{row.raw_first_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{row.raw_last_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{row.raw_gender || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{row.raw_program || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </section>
      </AdminA2Layout>
    )
  }

  return legacyContent
}

