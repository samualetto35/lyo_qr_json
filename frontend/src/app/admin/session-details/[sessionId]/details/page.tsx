'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { authService } from '@/lib/auth'
import api from '@/lib/api'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { formatDate, formatDateTime } from '@/lib/utils'

export default function AdminSessionDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const sessionId = params.sessionId as string
  const [user, setUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  
  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    setMounted(true)
    const currentUser = authService.getUser()
    setUser(currentUser)
    
    if (!currentUser || currentUser.role !== 'admin') {
      router.push('/login/admin')
    }
  }, [router])

  // Get session details
  const { data: sessionDetails, isLoading } = useQuery({
    queryKey: ['admin-session-details', sessionId, search, statusFilter],
    queryFn: async () => {
      const params: any = {}
      if (search) params.search = search
      if (statusFilter) params.status_filter = statusFilter
      
      const response = await api.get(`/admin/session-details/${sessionId}`, { params })
      return response.data
    },
    enabled: !!user && !!sessionId,
  })

  const handleLogout = () => {
    authService.logout()
    router.push('/login/admin')
  }

  if (!mounted || !user) return null

  const session = sessionDetails?.session
  const course = sessionDetails?.course
  const teacher = sessionDetails?.teacher
  const stats = sessionDetails?.statistics
  const presentStudents = sessionDetails?.present_students || []
  const absentStudents = sessionDetails?.absent_students || []

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin/attendance" className="text-primary-600 hover:text-primary-700">
              ← Back to Attendance
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Session Details</h1>
          </div>
          <button onClick={handleLogout} className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900">
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : !sessionDetails ? (
          <div className="text-center py-8 text-gray-500">Session not found</div>
        ) : (
          <>
            {/* Session Info Card */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Session Name</h3>
                  <p className="text-lg font-semibold text-gray-900">
                    {session?.session_name || 'Untitled Session'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Course</h3>
                  <p className="text-lg font-semibold text-gray-900">{course?.name}</p>
                  <p className="text-sm text-gray-500">{course?.code}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Teacher</h3>
                  <p className="text-lg font-semibold text-gray-900">{teacher?.name}</p>
                  <p className="text-sm text-gray-500">{teacher?.email}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Date & Status</h3>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatDate(session?.session_date)}
                  </p>
                  <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                    session?.is_open 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {session?.is_open ? 'Open' : 'Closed'}
                  </span>
                </div>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-blue-50 rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-blue-600 mb-2">Total Enrolled</h3>
                <p className="text-3xl font-bold text-blue-900">{stats?.total_enrolled || 0}</p>
              </div>
              <div className="bg-green-50 rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-green-600 mb-2">Present</h3>
                <p className="text-3xl font-bold text-green-900">{stats?.total_present || 0}</p>
                <p className="text-sm text-green-700 mt-1">
                  {stats?.total_enrolled > 0 
                    ? Math.round((stats.total_present / stats.total_enrolled) * 100) 
                    : 0}% attendance
                </p>
              </div>
              <div className="bg-red-50 rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-red-600 mb-2">Absent</h3>
                <p className="text-3xl font-bold text-red-900">{stats?.total_absent || 0}</p>
                <p className="text-sm text-red-700 mt-1">
                  {stats?.total_enrolled > 0 
                    ? Math.round((stats.total_absent / stats.total_enrolled) * 100) 
                    : 0}% missing
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Filter Students</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <input
                    type="text"
                    placeholder="Search by ID or name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">All Students</option>
                    <option value="present">Present Only</option>
                    <option value="absent">Absent Only</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Present Students */}
            {(!statusFilter || statusFilter === 'present') && presentStudents.length > 0 && (
              <div className="bg-white rounded-lg shadow mb-6">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-green-700">
                    ✓ Present Students ({presentStudents.length})
                  </h2>
                </div>
                <div className="p-6">
                  <div className="flex flex-wrap gap-2">
                    {presentStudents.map((student: any) => (
                      <div
                        key={student.id}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg hover:shadow-md transition"
                      >
                        <span className="px-2 py-1 bg-green-200 text-green-800 text-xs font-bold rounded">
                          {student.student_id}
                        </span>
                        <span className="text-sm font-medium text-green-900">
                          {student.full_name}
                        </span>
                        {student.submitted_via === 'manual' && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                            Manual
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Absent Students */}
            {(!statusFilter || statusFilter === 'absent') && absentStudents.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-red-700">
                    ✗ Absent Students ({absentStudents.length})
                  </h2>
                </div>
                <div className="p-6">
                  <div className="flex flex-wrap gap-2">
                    {absentStudents.map((student: any) => (
                      <div
                        key={student.id}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg hover:shadow-md transition"
                      >
                        <span className="px-2 py-1 bg-red-200 text-red-800 text-xs font-bold rounded">
                          {student.student_id}
                        </span>
                        <span className="text-sm font-medium text-red-900">
                          {student.full_name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* No Results */}
            {presentStudents.length === 0 && absentStudents.length === 0 && (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                No students found matching your filters.
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

