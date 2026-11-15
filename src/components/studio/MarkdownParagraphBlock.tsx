/**
 * Bloco de PARÁGRAFO do Segundo Cérebro com suporte a Markdown.
 * Padrão da casa (v0.0.290+): subcomponente novo em vez de patch em série no
 * MagicAuthorEditor (arquivo grande — patches incrementais já corromperam 3×).
 * Toggle editar/visualizar por bloco: edição continua texto puro, a visualização
 * renderiza Markdown LEVE PRÓPRIO com escape de HTML (src/lib/markdown-lite.ts).
 */
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Eye, Pencil } from 'lucide-react'
import { renderMarkdownLite } from '@/lib/markdown-lite'

interface MarkdownParagraphBlockProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export function MarkdownParagraphBlock({
  content,
  onChange,
  placeholder,
}: MarkdownParagraphBlockProps) {
  const [previewing, setPreviewing] = useState(false)

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
        <Textarea
          rows={5}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || 'Escreva a nota em Markdown...'}
          className="text-sm bg-slate-800/40 border-slate-700/60 text-white rounded-xl focus:border-purple-500 font-mono leading-relaxed"
        />
      )}
    </div>
  )
}
