'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { authService } from '@/lib/auth'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

export default function AdminCourseAttendancePage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.courseId as string
  const [user, setUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setMounted(true)
    const currentUser = authService.getUser()
    setUser(currentUser)
    
    if (!currentUser || currentUser.role !== 'admin') {
      router.push('/login/admin')
    }
  }, [router])

  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['admin-course-attendance', courseId, search],
    queryFn: async () => {
      const response = await api.get(`/admin/courses/${courseId}/attendance`, {
        params: { q: search },
      })
      return response.data
    },
    enabled: !!user && !!courseId,
  })

  if (!mounted || !user) return null

  const course = attendanceData?.course
  const students = attendanceData?.students || []

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/courses" className="text-primary-600 hover:text-primary-700">
                ← Back to Courses
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Course Attendance - {course?.name || 'Loading...'}
                </h1>
                {course?.code && (
                  <p className="text-sm text-gray-500 mt-1">Course Code: {course.code}</p>
                )}
              </div>
            </div>
            <Button onClick={() => authService.logout()} variant="outline">
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics */}
        {attendanceData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-500">Total Students</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">
                {attendanceData.total_students || 0}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-500">Total Sessions</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">
                {attendanceData.total_sessions || 0}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-500">Avg. Attendance Rate</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">
                {students.length > 0
                  ? Math.round(
                      students.reduce((sum: number, s: any) => sum + s.attendance_rate, 0) /
                        students.length
                    )
                  : 0}
                %
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <Input
            type="text"
            placeholder="Search by student ID or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">
              Students with Attendance ({students.length})
            </h2>
          </div>
          {isLoading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : students.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No students found.</div>
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
                      Gender
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Program
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Present
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Absent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Attendance Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student: any) => {
                    // Conditional formatting
                    let rowBgClass = 'hover:bg-gray-50'
                    if (student.absent_count >= 3) {
                      rowBgClass = 'bg-red-50 hover:bg-red-100'
                    } else if (student.absent_count === 2) {
                      rowBgClass = 'bg-yellow-50 hover:bg-yellow-100'
                    }

                    return (
                      <tr key={student.id} className={rowBgClass}>
                        <td className="px-6 py-4 text-sm font-mono font-medium text-gray-900">
                          {student.student_id}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {student.full_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {student.gender || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {student.program || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-green-600 font-medium">
                          {student.present_count}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {student.absent_count > 0 ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              {student.absent_count}
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              ✓ 0
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 min-w-[100px]">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    student.attendance_rate >= 75
                                      ? 'bg-green-500'
                                      : student.attendance_rate >= 50
                                      ? 'bg-yellow-500'
                                      : 'bg-red-500'
                                  }`}
                                  style={{ width: `${student.attendance_rate}%` }}
                                />
                              </div>
                            </div>
                            <div className="text-xs font-medium whitespace-nowrap min-w-[45px]">
                              {student.attendance_rate}%
                            </div>
                            <div className="text-xs text-gray-500">
                              ({student.present_count}/{student.total_sessions})
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 bg-white rounded-lg shadow p-4">
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-50 border border-yellow-300 rounded"></div>
              <span className="text-gray-600">2 absences</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-50 border border-red-300 rounded"></div>
              <span className="text-gray-600">3+ absences</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

