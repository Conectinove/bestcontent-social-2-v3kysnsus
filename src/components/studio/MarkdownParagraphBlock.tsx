/**
 * Bloco de PARÁGRAFO do Segundo Cérebro com suporte a Markdown.
 * Padrão da casa (v0.0.290+): subcomponente novo em vez de patch em série no
 * MagicAuthorEditor (arquivo grande — patches incrementais já corromperam 3×).
 * Toggle editar/visualizar por bloco: edição continua texto puro, a visualização
 * renderiza Markdown LEVE PRÓPRIO com escape de HTML (src/lib/markdown-lite.ts).
 * v0.0.294+: toolbar de formatação clicável + INSERIR IMAGEM (URL, upload do
 * dispositivo ou mídia já favoritada) — a prévia renderiza a imagem.
 */
import { useCallback, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Bold,
  Italic,
  Code,
  Link2,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Eye,
  Pencil,
  Image as ImageIcon,
  Upload,
  SlidersHorizontal,
} from 'lucide-react'
import { renderMarkdownLite } from '@/lib/markdown-lite'
import { cn } from '@/lib/utils'
import { listBankAssets, uploadNoteImage } from '@/services/second-brain-media'
import { listSecondBrainFavorites } from '@/services/second-brain-favorites'
import { SecondBrainAdvancedImageEditor } from '@/components/studio/SecondBrainAdvancedImageEditor'
import type { AdvancedCustomizationState } from '@/components/workspace/AdvancedCustomizationPanel'

interface MarkdownParagraphBlockProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

/** Origem da imagem a inserir na nota. */
type ImageSource = 'url' | 'upload' | 'media'

/** Ações da toolbar: wrapa a seleção ou insere a sintaxe no cursor. */
interface ToolbarAction {
  label: string
  icon: typeof Bold
  title: string
  /** wrap: envolve a seleção com before/after; linePrefix: prefixa as linhas. */
  wrap?: { before: string; after: string; placeholder?: string }
  linePrefix?: string
  /** Link: envolve seleção como [texto](url) ou insere modelo. */
  link?: boolean
}

const TOOLBAR_ACTIONS: ToolbarAction[] = [
  {
    label: 'Negrito',
    icon: Bold,
    title: 'Negrito (**texto**)',
    wrap: { before: '**', after: '**', placeholder: 'texto em negrito' },
  },
  {
    label: 'Itálico',
    icon: Italic,
    title: 'Itálico (*texto*)',
    wrap: { before: '*', after: '*', placeholder: 'texto em itálico' },
  },
  {
    label: 'Código',
    icon: Code,
    title: 'Código inline (`código`)',
    wrap: { before: '`', after: '`', placeholder: 'código' },
  },
  { label: 'Link', icon: Link2, title: 'Link ([texto](url))', link: true },
  { label: 'Lista', icon: List, title: 'Lista com marcadores', linePrefix: '- ' },
  { label: 'Lista numerada', icon: ListOrdered, title: 'Lista numerada', linePrefix: '1. ' },
  { label: 'Título 1', icon: Heading1, title: 'Título (#)', linePrefix: '# ' },
  { label: 'Título 2', icon: Heading2, title: 'Subtítulo (##)', linePrefix: '## ' },
  { label: 'Título 3', icon: Heading3, title: 'Título pequeno (###)', linePrefix: '### ' },
]

/** Item de mídia exibido no seletor de imagens do diálogo. */
interface PickerItem {
  id: string
  url: string
  name: string
}

export function MarkdownParagraphBlock({
  content,
  onChange,
  placeholder,
}: MarkdownParagraphBlockProps) {
  const [previewing, setPreviewing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  // Inserir imagem: diálogo com 3 origens (URL, upload do dispositivo, mídias).
  const [imageDialog, setImageDialog] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [mediaTab, setMediaTab] = useState<ImageSource>('url')
  const [pickerItems, setPickerItems] = useState<PickerItem[]>([])
  const [loadingMedia, setLoadingMedia] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Edição avançada ANTES de inserir: ajusta a imagem escolhida com o mesmo
  // motor da grade (filtros, presets, texto) e só depois joga no doc.
  const [editorUrl, setEditorUrl] = useState<string | null>(null)
  const [editorAlt, setEditorAlt] = useState('')
  const [editorCustomization, setEditorCustomization] = useState<AdvancedCustomizationState | null>(
    null,
  )

  /** Abre a Edição Avançada da mídia escolhida (não insere ainda). */
  const openAdvancedEdit = useCallback((url: string, alt = 'imagem') => {
    if (!url) return
    setEditorUrl(url)
    setEditorAlt(alt)
  }, [])

  /** Callback do editor avançado: insere o resultado (rasterizado ou filtro). */
  const handleEditorSave = useCallback(
    (result: {
      editedUrl: string | null
      filter: string
      customization: AdvancedCustomizationState
    }) => {
      // Legenda do alt guarda o filtro aplicado — o preview usa o mesmo motor
      // de CSS via buildBrainImageFilter na renderização da nota.
      const alt = editorAlt || 'imagem'
      const url = result.editedUrl || editorUrl || ''
      setEditorCustomization(result.customization)
      insertImageSnippet(url, alt)
      setEditorUrl(null)
    },
    [editorAlt, editorUrl, insertImageSnippet],
  )

  /** Insere a sintaxe de imagem no cursor (ou no fim). */
  const insertImageSnippet = useCallback(
    (url: string, alt = 'imagem') => {
      const snippet = `![${alt}](${url})`
      const el = textareaRef.current
      const value = content || ''
      if (!el) {
        onChange(`${value}${value && !value.endsWith('\n') ? '\n' : ''}${snippet}`)
        return
      }
      const start = el.selectionStart ?? value.length
      const end = el.selectionEnd ?? value.length
      const needsNlBefore = start > 0 && value[start - 1] !== '\n'
      const next = value.slice(0, start) + (needsNlBefore ? '\n' : '') + snippet + value.slice(end)
      onChange(next)
      const caret = start + (needsNlBefore ? 1 : 0) + snippet.length
      requestAnimationFrame(() => {
        el.focus()
        el.setSelectionRange(caret, caret)
      })
    },
    [content, onChange],
  )

  /** Envia o arquivo escolhido ao PocketBase e insere a URL na nota. */
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingFile(true)
    try {
      const url = await uploadNoteImage(file)
      insertImageSnippet(url, file.name.replace(/\.[^.]+$/, ''))
      setImageDialog(false)
    } catch (err) {
      console.error('Falha ao enviar imagem:', err)
    } finally {
      setUploadingFile(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  /** Carrega as mídias da conta (acervo ou favoritos) para o seletor. */
  const loadMediaForPicker = async (tab: ImageSource) => {
    setMediaTab(tab)
    if (tab === 'url') return
    setLoadingMedia(true)
    try {
      if (tab === 'upload') {
        const assets = await listBankAssets()
        setPickerItems(
          assets
            .filter((a) => a.url)
            .slice(0, 24)
            .map((a) => ({ id: a.id, url: a.url as string, name: a.name || 'Acervo' })),
        )
      } else {
        const favs = await listSecondBrainFavorites()
        setPickerItems(
          favs
            .filter((f) => f.url || f.meta?.url || f.meta?.thumb_url)
            .slice(0, 24)
            .map((f) => ({
              id: `${f.source}:${f.media_id}`,
              url: String(f.meta?.url || f.url || ''),
              name: String(f.meta?.title || f.name || 'Favorito'),
            })),
        )
      }
    } catch {
      setPickerItems([])
    } finally {
      setLoadingMedia(false)
    }
  }

  /** Aplica uma ação da toolbar preservando a posição do cursor. */
  const applyAction = (action: ToolbarAction) => {
    const el = textareaRef.current
    const value = content || ''
    if (!el) {
      // Sem ref (ex.: foco perdido): aplica no fim do texto.
      if (action.link) onChange(`${value}[texto](https://)`)
      else if (action.wrap)
        onChange(
          `${value}${action.wrap.before}${action.wrap.placeholder || ''}${action.wrap.after}`,
        )
      else if (action.linePrefix) onChange(`${value}\n${action.linePrefix}`)
      return
    }
    const start = el.selectionStart ?? value.length
    const end = el.selectionEnd ?? value.length
    const selected = value.slice(start, end)
    let next = value
    let caretStart = start
    let caretEnd = end

    if (action.link) {
      const inner = selected || 'texto do link'
      const snippet = `[${inner}](https://)`
      next = value.slice(0, start) + snippet + value.slice(end)
      caretStart = start + inner.length + 3
      caretEnd = caretStart + 8 // seleciona "https://" para digitar a URL
    } else if (action.wrap) {
      const inner = selected || action.wrap.placeholder || ''
      const snippet = `${action.wrap.before}${inner}${action.wrap.after}`
      next = value.slice(0, start) + snippet + value.slice(end)
      caretStart = start + action.wrap.before.length
      caretEnd = caretStart + inner.length
    } else if (action.linePrefix) {
      // Prefixa cada linha da seleção (ou a linha do cursor).
      const lineStart = value.lastIndexOf('\n', start - 1) + 1
      const lineEnd = value.indexOf('\n', end) === -1 ? value.length : value.indexOf('\n', end)
      const block = value.slice(lineStart, lineEnd)
      const numbered = action.linePrefix.startsWith('1.')
      const prefixed = block
        .split('\n')
        .map((line, i) => {
          if (line.trim() && line.startsWith(action.linePrefix!)) return line // já prefixada
          const p = numbered ? `${i + 1}. ` : action.linePrefix!
          return p + line
        })
        .join('\n')
      next = value.slice(0, lineStart) + prefixed + value.slice(lineEnd)
      caretStart = lineStart
      caretEnd = lineStart + prefixed.length
    }

    onChange(next)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(caretStart, caretEnd)
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] text-slate-500 font-semibold">
          Markdown aceito: **negrito**, *itálico*, `código`, [link](url), ![imagem](url), listas e
          #/##/### títulos
        </p>
        <div className="flex items-center gap-1 shrink-0">
          {previewing && (
            <Badge className="bg-purple-950/60 text-purple-300 border border-purple-800/60 text-[9px] font-bold">
              Visualizando
            </Badge>
          )}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setPreviewing((v) => !v)}
            className="h-6 px-2 text-[10px] font-bold border-slate-700 text-slate-300 hover:text-white gap-1"
          >
            {previewing ? <Pencil className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {previewing ? 'Editar' : 'Visualizar'}
          </Button>
        </div>
      </div>

      {previewing ? (
        <div
          className="prose-invert min-h-16 rounded-xl border border-slate-700/60 bg-slate-800/30 p-4 space-y-2"
          // Conteúdo SEMPRE escapado + sanitizado dentro do parser próprio
          // (renderMarkdownLite escapa todo HTML antes do parse; href só http/s).
          dangerouslySetInnerHTML={{ __html: renderMarkdownLite(content || '') }}
        />
      ) : (
        <div className="space-y-1">
          {/* Toolbar de formatação — insere/wrapa a sintaxe no cursor */}
          <div className="flex flex-wrap items-center gap-0.5 rounded-t-xl border border-slate-700/60 border-b-0 bg-slate-800/60 px-1.5 py-1">
            {TOOLBAR_ACTIONS.map((action, idx) => {
              const Icon = action.icon
              return (
                <span key={action.label} className="flex items-center">
                  {idx === 4 && <span className="w-px h-4 bg-slate-700 mx-1" aria-hidden />}
                  <button
                    type="button"
                    title={action.title}
                    aria-label={action.label}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyAction(action)}
                    className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700/70 transition-colors"
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                </span>
              )
            })}
            <span className="w-px h-4 bg-slate-700 mx-1" aria-hidden />
            <button
              type="button"
              title="Inserir imagem (URL, upload ou mídia da conta)"
              aria-label="Inserir imagem"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                if (previewing) setPreviewing(false)
                setImageDialog(true)
              }}
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700/70 transition-colors"
            >
              <ImageIcon className="w-3.5 h-3.5" />
            </button>
          </div>
          <Textarea
            ref={textareaRef}
            rows={5}
            value={content}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || 'Escreva a nota em Markdown...'}
            className={cn(
              'text-sm bg-slate-800/40 border-slate-700/60 text-white rounded-xl focus:border-purple-500',
              'font-mono leading-relaxed rounded-t-none mt-0',
            )}
          />
          {/* input de arquivo escondido para o upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelected}
          />
        </div>
      )}

      {/* Diálogo de inserir imagem (3 origens) */}
      <Dialog open={imageDialog} onOpenChange={setImageDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm">Inserir imagem na nota</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-1 pb-1">
            {(
              [
                ['url', 'URL'],
                ['upload', 'Upload'],
                ['media', 'Mídias da conta'],
              ] as Array<[ImageSource, string]>
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => loadMediaForPicker(key)}
                className={cn(
                  'px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors',
                  mediaTab === key
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:text-foreground',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {mediaTab === 'url' && (
            <div className="space-y-2">
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://exemplo.com/imagem.jpg"
                className="h-9 text-xs"
              />
              {imageUrl.trim() && (
                <img
                  src={imageUrl.trim()}
                  alt="Prévia"
                  className="max-h-40 rounded-lg border border-border object-contain"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              )}
            </div>
          )}

          {mediaTab === 'upload' && (
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs gap-1.5"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFile}
              >
                <Upload className="w-3.5 h-3.5" />
                {uploadingFile ? 'Enviando...' : 'Escolher arquivo do dispositivo'}
              </Button>
              {pickerItems.length > 0 && (
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                  {pickerItems.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        openAdvancedEdit(m.url, m.name)
                        setImageDialog(false)
                      }}
                      className="rounded-lg overflow-hidden border border-border hover:border-primary/60 transition-colors"
                      title={`${m.name} — clique para editar antes de inserir`}
                    >
                      <img src={m.url} alt={m.name} className="w-full h-16 object-cover" />
                    </button>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-muted-foreground">
                Clique numa imagem para editar (filtros, ajustes, texto) antes de inserir.
              </p>
            </div>
          )}

          {mediaTab === 'media' && (
            <div className="space-y-2">
              {loadingMedia ? (
                <p className="text-xs text-muted-foreground">Carregando mídias...</p>
              ) : pickerItems.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Nenhuma mídia favoritada ainda — favorite itens na grade de mídias para vê-los
                  aqui.
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                  {pickerItems.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        openAdvancedEdit(m.url, m.name)
                        setImageDialog(false)
                      }}
                      className="rounded-lg overflow-hidden border border-border hover:border-primary/60 transition-colors"
                      title={`${m.name} — clique para editar antes de inserir`}
                    >
                      <img src={m.url} alt={m.name} className="w-full h-16 object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => setImageDialog(false)}
            >
              Cancelar
            </Button>
            {mediaTab === 'url' && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1"
                  disabled={!imageUrl.trim()}
                  onClick={() => {
                    openAdvancedEdit(imageUrl.trim(), 'imagem')
                    setImageUrl('')
                    setImageDialog(false)
                  }}
                  title="Abrir a Edição Avançada (filtros, ajustes, texto sobreposto)"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Editar antes de inserir
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="text-xs"
                  disabled={!imageUrl.trim()}
                  onClick={() => {
                    insertImageSnippet(imageUrl.trim(), 'imagem')
                    setImageUrl('')
                    setImageDialog(false)
                  }}
                >
                  Inserir direto
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edição Avançada (motor da grade) antes de inserir no doc */}
      <SecondBrainAdvancedImageEditor
        open={!!editorUrl}
        onOpenChange={(o) => {
          if (!o) setEditorUrl(null)
        }}
        title={editorAlt}
        imageUrl={editorUrl}
        initialCustomization={editorCustomization}
        onSave={handleEditorSave}
      />
    </div>
  )
}
