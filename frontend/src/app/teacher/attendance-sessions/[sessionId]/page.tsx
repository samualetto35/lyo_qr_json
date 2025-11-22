'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authService } from '@/lib/auth'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { formatDateTime } from '@/lib/utils'
import QRCode from 'qrcode.react'

export default function TeacherAttendanceSessionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const sessionId = params.sessionId as string
  const queryClient = useQueryClient()
  const [user, setUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const [showAddStudentModal, setShowAddStudentModal] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState('')

  useEffect(() => {
    setMounted(true)
    const currentUser = authService.getUser()
    setUser(currentUser)
    
    if (!currentUser || currentUser.role !== 'teacher') {
      router.push('/login/teacher')
    }
  }, [router])

  const { data: sessionData, isLoading, refetch } = useQuery({
    queryKey: ['teacher-session-detail', sessionId],
    queryFn: async () => {
      const response = await api.get(`/teacher/attendance-sessions/${sessionId}`)
      return response.data
    },
    enabled: !!sessionId && !!user,
    refetchInterval: (data) => data?.session?.is_open ? 5000 : false, // Only refresh if session is open
  })

  const { data: eligibleStudents } = useQuery({
    queryKey: ['eligible-students', sessionId],
    queryFn: async () => {
      const response = await api.get(`/teacher/attendance-sessions/${sessionId}/eligible-students`)
      return response.data
    },
    enabled: !!sessionId && !!user && showAddStudentModal,
  })

  const closeSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/teacher/attendance-sessions/${sessionId}/close`, {})
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-session-detail', sessionId] })
      queryClient.invalidateQueries({ queryKey: ['teacher-course-attendance'] })
      refetch()
    },
    onError: (error: any) => {
      console.error('Close session error:', error)
      alert(error.response?.data?.message || 'Failed to close session')
    },
  })

  const addStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      return await api.post(`/teacher/attendance-sessions/${sessionId}/add-student`, {
        student_id: studentId,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-session-detail', sessionId] })
      queryClient.invalidateQueries({ queryKey: ['eligible-students', sessionId] })
      setShowAddStudentModal(false)
      setSelectedStudentId('')
      refetch()
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to add student')
    },
  })

  const removeStudentMutation = useMutation({
    mutationFn: async (recordId: string) => {
      return await api.delete(`/teacher/attendance-records/${recordId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-session-detail', sessionId] })
      queryClient.invalidateQueries({ queryKey: ['eligible-students', sessionId] })
      refetch()
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to remove student')
    },
  })

  const handleLogout = () => {
    authService.logout()
    router.push('/login/teacher')
  }

  if (!mounted || !user) return null

  const session = sessionData?.session
  const records = sessionData?.records || []
  const qrUrl = session?.is_open ? `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/attendance/qr?session_id=${sessionId}&token=${session.qr_token}` : null

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="text-primary-600 hover:text-primary-700">
              ← Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Attendance Session</h1>
          </div>
          <button onClick={handleLogout} className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900">
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <>
            {/* Session Info & QR Code */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Session Details */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Session Information</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Course:</span>
                    <span className="font-medium">{session?.course.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Session:</span>
                    <span className="font-medium">{session?.session_name || 'Untitled'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date:</span>
                    <span className="font-medium">{session?.session_date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status:</span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                      session?.is_open ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {session?.is_open ? 'Open' : 'Closed'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Submissions:</span>
                    <span className="font-medium">{records.length}</span>
                  </div>
                </div>

                {session?.is_open && (
                  <div className="mt-6">
                    <Button
                      onClick={() => closeSessionMutation.mutate()}
                      disabled={closeSessionMutation.isPending}
                      variant="destructive"
                      className="w-full"
                    >
                      {closeSessionMutation.isPending ? 'Closing...' : 'Close Session'}
                    </Button>
                  </div>
                )}
              </div>

              {/* QR Code */}
              {session?.is_open && qrUrl ? (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold mb-4">QR Code for Students</h2>
                  <div className="flex flex-col items-center">
                    <div className="bg-white p-4 rounded-lg border-4 border-primary-600">
                      <QRCode value={qrUrl} size={256} />
                    </div>
                    <p className="text-sm text-gray-600 mt-4 text-center">
                      Students should scan this QR code to mark their attendance
                    </p>
                    <div className="mt-4 w-full">
                      <input
                        type="text"
                        value={qrUrl}
                        readOnly
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md bg-gray-50"
                        onClick={(e) => e.currentTarget.select()}
                      />
                      <p className="text-xs text-gray-500 mt-1 text-center">
                        Click to copy the link
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-6 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <p className="font-medium">Session Closed</p>
                    <p className="text-sm mt-2">QR code is no longer available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Attendance Records */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold">Attendance Records ({records.length})</h2>
                <div className="flex items-center gap-3">
                  {session?.is_open && (
                    <span className="text-sm text-green-600 animate-pulse">● Live Updates</span>
                  )}
                  <Button 
                    onClick={() => setShowAddStudentModal(true)}
                    size="sm"
                    variant="outline"
                  >
                    + Add Student
                  </Button>
                </div>
              </div>
              {records.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No submissions yet. Students will appear here in real-time.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Student ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Submitted At
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Via
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {records.map((record: any) => (
                        <tr key={record.id}>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {record.student_id}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {record.student_name}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 text-xs font-semibold rounded-full ${
                              record.status === 'present' || record.status === 'manual_present'
                                ? 'bg-green-100 text-green-800'
                                : record.status === 'flagged'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {record.status}
                            </span>
                            {record.fraud_flag_reason && (
                              <p className="text-xs text-red-600 mt-1">{record.fraud_flag_reason}</p>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {formatDateTime(record.submitted_at)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {record.submitted_via}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => {
                                if (confirm(`Remove ${record.student_name} from this session?`)) {
                                  removeStudentMutation.mutate(record.id)
                                }
                              }}
                              disabled={removeStudentMutation.isPending}
                              className="text-red-600 hover:text-red-900 text-sm font-medium disabled:opacity-50"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Add Student to Session</h3>
            <p className="text-sm text-gray-600 mb-4">
              Select a student who is enrolled in this course but hasn't submitted attendance yet.
            </p>
            
            {eligibleStudents && eligibleStudents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>All enrolled students have already submitted attendance.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {eligibleStudents?.map((student: any) => (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudentId(student.id)}
                    className={`w-full text-left px-4 py-3 border rounded-md hover:bg-gray-50 transition ${
                      selectedStudentId === student.id
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{student.full_name}</div>
                    <div className="text-sm text-gray-500">ID: {student.student_id}</div>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-6 flex gap-2">
              <Button
                onClick={() => {
                  if (selectedStudentId) {
                    addStudentMutation.mutate(selectedStudentId)
                  } else {
                    alert('Please select a student')
                  }
                }}
                disabled={!selectedStudentId || addStudentMutation.isPending}
              >
                {addStudentMutation.isPending ? 'Adding...' : 'Add Student'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddStudentModal(false)
                  setSelectedStudentId('')
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

