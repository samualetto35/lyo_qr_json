'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authService } from '@/lib/auth'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function AdminSettingsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [user, setUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const [formData, setFormData] = useState<any>({})

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

  return (
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
        {isLoading ? (
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
        )}
      </main>
    </div>
  )
}

