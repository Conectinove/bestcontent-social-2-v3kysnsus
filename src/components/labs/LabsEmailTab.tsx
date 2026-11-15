import { useCallback, useEffect, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Download,
  Loader2,
  Mail,
  Send,
  Share2,
  Sparkles,
  Globe,
  QrCode,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { ConnectorButton } from '@/components/skip/ConnectorButton'
import { listConnectors, execute } from '@/lib/skipConnectors'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

// =========================================================================
// ABA EMAIL — Compositor + envio real pelo Gmail conectado do usuário
// =========================================================================
// A decisão da casa (v0.0.158) é conectores no modo "conta de cada usuário":
// o email parte do Gmail DO usuário logado via conector — nunca da conta do
// builder, sem OAuth hand-rolled, sem $http, sem secrets.
// Ferramenta usada: GMAIL_SEND_EMAIL (slug confirmado via find_app_connector_tools).
// =========================================================================

interface EmailTemplate {
  id: string
  name: string
  description: string
  icon: typeof Mail
  subject: string
  html: string
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'newsletter',
    name: 'Newsletter',
    description: 'Layout limpo de boletim com destaque editorial',
    icon: Send,
    subject: 'Sua newsletter semanal',
    html: `<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:32px;">
  <h1 style="font-size:22px;color:#111;">Sua newsletter semanal</h1>
  <p style="color:#444;line-height:1.6;">Escreva aqui o conteúdo principal...</p>
  <hr style="border:none;border-top:1px solid #ddd;" />
  <p style="font-size:11px;color:#999;">Enviado via MidiaViva Labs</p>
</div>`,
  },
  {
    id: 'promocional',
    name: 'Promocional',
    description: 'Chamada direta com botão de ação em destaque',
    icon: Sparkles,
    subject: 'Oferta especial para você',
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;text-align:center;">
  <h1 style="font-size:24px;color:#111;">Oferta especial</h1>
  <p style="color:#444;">Válido por tempo limitado...</p>
  <a href="#" style="display:inline-block;padding:12px 24px;background:#111;color:#fff;border-radius:8px;text-decoration:none;">Quero aproveitar</a>
</div>`,
  },
  {
    id: 'transacional',
    name: 'Transacional',
    description: 'Mensagem objetiva de confirmação/aviso',
    icon: CheckCircle2,
    subject: 'Confirmação de ação',
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;">
  <h2 style="color:#111;">Ação confirmada</h2>
  <p style="color:#444;line-height:1.6;">Detalhes da transação aqui...</p>
</div>`,
  },
  {
    id: 'convite',
    name: 'Convite',
    description: 'Convite de evento com data e CTA',
    icon: QrCode,
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
  const [html, setHtml] = useState(EMAIL_TEMPLATES[0].html)
  const [activeTemplate, setActiveTemplate] = useState<string>('newsletter')
  const [sending, setSending] = useState(false)
  const [gmailConnected, setGmailConnected] = useState(false)
  const [checkingConnection, setCheckingConnection] = useState(true)

  const checkConnection = useCallback(async () => {
    try {
      const connectors = await listConnectors()
      setGmailConnected(connectors.some((c) => c.toolkit === 'gmail' && c.status === 'connected'))
    } catch {
      setGmailConnected(false)
    }
    setCheckingConnection(false)
  }, [])

  useEffect(() => {
    checkConnection()
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
  }, [checkConnection])

  const handleTemplate = (tpl: EmailTemplate) => {
    setActiveTemplate(tpl.id)
    setSubject(tpl.subject)
    setHtml(tpl.html)
    toast({
      title: 'Template aplicado',
      description: `Modelo "${tpl.name}" carregado no compositor.`,
    })
  }

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
    a.download = `email-${activeTemplate}-${Date.now()}.html`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: 'Arquivo baixado', description: 'O HTML do email foi baixado.' })
  }

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
          <Label htmlFor="email-html" className="text-xs font-semibold">
            Corpo (HTML)
          </Label>
          <textarea
            id="email-html"
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            rows={10}
            className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y"
            placeholder="<h1>Olá!</h1><p>Escreva seu HTML...</p>"
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
            onClick={handleCopy}
            className="rounded-xl text-xs font-bold gap-1.5"
          >
            <Copy className="w-3.5 h-3.5" /> Copiar HTML
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
      </Card>

      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Templates de Email
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {EMAIL_TEMPLATES.map((tpl) => {
            const Icon = tpl.icon
            const isActive = activeTemplate === tpl.id
            return (
              <Card
                key={tpl.id}
                onClick={() => handleTemplate(tpl)}
                className={cn(
                  'p-4 space-y-1.5 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50',
                  isActive && 'border-primary/60 bg-primary/5',
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon
                    className={cn('w-4 h-4', isActive ? 'text-primary' : 'text-muted-foreground')}
                  />
                  <h5 className="text-xs font-bold text-foreground">{tpl.name}</h5>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {tpl.description}
                </p>
              </Card>
            )
          })}
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
    </div>
  )
}
