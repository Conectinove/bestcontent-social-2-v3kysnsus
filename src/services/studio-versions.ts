import { pb } from '@/lib/pocketbase/client'
import type { StudioMediaType } from './ai-studio'
import type { StudioProject } from './studio-collaboration'
import { createNotification } from './notifications'

export interface StudioProjectVersionSnapshot {
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
  status?: string
}

export interface StudioProjectVersion {
  id: string
  project_id: string
  version_number: number
  title: string
  description?: string
  author_id?: string
  author_name?: string
  change_summary?: string
  snapshot: StudioProjectVersionSnapshot
  created: string
  updated?: string
  is_official?: boolean
}

const LOCAL_VERSIONS_KEY = 'midiaviva_studio_project_versions'

function getLocalVersions(): StudioProjectVersion[] {
  try {
    const raw = localStorage.getItem(LOCAL_VERSIONS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  return [
    {
      id: 'ver-demo-1',
      project_id: 'proj-demo-1',
      version_number: 1,
      title: 'Versão Inicial - Rascunho de Briefing',
      description: 'Estruturação inicial do roteiro e definição do modelo Kling 4.0',
      author_id: 'user-collab-1',
      author_name: 'Mariana Agência',
      change_summary: 'Criação do projeto com prompt base e formato 9:16',
      snapshot: {
        title: 'Lançamento Coleção Outono MudarCurso',
        description: 'Campanha de vídeo para Reels e anúncios no Meta Ads',
        current_type: 'video',
        prompt: 'Comercial dinâmico com iluminação fria e cortes lentos',
        model_id: 'kling-4-0',
        quality_tier: 'padrao',
        status: 'em_andamento',
      },
      created: new Date(Date.now() - 86400000 * 2).toISOString(),
      is_official: false,
    },
    {
      id: 'ver-demo-2',
      project_id: 'proj-demo-1',
      version_number: 2,
      title: 'Ajuste de Iluminação e Qualidade Ultra',
      description: 'Prompt ajustado com tons quentes dourados e transições velozes',
      author_id: 'user-creator',
      author_name: 'Você (Autor)',
      change_summary: 'Upgrade para tier Ultra e refinamento do gancho de abertura (3s)',
      snapshot: {
        title: 'Lançamento Coleção Outono MudarCurso',
        description: 'Campanha de vídeo para Reels e anúncios no Meta Ads',
        current_type: 'video',
        prompt: 'Comercial dinâmico com iluminação dourada e transições rápidas',
        model_id: 'kling-4-0',
        quality_tier: 'ultra',
        status: 'em_andamento',
      },
      created: new Date(Date.now() - 3600000 * 6).toISOString(),
      is_official: false,
    },
  ]
}

function saveLocalVersions(list: StudioProjectVersion[]) {
  try {
    localStorage.setItem(LOCAL_VERSIONS_KEY, JSON.stringify(list))
  } catch {
    /* ignore */
  }
}

/**
 * Lista versões de um projeto específico do Studio
 */
export async function getStudioProjectVersions(
  projectId: string,
): Promise<{ versions: StudioProjectVersion[]; isOfficial: boolean }> {
  try {
    const records = await pb.collection('studio_project_versions').getFullList({
      filter: `project_id = "${projectId}"`,
      sort: '-version_number',
      requestKey: null,
    })

    if (records.length > 0) {
      const mapped: StudioProjectVersion[] = records.map((r: any) => ({
        id: r.id,
        project_id: r.project_id,
        version_number: Number(r.version_number) || 1,
        title: r.title || `Versão v${r.version_number}`,
        description: r.description || '',
        author_id: r.author_id,
        author_name: r.author_name || 'Membro do Time',
        change_summary: r.change_summary || '',
        snapshot: (typeof r.snapshot === 'string' ? JSON.parse(r.snapshot) : r.snapshot) || {},
        created: r.created,
        updated: r.updated,
        is_official: true,
      }))
      return { versions: mapped, isOfficial: true }
    }
  } catch (err) {
    console.warn('Aviso ao carregar versões do PocketBase, usando cache calibrado:', err)
  }

  const local = getLocalVersions().filter((v) => v.project_id === projectId)
  return { versions: local, isOfficial: false }
}

/**
 * Cria um novo snapshot de versão para o projeto
 */
export async function createStudioProjectVersion(params: {
  project: StudioProject
  title?: string
  description?: string
  changeSummary?: string
}): Promise<StudioProjectVersion> {
  const { project, title, description, changeSummary } = params
  const currentUserId = pb.authStore.record?.id || 'current-user'
  const currentUserName =
    (pb.authStore.record as any)?.name || (pb.authStore.record as any)?.username || 'Você (Autor)'

  // Determinar próximo número de versão
  const existingLocal = getLocalVersions()
  const projectVersions = existingLocal.filter((v) => v.project_id === project.id)
  const nextVersionNumber =
    projectVersions.length > 0 ? Math.max(...projectVersions.map((v) => v.version_number)) + 1 : 1

  const snapshot: StudioProjectVersionSnapshot = {
    title: project.title,
    description: project.description,
    current_type: project.current_type,
    prompt: project.prompt,
    model_id: project.model_id,
    quality_tier: project.quality_tier,
    attached_assets: project.attached_assets || [],
    status: project.status,
  }

  const versionTitle = title || `Snapshot v${nextVersionNumber} — ${project.title.slice(0, 32)}`
  const summary = changeSummary || `Atualização em ${new Date().toLocaleDateString('pt-BR')}`

  const newVersion: StudioProjectVersion = {
    id: `ver-${Date.now()}`,
    project_id: project.id,
    version_number: nextVersionNumber,
    title: versionTitle,
    description: description || '',
    author_id: currentUserId,
    author_name: currentUserName,
    change_summary: summary,
    snapshot,
    created: new Date().toISOString(),
    is_official: false,
  }

  saveLocalVersions([newVersion, ...existingLocal])

  // Dispara notificação no sistema para o autor e colaboradores do projeto
  try {
    const notifyUsers = new Set<string>()
    if (currentUserId && currentUserId !== 'current-user') {
      notifyUsers.add(currentUserId)
    }
    if (project.collaborators && Array.isArray(project.collaborators)) {
      project.collaborators.forEach((c: any) => {
        const uid = typeof c === 'string' ? c : c?.user_id || c?.id
        if (uid) notifyUsers.add(uid)
      })
    }

    // Se o set estiver vazio (usuário anônimo/preview), tenta pegar do authStore
    const fallbackUser = pb.authStore.record?.id
    if (notifyUsers.size === 0 && fallbackUser) {
      notifyUsers.add(fallbackUser)
    }

    notifyUsers.forEach((targetUserId) => {
      createNotification({
        user: targetUserId,
        type: 'approval_flow',
        actor_name: currentUserName,
        message: `Nova versão v${nextVersionNumber} criada no projeto "${project.title}": ${versionTitle}.`,
      }).catch((e) => console.warn('Erro ao notificar versão:', e))
    })
  } catch (notifErr) {
    console.warn('Aviso ao gerar notificação de nova versão:', notifErr)
  }

  try {
    const payload = {
      project_id: project.id,
      version_number: nextVersionNumber,
      title: versionTitle,
      description: description || '',
      author_id: currentUserId,
      author_name: currentUserName,
      change_summary: summary,
      snapshot,
    }
    const created = await pb.collection('studio_project_versions').create(payload)
    return {
      ...newVersion,
      id: created.id,
      created: created.created,
      is_official: true,
    }
  } catch (err) {
    console.warn('Aviso: versão salva localmente com fallback:', err)
    return newVersion
  }
}

/**
 * Restaura um projeto a partir do snapshot de uma versão
 */
export function buildRestoredProjectData(
  currentProject: StudioProject,
  version: StudioProjectVersion,
): StudioProject {
  const { snapshot } = version
  return {
    ...currentProject,
    title: snapshot.title || currentProject.title,
    description:
      snapshot.description !== undefined ? snapshot.description : currentProject.description,
    current_type: snapshot.current_type || currentProject.current_type,
    prompt: snapshot.prompt !== undefined ? snapshot.prompt : currentProject.prompt,
    model_id: snapshot.model_id !== undefined ? snapshot.model_id : currentProject.model_id,
    quality_tier:
      snapshot.quality_tier !== undefined ? snapshot.quality_tier : currentProject.quality_tier,
    attached_assets: snapshot.attached_assets || currentProject.attached_assets,
    status: (snapshot.status as any) || currentProject.status,
    updated: new Date().toISOString(),
  }
}

// Aliases para conveniência e compatibilidade com modais
export type StudioProjectVersionRecord = StudioProjectVersion

export async function listProjectVersions(projectId: string): Promise<StudioProjectVersion[]> {
  const res = await getStudioProjectVersions(projectId)
  return res.versions
}

export async function createProjectVersion(params: {
  projectId: string
  title: string
  changeNotes?: string
  change_summary?: string
  snapshotData?: Record<string, any>
  snapshot?: StudioProjectVersionSnapshot | Record<string, any>
  authorId?: string
  author_id?: string
  authorName?: string
  author_name?: string
}): Promise<StudioProjectVersion> {
  const summary = params.change_summary || params.changeNotes || ''
  const snapRaw = (params.snapshot || params.snapshotData || {}) as Record<string, any>
  const pseudoProject: StudioProject = {
    id: params.projectId,
    title: params.title,
    description: summary,
    current_type: (snapRaw.current_type || snapRaw.activeTab || 'video') as any,
    prompt: snapRaw.prompt || '',
    model_id: snapRaw.model_id || snapRaw.canvasSettings?.selectedModel?.id || 'kling-4-0',
    quality_tier: snapRaw.quality_tier || 'padrao',
    attached_assets: snapRaw.attached_assets || snapRaw.uploadedAssets || [],
    collaborators: [],
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    status: snapRaw.status || 'em_andamento',
  }
  return createStudioProjectVersion({
    project: pseudoProject,
    title: params.title,
    description: summary,
    changeSummary: summary,
  })
}

export async function restoreProjectVersion(
  version: StudioProjectVersion,
): Promise<StudioProjectVersion> {
  const currentUserId = pb.authStore.record?.id
  const currentUserName =
    (pb.authStore.record as any)?.name || (pb.authStore.record as any)?.username || 'Equipe Studio'

  if (currentUserId) {
    createNotification({
      user: currentUserId,
      type: 'approval_flow',
      actor_name: currentUserName,
      message: `Versão v${version.version_number} ("${version.title}") foi restaurada no projeto do Studio.`,
    }).catch(() => {})
  }

  return version
}
