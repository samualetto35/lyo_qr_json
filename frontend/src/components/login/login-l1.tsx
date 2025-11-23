'use client'

import { ReactNode } from 'react'

interface LoginL1Props {
  title: string
  subtitle: string
  children: ReactNode
}

export function LoginL1({ title, subtitle, children }: LoginL1Props) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {title}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {subtitle}
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}

