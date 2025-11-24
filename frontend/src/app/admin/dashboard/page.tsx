'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/auth'
import Link from 'next/link'
import { useAdminTheme } from '@/contexts/admin-theme.context'
import { AdminA2Layout } from '@/components/admin/admin-a2-layout'

export default function AdminDashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const { theme } = useAdminTheme()

  useEffect(() => {
    setMounted(true)
    
    // Wait a bit for cookies to be available after redirect
    const checkAuth = () => {
      const currentUser = authService.getUser()
      
      if (currentUser && currentUser.role === 'admin') {
        setUser(currentUser)
      } else {
        // If no user found, check token to see if it's still loading
        const token = authService.isAuthenticated()
        if (!token) {
          router.push('/login/admin')
        } else {
          // Token exists but user not parsed yet, retry after a moment
          setTimeout(() => {
            const retryUser = authService.getUser()
            if (retryUser && retryUser.role === 'admin') {
              setUser(retryUser)
            } else {
              router.push('/login/admin')
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

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!user) return null

  const handleLogout = () => {
    authService.logout()
    router.push('/login/admin')
  }

  const legacyContent = (
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

          {/* Doctors Card */}
          <Link href="/admin/doctors">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer bg-green-50">
              <h3 className="text-lg font-semibold text-green-900 mb-2">👨‍⚕️ Doctors</h3>
              <p className="text-sm text-green-700">
                Manage doctor accounts for medical reports
              </p>
            </div>
          </Link>

          {/* Health System Card */}
          <Link href="/admin/health-system">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer bg-yellow-50">
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">🏥 Health System</h3>
              <p className="text-sm text-yellow-700">
                Import students for health system
              </p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  )

  if (theme === 'a2') {
    return (
      <AdminA2Layout user={user} onLogout={handleLogout}>
        <section className="space-y-6">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <p className="text-sm uppercase tracking-[0.2em] text-gray-400">
              A2 Dashboard
            </p>
            <h1 className="text-3xl font-semibold text-gray-900 mt-2">
              Yeni Yönetim Deneyimi Çok Yakında
            </h1>
            <p className="text-gray-600 mt-3 max-w-2xl">
              Dashboard bileşenleri a2 tasarımında yeniden düzenleniyor. Öğrenci ve yoklama verilerine erişmek için üst menüyü
              kullanmaya devam edebilirsiniz.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: 'Öğrenciler',
                description: 'Tüm öğrencileri yönet ve filtrele',
                href: '/admin/students',
              },
              {
                title: 'Yoklamalar',
                description: 'Oturumları izle ve yönet',
                href: '/admin/attendance',
              },
              {
                title: 'Öğretmenler',
                description: 'Erişimleri düzenle ve izle',
                href: '/admin/teachers',
              },
            ].map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="bg-white rounded-3xl p-6 border border-gray-100 hover:border-gray-200 transition"
              >
                <p className="text-sm uppercase tracking-[0.15em] text-gray-400">{card.title}</p>
                <p className="text-gray-900 font-semibold mt-2">{card.description}</p>
              </Link>
            ))}
          </div>
        </section>
      </AdminA2Layout>
    )
  }

  return legacyContent
}

