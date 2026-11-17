import { useCallback, useEffect, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Download,
  Loader2,
  Mail,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Send,
  Share2,
  Trash2,
  Globe,
  Wand2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { ConnectorButton } from '@/components/skip/ConnectorButton'
import { listConnectors, execute } from '@/lib/skipConnectors'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import {
  applyTemplateVariables,
  deleteLabsEmailTemplate,
  extractTemplateVariables,
  listLabsEmailTemplates,
  saveLabsEmailTemplate,
  type LabsEmailTemplate,
} from '@/services/labs-email-templates'
import { generateLabsEmailDraft } from '@/services/labs-ai'
import { LabsAiGeneratorDialog } from '@/components/labs/LabsAiGeneratorDialog'

// =========================================================================
// ABA EMAIL — Compositor + envio real pelo Gmail conectado do usuário
// =========================================================================
// A decisão da casa (v0.0.158) é conectores no modo "conta de cada usuário":
// o email parte do Gmail DO usuário logado via conector — nunca da conta do
// builder, sem OAuth hand-rolled, sem $http, sem secrets.
// Ferramenta usada: GMAIL_SEND_EMAIL (slug confirmado via find_app_connector_tools).
// Templates customizáveis persistidos em labs_email_templates (migration 0126),
// com variáveis de substituição {{nome}}, {{empresa}} etc.
// =========================================================================

const VARIABLE_HINTS: Array<{ key: string; label: string }> = [
  { key: '{{nome}}', label: 'Nome' },
  { key: '{{empresa}}', label: 'Empresa' },
  { key: '{{assunto}}', label: 'Assunto' },
  { key: '{{data}}', label: 'Data' },
]

interface StarterTemplate {
  name: string
  description: string
  subject: string
  html: string
}

/** Modelos de partida — copiamos para o compositor; o usuário salva como template próprio. */
const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    name: 'Newsletter',
    description: 'Layout limpo de boletim com destaque editorial',
    subject: 'Sua newsletter semanal',
    html: `<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:32px;">
  <h1 style="font-size:22px;color:#111;">Sua newsletter semanal</h1>
  <p style="color:#444;line-height:1.6;">Escreva aqui o conteúdo principal...</p>
  <hr style="border:none;border-top:1px solid #ddd;" />
  <p style="font-size:11px;color:#999;">Enviado via MidiaViva Labs</p>
</div>`,
  },
  {
    name: 'Promocional',
    description: 'Chamada direta com botão de ação em destaque',
    subject: 'Oferta especial para você',
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;text-align:center;">
  <h1 style="font-size:24px;color:#111;">Oferta especial</h1>
  <p style="color:#444;">Válido por tempo limitado...</p>
  <a href="#" style="display:inline-block;padding:12px 24px;background:#111;color:#fff;border-radius:8px;text-decoration:none;">Quero aproveitar</a>
</div>`,
  },
  {
    name: 'Transacional',
    description: 'Mensagem objetiva de confirmação/aviso',
    subject: 'Confirmação de ação',
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;">
  <h2 style="color:#111;">Ação confirmada</h2>
  <p style="color:#444;line-height:1.6;">Detalhes da transação aqui...</p>
</div>`,
  },
  {
    name: 'Convite',
    description: 'Convite de evento com data e CTA',
    subject: 'Você está convidado',
    html: `<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px;text-align:center;border:1px solid #eee;border-radius:12px;">
  <p style="letter-spacing:2px;font-size:11px;color:#999;">VOCÊ ESTÁ CONVIDADO</p>
  <h1 style="font-size:20px;color:#111;">Nome do evento</h1>
  <p style="color:#555;">Data &middot; hora &middot; local</p>
</div>`,
  },
]

export function LabsEmailTab() {
  const { toast } = useToast()
  const { user } = useAuth()

  const [subject, setSubject] = useState('')
  const [to, setTo] = useState('')
  const [html, setHtml] = useState(STARTER_TEMPLATES[0].html)
  const [activeTemplate, setActiveTemplate] = useState<string>('')
  const [sending, setSending] = useState(false)
  const [gmailConnected, setGmailConnected] = useState(false)
  const [checkingConnection, setCheckingConnection] = useState(true)

  // Templates personalizados (persistidos no banco)
  const [templates, setTemplates] = useState<LabsEmailTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [templatesError, setTemplatesError] = useState(false)
  const [showVars, setShowVars] = useState(false)
  const [vars, setVars] = useState<Record<string, string>>({})

  // Dialog salvar/editar template
  const [saveOpen, setSaveOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [tplName, setTplName] = useState('')
  const [tplDescription, setTplDescription] = useState('')
  const [savingTpl, setSavingTpl] = useState(false)

  // Geração com IA (studio-agent)
  const [aiOpen, setAiOpen] = useState(false)

  const checkConnection = useCallback(async () => {
    try {
      const connectors = await listConnectors()
      setGmailConnected(connectors.some((c) => c.toolkit === 'gmail' && c.status === 'connected'))
    } catch {
      setGmailConnected(false)
    }
    setCheckingConnection(false)
  }, [])

  const loadTemplates = useCallback(async () => {
    if (!user) {
      setLoadingTemplates(false)
      return
    }
    try {
      setTemplates(await listLabsEmailTemplates(user.id))
      setTemplatesError(false)
    } catch (err) {
      // Erro visível: o usuário vê o que aconteceu e pode tentar de novo
      console.error('Erro ao carregar templates de email:', err)
      setTemplates([])
      setTemplatesError(true)
    } finally {
      setLoadingTemplates(false)
    }
  }, [user])

  useEffect(() => {
    checkConnection()
    loadTemplates()
    // Re-checa quando o usuário volta do fluxo de conexão (aba ganha foco)
    const onVisible = () => {
      if (document.visibilityState === 'visible') checkConnection()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [checkConnection, loadTemplates])

  // ----------------------- Templates personalizados -----------------------

  const openSaveDialog = (tpl?: LabsEmailTemplate) => {
    if (tpl) {
      setEditingId(tpl.id)
      setTplName(tpl.name)
      setTplDescription(tpl.description)
    } else {
      setEditingId(null)
      setTplName('')
      setTplDescription('')
    }
    setSaveOpen(true)
  }

  const handleSaveTemplate = async () => {
    if (!user) return
    if (!tplName.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Dê um nome ao template.',
        variant: 'destructive',
      })
      return
    }
    setSavingTpl(true)
    try {
      const saved = await saveLabsEmailTemplate({
        id: editingId || undefined,
        user: user.id,
        name: tplName,
        description: tplDescription,
        subject: subject,
        html: html,
      })
      toast({
        title: editingId ? 'Template atualizado' : 'Template salvo',
        description: `"${saved.name}" ${editingId ? 'atualizado' : 'criado'} com sucesso.`,
      })
      setSaveOpen(false)
      setActiveTemplate(saved.id)
      loadTemplates()
    } catch {
      toast({
        title: 'Falha ao salvar template',
        description: 'Não foi possível gravar o template. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSavingTpl(false)
    }
  }

  const handleApplyTemplate = (tpl: LabsEmailTemplate) => {
    setActiveTemplate(tpl.id)
    setSubject(tpl.subject)
    setHtml(tpl.html)
    toast({ title: 'Template aplicado', description: `"${tpl.name}" carregado no compositor.` })
  }

  const handleDeleteTemplate = async (tpl: LabsEmailTemplate) => {
    try {
      await deleteLabsEmailTemplate(tpl.id)
      if (activeTemplate === tpl.id) setActiveTemplate('')
      toast({ title: 'Template excluído', description: `"${tpl.name}" foi removido.` })
      loadTemplates()
    } catch {
      toast({
        title: 'Falha ao excluir',
        description: 'Não foi possível remover o template.',
        variant: 'destructive',
      })
    }
  }

  const handleStarter = (tpl: StarterTemplate) => {
    setActiveTemplate('')
    setSubject(tpl.subject)
    setHtml(tpl.html)
    toast({
      title: 'Modelo carregado',
      description: `Modelo "${tpl.name}" no compositor — salve-o para personalizá-lo.`,
    })
  }

  // ----------------------- Variáveis -----------------------

  const usedVars = extractTemplateVariables(subject, html)
  const varNames =
    usedVars.length > 0 ? usedVars : VARIABLE_HINTS.map((v) => v.key.replace(/[{}]/g, ''))

  const setVar = (name: string, value: string) => setVars((prev) => ({ ...prev, [name]: value }))

  const handleApplyVars = () => {
    setSubject(applyTemplateVariables(subject, vars))
    setHtml(applyTemplateVariables(html, vars))
    toast({
      title: 'Variáveis aplicadas',
      description: 'Os placeholders {{...}} foram substituídos no compositor.',
    })
  }

  const insertVar = (token: string) => {
    setHtml((prev) => `${prev}\n${token}`)
  }

  // ----------------------- Envio -----------------------

  const validate = (): string | null => {
    if (!to.trim()) return 'Informe o destinatário no campo "Para".'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.trim()))
      return 'O endereço no campo "Para" não é um email válido.'
    if (!subject.trim()) return 'Informe o assunto do email.'
    if (!html.trim()) return 'O corpo do email está vazio.'
    return null
  }

  const handleSend = async () => {
    const error = validate()
    if (error) {
      toast({ title: 'Não foi possível enviar', description: error, variant: 'destructive' })
      return
    }

    setSending(true)
    try {
      const result = await execute('GMAIL_SEND_EMAIL', {
        recipient_email: to.trim(),
        subject: subject.trim(),
        body: html,
        is_html: true,
      })
      if (!result.successful) {
        throw new Error(
          result.error || 'O Gmail rejeitou o envio. Verifique a conexão do conector.',
        )
      }
      toast({
        title: 'Email enviado',
        description: `Mensagem enviada para ${to.trim()} pela sua conta Gmail.`,
      })
    } catch (err) {
      toast({
        title: 'Falha no envio',
        description:
          err instanceof Error
            ? err.message
            : 'Não foi possível enviar pelo Gmail. Verifique a conexão do conector.',
        variant: 'destructive',
      })
    } finally {
      setSending(false)
    }
  }

  /** Gera assunto + corpo via studio-agent e preenche o compositor (usuário edita antes de enviar). */
  const handleAiGenerate = async (briefing: string) => {
    const generated = await generateLabsEmailDraft(briefing)
    setSubject(generated.subject)
    setHtml(generated.body_html)
    setActiveTemplate('')
    toast({ title: 'Email gerado!', description: 'Revise o assunto e o corpo antes de enviar.' })
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(html)
    toast({
      title: 'HTML copiado',
      description: 'O código do email está na área de transferência.',
    })
  }

  const handleDownload = () => {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `email-${activeTemplate || 'compositor'}-${Date.now()}.html`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: 'Arquivo baixado', description: 'O HTML do email foi baixado.' })
  }

  const renderVarName = (name: string) => name.replace(/[{}]/g, '').trim()

  return (
    <div className="space-y-6">
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Compositor de Email</h3>
          <Badge variant="outline" className="text-[9px] font-bold uppercase">
            Labs
          </Badge>
        </div>

        {/* Conexão Gmail — modo conta de cada usuário */}
        {!checkingConnection && !gmailConnected && (
          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-2 flex-1">
                <p className="text-xs font-semibold text-foreground">
                  Conecte seu Gmail para enviar
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  O email sai pela SUA conta Gmail conectada — nada é enviado por contas da
                  plataforma. Conecte abaixo para liberar o botão de envio.
                </p>
                <ConnectorButton toolkit="gmail" name="Gmail" />
              </div>
            </div>
          </div>
        )}
        {!checkingConnection && gmailConnected && (
          <div className="flex items-center gap-2 text-[11px] text-emerald-600">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Gmail conectado{user?.email ? ` (${user.email})` : ''} — os envios partem da sua conta.
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="email-to" className="text-xs font-semibold">
              Para
            </Label>
            <Input
              id="email-to"
              type="email"
              placeholder="destinatario@exemplo.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="text-xs rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email-subject" className="text-xs font-semibold">
              Assunto
            </Label>
            <Input
              id="email-subject"
              placeholder="Assunto do email"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="text-xs rounded-xl"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <Label htmlFor="email-html" className="text-xs font-semibold">
              Corpo (HTML)
            </Label>
            <button
              type="button"
              onClick={() => setShowVars((v) => !v)}
              className="text-[11px] font-bold text-primary hover:underline"
            >
              {showVars ? 'Ocultar variáveis' : 'Variáveis {{...}}'}
            </button>
          </div>

          {showVars && (
            <div className="p-3 rounded-xl border border-border/80 bg-muted/30 space-y-2">
              <p className="text-[11px] text-muted-foreground">
                Placeholders encontrados no assunto/corpo. Preencha e aplique para substituir.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {varNames.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => insertVar(`{{${renderVarName(name)}}}`)}
                    className="px-2 py-0.5 rounded-full border border-primary/40 text-[10px] font-bold text-primary hover:bg-primary/10"
                  >
                    + {`{{${renderVarName(name)}}}`}
                  </button>
                ))}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {varNames.map((name) => {
                  const clean = renderVarName(name)
                  return (
                    <div key={clean} className="space-y-0.5">
                      <Label
                        htmlFor={`var-${clean}`}
                        className="text-[10px] font-bold uppercase text-muted-foreground"
                      >
                        {clean}
                      </Label>
                      <Input
                        id={`var-${clean}`}
                        value={vars[clean] || ''}
                        onChange={(e) => setVar(clean, e.target.value)}
                        placeholder={`Valor de ${clean}`}
                        className="text-xs rounded-xl"
                      />
                    </div>
                  )
                })}
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleApplyVars}
                className="rounded-xl text-xs font-bold"
              >
                Aplicar variáveis
              </Button>
            </div>
          )}

          <textarea
            id="email-html"
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            rows={10}
            className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y"
            placeholder="<h1>Olá {{nome}}!</h1><p>Escreva seu HTML...</p>"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleSend}
            disabled={sending || !gmailConnected}
            className="rounded-xl text-xs font-bold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {sending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            {sending ? 'Enviando…' : 'Enviar por email'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => openSaveDialog()}
            className="rounded-xl text-xs font-bold gap-1.5"
          >
            <Save className="w-3.5 h-3.5" /> Salvar como template
          </Button>
          {activeTemplate && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => openSaveDialog(templates.find((t) => t.id === activeTemplate))}
              className="rounded-xl text-xs font-bold gap-1.5"
            >
              <Pencil className="w-3.5 h-3.5" /> Atualizar template
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="rounded-xl text-xs font-bold gap-1.5"
          >
            <Copy className="w-3.5 h-3.5" /> Copiar HTML
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setAiOpen(true)}
            className="rounded-xl text-xs font-bold gap-1.5"
          >
            <Wand2 className="w-3.5 h-3.5" /> Gerar com IA
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleDownload}
            className="rounded-xl text-xs font-bold gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Baixar HTML
          </Button>
        </div>

        {/* Geração por IA (studio-agent) */}
        <LabsAiGeneratorDialog
          open={aiOpen}
          onOpenChange={setAiOpen}
          title="Gerar email com IA"
          description="Descreva o objetivo do email — a IA cria o assunto e o corpo em HTML que entram no compositor para você revisar e editar."
          placeholder="Ex.: anunciando 30% de desconto no plano anual, válido até sexta-feira"
          generatingLabel="Gerando email…"
          onGenerate={handleAiGenerate}
        />
      </Card>

      {/* Meus templates (persistidos) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Meus templates
          </h4>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => openSaveDialog()}
            className="h-7 text-[11px] gap-1"
          >
            <Plus className="w-3 h-3" /> Novo
          </Button>
        </div>
        {loadingTemplates ? (
          <Card className="p-6 flex items-center justify-center">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </Card>
        ) : templatesError ? (
          <Card className="p-6 flex flex-col items-center justify-center gap-2 text-center border-destructive/30 bg-destructive/5">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <p className="text-xs font-semibold text-foreground">Falha ao carregar templates</p>
            <p className="text-[11px] text-muted-foreground">
              Não foi possível buscar seus templates salvos.
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void loadTemplates()}
              className="rounded-xl text-xs font-bold gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Tentar novamente
            </Button>
          </Card>
        ) : templates.length === 0 ? (
          <Card className="p-6 text-center space-y-1">
            <p className="text-xs font-semibold text-foreground">Nenhum template salvo</p>
            <p className="text-[11px] text-muted-foreground">
              Monte o email no compositor e clique em "Salvar como template" — ele fica disponível
              aqui para reutilizar.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {templates.map((tpl) => (
              <Card
                key={tpl.id}
                className={cn(
                  'p-4 space-y-1.5 transition-all duration-200 hover:shadow-md hover:border-primary/50',
                  activeTemplate === tpl.id && 'border-primary/60 bg-primary/5',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <h5 className="text-xs font-bold text-foreground truncate">{tpl.name}</h5>
                    {tpl.description && (
                      <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                        {tpl.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      title="Editar metadados"
                      onClick={() => openSaveDialog(tpl)}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      title="Excluir template"
                      onClick={() => handleDeleteTemplate(tpl)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full rounded-xl text-[11px] font-bold"
                  onClick={() => handleApplyTemplate(tpl)}
                >
                  Aplicar no compositor
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modelos de partida */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Modelos de partida
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {STARTER_TEMPLATES.map((tpl) => (
            <Card
              key={tpl.name}
              onClick={() => handleStarter(tpl)}
              className="p-4 space-y-1.5 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50"
            >
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <h5 className="text-xs font-bold text-foreground">{tpl.name}</h5>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{tpl.description}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Preview do email */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Share2 className="w-4 h-4 text-muted-foreground" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Pré-visualização
          </h4>
          <Globe className="w-3.5 h-3.5 text-muted-foreground/60" />
        </div>
        <div className="rounded-xl border border-border/80 bg-white p-4 overflow-auto max-h-96">
          <div
            className="text-sm text-gray-900"
            // Preview fiel do HTML que será enviado
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
        {subject && (
          <p className="text-[11px] text-muted-foreground">
            <span className="font-semibold text-foreground">Assunto:</span> {subject}
          </p>
        )}
      </Card>

      {/* Dialog salvar/editar template */}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {editingId ? 'Editar template' : 'Salvar template'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              O assunto e o corpo atuais do compositor são gravados no template
              {editingId ? ' (substituindo o conteúdo anterior).' : '.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="tpl-name" className="text-xs font-semibold">
                Nome do template
              </Label>
              <Input
                id="tpl-name"
                value={tplName}
                onChange={(e) => setTplName(e.target.value)}
                placeholder="Ex.: Newsletter de lançamento"
                className="text-xs rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tpl-desc" className="text-xs font-semibold">
                Descrição (opcional)
              </Label>
              <Input
                id="tpl-desc"
                value={tplDescription}
                onChange={(e) => setTplDescription(e.target.value)}
                placeholder="Para que serve este template"
                className="text-xs rounded-xl"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Dica: use variáveis como <code className="font-bold">{'{{nome}}'}</code> e{' '}
              <code className="font-bold">{'{{empresa}}'}</code> no corpo — ao aplicar o template,
              preencha os valores no painel de variáveis.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setSaveOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveTemplate}
              disabled={savingTpl}
              className="rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {savingTpl ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {editingId ? 'Salvar alterações' : 'Salvar template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
