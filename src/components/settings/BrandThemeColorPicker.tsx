import { useEffect, useState } from 'react'
import { Palette, Check, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { setBrandThemeColor, getBrandThemeColor, type PortalColors } from '@/services/brand-portals'

const PRESETS = [
  { name: 'Violeta', hex: '#7C3AED' },
  { name: 'Azul', hex: '#2563EB' },
  { name: 'Esmeralda', hex: '#059669' },
  { name: 'Âmbar', hex: '#D97706' },
  { name: 'Rosa', hex: '#DB2777' },
  { name: 'Ciano', hex: '#0891B2' },
]

const COLOR_FIELDS: {
  key: keyof Omit<PortalColors, 'accentColor'>
  label: string
  hint: string
  fallback: string
}[] = [
  {
    key: 'bgColor',
    label: 'Fundo',
    hint: 'ex: #FFFFFF ou vazio = tema padrão',
    fallback: '#FFFFFF',
  },
  {
    key: 'textColor',
    label: 'Texto',
    hint: 'ex: #0F172A ou vazio = tema padrão',
    fallback: '#0F172A',
  },
  {
    key: 'buttonColor',
    label: 'Botões',
    hint: 'ex: #7C3AED ou vazio = usa a cor de destaque',
    fallback: '#7C3AED',
  },
]

interface BrandThemeColorPickerProps {
  brandId: string
  initialColor?: string | null
  initialColors?: Partial<PortalColors>
  onSaved?: (hex: string) => void
}

const HEX_RE = /^#?[0-9a-fA-F]{6}$/

/** Personalizar cores do portal por marca (accent + fundo/texto/botões). */
export function BrandThemeColorPicker({
  brandId,
  initialColor,
  initialColors,
  onSaved,
}: BrandThemeColorPickerProps) {
  const [color, setColor] = useState(initialColor || PRESETS[0].hex)
  const [extras, setExtras] = useState<Partial<PortalColors>>(initialColors || {})
  const [saved, setSaved] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let alive = true
    getBrandThemeColor(brandId).then((c) => {
      if (alive && c) {
        setColor(c)
        setSaved(c)
      }
    })
    return () => {
      alive = false
    }
  }, [brandId])

  useEffect(() => {
    if (initialColors) setExtras(initialColors)
  }, [initialColors?.bgColor, initialColors?.textColor, initialColors?.buttonColor]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    if (!HEX_RE.test(color)) {
      toast({
        title: 'Cor de destaque inválida',
        description: 'Use o formato #RRGGBB (ex: #7C3AED).',
        variant: 'destructive',
      })
      return
    }
    for (const f of COLOR_FIELDS) {
      const v = (extras[f.key] || '').trim()
      if (v && !HEX_RE.test(v)) {
        toast({
          title: `${f.label} inválida`,
          description: `Use #RRGGBB ou deixe vazio para usar o tema padrão.`,
          variant: 'destructive',
        })
        return
      }
    }
    setLoading(true)
    try {
      const final = await setBrandThemeColor(brandId, color, {
        bgColor: extras.bgColor?.trim() || '',
        textColor: extras.textColor?.trim() || '',
        buttonColor: extras.buttonColor?.trim() || '',
      })
      setSaved(final)
      toast({
        title: 'Cores do portal salvas',
        description: `A marca agora usa ${final} como destaque.`,
      })
      onSaved?.(final)
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro ao salvar as cores',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Palette className="w-4 h-4 text-primary" />
        <p className="text-xs font-semibold">Cores do portal desta marca</p>
      </div>
      <p className="text-[11px] text-muted-foreground">
        A cor de destaque aparece em botões, links e destaques; as demais pintam o fundo, o texto e
        os botões do portal público. Vazio = usa o tema padrão.
      </p>

      {/* Cor de destaque (presets + livre) */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.hex}
            type="button"
            title={p.name}
            onClick={() => setColor(p.hex)}
            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-transform hover:scale-110 ${
              color.toLowerCase() === p.hex.toLowerCase()
                ? 'border-foreground scale-110'
                : 'border-transparent'
            }`}
            style={{ backgroundColor: p.hex }}
          >
            {color.toLowerCase() === p.hex.toLowerCase() && (
              <Check className="w-4 h-4 text-white" />
            )}
          </button>
        ))}
        <label className="w-8 h-8 rounded-full border-2 border-dashed border-border flex items-center justify-center cursor-pointer">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="sr-only"
          />
          <span className="text-[10px] font-bold text-muted-foreground">+</span>
        </label>
      </div>
      <div className="flex items-center gap-2">
        <Input
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="font-mono text-xs w-32"
          placeholder="#7C3AED"
        />
        <div
          className="w-9 h-9 rounded-lg border border-border"
          style={{ backgroundColor: color }}
        />
      </div>

      {/* Cores extras do portal */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        {COLOR_FIELDS.map((f) => {
          const v = extras[f.key] || ''
          return (
            <div key={f.key} className="space-y-1.5">
              <label className="text-[11px] font-semibold text-foreground">{f.label}</label>
              <div className="flex items-center gap-2">
                <label className="w-8 h-8 shrink-0 rounded-md border border-border overflow-hidden cursor-pointer">
                  <input
                    type="color"
                    value={v || f.fallback}
                    onChange={(e) => setExtras((x) => ({ ...x, [f.key]: e.target.value }))}
                    className="size-full cursor-pointer"
                    aria-label={`Cor de ${f.label}`}
                  />
                </label>
                <Input
                  value={v}
                  onChange={(e) => setExtras((x) => ({ ...x, [f.key]: e.target.value }))}
                  placeholder="padrão"
                  className="font-mono text-xs h-8"
                />
              </div>
              <p className="text-[10px] text-muted-foreground">{f.hint}</p>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleSave} disabled={loading} className="text-xs gap-1 ml-auto">
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5" />
          )}
          Aplicar à marca
        </Button>
      </div>
      {saved && (
        <p className="text-[10px] text-muted-foreground">
          Cor de destaque atual: <span className="font-mono font-bold">{saved}</span>
        </p>
      )}
    </div>
  )
}
