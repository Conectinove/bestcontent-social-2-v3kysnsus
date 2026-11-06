export interface ExportCommentRow {
  id: string
  platform: 'Instagram' | 'Facebook' | 'Twitter/X' | string
  author_handle: string
  author_name?: string
  text: string
  post_title?: string
  post_permalink?: string
  status?: string
  likes_count?: number
  commented_at?: string
  reply_text?: string
  replied_at?: string | null
  is_official?: boolean
}

/**
 * Exporta comentários em formato CSV com UTF-8 BOM (compatível com Microsoft Excel e Google Planilhas)
 */
export function exportCommentsToCSV(comments: ExportCommentRow[], filename?: string): void {
  const headers = [
    'ID',
    'Rede',
    'Usuário / Handle',
    'Nome do Autor',
    'Texto do Comentário',
    'Post de Origem',
    'Link do Post',
    'Status',
    'Curtidas',
    'Data do Comentário',
    'Texto da Resposta',
    'Data da Resposta',
    'Fonte Oficial',
  ]

  const rows = comments.map((c) => [
    `"${c.id || ''}"`,
    `"${c.platform}"`,
    `"${(c.author_handle || '').replace(/"/g, '""')}"`,
    `"${(c.author_name || '').replace(/"/g, '""')}"`,
    `"${(c.text || '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`,
    `"${(c.post_title || '').replace(/"/g, '""')}"`,
    `"${(c.post_permalink || '').replace(/"/g, '""')}"`,
    `"${c.status || 'novo'}"`,
    c.likes_count || 0,
    `"${c.commented_at || ''}"`,
    `"${(c.reply_text || '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`,
    `"${c.replied_at || ''}"`,
    `"${c.is_official ? 'Sim (API)' : 'Estimativa Calibrada'}"`,
  ])

  // \uFEFF força o Excel a interpretar UTF-8 corretamente
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute(
    'download',
    filename || `comentarios_export_${new Date().toISOString().slice(0, 10)}.csv`,
  )
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Exporta comentários em formato JSON estruturado
 */
export function exportCommentsToJSON(comments: ExportCommentRow[], filename?: string): void {
  const jsonContent = JSON.stringify(
    {
      export_date: new Date().toISOString(),
      total_records: comments.length,
      platform: comments[0]?.platform || 'multi',
      comments,
    },
    null,
    2,
  )
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute(
    'download',
    filename || `comentarios_export_${new Date().toISOString().slice(0, 10)}.json`,
  )
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Exporta comentários em formato Markdown (.md)
 */
export function exportCommentsToMarkdown(
  comments: ExportCommentRow[],
  title = 'Relatório de Comentários e Respostas',
  filename?: string,
): void {
  const dateStr = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  let md = `# ${title}\n\n`
  md += `*Exportado em:* ${dateStr} | *Total de comentários:* ${comments.length}\n\n`
  md += `---\n\n`

  comments.forEach((c, idx) => {
    md += `### ${idx + 1}. @${c.author_handle} (${c.author_name || 'Usuário'}) — ${c.platform}\n`
    md += `- **Post:** ${c.post_title || 'Postagem sem título'}\n`
    if (c.post_permalink) {
      md += `- **Link:** ${c.post_permalink}\n`
    }
    md += `- **Data:** ${c.commented_at || 'Data não informada'} | **Curtidas:** ${c.likes_count || 0}\n`
    md += `- **Status:** \`${c.status.toUpperCase()}\` | **Origem:** ${c.is_official ? 'Dados Oficiais' : 'Calibrada'}\n\n`
    md += `> **Comentário:** "${c.text}"\n\n`

    if (c.reply_text) {
      md += `> **Resposta enviada:** "${c.reply_text}" *(em ${c.replied_at || 'recente'})*\n\n`
    } else {
      md += `*Ainda sem resposta registrada.*\n\n`
    }
    md += `---\n\n`
  })

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute(
    'download',
    filename || `comentarios_export_${new Date().toISOString().slice(0, 10)}.md`,
  )
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
