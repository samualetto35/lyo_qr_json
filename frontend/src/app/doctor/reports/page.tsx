'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authService } from '@/lib/auth'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { useDoctorTheme } from '@/contexts/doctor-theme.context'
import { Calendar } from '@/components/ui/calendar'
import Link from 'next/link'

export default function ReportsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { theme } = useDoctorTheme()
  const [user, setUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    start_date: '',
    end_date: '',
  })

  useEffect(() => {
    setMounted(true)
    const currentUser = authService.getUser()
    setUser(currentUser)
    
    if (!currentUser || currentUser.role !== 'doctor') {
      router.push('/login/doctor')
    }
  }, [router])

  const { data: reports, isLoading } = useQuery({
    queryKey: ['doctor-reports', filters],
    queryFn: async () => {
      const params: any = {}
      if (filters.search) params.search = filters.search
      if (filters.start_date) params.start_date = filters.start_date
      if (filters.end_date) params.end_date = filters.end_date
      const response = await api.get('/doctor/reports', { params })
      return response.data
    },
    enabled: !!user,
  })

  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      return await api.delete(`/doctor/reports/${reportId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-reports'] })
      alert('Report deleted successfully')
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to delete report')
    },
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
          {theme === 'd2' ? 'Raporlar' : 'Medical Reports'}
        </h2>

        {/* Filters */}
        <div className={`${theme === 'd2' ? 'bg-white rounded-2xl shadow-[0px_4px_40px_rgba(0,0,0,0.06)] p-6 mb-6' : 'bg-white rounded-lg shadow p-6 mb-6'}`}>
          <h3 className={`${theme === 'd2' ? 'text-base font-medium text-gray-700 mb-4' : 'text-lg font-semibold mb-4'}`}>
            {theme === 'd2' ? 'Filtrele' : 'Filters'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={`block ${theme === 'd2' ? 'text-sm font-medium text-gray-700 mb-2' : 'text-sm font-medium text-gray-700 mb-2'}`}>
                {theme === 'd2' ? 'Öğrenci Ara' : 'Search Student'}
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder={theme === 'd2' ? 'ID veya isim ile ara...' : 'Search by ID or name...'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                style={{ fontSize: '16px' }}
              />
            </div>
            <div>
              <label className={`block ${theme === 'd2' ? 'text-sm font-medium text-gray-700 mb-2' : 'text-sm font-medium text-gray-700 mb-2'}`}>
                {theme === 'd2' ? 'Başlangıç Tarihi' : 'Start Date'}
              </label>
              {theme === 'd2' ? (
                <Calendar
                  value={filters.start_date}
                  onChange={(date) => setFilters({ ...filters, start_date: date })}
                />
              ) : (
                <input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  style={{ fontSize: '16px' }}
                />
              )}
            </div>
            <div>
              <label className={`block ${theme === 'd2' ? 'text-sm font-medium text-gray-700 mb-2' : 'text-sm font-medium text-gray-700 mb-2'}`}>
                {theme === 'd2' ? 'Bitiş Tarihi' : 'End Date'}
              </label>
              {theme === 'd2' ? (
                <Calendar
                  value={filters.end_date}
                  onChange={(date) => setFilters({ ...filters, end_date: date })}
                />
              ) : (
                <input
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  style={{ fontSize: '16px' }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Reports Table */}
        <div className={`${theme === 'd2' ? 'bg-white rounded-2xl shadow-[0px_4px_40px_rgba(0,0,0,0.06)] overflow-hidden' : 'bg-white rounded-lg shadow overflow-hidden'}`}>
          {isLoading ? (
            <div className="p-8 text-center">{theme === 'd2' ? 'Yükleniyor...' : 'Loading...'}</div>
          ) : reports?.data?.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {theme === 'd2' ? 'Rapor bulunamadı' : 'No reports found'}
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
                      {theme === 'd2' ? 'Öğrenci Adı' : 'Student Name'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {theme === 'd2' ? 'Rapor Tarihi' : 'Report Date'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {theme === 'd2' ? 'Oluşturulma' : 'Created At'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {theme === 'd2' ? 'İşlemler' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports?.data?.map((report: any) => (
                    <tr key={report.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.student_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.student_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(report.report_date).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(report.created_at).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            if (confirm(theme === 'd2' ? 'Bu raporu silmek istediğinize emin misiniz?' : 'Are you sure you want to delete this report?')) {
                              deleteReportMutation.mutate(report.id)
                            }
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          {theme === 'd2' ? 'Sil' : 'Delete'}
                        </button>
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

