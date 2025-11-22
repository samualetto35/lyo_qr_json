'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authService } from '@/lib/auth'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function TeacherCoursesPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [user, setUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
  })

  useEffect(() => {
    setMounted(true)
    const currentUser = authService.getUser()
    setUser(currentUser)
    
    if (!currentUser || currentUser.role !== 'teacher') {
      router.push('/login/teacher')
    }
  }, [router])

  const { data: courses, isLoading } = useQuery({
    queryKey: ['teacher-courses'],
    queryFn: async () => {
      const response = await api.get('/teacher/courses')
      return response.data
    },
    enabled: !!user,
  })

  const createCourseMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.post('/teacher/courses', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-courses'] })
      setShowModal(false)
      setFormData({ name: '', code: '', description: '' })
      alert('Course created successfully!')
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to create course')
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
            <Link href="/teacher/dashboard" className="text-primary-600 hover:text-primary-700">
              ← Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
          </div>
          <button onClick={handleLogout} className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900">
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <p className="text-gray-600">Manage your courses and start attendance sessions</p>
          <Button onClick={() => setShowModal(true)}>Create New Course</Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Loading...</div>
        ) : courses && courses.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 mb-4">You don't have any courses yet.</p>
            <Button onClick={() => setShowModal(true)}>Create Your First Course</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses?.map((course: any) => (
              <div key={course.id} className="bg-white rounded-lg shadow hover:shadow-lg transition">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{course.name}</h3>
                  {course.code && (
                    <p className="text-sm text-gray-500 mb-2">Code: {course.code}</p>
                  )}
                  {course.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.description}</p>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>{course.students_count} students</span>
                  </div>
                  <div className="space-y-3">
                    <Link href={`/teacher/courses/${course.id}`}>
                      <Button variant="outline" className="w-full">
                        View Details
                      </Button>
                    </Link>
                    <Link href={`/teacher/courses/${course.id}/attendance`}>
                      <Button className="w-full">
                        Start Attendance
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Course Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Create New Course</h3>
            <form onSubmit={(e) => {
              e.preventDefault()
              createCourseMutation.mutate(formData)
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="e.g., Introduction to Computer Science"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Code
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="e.g., CS101"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                    placeholder="Brief description of the course"
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-2">
                <Button type="submit" disabled={createCourseMutation.isPending}>
                  {createCourseMutation.isPending ? 'Creating...' : 'Create Course'}
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

