'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { authService } from '@/lib/auth'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'

export default function StudentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const studentId = params.id as string
  const [user, setUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const [courseFilter, setCourseFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    setMounted(true)
    const currentUser = authService.getUser()
    setUser(currentUser)

    if (!currentUser || currentUser.role !== 'admin') {
      router.push('/login/admin')
    }
  }, [router])

  const { data: student, isLoading } = useQuery({
    queryKey: ['admin-student-detail', studentId],
    queryFn: async () => {
      const response = await api.get(`/admin/students/${studentId}`)
      return response.data
    },
    enabled: !!user && !!studentId,
  })

  if (!mounted || !user) return null

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500">Student not found</p>
            <Link href="/admin/students">
              <Button className="mt-4">Back to Students</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin/students" className="text-primary-600 hover:text-primary-700">
              ← Back to Students
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{student.full_name}</h1>
              <p className="text-sm text-gray-600">
                {student.student_id} {student.program && `• ${student.program}`}
              </p>
            </div>
          </div>
          <Button onClick={() => authService.logout()} variant="outline">
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Student Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Student Information</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Student ID</p>
              <p className="font-medium">{student.student_id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">{student.full_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Gender</p>
              <p className="font-medium">{student.gender || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Program</p>
              <p className="font-medium">{student.program || '-'}</p>
            </div>
          </div>
        </div>

        {/* Medical Reports */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Medical Reports ({student.medical_reports?.length || 0})</h2>
          {student.medical_reports && student.medical_reports.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Report Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Doctor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Created At
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {student.medical_reports.map((report: any) => (
                    <tr key={report.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(report.report_date).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.doctor_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(report.created_at).toLocaleDateString('tr-TR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No medical reports found</p>
          )}
        </div>

        {/* Filters */}
        {student.courses && student.courses.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Course</label>
                <Select value={courseFilter} onValueChange={setCourseFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Courses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {student.courses.map((course: any) => (
                      <SelectItem key={course.course_id} value={course.course_id}>
                        {course.course_code} - {course.course_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="medical_report">Medical Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Courses and Attendance */}
        {student.courses && student.courses.length > 0 && (
          <div className="space-y-6">
            {student.courses
              .filter((course: any) => courseFilter === 'all' || course.course_id === courseFilter)
              .map((course: any) => {
                // Filter attendance records by status
                const filteredRecords = course.attendance_records?.filter((record: any) => {
                  if (statusFilter === 'all') return true
                  if (statusFilter === 'present') {
                    return record.status === 'present' || record.status === 'manual_present'
                  }
                  if (statusFilter === 'absent') {
                    return record.status === 'absent'
                  }
                  if (statusFilter === 'medical_report') {
                    return record.status === 'medical_report'
                  }
                  return true
                }) || []

                return (
              <div key={course.course_id} className="bg-white rounded-lg shadow p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">{course.course_name}</h3>
                  <p className="text-sm text-gray-600">{course.course_code}</p>
                </div>

                {/* Course Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded">
                    <p className="text-sm text-blue-600">Total Sessions</p>
                    <p className="text-2xl font-bold text-blue-900">{course.total_sessions}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded">
                    <p className="text-sm text-green-600">Present</p>
                    <p className="text-2xl font-bold text-green-900">{course.present_count}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded">
                    <p className="text-sm text-red-600">Absent</p>
                    <p className="text-2xl font-bold text-red-900">{course.absent_count}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded">
                    <p className="text-sm text-purple-600">Medical Reports</p>
                    <p className="text-2xl font-bold text-purple-900">{course.medical_report_count || 0}</p>
                  </div>
                </div>

                {/* Attendance Rate */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Attendance Rate</span>
                    <span className="text-sm font-bold">{course.attendance_rate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        course.attendance_rate >= 75
                          ? 'bg-green-500'
                          : course.attendance_rate >= 50
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${course.attendance_rate}%` }}
                    />
                  </div>
                </div>

                {/* Session Details */}
                <div>
                  <h4 className="text-md font-semibold mb-3">Session Details</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Date
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Session
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Submitted At
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredRecords.length > 0 ? (
                          filteredRecords.map((record: any) => (
                            <tr key={record.session_id}>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                {new Date(record.session_date).toLocaleDateString('tr-TR')}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {record.session_name || '-'}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap">
                                {record.status === 'present' || record.status === 'manual_present' ? (
                                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                    Present
                                  </span>
                                ) : record.status === 'medical_report' ? (
                                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                    Medical Report
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                    Absent
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                {record.submitted_at
                                  ? new Date(record.submitted_at).toLocaleString('tr-TR')
                                  : '-'}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-4 py-4 text-center text-gray-500">
                              No attendance records
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
                )
              })}
          </div>
        )}
      </main>
    </div>
  )
}

