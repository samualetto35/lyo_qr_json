'use client'

import { ReactNode, useState } from 'react'

interface LoginL1Props {
  title: string
  subtitle: string
  children: ReactNode
}

export function LoginL1({ title, subtitle, children }: LoginL1Props) {
  const [showInfo, setShowInfo] = useState(false)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="flex items-center justify-between text-[13px] text-gray-600">
          <span className="font-medium tracking-tight">
            Sabancı Lise Yaz Okulu Yoklama Sistemi
          </span>
          <button
            type="button"
            onClick={() => setShowInfo(true)}
            className="h-7 w-7 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label="Bilgilendirme"
          >
            ?
          </button>
        </div>

        {showInfo && (
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-600">
              Sisteme giriş yapabilmek için Lise Yaz Okulları e-posta adresi tarafından
              yetkilendirilmiş olmanız gerekmektedir. Gerekli bilgileri ilgili mail
              iletisinde bulabilirsiniz.
            </p>
            <div className="mt-3 text-right">
              <button
                type="button"
                onClick={() => setShowInfo(false)}
                className="text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                Kapat
              </button>
            </div>
          </div>
        )}

        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-600">{subtitle}</p>
        </div>

        {children}
      </div>
    </div>
  )
}


