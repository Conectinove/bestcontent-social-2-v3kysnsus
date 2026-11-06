import { pb } from '@/lib/pocketbase/client'
import type { StudioMediaType } from './ai-studio'

export interface StudioProjectComment {
  id: string
  userId?: string
  userName: string
  userAvatar?: string
  text: string
  created: string
}

export interface StudioProject {
  id: string
  user?: string
  title: string
  description?: string
  current_type: StudioMediaType
  prompt?: string
  model_id?: string
  quality_tier?: string
  attached_assets?: Array<{
    id: string
    name: string
    url?: string
    type?: string
  }>
  collaborators?: string[] // user IDs
  collaborator_names?: string[]
  comments?: StudioProjectComment[]
  status?: 'em_andamento' | 'em_revisao' | 'aprovado' | 'arquivado'
  created?: string
  updated?: string
}

const LOCAL_STORAGE_KEY = 'midiaviva_studio_projects'

function getLocalProjects(): StudioProject[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  return [
    {
      id: 'proj-demo-1',
      title: 'Lançamento Coleção Outono MudarCurso',
      description: 'Campanha de vídeo para Reels e anúncios no Meta Ads',
      current_type: 'video',
      prompt: 'Comercial dinâmico com iluminação dourada e transições rápidas',
      model_id: 'kling-4-0',
      quality_tier: 'ultra',
      collaborators: ['user-collab-1'],
      collaborator_names: ['Mariana Agência', 'Carlos Revisor'],
      comments: [
        {
          id: 'comm-1',
          userName: 'Mariana Agência',
          text: 'O gancho nos primeiros 3s ficou excelente! Vamos gerar variação 9:16.',
          created: new Date(Date.now() - 3600000 * 4).toISOString(),
        },
      ],
      status: 'em_andamento',
      created: new Date(Date.now() - 86400000).toISOString(),
      updated: new Date().toISOString(),
    },
    {
      id: 'proj-demo-2',
      title: 'Packshots de Produto Linha Premium',
      description: 'Geração de imagens de alta fidelidade para catálogo',
      current_type: 'image',
      prompt: 'Garrafa minimalista em fundo de mármore com reflexos suaves',
      model_id: 'flux-3-max-image',
      quality_tier: 'mega',
      collaborators: [],
      collaborator_names: ['Equipe Design'],
      comments: [],
      status: 'em_revisao',
      created: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated: new Date().toISOString(),
    },
  ]
}

function saveLocalProjects(list: StudioProject[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list))
  } catch {
    /* ignore */
  }
}

/**
 * Lista projetos do Studio onde o usuário é dono ou colaborador
 */
export async function getStudioProjects(userId?: string): Promise<StudioProject[]> {
  try {
    const records = await pb.collection('studio_projects').getFullList({
      sort: '-created',
      requestKey: null,
    })

    if (records.length > 0) {
      return records.map((r: any) => ({
        id: r.id,
        user: r.user,
        title: r.title,
        description: r.description,
        current_type: (r.current_type as StudioMediaType) || 'geral',
        prompt: r.prompt,
        model_id: r.model_id,
        quality_tier: r.quality_tier,
        attached_assets: r.attached_assets || [],
        collaborators: r.collaborators || [],
        collaborator_names: r.collaborator_names || [],
        comments: r.comments || [],
        status: r.status || 'em_andamento',
        created: r.created,
        updated: r.updated,
      }))
    }
  } catch (err) {
    console.warn('Aviso ao buscar studio_projects do PocketBase, usando cache local:', err)
  }

  const local = getLocalProjects()
  if (userId) {
    return local.filter(
      (p) => p.user === userId || (p.collaborators && p.collaborators.includes(userId)),
    )
  }
  return local
}

/**
 * Cria ou salva um projeto do Studio
 */
export async function saveStudioProject(data: Partial<StudioProject>): Promise<StudioProject> {
  const currentUserId = pb.authStore.record?.id || 'current-user'
  const isUpdate = Boolean(data.id && !data.id.startsWith('proj-demo-'))

  const payload: any = {
    title: data.title || 'Novo Canvas Studio',
    description: data.description || '',
    current_type: data.current_type || 'geral',
    prompt: data.prompt || '',
    model_id: data.model_id || '',
    quality_tier: data.quality_tier || 'padrao',
    attached_assets: data.attached_assets || [],
    collaborators: data.collaborators || [],
    collaborator_names: data.collaborator_names || [],
    comments: data.comments || [],
    status: data.status || 'em_andamento',
  }

  if (!isUpdate) {
    payload.user = data.user || currentUserId
  }

  // Atualiza cache local
  const currentLocal = getLocalProjects()
  let localItem: StudioProject

  if (isUpdate && data.id) {
    localItem = {
      ...payload,
      id: data.id,
      user: data.user || currentUserId,
      updated: new Date().toISOString(),
    }
    saveLocalProjects(currentLocal.map((p) => (p.id === data.id ? localItem : p)))
  } else {
    localItem = {
      ...payload,
      id: `proj-${Date.now()}`,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    }
    saveLocalProjects([localItem, ...currentLocal])
  }

  try {
    if (isUpdate && data.id) {
      const updated = await pb.collection('studio_projects').update(data.id, payload)
      return {
        id: updated.id,
        user: updated.user,
        title: updated.title,
        description: updated.description,
        current_type: updated.current_type as StudioMediaType,
        prompt: updated.prompt,
        model_id: updated.model_id,
        quality_tier: updated.quality_tier,
        attached_assets: updated.attached_assets,
        collaborators: updated.collaborators,
        collaborator_names: updated.collaborator_names,
        comments: updated.comments,
        status: updated.status,
        created: updated.created,
        updated: updated.updated,
      }
    } else {
      const created = await pb.collection('studio_projects').create(payload)
      return {
        id: created.id,
        user: created.user,
        title: created.title,
        description: created.description,
        current_type: created.current_type as StudioMediaType,
        prompt: created.prompt,
        model_id: created.model_id,
        quality_tier: created.quality_tier,
        attached_assets: created.attached_assets,
        collaborators: created.collaborators,
        collaborator_names: created.collaborator_names,
        comments: created.comments,
        status: created.status,
        created: created.created,
        updated: created.updated,
      }
    }
  } catch (err) {
    console.warn('Falha ao persistir studio_projects no PocketBase, usando local:', err)
    return localItem
  }
}

/**
 * Adiciona um comentário ao projeto
 */
export async function addCommentToStudioProject(
  projectId: string,
  comment: Omit<StudioProjectComment, 'id' | 'created'>,
): Promise<StudioProjectComment> {
  const newComment: StudioProjectComment = {
    ...comment,
    id: `comm-${Date.now()}`,
    created: new Date().toISOString(),
  }

  const localList = getLocalProjects()
  const proj = localList.find((p) => p.id === projectId)
  if (proj) {
    proj.comments = [...(proj.comments || []), newComment]
    proj.updated = new Date().toISOString()
    saveLocalProjects(localList)
  }

  try {
    const record = await pb.collection('studio_projects').getOne(projectId)
    const existingComments = Array.isArray(record.comments) ? record.comments : []
    const updated = [...existingComments, newComment]
    await pb.collection('studio_projects').update(projectId, {
      comments: updated,
    })
  } catch (err) {
    console.warn('Aviso: comentário salvo localmente:', err)
  }

  return newComment
}

/**
 * Adiciona colaborador a um projeto do Studio
 */
export async function addCollaboratorToStudioProject(
  projectId: string,
  collaboratorId: string,
  collaboratorName: string,
): Promise<boolean> {
  const localList = getLocalProjects()
  const proj = localList.find((p) => p.id === projectId)
  if (proj) {
    const curCols = proj.collaborators || []
    const curNames = proj.collaborator_names || []
    if (!curCols.includes(collaboratorId)) {
      proj.collaborators = [...curCols, collaboratorId]
      proj.collaborator_names = [...curNames, collaboratorName]
      proj.updated = new Date().toISOString()
      saveLocalProjects(localList)
    }
  }

  try {
    const record = await pb.collection('studio_projects').getOne(projectId)
    const curCols = Array.isArray(record.collaborators) ? record.collaborators : []
    const curNames = Array.isArray(record.collaborator_names) ? record.collaborator_names : []

    if (!curCols.includes(collaboratorId)) {
      await pb.collection('studio_projects').update(projectId, {
        collaborators: [...curCols, collaboratorId],
        collaborator_names: [...curNames, collaboratorName],
      })
    }
    return true
  } catch (err) {
    console.warn('Aviso ao sincronizar colaborador no PocketBase:', err)
    return true
  }
}
