'use client'

import { ReactNode } from 'react'

interface LoginL1Props {
  title: string
  subtitle: string
  children: ReactNode
  illustrationSrc?: string
}

export function LoginL1({
  title,
  subtitle,
  children,
  illustrationSrc,
}: LoginL1Props) {
  const imageSrc =
    illustrationSrc ?? '/images/login-default.png'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 px-3 sm:px-4 lg:px-6">
      <div className="w-full max-w-6xl space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="hidden md:flex">
            <div className="w-full h-[640px] rounded-[24px] overflow-hidden">
              <div
                className="w-full h-full bg-cover bg-center"
                style={{
                  backgroundImage: `url(${imageSrc})`,
                }}
              ></div>
            </div>
          </div>

          <div className="rounded-3xl p-8 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-extrabold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-600">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}


