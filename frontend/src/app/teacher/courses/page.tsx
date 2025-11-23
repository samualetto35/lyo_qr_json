'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authService } from '@/lib/auth'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { useTeacherTheme } from '@/contexts/teacher-theme.context'
import { TeacherThemeSwitcher } from '@/components/ui/teacher-theme-switcher'
import Link from 'next/link'

export default function TeacherCoursesPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { theme } = useTeacherTheme()
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
              onClick={handleLogout}
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
            href="/teacher/dashboard"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Geri Git
          </Link>
        )}

        {/* Title and Create Button */}
        <div className={`${theme === 't2' ? 'mb-4' : 'mb-6'} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`}>
          <h2 className={`${theme === 't2' ? 'text-[28px] font-semibold text-gray-900' : 'text-2xl font-bold text-gray-900'}`}>
            {theme === 't2' ? 'Derslerim' : 'My Courses'}
          </h2>
          {theme === 't2' && (
            <Button 
              onClick={() => setShowModal(true)} 
              className="bg-gray-900 hover:bg-gray-800 text-white rounded-full"
            >
              {theme === 't2' ? 'Yeni Ders Oluştur' : 'Create New Course'}
            </Button>
          )}
        </div>

        {theme !== 't2' && (
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <p className="text-gray-600">
              Manage your courses and start attendance sessions
            </p>
            <Button onClick={() => setShowModal(true)}>
              Create New Course
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">{theme === 't2' ? 'Yükleniyor...' : 'Loading...'}</div>
        ) : courses && courses.length === 0 ? (
          <div className={`${theme === 't2' ? 'bg-white rounded-2xl shadow-[0px_4px_40px_rgba(0,0,0,0.06)]' : 'bg-white rounded-lg shadow'} p-8 text-center`}>
            <p className={`${theme === 't2' ? 'text-gray-700' : 'text-gray-500'} mb-4`}>
              {theme === 't2' ? 'Henüz dersiniz yok.' : 'You don\'t have any courses yet.'}
            </p>
            <Button onClick={() => setShowModal(true)} className={theme === 't2' ? 'bg-gray-900 hover:bg-gray-800 text-white' : ''}>
              {theme === 't2' ? 'İlk Dersinizi Oluşturun' : 'Create Your First Course'}
            </Button>
          </div>
        ) : (
          <div className={`grid grid-cols-1 ${theme === 't2' ? 'sm:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-3'} gap-6`}>
            {courses?.map((course: any) => (
              <div key={course.id} className={`${theme === 't2' ? 'bg-white rounded-2xl shadow-[0px_4px_40px_rgba(0,0,0,0.06)]' : 'bg-white rounded-lg shadow'} hover:shadow-lg transition`}>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{course.name}</h3>
                  {course.code && (
                    <p className="text-sm text-gray-500 mb-2">{theme === 't2' ? 'Kod:' : 'Code:'} {course.code}</p>
                  )}
                  {course.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.description}</p>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>{course.students_count} {theme === 't2' ? 'öğrenci' : 'students'}</span>
                  </div>
                  <div className="space-y-3">
                    <Link href={`/teacher/courses/${course.id}`}>
                      <Button variant="outline" className={`w-full ${theme === 't2' ? 'border-gray-300' : ''}`}>
                        {theme === 't2' ? 'Detayları Görüntüle' : 'View Details'}
                      </Button>
                    </Link>
                    <Link href={`/teacher/courses/${course.id}/attendance`}>
                      <Button className={`w-full ${theme === 't2' ? 'bg-gray-900 hover:bg-gray-800 text-white' : ''} mt-2`}>
                        {theme === 't2' ? 'Yoklama Başlat' : 'Start Attendance'}
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
          <div className={`${theme === 't2' ? 'bg-white rounded-2xl' : 'bg-white rounded-lg'} p-8 max-w-md w-full mx-4`}>
            <h3 className="text-lg font-semibold mb-4">
              {theme === 't2' ? 'Yeni Ders Oluştur' : 'Create New Course'}
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault()
              createCourseMutation.mutate(formData)
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {theme === 't2' ? 'Ders Adı *' : 'Course Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    style={{ fontSize: '16px' }}
                    placeholder={theme === 't2' ? 'örn. Bilgisayar Bilimlerine Giriş' : 'e.g., Introduction to Computer Science'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {theme === 't2' ? 'Ders Kodu' : 'Course Code'}
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    style={{ fontSize: '16px' }}
                    placeholder="e.g., CS101"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {theme === 't2' ? 'Açıklama' : 'Description'}
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                    style={{ fontSize: '16px' }}
                    placeholder={theme === 't2' ? 'Dersin kısa açıklaması' : 'Brief description of the course'}
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-2">
                <Button type="submit" disabled={createCourseMutation.isPending} className={theme === 't2' ? 'bg-gray-900 hover:bg-gray-800 text-white' : ''}>
                  {createCourseMutation.isPending 
                    ? (theme === 't2' ? 'Oluşturuluyor...' : 'Creating...')
                    : (theme === 't2' ? 'Ders Oluştur' : 'Create Course')}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className={theme === 't2' ? 'border-gray-300' : ''}>
                  {theme === 't2' ? 'İptal' : 'Cancel'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

