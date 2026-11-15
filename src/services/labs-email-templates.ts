import pb from '@/lib/pocketbase/client'

/** Template de email customizável do Labs (coleção labs_email_templates, migration 0126). */
export interface LabsEmailTemplate {
  id: string
  user: string
  name: string
  description: string
  subject: string
  html: string
  created?: string
  updated?: string
}

const COLLECTION = 'labs_email_templates'

/** Lista os templates de email do usuário, mais recentes primeiro. */
export async function listLabsEmailTemplates(userId: string): Promise<LabsEmailTemplate[]> {
  const recs = await pb.collection(COLLECTION).getFullList({
    filter: `user = "${userId}"`,
    sort: '-updated',
  })
  return recs.map(mapTemplate)
}

/** Cria ou atualiza um template. `id` vazio = novo template. */
export async function saveLabsEmailTemplate(data: {
  id?: string
  user: string
  name: string
  description?: string
  subject: string
  html: string
}): Promise<LabsEmailTemplate> {
  const payload = {
    user: data.user,
    name: data.name.trim().slice(0, 120),
    description: data.description || '',
    subject: data.subject || '',
    html: data.html || '',
  }
  const rec = data.id
    ? await pb.collection(COLLECTION).update(data.id, payload)
    : await pb.collection(COLLECTION).create(payload)
  return mapTemplate(rec)
}

export async function deleteLabsEmailTemplate(id: string) {
  return pb.collection(COLLECTION).delete(id)
}

/** Substitui variáveis {{chave}} pelos valores informados (case-insensitive). */
export function applyTemplateVariables(text: string, vars: Record<string, string>): string {
  return (text || '').replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (match, rawKey: string) => {
    const key = rawKey.trim().toLowerCase()
    const entry = Object.entries(vars).find(([k]) => k.trim().toLowerCase() === key)
    return entry && entry[1] ? entry[1] : match
  })
}

/** Extrai as variáveis {{...}} usadas num texto (assunto + corpo). */
export function extractTemplateVariables(...texts: string[]): string[] {
  const found = new Set<string>()
  for (const text of texts) {
    const re = /\{\{\s*([\w.-]+)\s*\}\}/g
    let m: RegExpExecArray | null
    while ((m = re.exec(text || '')) !== null) found.add(m[1].trim().toLowerCase())
  }
  return Array.from(found).sort()
}

function mapTemplate(rec: Record<string, unknown>): LabsEmailTemplate {
  return {
    id: String(rec.id || ''),
    user: String(rec.user || ''),
    name: String(rec.name || ''),
    description: String(rec.description || ''),
    subject: String(rec.subject || ''),
    html: String(rec.html || ''),
    created: String(rec.created || ''),
    updated: String(rec.updated || ''),
  }
}
