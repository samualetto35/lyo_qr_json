'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authService } from '@/lib/auth'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function AdminImportBatchDetailPage() {
  const router = useRouter()
  const params = useParams()
  const batchId = params.batchId as string
  const queryClient = useQueryClient()
  const [user, setUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState('')
  const [importMode, setImportMode] = useState('add_only')

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
    enabled: !!user,
    enabled: !!batchId,
  })

  const { data: courses } = useQuery({
    queryKey: ['courses-for-import'],
    queryFn: async () => {
      const response = await api.get('/admin/courses')
      return response.data
    },
    enabled: !!user,
  })

  const assignCourseMutation = useMutation({
    mutationFn: async (courseId: string) => {
      return await api.post(`/admin/import/students/batches/${batchId}/assign-course`, {
        course_id: courseId,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import-batch', batchId] })
      alert('Course assigned successfully!')
    },
  })

  const setModeMutation = useMutation({
    mutationFn: async (mode: string) => {
      return await api.post(`/admin/import/students/batches/${batchId}/set-mode`, {
        import_mode: mode,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import-batch', batchId] })
      alert('Import mode set successfully!')
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

  if (!mounted || !user) return null

  return (
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
                  <span className="ml-2 font-medium">{batchData?.batch.original_filename}</span>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded ${
                    batchData?.batch.status === 'committed' ? 'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {batchData?.batch.status}
                  </span>
                </div>
              </div>

              {/* Course Assignment */}
              {batchData?.batch.status !== 'committed' && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign to Course
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={selectedCourse || batchData?.batch.course_id || ''}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Select a course</option>
                      {courses?.map((course: any) => (
                        <option key={course.id} value={course.id}>
                          {course.name} ({course.code}) - {course.teacher.name}
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
              {batchData?.batch.status !== 'committed' && batchData?.batch.course_id && (
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
              {batchData?.batch.status === 'ready_to_commit' && (
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
                <h2 className="text-lg font-semibold">Preview ({batchData?.rows.length} rows shown)</h2>
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
                    {batchData?.rows.map((row: any) => (
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
}

