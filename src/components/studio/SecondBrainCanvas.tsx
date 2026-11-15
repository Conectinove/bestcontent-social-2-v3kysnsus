import React, { useState, useEffect, useRef } from 'react'
import {
  Brain,
  Plus,
  Home,
  User,
  GitBranch,
  FolderClosed,
  FileText,
  FileCode,
  LayoutTemplate,
  History,
  Mail,
  PlusCircle,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Calculator,
  Upload,
  BookOpen,
  Layout,
  ExternalLink,
  ChevronRight,
  MoreVertical,
  Trash2,
  Edit3,
  Inbox,
  Cloud,
  Layers,
  GraduationCap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { isSupportedImportFile, parseImportFile } from '@/lib/doc-import'
import {
  getSecondBrainDocs,
  createSecondBrainDoc,
  updateSecondBrainDoc,
  deleteSecondBrainDoc,
  askSecondBrain,
  type SecondBrainDoc,
  type SecondBrainDocType,
  type SecondBrainBlock,
} from '@/services/second-brain'
import MagicAuthorEditor from './MagicAuthorEditor'
import { ConnectorsContextModal, type ConnectorsTab } from './ConnectorsContextModal'
import { LessonTemplateGalleryModal } from './LessonTemplateGalleryModal'
import type { LessonTemplate } from '@/services/lesson-templates'
import { getConnectedStatus } from '@/services/google-connectors'
import { useToast } from '@/hooks/use-toast'

interface SecondBrainCanvasProps {
  onClose?: () => void
}

export const SecondBrainCanvas: React.FC<SecondBrainCanvasProps> = ({ onClose }) => {
  const { toast } = useToast()
  const [docs, setDocs] = useState<SecondBrainDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDoc, setSelectedDoc] = useState<SecondBrainDoc | null>(null)
  const [activeMenu, setActiveMenu] = useState<'inicio' | 'sobre_mim' | 'mapa_memoria'>('inicio')
  const [filterType, setFilterType] = useState<'todos' | 'drive' | 'notas' | 'projetos'>('todos')
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarPage, setSidebarPage] = useState(0)

  // Pergunta Rápida no Segundo Cérebro
  const [askQuery, setAskQuery] = useState('')
  const [asking, setAsking] = useState(false)
  const [askAnswer, setAskAnswer] = useState<string | null>(null)
  const [askSource, setAskSource] = useState<'oficial' | 'calibrado'>('calibrado')

  // Conectores Modal & Status
  const [connectorsModalOpen, setConnectorsModalOpen] = useState(false)
  const [connectorsInitialTab, setConnectorsInitialTab] = useState<ConnectorsTab>('overview')
  const [connectorStatuses, setConnectorStatuses] = useState({
    gmail: false,
    googledrive: false,
    googledocs: false,
    googlesheets: false,
    outlook: false,
    one_drive: false,
    share_point: false,
  })

  // Galeria de Templates de Aulas
  const [lessonGalleryOpen, setLessonGalleryOpen] = useState(false)

  // Importação de arquivos (.md / .txt / .docx) e colar texto
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [createMenuOpen, setCreateMenuOpen] = useState(false)
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    setConnectorStatuses({
      gmail: getConnectedStatus('gmail'),
      googledrive: getConnectedStatus('googledrive'),
      googledocs: getConnectedStatus('googledocs'),
      googlesheets: getConnectedStatus('googlesheets'),
      outlook: getConnectedStatus('outlook' as any),
      one_drive: getConnectedStatus('one_drive' as any),
      share_point: getConnectedStatus('share_point' as any),
    })
  }, [connectorsModalOpen])

  const loadDocs = async () => {
    setLoading(true)
    try {
      const data = await getSecondBrainDocs()
      setDocs(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocs()
  }, [])

  const handleCreateNew = async (type: SecondBrainDocType = 'documento', title?: string) => {
    const defaultTitle =
      title ||
      (type === 'aula_lab'
        ? 'Laboratório Interativo Sem Título'
        : type === 'blog_artigo'
          ? 'Artigo de Blog Sem Título'
          : type === 'site_landing'
            ? 'Landing Page Sem Título'
            : 'Novo Documento Estruturado')

    const newDoc = await createSecondBrainDoc({
      title: defaultTitle,
      doc_type: type,
      location: 'Meu Drive · Notas particulares',
      modules: [
        {
          id: `mod-${Date.now()}-1`,
          title: 'Módulo 1: Introdução & Fundamentos',
          blocks: [
            {
              id: `blk-${Date.now()}-1`,
              type: 'title',
              level: 1,
              content: 'Visão Geral do Projeto',
              caption: 'Apresentação dos objetivos centrais e diretrizes estratégicas.',
              isActive: true,
            },
            {
              id: `blk-${Date.now()}-2`,
              type: 'paragraph',
              content:
                'Este bloco sintetiza os pontos-chave de aprendizado e próximas ações recomendadas.',
              isActive: true,
            },
          ],
        },
      ],
    })

    await loadDocs()
    setSelectedDoc(newDoc)
  }

  const handleApplyLessonTemplate = async (template: LessonTemplate) => {
    const newDoc = await createSecondBrainDoc({
      title: template.title,
      doc_type: template.docType,
      location: `Templates de Aulas · ${template.category.toUpperCase()}`,
      modules: template.modules,
    })

    await loadDocs()
    setSelectedDoc(newDoc)
    setLessonGalleryOpen(false)
    toast({
      title: 'Template de Aula aplicado com sucesso!',
      description: `Nota "${template.title}" estruturada e pronta para o Gerar com IA.`,
    })
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!window.confirm('Tem certeza que deseja excluir esta nota do Segundo Cérebro?')) return
    await deleteSecondBrainDoc(id)
    await loadDocs()
    if (selectedDoc?.id === id) {
      setSelectedDoc(null)
    }
  }

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!askQuery.trim()) return
    setAsking(true)
    try {
      const res = await askSecondBrain(askQuery)
      setAskAnswer(res.answer)
      setAskSource(res.source)
    } finally {
      setAsking(false)
    }
  }

  // Cria nota privada a partir de conteúdo importado (arquivo ou texto colado)
  const createImportedNote = async (title: string, content: string) => {
    const paragraphs = content
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)

    if (paragraphs.length === 0) {
      toast({
        title: 'Conteúdo vazio',
        description: 'O arquivo/texto importado não contém parágrafos legíveis.',
        variant: 'destructive',
      })
      return
    }

    const now = Date.now()
    await createSecondBrainDoc({
      title,
      doc_type: 'nota_privada',
      location: 'Meu Drive · Notas particulares',
      modules: [
        {
          id: `mod-${now}-1`,
          title: 'Conteúdo Importado',
          blocks: paragraphs.map((p, i) => ({
            id: `blk-${now}-${i + 1}`,
            type: 'paragraph' as const,
            content: p,
            isActive: true,
          })),
        },
      ],
    })

    await loadDocs()
    setCreateMenuOpen(false)
    setPasteOpen(false)
    setPasteText('')
    toast({
      title: 'Importação concluída!',
      description: `"${title}" adicionado às Notas particulares.`,
    })
  }

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!isSupportedImportFile(file)) {
      toast({
        title: 'Formato não suportado',
        description: 'Envie um arquivo .md, .markdown, .txt ou .docx.',
        variant: 'destructive',
      })
      return
    }
    setImporting(true)
    try {
      const parsed = await parseImportFile(file)
      await createImportedNote(parsed.title, parsed.content)
    } catch (err) {
      toast({
        title: 'Falha na importação',
        description: err instanceof Error ? err.message : 'Não foi possível ler o arquivo.',
        variant: 'destructive',
      })
    } finally {
      setImporting(false)
    }
  }

  const handlePasteImport = async () => {
    const text = pasteText.trim()
    if (!text) return
    setImporting(true)
    try {
      const firstLine = text
        .split('\n')[0]
        .replace(/^#{1,6}\s*/, '')
        .slice(0, 80)
      await createImportedNote(firstLine || 'Nota Colada', text)
    } finally {
      setImporting(false)
    }
  }

  const filteredDocs = docs.filter((doc) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const match =
        doc.title.toLowerCase().includes(q) ||
        doc.author_name.toLowerCase().includes(q) ||
        doc.location.toLowerCase().includes(q)
      if (!match) return false
    }
    const loc = doc.location || ''
    if (filterType === 'notas') return loc.includes('Notas particulares')
    if (filterType === 'drive') return loc.includes('Meu Drive')
    if (filterType === 'projetos')
      return doc.doc_type === 'aula_lab' || doc.doc_type === 'site_landing'
    return true
  })

  // Paginação da lista "Meu Drive" na sidebar — mostra mais que 5 documentos, com páginas
  const SIDEBAR_PAGE_SIZE = 5
  const sidebarTotalPages = Math.max(1, Math.ceil(docs.length / SIDEBAR_PAGE_SIZE))
  const safeSidebarPage = Math.min(sidebarPage, sidebarTotalPages - 1)
  const sidebarDocs = docs.slice(
    safeSidebarPage * SIDEBAR_PAGE_SIZE,
    safeSidebarPage * SIDEBAR_PAGE_SIZE + SIDEBAR_PAGE_SIZE,
  )

  // Se tem um documento aberto no MagicAuthor
  if (selectedDoc) {
    return (
      <MagicAuthorEditor
        doc={selectedDoc}
        onBack={() => {
          setSelectedDoc(null)
          loadDocs()
        }}
        onSaveComplete={(updated) => {
          setSelectedDoc(updated)
          loadDocs()
        }}
      />
    )
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-[850px] bg-slate-950 text-slate-100 rounded-3xl border border-slate-800/80 overflow-hidden shadow-2xl">
      {/* ==============================================================
          SIDEBAR DO SEGUNDO CÉREBRO (Conforme prints do Genspark)
          ============================================================== */}
      <aside className="w-full lg:w-72 min-w-0 bg-slate-900/90 border-r border-slate-800/80 p-4 flex flex-col justify-between shrink-0 space-y-6 overflow-y-auto">
        <div className="space-y-4 min-w-0">
          {/* Topo: Logo & Botão Criar */}
          <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-slate-800/60 min-w-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-8 h-8 shrink-0 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center ring-1 ring-purple-500/20">
                <Brain className="w-4 h-4 text-purple-400" />
              </div>
              <span className="font-black text-sm tracking-tight text-white uppercase font-heading truncate min-w-0">
                Segundo Cérebro
              </span>
            </div>
            <Badge
              variant="outline"
              className="shrink-0 text-[9px] font-mono text-purple-400 border-purple-500/30 hidden min-[340px]:inline-flex"
            >
              v2.4
            </Badge>
          </div>

          <div className="relative">
            <Button
              type="button"
              onClick={() => setCreateMenuOpen((v) => !v)}
              disabled={importing}
              className="w-full h-10 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-black text-xs gap-2 shadow-lg shadow-black/40 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              {importing ? 'Importando…' : '+ Criar ou enviar'}
            </Button>

            {createMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setCreateMenuOpen(false)}
                  aria-hidden="true"
                />
                <div className="absolute z-30 mt-1 w-full rounded-xl bg-slate-900 border border-slate-700 shadow-xl shadow-black/50 overflow-hidden text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setCreateMenuOpen(false)
                      fileInputRef.current?.click()
                    }}
                    className="w-full text-left px-3 py-2.5 text-slate-200 hover:bg-purple-900/40 hover:text-white flex items-center gap-2 font-semibold"
                  >
                    <Upload className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    Importar arquivo (.md, .txt, .docx)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCreateMenuOpen(false)
                      setPasteOpen(true)
                    }}
                    className="w-full text-left px-3 py-2.5 text-slate-200 hover:bg-purple-900/40 hover:text-white flex items-center gap-2 font-semibold border-t border-slate-800"
                  >
                    <FileText className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    Colar texto
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCreateMenuOpen(false)
                      handleCreateNew('documento')
                    }}
                    className="w-full text-left px-3 py-2.5 text-slate-200 hover:bg-purple-900/40 hover:text-white flex items-center gap-2 font-semibold border-t border-slate-800"
                  >
                    <Plus className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    Novo documento em branco
                  </button>
                </div>
              </>
            )}
          </div>

          {pasteOpen && (
            <div className="space-y-2 rounded-xl border border-slate-700 bg-slate-950/80 p-2">
              <Textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                rows={5}
                placeholder="Cole aqui o conteúdo da nota (.md, texto livre)…"
                className="text-[11px] bg-slate-900 border-slate-800 text-slate-200 placeholder:text-slate-500 resize-y"
              />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={importing || !pasteText.trim()}
                  onClick={handlePasteImport}
                  className="h-7 text-[11px] font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-lg"
                >
                  {importing ? 'Importando…' : 'Importar'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setPasteOpen(false)
                    setPasteText('')
                  }}
                  className="h-7 text-[11px] text-slate-400 hover:text-white"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.markdown,.txt,.docx"
            className="hidden"
            onChange={handleFileSelected}
          />

          {/* Menu Principal */}
          <nav className="space-y-1 text-xs min-w-0">
            <button
              type="button"
              onClick={() => setActiveMenu('inicio')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold transition-all text-left ${
                activeMenu === 'inicio'
                  ? 'bg-purple-600/15 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Início</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMenu('sobre_mim')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold transition-all text-left ${
                activeMenu === 'sobre_mim'
                  ? 'bg-purple-600/15 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Sobre Mim (Perfil)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMenu('mapa_memoria')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold transition-all text-left ${
                activeMenu === 'mapa_memoria'
                  ? 'bg-purple-600/15 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <GitBranch className="w-4 h-4" />
              <span>Mapa de Memória</span>
            </button>
          </nav>

          {/* Meu Drive & Notas Particulares */}
          <div className="pt-2 border-t border-slate-800/60 space-y-2 min-w-0">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 px-1 min-w-0">
              <FolderClosed className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="truncate">Meu Drive</span>
              <span className="ml-auto shrink-0 text-[9px] font-mono text-purple-400/80 bg-purple-950/40 border border-purple-800/40 rounded-md px-1.5 py-0.5">
                {docs.length} docs
              </span>
            </div>

            <div className="space-y-1 pl-2 text-[11px] min-w-0">
              <div className="text-slate-400 font-semibold py-1 px-2 flex items-center gap-1.5 min-w-0">
                <FileCode className="w-3.5 h-3.5 text-purple-400/80 shrink-0" />
                <span className="truncate">Notas privadas (.md / docs)</span>
              </div>

              {sidebarDocs.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => setSelectedDoc(doc)}
                  className="w-full text-left truncate px-2 py-1.5 rounded-lg text-slate-400 hover:text-purple-300 hover:bg-slate-800/60 transition-all flex items-center gap-2"
                >
                  <FileText className="w-3 h-3 shrink-0 text-slate-500" />
                  <span className="truncate">{doc.title}</span>
                </button>
              ))}

              {sidebarTotalPages > 1 && (
                <div className="flex items-center justify-between gap-1 pt-1.5">
                  <button
                    type="button"
                    onClick={() => setSidebarPage(Math.max(0, safeSidebarPage - 1))}
                    disabled={safeSidebarPage === 0}
                    className="px-2 py-1 rounded-lg text-[10px] font-bold text-purple-300 bg-purple-950/30 border border-purple-800/40 hover:bg-purple-900/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    ← Anterior
                  </button>
                  <span className="text-[9px] font-mono text-slate-500 whitespace-nowrap">
                    {safeSidebarPage + 1}/{sidebarTotalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setSidebarPage(Math.min(sidebarTotalPages - 1, safeSidebarPage + 1))
                    }
                    disabled={safeSidebarPage >= sidebarTotalPages - 1}
                    className="px-2 py-1 rounded-lg text-[10px] font-bold text-purple-300 bg-purple-950/30 border border-purple-800/40 hover:bg-purple-900/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    Próxima →
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setLessonGalleryOpen(true)}
                className="w-full min-w-0 text-left px-2 py-1.5 rounded-lg text-purple-300 hover:text-white bg-purple-950/30 hover:bg-purple-900/40 border border-purple-800/40 transition-all flex items-center gap-2 font-bold"
              >
                <GraduationCap className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="truncate">Templates de Aulas (PT-BR)</span>
              </button>

              <button
                type="button"
                onClick={() => handleCreateNew('aula_lab', 'Laboratório Interativo CTlabs')}
                className="w-full text-left px-2 py-1.5 rounded-lg text-slate-400 hover:text-purple-300 hover:bg-slate-800/60 transition-all flex items-center gap-2"
              >
                <LayoutTemplate className="w-3 h-3 text-purple-400" />
                <span>Laboratórios & Labs</span>
              </button>
            </div>
          </div>

          {/* Conectores & Atalhos */}
          <div className="pt-2 border-t border-slate-800/60 space-y-1.5 text-xs min-w-0">
            <div className="flex items-center gap-2 text-slate-300 font-bold px-1 min-w-0">
              <History className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="truncate">Histórico de Projetos</span>
            </div>

            <div
              onClick={() => {
                setConnectorsInitialTab('gmail')
                setConnectorsModalOpen(true)
              }}
              className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-purple-500/40 cursor-pointer transition-all text-[11px] space-y-1 group overflow-hidden"
            >
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-2 text-slate-300 group-hover:text-purple-300 font-semibold min-w-0">
                  <Mail className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span className="truncate">Gmail</span>
                </div>
                {connectorStatuses.gmail ? (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Conectado
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500">Conectar</span>
                )}
              </div>
              <p className="text-[10px] text-slate-400">
                E-mails e notas sincronizados no Segundo Cérebro.
              </p>
            </div>

            <div
              onClick={() => {
                setConnectorsInitialTab('googledrive')
                setConnectorsModalOpen(true)
              }}
              className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-purple-500/40 cursor-pointer transition-all text-[11px] space-y-1 group overflow-hidden"
            >
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-2 text-slate-300 group-hover:text-purple-300 font-semibold min-w-0">
                  <FolderClosed className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">Meu Google Drive</span>
                </div>
                {connectorStatuses.googledrive ? (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Ativo
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500">Conectar</span>
                )}
              </div>
              <p className="text-[10px] text-slate-400">
                Documentos e arquivos do Drive como contexto.
              </p>
            </div>

            {/* Atalho Microsoft Outlook */}
            <div
              onClick={() => {
                setConnectorsInitialTab('outlook' as any)
                setConnectorsModalOpen(true)
              }}
              className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-purple-500/40 cursor-pointer transition-all text-[11px] space-y-1 group overflow-hidden"
            >
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-2 text-slate-300 group-hover:text-purple-300 font-semibold min-w-0">
                  <Inbox className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">Outlook</span>
                </div>
                {connectorStatuses.outlook ? (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Conectado
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500">Conectar</span>
                )}
              </div>
              <p className="text-[10px] text-slate-400">E-mails e briefings corporativos.</p>
            </div>

            {/* Atalho Microsoft OneDrive */}
            <div
              onClick={() => {
                setConnectorsInitialTab('onedrive' as any)
                setConnectorsModalOpen(true)
              }}
              className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-purple-500/40 cursor-pointer transition-all text-[11px] space-y-1 group overflow-hidden"
            >
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-2 text-slate-300 group-hover:text-purple-300 font-semibold min-w-0">
                  <Cloud className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="truncate">OneDrive</span>
                </div>
                {connectorStatuses.one_drive ? (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Ativo
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500">Conectar</span>
                )}
              </div>
              <p className="text-[10px] text-slate-400">Documentos e pastas na nuvem Microsoft.</p>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setConnectorsInitialTab('overview')
                setConnectorsModalOpen(true)
              }}
              className="w-full min-w-0 justify-start text-[11px] text-purple-400 hover:text-purple-300 h-8 px-2 gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">+ Conectar mais (SharePoint, Sheets...)</span>
            </Button>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800/60 text-[10px] text-slate-400 flex items-center justify-between">
          <span>BestContent AI · Studio</span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white underline font-semibold"
            >
              Sair do Cérebro
            </button>
          )}
        </div>
      </aside>

      {/* ==============================================================
          CONTEÚDO CENTRAL: TELA INICIAL (Conforme Print 3)
          ============================================================== */}
      <main className="flex-1 p-5 sm:p-8 space-y-8 overflow-y-auto">
        {/* Cabeçalho de Boas-Vindas */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-400">
            <span>Segundo Cérebro</span>
            <ChevronRight className="w-3 h-3" />
            <span>MagicAuthor Studio</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black font-heading text-white tracking-tight leading-tight max-w-2xl">
            O Segundo Cérebro lembra de tudo. E pensa com você.
          </h1>

          {/* Caixa de Pergunta Inteligente */}
          <form
            onSubmit={handleAsk}
            className="relative rounded-2xl bg-slate-900 border border-slate-800 p-2 shadow-xl focus-within:border-purple-500/80 transition-all max-w-3xl"
          >
            <div className="flex items-center gap-2 px-3 py-2">
              <Search className="w-5 h-5 text-purple-400 shrink-0" />
              <input
                type="text"
                value={askQuery}
                onChange={(e) => setAskQuery(e.target.value)}
                placeholder="Pergunte qualquer coisa — notas, e-mails, reuniões, ideias, próximos passos…"
                className="w-full bg-transparent text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-hidden"
              />
              <Button
                type="submit"
                size="sm"
                disabled={asking}
                className="h-9 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs gap-1.5 shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {asking ? 'Pensando...' : 'Consultar'}
              </Button>
            </div>

            <div className="px-3 py-1.5 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-[11px] text-slate-400">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="hover:text-slate-200 cursor-pointer whitespace-nowrap">
                  📎 Padrão
                </span>
                <span className="hover:text-slate-200 cursor-pointer whitespace-nowrap">
                  📁 Contexto de Trabalho
                </span>
              </div>
              <span className="text-[10px] text-purple-400/80 whitespace-nowrap sm:text-right">
                Pressione Enter para consultar a memória
              </span>
            </div>
          </form>

          {/* Resposta do Segundo Cérebro */}
          {askAnswer && (
            <Card className="p-4 rounded-2xl bg-purple-950/20 border-purple-800/40 text-xs text-purple-200 space-y-2 animate-fade-in max-w-3xl">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5 text-purple-300">
                  <Brain className="w-4 h-4 text-purple-400" /> Resposta da Memória do Cérebro:
                </span>
                {askSource === 'oficial' ? (
                  <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] gap-1">
                    <ShieldCheck className="w-3 h-3" /> Dados Oficiais
                  </Badge>
                ) : (
                  <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] gap-1">
                    <Calculator className="w-3 h-3" /> Estimativa Calibrada
                  </Badge>
                )}
              </div>
              <p className="leading-relaxed whitespace-pre-wrap">{askAnswer}</p>
            </Card>
          )}
        </div>

        {/* Seção "Comece aqui" (Cards de Início do Print 3 + Banner de Templates) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-sm font-black text-white uppercase tracking-wider font-heading whitespace-nowrap">
              Comece aqui
            </h2>
            <Button
              type="button"
              size="sm"
              onClick={() => setLessonGalleryOpen(true)}
              className="h-8 text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl gap-1.5 shadow-md shadow-purple-900/30 shrink-0"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Galeria de Templates
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <button
              type="button"
              onClick={() => setLessonGalleryOpen(true)}
              className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/60 to-slate-900 border border-purple-500/40 hover:border-purple-400 hover:bg-purple-900/30 transition-all text-left space-y-3 group shadow-lg shadow-purple-950/20 overflow-hidden min-w-0"
            >
              <div className="w-10 h-10 shrink-0 rounded-xl bg-purple-600/30 flex items-center justify-center text-purple-300 group-hover:scale-110 transition-transform">
                <GraduationCap className="w-5 h-5 text-purple-300" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-purple-300 font-semibold flex items-center gap-1 min-w-0">
                  <span className="truncate">1 Clique &rarr; Estrutura</span>
                </p>
                <h3 className="text-sm font-black text-white mt-1 group-hover:text-purple-200 transition-colors truncate">
                  Templates de Aulas PT-BR
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  Plano de aula, laboratório, tutorial, quiz e roteiro prontos.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleCreateNew('documento', 'Nova Nota')}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-purple-500/50 hover:bg-slate-900 transition-all text-left space-y-3 group overflow-hidden min-w-0"
            >
              <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 group-hover:bg-purple-600/20 group-hover:text-purple-300 transition-colors">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-400 font-medium truncate">
                  Notion &rarr; Notas privadas
                </p>
                <h3 className="text-sm font-black text-white mt-1 group-hover:text-purple-300 transition-colors truncate">
                  Nova página de notas
                </h3>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleCreateNew('aula_lab', 'Laboratório Interativo MagicAuthor')}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-purple-500/50 hover:bg-slate-900 transition-all text-left space-y-3 group overflow-hidden min-w-0"
            >
              <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 group-hover:bg-purple-600/20 group-hover:text-purple-300 transition-colors">
                <Layout className="w-5 h-5 text-purple-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-400 font-medium truncate">
                  Google Docs &rarr; AI Docs
                </p>
                <h3 className="text-sm font-black text-purple-400 mt-1 truncate">
                  Documentos de IA · Planilhas · Apresentações
                </h3>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleCreateNew('site_landing', 'Landing Page & Site Dinâmico')}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-purple-500/50 hover:bg-slate-900 transition-all text-left space-y-3 group overflow-hidden min-w-0"
            >
              <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 group-hover:bg-purple-600/20 group-hover:text-purple-300 transition-colors">
                <Upload className="w-5 h-5 text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-400 font-medium truncate">
                  Google Drive &rarr; Drive
                </p>
                <h3 className="text-sm font-black text-white mt-1 group-hover:text-purple-300 transition-colors truncate">
                  Upload ou Criar Artefato
                </h3>
              </div>
            </button>
          </div>
        </div>

        {/* Tabela de Recentes com Filtros e Busca */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-black text-white mr-2 uppercase tracking-wide">
                Recentes
              </span>

              <Button
                type="button"
                size="sm"
                variant={filterType === 'drive' ? 'default' : 'outline'}
                onClick={() => setFilterType(filterType === 'drive' ? 'todos' : 'drive')}
                className={`h-7 text-xs rounded-xl font-bold ${
                  filterType === 'drive'
                    ? 'bg-purple-600 text-white'
                    : 'border-slate-800 text-slate-400'
                }`}
              >
                Drive
              </Button>

              <Button
                type="button"
                size="sm"
                variant={filterType === 'notas' ? 'default' : 'outline'}
                onClick={() => setFilterType(filterType === 'notas' ? 'todos' : 'notas')}
                className={`h-7 text-xs rounded-xl font-bold ${
                  filterType === 'notas'
                    ? 'bg-purple-600 text-white'
                    : 'border-slate-800 text-slate-400'
                }`}
              >
                Notas particulares
              </Button>

              <Button
                type="button"
                size="sm"
                variant={filterType === 'projetos' ? 'default' : 'outline'}
                onClick={() => setFilterType(filterType === 'projetos' ? 'todos' : 'projetos')}
                className={`h-7 text-xs rounded-xl font-bold ${
                  filterType === 'projetos'
                    ? 'bg-purple-600 text-white'
                    : 'border-slate-800 text-slate-400'
                }`}
              >
                Projeto Genspark / Labs
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filtrar por nome ou pessoa..."
                  className="h-8 pl-8 text-xs bg-slate-900 border-slate-800 text-slate-200 w-48 sm:w-60 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Tabela de Documentos do Segundo Cérebro */}
          <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/60">
            <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-slate-900 text-[11px] font-bold text-slate-400 border-b border-slate-800 min-w-0">
              <div className="col-span-6 sm:col-span-5 min-w-0 truncate">Título</div>
              <div className="col-span-3 sm:col-span-3 min-w-0 truncate">Localização</div>
              <div className="hidden sm:block sm:col-span-2 min-w-0 truncate">Criado por</div>
              <div className="col-span-3 sm:col-span-2 text-right truncate">Modificado</div>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Carregando documentos do Segundo Cérebro...
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Nenhum documento encontrado. Clique em "+ Criar ou enviar" acima.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {filteredDocs.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-slate-800/40 cursor-pointer transition-colors text-xs group min-w-0 overflow-hidden"
                  >
                    <div className="col-span-6 sm:col-span-5 flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                        {doc.title.endsWith('.md')
                          ? 'MD'
                          : doc.title.endsWith('.docx')
                            ? 'W'
                            : doc.title.endsWith('.html')
                              ? 'EM'
                              : 'DOC'}
                      </span>
                      <span className="font-bold text-slate-100 group-hover:text-purple-300 transition-colors truncate">
                        {doc.title}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[9px] uppercase px-1.5 py-0 font-mono border-slate-700 text-slate-400 hidden sm:inline-flex"
                      >
                        {doc.doc_type}
                      </Badge>
                    </div>

                    <div className="col-span-3 sm:col-span-3 text-slate-400 truncate text-[11px] flex items-center gap-1.5 min-w-0">
                      <FolderClosed className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate">{doc.location}</span>
                    </div>

                    <div className="hidden sm:flex sm:col-span-2 items-center gap-1.5 text-slate-300 text-[11px] truncate min-w-0">
                      <div className="w-4 h-4 rounded-full bg-slate-700 text-[9px] flex items-center justify-center font-bold text-white shrink-0">
                        {doc.author_name.charAt(0)}
                      </div>
                      <span className="truncate">{doc.author_name}</span>
                    </div>

                    <div className="col-span-3 sm:col-span-2 flex items-center justify-end gap-2 text-slate-400 text-[11px] min-w-0">
                      <span>
                        {new Date(doc.updated).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, doc.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity"
                        title="Excluir documento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      {/* Modal de Conectores e Importação de Contexto (Gmail, Drive, Docs, Sheets, Outlook, OneDrive, SharePoint) */}
      <ConnectorsContextModal
        open={connectorsModalOpen}
        onOpenChange={setConnectorsModalOpen}
        initialTab={connectorsInitialTab}
        onImportContext={async (ctx) => {
          toast({
            title: 'Contexto importado!',
            description: `"${ctx.title}" pronto para ser usado no seu documento.`,
          })
          // Se houver documento selecionado no Segundo Cérebro, injeta o bloco de contexto importado nele
          if (selectedDoc) {
            const contextBlock: SecondBrainBlock = {
              id: `blk-ctx-${Date.now()}`,
              type: 'callout',
              content: ctx.content,
              caption: `${ctx.subtitle} · Importado via Conectores`,
              isActive: true,
            }
            const updatedModules = [...(selectedDoc.modules || [])]
            if (updatedModules.length > 0) {
              updatedModules[0] = {
                ...updatedModules[0],
                blocks: [contextBlock, ...(updatedModules[0].blocks || [])],
              }
            } else {
              updatedModules.push({
                id: `mod-${Date.now()}`,
                title: 'Contexto Importado',
                blocks: [contextBlock],
              })
            }
            const updated = await updateSecondBrainDoc(selectedDoc.id, {
              modules: updatedModules,
            })
            if (updated) {
              setSelectedDoc(updated)
              await loadDocs()
              return
            }
          }
          // Caso contrário, cria uma nova nota já estruturada com o bloco do contexto
          const newDoc = await createSecondBrainDoc({
            title: ctx.title,
            doc_type: ctx.type === 'canva' ? 'aula_lab' : 'documento',
            location: `Conectores · ${ctx.source.toUpperCase()}`,
            modules: [
              {
                id: `mod-${Date.now()}-1`,
                title: `Contexto: ${ctx.title}`,
                blocks: [
                  {
                    id: `blk-${Date.now()}-1`,
                    type: 'callout',
                    content: ctx.content,
                    caption: `${ctx.subtitle} · Importado via Conectores do Segundo Cérebro`,
                    isActive: true,
                  },
                  {
                    id: `blk-${Date.now()}-2`,
                    type: 'paragraph',
                    content:
                      'Use este contexto como base para gerar conteúdos, aulas interativas ou roteiros com IA no painel do MagicAuthor.',
                    isActive: true,
                  },
                ],
              },
            ],
          })
          await loadDocs()
          setSelectedDoc(newDoc)
        }}
      />

      {/* Modal de Galeria de Templates de Aulas */}
      <LessonTemplateGalleryModal
        open={lessonGalleryOpen}
        onOpenChange={setLessonGalleryOpen}
        onSelectTemplate={handleApplyLessonTemplate}
      />
    </div>
  )
}

export default SecondBrainCanvas
