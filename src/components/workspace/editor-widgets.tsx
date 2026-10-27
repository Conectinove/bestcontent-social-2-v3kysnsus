import { useState, useEffect, useRef, type ChangeEvent } from 'react'
import { Loader2, Wand2, Upload, Image as ImageIcon, Layout, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { NetworkHashtagGenerator } from '@/components/NetworkHashtagGenerator'
import { getTemplates } from '@/services/post-templates'

const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'Facebook', 'LinkedIn', 'Twitter/X']

export function ContentDraftWidget({
  content,
  setContent,
}: {
  content: string
  setContent: (v: string) => void
}) {
  return (
    <Textarea
      value={content}
      onChange={(e) => setContent(e.target.value)}
      className="h-20 text-xs resize-none"
      placeholder="Conteúdo do post..."
    />
  )
}

import { AI_VOICE_TONES } from '@/services/voice-tones'

export const CAPTION_TONES = AI_VOICE_TONES.map((t) => ({
  id: t.id,
  label: t.label,
  emoji: t.emoji,
  description: t.description,
  badge: t.badge,
}))
export function CaptionWidget({
  caption,
  setCaption,
  onImprove,
  improving,
  onGenerateVariations,
  variations,
  onSelectVariation,
  currentTone,
  onToneChange,
  currentPlatform = 'Instagram',
  onPlatformChange,
}: {
  caption: string
  setCaption: (v: string) => void
  onImprove: () => void
  improving: boolean
  onGenerateVariations?: () => void
  variations?: Array<{ title: string; text: string; cta?: string }>
  onSelectVariation?: (text: string) => void
  currentTone?: string
  onToneChange?: (tone: string) => void
  currentPlatform?: string
  onPlatformChange?: (platform: string) => void
}) {
  const [localTone, setLocalTone] = useState<string>(() => {
    return currentTone || localStorage.getItem('bestcontent_caption_tone') || 'profissional'
  })

  const handleSelectTone = (toneId: string) => {
    setLocalTone(toneId)
    localStorage.setItem('bestcontent_caption_tone', toneId)
    onToneChange?.(toneId)
  }

  return (
    <div className="space-y-2.5">
      {/* Seletor de Tom de Voz da Legenda */}
      <div className="space-y-1">
        <label className="text-[10px] font-semibold text-muted-foreground flex items-center justify-between">
          <span>Tom de Voz da IA</span>
          <span className="text-[9px] text-purple-600 dark:text-purple-400 font-bold capitalize">
            {CAPTION_TONES.find((t) => t.id === (currentTone || localTone))?.label}
          </span>
        </label>
        <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
          {CAPTION_TONES.map((t) => {
            const active = (currentTone || localTone) === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleSelectTone(t.id)}
                className={`text-[9px] px-2 py-0.5 rounded-full font-semibold shrink-0 transition-all ${
                  active
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-muted/70 text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.emoji} {t.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onImprove}
          disabled={improving || !caption.trim()}
          className="text-[10px] h-6 gap-1 text-primary flex-1 border border-primary/20"
        >
          {improving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
          Melhorar com IA
        </Button>
        {onGenerateVariations && (
          <Button
            variant="outline"
            size="sm"
            onClick={onGenerateVariations}
            disabled={improving}
            className="text-[10px] h-6 gap-1 px-2 border-primary/30 text-purple-600 dark:text-purple-400"
            title="Gerar 3 opções de legendas contextuais no tom escolhido"
          >
            <Sparkles className="w-3 h-3" />3 Opções
          </Button>
        )}
      </div>

      {variations && variations.length > 0 && (
        <div className="space-y-1.5 p-2 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-900/40 rounded-lg">
          <p className="text-[10px] font-bold text-foreground flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            Sugestões da IA (clique para aplicar):
          </p>
          <div className="space-y-1 max-h-36 overflow-y-auto">
            {variations.map((v, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onSelectVariation?.(v.cta ? `${v.text}\n\n👉 ${v.cta}` : v.text)}
                className="w-full text-left p-1.5 rounded bg-card hover:bg-muted text-[10px] border border-border/60 transition-colors"
              >
                <span className="font-semibold text-purple-600 dark:text-purple-400 block truncate">
                  {v.title}
                </span>
                <span className="text-muted-foreground line-clamp-2 mt-0.5">{v.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <Textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        className="h-24 text-xs resize-none"
        placeholder="Legenda do post..."
      />
      <span className="text-[10px] text-muted-foreground float-right">
        {caption.length} caracteres
      </span>

      {/* Widget integrado de Hashtags com chips por rede social */}
      <NetworkHashtagGenerator
        contentSource={caption}
        selectedNetwork={currentPlatform}
        onNetworkChange={(net) => onPlatformChange?.(net)}
        onApplyHashtags={(tags) => {
          setCaption(caption ? `${caption}\n\n${tags}` : tags)
        }}
        currentHashtags={caption}
        compact
      />
    </div>
  )
}

export function MediaWidget({
  mediaPreview,
  onFileChange,
  onOpenImageBank,
}: {
  mediaPreview: string
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void
  onOpenImageBank?: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  return (
    <div className="space-y-2">
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onFileChange}
      />
      {mediaPreview ? (
        <div className="relative rounded-lg overflow-hidden border border-border">
          <img src={mediaPreview} alt="Preview" className="w-full h-24 object-cover" />
          <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center text-white text-[10px] gap-2 transition-opacity p-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="bg-white/20 hover:bg-white/30 px-2 py-1 rounded flex items-center gap-1"
            >
              <Upload className="w-3 h-3" /> Upload
            </button>
            {onOpenImageBank && (
              <button
                type="button"
                onClick={onOpenImageBank}
                className="bg-purple-600/80 hover:bg-purple-600 px-2 py-1 rounded flex items-center gap-1"
              >
                <ImageIcon className="w-3 h-3" /> Banco
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="h-24 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors p-2 text-center"
          >
            <Upload className="w-4 h-4" />
            <span className="text-[10px]">Enviar imagem</span>
          </button>
          {onOpenImageBank ? (
            <button
              type="button"
              onClick={onOpenImageBank}
              className="h-24 rounded-lg border-2 border-dashed border-purple-500/40 bg-purple-50/20 dark:bg-purple-950/20 flex flex-col items-center justify-center gap-1 text-purple-600 dark:text-purple-400 hover:border-purple-500 transition-colors p-2 text-center"
            >
              <ImageIcon className="w-4 h-4" />
              <span className="text-[10px] font-semibold">Banco Interno</span>
            </button>
          ) : null}
        </div>
      )}
    </div>
  )
}

export function ScheduleWidget(props: {
  brandId: string
  setBrandId: (v: string) => void
  platform: string
  setPlatform: (v: string) => void
  status: string
  setStatus: (v: string) => void
  scheduledDate: string
  setScheduledDate: (v: string) => void
  brands: any[]
}) {
  const selectClass = 'w-full text-[10px] bg-muted border border-border rounded-md px-2 py-1.5'
  return (
    <div className="space-y-2.5">
      <div>
        <label className="text-[10px] font-semibold block mb-1">Marca</label>
        <select
          value={props.brandId}
          onChange={(e) => props.setBrandId(e.target.value)}
          className={selectClass}
        >
          {props.brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-[10px] font-semibold block mb-1">Plataforma</label>
        <select
          value={props.platform}
          onChange={(e) => props.setPlatform(e.target.value)}
          className={selectClass}
        >
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-[10px] font-semibold block mb-1">Data</label>
        <Input
          type="date"
          value={props.scheduledDate}
          onChange={(e) => props.setScheduledDate(e.target.value)}
          className="text-[10px] h-8"
        />
      </div>
      <div>
        <label className="text-[10px] font-semibold block mb-1">Status</label>
        <select
          value={props.status}
          onChange={(e) => props.setStatus(e.target.value)}
          className={selectClass}
        >
          <option value="draft">Rascunho</option>
          <option value="scheduled">Agendado</option>
          <option value="published">Publicado</option>
          <option value="approved">Aprovado</option>
        </select>
      </div>
    </div>
  )
}

export function PreviewWidget(props: {
  caption: string
  platform: string
  brandName: string
  mediaPreview: string
}) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="p-2 flex items-center gap-2 border-b border-border bg-muted/50">
        <div className="w-6 h-6 rounded-full bg-primary shrink-0" />
        <span className="text-[10px] font-semibold truncate">{props.brandName || 'Marca'}</span>
        <span className="text-[9px] text-muted-foreground ml-auto">{props.platform}</span>
      </div>
      <div className="h-28 bg-muted">
        {props.mediaPreview && (
          <img src={props.mediaPreview} alt="Preview" className="w-full h-full object-cover" />
        )}
      </div>
      <div className="p-2">
        <p className="text-[10px] line-clamp-3 text-muted-foreground">
          {props.caption || 'Legenda aparecerá aqui...'}
        </p>
      </div>
    </div>
  )
}

export function MetricsWidget() {
  const metrics = [
    { label: 'Engajamento', value: '4.2%', trend: '+0.8%' },
    { label: 'Alcance', value: '12.4k', trend: '+1.2k' },
    { label: 'Curtidas', value: '892', trend: '+45' },
    { label: 'Comentários', value: '67', trend: '+12' },
  ]
  return (
    <div className="space-y-1.5">
      {metrics.map((m) => (
        <div key={m.label} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
          <span className="text-[10px] text-muted-foreground">{m.label}</span>
          <div className="text-right">
            <span className="text-xs font-bold">{m.value}</span>
            <span className="text-[9px] text-emerald-500 ml-1">{m.trend}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export function TemplatesWidget({ onSelect }: { onSelect?: (id: string) => void }) {
  const [templates, setTemplates] = useState<any[]>([])
  useEffect(() => {
    getTemplates()
      .then((data) => setTemplates(data || []))
      .catch(() => {})
  }, [])
  if (templates.length === 0)
    return <p className="text-[10px] text-muted-foreground text-center py-2">Nenhum template</p>
  return (
    <div className="space-y-1.5">
      {templates.slice(0, 6).map((t) => (
        <button
          key={t.id}
          onClick={() => onSelect?.(t.id)}
          className="w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Layout className="w-3 h-3 text-primary shrink-0" />
            <span className="text-[10px] font-medium truncate">{t.name}</span>
            <Badge variant="secondary" className="text-[9px] ml-auto shrink-0">
              {t.type}
            </Badge>
          </div>
        </button>
      ))}
    </div>
  )
}
