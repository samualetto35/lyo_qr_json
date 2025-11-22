'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { authService } from '@/lib/auth'
import api from '@/lib/api'
import Link from 'next/link'
import { formatDateTime } from '@/lib/utils'

export default function AdminFraudSignalsPage() {
  const router = useRouter()
  const user = authService.getUser()
  const [signalTypeFilter, setSignalTypeFilter] = useState('')

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/login/admin')
    }
  }, [user, router])

  const { data: signals, isLoading } = useQuery({
    queryKey: ['fraud-signals', signalTypeFilter],
    queryFn: async () => {
      const response = await api.get('/admin/fraud-signals', {
        params: {
          signal_type: signalTypeFilter || undefined,
        },
      })
      return response.data
    },
  })

  const handleLogout = () => {
    authService.logout()
    router.push('/login/admin')
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="text-primary-600 hover:text-primary-700">
              ← Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Fraud Signals</h1>
          </div>
          <button onClick={handleLogout} className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900">
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">What are Fraud Signals?</h3>
          <p className="text-sm text-blue-800">
            Fraud signals are automatically logged when suspicious attendance activity is detected, such as:
          </p>
          <ul className="text-sm text-blue-800 list-disc list-inside mt-2 space-y-1">
            <li>Multiple Student IDs from the same device</li>
            <li>Too many requests from the same IP address</li>
            <li>Submissions from outside the geofenced area</li>
            <li>Attempts to submit after session expiration</li>
          </ul>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Signal Type</label>
            <select
              value={signalTypeFilter}
              onChange={(e) => setSignalTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Types</option>
              <option value="multiple_ids_same_device">Multiple IDs Same Device</option>
              <option value="too_many_requests_same_ip">Too Many Requests Same IP</option>
              <option value="outside_geofence">Outside Geofence</option>
              <option value="session_expired_submission">Session Expired Submission</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Signals Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Fraud Signals ({signals?.length || 0})</h2>
          </div>
          {isLoading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : signals && signals.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No fraud signals found. Great! 🎉
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Flagged Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">First Accepted</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {signals?.map((signal: any) => (
                    <tr key={signal.id}>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {formatDateTime(signal.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          {signal.signal_type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="font-medium text-gray-900">{signal.session_name || '-'}</div>
                        {signal.session_id && (
                          <div className="text-xs text-gray-500 font-mono truncate max-w-xs">
                            {signal.session_id.substring(0, 12)}...
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{signal.course_name || '-'}</td>
                      <td className="px-6 py-4 text-sm">
                        {signal.flagged_student ? (
                          <div>
                            <div className="font-medium text-red-600">{signal.flagged_student.student_id}</div>
                            <div className="text-xs text-gray-600">{signal.flagged_student.name}</div>
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {signal.first_accepted_student ? (
                          <div>
                            <div className="font-medium text-green-600">{signal.first_accepted_student.student_id}</div>
                            <div className="text-xs text-gray-600">{signal.first_accepted_student.name}</div>
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-mono text-xs">
                        {signal.client_device_id ? signal.client_device_id.substring(0, 8) + '...' : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {signal.details}
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

