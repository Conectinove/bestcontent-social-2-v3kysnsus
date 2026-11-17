// Geração de conteúdo Labs via agente nativo "studio-agent" (migration 0129).
// Reusa a MESMA rota do chat (hook studio_agent.js) com instruções embutidas
// na mensagem — sem endpoint hand-rolled novo e sem $ai.chat.
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
    throw new Error('A resposta da IA não veio no formato esperado.')
  }
  return JSON.parse(cleaned.slice(start, end + 1)) as T
}

async function chatJson<T>(message: string): Promise<T> {
  const result = await sendStudioAgentChat(message)
  return extractJson<T>(result.content)
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
