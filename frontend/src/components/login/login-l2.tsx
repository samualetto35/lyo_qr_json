'use client'

import { ReactNode } from 'react'

interface LoginL2Props {
  title: string
  subtitle: string
  children: ReactNode
  imageSrc?: string
}

export function LoginL2({ title, subtitle, children, imageSrc }: LoginL2Props) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Desktop Layout */}
          <div className="hidden md:flex min-h-[600px]">
            {/* Left Side - Image */}
            <div className="w-1/2 relative bg-gradient-to-br from-blue-50 to-indigo-100">
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt="Login"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="w-32 h-32 mx-auto mb-4 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center">
                      <svg
                        className="w-16 h-16 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
                    <p className="text-sm text-gray-600 mt-2">{subtitle}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Side - Form */}
            <div className="w-1/2 p-8 lg:p-12 flex flex-col justify-center">
              <div className="mb-6">
                <h2 className="text-3xl font-extrabold text-gray-900">{title}</h2>
                <p className="mt-2 text-sm text-gray-600">{subtitle}</p>
              </div>
              {children}
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden p-6">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-extrabold text-gray-900">{title}</h2>
              <p className="mt-2 text-sm text-gray-600">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

