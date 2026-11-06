import pb from '@/lib/pocketbase/client'

// ============================================================
// IA generativa para sugestão de resposta em comentários.
// Usa o hook server-side /backend/v1/ai/suggest-reply ($ai.chat);
// se indisponível, cai num fallback local determinístico.
// NUNCA envia sozinho — apenas preenche o campo de resposta.
// ============================================================

export interface SuggestReplyInput {
  platform: 'instagram' | 'facebook' | 'x' | string
  commentText: string
  author?: string
  brandName?: string
  brandTone?: string
}

export interface SuggestReplyResult {
  reply: string
  source: 'ai' | 'fallback'
}

function buildPrompt(input: SuggestReplyInput): string {
  const rede =
    input.platform === 'instagram'
      ? 'Instagram'
      : input.platform === 'facebook'
        ? 'Facebook'
        : input.platform === 'x'
          ? 'X (Twitter)'
          : input.platform
  return [
    `Você é o gerente de comunidade da marca "${input.brandName || 'nossa marca'}".`,
    `Responda ao comentário abaixo na rede ${rede}, no tom ${input.brandTone || 'próximo, cordial e profissional'},`,
    'em português do Brasil, em no máximo 2 frases curtas. Sem hashtags. Sem aspas.',
    'Se for uma pergunta, responda de forma útil e convide para conversar na DM/e-mail.',
    'Se for um elogio, agradeça com simpatia. Se for uma crítica, reconheça, peça desculpas e ofereça solução.',
    '',
    `Autor do comentário: ${input.author || 'seguidor'}`,
    `Comentário: "${input.commentText}"`,
  ].join('\n')
}

function fallbackReply(input: SuggestReplyInput): string {
  const text = (input.commentText || '').toLowerCase()
  const author = input.author || ''
  const who = author ? `${author}` : ''
  const brand = input.brandName || 'nós'

  if (/(preço|valor|quanto custa|caro|caro demais|orçamento)/.test(text)) {
    return `${who ? `${who}, ótima pergunta! ` : ''}Os valores variam conforme o plano — me chame na DM que ${brand} te envia a tabela completa com as condições de hoje. 💬`
  }
  if (/(erro|problema|bug|não funciona|nao funciona|falha|reclama)/.test(text)) {
    return `${who ? `${who}, ` : ''}sentimos muito pelo transtorno! Isso não é o que a gente entrega. Me passa os detalhes na DM que já vou resolver pessoalmente. 🙏`
  }
  if (/(obrigad|valeu|top|incrível|incrivel|demais|adorei|amei|muito bom|parab)/.test(text)) {
    return `${who ? `${who}, ` : ''}muito obrigado pelo carinho! Ficamos felizes que fez sentido pra você. Qualquer dúvida, ${brand} está por aqui. ✨`
  }
  if (/(quando|quais|onde|como|por que|porque|quem|qual)/.test(text)) {
    return `Ótima pergunta${who ? `, ${who}` : ''}! Resumo rápido: funciona em 3 passos simples e te mostro o passo a passo na DM — quer conferir?`
  }
  if (/(interessad|quero|quero saber|como compro|onde compro)/.test(text)) {
    return `Adoramos seu interesse${who ? `, ${who}` : ''}! Te mando agora mesmo os detalhes na DM com tudo que precisa para começar. 🚀`
  }
  return `${who ? `${who}, ` : ''}obrigado por interagir com ${brand}! Sua participação vale muito — se quiser, continuamos a conversa na DM. 😊`
}

export async function suggestAiReply(input: SuggestReplyInput): Promise<SuggestReplyResult> {
  const commentText = (input.commentText || '').trim()
  if (!commentText) return { reply: '', source: 'fallback' }

  try {
    const res = await pb.send('/backend/v1/ai/suggest-reply', {
      method: 'POST',
      body: JSON.stringify({
        prompt: buildPrompt(input),
        platform: input.platform,
        comment: commentText,
        author: input.author || '',
        brandName: input.brandName || '',
        tone: input.brandTone || 'cordial',
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    const reply = typeof res?.reply === 'string' ? res.reply.trim() : ''
    if (reply) return { reply, source: 'ai' }
  } catch (err) {
    console.warn('IA de resposta indisponível, usando fallback local:', err)
  }

  return { reply: fallbackReply(input), source: 'fallback' }
}

export interface GenerateAiCommentReplyInput {
  platform: 'instagram' | 'facebook' | 'x' | string
  authorHandle?: string
  authorName?: string
  commentText: string
  postContext?: string
  brandName?: string
  brandTone?: string
}

export interface GenerateAiCommentReplyResult {
  suggestion: string
  source: 'ai' | 'fallback'
}

export async function generateAiCommentReply(
  input: GenerateAiCommentReplyInput,
): Promise<GenerateAiCommentReplyResult> {
  const res = await suggestAiReply({
    platform: input.platform,
    commentText: input.commentText,
    author: input.authorName || (input.authorHandle ? `@${input.authorHandle}` : undefined),
    brandName: input.brandName,
    brandTone: input.brandTone,
  })
  return {
    suggestion: res.reply,
    source: res.source,
  }
}
