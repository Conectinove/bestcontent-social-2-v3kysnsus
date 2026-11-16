import { useEffect, useMemo, useState } from 'react'
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
  Download,
  Info,
  Mail,
  Calendar,
  KeyRound,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import {
  listOrgMembers,
  setMemberOrgRole,
  ORG_ROLES,
  type OrgMember,
  type OrgRole,
} from '@/services/org-members'
import {
  cancelOrgInvite,
  listOrgInvites,
  resendOrgInvite,
  type OrgInvite,
} from '@/services/org-invites'
import {
  ORG_PERMISSIONS,
  permissionsOf,
  recordRoleChange,
  roleFromMember,
  setMemberPermissions,
  type OrgPermissions,
} from '@/services/org-members'
import { MemberDetailsDialog } from '@/components/settings/MemberDetailsDialog'
import { formatDateTimeBR, exportMembersCsv } from '@/lib/members-csv'

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

/** Diálogo de permissões granulares (users.org_permissions, migration 0128). */
function MemberPermissionsDialog({
  member,
  open,
  onOpenChange,
}: {
  member: OrgMember
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const qc = useQueryClient()
  const [perms, setPerms] = useState<OrgPermissions>(() => permissionsOf(member))
  const [role, setRole] = useState<OrgRole>(() => roleFromMember(member))

  // Re-sincroniza o rascunho quando o diálogo abre para outro membro.
  useEffect(() => {
    if (open) {
      setPerms(permissionsOf(member))
      setRole(roleFromMember(member))
    }
  }, [open, member])

  const permMutation = useMutation({
    mutationFn: (p: OrgPermissions) => setMemberPermissions(member.id, p),
    onSuccess: (_data, p) => {
      qc.invalidateQueries({ queryKey: ['org-members'] })
      toast({ title: 'Permissões salvas', description: `${member.name} atualizado.` })
      onOpenChange(false)
    },
    onError: (err: unknown) =>
      toast({
        title: 'Erro ao salvar permissões',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      }),
  })

  const togglePerm = (key: keyof OrgPermissions, checked: boolean | 'indeterminate') =>
    setPerms((prev) => ({ ...prev, [key]: checked === true }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-1.5">
            <KeyRound className="w-4 h-4 text-primary" />
            Permissões granulares — {member.name || member.email}
          </DialogTitle>
        </DialogHeader>
        <p className="text-[11px] text-muted-foreground">
          Cargo base: <span className="font-semibold text-foreground">{role}</span> · as permissões
          abaixo controlam recursos específicos além do cargo.
        </p>
        <div className="space-y-2 py-1">
          {ORG_PERMISSIONS.map((p) => (
            <label
              key={p.key}
              className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-muted/30 p-2.5 cursor-pointer hover:border-primary/40 transition-colors"
            >
              <Checkbox
                checked={!!perms[p.key]}
                onCheckedChange={(c) => togglePerm(p.key, c)}
                className="mt-0.5"
                disabled={permMutation.isPending}
              />
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-foreground">{p.label}</span>
                <span className="block text-[10px] text-muted-foreground">{p.description}</span>
              </span>
            </label>
          ))}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs"
            disabled={permMutation.isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            className="text-xs gap-1"
            disabled={permMutation.isPending}
            onClick={() => permMutation.mutate(perms)}
          >
            {permMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Salvar permissões
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function MemberRow({ member, canManage, isPending }: MemberRowProps) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState<OrgRole | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [permsOpen, setPermsOpen] = useState(false)
  const qc = useQueryClient()

  const current: OrgRole = roleFromMember(member)
  const perms = permissionsOf(member)

  const permMutation = useMutation({
    mutationFn: (p: OrgPermissions) => setMemberPermissions(member.id, p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org-members'] })
      toast({ title: 'Permissões salvas', description: `${member.name} atualizado.` })
      setPermsOpen(false)
    },
    onError: (err: unknown) =>
      toast({
        title: 'Erro ao salvar permissões',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      }),
  })

  const mutation = useMutation({
    mutationFn: async (role: OrgRole) => {
      const res = await setMemberOrgRole(member.id, role)
      await recordRoleChange(member.id, current, role)
      return res
    },
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
          <p className="text-[10px] text-muted-foreground/80 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            Última atividade: {member.updated ? formatDateTimeBR(member.updated) : '—'}
          </p>
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
        <Button
          variant="ghost"
          size="sm"
          className="text-xs gap-1 shrink-0"
          onClick={() => setDetailsOpen(true)}
          title="Ver detalhes do membro"
        >
          <Info className="w-3.5 h-3.5" />
          Detalhes
        </Button>
        {canManage && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1 shrink-0"
              onClick={() => setOpen((v) => !v)}
            >
              Cargo
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
              />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1 shrink-0 text-primary"
              onClick={() => setPermsOpen(true)}
              title="Permissões granulares (blog, Segundo Cérebro, mídias, relatórios)"
            >
              <KeyRound className="w-3.5 h-3.5" />
              Granulares
            </Button>
          </>
        )}
        <MemberDetailsDialog
          member={member}
          isPending={!!isPending}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
        <MemberPermissionsDialog member={member} open={permsOpen} onOpenChange={setPermsOpen} />
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

function PendingInvitesSection({
  invites,
  onChanged,
}: {
  invites: OrgInvite[]
  onChanged: () => void
}) {
  const [busyId, setBusyId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCancel = async (invite: OrgInvite) => {
    setBusyId(invite.id)
    try {
      await cancelOrgInvite(invite.id)
      toast({ title: 'Convite cancelado' })
      onChanged()
    } catch {
      toast({
        title: 'Erro ao cancelar convite',
        description: 'Verifique sua conexão e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setBusyId(null)
    }
  }

  const handleResend = async (invite: OrgInvite) => {
    setBusyId(invite.id)
    try {
      await resendOrgInvite(invite)
      toast({ title: 'Convite reenviado' })
      onChanged()
    } catch {
      toast({
        title: 'Erro ao reenviar convite',
        description: 'Verifique sua conexão e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setBusyId(null)
    }
  }

  const handleCopyLink = async (invite: OrgInvite) => {
    const base = typeof window !== 'undefined' ? window.location.origin : ''
    const url = `${base}/org/invite?token=${invite.token}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(invite.id)
      toast({ title: 'Link copiado', description: url })
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast({
        title: 'Não foi possível copiar',
        description: 'Copie manualmente o token do convite.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
        <Clock className="w-3 h-3" />
        {invites.length} convite(s) pendente(s) de aceitação
      </p>
      {invites.map((invite) => (
        <div
          key={invite.id}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2.5 rounded-lg border border-border/50 bg-muted/30"
        >
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground truncate">{invite.email}</p>
            <p className="text-[10px] text-muted-foreground">
              Cargo: {invite.org_role || 'visualizador'} · Criado em{' '}
              {invite.created ? formatDateTimeBR(invite.created) : '—'}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[10px] gap-1"
              onClick={() => handleCopyLink(invite)}
              title="Copiar link do convite"
            >
              <Mail className="w-3 h-3" />
              {copiedId === invite.id ? 'Copiado!' : 'Copiar link'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[10px] gap-1"
              disabled={busyId === invite.id}
              onClick={() => handleResend(invite)}
              title="Reenviar convite"
            >
              {busyId === invite.id ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Mail className="w-3 h-3" />
              )}
              Reenviar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[10px] gap-1 text-destructive hover:text-destructive"
              disabled={busyId === invite.id}
              onClick={() => handleCancel(invite)}
              title="Cancelar convite pendente"
            >
              <X className="w-3 h-3" />
              Cancelar
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

/** Painel de controle de usuários da organização (listar, buscar, filtrar por
 * cargo, ver status ativo/pendente e trocar permissões). */
export function OrgMembersPermissionsPanel({ isAdmin }: { isAdmin: boolean }) {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | OrgRole>('all')
  // Filtro por data de entrada + paginação da lista.
  const [joinedFrom, setJoinedFrom] = useState('')
  const [joinedTo, setJoinedTo] = useState('')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 8
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
    // Datas no formato yyyy-MM-dd; "até" é inclusivo (vai até 23:59:59).
    const fromTs = joinedFrom ? new Date(`${joinedFrom}T00:00:00`).getTime() : null
    const toTs = joinedTo ? new Date(`${joinedTo}T23:59:59.999`).getTime() : null
    return (data || []).filter((m) => {
      const matchQ =
        !q || (m.name || '').toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q)
      const role = (m.org_role || m.role || 'viewer') as OrgRole
      const matchRole = roleFilter === 'all' || role === roleFilter
      const createdTs = m.created ? new Date(m.created).getTime() : NaN
      const matchDate =
        (fromTs === null || (!Number.isNaN(createdTs) && createdTs >= fromTs)) &&
        (toTs === null || (!Number.isNaN(createdTs) && createdTs <= toTs))
      return matchQ && matchRole && matchDate
    })
  }, [data, search, roleFilter, joinedFrom, joinedTo])

  // Paginação sobre a lista filtrada; volta à página 1 quando o filtro muda.
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paged = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage],
  )
  useEffect(() => {
    setPage(1)
  }, [search, roleFilter, joinedFrom, joinedTo])

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = { all: (data || []).length }
    for (const r of ORG_ROLES) {
      counts[r.value] = (data || []).filter(
        (m) => (m.org_role || m.role || 'viewer') === r.value,
      ).length
    }
    return counts
  }, [data])

  // Exportar lista (membros + convites pendentes) em CSV.
  const handleExportCsv = () => {
    if (!data || data.length === 0) {
      toast({ title: 'Nada para exportar', description: 'A lista de membros está vazia.' })
      return
    }
    exportMembersCsv(data, pendingInvites)
    toast({ title: 'Exportado', description: 'CSV de membros gerado com sucesso.' })
  }

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
      {/* Busca + filtro por cargo + filtro por data de entrada */}
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
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <Input
            type="date"
            value={joinedFrom}
            onChange={(e) => setJoinedFrom(e.target.value)}
            title="Entrada a partir de"
            className="h-9 text-[11px] w-[130px]"
          />
          <span className="text-[11px] text-muted-foreground">até</span>
          <Input
            type="date"
            value={joinedTo}
            onChange={(e) => setJoinedTo(e.target.value)}
            title="Entrada até"
            className="h-9 text-[11px] w-[130px]"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-[11px] gap-1 rounded-md"
            onClick={handleExportCsv}
            title="Exportar lista de membros em CSV"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar CSV
          </Button>
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
        <PendingInvitesSection
          invites={pendingInvites}
          onChanged={() => {
            qc.invalidateQueries({ queryKey: ['org-invites'] })
            qc.invalidateQueries({ queryKey: ['org-members'] })
          }}
        />
      )}

      {filtered.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">
          Nenhum membro encontrado com esse filtro.
        </p>
      ) : (
        <>
          {paged.map((m) => {
            const isPending = pendingEmails.has((m.email || '').toLowerCase())
            return <MemberRow key={m.id} member={m} canManage={isAdmin} isPending={isPending} />
          })}
          {/* Paginação (8 por página) */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px] gap-1"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Anterior
              </Button>
              <span className="text-[11px] text-muted-foreground">
                Página {safePage} de {totalPages} · {filtered.length} membro(s)
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px] gap-1"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Próxima
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
