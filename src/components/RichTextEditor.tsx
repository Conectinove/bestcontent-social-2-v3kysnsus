import React, { useState, useRef } from 'react'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link2,
  Quote,
  Eye,
  Edit3,
  Code,
  Sparkles,
  Heading2,
  Undo2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
  className?: string
  id?: string
  label?: string
  badgeText?: string
  onAiRefine?: () => void
  aiLoading?: boolean
  error?: string
}

export const RichTextEditor = React.memo(function RichTextEditor({
  value,
  onChange,
  placeholder = 'Escreva seu conteúdo formatado...',
  minHeight = '140px',
  className,
  id,
  label,
  badgeText,
  onAiRefine,
  aiLoading = false,
  error,
}: RichTextEditorProps) {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const applyFormatting = (prefix: string, suffix: string = '', defaultText: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentText = textarea.value
    const selectedText = currentText.substring(start, end) || defaultText

    const replacement = `${prefix}${selectedText}${suffix}`
    const newText = currentText.substring(0, start) + replacement + currentText.substring(end)

    onChange(newText)

    // Recoloca o cursor dentro do texto formatado
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + prefix.length + selectedText.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  const insertAtNewLine = (prefix: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentText = textarea.value
    const selectedText = currentText.substring(start, end)

    const lines = (selectedText || 'Item da lista').split('\n')
    const formattedLines = lines
      .map((line, idx) => {
        if (prefix === '1. ') return `${idx + 1}. ${line}`
        return `${prefix}${line}`
      })
      .join('\n')

    const newText = currentText.substring(0, start) + formattedLines + currentText.substring(end)
    onChange(newText)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + formattedLines.length, start + formattedLines.length)
    }, 0)
  }

  const insertLink = () => {
    const url = window.prompt('Digite a URL do link:', 'https://')
    if (!url) return
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = textarea.value.substring(start, end) || 'link'
    const markdownLink = `[${selectedText}](${url})`
    const newText =
      textarea.value.substring(0, start) + markdownLink + textarea.value.substring(end)
    onChange(newText)
  }

  // Renderizador simplificado e seguro de Markdown
  const renderFormattedPreview = (raw: string) => {
    if (!raw.trim()) {
      return (
        <p className="text-muted-foreground italic text-xs py-4 text-center">
          Nenhum conteúdo para pré-visualizar ainda.
        </p>
      )
    }

    const lines = raw.split('\n')
    return (
      <div className="space-y-2 text-xs leading-relaxed text-foreground">
        {lines.map((line, idx) => {
          // Linha em branco
          if (!line.trim()) {
            return <div key={idx} className="h-2" />
          }

          // Título ##
          if (line.startsWith('## ') || line.startsWith('### ')) {
            const headingText = line.replace(/^#{2,3}\s+/, '')
            return (
              <h4
                key={idx}
                className="font-extrabold text-sm text-purple-700 dark:text-purple-300 mt-2"
              >
                {renderInlineStyles(headingText)}
              </h4>
            )
          }

          // Citação >
          if (line.startsWith('> ')) {
            return (
              <blockquote
                key={idx}
                className="border-l-4 border-purple-500 pl-3 py-1 my-1 italic text-muted-foreground bg-purple-500/5 rounded-r-lg"
              >
                {renderInlineStyles(line.slice(2))}
              </blockquote>
            )
          }

          // Lista ordenada 1. 2.
          if (/^\d+\.\s/.test(line)) {
            const match = line.match(/^(\d+\.)\s+(.*)$/)
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                  {match?.[1]}
                </span>
                <span>{renderInlineStyles(match?.[2] || '')}</span>
              </div>
            )
          }

          // Lista com bullet • ou - ou *
          if (line.startsWith('- ') || line.startsWith('• ') || line.startsWith('* ')) {
            const content = line.replace(/^[-•*]\s+/, '')
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="text-purple-600 dark:text-purple-400 font-bold">•</span>
                <span>{renderInlineStyles(content)}</span>
              </div>
            )
          }

          // Parágrafo regular
          return (
            <p key={idx} className="leading-relaxed">
              {renderInlineStyles(line)}
            </p>
          )
        })}
      </div>
    )
  }

  // Estilos inline: **negrito**, *itálico*, `código`, [link](url)
  const renderInlineStyles = (text: string): React.ReactNode => {
    // Processamento simples por regex seguro
    const parts: React.ReactNode[] = []
    let remaining = text
    let keyIdx = 0

    // Regex para tokens: [label](url), **bold**, *italic*, `code`
    const regex = /(\[.*?\]\(https?:\/\/.*?\)|\*\*.*?\*\*|\*.*?\*|`.*?`)/g
    const splits = remaining.split(regex)

    splits.forEach((chunk) => {
      if (!chunk) return

      if (chunk.startsWith('**') && chunk.endsWith('**') && chunk.length >= 4) {
        parts.push(
          <strong key={keyIdx++} className="font-bold text-foreground">
            {chunk.slice(2, -2)}
          </strong>,
        )
      } else if (chunk.startsWith('*') && chunk.endsWith('*') && chunk.length >= 2) {
        parts.push(
          <em key={keyIdx++} className="italic text-foreground">
            {chunk.slice(1, -1)}
          </em>,
        )
      } else if (chunk.startsWith('`') && chunk.endsWith('`') && chunk.length >= 2) {
        parts.push(
          <code
            key={keyIdx++}
            className="px-1.5 py-0.5 rounded bg-muted font-mono text-[11px] text-purple-600 dark:text-purple-400"
          >
            {chunk.slice(1, -1)}
          </code>,
        )
      } else if (chunk.startsWith('[') && chunk.includes('](') && chunk.endsWith(')')) {
        const match = chunk.match(/^\[(.*?)\]\((.*?)\)$/)
        if (match) {
          parts.push(
            <a
              key={keyIdx++}
              href={match[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-700 underline font-medium"
            >
              {match[1]}
            </a>,
          )
        } else {
          parts.push(chunk)
        }
      } else {
        parts.push(chunk)
      }
    })

    return parts.length > 0 ? parts : text
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={id} className="text-xs font-bold text-foreground flex items-center gap-2">
            <span>{label}</span>
            {badgeText && (
              <Badge variant="outline" className="text-[10px] font-mono py-0 px-1.5">
                {badgeText}
              </Badge>
            )}
          </label>
          <div className="flex items-center gap-1.5">
            {onAiRefine && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onAiRefine}
                disabled={aiLoading}
                className="text-xs text-purple-600 dark:text-purple-400 gap-1.5 h-7 px-2 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Refinar com IA</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Caixa do editor com barra de ferramentas High Impact */}
      <div
        className={cn(
          'rounded-2xl border bg-card transition-all overflow-hidden focus-within:ring-2 focus-within:ring-purple-500/20 focus-within:border-purple-500 shadow-2xs',
          error ? 'border-rose-500' : 'border-border/80',
        )}
      >
        {/* Toolbar superior com botões de formatação rica - scroll horizontal no mobile para nunca transbordar */}
        <div className="px-2 sm:px-3 py-1.5 sm:py-2 border-b border-border/60 bg-muted/30 flex items-center justify-between gap-1.5 flex-nowrap overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            <button
              type="button"
              onClick={() => applyFormatting('**', '**', 'negrito')}
              title="Negrito (**texto**)"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applyFormatting('*', '*', 'itálico')}
              title="Itálico (*texto*)"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applyFormatting('## ', '', 'Título')}
              title="Título de Seção (## Título)"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
            >
              <Heading2 className="w-3.5 h-3.5" />
            </button>

            <span className="w-px h-4 bg-border/80 mx-0.5 sm:mx-1 shrink-0" />

            <button
              type="button"
              onClick={() => insertAtNewLine('• ')}
              title="Lista com Marcadores"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertAtNewLine('1. ')}
              title="Lista Numerada"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertAtNewLine('> ')}
              title="Citação / Destaque"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={insertLink}
              title="Inserir Link [texto](url)"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
            >
              <Link2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applyFormatting('`', '`', 'código')}
              title="Código inline (`código`)"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
            >
              <Code className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Abas Escrever vs Prévia */}
          <div className="flex items-center gap-0.5 bg-background/80 p-0.5 rounded-xl border border-border/60 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('write')}
              className={cn(
                'px-2.5 py-1 text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition-all',
                activeTab === 'write'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Edit3 className="w-3 h-3" />
              <span>Escrever</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={cn(
                'px-2.5 py-1 text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition-all',
                activeTab === 'preview'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Eye className="w-3 h-3" />
              <span>Prévia</span>
            </button>
          </div>
        </div>

        {/* Área de edição ou pré-visualização */}
        {activeTab === 'write' ? (
          <textarea
            ref={textareaRef}
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            style={{ minHeight }}
            className="w-full p-3.5 text-xs font-normal leading-relaxed bg-transparent resize-y border-0 focus:outline-hidden focus:ring-0 text-foreground placeholder:text-muted-foreground"
          />
        ) : (
          <div
            style={{ minHeight }}
            className="p-4 bg-card/60 overflow-y-auto max-h-[350px] border-t border-border/40"
          >
            {renderFormattedPreview(value)}
          </div>
        )}

        {/* Barra de rodapé do editor */}
        <div className="px-3.5 py-1.5 bg-muted/20 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            Editor Rico Ativo &middot; Formatação salva no rascunho
          </span>
          <span className="font-mono text-[10px]">{value.length} caracteres</span>
        </div>
      </div>

      {error && <p className="text-[11px] font-semibold text-rose-500 animate-fade-in">{error}</p>}
    </div>
  )
})
