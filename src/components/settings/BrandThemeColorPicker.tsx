import { useEffect, useState } from 'react'
import { Palette, Check, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { setBrandThemeColor, getBrandThemeColor } from '@/services/brand-portals'

const PRESETS = [
  { name: 'Violeta', hex: '#7C3AED' },
  { name: 'Azul', hex: '#2563EB' },
  { name: 'Esmeralda', hex: '#059669' },
  { name: 'Âmbar', hex: '#D97706' },
  { name: 'Rosa', hex: '#DB2777' },
  { name: 'Ciano', hex: '#0891B2' },
]

interface BrandThemeColorPickerProps {
  brandId: string
  initialColor?: string | null
  onSaved?: (hex: string) => void
}

/** Personalizar cor do tema por marca (pedido 3) — grava em brands.accent_color. */
export function BrandThemeColorPicker({
  brandId,
  initialColor,
  onSaved,
}: BrandThemeColorPickerProps) {
  const [color, setColor] = useState(initialColor || PRESETS[0].hex)
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

  const handleSave = async () => {
    setLoading(true)
    try {
      const final = await setBrandThemeColor(brandId, color)
      setSaved(final)
      toast({ title: 'Cor do tema salva', description: `A marca agora usa ${final} no portal.` })
      onSaved?.(final)
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro ao salvar a cor',
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
        <p className="text-xs font-semibold">Cor do tema desta marca</p>
      </div>
      <p className="text-[11px] text-muted-foreground">
        A cor aparece no portal público desta marca (botões, links e destaques).
      </p>
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
        />
        <div
          className="w-9 h-9 rounded-lg border border-border"
          style={{ backgroundColor: color }}
        />
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
          Cor atual da marca: <span className="font-mono font-bold">{saved}</span>
        </p>
      )}
    </div>
  )
}
