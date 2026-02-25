import { useState, useMemo } from 'react'
import { useSessions } from '../hooks/useSessions'
import { Category, CATEGORIES, CategoryStats } from '../types'

type TimePeriod = 'week' | 'month' | 'year'

const Insights = () => {
  const { sessions, loading, error } = useSessions()
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month')

  // Filter sessions by time period
  const filteredSessions = useMemo(() => {
    const now = new Date()
    let startDate: Date

    switch (timePeriod) {
      case 'week':
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
    }

    return sessions.filter(
      (s) => new Date(s.sessionDate) >= startDate && new Date(s.sessionDate) <= now
    )
  }, [timePeriod, sessions])

  // Calculate category stats
  const categoryStats = useMemo((): CategoryStats[] => {
    const totalEarnings = filteredSessions
      .filter((s) => s.status === 'completed')
      .reduce((sum, s) => sum + s.price, 0)

    const stats: CategoryStats[] = (Object.keys(CATEGORIES) as Category[]).map(
      (category) => {
        const categorySessions = filteredSessions.filter((s) => s.category === category && s.status !== 'rescheduled')
        const completed = categorySessions.filter((s) => s.status === 'completed')
        const missed = categorySessions.filter(
          (s) => s.status === 'missed' || s.status === 'cancelled'
        )
        const earnings = completed.reduce((sum, s) => sum + s.price, 0)

        return {
          category,
          totalEarnings: earnings,
          totalSessions: completed.length,
          missedSessions: missed.length,
          percentage: totalEarnings > 0 ? (earnings / totalEarnings) * 100 : 0,
        }
      }
    )

    return stats.sort((a, b) => b.totalEarnings - a.totalEarnings)
  }, [filteredSessions])

  const totalEarnings = categoryStats.reduce((sum, s) => sum + s.totalEarnings, 0)
  const totalSessions = categoryStats.reduce((sum, s) => sum + s.totalSessions, 0)
  const totalMissed = categoryStats.reduce((sum, s) => sum + s.missedSessions, 0)

  // Calculate monthly revenue trend for the last 12 months
  const getMonthlyRevenueTrend = () => {
    const months: { month: string; label: string; earnings: number }[] = []
    const now = new Date()

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const monthKey = `${year}-${month}`
      const monthLabel = date.toLocaleDateString('en-US', { month: 'short' })

      const monthEarnings = sessions
        .filter((s) => s.sessionDate.startsWith(monthKey) && s.status === 'completed')
        .reduce((sum, s) => sum + s.price, 0)

      months.push({ month: monthKey, label: monthLabel, earnings: monthEarnings })
    }
    return months
  }

  const monthlyTrend = getMonthlyRevenueTrend()
  const maxTrendEarnings = Math.max(...monthlyTrend.map((m) => m.earnings), 1)

  // Generate SVG path for the line chart
  const generateTrendLine = () => {
    const width = 100
    const height = 100
    const padding = 5

    const points = monthlyTrend.map((month, index) => {
      const x = padding + (index / (monthlyTrend.length - 1)) * (width - padding * 2)
      const y = height - padding - ((month.earnings / maxTrendEarnings) * (height - padding * 2))
      return { x, y, earnings: month.earnings }
    })

    // Create smooth curve using quadratic bezier curves
    let path = `M ${points[0].x} ${points[0].y}`

    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i]
      const next = points[i + 1]
      const midX = (current.x + next.x) / 2

      path += ` Q ${current.x} ${current.y}, ${midX} ${(current.y + next.y) / 2}`
      if (i < points.length - 2) {
        path += ` T ${next.x} ${next.y}`
      } else {
        path += ` Q ${next.x} ${next.y}, ${next.x} ${next.y}`
      }
    }

    return { path, points }
  }

  const { path: trendLinePath, points: trendPoints } = generateTrendLine()

  // Generate donut chart segments with gaps
  const generateDonutSegments = () => {
    const radius = 80
    const circumference = 2 * Math.PI * radius
    const gapDegrees = 20 // Gap between segments in degrees
    const activeSegments = categoryStats.filter((stat) => stat.percentage > 0)
    const gapLength = (gapDegrees / 360) * circumference
    const totalGapLength = gapLength * activeSegments.length
    const availableLength = circumference - totalGapLength
    let currentOffset = gapLength / 2 // Start with half gap for visual balance

    return activeSegments.map((stat) => {
      const segmentLength = (stat.percentage / 100) * availableLength
      const offset = currentOffset
      currentOffset += segmentLength + gapLength

      return {
        ...stat,
        strokeDasharray: `${segmentLength} ${circumference - segmentLength}`,
        strokeDashoffset: -offset,
        color: CATEGORIES[stat.category].color,
      }
    })
  }

  const donutSegments = generateDonutSegments()

  const getTimePeriodLabel = () => {
    switch (timePeriod) {
      case 'week':
        return 'this week'
      case 'month':
        return `this ${new Date().toLocaleDateString('en-US', { month: 'long' })}`
      case 'year':
        return 'this year'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-500">Loading insights...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white sf-pro">
      {/* Custom Apple-style font import */}
      <style>{`
        @import url('https://fonts.cdnfonts.com/css/sf-pro-display');
        .sf-pro {
          font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        .sf-pro-rounded {
          font-family: 'SF Pro Rounded', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
        }
      `}</style>

      <div className="px-4 pt-12 pb-4 max-w-lg mx-auto">
        {/* Header */}
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Analytics</h1>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Donut Chart Section */}
        <div className="relative mb-8">
          {/* Chart and Legend Container with Dark Background */}
          <div className="bg-slate-900 rounded-3xl p-6 mb-6">
            <div className="flex items-center justify-center gap-8">
              {/* SVG Donut Chart */}
              <div className="relative w-48 h-48 flex-shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                  {/* Segments */}
                  {donutSegments.map((segment) => (
                    <circle
                      key={segment.category}
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke={segment.color}
                      strokeWidth="20"
                      strokeLinecap="round"
                      strokeDasharray={segment.strokeDasharray}
                      strokeDashoffset={segment.strokeDashoffset}
                      className="transition-all duration-500"
                    />
                  ))}
                </svg>

                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-[10px] text-slate-400 mb-0.5">
                    Earned {getTimePeriodLabel()}
                  </p>
                  <p className="text-xl font-bold tracking-tight text-white">
                    ${totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Categories Legend - Vertical Stack */}
              <div className="flex flex-col gap-3">
                {categoryStats.map((stat) => {
                  const categoryInfo = CATEGORIES[stat.category]
                  return (
                    <div key={stat.category} className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: categoryInfo.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-300">
                          {categoryInfo.name}
                        </p>
                        <p className="text-lg font-semibold text-white">
                          ${stat.totalEarnings.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Time Period Selector */}
          <div className="flex items-center justify-center gap-6">
            {(['week', 'month', 'year'] as TimePeriod[]).map((period) => (
              <button
                key={period}
                onClick={() => setTimePeriod(period)}
                className={`text-base font-medium capitalize transition-colors ${
                  timePeriod === period
                    ? 'text-slate-900'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-4 px-2 mb-6">
          <div className="text-center">
            <p className="text-2xl font-semibold text-slate-900">{totalSessions}</p>
            <p className="text-sm text-slate-500">Sessions</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-slate-900">{totalMissed}</p>
            <p className="text-sm text-slate-500">Missed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-slate-900">
              {totalSessions > 0
                ? Math.round((totalSessions / (totalSessions + totalMissed)) * 100)
                : 0}%
            </p>
            <p className="text-sm text-slate-500">Attendance</p>
          </div>
        </div>

        {/* Revenue Trend Chart */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Revenue Trend
          </h2>

          {/* Chart Area */}
          <div className="relative">
            <svg className="w-full h-48" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map((y) => (
                <line
                  key={y}
                  x1="0"
                  y1={y}
                  x2="100"
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="0.2"
                />
              ))}

              {/* Gradient fill under the line */}
              <defs>
                <linearGradient id="trendGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Area under the curve */}
              <path
                d={`${trendLinePath} L 100 100 L 5 100 Z`}
                fill="url(#trendGradient)"
              />

              {/* Trend line */}
              <path
                d={trendLinePath}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="0.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points */}
              {trendPoints.map((point, index) => (
                <circle
                  key={index}
                  cx={point.x}
                  cy={point.y}
                  r="1"
                  fill="#3b82f6"
                  className="transition-all duration-300"
                />
              ))}
            </svg>

            {/* X-axis labels */}
            <div className="flex justify-between mt-2 px-1">
              {monthlyTrend.map((month, index) => {
                // Only show every 2nd or 3rd month label to avoid crowding
                const showLabel = index === 0 || index === monthlyTrend.length - 1 || index % 3 === 0
                return (
                  <div
                    key={month.month}
                    className="text-[10px] text-slate-400 flex-1 text-center"
                  >
                    {showLabel ? month.label : ''}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
            <div>
              <p className="text-xs text-slate-500 mb-1">Highest</p>
              <p className="text-base font-semibold text-slate-900">
                ${Math.max(...monthlyTrend.map(m => m.earnings)).toFixed(0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Average</p>
              <p className="text-base font-semibold text-slate-900">
                ${(monthlyTrend.reduce((sum, m) => sum + m.earnings, 0) / monthlyTrend.length).toFixed(0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">This Month</p>
              <p className="text-base font-semibold text-emerald-600">
                ${monthlyTrend[monthlyTrend.length - 1].earnings.toFixed(0)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Insights
