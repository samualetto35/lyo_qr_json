'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { authService } from '@/lib/auth'
import api from '@/lib/api'
import { useTeacherTheme } from '@/contexts/teacher-theme.context'
import { TeacherThemeSwitcher } from '@/components/ui/teacher-theme-switcher'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function TeacherCourseDetailPage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.courseId as string
  const { theme } = useTeacherTheme()
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
    <div className={`min-h-screen ${theme === 't2' ? 'bg-[#FAFAFA]' : 'bg-gray-100'}`}>
      {/* Header */}
      <header className={theme === 't2' ? 'bg-transparent' : 'bg-white shadow'}>
        <div className={`${theme === 't2' ? 'max-w-5xl' : 'max-w-7xl'} mx-auto px-4 sm:px-6 lg:px-8 ${theme === 't2' ? 'py-4' : 'py-4'} flex flex-row justify-between items-center`}>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className={`${theme === 't2' ? 'text-[24px] font-semibold text-gray-900' : 'text-2xl font-bold text-gray-900'}`}>
                {theme === 't2' ? 'Akademisyen Portalı' : 'Teacher Dashboard'}
              </h1>
              <div className="hidden md:block">
                <TeacherThemeSwitcher />
              </div>
            </div>
            <p className={`${theme === 't2' ? 'text-xs text-gray-400 font-normal' : 'text-sm text-gray-600'}`}>
              {theme === 't2' ? (
                <>Hoşgeldiniz, {user.first_name || 'Öğretmen'} {user.last_name || ''}</>
              ) : (
                <>Welcome, {user.first_name || 'Teacher'} {user.last_name || ''}</>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="md:hidden">
              <TeacherThemeSwitcher />
            </div>
            <button
              onClick={() => authService.logout(); router.push('/login/teacher')}
              className={theme === 't2' 
                ? 'px-3 py-1.5 text-xs font-normal text-[#D96A6A] bg-white border border-[#D96A6A] rounded-full shadow-[0px_4px_40px_rgba(0,0,0,0.06)] hover:bg-gray-50 transition-colors'
                : 'px-4 py-2 text-sm text-gray-700 hover:text-gray-900'
              }
            >
              {theme === 't2' ? 'Çıkış Yap' : 'Logout'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${theme === 't2' ? 'pt-4 pb-12 sm:pb-16' : 'py-8'}`}>
        {/* Back Button */}
        {theme === 't2' && (
          <Link
            href="/teacher/courses"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Geri Git
          </Link>
        )}

        {/* Title */}
        <h2 className={`${theme === 't2' ? 'text-[28px] font-semibold text-gray-900 mb-6' : 'text-2xl font-bold text-gray-900 mb-6'}`}>
          {theme === 't2' ? 'Ders Detayları' : 'Course Details'}
        </h2>

        {/* Quick Actions */}
        <div className="mb-6">
          <Link href={`/teacher/courses/${courseId}/attendance`}>
            <Button size="lg" className={`w-full md:w-auto ${theme === 't2' ? 'bg-gray-900 hover:bg-gray-800 text-white' : ''}`}>
              {theme === 't2' ? '🎯 Yoklama Oturumu Başlat' : '🎯 Start Attendance Session'}
            </Button>
          </Link>
        </div>

        {/* Tabs */}
        <div className={`${theme === 't2' ? 'bg-white rounded-2xl shadow-[0px_4px_40px_rgba(0,0,0,0.06)]' : 'bg-white rounded-lg shadow'}`}>
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
                {theme === 't2' ? 'Öğrenciler' : 'Students'}
              </button>
              <button
                onClick={() => setActiveTab('attendance')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'attendance'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {theme === 't2' ? 'Yoklama Geçmişi' : 'Attendance History'}
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
                    placeholder={theme === 't2' ? 'Öğrenci ID veya isim ile ara...' : 'Search by student ID or name...'}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    style={{ fontSize: '16px' }}
                  />
                </div>
                {studentsLoading ? (
                  <div className="text-center py-8">{theme === 't2' ? 'Yükleniyor...' : 'Loading...'}</div>
                ) : students && students.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {theme === 't2' ? 'Bu derse henüz öğrenci kayıtlı değil.' : 'No students enrolled in this course yet.'}
                    <p className="text-sm mt-2">
                      {theme === 't2' ? 'Öğrenci listesini içe aktarmak için yöneticinizle iletişime geçin.' : 'Contact your admin to import student rosters.'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            {theme === 't2' ? 'Öğrenci ID' : 'Student ID'}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            {theme === 't2' ? 'Ad Soyad' : 'Name'}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            {theme === 't2' ? 'Cinsiyet' : 'Gender'}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            {theme === 't2' ? 'Program' : 'Program'}
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
                  </div>
                )}
              </div>
            )}

            {activeTab === 'attendance' && (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">
                  {theme === 't2' ? 'Bu ders için yoklama geçmişini görüntüleyin' : 'View attendance history for this course'}
                </p>
                <Link href={`/teacher/courses/${courseId}/attendance`}>
                  <Button className={theme === 't2' ? 'bg-gray-900 hover:bg-gray-800 text-white' : ''}>
                    {theme === 't2' ? 'Yoklamaya Git' : 'Go to Attendance'}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

