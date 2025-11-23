'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { authService } from '@/lib/auth'
import api from '@/lib/api'
import { useDoctorTheme } from '@/contexts/doctor-theme.context'
import { DoctorThemeSwitcher } from '@/components/ui/doctor-theme-switcher'
import Link from 'next/link'

export default function DoctorStudentsPage() {
  const router = useRouter()
  const { theme } = useDoctorTheme()
  const [user, setUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setMounted(true)
    const currentUser = authService.getUser()
    setUser(currentUser)
    
    if (!currentUser || currentUser.role !== 'doctor') {
      router.push('/login/doctor')
    }
  }, [router])

  const { data: students, isLoading } = useQuery({
    queryKey: ['doctor-students', search],
    queryFn: async () => {
      const response = await api.get('/doctor/students', {
        params: { search },
      })
      return response.data
    },
    enabled: !!user,
  })

  const handleLogout = () => {
    authService.logout()
    router.push('/login/doctor')
  }

  if (!mounted || !user) return null

  return (
    <div className={`min-h-screen ${theme === 'd2' ? 'bg-[#FAFAFA]' : 'bg-gray-100'}`}>
      {/* Header */}
      <header className={theme === 'd2' ? 'bg-transparent' : 'bg-white shadow'}>
        <div className={`${theme === 'd2' ? 'max-w-5xl' : 'max-w-7xl'} mx-auto px-4 sm:px-6 lg:px-8 ${theme === 'd2' ? 'py-4' : 'py-4'} flex flex-row justify-between items-center`}>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className={`${theme === 'd2' ? 'text-[24px] font-semibold text-gray-900' : 'text-2xl font-bold text-gray-900'}`}>
                {theme === 'd2' ? 'Doktor Paneli' : 'Doctor Portal'}
              </h1>
              <div className="hidden md:block">
                <DoctorThemeSwitcher />
              </div>
            </div>
            <p className={`${theme === 'd2' ? 'text-xs text-gray-400 font-normal' : 'text-sm text-gray-600'}`}>
              {theme === 'd2' ? (
                <>Hoşgeldiniz, {user.first_name} {user.last_name}</>
              ) : (
                <>Welcome, {user.first_name} {user.last_name}</>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="md:hidden">
              <DoctorThemeSwitcher />
            </div>
            <button
              onClick={handleLogout}
              className={theme === 'd2' 
                ? 'px-3 py-1.5 text-xs font-normal text-[#D96A6A] bg-white border border-[#D96A6A] rounded-full shadow-[0px_4px_40px_rgba(0,0,0,0.06)] hover:bg-gray-50 transition-colors'
                : 'px-4 py-2 text-sm text-gray-700 hover:text-gray-900'
              }
            >
              {theme === 'd2' ? 'Çıkış Yap' : 'Logout'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${theme === 'd2' ? 'pt-4 pb-12 sm:pb-16' : 'py-8'}`}>
        {/* Back Button */}
        {theme === 'd2' && (
          <Link
            href="/doctor/dashboard"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Geri Git
          </Link>
        )}

        {/* Title */}
        <h2 className={`${theme === 'd2' ? 'text-[28px] font-semibold text-gray-900 mb-6' : 'text-2xl font-bold text-gray-900 mb-6'}`}>
          {theme === 'd2' ? 'Öğrenciler' : 'Students'}
        </h2>

        {/* Search */}
        <div className={`mb-6 ${theme === 'd2' ? 'bg-white rounded-2xl shadow-[0px_4px_40px_rgba(0,0,0,0.06)] p-4' : ''}`}>
          <input
            type="text"
            placeholder={theme === 'd2' ? 'Öğrenci ID veya isim ile ara...' : 'Search by student ID or name...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 ${theme === 'd2' ? 'bg-white' : ''}`}
            style={{ fontSize: '16px' }}
          />
        </div>

        {/* Students Table */}
        <div className={`${theme === 'd2' ? 'bg-white rounded-2xl shadow-[0px_4px_40px_rgba(0,0,0,0.06)] overflow-hidden' : 'bg-white rounded-lg shadow overflow-hidden'}`}>
          {isLoading ? (
            <div className="p-8 text-center">{theme === 'd2' ? 'Yükleniyor...' : 'Loading...'}</div>
          ) : students?.data?.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {theme === 'd2' ? 'Öğrenci bulunamadı' : 'No students found'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {theme === 'd2' ? 'Öğrenci ID' : 'Student ID'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {theme === 'd2' ? 'Ad Soyad' : 'Name'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {theme === 'd2' ? 'Cinsiyet' : 'Gender'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {theme === 'd2' ? 'Program' : 'Program'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {theme === 'd2' ? 'Raporlar' : 'Reports'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students?.data?.map((student: any) => (
                    <tr key={student.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.student_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.first_name} {student.last_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.gender || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.program || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.reports_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

