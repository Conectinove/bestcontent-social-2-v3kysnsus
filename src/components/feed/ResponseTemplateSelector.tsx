import { useState, useEffect } from 'react'
import {
  ResponseTemplate,
  RESPONSE_CATEGORY_LABELS,
  getResponseTemplates,
  interpolateTemplate,
  incrementTemplateUsage,
} from '@/services/response-templates'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Bookmark, Sparkles, ChevronDown } from 'lucide-react'

interface ResponseTemplateSelectorProps {
  authorName?: string
  authorHandle?: string
  onSelect: (interpolatedText: string) => void
  network?: string
  size?: 'sm' | 'default'
  className?: string
}

export function ResponseTemplateSelector({
  authorName = '',
  authorHandle = '',
  onSelect,
  network,
  size = 'sm',
  className = '',
}: ResponseTemplateSelectorProps) {
  const [templates, setTemplates] = useState<ResponseTemplate[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    getResponseTemplates({ network })
      .then((items) => {
        if (mounted) setTemplates(items)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [network])

  const handleApply = (template: ResponseTemplate) => {
    const text = interpolateTemplate(template.content, {
      nome: authorName || authorHandle || 'amigo(a)',
      handle: authorHandle,
    })
    onSelect(text)
    incrementTemplateUsage(template.id).catch((err) => {
      console.warn('[ResponseTemplateSelector] Erro ao incrementar uso:', err)
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size={size}
          variant="outline"
          className={`gap-1.5 border-dashed border-primary/40 hover:bg-primary/5 text-primary text-xs ${className}`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Usar template</span>
          <ChevronDown className="w-3 h-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-72 max-h-80 overflow-y-auto">
        <DropdownMenuLabel className="flex items-center justify-between text-xs font-semibold py-1.5">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Modelos de Resposta Prontos
          </span>
          <Badge variant="secondary" className="text-[10px] font-mono">
            {templates.length}
          </Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {loading ? (
          <div className="py-4 text-center text-xs text-muted-foreground animate-pulse">
            Carregando templates...
          </div>
        ) : templates.length === 0 ? (
          <div className="py-4 px-2 text-center text-xs text-muted-foreground">
            Nenhum template cadastrado no momento.
          </div>
        ) : (
          templates.map((t) => {
            const catInfo = RESPONSE_CATEGORY_LABELS[t.category] || RESPONSE_CATEGORY_LABELS.geral
            return (
              <DropdownMenuItem
                key={t.id}
                onClick={() => handleApply(t)}
                className="flex flex-col items-start gap-1 p-2 cursor-pointer hover:bg-primary/5 rounded-md"
              >
                <div className="flex items-center justify-between w-full gap-2">
                  <span className="font-medium text-xs text-foreground truncate">{t.title}</span>
                  <Badge className={`text-[9px] px-1 py-0 ${catInfo.color}`}>{catInfo.label}</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-tight">
                  {t.content}
                </p>
                {t.shortcut && (
                  <span className="text-[10px] font-mono text-primary/80">{t.shortcut}</span>
                )}
              </DropdownMenuItem>
            )
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
