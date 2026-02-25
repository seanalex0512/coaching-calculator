export type Category = 'gym' | 'swimming' | 'math'

export interface CategoryInfo {
  id: Category
  name: string
  color: string
  bgColor: string
  icon: string
}

export const CATEGORIES: Record<Category, CategoryInfo> = {
  gym: {
    id: 'gym',
    name: 'Gym',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    icon: 'dumbbell',
  },
  swimming: {
    id: 'swimming',
    name: 'Swimming',
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    icon: 'waves',
  },
  math: {
    id: 'math',
    name: 'Math',
    color: '#10B981',
    bgColor: '#D1FAE5',
    icon: 'calculator',
  },
}

export interface Student {
  id: string
  name: string
  hourlyRate: number
  category: Category
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Session {
  id: string
  studentId: string
  category: Category
  sessionDate: string
  durationMinutes: number
  price: number
  notes?: string
  status: 'completed' | 'missed' | 'cancelled' | 'pending' | 'rescheduled'
  scheduleSlotId?: string | null
  rescheduledToDate?: string // The new date if this session was rescheduled
  rescheduledToTime?: string // The new time if this session was rescheduled
  createdAt: string
  updatedAt: string
}

export interface ScheduleSlot {
  id: string
  studentId: string
  dayOfWeek: number  // 0=Sunday, 1=Monday, ..., 6=Saturday
  startTime: string  // HH:MM format
  durationMinutes: number
  category: Category
  price: number
  isActive: boolean
  createdAt: string
}

export interface MonthlyStats {
  month: string
  totalSessions: number
  totalEarnings: number
}

export interface CategoryStats {
  category: Category
  totalEarnings: number
  totalSessions: number
  missedSessions: number
  percentage: number
}

export interface StudentWithStats extends Student {
  totalSessions: number
  totalEarnings: number
}
