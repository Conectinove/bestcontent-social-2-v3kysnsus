import { useState } from 'react'
import { InstagramFeedWidget } from './InstagramFeedWidget'
import { TikTokFeedWidget } from './TikTokFeedWidget'
import { YouTubeFeedWidget } from './YouTubeFeedWidget'
import { GoogleAnalyticsFeedWidget } from './GoogleAnalyticsFeedWidget'
import { ChevronDown, ChevronUp, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type FeedWidgetNetwork = 'instagram' | 'tiktok' | 'youtube' | 'analytics'

interface FeedMetricsMultiWidgetProps {
  className?: string
}

export function FeedMetricsMultiWidget({ className = '' }: FeedMetricsMultiWidgetProps) {
  const [activeTab, setActiveTab] = useState<FeedWidgetNetwork>('instagram')
  const [collapsedMobile, setCollapsedMobile] = useState(false)

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Network selector tabs */}
      <div className="flex items-center justify-between gap-1.5 p-1 rounded-xl bg-muted/60 border border-border/80">
        <div className="flex items-center gap-1 flex-1">
          <Button
            type="button"
            variant={activeTab === 'instagram' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('instagram')}
            className={`h-7 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'instagram'
                ? 'bg-card text-foreground shadow-xs border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500" />
            <span>Instagram</span>
          </Button>

          <Button
            type="button"
            variant={activeTab === 'tiktok' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('tiktok')}
            className={`h-7 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'tiktok'
                ? 'bg-card text-foreground shadow-xs border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>TikTok</span>
          </Button>

          <Button
            type="button"
            variant={activeTab === 'youtube' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('youtube')}
            className={`h-7 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'youtube'
                ? 'bg-card text-foreground shadow-xs border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-600" />
            <span>YouTube</span>
          </Button>

          <Button
            type="button"
            variant={activeTab === 'analytics' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('analytics')}
            className={`h-7 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'analytics'
                ? 'bg-card text-foreground shadow-xs border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="hidden sm:inline">Google Analytics</span>
            <span className="sm:hidden">GA4</span>
          </Button>
        </div>

        {/* Mobile toggle button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setCollapsedMobile((prev) => !prev)}
          className="h-7 w-7 rounded-lg lg:hidden text-muted-foreground"
          title={collapsedMobile ? 'Expandir widget' : 'Recolher widget'}
        >
          {collapsedMobile ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5" />
          )}
        </Button>
      </div>

      {/* Widget render */}
      <div className={collapsedMobile ? 'hidden lg:block' : 'block'}>
        {activeTab === 'instagram' && <InstagramFeedWidget />}
        {activeTab === 'tiktok' && <TikTokFeedWidget />}
        {activeTab === 'youtube' && <YouTubeFeedWidget />}
        {activeTab === 'analytics' && <GoogleAnalyticsFeedWidget />}
      </div>
    </div>
  )
}
