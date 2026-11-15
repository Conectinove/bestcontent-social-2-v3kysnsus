/**
 * Bloco "Accent por rede social" no rodapé do seletor de temas do Header.
 * Cada rede é um chip com o swatch da cor de accent — clicar aplica o accent
 * da rede ao tema ativo (persistente); a rede ativa fica marcada com um check.
 */
import { Check, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NETWORK_THEME_LIST, type NetworkThemeId } from '@/lib/network-themes'

interface NetworkThemeSubmenuProps {
  networkId?: NetworkThemeId
  /** Troca a rede do seletor (aplica o accent + persiste). */
  onSelectNetwork?: (id: NetworkThemeId) => void
  /** Aplica o accent da rede ao tema ativo e persiste. */
  onApplyNetworkAccent?: (id: NetworkThemeId) => void
}

export function NetworkThemeSubmenu({
  networkId = 'none',
  onSelectNetwork,
  onApplyNetworkAccent,
}: NetworkThemeSubmenuProps) {
  const [open, setOpen] = useState(false)
  const apply = onApplyNetworkAccent || onSelectNetwork
  const activeName =
    networkId !== 'none'
      ? NETWORK_THEME_LIST.find((n) => n.id === networkId)?.name || networkId
      : null

  if (!apply) return null

  return (
    <div className="px-2 pb-2">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 w-full justify-between gap-1 text-[11px]"
          >
            <span className="truncate">
              Accent por rede social{activeName ? ` · ${activeName}` : ''}
            </span>
            <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-64 w-56 overflow-y-auto">
          {NETWORK_THEME_LIST.map((nt) => (
            <DropdownMenuItem
              key={nt.id}
              className="gap-2 text-xs"
              onClick={() => {
                apply(nt.id as NetworkThemeId)
                setOpen(false)
              }}
            >
              <span
                className="h-3 w-3 shrink-0 rounded-full border border-black/20"
                style={{ background: `hsl(${nt.primary})` }}
                aria-hidden
              />
              <span className="flex-1 truncate">{nt.name}</span>
              {networkId === nt.id && <Check className="h-3 w-3 shrink-0 text-primary" />}
            </DropdownMenuItem>
          ))}
          {networkId !== 'none' && (
            <DropdownMenuItem
              className="gap-2 text-xs text-muted-foreground"
              onClick={() => {
                apply('none')
                setOpen(false)
              }}
            >
              Remover accent de rede
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default NetworkThemeSubmenu
