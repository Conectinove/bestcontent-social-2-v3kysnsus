import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Mail, Plus, Copy, Loader2, Clock, CheckCircle2, XCircle, UserPlus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
  createOrgInvite,
  listOrgInvites,
  buildInviteUrl,
  type OrgInvite,
} from '@/services/org-invites'
import { ORG_ROLES } from '@/services/org-members'

const STATUS_META: Record<string, { label: string; icon: typeof Clock; cls: string }> = {
  pending: {
    label: 'Pendente',
    icon: Clock,
    cls: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
  },
  accepted: {
    label: 'Aceito',
    icon: CheckCircle2,
    cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  },
  expired: {
    label: 'Expirado',
    icon: XCircle,
    cls: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30',
  },
}

/** Painel "Convidar membros" (pedido 4) — aba Organização da Settings. */
export function OrgInvitesPanel({ isAdmin }: { isAdmin: boolean }) {
  const qc = useQueryClient()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('editor')
  const [copied, setCopied] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['org-invites'],
    queryFn: listOrgInvites,
    enabled: isAdmin,
  })

  const createMutation = useMutation({
    mutationFn: () => createOrgInvite(email, role),
    onSuccess: (inv) => {
      qc.invalidateQueries({ queryKey: ['org-invites'] })
      setEmail('')
      const url = buildInviteUrl(inv.token)
      navigator.clipboard?.writeText(url).catch(() => {})
      setCopied(inv.token)
      toast({
        title: 'Convite gerado',
        description: 'O link foi copiado — envie para o convidado.',
      })
    },
    onError: (err: unknown) => {
      toast({
        title: 'Erro ao criar convite',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      })
    },
  })

  const invites: OrgInvite[] = data || []
  const pending = invites.filter((i) => i.status === 'pending')

  if (!isAdmin) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-5 text-center space-y-1.5">
          <UserPlus className="w-6 h-6 text-muted-foreground mx-auto" />
          <p className="text-xs text-muted-foreground">
            Apenas administradores podem convidar novos membros.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Formulário de convite */}
      <div className="p-4 rounded-xl border border-border/70 bg-muted/30 space-y-3">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-foreground">Convidar membro por email</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@exemplo.com"
            className="flex-1 text-sm"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {ORG_ROLES.filter((r) => r.value !== 'owner').map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            disabled={!email.includes('@') || createMutation.isPending}
            onClick={() => createMutation.mutate()}
            className="gap-1.5 text-xs shrink-0"
          >
            {createMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            Gerar convite
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          O convite vira um link copiável (válido por 30 dias) — o convidado abre, entra na conta e
          recebe o cargo automaticamente.
        </p>
      </div>

      {/* Lista de convites */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-foreground">
          Convites{' '}
          {pending.length > 0 && `(${pending.length} pendente${pending.length > 1 ? 's' : ''})`}
        </p>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          </div>
        ) : invites.length === 0 ? (
          <p className="text-xs text-muted-foreground p-3 rounded-lg bg-muted/30 border border-border/50">
            Nenhum convite ainda. Gere o primeiro acima.
          </p>
        ) : (
          invites.map((inv) => {
            const meta = STATUS_META[inv.status] || STATUS_META.pending
            const Icon = meta.icon
            const url = buildInviteUrl(inv.token)
            return (
              <div
                key={inv.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-border/70 bg-background"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">{inv.email}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Cargo: {ORG_ROLES.find((r) => r.value === inv.org_role)?.label || inv.org_role}
                    {inv.expires
                      ? ` · expira em ${new Date(inv.expires).toLocaleDateString('pt-BR')}`
                      : ''}
                  </p>
                </div>
                <Badge variant="outline" className={cn('text-[10px] gap-1 shrink-0', meta.cls)}>
                  <Icon className="w-3 h-3" />
                  {meta.label}
                </Badge>
                {inv.status === 'pending' && inv.token && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-[11px] shrink-0"
                    onClick={() => {
                      navigator.clipboard?.writeText(url).catch(() => {})
                      setCopied(inv.token)
                      toast({ title: 'Link copiado' })
                    }}
                  >
                    {copied === inv.token ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    Copiar link
                  </Button>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
