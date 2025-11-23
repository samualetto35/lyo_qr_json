'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Link from 'next/link'
import { authService } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { useUITheme } from '@/contexts/ui-theme.context'
import { ThemeSwitcher } from '@/components/ui/theme-switcher'
import { LoginL1 } from '@/components/login/login-l1'
import { LoginL2 } from '@/components/login/login-l2'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function AdminLoginPage() {
  const router = useRouter()
  const { theme } = useUITheme()
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    try {
      setIsLoading(true)
      setError('')
      await authService.loginAdmin(data.email, data.password)
      window.location.href = '/admin/dashboard'
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password')
    } finally {
      setIsLoading(false)
    }
  }

  const formContent = (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className={theme === 'l2' ? 'space-y-4' : 'rounded-md shadow-sm -space-y-px'}>
        <div>
          <label htmlFor="email" className="sr-only">
            Email address
          </label>
          <input
            {...register('email')}
            id="email"
            type="email"
            autoComplete="email"
            className={`appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 ${
              theme === 'l2'
                ? 'rounded-lg text-base'
                : 'rounded-none rounded-t-md sm:text-sm'
            }`}
            placeholder="Email address"
            style={{ fontSize: '16px' }}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="password" className="sr-only">
            Password
          </label>
          <input
            {...register('password')}
            id="password"
            type="password"
            autoComplete="current-password"
            className={`appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 ${
              theme === 'l2'
                ? 'rounded-lg text-base'
                : 'rounded-none rounded-b-md sm:text-sm'
            }`}
            placeholder="Password"
            style={{ fontSize: '16px' }}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>
      </div>

      <div>
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Signing in...' : 'Sign in as Admin'}
        </Button>
      </div>

      <div className="text-center space-y-2">
        <Link
          href="/login/teacher"
          className="text-sm text-primary-600 hover:text-primary-500 block"
        >
          Login as Teacher instead
        </Link>
        <Link
          href="/login/doctor"
          className="text-sm text-primary-600 hover:text-primary-500 block"
        >
          Login as Doctor instead
        </Link>
      </div>
    </form>
  )

  return (
    <>
      <ThemeSwitcher />
      {theme === 'l1' ? (
        <LoginL1 title="Admin Login" subtitle="QR Attendance Platform">
          <div className="mt-8">{formContent}</div>
        </LoginL1>
      ) : (
        <LoginL2 title="Admin Login" subtitle="QR Attendance Platform">
          {formContent}
        </LoginL2>
      )}
    </>
  )
}

