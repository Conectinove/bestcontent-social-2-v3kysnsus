import { useState } from 'react'
import {
  Hash,
  Copy,
  Check,
  Sparkles,
  Loader2,
  Instagram,
  Linkedin,
  Video,
  Twitter,
  Youtube,
  Facebook,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { generateHashtags, NETWORK_HASHTAG_SPECS } from '@/services/ai'
import { toast } from '@/hooks/use-toast'

export const HASHTAG_NETWORKS = [
  { id: 'instagram', label: 'Instagram', icon: Instagram, countText: '8–12 tags' },
  { id: 'tiktok', label: 'TikTok', icon: Video, countText: '4–6 tags' },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, countText: '3–5 tags' },
  { id: 'twitter', label: 'X / Twitter', icon: Twitter, countText: '2–4 tags' },
  { id: 'youtube', label: 'YouTube', icon: Youtube, countText: '3–5 tags' },
  { id: 'facebook', label: 'Facebook', icon: Facebook, countText: '2–4 tags' },
]

export interface NetworkHashtagGeneratorProps {
  contentSource: string
  selectedNetwork?: string
  onNetworkChange?: (network: string) => void
  onApplyHashtags: (hashtagsString: string, network: string) => void
  currentHashtags?: string
  className?: string
  compact?: boolean
}

export function NetworkHashtagGenerator({
  contentSource,
  selectedNetwork = 'instagram',
  onNetworkChange,
  onApplyHashtags,
  currentHashtags = '',
  className = '',
  compact = false,
}: NetworkHashtagGeneratorProps) {
  const [activeNetwork, setActiveNetwork] = useState<string>(() => {
    const lower = (selectedNetwork || 'instagram').toLowerCase()
    if (lower.includes('tik')) return 'tiktok'
    if (lower.includes('link')) return 'linkedin'
    if (lower.includes('twit') || lower === 'x') return 'twitter'
    if (lower.includes('you')) return 'youtube'
    if (lower.includes('face')) return 'facebook'
    return 'instagram'
  })

  const [loading, setLoading] = useState(false)
  const [generatedTags, setGeneratedTags] = useState<string[]>([])
  const [lastGeneratedNetwork, setLastGeneratedNetwork] = useState<string>('')
  const [copied, setCopied] = useState(false)

  const handleSelectNetwork = (netId: string) => {
    setActiveNetwork(netId)
    onNetworkChange?.(netId)
  }

  const handleGenerate = async () => {
    const text = (contentSource || '').trim()
    if (!text) {
      toast({
        title: 'Tema necessário',
        description: 'Digite o conteúdo ou legenda para a IA calibrar as hashtags.',
      })
      return
    }

    setLoading(true)
    try {
      const res = await generateHashtags({
        content: text,
        platform: activeNetwork,
      })
      const tags = (res?.hashtags || []).map((t) => (t.startsWith('#') ? t : `#${t}`))
      setGeneratedTags(tags)
      setLastGeneratedNetwork(activeNetwork)
      toast({
        title: `Hashtags para ${activeNetwork.toUpperCase()}!`,
        description: `${tags.length} tags geradas de acordo com as boas práticas da rede.`,
      })
    } catch {
      toast({
        title: 'Erro na geração',
        description: 'Não foi possível gerar hashtags no momento.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    const textToCopy = generatedTags.length > 0 ? generatedTags.join(' ') : currentHashtags.trim()
    if (!textToCopy) return
    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({
      title: 'Copiado para a área de transferência!',
      description: 'Você pode colar diretamente no seu post.',
    })
  }

  const handleApply = () => {
    const textToApply = generatedTags.join(' ')
    if (!textToApply) return
    onApplyHashtags(textToApply, activeNetwork)
    toast({
      title: 'Hashtags aplicadas!',
      description: `Tags vinculadas para ${activeNetwork.toUpperCase()}.`,
    })
  }

  const spec = NETWORK_HASHTAG_SPECS[activeNetwork] || NETWORK_HASHTAG_SPECS.instagram

  return (
    <div
      className={`rounded-xl border border-purple-200/60 dark:border-purple-900/40 bg-purple-50/40 dark:bg-purple-950/20 p-3 space-y-2.5 ${className}`}
    >
      {/* Cabeçalho do seletor */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-purple-600/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Hash className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-foreground truncate">
            Sugerir Hashtags por Rede
          </span>
        </div>
        <Badge
          variant="outline"
          className="text-[10px] font-mono border-purple-400/40 text-purple-700 dark:text-purple-300 shrink-0"
        >
          {spec.range}
        </Badge>
      </div>

      {/* Chips de Seleção de Rede */}
      <div
        role="group"
        aria-label="Selecionar rede social para hashtags"
        className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar"
      >
        {HASHTAG_NETWORKS.map((net) => {
          const Icon = net.icon
          const isSelected = activeNetwork === net.id
          return (
            <button
              key={net.id}
              type="button"
              onClick={() => handleSelectNetwork(net.id)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isSelected
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-card hover:bg-muted text-muted-foreground border border-border/70'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{net.label}</span>
            </button>
          )
        })}
      </div>

      {/* Dica / Estilo da rede selecionada */}
      {!compact && (
        <p className="text-[10px] text-muted-foreground leading-tight">
          <strong className="font-semibold text-foreground">{spec.name}:</strong>{' '}
          {spec.styleDescription}
        </p>
      )}

      {/* Botão de Disparo da IA */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={handleGenerate}
          disabled={loading}
          className="h-7 px-3 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-lg gap-1.5 font-bold shadow-xs cursor-pointer flex-1"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          <span>{loading ? 'Calibrando tags...' : `Gerar para ${spec.name}`}</span>
        </Button>
      </div>

      {/* Exibição das Hashtags Geradas */}
      {generatedTags.length > 0 && (
        <div className="space-y-2 pt-1 border-t border-purple-200/50 dark:border-purple-900/30 animate-in fade-in-50">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-bold text-purple-700 dark:text-purple-300">
              {generatedTags.length} tags ({lastGeneratedNetwork.toUpperCase()}):
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-muted-foreground hover:text-foreground bg-card border border-border cursor-pointer transition-colors"
                title="Copiar todas as hashtags"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-emerald-500" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>{copied ? 'Copiado!' : 'Copiar'}</span>
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer transition-colors shadow-2xs"
                title="Aplicar diretamente na legenda do post"
              >
                <Check className="w-3 h-3" />
                <span>Aplicar 1-Clique</span>
              </button>
            </div>
          </div>

          {/* Tags agrupadas — clicáveis individualmente para inserir em 1 clique */}
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-card/90 rounded-lg border border-border/60">
            {generatedTags.map((tag, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onApplyHashtags(tag, activeNetwork)
                  toast({
                    title: 'Hashtag adicionada!',
                    description: `Adicionado ${tag} à sua legenda.`,
                  })
                }}
                className="text-[11px] font-mono text-purple-600 dark:text-purple-400 bg-purple-500/10 hover:bg-purple-600 hover:text-white px-2 py-0.5 rounded-md cursor-pointer transition-all border border-purple-500/20 active:scale-95"
                title={`Clique para inserir ${tag} diretamente na legenda`}
              >
                {tag} <span className="opacity-60 text-[9px]">+</span>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground italic">
            Dica: Clique em qualquer hashtag individual para inseri-la, ou em &quot;Aplicar
            1-Clique&quot; para inserir todas.
          </p>
        </div>
      )}
    </div>
  )
}
