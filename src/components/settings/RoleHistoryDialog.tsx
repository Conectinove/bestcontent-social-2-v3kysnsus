/**
 * Diálogo "Histórico de permissões" de um membro da organização.
 * Lê org_role_history (migration 0128) filtrado por user via listRoleHistory,
 * do mais recente para o mais antigo, mostrando quem alterou, de qual papel
 * para qual, a nota e a data. Estado vazio honesto quando não há registros.
 */
import { useCallback, useEffect, useState } from 'react'
import { History, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  listRoleHistory,
  ORG_ROLES,
  type OrgMember,
  type OrgRoleHistoryEntry,
} from '@/services/org-members'
import { cn } from '@/lib/utils'

const roleLabel = (role: string): string =>
  ORG_ROLES.find((r) => r.value === role)?.label || role || '—'

const personName = (entry: OrgRoleHistoryEntry, who: 'user' | 'by', fallback: string): string => {
  const expanded = entry.expand?.[who]
  return String(expanded?.name || expanded?.email || fallback)
}

const formatDate = (iso: string): string => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso || '—'
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

interface RoleHistoryDialogProps {
  member: OrgMember | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RoleHistoryDialog({ member, open, onOpenChange }: RoleHistoryDialogProps) {
  const [entries, setEntries] = useState<OrgRoleHistoryEntry[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (memberId: string) => {
    setLoading(true)
    try {
      setEntries(await listRoleHistory(memberId))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open && member) load(member.id)
    if (!open) setEntries([])
  }, [open, member, load])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <History className="w-4 h-4" />
            Histórico de permissões
          </DialogTitle>
          <DialogDescription className="text-xs">
            {member?.name || member?.email || ''}
            {member?.email && member.name ? ` · ${member.email}` : ''}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground gap-2 text-xs">
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando histórico...
          </div>
        ) : entries.length === 0 ? (
          <div className="py-10 text-center text-xs text-muted-foreground">
            Nenhuma mudança de papel registrada para este membro.
            <br />
            As alterações passam a aparecer aqui quando o cargo dele for trocado.
          </div>
        ) : (
          <ol className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {entries.map((entry) => {
              const changed = entry.from_role !== entry.to_role
              return (
                <li
                  key={entry.id}
                  className="rounded-lg border border-border bg-muted/30 p-3 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-foreground">
                      {personName(entry, 'by', 'Você')}
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(entry.created)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <Badge variant="outline" className="text-[10px] px-1.5">
                      {roleLabel(entry.from_role)}
                    </Badge>
                    <span
                      className={cn(
                        'font-bold',
                        changed ? 'text-foreground' : 'text-muted-foreground',
                      )}
                    >
                      →
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] px-1.5',
                        changed && 'bg-primary/10 border-primary/40 text-primary',
                      )}
                    >
                      {roleLabel(entry.to_role)}
                    </Badge>
                    {!changed && (
                      <span className="text-[10px] text-muted-foreground">
                        (permissões ajustadas)
                      </span>
                    )}
                  </div>
                  {entry.note?.trim() && (
                    <p className="text-[11px] text-muted-foreground italic">
                      “{entry.note.trim()}”
                    </p>
                  )}
                </li>
              )
            })}
          </ol>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default RoleHistoryDialog
