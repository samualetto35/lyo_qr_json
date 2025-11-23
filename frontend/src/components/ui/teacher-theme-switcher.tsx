'use client'

import { useTeacherTheme } from '@/contexts/teacher-theme.context'

export function TeacherThemeSwitcher() {
  const { theme, setTheme } = useTeacherTheme()

  return (
    <button
      onClick={() => setTheme(theme === 't1' ? 't2' : 't1')}
      className="px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
      title={`Switch to ${theme === 't1' ? 'T2' : 'T1'} theme`}
    >
      {theme === 't1' ? 'T2' : 'T1'}
    </button>
  )
}

