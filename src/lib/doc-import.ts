/**
 * Utilitário de importação de conteúdo para o Segundo Cérebro.
 * Lê arquivos .md / .markdown / .txt como texto puro e extrai texto de .docx
 * (DOCX é um ZIP: descomprimimos word/document.xml com DecompressionStream
 * nativo do browser — sem dependências externas — e coletamos os nós <w:t>).
 */

export interface ParsedImport {
  title: string
  content: string
  kind: 'md' | 'txt' | 'docx'
}

const SUPPORTED_RE = /\.(md|markdown|txt|docx)$/i

export function isSupportedImportFile(file: File): boolean {
  return SUPPORTED_RE.test(file.name) || file.type === 'text/plain'
}

export async function parseImportFile(file: File): Promise<ParsedImport> {
  const name = file.name.toLowerCase()
  if (name.endsWith('.docx')) {
    const content = await extractDocxText(file)
    return { title: file.name.replace(/\.docx$/i, ''), content, kind: 'docx' }
  }
  const text = await file.text()
  const kind: 'md' | 'txt' = /\.(md|markdown)$/i.test(name) ? 'md' : 'txt'
  return { title: file.name.replace(/\.(md|markdown|txt)$/i, ''), content: text, kind }
}

async function extractDocxText(file: File): Promise<string> {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('O navegador não suporta extração de DOCX (DecompressionStream ausente).')
  }
  const buf = await file.arrayBuffer()
  const stream = new Blob([buf]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
  const xml = await new Response(stream).text()
  return extractTextFromDocxXml(xml)
}

function extractTextFromDocxXml(xml: string): string {
  // Cada parágrafo termina em </w:p>; o texto visível vive em nós <w:t>
  const paragraphs = xml.split('</w:p>')
  const lines: string[] = []
  for (const para of paragraphs) {
    const texts: string[] = []
    const re = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g
    let m: RegExpExecArray | null
    while ((m = re.exec(para)) !== null) {
      texts.push(m[1])
    }
    if (texts.length === 0) continue
    const line = texts
      .join('')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&')
      .trim()
    if (line) lines.push(line)
  }
  return lines.join('\n\n')
}
