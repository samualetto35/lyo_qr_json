'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Link from 'next/link'
import { authService } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { LoginL1 } from '@/components/login/login-l1'

const loginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function AdminLoginPage() {
  const router = useRouter()
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
      setError(err.response?.data?.message || 'E-posta veya şifre hatalı')
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

      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="sr-only">
            E-posta adresi
          </label>
          <input
            {...register('email')}
            id="email"
            type="email"
            autoComplete="email"
            className="appearance-none block w-full rounded-lg px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
            placeholder="E-posta adresi"
            style={{ fontSize: '16px' }}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="password" className="sr-only">
            Şifre
          </label>
          <input
            {...register('password')}
            id="password"
            type="password"
            autoComplete="current-password"
            className="appearance-none block w-full rounded-lg px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
            placeholder="Şifre"
            style={{ fontSize: '16px' }}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>
      </div>

      <div>
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Giriş yapılıyor...' : 'Yönetici olarak giriş yap'}
        </Button>
      </div>

      <div className="text-center space-y-2">
        <Link
          href="/login/teacher"
          className="text-sm text-primary-600 hover:text-primary-500 block"
        >
          Bunun yerine Öğretmen girişi yap
        </Link>
        <Link
          href="/login/doctor"
          className="text-sm text-primary-600 hover:text-primary-500 block"
        >
          Bunun yerine Doktor girişi yap
        </Link>
      </div>
    </form>
  )

  return (
    <LoginL1
      title="Yönetici Girişi"
      subtitle="Lütfen yönetici kimlik bilgileriniz ile giriş yapın"
      illustrationSrc="/a_modern_glassmorphism-style_login_background_for_a_school_system_administrator_feature_soft_floati_b5mwd4isxzw30ta7e1t2_1.png"
    >
      <div className="mt-8">{formContent}</div>
    </LoginL1>
  )
}

