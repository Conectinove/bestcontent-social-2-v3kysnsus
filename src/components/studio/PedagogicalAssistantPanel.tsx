import React, { useState } from 'react'
import {
  Sparkles,
  BookOpen,
  Image,
  Paperclip,
  FileUp,
  X,
  Send,
  Plus,
  Zap,
  GraduationCap,
  HardDrive,
  Mail,
  FileText,
  FileSpreadsheet,
  Inbox,
  Cloud,
  Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ImportedContextItem } from '@/services/google-connectors'

export type ActiveContextItem = ImportedContextItem

export interface PedagogicalAssistantPanelProps {
  activeContexts: ImportedContextItem[]
  onRemoveContext: (id: string) => void
  onAddContextItem: (item: ImportedContextItem) => void
  onOpenConnectorsModal: (
    tab?:
      | 'overview'
      | 'googledrive'
      | 'gmail'
      | 'googledocs'
      | 'googlesheets'
      | 'outlook'
      | 'onedrive'
      | 'sharepoint',
  ) => void
  onGeneratePrompt: (prompt: string, level: string, system: string) => Promise<void>
  generating?: boolean
}

export const PedagogicalAssistantPanel: React.FC<PedagogicalAssistantPanelProps> = ({
  activeContexts,
  onRemoveContext,
  onAddContextItem,
  onOpenConnectorsModal,
  onGeneratePrompt,
  generating = false,
}) => {
  const [promptInput, setPromptInput] = useState('')
  const [generationLevel, setGenerationLevel] = useState<'Ultra' | 'Padrão' | 'Rápido'>('Ultra')
  const [pedagogicalSystem, setPedagogicalSystem] = useState<string>('Sistema pedagógico')
  const [isUploadingFile, setIsUploadingFile] = useState(false)

  // 1. Padrão pedagógico do curso
  const handleAddDefaultPedagogical = () => {
    const exists = activeContexts.some((c) => c.id === 'ctx-padrao-pedagogico')
    if (exists) return
    onAddContextItem({
      id: 'ctx-padrao-pedagogico',
      source: 'pedagogico',
      title: 'Padrão Pedagógico...',
      subtitle: '(Diretriz MudarCurso)',
      content:
        'Método dos 5 Passos e diretrizes MudarCurso: 1. Gancho de atenção e problema real; 2. Fundamentação teórica concisa; 3. Estudo de caso guiado; 4. Prática reflexiva / laboratório interativo; 5. Fechamento, avaliação e plano de ação.',
      type: 'text',
      createdAt: new Date().toISOString(),
    })
  }

  // 2. Adicionar captura de tela (simulação guiada com URL ou descrição visual)
  const handleAddScreenshot = () => {
    const desc = window.prompt(
      'Descreva o visual da captura de tela ou cole o link do slide/gráfico:',
      'Slide de introdução com gráfico de funil e métricas de conversão 2026',
    )
    if (!desc) return
    onAddContextItem({
      id: `ctx-screenshot-${Date.now()}`,
      source: 'manual',
      title: 'Captura de Tela',
      subtitle: '(Exemplo Visual / Slide)',
      content: `Descrição da captura visual: ${desc}`,
      type: 'text',
      createdAt: new Date().toISOString(),
    })
  }

  // 3. Anexar material / texto-base
  const handleAddBaseMaterial = () => {
    const text = window.prompt('Cole a apostila, transcrição ou texto-base de referência:')
    if (!text) return
    onAddContextItem({
      id: `ctx-material-${Date.now()}`,
      source: 'manual',
      title: text.slice(0, 24) + '...',
      subtitle: '(Texto-base)',
      content: text,
      type: 'text',
      createdAt: new Date().toISOString(),
    })
  }

  // 4. Arraste de arquivo PDF / DOCX
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingFile(true)
    const reader = new FileReader()
    reader.onload = () => {
      onAddContextItem({
        id: `ctx-file-${Date.now()}`,
        source: 'manual',
        title: file.name.slice(0, 24),
        subtitle: `(${file.name.split('.').pop()?.toUpperCase() || 'Arquivo'})`,
        content: `Arquivo anexado: ${file.name}. Tamanho: ${(file.size / 1024).toFixed(1)} KB.`,
        type: 'text',
        createdAt: new Date().toISOString(),
      })
      setIsUploadingFile(false)
    }
    reader.onerror = () => setIsUploadingFile(false)
    reader.readAsText(file)
  }

  const handleSubmitPrompt = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!promptInput.trim() || generating) return
    await onGeneratePrompt(promptInput, generationLevel, pedagogicalSystem)
    setPromptInput('')
  }

  return (
    <div className="hidden lg:flex w-[360px] xl:w-[400px] 2xl:w-[430px] shrink-0 border-r border-slate-800 bg-slate-950 flex-col h-full overflow-hidden select-none">
      {/* Top Header do Painel */}
      <div className="p-5 pb-3 border-b border-slate-800/80 flex items-center gap-2 min-w-0">
        <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
        <h2 className="text-sm font-bold tracking-tight text-white font-heading min-w-0 leading-snug">
          Assistente Pedagógico MagicAuthor
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
        {/* Bloco 'Comece com contexto' */}
        <div className="space-y-1.5">
          <h1 className="text-xl sm:text-2xl font-black text-white font-heading tracking-tight">
            Comece com contexto
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Aulas baseadas em contexto real ficam melhores e mais alinhadas à sua turma.
          </p>
        </div>

        {/* 4 Cards Principais de Contexto (idênticos ao print) */}
        <div className="space-y-2.5">
          {/* Card 1: Padrão pedagógico do curso */}
          <button
            type="button"
            onClick={handleAddDefaultPedagogical}
            className="w-full text-left p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-purple-500/50 hover:bg-slate-900/80 transition-all flex items-center gap-3.5 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5 text-blue-400" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                Padrão pedagógico do curso
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                Método dos 5 Passos e diretrizes MudarCurso
              </div>
            </div>
          </button>

          {/* Card 2: Adicionar captura de tela */}
          <button
            type="button"
            onClick={handleAddScreenshot}
            className="w-full text-left p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-amber-500/50 hover:bg-slate-900/80 transition-all flex items-center gap-3.5 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Image className="w-5 h-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                Adicionar captura de tela
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                Exemplo visual de slide, gráfico ou tela do app
              </div>
            </div>
          </button>

          {/* Card 3: Anexar material / texto-base */}
          <button
            type="button"
            onClick={handleAddBaseMaterial}
            className="w-full text-left p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-purple-500/50 hover:bg-slate-900/80 transition-all flex items-center gap-3.5 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Paperclip className="w-5 h-5 text-purple-400" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                Anexar material / texto-base
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                Cole apostila, transcrição ou referências
              </div>
            </div>
          </button>

          {/* Card 4: Arraste um arquivo (PDF / DOCX) */}
          <label className="w-full text-left p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-900/80 transition-all flex items-center gap-3.5 group cursor-pointer relative overflow-hidden">
            <input
              type="file"
              accept=".pdf,.docx,.doc,.txt,.md"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <FileUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                {isUploadingFile ? 'Lendo arquivo...' : 'Arraste um arquivo (PDF / DOCX)'}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                Ou clique para buscar do seu computador
              </div>
            </div>
          </label>
        </div>

        {/* Linha de Conectores (Gmail / Docs / Drive / Sheets / +1) */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300">Conectores</span>

          <div className="flex items-center gap-1.5">
            {/* Ícone Gmail */}
            <button
              type="button"
              onClick={() => onOpenConnectorsModal('gmail')}
              title="Gmail (E-mails como contexto)"
              className="w-6 h-6 rounded-md bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-[10px] font-black text-rose-400 hover:scale-110 transition-transform cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
            </button>

            {/* Ícone Docs */}
            <button
              type="button"
              onClick={() => onOpenConnectorsModal('googledocs')}
              title="Google Docs (Apostilas e textos)"
              className="w-6 h-6 rounded-md bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-[10px] font-black text-blue-400 hover:scale-110 transition-transform cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
            </button>

            {/* Ícone Drive */}
            <button
              type="button"
              onClick={() => onOpenConnectorsModal('googledrive')}
              title="Google Drive (Arquivos e pastas)"
              className="w-6 h-6 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[10px] font-black text-amber-400 hover:scale-110 transition-transform cursor-pointer"
            >
              <HardDrive className="w-3.5 h-3.5" />
            </button>

            {/* Ícone Sheets */}
            <button
              type="button"
              onClick={() => onOpenConnectorsModal('googlesheets')}
              title="Google Sheets (Planilhas e dados)"
              className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-[10px] font-black text-emerald-400 hover:scale-110 transition-transform cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
            </button>

            {/* Ícone Outlook */}
            <button
              type="button"
              onClick={() => onOpenConnectorsModal('outlook')}
              title="Microsoft Outlook (E-mails e briefings)"
              className="w-6 h-6 rounded-md bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-[10px] font-black text-cyan-400 hover:scale-110 transition-transform cursor-pointer"
            >
              <Inbox className="w-3.5 h-3.5" />
            </button>

            {/* Ícone OneDrive */}
            <button
              type="button"
              onClick={() => onOpenConnectorsModal('onedrive')}
              title="Microsoft OneDrive (Arquivos na nuvem)"
              className="w-6 h-6 rounded-md bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-[10px] font-black text-blue-400 hover:scale-110 transition-transform cursor-pointer"
            >
              <Cloud className="w-3.5 h-3.5" />
            </button>

            {/* Ícone SharePoint */}
            <button
              type="button"
              onClick={() => onOpenConnectorsModal('sharepoint')}
              title="Microsoft SharePoint (Bases institucionais)"
              className="w-6 h-6 rounded-md bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-[10px] font-black text-teal-400 hover:scale-110 transition-transform cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
            </button>

            {/* Botão + Conectar mais */}
            <button
              type="button"
              onClick={() => onOpenConnectorsModal('overview')}
              title="Ver e conectar mais serviços (Multi-Nuvem)"
              className="h-6 px-2 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            >
              +Nuvens
            </button>
          </div>
        </div>

        {/* Linha Contexto Ativo */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-semibold">Contexto Ativo:</span>
            <button
              type="button"
              onClick={() => onOpenConnectorsModal('overview')}
              className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-0.5"
            >
              <Plus className="w-3 h-3" />
              <span>Contexto</span>
            </button>
          </div>

          {/* Chips removíveis */}
          <div className="flex flex-wrap gap-1.5 min-h-[32px]">
            {activeContexts.length === 0 ? (
              <span className="text-[11px] text-slate-500 italic">
                Nenhum contexto ativo. Adicione um card ou conecte o Drive/Gmail acima.
              </span>
            ) : (
              activeContexts.map((ctx) => (
                <div
                  key={ctx.id}
                  className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700/80 text-[11px] text-slate-200 flex items-center gap-1.5 shadow-sm"
                >
                  <FileText className="w-3 h-3 text-purple-400 shrink-0" />
                  <span className="font-semibold">{ctx.title}</span>
                  {ctx.subtitle && (
                    <span className="text-[10px] text-slate-400">{ctx.subtitle}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemoveContext(ctx.id)}
                    className="ml-1 text-slate-400 hover:text-rose-400 p-0.5 rounded-md hover:bg-slate-800 transition-colors"
                    title="Remover contexto"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Contador de contextos ativos */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span>{activeContexts.length} contexto(s) ativo(s)</span>
          </div>
        </div>
      </div>

      {/* Caixa Inferior de Prompt (Prompt input + Ultra + Sistema Pedagógico + Enviar) */}
      <div className="p-4 border-t border-slate-800/90 bg-slate-900/60 space-y-3">
        <div className="relative rounded-2xl bg-slate-900 border border-slate-800 p-2.5 focus-within:border-purple-500/70 transition-all shadow-inner">
          <Textarea
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmitPrompt()
              }
            }}
            placeholder="Descreva o que você quer criar..."
            className="w-full min-h-[64px] bg-transparent text-xs text-white placeholder:text-slate-400 resize-none border-0 focus-visible:ring-0 p-1"
          />

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 mt-1">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onOpenConnectorsModal('googledrive')}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors"
                title="Inserir anexo do Drive"
              >
                <Paperclip className="w-3.5 h-3.5" />
              </button>

              {/* Seletor de Nível (Ultra / Padrão / Rápido) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-[11px] font-semibold border-purple-500/30 text-purple-300 hover:bg-purple-950/40 rounded-lg gap-1"
                  >
                    <Zap className="w-3 h-3 text-purple-400" />
                    <span>{generationLevel}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-slate-900 border-slate-800 text-xs text-slate-200">
                  <DropdownMenuItem onClick={() => setGenerationLevel('Ultra')}>
                    Ultra (Máxima precisão e contexto)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setGenerationLevel('Padrão')}>
                    Padrão (Equilibrado)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setGenerationLevel('Rápido')}>
                    Rápido (Rascunho direto)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Seletor de Sistema Pedagógico */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-[11px] font-medium border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg gap-1 max-w-[125px] truncate"
                  >
                    <GraduationCap className="w-3 h-3 text-indigo-400 shrink-0" />
                    <span className="truncate">{pedagogicalSystem}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-slate-900 border-slate-800 text-xs text-slate-200">
                  <DropdownMenuItem onClick={() => setPedagogicalSystem('Sistema pedagógico')}>
                    Sistema pedagógico padrão
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setPedagogicalSystem('Método 5 Passos MudarCurso')}
                  >
                    Método 5 Passos MudarCurso
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPedagogicalSystem('Microlearning & Quizzes')}>
                    Microlearning & Quizzes
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPedagogicalSystem('Estudo de Caso Prático')}>
                    Estudo de Caso Prático
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Botão de Envio / Geração */}
            <Button
              type="button"
              onClick={() => handleSubmitPrompt()}
              disabled={generating || !promptInput.trim()}
              size="sm"
              className="w-7 h-7 p-0 rounded-full bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30 flex items-center justify-center shrink-0"
              title="Gerar com IA"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
export default PedagogicalAssistantPanel
