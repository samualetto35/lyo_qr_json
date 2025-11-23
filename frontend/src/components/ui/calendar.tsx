'use client'

import { useState, useRef, useEffect } from 'react'

interface CalendarProps {
  value: string
  onChange: (date: string) => void
  maxDate?: string
  className?: string
}

export function Calendar({ value, onChange, maxDate, className = '' }: CalendarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const calendarRef = useRef<HTMLDivElement>(null)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const date = value ? new Date(value) : new Date()
    return new Date(date.getFullYear(), date.getMonth(), 1)
  })

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const selectedDate = value ? new Date(value) : null
  const maxDateObj = maxDate ? new Date(maxDate) : null

  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ]

  const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay()
    return firstDay === 0 ? 6 : firstDay - 1 // Monday = 0
  }

  const isDateDisabled = (day: number) => {
    if (!maxDateObj) return false
    const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    checkDate.setHours(0, 0, 0, 0)
    const maxDateCopy = new Date(maxDateObj)
    maxDateCopy.setHours(0, 0, 0, 0)
    return checkDate > maxDateCopy
  }

  const handleDateClick = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const dateStr = date.toISOString().split('T')[0]
    if (!isDateDisabled(day)) {
      onChange(dateStr)
      setIsOpen(false)
    }
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const daysInMonth = getDaysInMonth(currentMonth)
  const firstDay = getFirstDayOfMonth(currentMonth)
  const days = []

  // Empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day)
  }

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <div ref={calendarRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between"
        style={{ fontSize: '16px' }}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
          {value ? formatDisplayDate(value) : 'Tarih seçin'}
        </span>
        <svg
          className="w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-80">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={prevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h3 className="text-lg font-semibold text-gray-900">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <button
              type="button"
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day Names */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              if (day === null) {
                return <div key={index} className="aspect-square" />
              }

              const isSelected =
                selectedDate &&
                day === selectedDate.getDate() &&
                currentMonth.getMonth() === selectedDate.getMonth() &&
                currentMonth.getFullYear() === selectedDate.getFullYear()

              const isDisabled = isDateDisabled(day)
              const isToday =
                day === new Date().getDate() &&
                currentMonth.getMonth() === new Date().getMonth() &&
                currentMonth.getFullYear() === new Date().getFullYear()

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDateClick(day)}
                  disabled={isDisabled}
                  className={`aspect-square rounded-lg text-sm transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white font-semibold'
                      : isDisabled
                      ? 'text-gray-300 cursor-not-allowed'
                      : isToday
                      ? 'bg-blue-50 text-blue-600 font-medium hover:bg-blue-100'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

