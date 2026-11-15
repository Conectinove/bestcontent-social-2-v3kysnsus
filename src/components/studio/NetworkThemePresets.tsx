/**
 * Bloco "Presets por rede social" do gerenciador de temas (Configurações →
 * Aparência). Lista as redes do motor src/lib/network-themes.ts e, para cada
 * uma, aplica o accent da rede ao tema ativo (persistido via use-app-theme —
 * localStorage + banco studio_themes). Mostra estado "ativo" quando o tema
 * atual já usa o accent daquela rede.
 */
import { Check, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppTheme } from '@/hooks/use-app-theme'
import type { Brand } from '@/types'
import { NETWORK_THEME_LIST, type NetworkThemeId } from '@/lib/network-themes'

interface NetworkThemePresetsProps {
  brands: Brand[]
}

/** Converte tokens HSL "291 60% 22%" em CSS `hsl(291 60% 22%)` para o swatch. */
function accentCss(tokens: string): string {
  return `hsl(${tokens})`
}

export function NetworkThemePresets({ brands }: NetworkThemePresetsProps) {
  const { networkId, applyNetworkAccent } = useAppTheme(brands)

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Wand2 className="h-3.5 w-3.5 text-primary" />
        <p className="text-xs font-semibold">Presets por rede social</p>
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Aplica o accent da rede ao tema ativo — a cor muda sem trocar o tema base nem o modo
        (claro/escuro). A escolha fica salva e sobrevive ao recarregar a página.
      </p>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {NETWORK_THEME_LIST.map((nt) => {
          const active = networkId === nt.id
          return (
            <Button
              key={nt.id}
              type="button"
              size="sm"
              variant={active ? 'secondary' : 'outline'}
              className={`h-8 justify-start gap-2 px-2 text-xs ${
                active ? 'border-primary/50' : ''
              }`}
              onClick={() => applyNetworkAccent(nt.id as NetworkThemeId)}
              title={
                active
                  ? `O tema atual já usa o accent de ${nt.name}`
                  : `Aplicar accent de ${nt.name} ao tema atual`
              }
            >
              <span
                className="h-3 w-3 shrink-0 rounded-full border border-black/20"
                style={{ background: accentCss(nt.primary) }}
                aria-hidden
              />
              <span className="truncate">{nt.name}</span>
              {active && <Check className="ml-auto h-3 w-3 shrink-0 text-primary" />}
            </Button>
          )
        })}
      </div>
      {networkId !== 'none' && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 text-[11px] text-muted-foreground"
          onClick={() => applyNetworkAccent('none')}
        >
          Remover accent de rede (voltar ao padrão do tema)
        </Button>
      )}
    </div>
  )
}

export default NetworkThemePresets
