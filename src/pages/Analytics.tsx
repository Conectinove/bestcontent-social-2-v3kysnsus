import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getSocialAccounts } from '@/services/social_accounts'
import { getSocialMetrics } from '@/services/social_metrics'

import { AnalyticsHeader } from '@/components/analytics/AnalyticsHeader'
import { NoticeBanner } from '@/components/analytics/NoticeBanner'
import { ProfileHeaderCard } from '@/components/analytics/ProfileHeaderCard'
import { MetricsCards } from '@/components/analytics/MetricsCards'
import { FollowerChart } from '@/components/analytics/FollowerChart'
import { TopPostsGallery } from '@/components/analytics/TopPostsGallery'
import { CrmFunnelVisualBlock } from '@/components/analytics/CrmFunnelVisualBlock'
import { ExportDialog } from '@/components/analytics/ExportDialog'
import { ScheduleEmailDialog } from '@/components/analytics/ScheduleEmailDialog'
import { AdvancedMetricsModal } from '@/components/analytics/AdvancedMetricsModal'

import type { SocialAccountRecord, SocialMetricRecord } from '@/types'

export default function Analytics() {
  const { user } = useAuth()
  const [demoMode, setDemoMode] = useState(true)
  const [platform, setPlatform] = useState<'all' | 'Instagram' | 'Facebook'>('all')
  const [period, setPeriod] = useState('30d')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [, setAccounts] = useState<SocialAccountRecord[]>([])
  const [metrics, setMetrics] = useState<SocialMetricRecord[]>([])

  const [openExport, setOpenExport] = useState(false)
  const [openSchedule, setOpenSchedule] = useState(false)
  const [openAdvancedDemo, setOpenAdvancedDemo] = useState(false)

  const loadRealData = useCallback(async () => {
    if (!user?.id) return
    setIsRefreshing(true)
    try {
      const [accList, metList] = await Promise.all([
        getSocialAccounts(user.id),
        getSocialMetrics(user.id, platform),
      ])
      setAccounts(accList)
      setMetrics(metList)
    } catch (_) {
      // handled
    } finally {
      setIsRefreshing(false)
    }
  }, [user?.id, platform])

  useEffect(() => {
    if (!demoMode) {
      loadRealData()
    }
  }, [demoMode, loadRealData])

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      if (!demoMode) loadRealData()
      setIsRefreshing(false)
    }, 800)
  }

  const demoChartData = [
    { date: '30/06', followers: 14931 },
    { date: '03/07', followers: 14931 },
    { date: '06/07', followers: 14902 },
    { date: '09/07', followers: 14881 },
    { date: '12/07', followers: 14881 },
    { date: '15/07', followers: 14881 },
    { date: '18/07', followers: 14881 },
    { date: '21/07', followers: 14859 },
    { date: '24/07', followers: 14859 },
    { date: '27/07', followers: 14860 },
    { date: '30/07', followers: 14867 },
  ]

  const getCalculatedStats = () => {
    if (demoMode || metrics.length === 0) {
      if (platform === 'Instagram') {
        return { totalFollowers: 14867, growth30d: -53, growthPercent: -0.4, postsCount: 12 }
      }
      if (platform === 'Facebook') {
        return { totalFollowers: 14933, growth30d: 12, growthPercent: 0.1, postsCount: 8 }
      }
      return { totalFollowers: '29.8k', growth30d: -41, growthPercent: -0.2, postsCount: 20 }
    }

    const latest = metrics[metrics.length - 1]?.followers_count || 14867
    const earliest = metrics[0]?.followers_count || latest
    const diff = latest - earliest
    const pct = earliest > 0 ? Number(((diff / earliest) * 100).toFixed(1)) : 0

    return {
      totalFollowers: latest,
      growth30d: diff,
      growthPercent: pct,
      postsCount: metrics.reduce((acc, m) => acc + (m.posts_count || 0), 0),
    }
  }

  const stats = getCalculatedStats()

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-10">
      <AnalyticsHeader
        demoMode={demoMode}
        onToggleDemoMode={setDemoMode}
        selectedPlatform={platform}
        onSelectPlatform={setPlatform}
        onOpenExport={() => setOpenExport(true)}
        onOpenSchedule={() => setOpenSchedule(true)}
      />

      <NoticeBanner onOpenAdvancedDemo={() => setOpenAdvancedDemo(true)} />

      <ProfileHeaderCard
        platform={platform}
        userName={user?.name}
        userAvatar={user?.avatar}
        period={period}
        onPeriodChange={setPeriod}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      <MetricsCards
        platform={platform}
        totalFollowers={stats.totalFollowers}
        growth30d={stats.growth30d}
        growthPercent={stats.growthPercent}
        postsCount={stats.postsCount}
      />

      {/* Gráfico Visual de Funil do CRM em Tempo Real */}
      <CrmFunnelVisualBlock />

      <FollowerChart data={demoChartData} />

      <TopPostsGallery platform={platform} />

      <ExportDialog open={openExport} onOpenChange={setOpenExport} />
      <ScheduleEmailDialog
        open={openSchedule}
        onOpenChange={setOpenSchedule}
        userEmail={user?.email}
      />
      <AdvancedMetricsModal open={openAdvancedDemo} onOpenChange={setOpenAdvancedDemo} />
    </div>
  )
}
