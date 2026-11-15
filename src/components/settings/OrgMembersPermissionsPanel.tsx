import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Users,
  ShieldCheck,
  ChevronDown,
  Loader2,
  Check,
  X,
  Crown,
  Pencil,
  Eye,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import {
  listOrgMembers,
  setMemberOrgRole,
  ORG_ROLES,
  type OrgMember,
  type OrgRole,
} from '@/services/org-members'

const ROLE_META: Record<string, { label: string; icon: typeof Crown; cls: string }> = {
  owner: {
    label: 'Proprietário',
    icon: Crown,
    cls: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
  },
  admin: {
    label: 'Admin',
    icon: ShieldCheck,
    cls: 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/30',
  },
  editor: {
    label: 'Editor',
    icon: Pencil,
    cls: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30',
  },
  viewer: {
    label: 'Viewer',
    icon: Eye,
    cls: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/30',
  },
}

interface MemberRowProps {
  member: OrgMember
  canManage: boolean
}

function MemberRow({ member, canManage }: MemberRowProps) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState<OrgRole | null>(null)
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: (role: OrgRole) => setMemberOrgRole(member.id, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org-members'] })
      toast({
        title: 'Permissão atualizada',
        description: `${member.name} agora tem o papel definido.`,
      })
      setOpen(false)
      setPending(null)
    },
    onError: (err: unknown) => {
      setPending(null)
      toast({
        title: 'Erro ao salvar permissão',
        description:
          err instanceof Error ? err.message : 'Verifique se você tem permissão de admin.',
        variant: 'destructive',
      })
    },
  })

  const current: OrgRole = (member.org_role || member.role || 'viewer') as OrgRole
  const meta = ROLE_META[current] || ROLE_META.viewer
  const CurrentIcon = meta.icon

  return (
    <div className="rounded-xl border border-border/70 bg-muted/30 overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
          {(member.name || member.email || '?').charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">
            {member.name || member.email}
          </p>
          <p className="text-[11px] text-muted-foreground truncate">{member.email}</p>
        </div>
        <Badge variant="outline" className={`text-[10px] gap-1 ${meta.cls}`}>
          <CurrentIcon className="w-3 h-3" />
          {meta.label}
        </Badge>
        {canManage && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1 shrink-0"
            onClick={() => setOpen((v) => !v)}
          >
            Permissões
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
            />
          </Button>
        )}
      </div>

      {open && canManage && (
        <div className="border-t border-border/60 bg-background p-3 space-y-2">
          <p className="text-[11px] text-muted-foreground">
            Escolha o nível de acesso deste membro na organização.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ORG_ROLES.map((r) => {
              const selected = pending === r.value
              const isActive = current === r.value
              return (
                <button
                  key={r.value}
                  type="button"
                  disabled={mutation.isPending}
                  onClick={() => {
                    setPending(r.value)
                    mutation.mutate(r.value)
                  }}
                  className={`text-left p-3 rounded-lg border transition-all text-xs space-y-0.5 ${
                    isActive
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 bg-background'
                  }`}
                >
                  <span className="flex items-center justify-between font-bold text-foreground">
                    {r.label}
                    {isActive && <Check className="w-3.5 h-3.5 text-primary" />}
                    {selected && mutation.isPending && (
                      <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                    )}
                  </span>
                  <span className="block text-[10px] text-muted-foreground">{r.description}</span>
                </button>
              )
            })}
          </div>
          {mutation.isError && (
            <p className="text-[11px] text-destructive flex items-center gap-1">
              <X className="w-3 h-3" /> Não foi possível salvar. Tente novamente.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/** Painel de permissões por membro da organização (pedido 1). */
export function OrgMembersPermissionsPanel({ isAdmin }: { isAdmin: boolean }) {
  const qc = useQueryClient()
  const { data, isLoading, error } = useQuery({
    queryKey: ['org-members'],
    queryFn: listOrgMembers,
  })

  if (!isAdmin) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-5 text-center space-y-1.5">
          <Users className="w-6 h-6 text-muted-foreground mx-auto" />
          <p className="text-xs text-muted-foreground">
            Apenas administradores podem gerenciar as permissões dos membros.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-5 text-center">
          <p className="text-xs text-muted-foreground">
            Não foi possível carregar os membros. Verifique sua conexão.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 text-xs"
            onClick={() => qc.invalidateQueries({ queryKey: ['org-members'] })}
          >
            Recarregar
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {data.length} membro(s) na organização — defina o nível de acesso de cada um.
      </p>
      {data.map((m) => (
        <MemberRow key={m.id} member={m} canManage={isAdmin} />
      ))}
    </div>
  )
}
