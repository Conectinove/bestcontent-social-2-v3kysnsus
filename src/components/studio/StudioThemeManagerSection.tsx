/**
 * Seção "Temas de marca" na tela de Configurações (aba Aparência).
 * Gerencia temas personalizados: criar do zero (editor completo), importar
 * arquivo JSON, exportar, editar e excluir — com pré-visualização de cada tema.
 */
import { useRef, useState } from 'react'
import { Check, Download, Palette, Pencil, Plus, Trash2, Upload } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAppTheme, type StudioThemeOption } from '@/hooks/use-app-theme'
import { ThemePreviewCard } from '@/components/studio/ThemePreviewCard'
import { ThemeEditorDialog } from '@/components/studio/ThemeEditorDialog'
import { downloadThemeFile, pickThemeFile, parseThemeFile } from '@/lib/theme-file'

export function StudioThemeManagerSection() {
  const {
    themes,
    themeId,
    setThemeId,
    addCustomTheme,
    updateCustomTheme,
    importTheme,
    removeCustomTheme,
    startPreview,
    cancelPreview,
  } = useAppTheme()

  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<StudioThemeOption | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const customOnly = themes.filter((t) => t.source === 'custom')

  const openCreate = () => {
    setEditing(null)
    setEditorOpen(true)
  }

  const openEdit = (t: StudioThemeOption) => {
    setEditing(t)
    setEditorOpen(true)
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

      {customOnly.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-xs text-muted-foreground">
          Nenhum tema personalizado ainda. Crie um tema do zero definindo todas as cores, ou importe
          um arquivo de tema exportado do MidiaViva.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {customOnly.map((t) => (
            <div
              key={t.id}
              className="group relative rounded-lg border p-2 transition-colors hover:border-primary/40"
              onMouseEnter={() => startPreview(t.id)}
              onMouseLeave={cancelPreview}
            >
              <ThemePreviewCard theme={t} active={t.id === themeId} compact />
              <div className="mt-2 flex items-center gap-1">
                <span className="min-w-0 flex-1 truncate text-xs font-medium">{t.name}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
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
                {t.origin === 'mine' && t.remoteId && (
                  <>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => openEdit(t)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-destructive"
                      onClick={() => removeCustomTheme(t.id)}
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
                    onClick={() => setThemeId(t.id)}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                )}
              </div>
              {t.scope === 'personal' && (
                <span className="absolute left-2 top-2 rounded bg-black/60 px-1 text-[9px] font-bold uppercase text-white">
                  só p/ mim
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Temas marcados como <strong>só p/ mim</strong> aplicam apenas à sua conta. Use o seletor no
        Header para alternar o escopo (equipe × pessoal) e compartilhar temas com a equipe.
      </p>

      <ThemeEditorDialog
        open={editorOpen}
        onOpenChange={(open) => {
          setEditorOpen(open)
          if (!open) cancelPreview()
        }}
        editing={editing}
        onSaveComplete={(created) => {
          if (created) setThemeId(created.id)
        }}
        addCustomTheme={addCustomTheme}
        updateCustomTheme={updateCustomTheme}
        startPreview={startPreview}
        cancelPreview={cancelPreview}
      />
    </div>
  )
}

export default StudioThemeManagerSection
