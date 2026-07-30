import { useState, useEffect, useRef, type ChangeEvent } from 'react'
import { Loader2, Wand2, Upload, Image as ImageIcon, Layout } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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

export function CaptionWidget({
  caption,
  setCaption,
  onImprove,
  improving,
}: {
  caption: string
  setCaption: (v: string) => void
  onImprove: () => void
  improving: boolean
}) {
  return (
    <div className="space-y-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={onImprove}
        disabled={improving || !caption.trim()}
        className="text-[10px] h-6 gap-1 text-primary w-full border border-primary/20"
      >
        {improving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
        Melhorar com IA
      </Button>
      <Textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        className="h-24 text-xs resize-none"
        placeholder="Legenda do post..."
      />
      <span className="text-[10px] text-muted-foreground float-right">
        {caption.length} caracteres
      </span>
    </div>
  )
}

export function MediaWidget({
  mediaPreview,
  onFileChange,
}: {
  mediaPreview: string
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void
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
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center text-white text-[10px] gap-1 transition-opacity"
          >
            <Upload className="w-3 h-3" /> Trocar imagem
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full h-24 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
        >
          <ImageIcon className="w-5 h-5" />
          <span className="text-[10px]">Enviar imagem</span>
        </button>
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
