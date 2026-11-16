import type { OrgMember, OrgRoleHistoryEntry } from '@/services/org-members'
import { ORG_ROLES } from '@/services/org-members'
import type { OrgInvite } from '@/services/org-invites'

/** Formata uma data ISO em pt-BR (dd/mm/aaaa hh:mm). */
export function formatDateTimeBR(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function csvEscape(value: unknown): string {
  const s = String(value ?? '')
  // Aspas duplas escapadas; quebra de linha e vírgula forçam aspas.
  if (/[";\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function buildCsvRow(cells: string[]): string {
  return cells.map(csvEscape).join(';')
}

/** Gera o CSV (BOM UTF-8 + separador ";" p/ Excel pt-BR) da lista de membros,
 * incluindo convites pendentes como linhas extras. */
export function buildMembersCsv(members: OrgMember[], invites: OrgInvite[]): string {
  const header = buildCsvRow([
    'Nome',
    'Email',
    'Cargo',
    'Status',
    'Data de entrada',
    'Última atividade',
  ])
  const memberRows = members.map((m) =>
    buildCsvRow([
      m.name || '',
      m.email || '',
      m.org_role || m.role || 'visualizador',
      'Ativo',
      formatDateTimeBR(m.created),
      formatDateTimeBR(m.updated || m.created),
    ]),
  )
  const inviteRows = invites.map((i) =>
    buildCsvRow([
      '',
      i.email || '',
      i.org_role || 'visualizador',
      'Convite pendente',
      formatDateTimeBR(i.created),
      '',
    ]),
  )
  return '\uFEFF' + [header, ...memberRows, ...inviteRows].join('\r\n')
}

/** Gera e baixa o CSV de membros + convites pendentes. */
export function exportMembersCsv(members: OrgMember[], invites: OrgInvite[]): void {
  const csv = buildMembersCsv(members, invites)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `membros-organizacao-${stamp}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
