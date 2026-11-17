// Briefings de IA salvos pelo usuário no diálogo "Gerar com IA" do Labs.
// Persistidos na coleção labs_ai_briefing_templates (migration 0131), sempre
// com o user do registro = usuário autenticado (regra de create da coleção).
import { pb } from '@/lib/pocketbase/client'
import { getErrorMessage } from '@/lib/pocketbase/errors'

export interface LabsBriefingTemplate {
  id: string
  name: string
  briefing: string
  kind: string
  created: string
  updated: string
}

export async function listBriefingTemplates(
  userId: string,
  kind?: string,
): Promise<LabsBriefingTemplate[]> {
  try {
    let filter = `user = "${userId}"`
    if (kind) filter += ` && kind = "${kind}"`
    const records = await pb.collection('labs_ai_briefing_templates').getList(1, 100, {
      filter,
      sort: '-updated',
    })
    return records.items.map((r: any) => ({
      id: r.id,
      name: r.name,
      briefing: r.briefing || '',
      kind: r.kind || '',
      created: r.created,
      updated: r.updated,
    }))
  } catch (err) {
    console.error('Falha ao carregar briefings salvos:', getErrorMessage(err))
    return []
  }
}

export async function createBriefingTemplate(
  userId: string,
  name: string,
  briefing: string,
  kind?: string,
): Promise<LabsBriefingTemplate> {
  const cleanName = name.trim()
  if (!cleanName) throw new Error('Dê um nome para o briefing antes de salvar.')
  if (cleanName.length > 120) throw new Error('O nome do briefing pode ter até 120 caracteres.')
  const cleanBriefing = briefing.trim()
  if (!cleanBriefing) throw new Error('Escreva o briefing antes de salvar como template.')

  try {
    const record = await pb.collection('labs_ai_briefing_templates').create({
      user: userId,
      name: cleanName,
      briefing: cleanBriefing,
      kind: kind || '',
    })
    return {
      id: record.id,
      name: record.name,
      briefing: record.briefing || '',
      kind: record.kind || '',
      created: record.created,
      updated: record.updated,
    }
  } catch (err) {
    const msg = getErrorMessage(err)
    if (/unique/i.test(msg)) {
      throw new Error('Já existe um briefing salvo com esse nome — escolha outro nome.')
    }
    throw new Error(msg)
  }
}

export async function deleteBriefingTemplate(id: string): Promise<void> {
  await pb.collection('labs_ai_briefing_templates').delete(id)
}
