'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { UIThemeProvider } from '@/contexts/ui-theme.context'
import { DoctorThemeProvider } from '@/contexts/doctor-theme.context'
import { TeacherThemeProvider } from '@/contexts/teacher-theme.context'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: 1,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <UIThemeProvider>
        <DoctorThemeProvider>
          <TeacherThemeProvider>
            {children}
          </TeacherThemeProvider>
        </DoctorThemeProvider>
      </UIThemeProvider>
    </QueryClientProvider>
  )
}

