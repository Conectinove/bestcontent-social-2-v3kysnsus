/**
 * Export do histórico de versões da página do portal (pedido "mostrar
 * anotações no histórico de versões exportado"): prévia de impressão
 * (window.print → "Salvar como PDF") listando cada versão com data, resumo
 * dos blocos e a ANOTAÇÃO (note) da versão — o foco do pedido. Fallback:
 * popup bloqueado → baixa CSV com as mesmas colunas.
 */
import type { PortalPageVersion } from '@/services/portal-page-versions'
import type { PortalPageContent } from '@/services/portal-pages'

const BLOCK_LABELS: Record<string, string> = {
  heading: 'Título',
  text: 'Texto',
  image: 'Imagem',
  video: 'Vídeo',
  button: 'Botão',
  divider: 'Divisor',
  gallery: 'Galeria',
  quote: 'Citação',
  cta: 'CTA',
}

function escHtml(s: string): string {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function fmtDate(iso: string): string {
  try {
    return new Date(String(iso).replace(' ', 'T')).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

/** Resumo curto dos blocos da versão ("3 blocos: Título, Texto, Vídeo"). */
export function summarizeVersion(v: PortalPageVersion): string {
  const blocks = v.content?.blocks
  if (!Array.isArray(blocks) || blocks.length === 0) return 'Sem blocos de conteúdo'
  const kinds = blocks.slice(0, 6).map((b) => BLOCK_LABELS[String(b?.type || '')] || 'Bloco')
  const label = kinds.join(', ')
  return blocks.length > 6
    ? `${kinds.length}+ blocos: ${label}…`
    : `${blocks.length} bloco${blocks.length === 1 ? '' : 's'}: ${label}`
}

function csvEscape(value: string): string {
  const v = value ?? ''
  return /[",;\n]/.test(v) ? `"${v.replace(/"/g, '""')}` + '"' : v
}

/** CSV do histórico (fallback do print): Versão;Data;Blocos;Nota. */
export function buildVersionsCsv(versions: PortalPageVersion[], pageTitle: string): string {
  const lines: string[] = []
  lines.push(`Historico de versoes;${pageTitle || 'Pagina'}`)
  lines.push(`Gerado em;${new Date().toISOString()}`)
  lines.push('')
  lines.push('Versao;Data;Resumo dos blocos;Anotacao')
  for (const v of versions) {
    lines.push(
      [
        v.version <= 1 ? 'Criacao' : `Versao ${v.version}`,
        fmtDate(v.created),
        summarizeVersion(v),
        v.note || '',
      ]
        .map(csvEscape)
        .join(';'),
    )
  }
  return lines.join('\n')
}

function downloadCsv(csv: string, pageTitle: string): void {
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `historico-versoes-${pageTitle || 'pagina'}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/** Prévia de impressão do histórico de versões (com as anotações). */
export function printVersionsHistory(
  versions: PortalPageVersion[],
  pageTitle: string,
  accent = '#4f46e5',
): void {
  const rows = versions
    .map(
      (v) => `<tr>
        <td><strong>${escHtml(v.version <= 1 ? 'Criação' : `Versão ${v.version}`)}</strong></td>
        <td>${fmtDate(v.created)}</td>
        <td>${escHtml(summarizeVersion(v))}</td>
        <td>${v.note ? `<div class="note">${escHtml(v.note)}</div>` : '<span class="muted">—</span>'}</td>
      </tr>`,
    )
    .join('')

  const withNotes = versions.filter((v) => v.note).length

  const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8" />
<title>Histórico de versões — ${escHtml(pageTitle || 'Página')}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; color: #111; margin: 32px; }
  h1 { font-size: 20px; margin: 0 0 2px; }
  .sub { color: #555; font-size: 12px; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { text-align: left; background: #f3f4f6; padding: 6px 8px; border: 1px solid #e5e7eb; font-size: 10px; text-transform: uppercase; letter-spacing: .03em; }
  td { padding: 6px 8px; border: 1px solid #e5e7eb; vertical-align: top; }
  .note { background: #fffbeb; border-left: 3px solid ${accent}; padding: 4px 8px; border-radius: 4px; font-size: 11px; }
  .muted { color: #999; }
  @media print { body { margin: 12mm; } tr { page-break-inside: avoid; } }
</style></head><body>
  <h1>Histórico de versões da página</h1>
  <div class="sub">${escHtml(pageTitle || 'Página')} · ${versions.length} versão${versions.length === 1 ? '' : 'es'} · ${withNotes} com anotação · gerado em ${new Date().toLocaleString('pt-BR')}</div>
  ${
    rows
      ? `<table><thead><tr><th>Versão</th><th>Data</th><th>Resumo dos blocos</th><th>Anotação</th></tr></thead><tbody>${rows}</tbody></table>`
      : '<p class="muted">Nenhuma versão salva ainda.</p>'
  }
  <script>window.onload = function () { setTimeout(function () { window.print() }, 250) }</script>
</body></html>`

  const w = window.open('', '_blank', 'width=900,height=700')
  if (!w) {
    // Bloqueio de pop-up: baixa o CSV com as mesmas informações (padrão da casa).
    downloadCsv(buildVersionsCsv(versions, pageTitle), pageTitle)
    return
  }
  w.document.open()
  w.document.write(html)
  w.document.close()
}
