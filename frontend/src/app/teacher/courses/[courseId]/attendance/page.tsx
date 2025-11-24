'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authService } from '@/lib/auth'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { useTeacherTheme } from '@/contexts/teacher-theme.context'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export default function TeacherCourseAttendancePage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.courseId as string
  const queryClient = useQueryClient()
  const { theme } = useTeacherTheme()
  const [user, setUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    session_name: '',
    session_date: new Date().toISOString().split('T')[0],
    duration_minutes: 60,
  })

  useEffect(() => {
    setMounted(true)
    const currentUser = authService.getUser()
    setUser(currentUser)
    
    if (!currentUser || currentUser.role !== 'teacher') {
      router.push('/login/teacher')
    }
  }, [router])

  const { data: attendance, isLoading } = useQuery({
    queryKey: ['teacher-course-attendance', courseId],
    queryFn: async () => {
      const response = await api.get(`/teacher/courses/${courseId}/attendance`)
      return response.data
    },
    enabled: !!courseId && !!user,
  })

  // Get course details from courses list
  const { data: courses } = useQuery({
    queryKey: ['teacher-courses'],
    queryFn: async () => {
      const response = await api.get('/teacher/courses')
      return response.data
    },
    enabled: !!user,
  })

  const course = courses?.find((c: any) => c.id === courseId)

  const createSessionMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.post(`/teacher/courses/${courseId}/attendance-sessions`, data)
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-course-attendance', courseId] })
      setShowModal(false)
      // Navigate to session detail page to show QR
      router.push(`/teacher/attendance-sessions/${response.data.attendance_session_id}`)
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to create session')
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
          {theme === 't2' ? 'Yoklama Oturumları' : 'Attendance Sessions'}
        </h2>

        {/* Start Session Button */}
        <div className="mb-6">
          <Button onClick={() => setShowModal(true)} size="lg" className={`w-full md:w-auto ${theme === 't2' ? 'bg-blue-700 hover:bg-blue-800 text-white' : ''}`}>
            {theme === 't2' 
              ? `🎯 Yeni Yoklama Oturumu Başlat${course ? ` - ${course.name}` : ''}`
              : `🎯 Start New Attendance Session${course ? ` - ${course.name}` : ''}`
            }
          </Button>
        </div>

        {/* Sessions List */}
        <div className={`${theme === 't2' ? 'bg-white rounded-2xl shadow-[0px_4px_40px_rgba(0,0,0,0.06)]' : 'bg-white rounded-lg shadow'} overflow-hidden`}>
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">{theme === 't2' ? 'Geçmiş Oturumlar' : 'Past Sessions'}</h2>
          </div>
          {isLoading ? (
            <div className="p-8 text-center">{theme === 't2' ? 'Yükleniyor...' : 'Loading...'}</div>
          ) : attendance && attendance.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {theme === 't2' ? 'Henüz yoklama oturumu yok. İlk oturumunuzu başlatmak için yukarıdaki butona tıklayın!' : 'No attendance sessions yet. Click the button above to start your first session!'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {theme === 't2' ? 'Oturum Adı' : 'Session Name'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {theme === 't2' ? 'Tarih' : 'Date'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {theme === 't2' ? 'Durum' : 'Status'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {theme === 't2' ? 'Mevcut/Toplam' : 'Present/Total'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {theme === 't2' ? 'İşlemler' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendance?.map((session: any) => (
                    <tr key={session.session_id}>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {session.session_name || (theme === 't2' ? 'İsimsiz Oturum' : 'Untitled Session')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(session.session_date)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 text-xs font-semibold rounded-full ${
                          session.is_open ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {session.is_open ? (theme === 't2' ? 'Açık' : 'Open') : (theme === 't2' ? 'Kapalı' : 'Closed')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {session.present_count} / {session.total_students}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Link
                          href={`/teacher/attendance-sessions/${session.session_id}`}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          {theme === 't2' ? 'Detayları Görüntüle' : 'View Details'}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Create Session Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${theme === 't2' ? 'bg-white rounded-2xl' : 'bg-white rounded-lg'} p-8 max-w-md w-full mx-4`}>
            <h3 className="text-lg font-semibold mb-4">
              {theme === 't2' ? 'Yoklama Oturumu Başlat' : 'Start Attendance Session'}
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault()
              createSessionMutation.mutate(formData)
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {theme === 't2' ? 'Oturum Adı' : 'Session Name'}
                  </label>
                  <input
                    type="text"
                    value={formData.session_name}
                    onChange={(e) => setFormData({ ...formData, session_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    style={{ fontSize: '16px' }}
                    placeholder={theme === 't2' ? 'örn. Hafta 3 - Ders' : 'e.g., Week 3 - Lecture'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {theme === 't2' ? 'Oturum Tarihi' : 'Session Date'}
                  </label>
                  <input
                    type="date"
                    value={formData.session_date}
                    onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    style={{ fontSize: '16px' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {theme === 't2' ? 'Süre (dakika)' : 'Duration (minutes)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="240"
                    value={formData.duration_minutes}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 60 : parseInt(e.target.value) || 60
                      setFormData({ ...formData, duration_minutes: value })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    style={{ fontSize: '16px' }}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {theme === 't2' ? 'Oturum bu süre sonunda otomatik olarak kapanacaktır (maksimum 240 dakika)' : 'Session will auto-close after this duration (max 240 minutes)'}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex gap-2">
                <Button type="submit" disabled={createSessionMutation.isPending} className={theme === 't2' ? 'bg-blue-700 hover:bg-blue-800 text-white' : ''}>
                  {createSessionMutation.isPending 
                    ? (theme === 't2' ? 'Oluşturuluyor...' : 'Creating...')
                    : (theme === 't2' ? 'Oturum Oluştur' : 'Create Session')}
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

