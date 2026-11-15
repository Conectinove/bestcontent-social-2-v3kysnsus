import { Check } from 'lucide-react'
import type { StudioThemeOption } from '@/hooks/use-studio-theme'
import { NETWORK_THEMES, type NetworkThemeId } from '@/lib/network-themes'

interface ThemePreviewCardProps {
  theme: StudioThemeOption
  /** Tema atualmente ativo (mostra o check). */
  active?: boolean
  /** Prévia "hover": escala levemente e mostra o botão de aplicar. */
  hovered?: boolean
  compact?: boolean
  onApply?: () => void
}

/**
 * Mini mockup de pré-visualização de tema: um cartão com fundo/superfície,
 * botão primário e texto nas cores reais do tema — sem aplicar nada de fato.
 * Usado no seletor (hover) e no editor completo de temas.
 */
export function themeMockupStyle(theme: StudioThemeOption): React.CSSProperties {
  const c = theme.colors
  const bg = c?.background || (theme.mode === 'dark' ? '#09090b' : '#ffffff')
  const surface = c?.surface || (theme.mode === 'dark' ? '#18181b' : '#f4f4f5')
  const primary = c?.primary || '#7c3aed'
  const text = c?.text || (theme.mode === 'dark' ? '#fafafa' : '#18181b')
  return {
    background: bg,
    color: text,
    borderColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)',
  }
}

export function themeMockupSurfaceStyle(theme: StudioThemeOption): React.CSSProperties {
  const c = theme.colors
  return {
    background: c?.surface || (theme.mode === 'dark' ? '#18181b' : '#f4f4f5'),
  }
}

export function themeMockupPrimaryStyle(theme: StudioThemeOption): React.CSSProperties {
  return { background: theme.colors?.primary || '#7c3aed', color: '#ffffff' }
}

export function themeMockupTextStyle(theme: StudioThemeOption): React.CSSProperties {
  return { color: theme.colors?.text || (theme.mode === 'dark' ? '#fafafa' : '#18181b') }
}

/**
 * Cor de accent da REDE SOCIAL do tema (para a faixa/ponto de accent na prévia).
 * Tema com rede-alvo usa o primary da rede (Instagram roxo, TikTok ciano...);
 * tema sem rede usa o accentOverride persistido ou o accent padrão do tema.
 */
export function themeNetworkAccentCss(theme: StudioThemeOption): string {
  const networkId = (theme.network || 'none') as NetworkThemeId
  const networkTheme =
    networkId !== 'none' && NETWORK_THEMES[networkId as keyof typeof NETWORK_THEMES]
      ? NETWORK_THEMES[networkId as keyof typeof NETWORK_THEMES]
      : null
  if (networkTheme) return `hsl(${networkTheme.primary})`
  if (theme.accentOverride) return `hsl(${theme.accentOverride})`
  return theme.colors?.primary || '#7c3aed'
}

export const ThemePreviewCard: React.FC<ThemePreviewCardProps> = ({
  theme,
  active = false,
  hovered = false,
  compact = false,
  onApply,
}) => {
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-lg border shadow-sm transition-transform duration-150 ${
        hovered ? 'scale-[1.03]' : ''
      } ${compact ? 'w-28' : 'w-36'}`}
      style={themeMockupStyle(theme)}
      aria-hidden
    >
      {/* Faixa de accent da rede social do tema (sutil, 2px no topo) */}
      <span
        className="absolute inset-x-0 top-0 h-0.5"
        style={{ background: themeNetworkAccentCss(theme) }}
      />
      {/* "Janela" do mockup: barra + cartão + botão */}
      <div className="flex items-center gap-1 px-2 py-1.5" style={themeMockupSurfaceStyle(theme)}>
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: themeNetworkAccentCss(theme) }}
        />
        <span className="h-1.5 w-8 rounded-full bg-current opacity-20" />
        <span className="ml-auto h-3.5 w-9 rounded-full" style={themeMockupPrimaryStyle(theme)} />
      </div>
      <div className="space-y-1.5 px-2 py-2">
        <div className="rounded-md px-2 py-1.5" style={themeMockupSurfaceStyle(theme)}>
          <div
            className="mb-1 h-1.5 w-3/4 rounded-full opacity-90"
            style={{ background: theme.colors?.text || 'currentColor' }}
          />
          <div
            className="h-1.5 w-1/2 rounded-full opacity-40"
            style={{ background: theme.colors?.text || 'currentColor' }}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="h-4 rounded-md px-2 text-[8px] font-bold leading-4"
            style={themeMockupPrimaryStyle(theme)}
          >
            Aa
          </span>
          <span
            className="h-4 flex-1 rounded-md border border-dashed opacity-30"
            style={{ borderColor: theme.colors?.text || 'currentColor' }}
          />
        </div>
      </div>
      {active && (
        <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
          <Check className="h-3 w-3" />
        </span>
      )}
    </div>
  )
}

export default ThemePreviewCard
