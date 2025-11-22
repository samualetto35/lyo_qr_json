'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { authService } from '@/lib/auth'
import api from '@/lib/api'
import Link from 'next/link'
import { formatDateTime } from '@/lib/utils'

export default function AdminAuditLogsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [actorTypeFilter, setActorTypeFilter] = useState('')

  useEffect(() => {
    setMounted(true)
    const currentUser = authService.getUser()
    setUser(currentUser)
    
    if (!currentUser || currentUser.role !== 'admin') {
      router.push('/login/admin')
    }
  }, [router])

  const { data: logs, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', search, actionFilter, actorTypeFilter],
    queryFn: async () => {
      const params: any = {}
      if (search) params.search = search
      if (actionFilter) params.action = actionFilter
      if (actorTypeFilter) params.actor_type = actorTypeFilter
      
      const response = await api.get('/admin/audit-logs', { params })
      return response.data
    },
    enabled: !!user,
  })

  const handleLogout = () => {
    authService.logout()
    router.push('/login/admin')
  }

  if (!mounted || !user) return null

  const getActionBadgeColor = (action: string) => {
    if (action.includes('ADD')) return 'bg-green-100 text-green-800'
    if (action.includes('REMOVE') || action.includes('DELETE')) return 'bg-red-100 text-red-800'
    if (action.includes('UPDATE') || action.includes('EDIT')) return 'bg-blue-100 text-blue-800'
    if (action.includes('CREATE')) return 'bg-purple-100 text-purple-800'
    return 'bg-gray-100 text-gray-800'
  }

  const formatActionText = (action: string) => {
    return action
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="text-primary-600 hover:text-primary-700">
              ← Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          </div>
          <button onClick={handleLogout} className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900">
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search action, entity type, or ID..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action
              </label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All Actions</option>
                <option value="MANUAL_ADD">Manual Add</option>
                <option value="MANUAL_REMOVE">Manual Remove</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Actor Type
              </label>
              <select
                value={actorTypeFilter}
                onChange={(e) => setActorTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All</option>
                <option value="admin">Admin</option>
                <option value="teacher">Teacher</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Activity Log</h2>
            <p className="text-sm text-gray-600 mt-1">
              Showing latest {logs?.length || 0} audit events
            </p>
          </div>
          {isLoading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : logs && logs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No audit logs found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Entity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs?.map((log: any) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                        {formatDateTime(log.created_at)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="text-gray-900 font-medium">
                          {log.actor_name}
                        </div>
                        <div className="text-gray-500 text-xs capitalize">
                          {log.actor_type}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getActionBadgeColor(log.action)}`}>
                          {formatActionText(log.action)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="capitalize">{log.entity_type.replace('_', ' ')}</div>
                        {log.entity_id && (
                          <div className="text-xs text-gray-500 font-mono truncate max-w-xs">
                            {log.entity_id}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {/* Session Name */}
                        {log.session_name && (
                          <div className="mb-2">
                            <span className="font-medium text-primary-700">📋 {log.session_name}</span>
                          </div>
                        )}
                        
                        {/* Course Details (for CREATE_COURSE) */}
                        {log.course_name && (
                          <div className="mb-2">
                            <span className="font-medium text-blue-700">📚 {log.course_name}</span>
                            {log.course_teacher_email && (
                              <span className="text-gray-600 ml-2 text-xs">({log.course_teacher_email})</span>
                            )}
                          </div>
                        )}
                        
                        {/* Student Details */}
                        {log.after_data && (
                          <div className="space-y-1">
                            {log.after_data.studentId && (
                              <div>
                                <span className="font-medium">Student ID:</span> {log.after_data.studentId}
                                {log.student_full_name && (
                                  <span className="text-gray-700 ml-2">({log.student_full_name})</span>
                                )}
                              </div>
                            )}
                            {log.after_data.studentName && !log.student_full_name && (
                              <div><span className="font-medium">Name:</span> {log.after_data.studentName}</div>
                            )}
                          </div>
                        )}
                        
                        {/* Before Data (for removals) */}
                        {log.before_data && (
                          <div className="space-y-1 text-xs text-gray-500 mt-1">
                            {log.before_data.studentId && (
                              <div>
                                Removed: {log.before_data.studentId}
                                {log.student_full_name && (
                                  <span className="ml-1">({log.student_full_name})</span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
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

