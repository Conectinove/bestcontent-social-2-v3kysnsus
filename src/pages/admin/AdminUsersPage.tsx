import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ArrowLeft,
  BadgeCheck,
  UserCog,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/context/AuthContext'
import {
  listOrganizationUsers,
  updateUserRole,
  type AdminRole,
  type AdminUserRecord,
} from '@/services/admin-users'

const PAGE_SIZE = 20

const ROLE_LABELS: Record<AdminRole, string> = {
  member: 'Membro',
  admin: 'Admin',
  gestor: 'Gestor',
}

function formatRelativeDate(dateStr: string): string {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days <= 0) return 'hoje'
  if (days === 1) return 'ontem'
  if (days < 30) return `${days} dias atrás`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} ${months === 1 ? 'mês' : 'meses'} atrás`
  const years = Math.floor(months / 12)
  return `${years} ${years === 1 ? 'ano' : 'anos'} atrás`
}

export function AdminUsersPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin' || user?.email === 'midiaviva@bestcontent.ai'

  const [users, setUsers] = useState<AdminUserRecord[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingUserId, setSavingUserId] = useState<string | null>(null)

  const loadUsers = useCallback(async (targetPage: number, targetSearch: string) => {
    setLoading(true)
    try {
      const res = await listOrganizationUsers(targetPage, PAGE_SIZE, targetSearch)
      setUsers(res.items)
      setTotalPages(res.totalPages)
      setTotalItems(res.totalItems)
    } catch (err: any) {
      setUsers([])
      toast({
        title: 'Erro ao carregar usuários',
        description: err?.message || 'Verifique se você tem permissão de admin.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAdmin) {
      loadUsers(page, search)
    } else {
      setLoading(false)
    }
  }, [isAdmin, page, search, loadUsers])

  const handleRoleChange = async (target: AdminUserRecord, role: AdminRole) => {
    if (role === target.role) return
    if (target.id === pb.authStore.record?.id) {
      toast({
        title: 'Você não pode alterar o seu próprio cargo',
        description: 'Peça a outro admin da organização para fazer isso.',
        variant: 'destructive',
      })
      return
    }
    const previous = users
    setSavingUserId(target.id)
    // Otimista
    setUsers((prev) => prev.map((u) => (u.id === target.id ? { ...u, role } : u)))
    try {
      await updateUserRole(target.id, role)
      toast({
        title: 'Cargo atualizado! 🛡️',
        description: `${target.name} agora é ${ROLE_LABELS[role]}.`,
      })
    } catch (err: any) {
      setUsers(previous)
      toast({
        title: 'Erro ao alterar cargo',
        description: err?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSavingUserId(null)
    }
  }

  if (!isAdmin) {
    return (
      <div className="p-6 max-w-md mx-auto mt-10">
        <Card className="rounded-2xl border border-dashed border-border p-8 text-center bg-card/60">
          <ShieldCheck className="w-10 h-10 text-primary/60 mx-auto mb-3" />
          <h2 className="font-bold text-base text-foreground">Acesso restrito</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Esta área é exclusiva para administradores da organização.
          </p>
          <Button asChild variant="outline" className="mt-4 rounded-xl text-xs">
            <Link to="/app/feed">
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao feed
            </Link>
          </Button>
          {!user && (
            <Button asChild className="mt-2 rounded-xl text-xs">
              <Link to="/login">Fazer login</Link>
            </Button>
          )}
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-foreground tracking-tight">
              Gestão de Usuários
            </h1>
            <p className="text-xs text-muted-foreground">
              {totalItems} usuários na organização · cargos e planos
            </p>
          </div>
        </div>
        <Button asChild variant="outline" className="rounded-xl text-xs gap-1.5 self-start">
          <Link to="/app/feed">
            <ArrowLeft className="w-3.5 h-3.5" /> Feed
          </Link>
        </Button>
      </div>

      {/* Busca */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <Input
          placeholder="Buscar por nome ou e-mail..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="h-10 pl-9 pr-8 text-xs rounded-xl bg-background border-border/80 focus-visible:ring-1 focus-visible:ring-primary"
        />
        {search && (
          <button
            type="button"
            onClick={() => {
              setSearch('')
              setPage(1)
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Lista */}
      <Card className="rounded-2xl border border-border/70 bg-card overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="w-40 h-4" />
                    <Skeleton className="w-56 h-3" />
                  </div>
                  <Skeleton className="w-24 h-8 rounded-lg" />
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="p-10 text-center">
              <Users className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground">Nenhum usuário encontrado</p>
              <p className="text-xs text-muted-foreground mt-1">
                {search ? `Nada para "${search}".` : 'A organização ainda não tem membros.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {users.map((u) => {
                const isSelf = u.id === pb.authStore.record?.id
                const isSaving = savingUserId === u.id
                return (
                  <li
                    key={u.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 border border-border/80 overflow-hidden">
                        {u.avatar && !u.avatar.includes('seed=') ? (
                          <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{u.name.slice(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-sm text-foreground truncate">
                            {u.name}
                          </span>
                          {u.verified && (
                            <BadgeCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                          )}
                          {isSelf && (
                            <Badge
                              variant="outline"
                              className="bg-primary/10 text-primary border-primary/20 text-[9px] font-bold px-1 py-0"
                            >
                              você
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{u.email || '—'}</p>
                        <p className="text-[10px] text-muted-foreground/70">
                          Entrou {formatRelativeDate(u.created)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 sm:shrink-0">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-bold px-2 py-0.5 uppercase bg-muted/60 text-muted-foreground border-border/70"
                      >
                        {u.plan}
                      </Badge>

                      {isSelf ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-bold px-2 py-0.5 uppercase bg-primary/10 text-primary border-primary/20 gap-1"
                        >
                          <UserCog className="w-3 h-3" /> {ROLE_LABELS[u.role]}
                        </Badge>
                      ) : (
                        <Select
                          value={u.role}
                          onValueChange={(value) => handleRoleChange(u, value as AdminRole)}
                          disabled={isSaving}
                        >
                          <SelectTrigger className="h-8 w-[120px] text-[11px] rounded-lg bg-background border-border/80">
                            {isSaving ? (
                              <span className="flex items-center gap-1.5 text-muted-foreground">
                                <Loader2 className="w-3 h-3 animate-spin" /> salvando...
                              </span>
                            ) : (
                              <SelectValue />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Membro</SelectItem>
                            <SelectItem value="gestor">Gestor</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg text-xs"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg text-xs"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Próxima <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminUsersPage
