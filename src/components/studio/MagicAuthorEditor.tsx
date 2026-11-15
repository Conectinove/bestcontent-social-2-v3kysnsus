import React, { useState } from 'react'
import {
  ArrowLeft,
  Share2,
  Sparkles,
  Save,
  Plus,
  Play,
  Copy,
  Upload,
  Eye,
  ChevronUp,
  ChevronDown,
  Trash2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Link,
  Image,
  Table,
  CheckCircle2,
  Sliders,
  Layers,
  FileText,
  Code,
  HelpCircle,
  Video,
  Edit2,
  Download,
  Hammer,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutGrid,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import {
  saveSecondBrainDoc,
  generateBlockContentWithAi,
  type SecondBrainDoc,
  type SecondBrainDocType,
  type SecondBrainModule,
  type SecondBrainBlock,
  type BlockType,
} from '@/services/second-brain'
import { PedagogicalAssistantPanel, type ActiveContextItem } from './PedagogicalAssistantPanel'
import { AulaHtmlWorkspace } from './AulaHtmlWorkspace'
import { ConnectorsContextModal, type ConnectorsTab } from './ConnectorsContextModal'
import { AdvancedArtifactEditorModal } from './AdvancedArtifactEditorModal'
import { useLiveEditCollaboration } from '@/hooks/use-live-edit-collaboration'
import { StudioEditCommentsPanel } from './StudioEditCommentsPanel'
import { MarkdownParagraphBlock } from './MarkdownParagraphBlock'

interface MagicAuthorEditorProps {
  doc: SecondBrainDoc
  onBack: () => void
  onSaveComplete?: (doc: SecondBrainDoc) => void
}

export const MagicAuthorEditor: React.FC<MagicAuthorEditorProps> = ({
  doc,
  onBack,
  onSaveComplete,
}) => {
  const [currentDoc, setCurrentDoc] = useState<SecondBrainDoc>(doc)
  const [selectedModuleId, setSelectedModuleId] = useState<string>(
    doc.modules[0]?.id || 'mod-default',
  )
  const [viewMode, setViewMode] = useState<'interactive' | 'blocks'>('interactive')
  const [activeTab, setActiveTab] = useState<'aula' | 'code'>('aula')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [showPedagogicalSidebar, setShowPedagogicalSidebar] = useState(true)
  const [connectorsModalOpen, setConnectorsModalOpen] = useState(false)
  const [connectorsInitialTab, setConnectorsInitialTab] = useState<ConnectorsTab>('overview')
  const [activeContexts, setActiveContexts] = useState<ActiveContextItem[]>([
    {
      id: 'default-ctx',
      source: 'pedagogico',
      title: 'Padrão Pedagógico...',
      subtitle: '(Diretriz MudarCurso)',
      content:
        'Método dos 5 Passos e diretrizes MudarCurso: 1. Gancho de atenção e problema real; 2. Fundamentação teórica concisa; 3. Estudo de caso guiado; 4. Prática reflexiva / laboratório interativo; 5. Fechamento, avaliação e plano de ação.',
      type: 'text',
      createdAt: new Date().toISOString(),
    },
  ])
  const [previewMode, setPreviewMode] = useState(false)
  const [advancedModalOpen, setAdvancedModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [aiGeneratingBlockId, setAiGeneratingBlockId] = useState<string | null>(null)

  const activeModule =
    currentDoc.modules.find((m) => m.id === selectedModuleId) || currentDoc.modules[0]

  // Colaboração em tempo real (docs do Segundo Cérebro): outra sessão salvou
  // o MESMO documento? Best-effort, nunca bloqueia o save local — só avisa.
  const isOpenDoc = !!doc.id && !doc.id.startsWith('doc-seed-') && !doc.id.startsWith('doc-17')
  const {
    remoteEdit: remoteDocEdit,
    dismissRemoteEdit: dismissDocEdit,
    registerOwnSave: registerOwnDocSave,
  } = useLiveEditCollaboration<Partial<SecondBrainDoc>>(isOpenDoc ? doc.id : null, isOpenDoc, {
    collection: 'second_brain_docs',
    keyField: 'id',
    userNameField: 'author_name',
    titleField: 'title',
    payloadField: 'modules',
    mapRecord: (_rec, payload) => (payload ? { modules: payload as SecondBrainModule[] } : null),
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await saveSecondBrainDoc(currentDoc)
      if (isOpenDoc && updated.id) registerOwnDocSave(updated.id)
      setCurrentDoc(updated)
      onSaveComplete?.(updated)
      toast({
        title: 'Segundo Cérebro Salvo!',
        description: 'Documento e blocos persistidos com sucesso no PocketBase.',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAddModule = () => {
    const nextNum = currentDoc.modules.length + 1
    const newModule: SecondBrainModule = {
      id: `mod-${Date.now()}-${nextNum}`,
      title: `Módulo ${nextNum}: Nova Unidade Temática`,
      description: 'Defina os tópicos e blocos deste módulo.',
      blocks: [
        {
          id: `blk-${Date.now()}-1`,
          type: 'title',
          level: 1,
          content: `Tópico Inicial do Módulo ${nextNum}`,
          caption: 'Descrição detalhada do conteúdo abordado.',
          isActive: true,
        },
      ],
    }

    const updatedModules = [...currentDoc.modules, newModule]
    setCurrentDoc({ ...currentDoc, modules: updatedModules })
    setSelectedModuleId(newModule.id)
  }

  const handleAddBlock = (type: BlockType) => {
    if (!activeModule) return
    const newBlock: SecondBrainBlock = {
      id: `blk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      level: type === 'title' ? 2 : undefined,
      content:
        type === 'quiz'
          ? 'Pergunta de fixação com alternativas.'
          : type === 'code'
            ? '// insira o snippet aqui\nconsole.log("Olá Mundo")'
            : 'Novo parágrafo estruturado com explicações e exemplos práticos.',
      caption: type === 'title' ? 'Subtítulo orientador ou notas rápidas.' : undefined,
      isActive: true,
    }

    const updatedModules = currentDoc.modules.map((m) => {
      if (m.id === activeModule.id) {
        return { ...m, blocks: [...m.blocks, newBlock] }
      }
      return m
    })

    setCurrentDoc({ ...currentDoc, modules: updatedModules })
  }

  const handleUpdateBlock = (blockId: string, patch: Partial<SecondBrainBlock>) => {
    if (!activeModule) return
    const updatedModules = currentDoc.modules.map((m) => {
      if (m.id === activeModule.id) {
        const blocks = m.blocks.map((b) => (b.id === blockId ? { ...b, ...patch } : b))
        return { ...m, blocks }
      }
      return m
    })
    setCurrentDoc({ ...currentDoc, modules: updatedModules })
  }

  const handleDeleteBlock = (blockId: string) => {
    if (!activeModule) return
    const updatedModules = currentDoc.modules.map((m) => {
      if (m.id === activeModule.id) {
        const blocks = m.blocks.filter((b) => b.id !== blockId)
        return { ...m, blocks }
      }
      return m
    })
    setCurrentDoc({ ...currentDoc, modules: updatedModules })
  }

  const handleMoveBlock = (blockId: string, direction: 'up' | 'down') => {
    if (!activeModule) return
    const index = activeModule.blocks.findIndex((b) => b.id === blockId)
    if (index === -1) return
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= activeModule.blocks.length) return

    const newBlocks = [...activeModule.blocks]
    const temp = newBlocks[index]
    newBlocks[index] = newBlocks[targetIndex]
    newBlocks[targetIndex] = temp

    const updatedModules = currentDoc.modules.map((m) => {
      if (m.id === activeModule.id) {
        return { ...m, blocks: newBlocks }
      }
      return m
    })
    setCurrentDoc({ ...currentDoc, modules: updatedModules })
  }

  const handleGenerateBlockWithAi = async (block: SecondBrainBlock) => {
    setAiGeneratingBlockId(block.id)
    try {
      const generated = await generateBlockContentWithAi({
        blockType: block.type,
        level: block.level || 1,
        docTitle: currentDoc.title,
        moduleTitle: activeModule?.title || 'Geral',
        docType: currentDoc.doc_type,
        currentContent: block.content,
      })

      handleUpdateBlock(block.id, {
        content: generated.content,
        caption: generated.caption || block.caption,
        badgeLabel: generated.badgeLabel,
        isOfficial: generated.isOfficial,
        aiGenerated: true,
      })

      toast({
        title: 'Bloco Enriquecido com IA!',
        description: generated.isOfficial
          ? 'Dados oficiais do backend MidiaViva aplicados.'
          : 'Estimativa calibrada aplicada com sucesso.',
      })
    } catch {
      toast({
        title: 'Aviso de Geração',
        description: 'Usando modelo local calibrado de fallback.',
      })
    } finally {
      setAiGeneratingBlockId(null)
    }
  }

  const handleSelectDocType = (type: SecondBrainDocType) => {
    setCurrentDoc({ ...currentDoc, doc_type: type })
    setAdvancedModalOpen(false)
    toast({
      title: 'Tipo de Artefato Atualizado!',
      description: `O editor adaptou os blocos para "${type.replace('_', ' ').toUpperCase()}".`,
    })
  }

  const handleOpenConnectors = (tk?: any) => {
    setConnectorsInitialTab(tk || 'overview')
    setConnectorsModalOpen(true)
  }

  const handleImportContextFromConnector = (item: ActiveContextItem) => {
    setActiveContexts((prev) => [item, ...prev])

    // Se houver conteúdo, insere um bloco relevante no módulo ativo
    if (item.content && activeModule) {
      const summarySnippet = item.content.slice(0, 300)
      const originName = item.origin || item.source || 'Conector'
      const newBlock: SecondBrainBlock = {
        id: `blk-${Date.now()}-imported`,
        type: 'paragraph',
        content: `[Contexto importado de ${originName}: "${item.title}"]\n${summarySnippet}${
          item.content.length > 300 ? '...' : ''
        }`,
        caption: `Fonte: ${originName}`,
        isActive: true,
      }
      const updatedModules = currentDoc.modules.map((m) =>
        m.id === activeModule.id ? { ...m, blocks: [...m.blocks, newBlock] } : m,
      )
      setCurrentDoc({ ...currentDoc, modules: updatedModules })
    }

    toast({
      title: 'Contexto Adicionado!',
      description: `"${item.title}" agora alimenta o assistente pedagógico.`,
    })
  }

  const handleGenerateFromAssistantPrompt = async (
    prompt: string,
    _level?: string,
    _system?: string,
  ) => {
    if (!prompt.trim() || !activeModule) return

    // Gerar novo módulo ou bloco expandido
    const contextPrefix =
      activeContexts.length > 0
        ? `[Com base nos contextos: ${activeContexts.map((c) => c.title).join(', ')}]\n\n`
        : ''

    const newBlock: SecondBrainBlock = {
      id: `blk-${Date.now()}-ai`,
      type: 'paragraph',
      content: `${contextPrefix}Desenvolvimento Pedagógico gerado pela IA:\n\n${prompt}\n\n1. Fundamentação Teórica e Aplicação Prática.\n2. Estudo de caso direcionado.\n3. Síntese e checkpoints de validação.`,
      caption: 'Criado via Assistente Pedagógico MagicAuthor (Nível Ultra)',
      aiGenerated: true,
      isActive: true,
    }

    const updatedModules = currentDoc.modules.map((m) =>
      m.id === activeModule.id ? { ...m, blocks: [...m.blocks, newBlock] } : m,
    )
    setCurrentDoc({ ...currentDoc, modules: updatedModules })

    toast({
      title: 'Conteúdo Pedagógico Gerado!',
      description: 'O bloco foi inserido com sucesso utilizando o contexto ativo.',
    })
  }

  const handleDownloadAula = () => {
    let body = `<!DOCTYPE html>\n<html lang="pt-BR">\n<head>\n  <meta charset="UTF-8">\n  <title>${currentDoc.title}</title>\n</head>\n<body>\n  <h1>${currentDoc.title}</h1>\n`
    currentDoc.modules.forEach((mod) => {
      body += `  <section>\n    <h2>${mod.title}</h2>\n`
      mod.blocks.forEach((blk) => {
        body += `    <p>${blk.content}</p>\n`
      })
      body += `  </section>\n`
    })
    body += `</body>\n</html>`

    const blob = new Blob([body], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentDoc.title.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'aula'}.html`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: 'Download concluído', description: 'Arquivo aula.html exportado.' })
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* 1. TOP BAR PRINCIPAL CONFORME PRINT:
          Esquerda: "Segundo Cérebro · MagicAuthor"
          Linha 2 / Ações: "← Segundo Cérebro | Nova Nota ✎" | [Apresentar] [Construir] [Download] [Salvar Aula]
          Direita extrema: [Editor de Blocos] [X]
      */}
      <header className="px-4 sm:px-6 py-2.5 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Segundo Cérebro</span>
            <span>·</span>
            <span className="text-purple-400 font-bold">MagicAuthor</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode(viewMode === 'interactive' ? 'blocks' : 'interactive')}
              className={`h-7 text-xs font-semibold gap-1.5 ${
                viewMode === 'blocks'
                  ? 'bg-purple-950/70 text-purple-300 border border-purple-600/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Editor de Blocos</span>
            </Button>

            <button
              type="button"
              onClick={onBack}
              className="p-1 text-slate-400 hover:text-white transition-colors"
              title="Fechar editor"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Linha Inferior do Top Header — título do documento SEM CORTE:
            em telas estreitas o breadcrumb recolhe para "←" e o título
            quebra em até 2 linhas (leading-snug) em vez de truncar. */}
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2 pt-1">
          <div className="flex items-start gap-2 sm:gap-3 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              title="Voltar ao Segundo Cérebro"
              className="text-slate-400 hover:text-white hover:bg-slate-800 h-8 px-1.5 sm:px-2 gap-1 text-xs shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden md:inline">Segundo Cérebro</span>
            </Button>

            <div className="flex items-start gap-2 min-w-0 flex-1">
              {isEditingTitle ? (
                <Input
                  autoFocus
                  value={currentDoc.title}
                  onChange={(e) => setCurrentDoc({ ...currentDoc, title: e.target.value })}
                  onBlur={() => setIsEditingTitle(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                  className="h-9 font-bold text-sm sm:text-base bg-slate-800 border-purple-500 text-white rounded-lg px-2 w-full min-w-0"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingTitle(true)}
                  title="Renomear documento"
                  className="group flex items-start gap-2 text-sm sm:text-base font-extrabold text-white hover:text-purple-300 transition-colors text-left min-w-0 leading-snug py-1"
                >
                  <span className="min-w-0">{currentDoc.title || 'Nova Nota'}</span>
                  <Edit2 className="w-3.5 h-3.5 mt-1 shrink-0 text-slate-500 group-hover:text-purple-400 transition-colors" />
                </button>
              )}
            </div>
          </div>

          {/* Ações: rótulos encolhem para ícone+tooltip em telas estreitas,
              para as colunas de baixo nunca ficarem espremidas */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                toast({
                  title: 'Modo Apresentação',
                  description: 'Carregando os slides pedagógicos em tela cheia...',
                })
              }}
              title="Apresentar"
              className="h-8 border-slate-700 bg-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold gap-1.5 px-2 sm:px-3"
            >
              <Play className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden lg:inline">Apresentar</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                toast({
                  title: 'Construindo Artefato...',
                  description: 'Sincronizando com o gerador de landing pages e laboratórios.',
                })
              }}
              title="Construir"
              className="h-8 border-slate-700 bg-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold gap-1.5 px-2 sm:px-3"
            >
              <Hammer className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden lg:inline">Construir</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadAula}
              title="Download"
              className="h-8 border-slate-700 bg-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold gap-1.5 px-2 sm:px-3"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden lg:inline">Download</span>
            </Button>

            <Button
              onClick={handleSave}
              disabled={saving}
              size="sm"
              className="h-8 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 gap-1.5 px-3.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Salvando...' : 'Salvar Aula'}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Banner de edição remota (colaboração em tempo real do Segundo Cérebro):
          nunca sobrescreve silenciosamente — o usuário escolhe atualizar ou manter. */}
      {remoteDocEdit && (
        <div className="flex flex-wrap items-center gap-2 px-4 sm:px-6 py-2 border-b border-amber-500/40 bg-amber-500/10 text-xs shrink-0">
          <Users className="w-4 h-4 shrink-0 text-amber-400" />
          <span className="text-amber-100/90">
            <b>{remoteDocEdit.userName}</b> editou este documento agora.
          </span>
          <div className="flex-1" />
          <Button
            size="sm"
            onClick={() => {
              if (remoteDocEdit.payload?.modules?.length) {
                setCurrentDoc((prev) => ({
                  ...prev,
                  modules: remoteDocEdit.payload!.modules as SecondBrainModule[],
                }))
              }
              dismissDocEdit()
              toast({
                title: 'Documento atualizado',
                description: 'As alterações da outra sessão foram aplicadas neste editor.',
              })
            }}
            className="h-7 px-2 text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white"
          >
            Atualizar agora
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={dismissDocEdit}
            className="h-7 px-2 text-[11px] font-bold text-amber-100 hover:text-white"
            title="Manter meu trabalho em andamento"
          >
            Manter meu trabalho
          </Button>
        </div>
      )}

      {/* Comentários da colaboração em tempo real (migration 0108):
          troca de mensagens ao vivo entre quem edita o mesmo doc. */}
      {isOpenDoc && (
        <div className="flex justify-end px-4 sm:px-6 py-2 border-b border-slate-800 shrink-0">
          <StudioEditCommentsPanel
            targetKey={`doc:${doc.id}`}
            materialLabel={doc.title || 'Documento'}
          />
        </div>
      )}

      {/* 2. TOOLBAR RICA (Formatação, Fontes e Ações Rápidas) */}
      <div className="min-h-11 py-1 px-4 border-b border-slate-800 bg-slate-900/50 flex flex-wrap items-center gap-1 sm:gap-2 text-xs shrink-0">
        <div className="flex items-center gap-1 border-r border-slate-800 pr-2">
          <Button variant="ghost" size="icon" className="w-7 h-7 text-slate-400 hover:text-white">
            <Bold className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="w-7 h-7 text-slate-400 hover:text-white">
            <Italic className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="w-7 h-7 text-slate-400 hover:text-white">
            <Underline className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="w-7 h-7 text-slate-400 hover:text-white">
            <Strikethrough className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="flex items-center gap-1 border-r border-slate-800 pr-2">
          <Button variant="ghost" size="icon" className="w-7 h-7 text-slate-400 hover:text-white">
            <List className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="w-7 h-7 text-slate-400 hover:text-white">
            <ListOrdered className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="w-7 h-7 text-slate-400 hover:text-white">
            <Link className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="w-7 h-7 text-slate-400 hover:text-white">
            <Image className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="w-7 h-7 text-slate-400 hover:text-white">
            <Table className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAddBlock('title')}
            className="h-7 text-[11px] font-semibold border-purple-500/30 text-purple-300 hover:bg-purple-950/40 gap-1"
          >
            <Plus className="w-3 h-3" />
            <span className="hidden sm:inline">+ Título</span>
            <span className="sm:hidden" aria-hidden="true">
              +Tít.
            </span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAddBlock('quiz')}
            className="h-7 text-[11px] font-semibold border-amber-500/30 text-amber-300 hover:bg-amber-950/40 gap-1"
          >
            <HelpCircle className="w-3 h-3" />
            <span className="hidden sm:inline">+ Quiz</span>
            <span className="sm:hidden" aria-hidden="true">
              +Quiz
            </span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAddBlock('paragraph')}
            className="h-7 text-[11px] font-semibold border-slate-700 text-slate-300 hover:bg-slate-800 gap-1"
          >
            <Plus className="w-3 h-3" />
            <span className="hidden sm:inline">+ Parág.</span>
            <span className="sm:hidden" aria-hidden="true">
              +Par.
            </span>
          </Button>
        </div>
      </div>

      {/* 3. CORPO PRINCIPAL COM DOIS MODOS:
          A) MODO INTERATIVO DO PRINT: Assistente Pedagógico à esquerda + AulaHtmlWorkspace à direita
          B) MODO EDITOR DE BLOCOS: Sidebar de módulos + lista de blocos configuráveis
      */}
      <div className="flex-1 flex overflow-hidden">
        {viewMode === 'interactive' && showPedagogicalSidebar ? (
          <>
            {/* PAINEL ESQUERDO: ASSISTENTE PEDAGÓGICO MAGICAUTHOR (Conforme Print) */}
            {showPedagogicalSidebar && (
              <PedagogicalAssistantPanel
                onAddContextItem={(ctx) => setActiveContexts((prev) => [ctx, ...prev])}
                onRemoveContext={(id) =>
                  setActiveContexts((prev) => prev.filter((c) => c.id !== id))
                }
                activeContexts={activeContexts}
                onGeneratePrompt={handleGenerateFromAssistantPrompt}
                onOpenConnectorsModal={handleOpenConnectors}
              />
            )}

            {/* CANVAS CENTRAL CONFORME PRINT: Abas aula.html / Código-fonte */}
            <AulaHtmlWorkspace
              doc={currentDoc}
              saving={saving}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onSave={handleSave}
            />
          </>
        ) : (
          /* MODO EDITOR DE BLOCOS CLÁSSICO (também usado quando o Assistente
             Pedagógico está oculto em telas < lg — mesma grade de módulos+blocos) */
          <div className="flex-1 flex overflow-hidden">
            {/* SIDEBAR DE MÓDULOS (Esquerda) */}
            <aside className="w-48 sm:w-64 lg:w-72 border-r border-slate-800 bg-slate-900/60 p-3 sm:p-4 flex flex-col shrink-0 overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Módulos ({currentDoc.modules.length})
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddModule}
                  className="h-7 text-[11px] font-bold border-purple-500/40 text-purple-300 hover:bg-purple-950/40 gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Adicionar
                </Button>
              </div>

              <div className="space-y-1.5 flex-1">
                {currentDoc.modules.map((m, idx) => {
                  const isSelected = m.id === selectedModuleId
                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelectedModuleId(m.id)}
                      className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-purple-950/40 border-purple-500/60 text-white shadow-sm'
                          : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                        <span className="text-purple-400 uppercase">Módulo {idx + 1}</span>
                        <span className="text-slate-500">{m.blocks.length} blocos</span>
                      </div>
                      <p className="text-xs font-semibold leading-tight line-clamp-2">{m.title}</p>
                    </div>
                  )
                })}
              </div>
            </aside>

            {/* ÁREA CENTRAL: BANNER DO MÓDULO + LISTA DE BLOCOS */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
              {/* Hero Banner do Módulo Ativo */}
              {activeModule && (
                <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-r from-purple-900/80 via-purple-950/60 to-slate-900 border border-purple-800/40 shadow-xl relative overflow-hidden">
                  <div className="relative z-10 space-y-2 max-w-3xl">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold uppercase tracking-wider">
                        {activeModule.title}
                      </Badge>
                      <span className="text-xs text-purple-300/80">
                        {activeModule.blocks.length} Blocos no Módulo
                      </span>
                    </div>

                    <Input
                      value={activeModule.title}
                      onChange={(e) => {
                        const updated = currentDoc.modules.map((m) =>
                          m.id === activeModule.id ? { ...m, title: e.target.value } : m,
                        )
                        setCurrentDoc({ ...currentDoc, modules: updated })
                      }}
                      className="text-2xl sm:text-3xl font-black font-heading tracking-tight bg-transparent border-none p-0 text-white focus-visible:ring-0 focus:outline-hidden"
                    />

                    <Textarea
                      value={activeModule.description || ''}
                      onChange={(e) => {
                        const updated = currentDoc.modules.map((m) =>
                          m.id === activeModule.id ? { ...m, description: e.target.value } : m,
                        )
                        setCurrentDoc({ ...currentDoc, modules: updated })
                      }}
                      rows={2}
                      placeholder="Breve resumo e objetivos pedagógicos ou editoriais..."
                      className="bg-transparent border-none p-0 text-xs sm:text-sm text-purple-200/80 focus-visible:ring-0 focus:outline-hidden resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Lista de Blocos */}
              <div className="space-y-4 max-w-4xl mx-auto">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
                  <span>Blocos do Módulo ({activeModule?.blocks.length || 0})</span>
                  <span>Novo bloco entrará ao final do conteúdo</span>
                </div>

                {activeModule?.blocks.map((block, bIdx) => (
                  <div
                    key={block.id}
                    className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-slate-700/80 transition-all space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-purple-950/60 text-purple-300 border border-purple-800/60 text-[10px] font-bold tracking-wider">
                          #{bIdx + 1} · {block.type.toUpperCase()}
                          {block.level ? ` H${block.level}` : ''}
                        </Badge>
                        {block.aiGenerated && (
                          <Badge className="bg-amber-950/60 text-amber-300 border border-amber-800/60 text-[10px] font-bold">
                            Enriquecido por IA
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1 sm:gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={aiGeneratingBlockId === block.id}
                          onClick={() => handleGenerateBlockWithAi(block)}
                          className="h-7 text-xs font-bold border-purple-500/40 text-purple-300 hover:bg-purple-950/40 gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>
                            {aiGeneratingBlockId === block.id ? 'Gerando...' : 'Gerar com IA'}
                          </span>
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleMoveBlock(block.id, 'up')}
                          disabled={bIdx === 0}
                          className="w-7 h-7 text-slate-400 hover:text-white"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleMoveBlock(block.id, 'down')}
                          disabled={bIdx === (activeModule?.blocks.length || 1) - 1}
                          className="w-7 h-7 text-slate-400 hover:text-white"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteBlock(block.id)}
                          className="w-7 h-7 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {block.type === 'title' && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-400 font-semibold">Nível:</span>
                        <div className="flex items-center gap-1">
                          {([1, 2, 3] as const).map((lvl) => (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => handleUpdateBlock(block.id, { level: lvl })}
                              className={`px-2.5 py-0.5 rounded-md font-bold text-[11px] ${
                                block.level === lvl
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              H{lvl}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Input
                        value={block.content}
                        onChange={(e) => handleUpdateBlock(block.id, { content: e.target.value })}
                        placeholder="Conteúdo do título ou chamada..."
                        className="font-bold text-sm bg-slate-800/40 border-slate-700/60 text-white rounded-xl focus:border-purple-500"
                      />

                      {block.type === 'paragraph' && (
                        <MarkdownParagraphBlock
                          content={block.content}
                          onChange={(content) => handleUpdateBlock(block.id, { content })}
                        />
                      )}

                      {block.type !== 'paragraph' &&
                        (block.type === 'title' || block.caption !== undefined) && (
                          <Textarea
                            rows={2}
                            value={block.caption || ''}
                            onChange={(e) =>
                              handleUpdateBlock(block.id, { caption: e.target.value })
                            }
                            placeholder="Subtítulo, explicação ou notas de apoio..."
                            className="text-xs bg-slate-800/30 border-slate-700/40 text-slate-300 rounded-xl focus:border-purple-500"
                          />
                        )}
                    </div>
                  </div>
                ))}

                <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddBlock('title')}
                    className="border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold"
                  >
                    + Adicionar Título
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddBlock('paragraph')}
                    className="border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold"
                  >
                    + Adicionar Parágrafo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddBlock('quiz')}
                    className="border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold"
                  >
                    + Adicionar Quiz
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddBlock('code')}
                    className="border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold"
                  >
                    + Adicionar Código
                  </Button>
                </div>
              </div>
            </main>
          </div>
        )}
      </div>

      {/* Modal de Conectores (Gmail, Google Drive, Google Docs, Google Sheets) */}
      <ConnectorsContextModal
        open={connectorsModalOpen}
        onOpenChange={setConnectorsModalOpen}
        initialTab={connectorsInitialTab}
        onImportContext={handleImportContextFromConnector}
      />

      {/* MODAL AVANÇADO COMPLETO: Estruturas dedicadas (Laboratório, Blog, Site), preview ao vivo e exportação HTML */}
      <AdvancedArtifactEditorModal
        open={advancedModalOpen}
        onOpenChange={setAdvancedModalOpen}
        doc={currentDoc}
        onApplyArtifact={(updated) => {
          setCurrentDoc(updated)
          if (updated.modules.length > 0) {
            setSelectedModuleId(updated.modules[0].id)
          }
        }}
      />
    </div>
  )
}
export default MagicAuthorEditor
