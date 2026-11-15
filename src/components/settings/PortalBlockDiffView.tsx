/**
 * Comparação lado a lado entre duas versões de uma página do portal
 * (pedido "comparar versoes lado a lado"). Renderiza cada versão com o
 * PortalBlockView (o mesmo motor da página pública) em modo simplificado
 * (vídeo vira placeholder, CTA não navega) e marca blocos que diferem.
 */
import { useMemo } from 'react'
import { GitCompareArrows, Video } from 'lucide-react'
import { PortalBlockView, toVideoEmbedUrl } from '@/pages/BrandPortalPage'
import type { PortalBlock, PortalPageContent } from '@/services/portal-pages'

interface Props {
  contentA: PortalPageContent | null // esquerda (versão mais antiga / atual, conforme a escolha)
  contentB: PortalPageContent | null // direita
  labelA: string
  labelB: string
  accent: string
}

function blockKey(b: PortalBlock, i: number): string {
  return (
    [b.type, b.text || '', b.url || '', b.author || '', b.height || '', (b.urls || []).length].join(
      '|',
    ) + `#${i}`
  )
}

/** Assinatura estável da lista de blocos — igual nas duas versões = sem diferença. */
function blocksSignature(blocks: PortalBlock[]): string {
  return blocks.map(blockKey).join('\u0001')
}

function collectMediaIds(blocks: PortalBlock[]): string[] {
  return blocks.filter((b) => b.type === 'video' && b.mediaId).map((b) => String(b.mediaId))
}

export function PortalBlockDiffView({ contentA, contentB, labelA, labelB, accent }: Props) {
  const blocksA = contentA?.blocks || []
  const blocksB = contentB?.blocks || []

  const sigA = useMemo(() => blocksSignature(blocksA), [blocksA])
  const sigB = useMemo(() => blocksSignature(blocksB), [blocksB])
  const identical = sigA === sigB

  // Vídeos da versão mais recente que ainda não tiveram play registrado
  // (informação auxiliar exibida sob os painéis).
  const mediaIds = useMemo(
    () => Array.from(new Set([...collectMediaIds(blocksA), ...collectMediaIds(blocksB)])),
    [blocksA, blocksB],
  )

  const renderPanel = (blocks: PortalBlock[], label: string) => (
    <div className="flex-1 min-w-0 rounded-lg border border-border/70 bg-background p-4 space-y-3 overflow-hidden">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-muted-foreground truncate">{label}</span>
        <span className="text-[10px] text-muted-foreground shrink-0">{blocks.length} blocos</span>
      </div>
      {blocks.length === 0 && (
        <p className="text-[11px] text-muted-foreground italic">Página vazia nesta versão.</p>
      )}
      {blocks.map((block, i) => (
        <div key={i} className="scale-[0.92] origin-top-left pointer-events-none select-none">
          <PortalBlockView block={block} accent={accent} />
        </div>
      ))}
    </div>
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <GitCompareArrows className="w-4 h-4 text-primary" />
        <p className="text-xs font-bold">Comparação lado a lado</p>
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
            identical
              ? 'border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
              : 'border-amber-500/30 text-amber-700 dark:text-amber-400'
          }`}
        >
          {identical ? 'Conteúdo idêntico' : 'Conteúdo diferente'}
        </span>
      </div>
      <div className="flex flex-col md:flex-row gap-3">
        {renderPanel(blocksA, labelA)}
        {renderPanel(blocksB, labelB)}
      </div>
      {mediaIds.length > 0 && (
        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Video className="w-3 h-3" />
          {mediaIds.length} vídeo{mediaIds.length > 1 ? 's' : ''} próprio
          {mediaIds.length > 1 ? 's' : ''} no conteúdo comparado.
        </p>
      )}
    </div>
  )
}

export { toVideoEmbedUrl }
