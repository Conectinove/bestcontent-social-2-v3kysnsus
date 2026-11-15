/**
 * Bloco de PARÁGRAFO do Segundo Cérebro com suporte a Markdown.
 * Padrão da casa (v0.0.290+): subcomponente novo em vez de patch em série no
 * MagicAuthorEditor (arquivo grande — patches incrementais já corromperam 3×).
 * Toggle editar/visualizar por bloco: edição continua texto puro, a visualização
 * renderiza Markdown LEVE PRÓPRIO com escape de HTML (src/lib/markdown-lite.ts).
 * v0.0.293+: toolbar de formatação clicável que insere/wrapa a sintaxe na
 * posição do cursor (negrito, itálico, código, link, listas e títulos).
 */
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Bold,
  Italic,
  Code,
  Link2,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Eye,
  Pencil,
} from 'lucide-react'
import { renderMarkdownLite } from '@/lib/markdown-lite'
import { cn } from '@/lib/utils'

interface MarkdownParagraphBlockProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

/** Ações da toolbar: wrapa a seleção ou insere a sintaxe no cursor. */
interface ToolbarAction {
  label: string
  icon: typeof Bold
  title: string
  /** wrap: envolve a seleção com before/after; linePrefix: prefixa as linhas. */
  wrap?: { before: string; after: string; placeholder?: string }
  linePrefix?: string
  /** Link: envolve seleção como [texto](url) ou insere modelo. */
  link?: boolean
}

const TOOLBAR_ACTIONS: ToolbarAction[] = [
  {
    label: 'Negrito',
    icon: Bold,
    title: 'Negrito (**texto**)',
    wrap: { before: '**', after: '**', placeholder: 'texto em negrito' },
  },
  {
    label: 'Itálico',
    icon: Italic,
    title: 'Itálico (*texto*)',
    wrap: { before: '*', after: '*', placeholder: 'texto em itálico' },
  },
  {
    label: 'Código',
    icon: Code,
    title: 'Código inline (`código`)',
    wrap: { before: '`', after: '`', placeholder: 'código' },
  },
  { label: 'Link', icon: Link2, title: 'Link ([texto](url))', link: true },
  { label: 'Lista', icon: List, title: 'Lista com marcadores', linePrefix: '- ' },
  { label: 'Lista numerada', icon: ListOrdered, title: 'Lista numerada', linePrefix: '1. ' },
  { label: 'Título 1', icon: Heading1, title: 'Título (#)', linePrefix: '# ' },
  { label: 'Título 2', icon: Heading2, title: 'Subtítulo (##)', linePrefix: '## ' },
  { label: 'Título 3', icon: Heading3, title: 'Título pequeno (###)', linePrefix: '### ' },
]

export function MarkdownParagraphBlock({
  content,
  onChange,
  placeholder,
}: MarkdownParagraphBlockProps) {
  const [previewing, setPreviewing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  /** Aplica uma ação da toolbar preservando a posição do cursor. */
  const applyAction = (action: ToolbarAction) => {
    const el = textareaRef.current
    const value = content || ''
    if (!el) {
      // Sem ref (ex.: foco perdido): aplica no fim do texto.
      if (action.link) onChange(`${value}[texto](https://)`)
      else if (action.wrap)
        onChange(
          `${value}${action.wrap.before}${action.wrap.placeholder || ''}${action.wrap.after}`,
        )
      else if (action.linePrefix) onChange(`${value}\n${action.linePrefix}`)
      return
    }
    const start = el.selectionStart ?? value.length
    const end = el.selectionEnd ?? value.length
    const selected = value.slice(start, end)
    let next = value
    let caretStart = start
    let caretEnd = end

    if (action.link) {
      const inner = selected || 'texto do link'
      const snippet = `[${inner}](https://)`
      next = value.slice(0, start) + snippet + value.slice(end)
      caretStart = start + inner.length + 3
      caretEnd = caretStart + 8 // seleciona "https://" para digitar a URL
    } else if (action.wrap) {
      const inner = selected || action.wrap.placeholder || ''
      const snippet = `${action.wrap.before}${inner}${action.wrap.after}`
      next = value.slice(0, start) + snippet + value.slice(end)
      caretStart = start + action.wrap.before.length
      caretEnd = caretStart + inner.length
    } else if (action.linePrefix) {
      // Prefixa cada linha da seleção (ou a linha do cursor).
      const lineStart = value.lastIndexOf('\n', start - 1) + 1
      const lineEnd = value.indexOf('\n', end) === -1 ? value.length : value.indexOf('\n', end)
      const block = value.slice(lineStart, lineEnd)
      const numbered = action.linePrefix.startsWith('1.')
      const prefixed = block
        .split('\n')
        .map((line, i) => {
          if (line.trim() && line.startsWith(action.linePrefix!)) return line // já prefixada
          const p = numbered ? `${i + 1}. ` : action.linePrefix!
          return p + line
        })
        .join('\n')
      next = value.slice(0, lineStart) + prefixed + value.slice(lineEnd)
      caretStart = lineStart
      caretEnd = lineStart + prefixed.length
    }

    onChange(next)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(caretStart, caretEnd)
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] text-slate-500 font-semibold">
          Markdown aceito: **negrito**, *itálico*, `código`, [link](url), listas e #/##/### títulos
        </p>
        <div className="flex items-center gap-1 shrink-0">
          {previewing && (
            <Badge className="bg-purple-950/60 text-purple-300 border border-purple-800/60 text-[9px] font-bold">
              Visualizando
            </Badge>
          )}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setPreviewing((v) => !v)}
            className="h-6 px-2 text-[10px] font-bold border-slate-700 text-slate-300 hover:text-white gap-1"
          >
            {previewing ? <Pencil className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {previewing ? 'Editar' : 'Visualizar'}
          </Button>
        </div>
      </div>

      {previewing ? (
        <div
          className="prose-invert min-h-16 rounded-xl border border-slate-700/60 bg-slate-800/30 p-4 space-y-2"
          // Conteúdo SEMPRE escapado + sanitizado dentro do parser próprio
          // (renderMarkdownLite escapa todo HTML antes do parse; href só http/s).
          dangerouslySetInnerHTML={{ __html: renderMarkdownLite(content || '') }}
        />
      ) : (
        <div className="space-y-1">
          {/* Toolbar de formatação — insere/wrapa a sintaxe no cursor */}
          <div className="flex flex-wrap items-center gap-0.5 rounded-t-xl border border-slate-700/60 border-b-0 bg-slate-800/60 px-1.5 py-1">
            {TOOLBAR_ACTIONS.map((action, idx) => {
              const Icon = action.icon
              return (
                <span key={action.label} className="flex items-center">
                  {idx === 4 && <span className="w-px h-4 bg-slate-700 mx-1" aria-hidden />}
                  <button
                    type="button"
                    title={action.title}
                    aria-label={action.label}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyAction(action)}
                    className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700/70 transition-colors"
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                </span>
              )
            })}
          </div>
          <Textarea
            ref={textareaRef}
            rows={5}
            value={content}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || 'Escreva a nota em Markdown...'}
            className={cn(
              'text-sm bg-slate-800/40 border-slate-700/60 text-white rounded-xl focus:border-purple-500',
              'font-mono leading-relaxed rounded-t-none mt-0',
            )}
          />
        </div>
      )}
    </div>
  )
}
