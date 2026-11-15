/**
 * Seção "Temas de marca" na tela de Configurações (aba Aparência).
 * Gerencia temas personalizados: criar do zero (editor completo), importar
 * arquivo JSON, exportar, editar e excluir — com pré-visualização de cada tema.
 *
 * GERENCIADOR DE TEMAS DA EQUIPE: admin/gestor (isTeamThemeManager) vê também
 * os temas compartilhados pela equipe (teamThemes) e pode editar/excluir temas
 * de outros membros (regras de update/delete da coleção já permitem admin da
 * mesma company) e definir o "Padrão da org" (is_org_default — um só por org).
 * Sem permissão, os temas da equipe ficam só em visualização com badge de dono.
 */
import { useMemo, useRef, useState } from 'react'
import {
  BadgeCheck,
  Check,
  Crown,
  Download,
  Loader2,
  Palette,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { useSocial } from '@/context/SocialContext'
import { Button } from '@/components/ui/button'
import { useAppTheme, type StudioThemeOption } from '@/hooks/use-app-theme'
import type { Brand } from '@/types'
import type { NetworkThemeId } from '@/lib/network-themes'
import { ThemePreviewCard } from '@/components/studio/ThemePreviewCard'
import { ThemeEditorDialog } from '@/components/studio/ThemeEditorDialog'
import { NetworkThemePresets } from '@/components/studio/NetworkThemePresets'
import { downloadThemeFile, pickThemeFile, parseThemeFile } from '@/lib/theme-file'
import {
  currentCompany,
  deleteStudioTheme,
  isTeamThemeManager,
  setStudioThemeOrgDefault,
  updateStudioTheme,
} from '@/services/studio-themes'

export function StudioThemeManagerSection() {
  const { brands } = useSocial() as { brands: Brand[] }
  const {
    customThemes,
    teamThemes,
    themeId,
    setThemeId,
    addCustomTheme,
    updateCustomTheme,
    importTheme,
    removeCustomTheme,
    startPreview,
    cancelPreview,
    isSaving,
  } = useAppTheme(brands)

  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<StudioThemeOption | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Estado local (sobrepõe o do hook) para edits/exclusões de temas de
  // terceiros e o "Padrão da org" — o realtime do hook re-busca e confirma.
  const [teamEdits, setTeamEdits] = useState<Record<string, StudioThemeOption>>({})
  const [deletedRemoteIds, setDeletedRemoteIds] = useState<Set<string>>(new Set())
  const [orgDefaultId, setOrgDefaultId] = useState<string | null>(null)

  const isManager = useMemo(() => isTeamThemeManager(), [])

  const customOnly = customThemes.filter((t) => t.source === 'custom')
  const teamOnly = useMemo(
    () =>
      teamThemes
        .filter((t) => t.remoteId && !deletedRemoteIds.has(t.remoteId))
        .map((t) => teamEdits[t.remoteId!] || t),
    [teamThemes, teamEdits, deletedRemoteIds],
  )

  /** Tema pode ser editado/excluído por quem está logado. */
  const canManage = (t: StudioThemeOption) =>
    t.origin === 'mine' || (isManager && t.origin === 'team' && t.scope !== 'personal')

  const openCreate = () => {
    setEditing(null)
    setEditorOpen(true)
  }

  const openEdit = (t: StudioThemeOption) => {
    setEditing(t)
    setEditorOpen(true)
  }

  /** Exclui tema (dono ou admin em tema de terceiro) — remoto + estado local. */
  const handleDeleteTeamTheme = async (t: StudioThemeOption) => {
    if (!t.remoteId) return
    setBusyId(t.id)
    try {
      await deleteStudioTheme(t.remoteId)
      setDeletedRemoteIds((prev) => new Set(prev).add(t.remoteId!))
      setTeamEdits((prev) => {
        const next = { ...prev }
        delete next[t.remoteId!]
        return next
      })
      toast({ title: 'Tema excluído', description: `"${t.name}" foi removido da equipe.` })
    } catch (e) {
      toast({
        title: 'Erro ao excluir',
        description: e instanceof Error ? e.message : 'Falha inesperada.',
        variant: 'destructive',
      })
    } finally {
      setBusyId(null)
    }
  }

  /** Define o tema como padrão da organização (is_org_default). */
  const handleSetOrgDefault = async (t: StudioThemeOption) => {
    if (!t.remoteId) return
    setBusyId(t.id)
    try {
      await setStudioThemeOrgDefault(t.remoteId, currentCompany(), true)
      setOrgDefaultId(t.remoteId)
      toast({
        title: 'Padrão da org definido',
        description: `"${t.name}" agora é o tema padrão da organização.`,
      })
    } catch (e) {
      toast({
        title: 'Erro ao definir padrão',
        description: e instanceof Error ? e.message : 'Falha inesperada.',
        variant: 'destructive',
      })
    } finally {
      setBusyId(null)
    }
  }

  /** Salva edição de tema de TERCEIRO (admin) direto na API, pelo remoteId. */
  const handleTeamEditSubmit = async (input: {
    name: string
    colors: StudioThemeOption['colors']
    network?: string | null
    scope: 'team' | 'personal'
  }) => {
    const target = editing
    if (!target?.remoteId) return
    setBusyId(target.id)
    try {
      const saved = await updateStudioTheme(target.remoteId, {
        name: input.name,
        colors: input.colors,
        network: input.network ?? null,
        scope: input.scope,
        isShared: input.scope === 'team',
      })
      setTeamEdits((prev) => ({ ...prev, [target.remoteId!]: saved }))
      toast({ title: `Tema "${input.name}" atualizado` })
    } catch (e) {
      toast({
        title: 'Erro ao salvar tema da equipe',
        description: e instanceof Error ? e.message : 'Falha inesperada.',
        variant: 'destructive',
      })
      throw e
    } finally {
      setBusyId(null)
    }
  }

  const handleImport = async (file: File) => {
    const raw = await file.text()
    const parsed = parseThemeFile(raw)
    if (!parsed.ok || !parsed.input) {
      toast({
        title: 'Arquivo inválido',
        description: parsed.error || 'Não foi possível ler o tema do arquivo.',
        variant: 'destructive',
      })
      return
    }
    try {
      const created = await importTheme(parsed.input)
      setThemeId(created.id)
      toast({ title: 'Tema importado!', description: `"${created.name}" já está disponível.` })
    } catch (e) {
      toast({
        title: 'Erro ao importar',
        description: e instanceof Error ? e.message : 'Falha inesperada.',
        variant: 'destructive',
      })
    }
  }

  const renderThemeCard = (t: StudioThemeOption, isTeam: boolean) => {
    const isOrgDefault = Boolean(t.isOrgDefault) || t.remoteId === orgDefaultId
    const manageable = canManage(t)
    return (
      <div
        key={`${t.source}-${t.id}`}
        className="group relative rounded-lg border p-2 transition-colors hover:border-primary/40"
        onMouseEnter={() => startPreview(t.id)}
        onMouseLeave={cancelPreview}
      >
        <ThemePreviewCard theme={t} active={t.id === themeId} compact />
        <div className="mt-2 flex items-center gap-1">
          <span className="min-w-0 flex-1 truncate text-xs font-medium" title={t.name}>
            {t.name}
          </span>
          {busyId === t.id && (
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-primary" />
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            title={`Exportar ${t.name}.json`}
            onClick={() => {
              if (downloadThemeFile(t)) {
                toast({ title: 'Tema exportado', description: `${t.name}.json baixado.` })
              } else {
                toast({
                  title: 'Não exportável',
                  description: 'Este tema não tem cores hex definidas.',
                  variant: 'destructive',
                })
              }
            }}
          >
            <Download className="h-3 w-3" />
          </Button>
          {manageable && (
            <>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                title={`Editar ${t.name}`}
                onClick={() => openEdit(t)}
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-destructive"
                title={`Excluir ${t.name}`}
                onClick={() => {
                  if (isTeam && t.origin === 'team') void handleDeleteTeamTheme(t)
                  else void removeCustomTheme(t.id)
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </>
          )}
          {t.id !== themeId && (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              title={`Aplicar ${t.name}`}
              onClick={() => setThemeId(t.id)}
            >
              <Check className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Padrão da org: badge + botão de definir (só para quem gerencia) */}
        <div className="mt-1.5 flex items-center gap-1">
          {isOrgDefault ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary">
              <Crown className="h-2.5 w-2.5" /> Padrão da org
            </span>
          ) : (
            isManager &&
            t.remoteId && (
              <Button
                size="sm"
                variant="ghost"
                className="h-5 gap-1 rounded-full px-1.5 py-0 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground"
                disabled={busyId === t.id}
                onClick={() => void handleSetOrgDefault(t)}
              >
                <BadgeCheck className="h-2.5 w-2.5" /> Definir padrão da org
              </Button>
            )
          )}
          {isTeam && t.origin === 'team' && (
            <span className="ml-auto max-w-[45%] truncate text-right text-[9px] text-muted-foreground">
              {t.ownerName ? `de ${t.ownerName}` : 'da equipe'}
            </span>
          )}
        </div>
        {t.scope === 'personal' && (
          <span className="absolute left-2 top-2 rounded bg-black/60 px-1 text-[9px] font-bold uppercase text-white">
            só p/ mim
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Temas de marca</h3>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void handleImport(f)
              e.target.value = ''
            }}
          />
          <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-3.5 w-3.5" />
            Importar
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" />
            Criar tema
          </Button>
        </div>
      </div>

      {customOnly.length === 0 && teamOnly.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-xs text-muted-foreground">
          Nenhum tema personalizado ainda. Crie um tema do zero definindo todas as cores, ou importe
          um arquivo de tema exportado do MidiaViva.
        </p>
      ) : (
        <>
          {customOnly.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {customOnly.map((t) => renderThemeCard(t, false))}
            </div>
          )}

          {teamOnly.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground">
                Temas da equipe{' '}
                {isManager && (
                  <span className="font-normal">
                    — você gerencia os temas compartilhados (editar, excluir, padrão da org)
                  </span>
                )}
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {teamOnly.map((t) => renderThemeCard(t, true))}
              </div>
            </div>
          )}
        </>
      )}

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Temas marcados como <strong>só p/ mim</strong> aplicam apenas à sua conta. Use o seletor no
        Header para alternar o escopo (equipe × pessoal) e compartilhar temas com a equipe.
      </p>

      <NetworkThemePresets brands={brands} />

      <ThemeEditorDialog
        open={editorOpen}
        onOpenChange={(open) => {
          setEditorOpen(open)
          if (!open) {
            setEditing(null)
            cancelPreview()
          }
        }}
        editing={editing}
        isSaving={isSaving || busyId !== null}
        onSubmit={async (input) => {
          if (editing) {
            // Tema de terceiro (admin): API direta pelo remoteId — o
            // updateCustomTheme do hook só procura em customThemes.
            if (editing.origin === 'team') {
              await handleTeamEditSubmit(input)
            } else {
              await updateCustomTheme(editing.id, input)
              toast({ title: `Tema "${input.name}" atualizado` })
            }
          } else {
            await addCustomTheme({
              name: input.name,
              colors: input.colors,
              network: (input.network as NetworkThemeId) || 'none',
              scope: input.scope,
              isShared: input.scope === 'team',
            })
            toast({ title: `Tema "${input.name}" criado e aplicado` })
          }
          setEditing(null)
        }}
      />
    </div>
  )
}

export default StudioThemeManagerSection
