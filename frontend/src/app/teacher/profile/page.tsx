'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { authService } from '@/lib/auth'
import api from '@/lib/api'
import Link from 'next/link'

export default function TeacherProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const currentUser = authService.getUser()
    setUser(currentUser)
    
    if (!currentUser || currentUser.role !== 'teacher') {
      router.push('/login/teacher')
    }
  }, [router])

  const { data: profile, isLoading } = useQuery({
    queryKey: ['teacher-profile'],
    queryFn: async () => {
      const response = await api.get('/teacher/me')
      return response.data
    },
    enabled: !!user,
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
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          </div>
          <button onClick={handleLogout} className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900">
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 bg-primary-600 text-white">
              <h2 className="text-xl font-semibold">Teacher Information</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-sm font-medium text-gray-500">Email:</div>
                  <div className="col-span-2 text-sm text-gray-900">{profile?.email}</div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-sm font-medium text-gray-500">First Name:</div>
                  <div className="col-span-2 text-sm text-gray-900">{profile?.first_name}</div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-sm font-medium text-gray-500">Last Name:</div>
                  <div className="col-span-2 text-sm text-gray-900">{profile?.last_name}</div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-sm font-medium text-gray-500">Number of Courses:</div>
                  <div className="col-span-2 text-sm text-gray-900">{profile?.courses_count}</div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
                <div className="space-y-2">
                  <Link
                    href="/teacher/courses"
                    className="block px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-md"
                  >
                    → My Courses
                  </Link>
                  <Link
                    href="/teacher/dashboard"
                    className="block px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-md"
                  >
                    → Dashboard
                  </Link>
                </div>
              </div>

              <div className="mt-8 p-4 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> To update your profile information, please contact your system administrator.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

