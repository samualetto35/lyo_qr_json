'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/auth'
import Link from 'next/link'

export default function TeacherDashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Wait a bit for cookies to be available after redirect
    const checkAuth = () => {
      const currentUser = authService.getUser()
      
      if (currentUser && currentUser.role === 'teacher') {
        setUser(currentUser)
      } else {
        // If no user found, check token to see if it's still loading
        const token = authService.isAuthenticated()
        if (!token) {
          router.push('/login/teacher')
        } else {
          // Token exists but user not parsed yet, retry after a moment
          setTimeout(() => {
            const retryUser = authService.getUser()
            if (retryUser && retryUser.role === 'teacher') {
              setUser(retryUser)
            } else {
              router.push('/login/teacher')
            }
          }, 200)
        }
      }
    }
    
    // Check immediately and also after a short delay
    checkAuth()
    const timeout = setTimeout(checkAuth, 300)
    
    return () => clearTimeout(timeout)
  }, [router])

  const handleLogout = () => {
    authService.logout()
    router.push('/login/teacher')
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
            <p className="text-sm text-gray-600">
              Welcome, {user.first_name || 'Teacher'} {user.last_name || ''}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* My Courses Card */}
          <Link href="/teacher/courses">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">My Courses</h3>
              <p className="text-sm text-gray-600">
                View and manage your courses
              </p>
            </div>
          </Link>

          {/* Start Attendance Card */}
          <Link href="/teacher/courses">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer bg-primary-50">
              <h3 className="text-lg font-semibold text-primary-900 mb-2">
                Start Attendance Session
              </h3>
              <p className="text-sm text-primary-700">
                Create a new QR attendance session
              </p>
            </div>
          </Link>

          {/* Profile Card */}
          <Link href="/teacher/profile">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile</h3>
              <p className="text-sm text-gray-600">
                View your profile information
              </p>
            </div>
          </Link>
        </div>

        {/* Quick Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Quick Guide</h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
            <li>Go to "My Courses" to view your courses</li>
            <li>Select a course and click "Start Attendance Session"</li>
            <li>Display the generated QR code to your students</li>
            <li>Students scan and enter their Student ID</li>
            <li>View real-time attendance submissions</li>
          </ol>
        </div>
      </main>
    </div>
  )
}

