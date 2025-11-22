'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/auth'
import Link from 'next/link'

export default function AdminDashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const currentUser = authService.getUser()
    setUser(currentUser)
    
    if (!currentUser || currentUser.role !== 'admin') {
      router.push('/login/admin')
    }
  }, [router])

  if (!mounted || !user) return null

  const handleLogout = () => {
    authService.logout()
    router.push('/login/admin')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-600">
              Welcome, {user.first_name} {user.last_name}
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
          {/* Teachers Card */}
          <Link href="/admin/teachers">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Teachers</h3>
              <p className="text-sm text-gray-600">
                Manage teacher accounts and permissions
              </p>
            </div>
          </Link>

          {/* Courses Card */}
          <Link href="/admin/courses">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Courses</h3>
              <p className="text-sm text-gray-600">
                Manage courses and assign teachers
              </p>
            </div>
          </Link>

          {/* Student Imports Card */}
          <Link href="/admin/imports">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Student Imports</h3>
              <p className="text-sm text-gray-600">
                Import and manage student rosters via CSV
              </p>
            </div>
          </Link>

          {/* Attendance Card */}
          <Link href="/admin/attendance">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Attendance</h3>
              <p className="text-sm text-gray-600">
                View attendance records across all courses
              </p>
            </div>
          </Link>

          {/* Fraud Signals Card */}
          <Link href="/admin/fraud-signals">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Fraud Signals</h3>
              <p className="text-sm text-gray-600">
                Review suspicious attendance activity
              </p>
            </div>
          </Link>

          {/* Students Card */}
          <Link href="/admin/students">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer bg-purple-50">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">👥 Students</h3>
              <p className="text-sm text-purple-700">
                View all students with course enrollments and absence stats
              </p>
            </div>
          </Link>

          {/* System Settings Card */}
          <Link href="/admin/settings">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">System Settings</h3>
              <p className="text-sm text-gray-600">
                Configure anti-fraud rules and limits
              </p>
            </div>
          </Link>

          {/* Audit Logs Card */}
          <Link href="/admin/audit-logs">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer bg-blue-50">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">📋 Audit Logs</h3>
              <p className="text-sm text-blue-700">
                View all teacher manual attendance actions
              </p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  )
}

