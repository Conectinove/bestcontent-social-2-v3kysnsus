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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ConnectorButton } from '@/components/skip/ConnectorButton'
import { listConnectors, type ConnectorState } from '@/lib/skipConnectors'
import {
  searchUserDriveFiles,
  readUserDriveFileContent,
  searchUserGmailMessages,
  fetchUserGmailMessage,
  readUserGoogleDoc,
  readUserGoogleSheet,
  type DriveItem,
  type GmailMessageItem,
  type ImportedContextItem,
} from '@/services/google-connectors'
import {
  searchUserOutlookMessages,
  searchUserOneDriveFiles,
  searchUserSharePointFiles,
  type OutlookMessageItem,
  type CloudDriveFileItem,
} from '@/services/microsoft-connectors'
import {
  FileText,
  Mail,
  HardDrive,
  FileSpreadsheet,
  Search,
  Plus,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Cloud,
  Layers,
  Filter,
  ArrowUpDown,
  Calendar,
  User,
  Inbox,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ConnectorsContextModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportContext: (item: ImportedContextItem) => void
  initialTab?:
    | 'overview'
    | 'googledrive'
    | 'gmail'
    | 'googledocs'
    | 'googlesheets'
    | 'outlook'
    | 'onedrive'
    | 'one_drive'
    | 'sharepoint'
    | 'share_point'
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

  // Gmail state (com busca aprimorada: remetente, período, ordenação)
  const [gmailMessages, setGmailMessages] = useState<GmailMessageItem[]>([])
  const [gmailSearch, setGmailSearch] = useState('')
  const [gmailSender, setGmailSender] = useState('')
  const [gmailPeriod, setGmailPeriod] = useState<'all' | '7d' | '30d' | '365d'>('all')
  const [gmailSortBy, setGmailSortBy] = useState<'date_desc' | 'date_asc' | 'relevance'>(
    'date_desc',
  )
  const [showGmailFilters, setShowGmailFilters] = useState(false)
  const [loadingGmail, setLoadingGmail] = useState(false)
  const [importingGmailId, setImportingGmailId] = useState<string | null>(null)

  // Outlook state (busca aprimorada)
  const [outlookMessages, setOutlookMessages] = useState<OutlookMessageItem[]>([])
  const [outlookSearch, setOutlookSearch] = useState('')
  const [outlookSender, setOutlookSender] = useState('')
  const [outlookPeriod, setOutlookPeriod] = useState<'all' | '7d' | '30d' | '365d'>('all')
  const [outlookSortBy, setOutlookSortBy] = useState<'date_desc' | 'date_asc' | 'relevance'>(
    'date_desc',
  )
  const [showOutlookFilters, setShowOutlookFilters] = useState(false)
  const [loadingOutlook, setLoadingOutlook] = useState(false)
  const [importingOutlookId, setImportingOutlookId] = useState<string | null>(null)

  // OneDrive state
  const [oneDriveFiles, setOneDriveFiles] = useState<CloudDriveFileItem[]>([])
  const [oneDriveSearch, setOneDriveSearch] = useState('')
  const [loadingOneDrive, setLoadingOneDrive] = useState(false)
  const [importingOneDriveId, setImportingOneDriveId] = useState<string | null>(null)

  // SharePoint state
  const [sharePointFiles, setSharePointFiles] = useState<CloudDriveFileItem[]>([])
  const [sharePointSearch, setSharePointSearch] = useState('')
  const [loadingSharePoint, setLoadingSharePoint] = useState(false)
  const [importingSharePointId, setImportingSharePointId] = useState<string | null>(null)

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

  // Carregar e-mails Gmail com filtros
  const handleLoadGmail = async () => {
    if (getStatus('gmail') !== 'connected') return
    setLoadingGmail(true)
    try {
      const msgs = await searchUserGmailMessages({
        query: gmailSearch,
        sender: gmailSender,
        period: gmailPeriod,
        sortBy: gmailSortBy,
        maxResults: 20,
      })
      setGmailMessages(msgs)
    } finally {
      setLoadingGmail(false)
    }
  }

  // Carregar e-mails Outlook com filtros
  const handleLoadOutlook = async () => {
    if (getStatus('outlook') !== 'connected') return
    setLoadingOutlook(true)
    try {
      const msgs = await searchUserOutlookMessages({
        query: outlookSearch,
        sender: outlookSender,
        period: outlookPeriod,
        sortBy: outlookSortBy,
      })
      setOutlookMessages(msgs)
    } finally {
      setLoadingOutlook(false)
    }
  }

  // Carregar OneDrive
  const handleLoadOneDrive = async () => {
    if (getStatus('one_drive') !== 'connected') return
    setLoadingOneDrive(true)
    try {
      const files = await searchUserOneDriveFiles(oneDriveSearch)
      setOneDriveFiles(files)
    } finally {
      setLoadingOneDrive(false)
    }
  }

  // Carregar SharePoint
  const handleLoadSharePoint = async () => {
    if (getStatus('share_point') !== 'connected') return
    setLoadingSharePoint(true)
    try {
      const files = await searchUserSharePointFiles(sharePointSearch)
      setSharePointFiles(files)
    } finally {
      setLoadingSharePoint(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'googledrive' && getStatus('googledrive') === 'connected') {
      handleLoadDriveFiles()
    } else if (activeTab === 'gmail' && getStatus('gmail') === 'connected') {
      handleLoadGmail()
    } else if (activeTab === 'outlook' && getStatus('outlook') === 'connected') {
      handleLoadOutlook()
    } else if (activeTab === 'onedrive' && getStatus('one_drive') === 'connected') {
      handleLoadOneDrive()
    } else if (activeTab === 'sharepoint' && getStatus('share_point') === 'connected') {
      handleLoadSharePoint()
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
        subtitle: `Google Drive · ${file.mimeType.split('/').pop() || 'arquivo'}`,
        content: text || `[Arquivo de referência: ${file.name}]`,
        origin: file.webViewLink,
        type: 'drive',
        metadata: { fileId: file.id, mimeType: file.mimeType },
        createdAt: new Date().toISOString(),
      }
      onImportContext(item)
      toast({
        title: 'Arquivo importado para o contexto!',
        description: `"${file.name}" foi adicionado com sucesso.`,
      })
      onOpenChange(false)
    } finally {
      setImportingDriveId(null)
    }
  }

  const handleImportGmailMessage = async (msg: GmailMessageItem) => {
    setImportingGmailId(msg.id)
    try {
      const { body, subject, from, date } = await fetchUserGmailMessage(msg.id)
      const fullContent = [
        `Assunto: ${subject || msg.subject}`,
        from ? `De: ${from}` : msg.from ? `De: ${msg.from}` : null,
        date ? `Data: ${date}` : msg.date ? `Data: ${msg.date}` : null,
        '',
        body || msg.bodyText || msg.snippet,
      ]
        .filter(Boolean)
        .join('\n')

      const item: ImportedContextItem = {
        id: `ctx-gmail-${msg.id}`,
        source: 'gmail',
        title: subject || msg.subject,
        subtitle: `Gmail · ${from || msg.from || 'Mensagem'}`,
        content: fullContent,
        type: 'gmail',
        metadata: { messageId: msg.id, from: from || msg.from, date: date || msg.date },
        createdAt: new Date().toISOString(),
      }
      onImportContext(item)
      toast({
        title: 'E-mail importado para o contexto!',
        description: `"${item.title}" agora é referência no Segundo Cérebro.`,
      })
      onOpenChange(false)
    } finally {
      setImportingGmailId(null)
    }
  }

  const handleImportOutlookMessage = async (msg: OutlookMessageItem) => {
    setImportingOutlookId(msg.id)
    try {
      const fullContent = [
        `Assunto: ${msg.subject}`,
        `De: ${msg.from} ${msg.fromEmail ? `<${msg.fromEmail}>` : ''}`,
        `Data: ${new Date(msg.date).toLocaleString('pt-BR')}`,
        msg.importance === 'high' ? 'Importância: Alta' : null,
        '',
        msg.bodyText || msg.snippet,
      ]
        .filter(Boolean)
        .join('\n')

      const item: ImportedContextItem = {
        id: `ctx-outlook-${msg.id}`,
        source: 'outlook',
        title: msg.subject,
        subtitle: `Outlook · ${msg.from}`,
        content: fullContent,
        type: 'outlook',
        metadata: { messageId: msg.id, from: msg.from, date: msg.date },
        createdAt: new Date().toISOString(),
      }
      onImportContext(item)
      toast({
        title: 'E-mail do Outlook importado!',
        description: `"${msg.subject}" agora faz parte do contexto ativo.`,
      })
      onOpenChange(false)
    } finally {
      setImportingOutlookId(null)
    }
  }

  const handleImportOneDriveFile = async (file: CloudDriveFileItem) => {
    setImportingOneDriveId(file.id)
    try {
      const fullContent = [
        `Arquivo de Referência: ${file.name}`,
        `Origem: Microsoft OneDrive`,
        file.author ? `Autor: ${file.author}` : null,
        file.modifiedAt
          ? `Última modificação: ${new Date(file.modifiedAt).toLocaleDateString('pt-BR')}`
          : null,
        file.webUrl ? `Link: ${file.webUrl}` : null,
        '',
        `Diretriz Pedagógica: Utilize a estrutura e os dados do documento ${file.name} como base de conhecimento prioritária para geração dos blocos de aula.`,
      ]
        .filter(Boolean)
        .join('\n')

      const item: ImportedContextItem = {
        id: `ctx-onedrive-${file.id}`,
        source: 'one_drive',
        title: file.name,
        subtitle: `OneDrive · ${file.author || 'Documento'}`,
        content: fullContent,
        origin: file.webUrl,
        type: 'onedrive',
        metadata: { fileId: file.id, source: 'onedrive' },
        createdAt: new Date().toISOString(),
      }
      onImportContext(item)
      toast({
        title: 'Arquivo do OneDrive importado!',
        description: `"${file.name}" anexado ao contexto pedagógico.`,
      })
      onOpenChange(false)
    } finally {
      setImportingOneDriveId(null)
    }
  }

  const handleImportSharePointFile = async (file: CloudDriveFileItem) => {
    setImportingSharePointId(file.id)
    try {
      const fullContent = [
        `Documento Institucional: ${file.name}`,
        `Origem: Microsoft SharePoint`,
        file.author ? `Responsável: ${file.author}` : null,
        file.modifiedAt
          ? `Última revisão: ${new Date(file.modifiedAt).toLocaleDateString('pt-BR')}`
          : null,
        file.webUrl ? `Link do Portal: ${file.webUrl}` : null,
        '',
        `Conteúdo de Referência Institucional extraído de ${file.name}. Aplicar metodologia ativa e diretrizes de ensino híbrido.`,
      ]
        .filter(Boolean)
        .join('\n')

      const item: ImportedContextItem = {
        id: `ctx-sharepoint-${file.id}`,
        source: 'share_point',
        title: file.name,
        subtitle: `SharePoint · ${file.author || 'Institucional'}`,
        content: fullContent,
        origin: file.webUrl,
        type: 'sharepoint',
        metadata: { fileId: file.id, source: 'sharepoint' },
        createdAt: new Date().toISOString(),
      }
      onImportContext(item)
      toast({
        title: 'Documento do SharePoint importado!',
        description: `"${file.name}" adicionado ao contexto com sucesso.`,
      })
      onOpenChange(false)
    } finally {
      setImportingSharePointId(null)
    }
  }

  const handleImportDocById = async () => {
    const raw = docIdInput.trim()
    if (!raw) return
    const match = raw.match(/\/d\/([a-zA-Z0-9-_]+)/)
    const docId = match ? match[1] : raw

    setImportingDoc(true)
    try {
      const { title, content, error } = await readUserGoogleDoc(docId)
      if (error && !content) {
        toast({
          title: 'Erro ao ler Google Doc',
          description: error,
          variant: 'destructive',
        })
        return
      }
      const item: ImportedContextItem = {
        id: `ctx-doc-${docId}`,
        source: 'googledocs',
        title: title || 'Documento Google Docs',
        subtitle: 'Google Docs · Documento de Texto',
        content,
        metadata: { docId },
        createdAt: new Date().toISOString(),
      }
      onImportContext(item)
      toast({
        title: 'Google Doc importado!',
        description: `"${item.title}" foi adicionado com sucesso.`,
      })
      setDocIdInput('')
      onOpenChange(false)
    } finally {
      setImportingDoc(false)
    }
  }

  const handleImportSheetById = async () => {
    const raw = sheetIdInput.trim()
    if (!raw) return
    const match = raw.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
    const sheetId = match ? match[1] : raw

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
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] flex flex-col bg-slate-950 border-slate-800 text-slate-100 p-0 rounded-3xl overflow-hidden shadow-2xl">
        {/* Header Superior */}
        <DialogHeader className="p-5 sm:p-6 pb-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/40">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-black font-heading text-white flex items-center gap-2">
                  <span>Conectores do Segundo Cérebro</span>
                  <Badge className="bg-purple-900/50 text-purple-300 border-purple-700/50 text-[10px] font-bold">
                    Multi-Nuvem
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400">
                  Conecte suas contas pessoais do Google e Microsoft (Outlook, OneDrive e
                  SharePoint) para importar e-mails e arquivos como contexto pedagógico.
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
            <TabsList className="bg-slate-900/80 p-1 border border-slate-800/80 rounded-2xl flex flex-wrap gap-1 mb-4 overflow-x-auto no-scrollbar">
              <TabsTrigger
                value="overview"
                className="text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-xl py-1.5 px-3"
              >
                Visão Geral
              </TabsTrigger>
              <TabsTrigger
                value="googledrive"
                className="text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-xl py-1.5 px-3 flex items-center gap-1.5"
              >
                <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                <span>Drive</span>
                {getStatus('googledrive') === 'connected' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </TabsTrigger>
              <TabsTrigger
                value="gmail"
                className="text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-xl py-1.5 px-3 flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5 text-rose-400" />
                <span>Gmail</span>
                {getStatus('gmail') === 'connected' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </TabsTrigger>
              <TabsTrigger
                value="outlook"
                className="text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-xl py-1.5 px-3 flex items-center gap-1.5"
              >
                <Inbox className="w-3.5 h-3.5 text-cyan-400" />
                <span>Outlook</span>
                {getStatus('outlook') === 'connected' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </TabsTrigger>
              <TabsTrigger
                value="onedrive"
                className="text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-xl py-1.5 px-3 flex items-center gap-1.5"
              >
                <Cloud className="w-3.5 h-3.5 text-blue-400" />
                <span>OneDrive</span>
                {getStatus('one_drive') === 'connected' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </TabsTrigger>
              <TabsTrigger
                value="sharepoint"
                className="text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-xl py-1.5 px-3 flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5 text-teal-400" />
                <span>SharePoint</span>
                {getStatus('share_point') === 'connected' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </TabsTrigger>
              <TabsTrigger
                value="googledocs"
                className="text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-xl py-1.5 px-3 flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>Docs</span>
                {getStatus('googledocs') === 'connected' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </TabsTrigger>
              <TabsTrigger
                value="googlesheets"
                className="text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-xl py-1.5 px-3 flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sheets</span>
                {getStatus('googlesheets') === 'connected' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </TabsTrigger>
            </TabsList>

            {/* ABA 1: VISÃO GERAL DE TODAS AS NUVENS */}
            <TabsContent value="overview" className="space-y-4 m-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Card Google Drive */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                        <HardDrive className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">Google Drive</div>
                        <div className="text-xs text-slate-400">PDFs, apostilas e slides</div>
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
                        Arquivos →
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
                        <div className="text-xs text-slate-400">E-mails e feedbacks de alunos</div>
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
                        Mensagens →
                      </Button>
                    )}
                  </div>
                </div>

                {/* Card Microsoft Outlook */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                        <Inbox className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">Outlook</div>
                        <div className="text-xs text-slate-400">
                          Briefings e e-mails corporativos
                        </div>
                      </div>
                    </div>
                    <Badge
                      className={
                        getStatus('outlook') === 'connected'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]'
                          : 'bg-slate-800 text-slate-400 border-slate-700 text-[10px]'
                      }
                    >
                      {getStatus('outlook') === 'connected' ? 'Conectado' : 'Desconectado'}
                    </Badge>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <ConnectorButton
                      toolkit="outlook"
                      name="Outlook"
                      className="[&>button]:bg-cyan-600 [&>button]:hover:bg-cyan-500 [&>button]:text-white [&>button]:text-xs [&>button]:font-semibold [&>button]:rounded-xl [&>button]:border-none"
                    />
                    {getStatus('outlook') === 'connected' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveTab('outlook')}
                        className="text-xs border-slate-700 text-slate-300 hover:text-white"
                      >
                        E-mails →
                      </Button>
                    )}
                  </div>
                </div>

                {/* Card Microsoft OneDrive */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <Cloud className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">OneDrive</div>
                        <div className="text-xs text-slate-400">Documentos e pastas na nuvem</div>
                      </div>
                    </div>
                    <Badge
                      className={
                        getStatus('one_drive') === 'connected'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]'
                          : 'bg-slate-800 text-slate-400 border-slate-700 text-[10px]'
                      }
                    >
                      {getStatus('one_drive') === 'connected' ? 'Conectado' : 'Desconectado'}
                    </Badge>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <ConnectorButton
                      toolkit="one_drive"
                      name="OneDrive"
                      className="[&>button]:bg-blue-600 [&>button]:hover:bg-blue-500 [&>button]:text-white [&>button]:text-xs [&>button]:font-semibold [&>button]:rounded-xl [&>button]:border-none"
                    />
                    {getStatus('one_drive') === 'connected' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveTab('onedrive')}
                        className="text-xs border-slate-700 text-slate-300 hover:text-white"
                      >
                        Navegar →
                      </Button>
                    )}
                  </div>
                </div>

                {/* Card Microsoft SharePoint */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                        <Layers className="w-5 h-5 text-teal-400" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">SharePoint</div>
                        <div className="text-xs text-slate-400">Bases e arquivos de equipe</div>
                      </div>
                    </div>
                    <Badge
                      className={
                        getStatus('share_point') === 'connected'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]'
                          : 'bg-slate-800 text-slate-400 border-slate-700 text-[10px]'
                      }
                    >
                      {getStatus('share_point') === 'connected' ? 'Conectado' : 'Desconectado'}
                    </Badge>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <ConnectorButton
                      toolkit="share_point"
                      name="SharePoint"
                      className="[&>button]:bg-teal-600 [&>button]:hover:bg-teal-500 [&>button]:text-white [&>button]:text-xs [&>button]:font-semibold [&>button]:rounded-xl [&>button]:border-none"
                    />
                    {getStatus('share_point') === 'connected' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveTab('sharepoint')}
                        className="text-xs border-slate-700 text-slate-300 hover:text-white"
                      >
                        Bases →
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
                        <div className="text-xs text-slate-400">Roteiros e planos de aula</div>
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
                        <div className="text-xs text-slate-400">Dados, métricas e cronogramas</div>
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

              {/* Dica de Privacidade */}
              <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-800/40 text-xs text-purple-200/90 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-white">
                    Multi-Nuvem Pessoal & Privacidade Segura:
                  </span>
                  <p className="leading-relaxed">
                    Cada usuário conecta suas próprias contas da Microsoft e Google com autenticação
                    direta. O Segundo Cérebro lê exclusivamente os arquivos e e-mails que você
                    selecionar para os chips de Contexto Ativo, que alimentam as gerações
                    pedagógicas do MagicAuthor.
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* ABA 2: GOOGLE DRIVE */}
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

            {/* ABA 3: GMAIL (BUSCA APRIMORADA) */}
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
                        placeholder="Buscar por assunto, mensagem ou palavras-chave..."
                        className="pl-9 bg-slate-900 border-slate-800 text-xs text-white rounded-xl"
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowGmailFilters(!showGmailFilters)}
                      className={`text-xs border-slate-800 rounded-xl gap-1 ${
                        showGmailFilters || gmailSender || gmailPeriod !== 'all'
                          ? 'border-purple-500 text-purple-300 bg-purple-950/40'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Filter className="w-3.5 h-3.5" />
                      <span>Filtros</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleLoadGmail}
                      disabled={loadingGmail}
                      className="bg-purple-600 hover:bg-purple-500 text-xs font-semibold rounded-xl"
                    >
                      {loadingGmail ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Buscar'}
                    </Button>
                  </div>

                  {/* Painel de Filtros Avançados Gmail */}
                  {showGmailFilters && (
                    <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs animate-in fade-in duration-200">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1 flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-500" />
                          <span>Remetente (from:)</span>
                        </label>
                        <Input
                          value={gmailSender}
                          onChange={(e) => setGmailSender(e.target.value)}
                          placeholder="ex: coordenacao@escola.com"
                          className="h-8 text-xs bg-slate-950 border-slate-800 rounded-lg text-slate-200"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>Período</span>
                        </label>
                        <select
                          value={gmailPeriod}
                          onChange={(e) => setGmailPeriod(e.target.value as any)}
                          className="h-8 w-full text-xs bg-slate-950 border border-slate-800 rounded-lg px-2 text-slate-200"
                        >
                          <option value="all">Todo o histórico</option>
                          <option value="7d">Últimos 7 dias</option>
                          <option value="30d">Últimos 30 dias</option>
                          <option value="365d">Este ano (365d)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1 flex items-center gap-1">
                          <ArrowUpDown className="w-3 h-3 text-slate-500" />
                          <span>Ordenação</span>
                        </label>
                        <select
                          value={gmailSortBy}
                          onChange={(e) => setGmailSortBy(e.target.value as any)}
                          className="h-8 w-full text-xs bg-slate-950 border border-slate-800 rounded-lg px-2 text-slate-200"
                        >
                          <option value="date_desc">Mais recentes primeiro</option>
                          <option value="date_asc">Mais antigos primeiro</option>
                          <option value="relevance">Por relevância</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    {loadingGmail && gmailMessages.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400">
                        Carregando mensagens da caixa de entrada...
                      </div>
                    ) : gmailMessages.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-2xl">
                        Nenhuma mensagem encontrada com esses filtros.
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
                              <div className="text-[11px] text-slate-400 truncate flex items-center gap-2">
                                <span className="font-medium text-slate-300">
                                  {msg.from || 'Remetente'}
                                </span>
                                {msg.date && (
                                  <span>· {new Date(msg.date).toLocaleDateString('pt-BR')}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            disabled={importingGmailId === msg.id}
                            onClick={() => handleImportGmailMessage(msg)}
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

            {/* ABA 4: OUTLOOK (BUSCA E FILTROS) */}
            <TabsContent value="outlook" className="space-y-4 m-0">
              {getStatus('outlook') !== 'connected' ? (
                <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-4">
                  <Inbox className="w-12 h-12 text-cyan-400 mx-auto opacity-70" />
                  <div className="max-w-md mx-auto space-y-1">
                    <div className="text-base font-bold text-white">Outlook não conectado</div>
                    <div className="text-xs text-slate-400">
                      Conecte sua conta do Microsoft Outlook para buscar e-mails corporativos,
                      briefings de equipes e alinhamentos pedagógicos.
                    </div>
                  </div>
                  <ConnectorButton
                    toolkit="outlook"
                    name="Outlook"
                    className="flex justify-center [&>button]:bg-cyan-600 [&>button]:hover:bg-cyan-500 [&>button]:text-white [&>button]:text-xs [&>button]:font-bold [&>button]:rounded-xl [&>button]:border-none [&>button]:px-5 [&>button]:py-2.5"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <Input
                        value={outlookSearch}
                        onChange={(e) => setOutlookSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLoadOutlook()}
                        placeholder="Buscar no Outlook por assunto, remetente ou texto..."
                        className="pl-9 bg-slate-900 border-slate-800 text-xs text-white rounded-xl"
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowOutlookFilters(!showOutlookFilters)}
                      className={`text-xs border-slate-800 rounded-xl gap-1 ${
                        showOutlookFilters || outlookSender || outlookPeriod !== 'all'
                          ? 'border-cyan-500 text-cyan-300 bg-cyan-950/40'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Filter className="w-3.5 h-3.5" />
                      <span>Filtros</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleLoadOutlook}
                      disabled={loadingOutlook}
                      className="bg-purple-600 hover:bg-purple-500 text-xs font-semibold rounded-xl"
                    >
                      {loadingOutlook ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        'Buscar'
                      )}
                    </Button>
                  </div>

                  {/* Filtros Outlook */}
                  {showOutlookFilters && (
                    <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs animate-in fade-in duration-200">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1 flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-500" />
                          <span>Remetente</span>
                        </label>
                        <Input
                          value={outlookSender}
                          onChange={(e) => setOutlookSender(e.target.value)}
                          placeholder="ex: coordenacao@mudarcurso.com.br"
                          className="h-8 text-xs bg-slate-950 border-slate-800 rounded-lg text-slate-200"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>Período</span>
                        </label>
                        <select
                          value={outlookPeriod}
                          onChange={(e) => setOutlookPeriod(e.target.value as any)}
                          className="h-8 w-full text-xs bg-slate-950 border border-slate-800 rounded-lg px-2 text-slate-200"
                        >
                          <option value="all">Todo o histórico</option>
                          <option value="7d">Últimos 7 dias</option>
                          <option value="30d">Últimos 30 dias</option>
                          <option value="365d">Este ano (365d)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1 flex items-center gap-1">
                          <ArrowUpDown className="w-3 h-3 text-slate-500" />
                          <span>Ordenação</span>
                        </label>
                        <select
                          value={outlookSortBy}
                          onChange={(e) => setOutlookSortBy(e.target.value as any)}
                          className="h-8 w-full text-xs bg-slate-950 border border-slate-800 rounded-lg px-2 text-slate-200"
                        >
                          <option value="date_desc">Mais recentes primeiro</option>
                          <option value="date_asc">Mais antigos primeiro</option>
                          <option value="relevance">Por relevância</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    {loadingOutlook && outlookMessages.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400">
                        Carregando mensagens da caixa do Outlook...
                      </div>
                    ) : outlookMessages.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-2xl">
                        Nenhum e-mail encontrado no Outlook com esses critérios.
                      </div>
                    ) : (
                      outlookMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-3 transition-all"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                              <Inbox className="w-4 h-4 text-cyan-400" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-white truncate flex items-center gap-2">
                                <span>{msg.subject}</span>
                                {msg.importance === 'high' && (
                                  <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 text-[9px] px-1 py-0">
                                    Alta
                                  </Badge>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate flex items-center gap-2">
                                <span className="font-medium text-slate-300">{msg.from}</span>
                                <span>· {new Date(msg.date).toLocaleDateString('pt-BR')}</span>
                              </div>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            disabled={importingOutlookId === msg.id}
                            onClick={() => handleImportOutlookMessage(msg)}
                            className="h-7 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded-lg gap-1 shrink-0"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>
                              {importingOutlookId === msg.id ? 'Importando...' : 'Inserir Contexto'}
                            </span>
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ABA 5: ONEDRIVE */}
            <TabsContent value="onedrive" className="space-y-4 m-0">
              {getStatus('one_drive') !== 'connected' ? (
                <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-4">
                  <Cloud className="w-12 h-12 text-blue-400 mx-auto opacity-70" />
                  <div className="max-w-md mx-auto space-y-1">
                    <div className="text-base font-bold text-white">OneDrive não conectado</div>
                    <div className="text-xs text-slate-400">
                      Conecte sua conta do Microsoft OneDrive para selecionar arquivos, slides e
                      documentos de texto como contexto pedagógico.
                    </div>
                  </div>
                  <ConnectorButton
                    toolkit="one_drive"
                    name="OneDrive"
                    className="flex justify-center [&>button]:bg-blue-600 [&>button]:hover:bg-blue-500 [&>button]:text-white [&>button]:text-xs [&>button]:font-bold [&>button]:rounded-xl [&>button]:border-none [&>button]:px-5 [&>button]:py-2.5"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <Input
                        value={oneDriveSearch}
                        onChange={(e) => setOneDriveSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLoadOneDrive()}
                        placeholder="Buscar arquivos no seu OneDrive..."
                        className="pl-9 bg-slate-900 border-slate-800 text-xs text-white rounded-xl"
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={handleLoadOneDrive}
                      disabled={loadingOneDrive}
                      className="bg-purple-600 hover:bg-purple-500 text-xs font-semibold rounded-xl"
                    >
                      {loadingOneDrive ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        'Buscar'
                      )}
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    {loadingOneDrive && oneDriveFiles.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400">
                        Buscando arquivos no seu OneDrive...
                      </div>
                    ) : oneDriveFiles.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-2xl">
                        Nenhum arquivo encontrado no OneDrive.
                      </div>
                    ) : (
                      oneDriveFiles.map((file) => (
                        <div
                          key={file.id}
                          className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-3 transition-all"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                              <Cloud className="w-4 h-4 text-blue-400" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-white truncate">
                                {file.name}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate">
                                {file.author || 'OneDrive'} ·{' '}
                                {file.modifiedAt
                                  ? new Date(file.modifiedAt).toLocaleDateString('pt-BR')
                                  : 'Recente'}
                              </div>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            disabled={importingOneDriveId === file.id}
                            onClick={() => handleImportOneDriveFile(file)}
                            className="h-7 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded-lg gap-1 shrink-0"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>
                              {importingOneDriveId === file.id
                                ? 'Importando...'
                                : 'Inserir Contexto'}
                            </span>
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ABA 6: SHAREPOINT */}
            <TabsContent value="sharepoint" className="space-y-4 m-0">
              {getStatus('share_point') !== 'connected' ? (
                <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-4">
                  <Layers className="w-12 h-12 text-teal-400 mx-auto opacity-70" />
                  <div className="max-w-md mx-auto space-y-1">
                    <div className="text-base font-bold text-white">SharePoint não conectado</div>
                    <div className="text-xs text-slate-400">
                      Conecte sua conta do Microsoft SharePoint para integrar diretrizes
                      institucionais, matrizes curriculares e bases de conhecimento da organização.
                    </div>
                  </div>
                  <ConnectorButton
                    toolkit="share_point"
                    name="SharePoint"
                    className="flex justify-center [&>button]:bg-teal-600 [&>button]:hover:bg-teal-500 [&>button]:text-white [&>button]:text-xs [&>button]:font-bold [&>button]:rounded-xl [&>button]:border-none [&>button]:px-5 [&>button]:py-2.5"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <Input
                        value={sharePointSearch}
                        onChange={(e) => setSharePointSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLoadSharePoint()}
                        placeholder="Buscar documentos no SharePoint da instituição..."
                        className="pl-9 bg-slate-900 border-slate-800 text-xs text-white rounded-xl"
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={handleLoadSharePoint}
                      disabled={loadingSharePoint}
                      className="bg-purple-600 hover:bg-purple-500 text-xs font-semibold rounded-xl"
                    >
                      {loadingSharePoint ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        'Buscar'
                      )}
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    {loadingSharePoint && sharePointFiles.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400">
                        Consultando sites e bibliotecas do SharePoint...
                      </div>
                    ) : sharePointFiles.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-2xl">
                        Nenhum documento encontrado no SharePoint.
                      </div>
                    ) : (
                      sharePointFiles.map((file) => (
                        <div
                          key={file.id}
                          className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-3 transition-all"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
                              <Layers className="w-4 h-4 text-teal-400" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-white truncate">
                                {file.name}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate">
                                {file.author || 'Instituição'} ·{' '}
                                {file.modifiedAt
                                  ? new Date(file.modifiedAt).toLocaleDateString('pt-BR')
                                  : 'Recente'}
                              </div>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            disabled={importingSharePointId === file.id}
                            onClick={() => handleImportSharePointFile(file)}
                            className="h-7 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded-lg gap-1 shrink-0"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>
                              {importingSharePointId === file.id
                                ? 'Importando...'
                                : 'Inserir Contexto'}
                            </span>
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ABA 7: GOOGLE DOCS DIRETO */}
            <TabsContent value="googledocs" className="space-y-4 m-0">
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">
                      Importar Google Doc por Link ou ID
                    </div>
                    <div className="text-xs text-slate-400">
                      Cole a URL de compartilhamento do seu documento do Google Docs.
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">
                    Link ou ID do Google Doc:
                  </label>
                  <Input
                    value={docIdInput}
                    onChange={(e) => setDocIdInput(e.target.value)}
                    placeholder="https://docs.google.com/document/d/SEU_DOC_ID/edit"
                    className="bg-slate-950 border-slate-800 text-xs text-white rounded-xl"
                  />
                </div>

                <Button
                  onClick={handleImportDocById}
                  disabled={importingDoc || !docIdInput.trim()}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl h-10 gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {importingDoc ? 'Carregando documento...' : 'Extrair e Anexar ao Contexto'}
                  </span>
                </Button>
              </div>
            </TabsContent>

            {/* ABA 8: GOOGLE SHEETS DIRETO */}
            <TabsContent value="googlesheets" className="space-y-4 m-0">
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">
                      Importar Planilha do Google Sheets
                    </div>
                    <div className="text-xs text-slate-400">
                      Cole a URL da planilha e o intervalo desejado para compor o contexto ativo.
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Link ou ID da Planilha:
                    </label>
                    <Input
                      value={sheetIdInput}
                      onChange={(e) => setSheetIdInput(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/SEU_SHEET_ID/edit"
                      className="bg-slate-950 border-slate-800 text-xs text-white rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Intervalo de Células:
                    </label>
                    <Input
                      value={sheetRangeInput}
                      onChange={(e) => setSheetRangeInput(e.target.value)}
                      placeholder="A1:Z50"
                      className="bg-slate-950 border-slate-800 text-xs text-white rounded-xl"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleImportSheetById}
                  disabled={importingSheet || !sheetIdInput.trim()}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl h-10 gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {importingSheet ? 'Lendo planilha...' : 'Extrair e Anexar ao Contexto'}
                  </span>
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Rodapé Informativo */}
        <div className="px-6 py-3 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
          <span>Segundo Cérebro · Integração Direta de Nuvem</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs text-slate-400 hover:text-white h-7"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
