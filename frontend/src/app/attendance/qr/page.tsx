'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import api from '@/lib/api'
import { getDeviceFingerprint } from '@/lib/device-fingerprint'
import { getGeolocation } from '@/lib/geolocation'
import { Button } from '@/components/ui/button'

const attendanceSchema = z.object({
  student_id: z.string().min(1, 'Student ID is required'),
})

type AttendanceForm = z.infer<typeof attendanceSchema>

function QRAttendanceContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const token = searchParams.get('token')

  const [isValidating, setIsValidating] = useState(true)
  const [sessionValid, setSessionValid] = useState(false)
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [alreadyRecorded, setAlreadyRecorded] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AttendanceForm>({
    resolver: zodResolver(attendanceSchema),
  })

  useEffect(() => {
    validateSession()
  }, [sessionId, token])

  const validateSession = async () => {
    if (!sessionId || !token) {
      setError('Invalid QR code')
      setIsValidating(false)
      return
    }

    try {
      const response = await api.get('/attendance/session/validate-public', {
        params: {
          attendance_session_id: sessionId,
          qr_token: token,
        },
      })

      if (response.data.valid) {
        setSessionValid(true)
        setSessionInfo(response.data)
      } else {
        setError(response.data.reason || 'Session is invalid')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to validate session')
    } finally {
      setIsValidating(false)
    }
  }

  const onSubmit = async (data: AttendanceForm) => {
    try {
      setIsSubmitting(true)
      setError('')

      // Get device fingerprint
      const deviceId = await getDeviceFingerprint()

      // Get geolocation if required
      let geo = null
      if (sessionInfo?.requires_geo) {
        geo = await getGeolocation()
        if (!geo && sessionInfo.requires_geo) {
          setError('Location permission is required. Please enable location and try again.')
          setIsSubmitting(false)
          return
        }
      }

      const response = await api.post('/attendance/submit', {
        attendance_session_id: sessionId,
        qr_token: token,
        student_id: data.student_id,
        client_device_id: deviceId,
        geo,
      })

      if (response.data.status === 'success') {
        setSuccess(true)
        if (response.data.already_recorded) {
          setAlreadyRecorded(true)
        }
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to submit attendance'
      
      // Check if it's a network error (not a validation error from server)
      if (!err.response) {
        setError(`Connection problem. Your attendance was NOT recorded. Please retry. (Attempt ${retryCount + 1}/3)`)
        setRetryCount(retryCount + 1)
      } else {
        setError(errorMsg)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Validating session...</p>
        </div>
      </div>
    )
  }

  if (!sessionValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Session Invalid</h3>
            <p className="mt-2 text-sm text-gray-600">{error}</p>
            <p className="mt-4 text-xs text-gray-500">
              Please ask your teacher for a valid QR code
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              {alreadyRecorded ? 'Already Recorded' : 'Attendance Recorded'}
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              {alreadyRecorded
                ? 'Your attendance was already recorded for this session.'
                : 'Your attendance has been successfully recorded.'}
            </p>
            <div className="mt-6 text-xs text-gray-500">
              <p>Course: {sessionInfo?.course_name}</p>
              <p>Teacher: {sessionInfo?.teacher_name}</p>
              {sessionInfo?.session_date && <p>Date: {sessionInfo.session_date}</p>}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">QR Attendance</h2>
          <div className="mt-4 text-sm text-gray-600 space-y-1">
            <p>
              <span className="font-semibold">Course:</span> {sessionInfo?.course_name}
            </p>
            <p>
              <span className="font-semibold">Teacher:</span> {sessionInfo?.teacher_name}
            </p>
            {sessionInfo?.session_name && (
              <p>
                <span className="font-semibold">Session:</span> {sessionInfo.session_name}
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
              {retryCount > 0 && retryCount < 3 && (
                <p className="text-xs text-red-600 mt-2">
                  You can retry {3 - retryCount} more time(s)
                </p>
              )}
            </div>
          )}

          {sessionInfo?.requires_geo && (
            <div className="rounded-md bg-blue-50 p-4">
              <p className="text-xs text-blue-800">
                📍 Location permission will be requested to verify you are on campus
              </p>
            </div>
          )}

          <div>
            <label htmlFor="student_id" className="block text-sm font-medium text-gray-700 mb-2">
              Enter Your Student ID
            </label>
            <input
              {...register('student_id')}
              id="student_id"
              type="text"
              placeholder="e.g., S2024001"
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-lg"
            />
            {errors.student_id && (
              <p className="mt-1 text-sm text-red-600">{errors.student_id.message}</p>
            )}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Submitting...' : 'Submit Attendance'}
          </Button>
        </form>

        <div className="mt-6 text-xs text-gray-500 text-center">
          <p>Make sure you entered your correct Student ID</p>
          <p className="mt-1">Session status: {sessionInfo?.is_open ? '✅ Open' : '❌ Closed'}</p>
        </div>
      </div>
    </div>
  )
}

export default function QRAttendancePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <QRAttendanceContent />
    </Suspense>
  )
}

