'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authService } from '@/lib/auth'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function NewReportPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
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

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/doctor/dashboard" className="text-primary-600 hover:text-primary-700">
              ← Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">New Medical Report</h1>
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
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Student Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Student
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">-- Select a student --</option>
                  {students?.data?.map((student: any) => (
                    <option key={student.id} value={student.student_id}>
                      {student.student_id} - {student.first_name} {student.last_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Date
                </label>
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  max={today}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button type="submit" disabled={createReportMutation.isPending} className="flex-1">
                  {createReportMutation.isPending ? 'Creating...' : 'Create Report'}
                </Button>
                <Link href="/doctor/dashboard">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

