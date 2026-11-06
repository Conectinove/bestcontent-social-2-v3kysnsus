import React, { useState } from 'react'
import {
  Code,
  FileCode2,
  Copy,
  Check,
  Sparkles,
  Maximize2,
  Minimize2,
  MessageSquare,
  Edit2,
  Download,
  Hammer,
  Play,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import type { SecondBrainDoc } from '@/services/second-brain'

interface AulaHtmlWorkspaceProps {
  doc: SecondBrainDoc
  onUpdateContent?: (newHtml: string) => void
  onSave?: () => void
  saving?: boolean
  activeTab: 'aula' | 'code'
  setActiveTab: (tab: 'aula' | 'code') => void
}

export const AulaHtmlWorkspace: React.FC<AulaHtmlWorkspaceProps> = ({
  doc,
  onUpdateContent,
  onSave,
  saving = false,
  activeTab,
  setActiveTab,
}) => {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  // Gerar HTML dinâmico a partir dos módulos/blocos do doc
  const buildHtmlFromDoc = () => {
    let body = `<!DOCTYPE html>\n<html lang="pt-BR">\n<head>\n  <meta charset="UTF-8">\n  <title>${doc.title}</title>\n  <style>\n    body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1e293b; line-height: 1.6; }\n    h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }\n    h2 { color: #334155; margin-top: 32px; }\n    p { margin-bottom: 16px; font-size: 16px; }\n    .caption { font-size: 14px; color: #64748b; font-style: italic; margin-top: -8px; }\n    .badge { display: inline-block; background: #8b5cf6; color: white; padding: 2px 8px; border-radius: 6px; font-size: 12px; font-weight: bold; margin-bottom: 8px; }\n    .quiz { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0; }\n    code { background: #0f172a; color: #38bdf8; padding: 2px 6px; border-radius: 4px; font-family: monospace; }\n  </style>\n</head>\n<body>\n  <span class="badge">${doc.doc_type.toUpperCase()}</span>\n  <h1>${doc.title}</h1>\n`

    doc.modules.forEach((mod, mIdx) => {
      body += `\n  <section class="module">\n    <h2>Módulo ${mIdx + 1}: ${mod.title}</h2>\n`
      mod.blocks.forEach((blk) => {
        if (blk.type === 'title') {
          body += `    <h3>${blk.content}</h3>\n`
          if (blk.caption) body += `    <p class="caption">${blk.caption}</p>\n`
        } else if (blk.type === 'paragraph') {
          body += `    <p>${blk.content}</p>\n`
        } else if (blk.type === 'quiz') {
          body += `    <div class="quiz"><strong>Quiz Pedagógico:</strong><p>${blk.content}</p></div>\n`
        } else if (blk.type === 'code') {
          body += `    <pre><code>${blk.content}</code></pre>\n`
        }
      })
      body += `  </section>\n`
    })

    body += `\n</body>\n</html>`
    return body
  }

  const htmlContent = buildHtmlFromDoc()

  const handleCopy = () => {
    navigator.clipboard.writeText(htmlContent)
    setCopied(true)
    toast({
      title: 'Código HTML copiado!',
      description: 'Pronto para usar na sua plataforma de aulas.',
    })
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadHtml = () => {
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${doc.title.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'aula'}.html`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: 'Download iniciado', description: 'Arquivo aula.html baixado.' })
  }

  return (
    <div
      className={`flex-1 flex flex-col bg-[#050814] overflow-hidden ${
        fullscreen ? 'fixed inset-0 z-50' : 'relative'
      }`}
    >
      {/* Barra de Abas: Arquivos da Aula | aula.html | Código-fonte */}
      <div className="h-12 px-4 border-b border-slate-800/80 bg-slate-950/70 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Tag "Arquivos da Aula" */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span>Arquivos da Aula</span>
          </div>

          {/* Aba aula.html */}
          <button
            type="button"
            onClick={() => setActiveTab('aula')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'aula'
                ? 'bg-purple-950/80 text-purple-200 border border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5 text-purple-400" />
            <span>aula.html</span>
          </button>

          {/* Aba Código-fonte */}
          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'code'
                ? 'bg-purple-950/80 text-purple-200 border border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <Code className="w-3.5 h-3.5 text-indigo-400" />
            <span>Código-fonte</span>
          </button>
        </div>

        {/* Lado Direito: Comentário, Edição e Escala 100% */}
        <div className="flex items-center gap-2 text-xs">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              toast({
                title: 'Comentários',
                description: 'Nenhum comentário pendente no documento.',
              })
            }
            className="h-7 px-2 text-slate-400 hover:text-white gap-1 text-[11px]"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Comentário</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className={`h-7 px-2 text-[11px] gap-1 ${
              isEditing ? 'text-purple-300 bg-purple-950/50' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Editar</span>
          </Button>

          <Badge
            variant="outline"
            className="border-slate-800 text-[10px] text-slate-400 px-1.5 py-0.5"
          >
            100%
          </Badge>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setFullscreen(!fullscreen)}
            className="w-7 h-7 text-slate-400 hover:text-white"
            title={fullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
          >
            {fullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Conteúdo Principal do Canvas Central */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex items-center justify-center">
        {activeTab === 'aula' ? (
          /* Visualizador estilo Canvas Negro do Print */
          <div className="w-full max-w-3xl min-h-[460px] rounded-3xl bg-[#030611] border border-slate-800/80 shadow-2xl p-6 sm:p-10 flex flex-col justify-start relative group transition-all">
            <div className="space-y-4">
              <h1 className="text-2xl sm:text-3xl font-black text-white font-heading tracking-tight flex items-center gap-2">
                <span>#</span>
                <span>{doc.title || 'Nova Nota em Branco'}</span>
              </h1>

              <p className="text-sm text-slate-400 leading-relaxed font-normal max-w-xl">
                Escreva livremente suas ideias, estruture tópicos ou use a IA à esquerda para
                expandir.
              </p>

              {/* Módulos do Doc renderizados visualmente */}
              <div className="pt-6 space-y-6">
                {doc.modules.map((mod, idx) => (
                  <div key={mod.id} className="space-y-3">
                    <h2 className="text-base sm:text-lg font-bold text-purple-300 font-heading">
                      Módulo {idx + 1}: {mod.title}
                    </h2>
                    <div className="space-y-2 pl-3 border-l-2 border-slate-800">
                      {mod.blocks.map((blk) => (
                        <div key={blk.id} className="space-y-1">
                          {blk.type === 'title' ? (
                            <div className="text-sm sm:text-base font-bold text-white">
                              {blk.content}
                            </div>
                          ) : blk.type === 'quiz' ? (
                            <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/40 text-xs text-purple-200">
                              <span className="font-bold">Quiz: </span>
                              {blk.content}
                            </div>
                          ) : blk.type === 'code' ? (
                            <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto">
                              <code>{blk.content}</code>
                            </pre>
                          ) : (
                            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                              {blk.content}
                            </p>
                          )}
                          {blk.caption && (
                            <p className="text-[11px] text-slate-400 italic">{blk.caption}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Visualizador de Código HTML com Ação de Copiar / Baixar */
          <div className="w-full max-w-4xl h-full flex flex-col rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl">
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">aula.html — Código-fonte</span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopy}
                  className="h-7 text-xs border-slate-700 text-slate-300 hover:text-white gap-1"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copied ? 'Copiado' : 'Copiar HTML'}</span>
                </Button>
                <Button
                  size="sm"
                  onClick={handleDownloadHtml}
                  className="h-7 text-xs bg-purple-600 hover:bg-purple-500 text-white gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </Button>
              </div>
            </div>
            <pre className="flex-1 p-4 text-xs font-mono text-emerald-300/90 overflow-auto bg-slate-950 select-text leading-relaxed">
              <code>{htmlContent}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
export default AulaHtmlWorkspace
