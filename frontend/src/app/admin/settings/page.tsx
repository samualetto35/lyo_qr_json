'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authService } from '@/lib/auth'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useAdminTheme } from '@/contexts/admin-theme.context'
import { AdminA2Layout } from '@/components/admin/admin-a2-layout'
import { formatDateTime } from '@/lib/utils'

export default function AdminSettingsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [user, setUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const [formData, setFormData] = useState<any>({})
  const [activeModule, setActiveModule] = useState<'settings' | 'audit' | 'fraud'>('settings')
  const { theme } = useAdminTheme()

  useEffect(() => {
    setMounted(true)
    const currentUser = authService.getUser()
    setUser(currentUser)
    
    if (!currentUser || currentUser.role !== 'admin') {
      router.push('/login/admin')
    }
  }, [router])

  const { data: settings, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const response = await api.get('/admin/system-settings')
      return response.data
    },
    enabled: !!user,
  })

  const { data: auditLogs, isLoading: auditLoading } = useQuery({
    queryKey: ['admin-audit-logs-preview'],
    queryFn: async () => {
      const response = await api.get('/admin/audit-logs')
      return response.data
    },
    enabled: !!user,
  })

  const { data: fraudSignals, isLoading: fraudLoading } = useQuery({
    queryKey: ['admin-fraud-signals-preview'],
    queryFn: async () => {
      const response = await api.get('/admin/fraud-signals')
      return response.data
    },
    enabled: !!user,
  })

  // Update form data when settings are loaded
  useEffect(() => {
    if (settings) {
      setFormData({
        max_session_duration_minutes: settings.maxSessionDurationMinutes,
        min_session_duration_minutes: settings.minSessionDurationMinutes,
        max_submissions_per_device_per_session: settings.maxSubmissionsPerDevicePerSession,
        max_submissions_per_ip_per_session: settings.maxSubmissionsPerIpPerSession,
        geofence_enabled: settings.geofenceEnabled,
        geofence_center_lat: settings.geofenceCenterLat || '',
        geofence_center_lng: settings.geofenceCenterLng || '',
        geofence_radius_meters: settings.geofenceRadiusMeters || '',
        geo_required: settings.geoRequired,
        offline_retries_allowed: settings.offlineRetriesAllowed,
      })
    }
  }, [settings])

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.patch('/admin/system-settings', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] })
      alert('Settings updated successfully!')
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to update settings')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(formData)
  }

  const handleLogout = () => {
    authService.logout()
    router.push('/login/admin')
  }

  if (!mounted || !user) return null

  const settingsForm = isLoading ? (
    <div className="text-center py-12">Loading...</div>
  ) : (
    <form onSubmit={handleSubmit} className="space-y-6">
            {/* Session Duration */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Session Duration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Session Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.max_session_duration_minutes || ''}
                    onChange={(e) => setFormData({ ...formData, max_session_duration_minutes: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Session Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.min_session_duration_minutes || ''}
                    onChange={(e) => setFormData({ ...formData, min_session_duration_minutes: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            {/* Anti-Fraud Limits */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Anti-Fraud Limits</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Submissions Per Device Per Session
                  </label>
                  <input
                    type="number"
                    value={formData.max_submissions_per_device_per_session || ''}
                    onChange={(e) => setFormData({ ...formData, max_submissions_per_device_per_session: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Prevents buddy punching. Typically set to 1.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Submissions Per IP Per Session
                  </label>
                  <input
                    type="number"
                    value={formData.max_submissions_per_ip_per_session || ''}
                    onChange={(e) => setFormData({ ...formData, max_submissions_per_ip_per_session: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Prevents IP-based attacks. Typically 100-200 for classrooms.
                  </p>
                </div>
              </div>
            </div>

            {/* Geofencing */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Geofencing</h2>
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.geofence_enabled || false}
                    onChange={(e) => setFormData({ ...formData, geofence_enabled: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Enable Geofencing</span>
                </label>
                
                {formData.geofence_enabled && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Center Latitude
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={formData.geofence_center_lat || ''}
                          onChange={(e) => setFormData({ ...formData, geofence_center_lat: parseFloat(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="e.g., 40.7128"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Center Longitude
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={formData.geofence_center_lng || ''}
                          onChange={(e) => setFormData({ ...formData, geofence_center_lng: parseFloat(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="e.g., -74.0060"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Radius (meters)
                      </label>
                      <input
                        type="number"
                        value={formData.geofence_radius_meters || ''}
                        onChange={(e) => setFormData({ ...formData, geofence_radius_meters: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="e.g., 300"
                      />
                    </div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.geo_required || false}
                        onChange={(e) => setFormData({ ...formData, geo_required: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Require Location (reject if location not provided)
                      </span>
                    </label>
                  </>
                )}
              </div>
            </div>

            {/* Offline Settings */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Offline & Retry</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Offline Retries Allowed
                </label>
                <input
                  type="number"
                  value={formData.offline_retries_allowed || ''}
                  onChange={(e) => setFormData({ ...formData, offline_retries_allowed: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md max-w-xs"
                />
                <p className="text-xs text-gray-500 mt-1">
                  How many times students can retry attendance submission on network errors.
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
    </form>
  )

  const legacyContent = (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="text-primary-600 hover:text-primary-700">
              ← Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          </div>
          <button onClick={handleLogout} className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900">
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {settingsForm}
      </main>
    </div>
  )

  const auditEntries = Array.isArray(auditLogs) ? auditLogs.slice(0, 8) : []
  const fraudEntries = Array.isArray(fraudSignals) ? fraudSignals.slice(0, 8) : []

  const renderAuditPanel = () => (
    <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Denetim Kayıtları</h2>
          <p className="text-sm text-gray-500">Son {auditEntries.length} olay</p>
        </div>
        <Link href="/admin/audit-logs" className="text-sm text-primary-600 hover:underline">
          Tümünü Gör
        </Link>
      </div>
      {auditLoading ? (
        <div className="p-6 text-center text-gray-500">Kayıtlar yükleniyor...</div>
      ) : auditEntries.length === 0 ? (
        <div className="p-6 text-center text-gray-500">Henüz denetim kaydı yok.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">
                  Zaman
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">
                  Kullanıcı
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">
                  Aksiyon
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">
                  Detay
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {auditEntries.map((log: any) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap text-gray-900">
                    {formatDateTime(log.created_at)}
                  </td>
                  <td className="px-4 py-2">
                    <div className="font-medium text-gray-900">{log.actor_name}</div>
                    <div className="text-xs text-gray-500 capitalize">{log.actor_type}</div>
                  </td>
                  <td className="px-4 py-2">
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    {log.entity_type} – {log.details || 'Detay yok'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )

  const formatSignalType = (type?: string) =>
    type
      ?.split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')

  const renderFraudPanel = () => (
    <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Fraud Signals</h2>
          <p className="text-sm text-gray-500">Son {fraudEntries.length} uyarı</p>
        </div>
        <Link href="/admin/fraud-signals" className="text-sm text-primary-600 hover:underline">
          Tümünü Gör
        </Link>
      </div>
      {fraudLoading ? (
        <div className="p-6 text-center text-gray-500">Uyarılar yükleniyor...</div>
      ) : fraudEntries.length === 0 ? (
        <div className="p-6 text-center text-gray-500">Şüpheli aktivite bulunmadı. 🎉</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">
                  Tarih
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">
                  Tip
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">
                  Ders
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">
                  Öğrenci
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {fraudEntries.map((signal: any) => (
                <tr key={signal.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap text-gray-900">
                    {formatDateTime(signal.created_at)}
                  </td>
                  <td className="px-4 py-2">
                    <span className="px-2 py-1 text-xs rounded-full bg-red-50 text-red-600">
                      {formatSignalType(signal.signal_type)}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-700">
                    {signal.session?.course?.name || '-'}
                  </td>
                  <td className="px-4 py-2 text-gray-700">
                    {signal.flagged_student_id || 'Bilinmiyor'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )

  if (theme === 'a2') {
    const sections = [
      {
        key: 'settings' as const,
        title: 'Sistem Ayarları',
        description: 'Oturum ve güvenlik limitlerini yapılandırın.',
      },
      {
        key: 'audit' as const,
        title: 'Denetim Kayıtları',
        description: 'Yetkili işlemleri ve değişiklikleri inceleyin.',
      },
      {
        key: 'fraud' as const,
        title: 'Fraud Signals',
        description: 'Şüpheli yoklama girişlerini analiz edin.',
      },
    ]

    const renderActivePanel = () => {
      if (activeModule === 'audit') return renderAuditPanel()
      if (activeModule === 'fraud') return renderFraudPanel()
      return (
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
          {settingsForm}
        </div>
      )
    }

    return (
      <AdminA2Layout user={user} onLogout={handleLogout}>
        <section className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sections.map((section) => (
              <button
                key={section.key}
                type="button"
                onClick={() => setActiveModule(section.key)}
                className={`text-left rounded-3xl border p-6 transition ${
                  activeModule === section.key
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white border-gray-100 hover:border-gray-200 text-gray-900'
                }`}
              >
                <h3 className="text-xl font-semibold">{section.title}</h3>
                <p className={`text-sm mt-2 ${activeModule === section.key ? 'text-white/80' : 'text-gray-600'}`}>
                  {section.description}
                </p>
              </button>
            ))}
          </div>

          {renderActivePanel()}
        </section>
      </AdminA2Layout>
    )
  }

  return legacyContent
}

