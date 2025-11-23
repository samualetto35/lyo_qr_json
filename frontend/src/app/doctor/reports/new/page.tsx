'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authService } from '@/lib/auth'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { useDoctorTheme } from '@/contexts/doctor-theme.context'
import { DoctorThemeSwitcher } from '@/components/ui/doctor-theme-switcher'
import { SearchableDropdown } from '@/components/ui/searchable-dropdown'
import { Calendar } from '@/components/ui/calendar'
import Link from 'next/link'

export default function NewReportPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { theme } = useDoctorTheme()
  const [user, setUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [reportDate, setReportDate] = useState('')

  useEffect(() => {
    setMounted(true)
    const currentUser = authService.getUser()
    setUser(currentUser)
    
    if (!currentUser || currentUser.role !== 'doctor') {
      router.push('/login/doctor')
    }
  }, [router])

  const { data: students } = useQuery({
    queryKey: ['doctor-students'],
    queryFn: async () => {
      const response = await api.get('/doctor/students')
      return response.data
    },
    enabled: !!user,
  })

  const createReportMutation = useMutation({
    mutationFn: async (data: { student_id: string; report_date: string }) => {
      return await api.post('/doctor/reports', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-reports'] })
      setSelectedStudentId('')
      setReportDate('')
      alert('Report created successfully!')
      router.push('/doctor/reports')
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to create report')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudentId || !reportDate) {
      alert('Please select a student and date')
      return
    }
    createReportMutation.mutate({
      student_id: selectedStudentId,
      report_date: reportDate,
    })
  }

  const handleLogout = () => {
    authService.logout()
    router.push('/login/doctor')
  }

  if (!mounted || !user) return null

  const studentOptions =
    students?.data?.map((student: any) => ({
      value: student.student_id,
      label: `${student.student_id} - ${student.first_name} ${student.last_name}`,
    })) || []

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
        <div className={`${theme === 'd2' ? 'max-w-2xl mx-auto' : ''}`}>
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
          <h2 className={`${theme === 'd2' ? 'text-[28px] font-semibold text-gray-900 mb-8' : 'text-2xl font-bold text-gray-900 mb-6'}`}>
            {theme === 'd2' ? 'Rapor Ekle +' : 'New Medical Report'}
          </h2>

          <div className={`${theme === 'd2' ? 'bg-white rounded-2xl shadow-[0px_4px_40px_rgba(0,0,0,0.06)] p-8' : 'bg-white rounded-lg shadow p-6'}`}>
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Student Selection */}
                <div>
                  <label className={`block ${theme === 'd2' ? 'text-sm font-medium text-gray-700 mb-3' : 'text-sm font-medium text-gray-700 mb-2'}`}>
                    {theme === 'd2' ? 'Öğrenci Seçin' : 'Select Student'}
                  </label>
                  {theme === 'd2' ? (
                    <SearchableDropdown
                      options={studentOptions}
                      value={selectedStudentId}
                      onChange={setSelectedStudentId}
                      placeholder="Öğrenci ara ve seç..."
                    />
                  ) : (
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      style={{ fontSize: '16px' }}
                    >
                      <option value="">-- Select a student --</option>
                      {students?.data?.map((student: any) => (
                        <option key={student.id} value={student.student_id}>
                          {student.student_id} - {student.first_name} {student.last_name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Date Selection */}
                <div>
                  <label className={`block ${theme === 'd2' ? 'text-sm font-medium text-gray-700 mb-3' : 'text-sm font-medium text-gray-700 mb-2'}`}>
                    {theme === 'd2' ? 'Rapor Tarihi' : 'Report Date'}
                  </label>
                  {theme === 'd2' ? (
                    <Calendar
                      value={reportDate}
                      onChange={setReportDate}
                    />
                  ) : (
                    <input
                      type="date"
                      value={reportDate}
                      onChange={(e) => setReportDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      style={{ fontSize: '16px' }}
                    />
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={createReportMutation.isPending}
                    className={theme === 'd2' ? 'flex-1 bg-gray-900 hover:bg-gray-800 text-white' : 'flex-1'}
                  >
                    {createReportMutation.isPending
                      ? theme === 'd2'
                        ? 'Oluşturuluyor...'
                        : 'Creating...'
                      : theme === 'd2'
                      ? 'Rapor Oluştur'
                      : 'Create Report'}
                  </Button>
                  <Link href="/doctor/dashboard">
                    <Button type="button" variant="outline" className={theme === 'd2' ? 'border-gray-300' : ''}>
                      {theme === 'd2' ? 'İptal' : 'Cancel'}
                    </Button>
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}

