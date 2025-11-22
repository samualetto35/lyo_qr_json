'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { authService } from '@/lib/auth'
import api from '@/lib/api'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function TeacherCourseDetailPage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.courseId as string
  const [user, setUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'students' | 'attendance'>('students')
  const [search, setSearch] = useState('')

  useEffect(() => {
    setMounted(true)
    const currentUser = authService.getUser()
    setUser(currentUser)
    
    if (!currentUser || currentUser.role !== 'teacher') {
      router.push('/login/teacher')
    }
  }, [router])

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['teacher-course-students', courseId, search],
    queryFn: async () => {
      const response = await api.get(`/teacher/courses/${courseId}/students`, {
        params: { q: search },
      })
      return response.data
    },
    enabled: !!courseId && activeTab === 'students' && !!user,
  })

  if (!mounted || !user) return null

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/teacher/courses" className="text-primary-600 hover:text-primary-700">
              ← Back to Courses
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Course Details</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="mb-6">
          <Link href={`/teacher/courses/${courseId}/attendance`}>
            <Button size="lg" className="w-full md:w-auto">
              🎯 Start Attendance Session
            </Button>
          </Link>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('students')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'students'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Students
              </button>
              <button
                onClick={() => setActiveTab('attendance')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'attendance'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Attendance History
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'students' && (
              <div>
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search by student ID or name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                {studentsLoading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : students && students.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No students enrolled in this course yet.
                    <p className="text-sm mt-2">Contact your admin to import student rosters.</p>
                  </div>
                ) : (
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
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {students?.map((student: any) => (
                        <tr key={student.student_id}>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {student.student_id}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {student.first_name} {student.last_name}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{student.gender || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{student.program || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {activeTab === 'attendance' && (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">View attendance history for this course</p>
                <Link href={`/teacher/courses/${courseId}/attendance`}>
                  <Button>Go to Attendance</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

