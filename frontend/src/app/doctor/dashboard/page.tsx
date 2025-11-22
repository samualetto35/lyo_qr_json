'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/auth'
import Link from 'next/link'

export default function DoctorDashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const currentUser = authService.getUser()
    setUser(currentUser)
    
    if (!currentUser || currentUser.role !== 'doctor') {
      router.push('/login/doctor')
    }
  }, [router])

  const handleLogout = () => {
    authService.logout()
    router.push('/login/doctor')
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
            <h1 className="text-2xl font-bold text-gray-900">Doctor Portal</h1>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* New Report Card */}
          <Link href="/doctor/reports/new">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer bg-green-50">
              <h3 className="text-lg font-semibold text-green-900 mb-2">➕ New Report</h3>
              <p className="text-sm text-green-700">
                Add a new medical report for a student
              </p>
            </div>
          </Link>

          {/* Reports Card */}
          <Link href="/doctor/reports">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer bg-blue-50">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">📋 Reports</h3>
              <p className="text-sm text-blue-700">
                View all medical reports
              </p>
            </div>
          </Link>

          {/* Students Card */}
          <Link href="/doctor/students">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer bg-purple-50">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">👥 Students</h3>
              <p className="text-sm text-purple-700">
                View all health system students
              </p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  )
}

