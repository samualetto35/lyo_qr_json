'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authService } from '@/lib/auth'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export default function TeacherCourseAttendancePage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.courseId as string
  const queryClient = useQueryClient()
  const [user, setUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    session_name: '',
    session_date: new Date().toISOString().split('T')[0],
    duration_minutes: 60,
  })

  useEffect(() => {
    setMounted(true)
    const currentUser = authService.getUser()
    setUser(currentUser)
    
    if (!currentUser || currentUser.role !== 'teacher') {
      router.push('/login/teacher')
    }
  }, [router])

  const { data: attendance, isLoading } = useQuery({
    queryKey: ['teacher-course-attendance', courseId],
    queryFn: async () => {
      const response = await api.get(`/teacher/courses/${courseId}/attendance`)
      return response.data
    },
    enabled: !!courseId && !!user,
  })

  const createSessionMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.post(`/teacher/courses/${courseId}/attendance-sessions`, data)
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-course-attendance', courseId] })
      setShowModal(false)
      // Navigate to session detail page to show QR
      router.push(`/teacher/attendance-sessions/${response.data.attendance_session_id}`)
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to create session')
    },
  })

  const handleLogout = () => {
    authService.logout()
    router.push('/login/teacher')
  }

  if (!mounted || !user) return null

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href={`/teacher/courses/${courseId}`} className="text-primary-600 hover:text-primary-700">
              ← Back to Course
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Attendance Sessions</h1>
          </div>
          <button onClick={handleLogout} className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900">
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Start Session Button */}
        <div className="mb-6">
          <Button onClick={() => setShowModal(true)} size="lg" className="w-full md:w-auto">
            🎯 Start New Attendance Session
          </Button>
        </div>

        {/* Sessions List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Past Sessions</h2>
          </div>
          {isLoading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : attendance && attendance.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No attendance sessions yet. Click the button above to start your first session!
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Session Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Present/Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendance?.map((session: any) => (
                  <tr key={session.session_id}>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {session.session_name || 'Untitled Session'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(session.session_date)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 text-xs font-semibold rounded-full ${
                        session.is_open ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {session.is_open ? 'Open' : 'Closed'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {session.present_count} / {session.total_students}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Link
                        href={`/teacher/attendance-sessions/${session.session_id}`}
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

      {/* Create Session Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Start Attendance Session</h3>
            <form onSubmit={(e) => {
              e.preventDefault()
              createSessionMutation.mutate(formData)
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Name
                  </label>
                  <input
                    type="text"
                    value={formData.session_name}
                    onChange={(e) => setFormData({ ...formData, session_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="e.g., Week 3 - Lecture"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Date
                  </label>
                  <input
                    type="date"
                    value={formData.session_date}
                    onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="240"
                    value={formData.duration_minutes}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 60 : parseInt(e.target.value) || 60
                      setFormData({ ...formData, duration_minutes: value })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Session will auto-close after this duration (max 240 minutes)
                  </p>
                </div>
              </div>
              <div className="mt-6 flex gap-2">
                <Button type="submit" disabled={createSessionMutation.isPending}>
                  {createSessionMutation.isPending ? 'Creating...' : 'Create Session'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

