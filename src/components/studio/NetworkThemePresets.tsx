/**
 * Bloco "Presets por rede social" do gerenciador de temas (Configurações →
 * Aparência). Duas partes:
 * 1) Accent por rede — aplica o accent da rede ao tema ativo (persistido via
 *    use-app-theme — localStorage + banco studio_themes).
 * 2) Tema completo por rede — mapa rede→tema (`midiaviva_theme_network_map`):
 *    escolher qual TEMA COMPLETO cada rede usa ao abrir um post dela. Sem
 *    associação, a rede usa o tema global + accent (comportamento atual).
 */
import { Check, Link2, Link2Off, Wand2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  const { networkId, applyNetworkAccent, networkThemeMap, setNetworkThemeMapping, allThemes } =
    useAppTheme(brands)
  const [addingNetwork, setAddingNetwork] = useState<NetworkThemeId | ''>('')

  const mapEntries = NETWORK_THEME_LIST.filter((nt) => networkThemeMap[nt.id])

  return (
    <div className="rounded-lg border p-3 space-y-3">
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

      {/* Mapa rede→tema completo: qual tema cada rede usa ao abrir um post dela */}
      <div className="space-y-2 border-t pt-2">
        <div className="flex items-center gap-2">
          <Link2 className="h-3.5 w-3.5 text-primary" />
          <p className="text-xs font-semibold">Tema completo por rede</p>
        </div>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Associe um tema completo a uma rede: ao abrir um post dessa rede, o app aplica
          automaticamente o tema associado (em vez do tema global). Sem associação, vale o tema
          global + accent.
        </p>

        {mapEntries.length > 0 && (
          <ul className="space-y-1.5">
            {mapEntries.map((nt) => {
              const entry = networkThemeMap[nt.id]
              const mappedExists = allThemes.some((t) => t.id === entry?.themeId)
              return (
                <li key={nt.id} className="flex items-center gap-2 rounded-md border px-2 py-1.5">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full border border-black/20"
                    style={{ background: accentCss(nt.primary) }}
                    aria-hidden
                  />
                  <span className="w-20 shrink-0 truncate text-xs font-medium">{nt.name}</span>
                  <Select
                    value={mappedExists ? entry!.themeId : ''}
                    onValueChange={(themeId) =>
                      setNetworkThemeMapping(nt.id as NetworkThemeId, themeId, nt.primary)
                    }
                  >
                    <SelectTrigger className="h-7 flex-1 text-xs" aria-label={`Tema de ${nt.name}`}>
                      <SelectValue placeholder={mappedExists ? 'Tema removido' : 'Escolher tema'} />
                    </SelectTrigger>
                    <SelectContent className="max-h-56">
                      {allThemes.map((t) => (
                        <SelectItem key={t.id} value={t.id} className="text-xs">
                          {t.name}
                          {t.source === 'builtin' ? ' (embutido)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 shrink-0 text-muted-foreground"
                    title={`Remover associação de ${nt.name}`}
                    onClick={() => setNetworkThemeMapping(nt.id as NetworkThemeId, '')}
                  >
                    <Link2Off className="h-3 w-3" />
                  </Button>
                </li>
              )
            })}
          </ul>
        )}

        {/* Nova associação: rede + tema (mesma linha, some quando a rede já tem mapa) */}
        <div className="flex items-center gap-2">
          <Select
            value={addingNetwork}
            onValueChange={(v) => setAddingNetwork(v as NetworkThemeId)}
          >
            <SelectTrigger className="h-7 w-36 text-xs" aria-label="Rede para associar">
              <SelectValue placeholder="Nova rede…" />
            </SelectTrigger>
            <SelectContent className="max-h-56">
              {NETWORK_THEME_LIST.filter((nt) => !networkThemeMap[nt.id]).map((nt) => (
                <SelectItem key={nt.id} value={nt.id} className="text-xs">
                  {nt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            disabled={!addingNetwork}
            onClick={() => {
              if (!addingNetwork) return
              const first = allThemes[0]
              if (first) setNetworkThemeMapping(addingNetwork, first.id)
              setAddingNetwork('')
            }}
          >
            <Link2 className="h-3 w-3" />
            Associar tema
          </Button>
        </div>
      </div>
    </div>
  )
}

export default NetworkThemePresets
