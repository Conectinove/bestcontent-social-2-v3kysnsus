import { useMemo, useState } from 'react'
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
  Search,
  Clock,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { listOrgInvites, type OrgInvite } from '@/services/org-invites'
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
  isPending?: boolean
}

function MemberRow({ member, canManage, isPending }: MemberRowProps) {
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
        {isPending && (
          <Badge
            variant="outline"
            className="text-[10px] gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
          >
            <Clock className="w-3 h-3" />
            Pendente
          </Badge>
        )}
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

/** Painel de controle de usuários da organização (listar, buscar, filtrar por
 * cargo, ver status ativo/pendente e trocar permissões). */
export function OrgMembersPermissionsPanel({ isAdmin }: { isAdmin: boolean }) {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | OrgRole>('all')
  const { data, isLoading, error } = useQuery({
    queryKey: ['org-members'],
    queryFn: listOrgMembers,
  })
  // Convites pendentes → status "Pendente" na lista (coleção org_invites).
  const invitesQuery = useQuery({
    queryKey: ['org-invites'],
    queryFn: listOrgInvites,
  })
  const pendingInvites = useMemo(
    () => (invitesQuery.data || []).filter((i: OrgInvite) => i.status === 'pending'),
    [invitesQuery.data],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (data || []).filter((m) => {
      const matchQ =
        !q || (m.name || '').toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q)
      const role = (m.org_role || m.role || 'viewer') as OrgRole
      const matchRole = roleFilter === 'all' || role === roleFilter
      return matchQ && matchRole
    })
  }, [data, search, roleFilter])

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = { all: (data || []).length }
    for (const r of ORG_ROLES) {
      counts[r.value] = (data || []).filter(
        (m) => (m.org_role || m.role || 'viewer') === r.value,
      ).length
    }
    return counts
  }, [data])

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

  const pendingEmails = new Set(pendingInvites.map((i) => (i.email || '').toLowerCase()))

  return (
    <div className="space-y-3">
      {/* Busca + filtro por cargo */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou email..."
            className="pl-9 h-9 text-xs"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => setRoleFilter('all')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
              roleFilter === 'all'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            Todos ({roleCounts.all ?? 0})
          </button>
          {ORG_ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRoleFilter(r.value)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
                roleFilter === r.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {r.label} ({roleCounts[r.value] ?? 0})
            </button>
          ))}
        </div>
      </div>

      {pendingInvites.length > 0 && (
        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
          <Clock className="w-3 h-3" />
          {pendingInvites.length} convite(s) pendente(s) de aceitação.
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">
          Nenhum membro encontrado com esse filtro.
        </p>
      ) : (
        filtered.map((m) => {
          const isPending = pendingEmails.has((m.email || '').toLowerCase())
          return <MemberRow key={m.id} member={m} canManage={isAdmin} isPending={isPending} />
        })
      )}
    </div>
  )
}
