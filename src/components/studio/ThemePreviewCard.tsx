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
 * Mini mockup de pré-visualização de tema: uma "janela" do app em miniatura —
 * mini sidebar (3 itens, um com accent), header com avatar + botão primário
 * "Novo post", card de post com linhas de texto e chip da rede social do tema
 * com o accent — tudo nas cores reais do tema, sem aplicar nada de fato.
 * Usado no seletor (hover), no gerenciador e no editor completo de temas.
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

/** Rede-alvo do tema (null quando o tema não tem rede). */
function themeNetwork(theme: StudioThemeOption) {
  const networkId = (theme.network || 'none') as NetworkThemeId
  if (networkId === 'none') return null
  return NETWORK_THEMES[networkId as keyof typeof NETWORK_THEMES] || null
}

/**
 * Cor de accent da REDE SOCIAL do tema (para a faixa/ponto de accent na prévia).
 * Tema com rede-alvo usa o primary da rede (Instagram roxo, TikTok ciano...);
 * tema sem rede usa o accentOverride persistido ou o accent padrão do tema.
 */
export function themeNetworkAccentCss(theme: StudioThemeOption): string {
  const networkTheme = themeNetwork(theme)
  if (networkTheme) return `hsl(${networkTheme.primary})`
  if (theme.accentOverride) return `hsl(${theme.accentOverride})`
  return theme.colors?.primary || '#7c3aed'
}

/** Linha de texto "falso" (barra arredondada) na cor do texto do tema. */
function TextLine({
  theme,
  className,
  opacity = 1,
}: {
  theme: StudioThemeOption
  className: string
  opacity?: number
}) {
  return (
    <span
      className={`block rounded-full ${className}`}
      style={{ background: theme.colors?.text || 'currentColor', opacity }}
    />
  )
}

export const ThemePreviewCard: React.FC<ThemePreviewCardProps> = ({
  theme,
  active = false,
  hovered = false,
  compact = false,
  onApply,
}) => {
  const network = themeNetwork(theme)
  const accentCss = themeNetworkAccentCss(theme)

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-lg border shadow-sm transition-transform duration-150 ${
        hovered ? 'scale-[1.03]' : ''
      } ${compact ? 'w-32' : 'w-40'}`}
      style={themeMockupStyle(theme)}
      aria-hidden
    >
      {/* Faixa de accent da rede social do tema (sutil, 2px no topo) */}
      <span className="absolute inset-x-0 top-0 h-0.5" style={{ background: accentCss }} />

      {/* Corpo: mini sidebar + área principal */}
      <div className="flex" style={{ height: compact ? 76 : 96 }}>
        {/* Mini sidebar: logo + 3 itens (o 2º com accent) */}
        <div
          className="flex w-7 shrink-0 flex-col items-center gap-1.5 py-1.5"
          style={themeMockupSurfaceStyle(theme)}
        >
          <span
            className="h-2 w-2 rounded-sm"
            style={{ background: theme.colors?.primary || '#7c3aed' }}
          />
          <span
            className="h-1 w-3.5 rounded-full"
            style={{ background: accentCss, opacity: 0.9 }}
          />
          <TextLine theme={theme} className="h-1 w-3.5" opacity={0.35} />
          <TextLine theme={theme} className="h-1 w-3.5" opacity={0.35} />
        </div>

        {/* Área principal */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Header: avatar + título + botão primário "Novo post" */}
          <div
            className="flex items-center gap-1 border-b px-1.5 py-1"
            style={{
              ...themeMockupSurfaceStyle(theme),
              borderColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            }}
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: accentCss, opacity: 0.7 }}
            />
            <TextLine theme={theme} className="h-1 w-6" opacity={0.55} />
            <span
              className="ml-auto rounded-full px-1.5 text-[6px] font-bold leading-[10px]"
              style={themeMockupPrimaryStyle(theme)}
            >
              Novo post
            </span>
          </div>

          {/* Card de post: chip da rede + linhas de texto */}
          <div className="min-w-0 flex-1 space-y-1 px-1.5 py-1.5">
            <div className="flex items-center gap-1">
              {network && (
                <span
                  className="rounded-full px-1 text-[6px] font-bold leading-[10px] text-white"
                  style={{ background: accentCss }}
                >
                  {network.name}
                </span>
              )}
              <TextLine theme={theme} className="h-1 w-8" opacity={0.3} />
            </div>
            <div className="rounded-md px-1.5 py-1" style={themeMockupSurfaceStyle(theme)}>
              <TextLine theme={theme} className="mb-1 h-1 w-3/4" opacity={0.9} />
              <TextLine theme={theme} className="h-1 w-1/2" opacity={0.4} />
            </div>
            <div className="flex items-center gap-1">
              <span
                className="h-3 rounded-md px-1.5 text-[6px] font-bold leading-3"
                style={themeMockupPrimaryStyle(theme)}
              >
                Aa
              </span>
              <span
                className="h-3 flex-1 rounded-md border border-dashed opacity-30"
                style={{ borderColor: theme.colors?.text || 'currentColor' }}
              />
            </div>
          </div>
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
