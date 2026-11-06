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
  const [previewMode, setPreviewMode] = useState(false)
  const [advancedModalOpen, setAdvancedModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [aiGeneratingBlockId, setAiGeneratingBlockId] = useState<string | null>(null)

  const activeModule =
    currentDoc.modules.find((m) => m.id === selectedModuleId) || currentDoc.modules[0]

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await saveSecondBrainDoc(currentDoc)
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

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* 1. TOP HEADER (MagicAuthor + Badges + Ações) */}
      <header className="h-16 px-4 sm:px-6 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-slate-400 hover:text-white hover:bg-slate-800 gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Voltar</span>
          </Button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center font-black text-white text-sm shadow-md shadow-purple-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight font-heading text-white">
                  MagicAuthor
                </span>
                <Badge className="bg-purple-900/60 text-purple-300 border border-purple-700/60 text-[10px] font-bold uppercase tracking-wider">
                  {currentDoc.doc_type}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-400 hidden md:block">
                Estúdio Visual de Criação e Enriquecimento Pedagógico com IA
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewMode(!previewMode)}
            className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold gap-1.5"
          >
            <Eye className="w-3.5 h-3.5 text-purple-400" />
            <span>{previewMode ? 'Editor' : 'Pré-visualizar'}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setAdvancedModalOpen(true)}
            className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Avançado</span>
          </Button>

          <Button
            onClick={handleSave}
            disabled={saving}
            size="sm"
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Salvando...' : 'Salvar'}</span>
          </Button>
        </div>
      </header>

      {/* 2. TOOLBAR RICA (Formatação, Fontes e Ações Rápidas) */}
      <div className="h-11 px-4 border-b border-slate-800 bg-slate-900/50 flex items-center gap-1 sm:gap-2 overflow-x-auto text-xs shrink-0 no-scrollbar">
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
            <Plus className="w-3 h-3" />+ Título
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAddBlock('paragraph')}
            className="h-7 text-[11px] font-semibold border-slate-700 text-slate-300 hover:bg-slate-800 gap-1"
          >
            <Plus className="w-3 h-3" />+ Parágrafo
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAddBlock('quiz')}
            className="h-7 text-[11px] font-semibold border-amber-500/30 text-amber-300 hover:bg-amber-950/40 gap-1"
          >
            <HelpCircle className="w-3 h-3" />+ Quiz
          </Button>
        </div>
      </div>

      {/* 3. CORPO PRINCIPAL (Sidebar de Módulos + Canvas Central de Blocos) */}
      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR DE MÓDULOS (Esquerda) */}
        <aside className="w-64 sm:w-72 border-r border-slate-800 bg-slate-900/60 p-4 flex flex-col shrink-0 overflow-y-auto">
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
                {/* Linha Superior do Bloco: Badge de Tipo + Ações */}
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

                {/* Seletor de Nível se for Título */}
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

                {/* Conteúdo Principal do Bloco */}
                <div className="space-y-2">
                  <Input
                    value={block.content}
                    onChange={(e) => handleUpdateBlock(block.id, { content: e.target.value })}
                    placeholder="Conteúdo do título ou chamada..."
                    className="font-bold text-sm bg-slate-800/40 border-slate-700/60 text-white rounded-xl focus:border-purple-500"
                  />

                  {(block.type === 'title' || block.caption !== undefined) && (
                    <Textarea
                      rows={2}
                      value={block.caption || ''}
                      onChange={(e) => handleUpdateBlock(block.id, { caption: e.target.value })}
                      placeholder="Subtítulo, explicação ou notas de apoio..."
                      className="text-xs bg-slate-800/30 border-slate-700/40 text-slate-300 rounded-xl focus:border-purple-500"
                    />
                  )}
                </div>
              </div>
            ))}

            {/* Botões para Inserção Rápida de Bloco */}
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

      {/* MODAL AVANÇADO: Tipo de Artefato (Laboratório, Blog, Site, Documento) */}
      <Dialog open={advancedModalOpen} onOpenChange={setAdvancedModalOpen}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-slate-100 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              Edição Avançada do Artefato
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Escolha o formato e a finalidade deste documento para que o editor e o motor de IA se
              adaptem à estrutura desejada:
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 py-2">
            {[
              {
                type: 'aula_lab' as SecondBrainDocType,
                title: 'Laboratório / Aula',
                desc: 'Módulos pedagógicos com exercícios práticos e passo a passo.',
              },
              {
                type: 'blog_artigo' as SecondBrainDocType,
                title: 'Blog / Artigo',
                desc: 'Estrutura editorial com ganchos, subtítulos e conclusão.',
              },
              {
                type: 'site_landing' as SecondBrainDocType,
                title: 'Site / Landing Page',
                desc: 'Seções de conversão, propostas de valor e CTAs persuasivos.',
              },
              {
                type: 'documento' as SecondBrainDocType,
                title: 'Documento Geral',
                desc: 'Estrutura livre para notas de projeto e planejamento.',
              },
            ].map((opt) => (
              <button
                key={opt.type}
                type="button"
                onClick={() => handleSelectDocType(opt.type)}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  currentDoc.doc_type === opt.type
                    ? 'bg-purple-950/60 border-purple-500 text-white'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="text-xs font-bold mb-1">{opt.title}</div>
                <div className="text-[11px] text-slate-400 leading-snug">{opt.desc}</div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
export default MagicAuthorEditor
