'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { authService } from '@/lib/auth'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'

export default function AdminStudentsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const [search, setSearch] = useState('')
  const [courseFilter, setCourseFilter] = useState('')
  const [absenceFilter, setAbsenceFilter] = useState('all') // 'all', '2', '3+'
  const [sortBy, setSortBy] = useState('student_id')
  const [sortOrder, setSortOrder] = useState('asc')
  const [page, setPage] = useState(1)
  const limit = 20

  useEffect(() => {
    setMounted(true)
    const currentUser = authService.getUser()
    setUser(currentUser)

    if (!currentUser || currentUser.role !== 'admin') {
      router.push('/login/admin')
    }
  }, [router])

  const { data: studentsData, isLoading } = useQuery({
    queryKey: ['admin-students', search, courseFilter, sortBy, sortOrder, page],
    queryFn: async () => {
      const response = await api.get('/admin/students', {
        params: {
          search: search || undefined,
          course_id: courseFilter || undefined,
          sort_by: sortBy,
          sort_order: sortOrder,
          page,
          limit,
        },
      })
      return response.data
    },
    enabled: !!user,
  })

  // Filter students by absence count
  const filteredStudents = studentsData?.data ? (() => {
    if (absenceFilter === 'all') return studentsData.data
    
    return studentsData.data.filter((student: any) => {
      if (absenceFilter === '2') {
        // At least one course with exactly 2 absences
        return student.courses.some((course: any) => course.absent_count === 2)
      } else if (absenceFilter === '3+') {
        // At least one course with 3+ absences
        return student.courses.some((course: any) => course.absent_count >= 3)
      }
      return true
    })
  })() : []

  const students = studentsData ? {
    ...studentsData,
    data: filteredStudents,
    total: filteredStudents.length,
  } : null

  const { data: courses } = useQuery({
    queryKey: ['courses-list'],
    queryFn: async () => {
      const response = await api.get('/admin/courses')
      return response.data
    },
    enabled: !!user,
  })

  if (!mounted || !user) return null

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="text-primary-600 hover:text-primary-700">
              ← Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          </div>
          <Button onClick={() => authService.logout()} variant="outline">
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Filter Students</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search by ID or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Courses</SelectItem>
                {courses?.data?.map((course: any) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name} ({course.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={absenceFilter} onValueChange={setAbsenceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Absence Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                <SelectItem value="2">2 Absences</SelectItem>
                <SelectItem value="3+">3+ Absences</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student_id">Student ID</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
              </Button>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Students ({students?.total || 0})</h2>
              {absenceFilter !== 'all' && (
                <p className="text-xs text-gray-500 mt-1">
                  Filtered: {absenceFilter === '2' ? 'Students with exactly 2 absences in any course' : 'Students with 3+ absences in any course'}
                </p>
              )}
            </div>
            <div className="flex gap-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-yellow-50 border border-yellow-300 rounded"></div>
                <span className="text-gray-600">2 absences</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-red-50 border border-red-300 rounded"></div>
                <span className="text-gray-600">3+ absences</span>
              </div>
            </div>
          </div>
          {isLoading ? (
            <div className="p-8 text-center">Loading students...</div>
          ) : students?.data.length === 0 ? (
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
                      Program
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Courses
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Overall Attendance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Course Absences
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students?.data.map((student: any) => {
                    // Get max absence count across all courses for conditional formatting
                    const maxAbsences = Math.max(...student.courses.map((c: any) => c.absent_count || 0), 0)
                    const has2Absences = student.courses.some((c: any) => c.absent_count === 2)
                    const has3PlusAbsences = student.courses.some((c: any) => c.absent_count >= 3)
                    
                    // Conditional formatting background
                    let rowBgClass = 'hover:bg-gray-50'
                    if (has3PlusAbsences) {
                      rowBgClass = 'bg-red-50 hover:bg-red-100'
                    } else if (has2Absences) {
                      rowBgClass = 'bg-yellow-50 hover:bg-yellow-100'
                    }
                    
                    return (
                    <tr key={student.id} className={rowBgClass}>
                      <td className="px-6 py-4 text-sm font-mono font-medium text-gray-900">
                        {student.student_id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="font-medium">{student.full_name}</div>
                        {student.gender && (
                          <div className="text-xs text-gray-500">{student.gender}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {student.program || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex flex-wrap gap-1">
                          {student.courses.map((course: any) => (
                            <span
                              key={course.course_id}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                            >
                              {course.course_code}
                            </span>
                          ))}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {student.total_courses} {student.total_courses === 1 ? 'course' : 'courses'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  student.overall_attendance_rate >= 75
                                    ? 'bg-green-500'
                                    : student.overall_attendance_rate >= 50
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                }`}
                                style={{ width: `${student.overall_attendance_rate}%` }}
                              />
                            </div>
                          </div>
                          <div className="text-xs font-medium whitespace-nowrap">
                            {student.overall_attendance_rate}%
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {student.total_present}/{student.total_sessions} sessions
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {student.courses.length > 0 ? (
                          <div className="space-y-2">
                            {student.courses.map((course: any) => (
                              <div key={course.course_id} className="border-l-2 border-gray-200 pl-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-semibold text-gray-800 min-w-[80px]">
                                    {course.course_code}
                                  </span>
                                  {course.medical_report_count > 0 && (
                                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                      {course.medical_report_count} raporlu
                                    </span>
                                  )}
                                  {course.absent_count > 0 ? (
                                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                      {course.absent_count} absent
                                    </span>
                                  ) : course.medical_report_count === 0 ? (
                                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                      ✓ Perfect
                                    </span>
                                  ) : null}
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 min-w-[80px]">
                                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                                      <div
                                        className={`h-1.5 rounded-full ${
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
                                  <span className="text-xs text-gray-600 font-medium min-w-[60px]">
                                    {course.attendance_rate}%
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    ({course.present_count}/{course.total_sessions})
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {students && students.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Page {students.page} of {students.totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= students.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

