import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConnectorButton } from '@/components/skip/ConnectorButton'
import { listConnectors, type ConnectorState } from '@/lib/skipConnectors'
import {
  searchUserDriveFiles,
  searchUserGmailMessages,
  readUserDriveFileContent,
  fetchUserGmailMessage,
  readUserGoogleDoc,
  readUserGoogleSheet,
  type DriveItem,
  type GmailMessageItem,
  type ImportedContextItem,
} from '@/services/google-connectors'
import {
  FileText,
  Mail,
  HardDrive,
  FileSpreadsheet,
  Search,
  Plus,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ConnectorsContextModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportContext: (item: ImportedContextItem) => void
  initialTab?: 'overview' | 'googledrive' | 'gmail' | 'googledocs' | 'googlesheets'
}

export const ConnectorsContextModal: React.FC<ConnectorsContextModalProps> = ({
  open,
  onOpenChange,
  onImportContext,
  initialTab = 'overview',
}) => {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<string>(initialTab)
  const [connectors, setConnectors] = useState<ConnectorState[]>([])
  const [loadingStatuses, setLoadingStatuses] = useState(false)

  // Drive state
  const [driveFiles, setDriveFiles] = useState<DriveItem[]>([])
  const [driveSearch, setDriveSearch] = useState('')
  const [loadingDrive, setLoadingDrive] = useState(false)
  const [importingDriveId, setImportingDriveId] = useState<string | null>(null)

  // Gmail state
  const [gmailMessages, setGmailMessages] = useState<GmailMessageItem[]>([])
  const [gmailSearch, setGmailSearch] = useState('')
  const [loadingGmail, setLoadingGmail] = useState(false)
  const [importingGmailId, setImportingGmailId] = useState<string | null>(null)

  // Docs direct URL / ID
  const [docIdInput, setDocIdInput] = useState('')
  const [importingDoc, setImportingDoc] = useState(false)

  // Sheets direct ID / Range
  const [sheetIdInput, setSheetIdInput] = useState('')
  const [sheetRangeInput, setSheetRangeInput] = useState('A1:Z50')
  const [importingSheet, setImportingSheet] = useState(false)

  useEffect(() => {
    if (open) {
      setActiveTab(initialTab)
      loadStatuses()
    }
  }, [open, initialTab])

  const loadStatuses = async () => {
    setLoadingStatuses(true)
    try {
      const all = await listConnectors()
      setConnectors(all)
    } catch (err) {
      console.warn('[ConnectorsModal] Falha ao carregar status:', err)
    } finally {
      setLoadingStatuses(false)
    }
  }

  const getStatus = (toolkit: string): 'connected' | 'not_connected' | 'expired' => {
    const found = connectors.find((c) => c.toolkit === toolkit)
    return found ? found.status : 'not_connected'
  }

  // Carregar arquivos Drive
  const handleLoadDriveFiles = async () => {
    if (getStatus('googledrive') !== 'connected') return
    setLoadingDrive(true)
    try {
      const files = await searchUserDriveFiles(driveSearch)
      setDriveFiles(files)
    } finally {
      setLoadingDrive(false)
    }
  }

  // Carregar e-mails Gmail
  const handleLoadGmail = async () => {
    if (getStatus('gmail') !== 'connected') return
    setLoadingGmail(true)
    try {
      const msgs = await searchUserGmailMessages(gmailSearch)
      setGmailMessages(msgs)
    } finally {
      setLoadingGmail(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'googledrive' && getStatus('googledrive') === 'connected') {
      handleLoadDriveFiles()
    } else if (activeTab === 'gmail' && getStatus('gmail') === 'connected') {
      handleLoadGmail()
    }
  }, [activeTab, connectors])

  const handleImportDriveFile = async (file: DriveItem) => {
    setImportingDriveId(file.id)
    try {
      const { text, error } = await readUserDriveFileContent(file.id, file.mimeType)
      if (error && !text) {
        toast({
          title: 'Erro ao extrair conteúdo',
          description: error,
          variant: 'destructive',
        })
        return
      }

      const item: ImportedContextItem = {
        id: `ctx-drive-${file.id}`,
        source: 'googledrive',
        title: file.name,
        subtitle: `Google Drive · ${file.mimeType.split('/').pop()}`,
        content: text || `[Arquivo: ${file.name}]`,
        metadata: { fileId: file.id, webViewLink: file.webViewLink, mimeType: file.mimeType },
        createdAt: new Date().toISOString(),
      }

      onImportContext(item)
      toast({
        title: 'Contexto importado do Google Drive!',
        description: `"${file.name}" agora está ativo como contexto para o MagicAuthor.`,
      })
      onOpenChange(false)
    } finally {
      setImportingDriveId(null)
    }
  }

  const handleImportGmailMsg = async (msg: GmailMessageItem) => {
    setImportingGmailId(msg.id)
    try {
      const detail = await fetchUserGmailMessage(msg.id)
      const content = detail.body || msg.bodyText || msg.snippet
      const item: ImportedContextItem = {
        id: `ctx-gmail-${msg.id}`,
        source: 'gmail',
        title: detail.subject || msg.subject,
        subtitle: `Gmail · ${detail.from || msg.from || 'Remetente'}`,
        content: `Assunto: ${detail.subject}\nDe: ${detail.from}\n\n${content}`,
        metadata: { messageId: msg.id, date: detail.date },
        createdAt: new Date().toISOString(),
      }
      onImportContext(item)
      toast({
        title: 'E-mail importado como contexto!',
        description: `"${item.title}" foi adicionado ao contexto ativo.`,
      })
      onOpenChange(false)
    } finally {
      setImportingGmailId(null)
    }
  }

  const handleImportDocById = async () => {
    if (!docIdInput.trim()) return
    // Extrai o ID caso o usuário cole uma URL inteira do Google Docs
    const match = docIdInput.match(/\/d\/([a-zA-Z0-9-_]+)/)
    const docId = match ? match[1] : docIdInput.trim()

    setImportingDoc(true)
    try {
      const { title, content, error } = await readUserGoogleDoc(docId)
      if (error && !content) {
        toast({
          title: 'Não foi possível ler o documento',
          description: error,
          variant: 'destructive',
        })
        return
      }
      const item: ImportedContextItem = {
        id: `ctx-doc-${docId}`,
        source: 'googledocs',
        title: title || 'Documento Google Docs',
        subtitle: `Google Docs · ID: ${docId.slice(0, 8)}...`,
        content,
        metadata: { documentId: docId },
        createdAt: new Date().toISOString(),
      }
      onImportContext(item)
      toast({
        title: 'Google Doc importado!',
        description: `"${item.title}" agora é contexto do MagicAuthor.`,
      })
      setDocIdInput('')
      onOpenChange(false)
    } finally {
      setImportingDoc(false)
    }
  }

  const handleImportSheetById = async () => {
    if (!sheetIdInput.trim()) return
    const match = sheetIdInput.match(/\/d\/([a-zA-Z0-9-_]+)/)
    const sheetId = match ? match[1] : sheetIdInput.trim()

    setImportingSheet(true)
    try {
      const { title, rowsText, error } = await readUserGoogleSheet(sheetId, sheetRangeInput)
      if (error && !rowsText) {
        toast({
          title: 'Erro ao ler Google Sheets',
          description: error,
          variant: 'destructive',
        })
        return
      }
      const item: ImportedContextItem = {
        id: `ctx-sheet-${sheetId}`,
        source: 'googlesheets',
        title: title || 'Planilha Google Sheets',
        subtitle: `Google Sheets · Intervalo ${sheetRangeInput}`,
        content: rowsText,
        metadata: { spreadsheetId: sheetId, range: sheetRangeInput },
        createdAt: new Date().toISOString(),
      }
      onImportContext(item)
      toast({
        title: 'Planilha importada com sucesso!',
        description: `Linhas de "${item.title}" adicionadas ao contexto ativo.`,
      })
      setSheetIdInput('')
      onOpenChange(false)
    } finally {
      setImportingSheet(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[94vw] max-h-[88vh] flex flex-col bg-slate-950 border-slate-800 text-slate-100 p-0 rounded-3xl overflow-hidden">
        {/* Header Superior */}
        <DialogHeader className="p-5 sm:p-6 pb-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/40">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-black font-heading text-white flex items-center gap-2">
                  Conectores do Segundo Cérebro
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400">
                  Conecte suas contas do Google para importar arquivos, e-mails e planilhas como
                  contexto pedagógico.
                </DialogDescription>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={loadStatuses}
              disabled={loadingStatuses}
              className="text-slate-400 hover:text-white"
              title="Atualizar status"
            >
              <RefreshCw className={`w-4 h-4 ${loadingStatuses ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </DialogHeader>

        {/* Abas e Conteúdo */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-slate-900/80 p-1 border border-slate-800/80 rounded-2xl grid grid-cols-2 sm:grid-cols-5 gap-1 mb-4">
              <TabsTrigger
                value="overview"
                className="text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-xl py-1.5"
              >
                Visão Geral
              </TabsTrigger>
              <TabsTrigger
                value="googledrive"
                className="text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-xl py-1.5 flex items-center gap-1.5"
              >
                <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                <span>Drive</span>
                {getStatus('googledrive') === 'connected' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </TabsTrigger>
              <TabsTrigger
                value="gmail"
                className="text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-xl py-1.5 flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5 text-rose-400" />
                <span>Gmail</span>
                {getStatus('gmail') === 'connected' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </TabsTrigger>
              <TabsTrigger
                value="googledocs"
                className="text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-xl py-1.5 flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>Docs</span>
                {getStatus('googledocs') === 'connected' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </TabsTrigger>
              <TabsTrigger
                value="googlesheets"
                className="text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-xl py-1.5 flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sheets</span>
                {getStatus('googlesheets') === 'connected' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </TabsTrigger>
            </TabsList>

            {/* ABA 1: VISÃO GERAL DE TODAS AS CONEXÕES */}
            <TabsContent value="overview" className="space-y-4 m-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Card Google Drive */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                        <HardDrive className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">Google Drive</div>
                        <div className="text-xs text-slate-400">
                          PDFs, apostilas, slides e notas
                        </div>
                      </div>
                    </div>
                    <Badge
                      className={
                        getStatus('googledrive') === 'connected'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]'
                          : 'bg-slate-800 text-slate-400 border-slate-700 text-[10px]'
                      }
                    >
                      {getStatus('googledrive') === 'connected' ? 'Conectado' : 'Desconectado'}
                    </Badge>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <ConnectorButton
                      toolkit="googledrive"
                      name="Google Drive"
                      className="[&>button]:bg-amber-600 [&>button]:hover:bg-amber-500 [&>button]:text-white [&>button]:text-xs [&>button]:font-semibold [&>button]:rounded-xl [&>button]:border-none"
                    />
                    {getStatus('googledrive') === 'connected' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveTab('googledrive')}
                        className="text-xs border-slate-700 text-slate-300 hover:text-white"
                      >
                        Buscar Arquivos →
                      </Button>
                    )}
                  </div>
                </div>

                {/* Card Gmail */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-rose-400" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">Gmail</div>
                        <div className="text-xs text-slate-400">
                          E-mails de briefings e orientações
                        </div>
                      </div>
                    </div>
                    <Badge
                      className={
                        getStatus('gmail') === 'connected'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]'
                          : 'bg-slate-800 text-slate-400 border-slate-700 text-[10px]'
                      }
                    >
                      {getStatus('gmail') === 'connected' ? 'Conectado' : 'Desconectado'}
                    </Badge>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <ConnectorButton
                      toolkit="gmail"
                      name="Gmail"
                      className="[&>button]:bg-rose-600 [&>button]:hover:bg-rose-500 [&>button]:text-white [&>button]:text-xs [&>button]:font-semibold [&>button]:rounded-xl [&>button]:border-none"
                    />
                    {getStatus('gmail') === 'connected' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveTab('gmail')}
                        className="text-xs border-slate-700 text-slate-300 hover:text-white"
                      >
                        Ver Mensagens →
                      </Button>
                    )}
                  </div>
                </div>

                {/* Card Google Docs */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">Google Docs</div>
                        <div className="text-xs text-slate-400">
                          Planos de aula, apostilas e roteiros
                        </div>
                      </div>
                    </div>
                    <Badge
                      className={
                        getStatus('googledocs') === 'connected'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]'
                          : 'bg-slate-800 text-slate-400 border-slate-700 text-[10px]'
                      }
                    >
                      {getStatus('googledocs') === 'connected' ? 'Conectado' : 'Desconectado'}
                    </Badge>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <ConnectorButton
                      toolkit="googledocs"
                      name="Google Docs"
                      className="[&>button]:bg-blue-600 [&>button]:hover:bg-blue-500 [&>button]:text-white [&>button]:text-xs [&>button]:font-semibold [&>button]:rounded-xl [&>button]:border-none"
                    />
                    {getStatus('googledocs') === 'connected' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveTab('googledocs')}
                        className="text-xs border-slate-700 text-slate-300 hover:text-white"
                      >
                        Importar Doc →
                      </Button>
                    )}
                  </div>
                </div>

                {/* Card Google Sheets */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">Google Sheets</div>
                        <div className="text-xs text-slate-400">
                          Dados, métricas, cronogramas e turmas
                        </div>
                      </div>
                    </div>
                    <Badge
                      className={
                        getStatus('googlesheets') === 'connected'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]'
                          : 'bg-slate-800 text-slate-400 border-slate-700 text-[10px]'
                      }
                    >
                      {getStatus('googlesheets') === 'connected' ? 'Conectado' : 'Desconectado'}
                    </Badge>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <ConnectorButton
                      toolkit="googlesheets"
                      name="Google Sheets"
                      className="[&>button]:bg-emerald-600 [&>button]:hover:bg-emerald-500 [&>button]:text-white [&>button]:text-xs [&>button]:font-semibold [&>button]:rounded-xl [&>button]:border-none"
                    />
                    {getStatus('googlesheets') === 'connected' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveTab('googlesheets')}
                        className="text-xs border-slate-700 text-slate-300 hover:text-white"
                      >
                        Importar Tabela →
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Dica de Uso */}
              <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-800/40 text-xs text-purple-200/90 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-white">Privacidade e Modo de Conta Pessoal:</span>
                  <p className="leading-relaxed">
                    Cada usuário conecta e autoriza sua própria conta Google de forma independente.
                    O Segundo Cérebro lê somente os itens que você selecionar expressamente para
                    compor o contexto ativo da sua aula ou documento.
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* ABA 2: GOOGLE DRIVE (LISTA E IMPORTAÇÃO) */}
            <TabsContent value="googledrive" className="space-y-4 m-0">
              {getStatus('googledrive') !== 'connected' ? (
                <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-4">
                  <HardDrive className="w-12 h-12 text-amber-400 mx-auto opacity-70" />
                  <div className="max-w-md mx-auto space-y-1">
                    <div className="text-base font-bold text-white">Google Drive não conectado</div>
                    <div className="text-xs text-slate-400">
                      Conecte sua conta do Google Drive para navegar em seus arquivos e inseri-los
                      direto no MagicAuthor.
                    </div>
                  </div>
                  <ConnectorButton
                    toolkit="googledrive"
                    name="Google Drive"
                    className="flex justify-center [&>button]:bg-amber-600 [&>button]:hover:bg-amber-500 [&>button]:text-white [&>button]:text-xs [&>button]:font-bold [&>button]:rounded-xl [&>button]:border-none [&>button]:px-5 [&>button]:py-2.5"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <Input
                        value={driveSearch}
                        onChange={(e) => setDriveSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLoadDriveFiles()}
                        placeholder="Buscar arquivos no seu Drive..."
                        className="pl-9 bg-slate-900 border-slate-800 text-xs text-white rounded-xl"
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={handleLoadDriveFiles}
                      disabled={loadingDrive}
                      className="bg-purple-600 hover:bg-purple-500 text-xs font-semibold rounded-xl"
                    >
                      {loadingDrive ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Buscar'}
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    {loadingDrive && driveFiles.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400">
                        Buscando arquivos no seu Google Drive...
                      </div>
                    ) : driveFiles.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-2xl">
                        Nenhum arquivo encontrado. Tente outra busca ou atualize a lista.
                      </div>
                    ) : (
                      driveFiles.map((file) => (
                        <div
                          key={file.id}
                          className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-3 transition-all"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                              <HardDrive className="w-4 h-4 text-amber-400" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-white truncate">
                                {file.name}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate">
                                {file.mimeType}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {file.webViewLink && (
                              <a
                                href={file.webViewLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-400 hover:text-white p-1"
                                title="Abrir no Google Drive"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <Button
                              size="sm"
                              disabled={importingDriveId === file.id}
                              onClick={() => handleImportDriveFile(file)}
                              className="h-7 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded-lg gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>
                                {importingDriveId === file.id
                                  ? 'Importando...'
                                  : 'Inserir Contexto'}
                              </span>
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ABA 3: GMAIL (LISTA E IMPORTAÇÃO) */}
            <TabsContent value="gmail" className="space-y-4 m-0">
              {getStatus('gmail') !== 'connected' ? (
                <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-4">
                  <Mail className="w-12 h-12 text-rose-400 mx-auto opacity-70" />
                  <div className="max-w-md mx-auto space-y-1">
                    <div className="text-base font-bold text-white">Gmail não conectado</div>
                    <div className="text-xs text-slate-400">
                      Conecte sua conta do Gmail para selecionar e-mails de referência e
                      transformá-los em contexto pedagógico.
                    </div>
                  </div>
                  <ConnectorButton
                    toolkit="gmail"
                    name="Gmail"
                    className="flex justify-center [&>button]:bg-rose-600 [&>button]:hover:bg-rose-500 [&>button]:text-white [&>button]:text-xs [&>button]:font-bold [&>button]:rounded-xl [&>button]:border-none [&>button]:px-5 [&>button]:py-2.5"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <Input
                        value={gmailSearch}
                        onChange={(e) => setGmailSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLoadGmail()}
                        placeholder="Buscar e-mails (ex: assunto, remetente)..."
                        className="pl-9 bg-slate-900 border-slate-800 text-xs text-white rounded-xl"
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={handleLoadGmail}
                      disabled={loadingGmail}
                      className="bg-purple-600 hover:bg-purple-500 text-xs font-semibold rounded-xl"
                    >
                      {loadingGmail ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Buscar'}
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    {loadingGmail && gmailMessages.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400">
                        Carregando mensagens da caixa de entrada...
                      </div>
                    ) : gmailMessages.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-2xl">
                        Nenhuma mensagem encontrada. Atualize ou ajuste sua busca.
                      </div>
                    ) : (
                      gmailMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-3 transition-all"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                              <Mail className="w-4 h-4 text-rose-400" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-white truncate">
                                {msg.subject}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate">
                                {msg.from || msg.snippet}
                              </div>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            disabled={importingGmailId === msg.id}
                            onClick={() => handleImportGmailMsg(msg)}
                            className="h-7 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded-lg gap-1 shrink-0"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>
                              {importingGmailId === msg.id ? 'Importando...' : 'Inserir Contexto'}
                            </span>
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ABA 4: GOOGLE DOCS (IMPORTAÇÃO POR ID / LINK) */}
            <TabsContent value="googledocs" className="space-y-4 m-0">
              {getStatus('googledocs') !== 'connected' ? (
                <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-4">
                  <FileText className="w-12 h-12 text-blue-400 mx-auto opacity-70" />
                  <div className="max-w-md mx-auto space-y-1">
                    <div className="text-base font-bold text-white">Google Docs não conectado</div>
                    <div className="text-xs text-slate-400">
                      Conecte sua conta do Google Docs para importar textos e capítulos completos de
                      documentos.
                    </div>
                  </div>
                  <ConnectorButton
                    toolkit="googledocs"
                    name="Google Docs"
                    className="flex justify-center [&>button]:bg-blue-600 [&>button]:hover:bg-blue-500 [&>button]:text-white [&>button]:text-xs [&>button]:font-bold [&>button]:rounded-xl [&>button]:border-none [&>button]:px-5 [&>button]:py-2.5"
                  />
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-white">Importar Google Doc</div>
                    <div className="text-xs text-slate-400">
                      Cole a URL completa ou o ID do Google Docs que deseja adicionar como contexto
                      ao Segundo Cérebro:
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Input
                      value={docIdInput}
                      onChange={(e) => setDocIdInput(e.target.value)}
                      placeholder="https://docs.google.com/document/d/1abc.../edit ou ID"
                      className="bg-slate-900 border-slate-700 text-xs text-white rounded-xl"
                    />
                    <Button
                      size="sm"
                      onClick={handleImportDocById}
                      disabled={importingDoc || !docIdInput.trim()}
                      className="bg-blue-600 hover:bg-blue-500 text-xs font-bold rounded-xl px-4"
                    >
                      {importingDoc ? 'Lendo Doc...' : 'Importar'}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ABA 5: GOOGLE SHEETS (IMPORTAÇÃO POR ID / LINK) */}
            <TabsContent value="googlesheets" className="space-y-4 m-0">
              {getStatus('googlesheets') !== 'connected' ? (
                <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-4">
                  <FileSpreadsheet className="w-12 h-12 text-emerald-400 mx-auto opacity-70" />
                  <div className="max-w-md mx-auto space-y-1">
                    <div className="text-base font-bold text-white">
                      Google Sheets não conectado
                    </div>
                    <div className="text-xs text-slate-400">
                      Conecte sua conta do Google Sheets para extrair tabelas, grades e cronogramas.
                    </div>
                  </div>
                  <ConnectorButton
                    toolkit="googlesheets"
                    name="Google Sheets"
                    className="flex justify-center [&>button]:bg-emerald-600 [&>button]:hover:bg-emerald-500 [&>button]:text-white [&>button]:text-xs [&>button]:font-bold [&>button]:rounded-xl [&>button]:border-none [&>button]:px-5 [&>button]:py-2.5"
                  />
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-white">Importar Dados de Planilha</div>
                    <div className="text-xs text-slate-400">
                      Cole a URL ou ID da planilha e o intervalo de células desejado:
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <Input
                        value={sheetIdInput}
                        onChange={(e) => setSheetIdInput(e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/1xyz.../edit ou ID"
                        className="bg-slate-900 border-slate-700 text-xs text-white rounded-xl"
                      />
                    </div>
                    <div>
                      <Input
                        value={sheetRangeInput}
                        onChange={(e) => setSheetRangeInput(e.target.value)}
                        placeholder="Ex: A1:Z50"
                        className="bg-slate-900 border-slate-700 text-xs text-white rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={handleImportSheetById}
                      disabled={importingSheet || !sheetIdInput.trim()}
                      className="bg-emerald-600 hover:bg-emerald-500 text-xs font-bold rounded-xl px-4"
                    >
                      {importingSheet ? 'Lendo Planilha...' : 'Importar Linhas como Contexto'}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
export default ConnectorsContextModal
