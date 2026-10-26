import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Search,
  Hash,
  MessageSquare,
  HelpCircle,
} from 'lucide-react'
import { analyzeCaptionSeo, type SocialNetwork } from '@/services/seo'

interface PostSeoWidgetProps {
  caption: string
  network?: string
  className?: string
}

export function PostSeoWidget({
  caption,
  network = 'instagram',
  className = '',
}: PostSeoWidgetProps) {
  const normNetwork = (
    ['instagram', 'tiktok', 'youtube', 'linkedin', 'facebook', 'twitter'].includes(
      network.toLowerCase(),
    )
      ? network.toLowerCase()
      : 'instagram'
  ) as SocialNetwork

  const analysis = useMemo(() => {
    return analyzeCaptionSeo(caption, normNetwork)
  }, [caption, normNetwork])

  const scoreColor =
    analysis.score >= 80
      ? 'text-emerald-500'
      : analysis.score >= 60
        ? 'text-amber-500'
        : 'text-rose-500'

  const scoreBadgeBg =
    analysis.score >= 80
      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
      : analysis.score >= 60
        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'

  return (
    <Card className={`rounded-2xl border-border bg-card p-4 space-y-3.5 shadow-xs ${className}`}>
      <div className="flex items-center justify-between pb-2 border-b border-border/80">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Search className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <span>SEO do Post</span>
              <Badge
                variant="outline"
                className={`text-[10px] font-bold px-1.5 py-0 ${scoreBadgeBg}`}
              >
                {analysis.score}/100
              </Badge>
            </h4>
            <span className="text-[10px] text-muted-foreground capitalize">
              Otimização para busca no {normNetwork}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className={`text-xl font-black ${scoreColor}`}>{analysis.score}</span>
          <span className="text-[10px] text-muted-foreground block font-medium">Score</span>
        </div>
      </div>

      <Progress value={analysis.score} className="h-1.5 rounded-full" />

      {/* Critérios avaliados */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* Hook */}
        <div className="p-2 rounded-xl bg-muted/40 border border-border/60 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-purple-500" /> Gancho (Hook)
            </span>
            <span className="font-mono text-[10px] font-bold">
              {analysis.breakdown.hook.score}%
            </span>
          </div>
          <p className="text-[11px] text-foreground/80 line-clamp-2">
            {analysis.breakdown.hook.feedback}
          </p>
        </div>

        {/* CTA */}
        <div className="p-2 rounded-xl bg-muted/40 border border-border/60 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
              <MessageSquare className="w-2.5 h-2.5 text-purple-500" /> Chamada (CTA)
            </span>
            <span className="font-mono text-[10px] font-bold">{analysis.breakdown.cta.score}%</span>
          </div>
          <p className="text-[11px] text-foreground/80 line-clamp-2">
            {analysis.breakdown.cta.feedback}
          </p>
        </div>

        {/* Tamanho */}
        <div className="p-2 rounded-xl bg-muted/40 border border-border/60 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
              <HelpCircle className="w-2.5 h-2.5 text-purple-500" /> Tamanho
            </span>
            <span className="font-mono text-[10px] font-bold">
              {analysis.breakdown.length.charCount} carac.
            </span>
          </div>
          <p className="text-[11px] text-foreground/80 line-clamp-2">
            {analysis.breakdown.length.feedback}
          </p>
        </div>

        {/* Hashtags */}
        <div className="p-2 rounded-xl bg-muted/40 border border-border/60 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
              <Hash className="w-2.5 h-2.5 text-purple-500" /> Hashtags
            </span>
            <span className="font-mono text-[10px] font-bold">
              {analysis.breakdown.hashtags.count} tags
            </span>
          </div>
          <p className="text-[11px] text-foreground/80 line-clamp-2">
            {analysis.breakdown.hashtags.feedback}
          </p>
        </div>
      </div>

      {/* Dicas acionáveis se score < 80 */}
      {analysis.recommendations.length > 0 && (
        <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-500" /> Sugestões para Subir o Score:
          </span>
          <ul className="space-y-0.5 text-[11px] text-foreground/90">
            {analysis.recommendations.slice(0, 2).map((rec, i) => (
              <li key={i} className="flex items-start gap-1">
                <span className="text-purple-600 font-bold">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}
