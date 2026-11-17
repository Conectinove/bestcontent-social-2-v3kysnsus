// Geração de conteúdo Labs via agente nativo "studio-agent" (migration 0129).
// Reusa a MESMA rota do chat (hook studio_agent.js) com instruções embutidas
// na mensagem — sem endpoint hand-rolled novo e sem $ai.chat.
import { ClientResponseError } from 'pocketbase'
import pb, { pb as pbNamed } from '@/lib/pocketbase/client'
// GUARDA: manter o duplo export (default + nomeado pb) — regressão recorrente.
void pbNamed
import { sendStudioAgentChat } from './studio-agent'

export interface LabsAiBlogDraft {
  title: string
  body: string
}

export interface LabsAiEmailDraft {
  subject: string
  body_html: string
}

export interface LabsAiWebSection {
  heading: string
  text: string
}

export interface LabsAiPostDraft {
  caption: string
}

const JSON_RULE = ' Responda SOMENTE com um JSON válido (sem markdown, sem texto fora do JSON).'

/** Extrai o primeiro objeto JSON da resposta do agente (tolera cercas de código). */
function extractJson<T>(raw: string): T {
  const cleaned = raw
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('A resposta da IA não veio no formato esperado. Tente gerar de novo.')
  }
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as T
  } catch {
    // JSON.parse lança SyntaxError em inglês — traduzimos para algo acionável
    throw new Error('A resposta da IA veio corrompida (JSON inválido). Tente gerar de novo.')
  }
}

async function chatJson<T>(message: string): Promise<T> {
  let raw: string
  try {
    const result = await sendStudioAgentChat(message)
    raw = result.content
  } catch (err) {
    if (err instanceof ClientResponseError) {
      // Rota do studio-agent falhou: mensagem em pt-BR e acionável, não genérica
      if (!err.status || err.status === 0) {
        throw new Error('Não foi possível falar com a IA. Verifique sua conexão e tente novamente.')
      }
      throw new Error(
        `O serviço de IA respondeu com erro (${err.status}). Tente novamente em instantes.`,
      )
    }
    throw err
  }
  return extractJson<T>(raw)
}

/** Rascunho de artigo do Blog: título + corpo em texto corrido. */
export async function generateLabsBlogDraft(briefing: string): Promise<LabsAiBlogDraft> {
  const data = await chatJson<LabsAiBlogDraft>(
    `[Gerador de Blog do Labs] Gere um rascunho de artigo de blog a partir do briefing abaixo, em português do Brasil. Devolva {"title": "título curto e atrativo", "body": "corpo do artigo em texto corrido, com parágrafos separados por linha em branco e pelo menos 4 parágrafos, sem markdown de título no início"}.${JSON_RULE}\n\nBriefing: ${briefing}`,
  )
  if (!data.title?.trim() || !data.body?.trim()) {
    throw new Error(
      'A IA não retornou título e corpo completos. Reescreva o briefing e tente de novo.',
    )
  }
  return data
}

/** Assunto + corpo HTML de email a partir de um briefing curto. */
export async function generateLabsEmailDraft(briefing: string): Promise<LabsAiEmailDraft> {
  const data = await chatJson<LabsAiEmailDraft>(
    `[Gerador de Email do Labs] Gere o conteúdo de um email de marketing a partir do briefing abaixo, em português do Brasil. Devolva {"subject": "assunto curto de até 60 caracteres", "body_html": "corpo em HTML simples: estilos inline, largura máxima 600px, fontes de sistema, títulos <h1>/<h2>, parágrafos <p> e no máximo um botão <a> com estilo inline — sem <script>, sem CSS externo"}.${JSON_RULE}\n\nBriefing: ${briefing}`,
  )
  if (!data.subject?.trim() || !data.body_html?.trim()) {
    throw new Error(
      'A IA não retornou assunto e corpo completos. Reescreva o briefing e tente de novo.',
    )
  }
  return data
}

/** Textos de seção (título + parágrafo) para páginas do portal da marca. */
export async function generateLabsWebSections(briefing: string): Promise<LabsAiWebSection[]> {
  const data = await chatJson<{ sections: LabsAiWebSection[] }>(
    `[Gerador de Páginas do Labs] A partir do briefing abaixo, gere os textos de seção de uma página do portal de uma marca, em português do Brasil. Devolva {"sections": [{"heading": "título da seção", "text": "parágrafo da seção com 2 a 4 frases"}]} com 3 a 6 seções cobrindo apresentação, benefícios, prova social e chamada para ação.${JSON_RULE}\n\nBriefing: ${briefing}`,
  )
  const sections = Array.isArray(data.sections) ? data.sections : []
  const clean = sections.filter((s) => s?.heading?.trim() && s?.text?.trim())
  if (clean.length === 0) {
    throw new Error('A IA não retornou seções utilizáveis. Reescreva o briefing e tente de novo.')
  }
  return clean
}

/** Estrutura conteúdo colado/importado em seções de página de portal (título + texto). */
export async function structureImportedSections(
  content: string,
): Promise<{ title: string; sections: LabsAiWebSection[] }> {
  const clipped = content.slice(0, 12000)
  const data = await chatJson<{ title: string; sections: LabsAiWebSection[] }>(
    `[Importador de Conteúdo do Portal] Organize o conteúdo abaixo em uma página de portal, em português do Brasil. Remova menus, navegação, anúncios, rodapés e lixo de copiar/colar. Devolva {"title": "título curto da página", "sections": [{"heading": "título da seção", "text": "parágrafo da seção com 1 a 4 frases"}]} com 2 a 8 seções cobrindo o conteúdo principal.${JSON_RULE}\n\nConteúdo:\n${clipped}`,
  )
  const sections = Array.isArray(data.sections) ? data.sections : []
  const clean = sections.filter((s) => s?.heading?.trim() && s?.text?.trim())
  if (!data.title?.trim() || clean.length === 0) {
    throw new Error(
      'A IA não conseguiu organizar esse conteúdo em seções. Cole um texto maior ou reestruture e tente de novo.',
    )
  }
  return { title: data.title.trim(), sections: clean }
}

/** Importa uma URL por texto extraído no servidor (hook portal_import.js: /backend/v1/portals/import-url). */
export async function fetchUrlText(url: string): Promise<string> {
  const clean = (url || '').trim()
  if (!/^https?:\/\/[^\s]+$/i.test(clean)) {
    throw new Error('Informe uma URL válida começando com http:// ou https://.')
  }
  try {
    const res = await pb.send('/backend/v1/portals/import-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: clean }),
    })
    const text = (res?.text || '').trim()
    if (!text) {
      throw new Error(
        'Não conseguimos extrair texto dessa página (pode ser muito pesada ou bloquear robôs). Cole o conteúdo manualmente.',
      )
    }
    return text
  } catch (err) {
    if (err instanceof Error && !err.message.includes('Failed to fetch')) throw err
    throw new Error(
      'Não foi possível acessar a URL pelo servidor. Verifique o endereço ou cole o conteúdo manualmente.',
    )
  }
}

/** Legenda de post social para a rede escolhida. */
export async function generateLabsPostCaption(
  briefing: string,
  network: string,
): Promise<LabsAiPostDraft> {
  const data = await chatJson<LabsAiPostDraft>(
    `[Gerador de Posts do Labs] Escreva uma legenda de post para ${network} a partir do briefing abaixo, em português do Brasil: gancho forte na primeira linha, texto curto e escaneável e de 3 a 8 hashtags no final. Devolva {"caption": "legenda completa"}.${JSON_RULE}\n\nBriefing: ${briefing}`,
  )
  if (!data.caption?.trim()) {
    throw new Error('A IA não retornou a legenda. Reescreva o briefing e tente de novo.')
  }
  return data
}
