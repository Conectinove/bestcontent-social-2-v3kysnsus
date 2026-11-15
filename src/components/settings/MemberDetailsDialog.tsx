import { useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Crown, Pencil, Eye, Mail, Clock, ShieldCheck } from 'lucide-react'
import { ORG_ROLES, type OrgMember, type OrgRole } from '@/services/org-members'
import { formatDateTimeBR } from '@/lib/members-csv'

interface MemberDetailsDialogProps {
  member: OrgMember
  isPending: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}

const ROLE_META: Record<string, { label: string; icon: typeof Crown; cls: string }> = {
  owner: {
    label: 'Proprietário',
    icon: Crown,
    cls: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  admin: { label: 'Admin', icon: ShieldCheck, cls: 'bg-blue-100 text-blue-800 border-blue-200' },
  editor: { label: 'Editor', icon: Pencil, cls: 'bg-green-100 text-green-800 border-green-200' },
  viewer: { label: 'Visualizador', icon: Eye, cls: 'bg-gray-100 text-gray-700 border-gray-200' },
}

/** Diálogo com os detalhes de um membro da organização: cargo, status,
 * data de entrada e email clicável (mailto:). */
export function MemberDetailsDialog({
  member,
  isPending,
  open,
  onOpenChange,
}: MemberDetailsDialogProps) {
  const meta = ROLE_META[member.org_role || member.role || 'viewer'] || ROLE_META.viewer
  const Icon = meta.icon
  const joined = member.created || member.updated
  const lastActivity = member.updated || member.created

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
              {(member.name || member.email || '?').charAt(0).toUpperCase()}
            </span>
            {member.name || member.email}
          </DialogTitle>
          <DialogDescription>Detalhes do membro da organização</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">Cargo</span>
            <Badge variant="outline" className={`text-[10px] gap-1 ${meta.cls}`}>
              <Icon className="w-3 h-3" />
              {meta.label}
            </Badge>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">Status</span>
            <Badge
              variant="outline"
              className={`text-[10px] ${
                isPending
                  ? 'bg-orange-100 text-orange-700 border-orange-200'
                  : 'bg-green-100 text-green-700 border-green-200'
              }`}
            >
              {isPending ? 'Convite pendente' : 'Ativo'}
            </Badge>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Data de entrada
            </span>
            <span className="text-xs font-medium text-foreground">
              {joined ? formatDateTimeBR(joined) : '—'}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Última atividade
            </span>
            <span className="text-xs font-medium text-foreground">
              {lastActivity ? formatDateTimeBR(lastActivity) : '—'}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Mail className="w-3 h-3" />
              Email
            </span>
            <a
              href={`mailto:${member.email}`}
              className="text-xs font-medium text-primary hover:underline truncate max-w-[55%] text-right"
              title={`Enviar email para ${member.email}`}
            >
              {member.email}
            </a>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
