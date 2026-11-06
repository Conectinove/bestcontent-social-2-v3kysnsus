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
import { fetchPipedriveData, fetchHubspotData, type CrmRecordItem } from '@/services/crm-connectors'
import { fetchCanvaAssets, type CanvaAssetItem } from '@/services/canva-connectors'
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
  Briefcase,
  Users as UsersIcon,
  Palette,
  DollarSign,
  Tag,
  ImageIcon,
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
    | 'pipedrive'
    | 'hubspot'
    | 'canva'
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

  // Pipedrive state
  const [pipedriveDeals, setPipedriveDeals] = useState<CrmRecordItem[]>([])
  const [pipedriveContacts, setPipedriveContacts] = useState<CrmRecordItem[]>([])
  const [pipedriveActivities, setPipedriveActivities] = useState<CrmRecordItem[]>([])
  const [pipedriveFilter, setPipedriveFilter] = useState<'all' | 'deal' | 'contact' | 'activity'>(
    'all',
  )
  const [pipedriveSearch, setPipedriveSearch] = useState('')
  const [loadingPipedrive, setLoadingPipedrive] = useState(false)
  const [importingPipedriveId, setImportingPipedriveId] = useState<string | null>(null)

  // HubSpot state
  const [hubspotDeals, setHubspotDeals] = useState<CrmRecordItem[]>([])
  const [hubspotContacts, setHubspotContacts] = useState<CrmRecordItem[]>([])
  const [hubspotFilter, setHubspotFilter] = useState<'all' | 'deal' | 'contact'>('all')
  const [hubspotSearch, setHubspotSearch] = useState('')
  const [loadingHubspot, setLoadingHubspot] = useState(false)
  const [importingHubspotId, setImportingHubspotId] = useState<string | null>(null)

  // Canva state
  const [canvaDesigns, setCanvaDesigns] = useState<CanvaAssetItem[]>([])
  const [canvaSearch, setCanvaSearch] = useState('')
  const [loadingCanva, setLoadingCanva] = useState(false)
  const [importingCanvaId, setImportingCanvaId] = useState<string | null>(null)

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

  // Carregar dados Pipedrive
  const handleLoadPipedrive = async () => {
    if (getStatus('pipedrive') !== 'connected') return
    setLoadingPipedrive(true)
    try {
      const res = await fetchPipedriveData(pipedriveSearch)
      setPipedriveDeals(res.deals || [])
      setPipedriveContacts(res.contacts || [])
      setPipedriveActivities(res.activities || [])
    } finally {
      setLoadingPipedrive(false)
    }
  }

  // Carregar dados HubSpot
  const handleLoadHubspot = async () => {
    if (getStatus('hubspot') !== 'connected') return
    setLoadingHubspot(true)
    try {
      const res = await fetchHubspotData(hubspotSearch)
      setHubspotDeals(res.deals || [])
      setHubspotContacts(res.contacts || [])
    } finally {
      setLoadingHubspot(false)
    }
  }

  // Carregar designs Canva
  const handleLoadCanva = async () => {
    if (getStatus('canva') !== 'connected') return
    setLoadingCanva(true)
    try {
      const res = await fetchCanvaAssets(canvaSearch)
      setCanvaDesigns(res.designs || [])
    } finally {
      setLoadingCanva(false)
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
    } else if (activeTab === 'pipedrive' && getStatus('pipedrive') === 'connected') {
      handleLoadPipedrive()
    } else if (activeTab === 'hubspot' && getStatus('hubspot') === 'connected') {
      handleLoadHubspot()
    } else if (activeTab === 'canva' && getStatus('canva') === 'connected') {
      handleLoadCanva()
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
        type: 'docs',
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
        type: 'sheets',
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

  // Importação de Pipedrive
  const handleImportPipedriveItem = (item: CrmRecordItem) => {
    setImportingPipedriveId(item.id)
    try {
      const typeLabel =
        item.type === 'deal' ? 'Negócio' : item.type === 'contact' ? 'Contato/Pessoa' : 'Atividade'
      const lines = [
        `Fonte: Pipedrive CRM (${typeLabel})`,
        `Título: ${item.title}`,
        item.subtitle ? `Subtítulo / Organização: ${item.subtitle}` : null,
        item.status ? `Status: ${item.status}` : null,
        item.value ? `Valor: ${item.value}` : null,
        item.owner ? `Responsável: ${item.owner}` : null,
        item.updatedAt ? `Última atualização: ${item.updatedAt}` : null,
      ]
        .filter(Boolean)
        .join('\n')

      const ctx: ImportedContextItem = {
        id: `ctx-pipedrive-${item.id}`,
        source: 'pipedrive',
        title: item.title,
        subtitle: `Pipedrive · ${typeLabel}${item.value ? ` · ${item.value}` : ''}`,
        content: lines,
        type: 'pipedrive',
        metadata: {
          crmId: item.id,
          crmType: item.type,
          status: item.status,
          value: item.value,
          owner: item.owner,
        },
        createdAt: new Date().toISOString(),
      }
      onImportContext(ctx)
      toast({
        title: 'Item do Pipedrive importado!',
        description: `"${item.title}" adicionado como contexto ativo do CRM.`,
      })
      onOpenChange(false)
    } finally {
      setImportingPipedriveId(null)
    }
  }

  // Importação de HubSpot
  const handleImportHubspotItem = (item: CrmRecordItem) => {
    setImportingHubspotId(item.id)
    try {
      const typeLabel = item.type === 'deal' ? 'Negócio' : 'Contato'
      const lines = [
        `Fonte: HubSpot CRM (${typeLabel})`,
        `Nome / Título: ${item.title}`,
        item.subtitle ? `Detalhes / Pipeline: ${item.subtitle}` : null,
        item.status ? `Fase do Ciclo de Vida: ${item.status}` : null,
        item.value ? `Valor: ${item.value}` : null,
        item.updatedAt ? `Atualizado: ${item.updatedAt}` : null,
      ]
        .filter(Boolean)
        .join('\n')

      const ctx: ImportedContextItem = {
        id: `ctx-hubspot-${item.id}`,
        source: 'hubspot',
        title: item.title,
        subtitle: `HubSpot · ${typeLabel}${item.value ? ` · ${item.value}` : ''}`,
        content: lines,
        type: 'hubspot',
        metadata: {
          crmId: item.id,
          crmType: item.type,
          status: item.status,
          value: item.value,
        },
        createdAt: new Date().toISOString(),
      }
      onImportContext(ctx)
      toast({
        title: 'Item do HubSpot importado!',
        description: `"${item.title}" adicionado como contexto ativo do CRM.`,
      })
      onOpenChange(false)
    } finally {
      setImportingHubspotId(null)
    }
  }

  // Importação de Canva
  const handleImportCanvaDesign = (design: CanvaAssetItem) => {
    setImportingCanvaId(design.id)
    try {
      const lines = [
        `Fonte: Canva Design Studio`,
        `Título: ${design.title}`,
        design.editUrl ? `Link de Edição Canva: ${design.editUrl}` : null,
        design.thumbnailUrl ? `Miniatura/Asset: ${design.thumbnailUrl}` : null,
        design.updatedAt ? `Última modificação: ${design.updatedAt}` : null,
        '',
        `Design visual importado da biblioteca Canva do usuário para apoiar criação de posts, carrosséis e banners.`,
      ]
        .filter(Boolean)
        .join('\n')

      const ctx: ImportedContextItem = {
        id: `ctx-canva-${design.id}`,
        source: 'canva',
        title: design.title,
        subtitle: `Canva Design · ${design.updatedAt || 'Recente'}`,
        content: lines,
        origin: design.editUrl,
        imageUrl: design.thumbnailUrl,
        type: 'canva',
        metadata: {
          canvaId: design.id,
          editUrl: design.editUrl,
          thumbnailUrl: design.thumbnailUrl,
        },
        createdAt: new Date().toISOString(),
      }
      onImportContext(ctx)
      toast({
        title: 'Design Canva importado!',
        description: `"${design.title}" agora faz parte do contexto ativo.`,
      })
      onOpenChange(false)
    } finally {
      setImportingCanvaId(null)
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
                  Conecte suas contas pessoais do Google, Microsoft (Outlook, OneDrive, SharePoint),
                  CRMs (Pipedrive, HubSpot) e Canva para importar contexto ativo direto nas suas
                  notas e IA.
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
              <TabsTrigger
                value="pipedrive"
                className="text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-xl py-1.5 px-3 flex items-center gap-1.5"
              >
                <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pipedrive</span>
                {getStatus('pipedrive') === 'connected' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </TabsTrigger>
              <TabsTrigger
                value="hubspot"
                className="text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-xl py-1.5 px-3 flex items-center gap-1.5"
              >
                <UsersIcon className="w-3.5 h-3.5 text-orange-400" />
                <span>HubSpot</span>
                {getStatus('hubspot') === 'connected' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </TabsTrigger>
              <TabsTrigger
                value="canva"
                className="text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-xl py-1.5 px-3 flex items-center gap-1.5"
              >
                <Palette className="w-3.5 h-3.5 text-cyan-400" />
                <span>Canva</span>
                {getStatus('canva') === 'connected' && (
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

                {/* Card Pipedrive CRM */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">Pipedrive CRM</div>
                        <div className="text-xs text-slate-400">Negócios, pessoas e atividades</div>
                      </div>
                    </div>
                    <Badge
                      className={
                        getStatus('pipedrive') === 'connected'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]'
                          : 'bg-slate-800 text-slate-400 border-slate-700 text-[10px]'
                      }
                    >
                      {getStatus('pipedrive') === 'connected' ? 'Conectado' : 'Desconectado'}
                    </Badge>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <ConnectorButton
                      toolkit="pipedrive"
                      name="Pipedrive"
                      className="[&>button]:bg-emerald-600 [&>button]:hover:bg-emerald-500 [&>button]:text-white [&>button]:text-xs [&>button]:font-semibold [&>button]:rounded-xl [&>button]:border-none"
                    />
                    {getStatus('pipedrive') === 'connected' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveTab('pipedrive')}
                        className="text-xs border-slate-700 text-slate-300 hover:text-white"
                      >
                        Ver Negócios →
                      </Button>
                    )}
                  </div>
                </div>

                {/* Card HubSpot CRM */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                        <UsersIcon className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">HubSpot CRM</div>
                        <div className="text-xs text-slate-400">Contatos, leads e pipeline</div>
                      </div>
                    </div>
                    <Badge
                      className={
                        getStatus('hubspot') === 'connected'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]'
                          : 'bg-slate-800 text-slate-400 border-slate-700 text-[10px]'
                      }
                    >
                      {getStatus('hubspot') === 'connected' ? 'Conectado' : 'Desconectado'}
                    </Badge>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <ConnectorButton
                      toolkit="hubspot"
                      name="HubSpot"
                      className="[&>button]:bg-orange-600 [&>button]:hover:bg-orange-500 [&>button]:text-white [&>button]:text-xs [&>button]:font-semibold [&>button]:rounded-xl [&>button]:border-none"
                    />
                    {getStatus('hubspot') === 'connected' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveTab('hubspot')}
                        className="text-xs border-slate-700 text-slate-300 hover:text-white"
                      >
                        Ver Contatos →
                      </Button>
                    )}
                  </div>
                </div>

                {/* Card Canva */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                        <Palette className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">Canva</div>
                        <div className="text-xs text-slate-400">Designs, artes e carrosséis</div>
                      </div>
                    </div>
                    <Badge
                      className={
                        getStatus('canva') === 'connected'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]'
                          : 'bg-slate-800 text-slate-400 border-slate-700 text-[10px]'
                      }
                    >
                      {getStatus('canva') === 'connected' ? 'Conectado' : 'Desconectado'}
                    </Badge>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <ConnectorButton
                      toolkit="canva"
                      name="Canva"
                      className="[&>button]:bg-cyan-600 [&>button]:hover:bg-cyan-500 [&>button]:text-white [&>button]:text-xs [&>button]:font-semibold [&>button]:rounded-xl [&>button]:border-none"
                    />
                    {getStatus('canva') === 'connected' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveTab('canva')}
                        className="text-xs border-slate-700 text-slate-300 hover:text-white"
                      >
                        Ver Designs →
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

            {/* ABA: PIPEDRIVE CRM */}
            <TabsContent value="pipedrive" className="space-y-4 m-0">
              {getStatus('pipedrive') !== 'connected' ? (
                <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-4">
                  <Briefcase className="w-12 h-12 text-emerald-400 mx-auto opacity-70" />
                  <div className="max-w-md mx-auto space-y-1">
                    <div className="text-base font-bold text-white">Pipedrive não conectado</div>
                    <div className="text-xs text-slate-400">
                      Conecte sua conta do Pipedrive para carregar negócios, contatos e atividades
                      para o Segundo Cérebro.
                    </div>
                  </div>
                  <ConnectorButton
                    toolkit="pipedrive"
                    name="Pipedrive"
                    className="flex justify-center [&>button]:bg-emerald-600 [&>button]:hover:bg-emerald-500 [&>button]:text-white [&>button]:text-xs [&>button]:font-bold [&>button]:rounded-xl [&>button]:border-none [&>button]:px-5 [&>button]:py-2.5"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                      <Button
                        size="sm"
                        variant={pipedriveFilter === 'all' ? 'secondary' : 'ghost'}
                        onClick={() => setPipedriveFilter('all')}
                        className="text-xs h-7 px-2.5 rounded-lg"
                      >
                        Tudo (
                        {pipedriveDeals.length +
                          pipedriveContacts.length +
                          pipedriveActivities.length}
                        )
                      </Button>
                      <Button
                        size="sm"
                        variant={pipedriveFilter === 'deal' ? 'secondary' : 'ghost'}
                        onClick={() => setPipedriveFilter('deal')}
                        className="text-xs h-7 px-2.5 rounded-lg"
                      >
                        Negócios ({pipedriveDeals.length})
                      </Button>
                      <Button
                        size="sm"
                        variant={pipedriveFilter === 'contact' ? 'secondary' : 'ghost'}
                        onClick={() => setPipedriveFilter('contact')}
                        className="text-xs h-7 px-2.5 rounded-lg"
                      >
                        Contatos ({pipedriveContacts.length})
                      </Button>
                      <Button
                        size="sm"
                        variant={pipedriveFilter === 'activity' ? 'secondary' : 'ghost'}
                        onClick={() => setPipedriveFilter('activity')}
                        className="text-xs h-7 px-2.5 rounded-lg"
                      >
                        Atividades ({pipedriveActivities.length})
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleLoadPipedrive}
                        disabled={loadingPipedrive}
                        className="border-slate-800 text-xs text-slate-300 hover:text-white rounded-xl h-8"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 mr-1.5 ${loadingPipedrive ? 'animate-spin' : ''}`}
                        />
                        Atualizar
                      </Button>
                      <ConnectorButton
                        toolkit="pipedrive"
                        name="Pipedrive"
                        className="[&>button]:bg-slate-800 [&>button]:hover:bg-slate-700 [&>button]:text-slate-300 [&>button]:text-xs [&>button]:rounded-xl [&>button]:border-slate-700 [&>button]:h-8"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <Input
                        value={pipedriveSearch}
                        onChange={(e) => setPipedriveSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLoadPipedrive()}
                        placeholder="Buscar por termo ou nome no CRM..."
                        className="pl-9 bg-slate-900 border-slate-800 text-xs text-white rounded-xl"
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={handleLoadPipedrive}
                      disabled={loadingPipedrive}
                      className="bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold rounded-xl"
                    >
                      {loadingPipedrive ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        'Buscar'
                      )}
                    </Button>
                  </div>

                  {/* Lista de Registros */}
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {loadingPipedrive && (
                      <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                        Carregando registros do Pipedrive...
                      </div>
                    )}

                    {!loadingPipedrive &&
                      (() => {
                        const allItems: CrmRecordItem[] = [
                          ...(pipedriveFilter === 'all' || pipedriveFilter === 'deal'
                            ? pipedriveDeals
                            : []),
                          ...(pipedriveFilter === 'all' || pipedriveFilter === 'contact'
                            ? pipedriveContacts
                            : []),
                          ...(pipedriveFilter === 'all' || pipedriveFilter === 'activity'
                            ? pipedriveActivities
                            : []),
                        ]

                        if (allItems.length === 0) {
                          return (
                            <div className="p-8 rounded-2xl bg-slate-900/30 border border-slate-800/80 text-center space-y-2">
                              <Briefcase className="w-8 h-8 text-slate-500 mx-auto" />
                              <div className="text-xs text-slate-400">
                                Nenhum registro do Pipedrive encontrado para este filtro.
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleLoadPipedrive}
                                className="text-xs border-slate-700 text-slate-300"
                              >
                                Sincronizar CRM Agora
                              </Button>
                            </div>
                          )
                        }

                        return allItems.map((item) => (
                          <div
                            key={item.id}
                            className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 flex items-center justify-between gap-3 group transition-all"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                  item.type === 'deal'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : item.type === 'contact'
                                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }`}
                              >
                                {item.type === 'deal' ? (
                                  <Briefcase className="w-4 h-4" />
                                ) : (
                                  <UsersIcon className="w-4 h-4" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-semibold text-white truncate flex items-center gap-2">
                                  <span>{item.title}</span>
                                  {item.value && (
                                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[9px] py-0 px-1.5 font-bold">
                                      {item.value}
                                    </Badge>
                                  )}
                                  {item.status && (
                                    <Badge className="bg-slate-800 text-slate-300 border-slate-700 text-[9px] py-0 px-1.5 font-medium">
                                      {item.status}
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 truncate">
                                  {item.subtitle || `Pipedrive · ${item.type}`}
                                  {item.owner && ` · Resp: ${item.owner}`}
                                </div>
                              </div>
                            </div>

                            <Button
                              size="sm"
                              onClick={() => handleImportPipedriveItem(item)}
                              disabled={importingPipedriveId === item.id}
                              className="shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-7 px-3 rounded-lg font-medium"
                            >
                              {importingPipedriveId === item.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5 mr-1" />
                                  Usar no Contexto
                                </>
                              )}
                            </Button>
                          </div>
                        ))
                      })()}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ABA: HUBSPOT CRM */}
            <TabsContent value="hubspot" className="space-y-4 m-0">
              {getStatus('hubspot') !== 'connected' ? (
                <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-4">
                  <UsersIcon className="w-12 h-12 text-orange-400 mx-auto opacity-70" />
                  <div className="max-w-md mx-auto space-y-1">
                    <div className="text-base font-bold text-white">HubSpot não conectado</div>
                    <div className="text-xs text-slate-400">
                      Conecte sua conta do HubSpot para importar contatos, negócios e pipelines
                      diretamente no Segundo Cérebro.
                    </div>
                  </div>
                  <ConnectorButton
                    toolkit="hubspot"
                    name="HubSpot"
                    className="flex justify-center [&>button]:bg-orange-600 [&>button]:hover:bg-orange-500 [&>button]:text-white [&>button]:text-xs [&>button]:font-bold [&>button]:rounded-xl [&>button]:border-none [&>button]:px-5 [&>button]:py-2.5"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                      <Button
                        size="sm"
                        variant={hubspotFilter === 'all' ? 'secondary' : 'ghost'}
                        onClick={() => setHubspotFilter('all')}
                        className="text-xs h-7 px-2.5 rounded-lg"
                      >
                        Tudo ({hubspotDeals.length + hubspotContacts.length})
                      </Button>
                      <Button
                        size="sm"
                        variant={hubspotFilter === 'deal' ? 'secondary' : 'ghost'}
                        onClick={() => setHubspotFilter('deal')}
                        className="text-xs h-7 px-2.5 rounded-lg"
                      >
                        Negócios ({hubspotDeals.length})
                      </Button>
                      <Button
                        size="sm"
                        variant={hubspotFilter === 'contact' ? 'secondary' : 'ghost'}
                        onClick={() => setHubspotFilter('contact')}
                        className="text-xs h-7 px-2.5 rounded-lg"
                      >
                        Contatos ({hubspotContacts.length})
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleLoadHubspot}
                        disabled={loadingHubspot}
                        className="border-slate-800 text-xs text-slate-300 hover:text-white rounded-xl h-8"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 mr-1.5 ${loadingHubspot ? 'animate-spin' : ''}`}
                        />
                        Atualizar
                      </Button>
                      <ConnectorButton
                        toolkit="hubspot"
                        name="HubSpot"
                        className="[&>button]:bg-slate-800 [&>button]:hover:bg-slate-700 [&>button]:text-slate-300 [&>button]:text-xs [&>button]:rounded-xl [&>button]:border-slate-700 [&>button]:h-8"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <Input
                        value={hubspotSearch}
                        onChange={(e) => setHubspotSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLoadHubspot()}
                        placeholder="Buscar contatos ou deals no HubSpot..."
                        className="pl-9 bg-slate-900 border-slate-800 text-xs text-white rounded-xl"
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={handleLoadHubspot}
                      disabled={loadingHubspot}
                      className="bg-orange-600 hover:bg-orange-500 text-xs font-semibold rounded-xl"
                    >
                      {loadingHubspot ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        'Buscar'
                      )}
                    </Button>
                  </div>

                  {/* Lista de Registros HubSpot */}
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {loadingHubspot && (
                      <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-orange-400" />
                        Carregando registros do HubSpot...
                      </div>
                    )}

                    {!loadingHubspot &&
                      (() => {
                        const allItems: CrmRecordItem[] = [
                          ...(hubspotFilter === 'all' || hubspotFilter === 'deal'
                            ? hubspotDeals
                            : []),
                          ...(hubspotFilter === 'all' || hubspotFilter === 'contact'
                            ? hubspotContacts
                            : []),
                        ]

                        if (allItems.length === 0) {
                          return (
                            <div className="p-8 rounded-2xl bg-slate-900/30 border border-slate-800/80 text-center space-y-2">
                              <UsersIcon className="w-8 h-8 text-slate-500 mx-auto" />
                              <div className="text-xs text-slate-400">
                                Nenhum registro do HubSpot encontrado.
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleLoadHubspot}
                                className="text-xs border-slate-700 text-slate-300"
                              >
                                Sincronizar HubSpot
                              </Button>
                            </div>
                          )
                        }

                        return allItems.map((item) => (
                          <div
                            key={item.id}
                            className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 flex items-center justify-between gap-3 group transition-all"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                  item.type === 'deal'
                                    ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }`}
                              >
                                {item.type === 'deal' ? (
                                  <Briefcase className="w-4 h-4" />
                                ) : (
                                  <UsersIcon className="w-4 h-4" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-semibold text-white truncate flex items-center gap-2">
                                  <span>{item.title}</span>
                                  {item.value && (
                                    <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-[9px] py-0 px-1.5 font-bold">
                                      {item.value}
                                    </Badge>
                                  )}
                                  {item.status && (
                                    <Badge className="bg-slate-800 text-slate-300 border-slate-700 text-[9px] py-0 px-1.5 font-medium">
                                      {item.status}
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 truncate">
                                  {item.subtitle || `HubSpot · ${item.type}`}
                                </div>
                              </div>
                            </div>

                            <Button
                              size="sm"
                              onClick={() => handleImportHubspotItem(item)}
                              disabled={importingHubspotId === item.id}
                              className="shrink-0 bg-orange-600 hover:bg-orange-500 text-white text-xs h-7 px-3 rounded-lg font-medium"
                            >
                              {importingHubspotId === item.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5 mr-1" />
                                  Usar no Contexto
                                </>
                              )}
                            </Button>
                          </div>
                        ))
                      })()}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ABA: CANVA DESIGNS */}
            <TabsContent value="canva" className="space-y-4 m-0">
              {getStatus('canva') !== 'connected' ? (
                <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-4">
                  <Palette className="w-12 h-12 text-cyan-400 mx-auto opacity-70" />
                  <div className="max-w-md mx-auto space-y-1">
                    <div className="text-base font-bold text-white">Canva não conectado</div>
                    <div className="text-xs text-slate-400">
                      Conecte sua conta pessoal do Canva para listar e importar seus designs, posts
                      e carrosséis direto para o Segundo Cérebro.
                    </div>
                  </div>
                  <ConnectorButton
                    toolkit="canva"
                    name="Canva"
                    className="flex justify-center [&>button]:bg-cyan-600 [&>button]:hover:bg-cyan-500 [&>button]:text-white [&>button]:text-xs [&>button]:font-bold [&>button]:rounded-xl [&>button]:border-none [&>button]:px-5 [&>button]:py-2.5"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-xs">
                        {canvaDesigns.length} designs disponíveis
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleLoadCanva}
                        disabled={loadingCanva}
                        className="border-slate-800 text-xs text-slate-300 hover:text-white rounded-xl h-8"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 mr-1.5 ${loadingCanva ? 'animate-spin' : ''}`}
                        />
                        Atualizar
                      </Button>
                      <ConnectorButton
                        toolkit="canva"
                        name="Canva"
                        className="[&>button]:bg-slate-800 [&>button]:hover:bg-slate-700 [&>button]:text-slate-300 [&>button]:text-xs [&>button]:rounded-xl [&>button]:border-slate-700 [&>button]:h-8"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <Input
                        value={canvaSearch}
                        onChange={(e) => setCanvaSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLoadCanva()}
                        placeholder="Buscar designs por título no Canva..."
                        className="pl-9 bg-slate-900 border-slate-800 text-xs text-white rounded-xl"
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={handleLoadCanva}
                      disabled={loadingCanva}
                      className="bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold rounded-xl"
                    >
                      {loadingCanva ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Buscar'}
                    </Button>
                  </div>

                  {/* Grid de Designs Canva */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                    {loadingCanva && (
                      <div className="col-span-full p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                        Carregando seus designs do Canva...
                      </div>
                    )}

                    {!loadingCanva && canvaDesigns.length === 0 && (
                      <div className="col-span-full p-8 rounded-2xl bg-slate-900/30 border border-slate-800/80 text-center space-y-2">
                        <Palette className="w-8 h-8 text-slate-500 mx-auto" />
                        <div className="text-xs text-slate-400">
                          Nenhum design encontrado no seu Canva.
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleLoadCanva}
                          className="text-xs border-slate-700 text-slate-300"
                        >
                          Recarregar Biblioteca
                        </Button>
                      </div>
                    )}

                    {!loadingCanva &&
                      canvaDesigns.map((design) => (
                        <div
                          key={design.id}
                          className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 flex flex-col justify-between gap-3 group transition-all"
                        >
                          <div className="space-y-2">
                            {design.thumbnailUrl ? (
                              <div className="w-full h-28 rounded-xl bg-slate-950 overflow-hidden relative border border-slate-800/60">
                                <img
                                  src={design.thumbnailUrl}
                                  alt={design.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              </div>
                            ) : (
                              <div className="w-full h-28 rounded-xl bg-cyan-950/20 border border-cyan-800/30 flex items-center justify-center">
                                <Palette className="w-8 h-8 text-cyan-400/60" />
                              </div>
                            )}

                            <div>
                              <div className="text-xs font-semibold text-white truncate">
                                {design.title}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate">
                                {design.updatedAt || 'Design recente'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                            {design.editUrl && (
                              <a
                                href={design.editUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                              >
                                Abrir no Canva ↗
                              </a>
                            )}
                            <Button
                              size="sm"
                              onClick={() => handleImportCanvaDesign(design)}
                              disabled={importingCanvaId === design.id}
                              className="ml-auto bg-cyan-600 hover:bg-cyan-500 text-white text-xs h-7 px-3 rounded-lg font-medium"
                            >
                              {importingCanvaId === design.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5 mr-1" />
                                  Importar
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
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
