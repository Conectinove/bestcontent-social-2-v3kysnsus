import { useMemo, useState } from 'react'
import { Mail, Copy, Download, Eye, FileCode2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'

/** Escapa HTML do corpo digitado (o corpo é texto simples, nunca HTML cru do usuário). */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Monta o HTML completo do email (assunto + corpo com parágrafos, largura de email). */
function buildEmailHtml(subject: string, body: string, preheader: string): string {
  const paragraphs = body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(
      (p) =>
        `        <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#1f2937;">${escapeHtml(p).replace(/\n/g, '<br />')}</p>`,
    )
    .join('\n')
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(subject || 'Email sem assunto')}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;">
          <tr>
            <td style="padding:28px 32px 8px;">
              ${preheader ? `<p style="margin:0 0 12px;font-size:12px;line-height:1.5;color:#6b7280;">${escapeHtml(preheader)}</p>` : ''}
              <h1 style="margin:0 0 20px;font-size:22px;line-height:1.3;color:#111827;">${escapeHtml(subject || 'Email sem assunto')}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px;">
${paragraphs || '        <p style="margin:0;font-size:15px;color:#6b7280;">Corpo vazio.</p>'}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:11px;color:#9ca3af;">Enviado via BestContent Social</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/** Redator de email do Labs: assunto, corpo, prévia renderizada, copiar/baixar HTML. Sem envio real. */
export function LabsEmailTab() {
  const [subject, setSubject] = useState('')
  const [preheader, setPreheader] = useState('')
  const [body, setBody] = useState('')
  const [showPreview, setShowPreview] = useState(true)

  const html = useMemo(() => buildEmailHtml(subject, body, preheader), [subject, body, preheader])

  const copyHtml = async () => {
    try {
      await navigator.clipboard.writeText(html)
      toast({ title: 'HTML copiado!', description: 'Cole no seu disparador de email preferido.' })
    } catch {
      // Clipboard pode falhar em contextos não seguros — fallback com seleção.
      fallbackCopy(html)
    }
  }

  const fallbackCopy = (text: string) => {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    toast(
      ok
        ? { title: 'HTML copiado!' }
        : {
            title: 'Não foi possível copiar',
            description: 'Use "Baixar HTML".',
            variant: 'destructive',
          },
    )
  }

  const downloadHtml = () => {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${
      (subject || 'email')
        .toLowerCase()
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-|-$/g, '') || 'email'
    }.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast({ title: 'HTML baixado', description: 'Arquivo .html salvo.' })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-foreground flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" /> Email
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Redija, veja a prévia renderizada e leve o HTML pronto — sem envio por aqui.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPreview((v) => !v)}
            className="rounded-xl text-xs font-bold gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" /> {showPreview ? 'Ocultar prévia' : 'Ver prévia'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copyHtml}
            className="rounded-xl text-xs font-bold gap-1.5"
          >
            <Copy className="w-3.5 h-3.5" /> Copiar HTML
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={downloadHtml}
            className="rounded-xl text-xs font-black gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Baixar HTML
          </Button>
        </div>
      </div>

      <div className={showPreview ? 'grid grid-cols-1 lg:grid-cols-2 gap-5' : 'space-y-5'}>
        <Card className="p-5 rounded-3xl border border-border/80 bg-card space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Assunto</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex.: Novidades de outubro 🍂"
              className="h-10 text-sm rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Preheader (resumo no inbox, opcional)</Label>
            <Input
              value={preheader}
              onChange={(e) => setPreheader(e.target.value)}
              placeholder="Aparace depois do assunto na caixa de entrada"
              className="h-10 text-sm rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Corpo</Label>
            <Textarea
              rows={14}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={'Escreva o email...\n\nLinha em branco separa parágrafos.'}
              className="text-sm rounded-2xl resize-y bg-muted/30"
            />
          </div>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <FileCode2 className="w-3.5 h-3.5" /> {html.length.toLocaleString('pt-BR')} caracteres
            de HTML gerado
          </p>
        </Card>

        {showPreview && (
          <Card className="p-4 rounded-3xl border border-border/80 bg-card">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Prévia renderizada
            </span>
            <div className="mt-3 rounded-2xl bg-muted/40 p-4 overflow-auto max-h-[560px]">
              <iframe
                title="Prévia do email"
                srcDoc={html}
                sandbox=""
                className="w-full h-[520px] rounded-xl border border-border bg-white"
              />
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

export default LabsEmailTab
