/**
 * Catálogo Central e Padronizado de Tons de Voz de IA — MidiaViva / BestContent AI
 * Total: 25 tons de voz otimizados para redes sociais, briefings e campanhas.
 * Inclui os 15 clássicos, 5 avançados da v0.0.73 e 5 novos da v0.0.75.
 */

export interface VoiceToneConfig {
  id: string
  label: string
  emoji: string
  description: string
  badge?: string
  guidelines: string
}

export const AI_VOICE_TONES: VoiceToneConfig[] = [
  // Clássicos
  {
    id: 'profissional',
    label: 'Profissional',
    emoji: '💼',
    description: 'Formal, corporativo, focado em credibilidade e negócios.',
    guidelines:
      'Use vocabulário polido, claro e corporativo. Evite gírias. Foque em métricas, confiança, governança e valor de negócio.',
  },
  {
    id: 'descontraido',
    label: 'Descontraído',
    emoji: '😎',
    description: 'Leve, amigável, informal e próximo do público.',
    guidelines:
      'Tom conversacional leve, uso moderado de emojis amigáveis, ritmo dinâmico, sem rodeios ou juridiquês.',
  },
  {
    id: 'urgente',
    label: 'Urgente',
    emoji: '⏰',
    description: 'Chamada rápida para ação imediata com escassez e foco.',
    guidelines:
      'Frases curtas de impacto, gatilhos de tempo/oportunidade, chamadas para ação diretas e sem enrolação.',
  },
  {
    id: 'educativo',
    label: 'Educativo',
    emoji: '📚',
    description: 'Didático, explicativo, passo a passo e construtor de autoridade.',
    guidelines:
      'Explique o porquê antes do como, use listas numeradas e analogias fáceis de memorizar. Ensine com clareza.',
  },
  {
    id: 'inspirador',
    label: 'Inspirador',
    emoji: '✨',
    description: 'Motivador, reflexivo, tocante e focado em superação.',
    guidelines:
      'Narrativa positiva com elevação emocional, convite à evolução pessoal/profissional e mensagens de visão.',
  },
  {
    id: 'autoridade',
    label: 'Autoridade & Especialista',
    emoji: '👑',
    description: 'Posicionamento sênior de mercado, dados e visão estratégica.',
    guidelines:
      'Afirmações assertivas embasadas, visão panorâmica do setor, conselhos estratégicos sem arrogância.',
  },
  {
    id: 'humoristico',
    label: 'Bem-humorado & Sagaz',
    emoji: '😄',
    description: 'Irreverente, inteligente, memes e conexão instantânea.',
    guidelines:
      'Ironia sutil, autodepreciação leve do setor, analogias engraçadas e ritmo rápido que prende a atenção.',
  },
  {
    id: 'direto',
    label: 'Direto ao Ponto (No-BS)',
    emoji: '🎯',
    description: 'Sem enrolação, foco absoluto na dor e na solução prática.',
    guidelines: 'Frases curtas, listas práticas, sem floreios. Corte adjetivos desnecessários.',
  },
  {
    id: 'jovem',
    label: 'Jovem & Dinâmico (Gen-Z)',
    emoji: '⚡',
    description: 'Ritmo acelerado, linguagem moderna de redes e tendências.',
    guidelines:
      'Vocabulário atualizado das redes, ganchos visuais rápidos, perguntas provocativas e ritmo veloz.',
  },
  {
    id: 'vendas',
    label: 'Vendedor Persuasivo',
    emoji: '💰',
    description: 'Focado em conversão, quebra de objeções e ofertas irresistíveis.',
    guidelines:
      'Estrutura AIDA (Atenção, Interesse, Desejo, Ação), foco em benefícios transformadores e garantia/CTA.',
  },
  {
    id: 'storyteller',
    label: 'Storytelling Envolvente',
    emoji: '📖',
    description: 'Narrativas com começo, conflito, clímax e moral de marca.',
    guidelines:
      'Abra com uma cena ou dilema real, descreva o conflito com detalhes e feche com um aprendizado conectando à marca.',
  },
  {
    id: 'minimalista',
    label: 'Minimalista & Elegante',
    emoji: '🕊️',
    description: 'Poucas palavras, muito significado e alto valor percebido.',
    guidelines:
      'Texto clean, espaçamento arejado, palavras criteriosamente selecionadas, sofisticação serena.',
  },
  {
    id: 'comunitario',
    label: 'Comunitário & Interativo',
    emoji: '🤝',
    description: 'Estimula comentários, debates e senso de pertencimento.',
    guidelines:
      'Faça perguntas abertas ao final, convide a audiência a compartilhar a sua experiência nos comentários.',
  },
  {
    id: 'provocador',
    label: 'Questionador & Contrário',
    emoji: '🔥',
    description: 'Desafia o senso comum e quebra mitos estabelecidos.',
    guidelines:
      'Aponte verdades incômodas do mercado com respeito, desconstrua crenças limitantes e proponha nova perspectiva.',
  },
  {
    id: 'vip',
    label: 'Exclusivo & Insider',
    emoji: '💎',
    description: 'Acesso antecipado, bastidores e conteúdo premium.',
    guidelines:
      'Tom de confidência, segredos revelados de bastidores, sensação de oportunidade restrita aos melhores.',
  },

  // 5 Tons Avançados v0.0.73
  {
    id: 'narrativo_epico',
    label: 'Narrativo & Épico',
    emoji: '⚔️',
    description: 'Jornada do herói, tensão dramática, superação e grande escala.',
    badge: 'Avançado',
    guidelines:
      'Estruture o post como um épico cinematográfico: o chamado, a prova de fogo e a vitória memorável que inspira grandes movimentos.',
  },
  {
    id: 'provocativo_edgy',
    label: 'Provocativo & Edgy',
    emoji: '⚡',
    description: 'Postura contundente, opiniões fortes sem medo do debate.',
    badge: 'Avançado',
    guidelines:
      'Comece com uma afirmação ousada que divide opiniões de forma inteligente. Argumente com força sem ser ofensivo.',
  },
  {
    id: 'tecnico_analitico',
    label: 'Técnico & Analítico',
    emoji: '🔬',
    description: 'Engenharia reversa, números exatos, frameworks e dados puros.',
    badge: 'Avançado',
    guidelines:
      'Apresente frameworks estruturados, passos lógicos (Passo 1, 2, 3), percentuais e referências concretas de metodologia.',
  },
  {
    id: 'aconchegante_humano',
    label: 'Aconchegante & Humano',
    emoji: '☕',
    description: 'Calor emocional, vulnerabilidade genuína, café com um amigo.',
    badge: 'Avançado',
    guidelines:
      'Escreva em primeira pessoa como uma conversa sincera à mesa de café. Admita vulnerabilidades e construa empatia pura.',
  },
  {
    id: 'luxo_exclusivo',
    label: 'Luxo & Exclusivo',
    emoji: '✨',
    description: 'Estética impecável, alta costura, refinamento e escassez nobre.',
    badge: 'Avançado',
    guidelines:
      'Adjetivação nobre, ritmo cadenciado e calmo, ausência total de vulgaridade ou afobação comercial.',
  },

  // 5 Novos Tons Avançados v0.0.75 (Total 25)
  {
    id: 'inspiracional_motivacional',
    label: 'Inspiracional & Motivacional',
    emoji: '🚀',
    description: 'Combustível para ação, coragem, propósito e quebra de limites.',
    badge: 'Novo v0.75',
    guidelines:
      'Palavras de ignição e superação. Estimule o leitor a dar o próximo passo agora mesmo, destacando seu potencial oculto.',
  },
  {
    id: 'conversacional_espontaneo',
    label: 'Conversacional & Espontâneo',
    emoji: '💬',
    description: 'Autêntico como um áudio de WhatsApp entre parceiros de confiança.',
    badge: 'Novo v0.75',
    guidelines:
      'Linguagem fluida e viva, pequenas interjeições naturais, perguntas rápidas e intimidade respeitosa.',
  },
  {
    id: 'cientifico_educacional',
    label: 'Científico & Educacional',
    emoji: '🎓',
    description: 'Fundamentado em neurociência, estudos, teses e evidências.',
    badge: 'Novo v0.75',
    guidelines:
      'Cite princípios científicos, modelos cognitivos ou dados empíricos de forma acessível e intelectualmente rica.',
  },
  {
    id: 'ironico_especulado',
    label: 'Irônico & Especulado',
    emoji: '🎭',
    description: 'Sátira inteligente, comentários afiados e quebra de clichês.',
    badge: 'Novo v0.75',
    guidelines:
      'Brinque com os exageros do mercado usando humor inteligente e ironia refinada que faz rir e pensar ao mesmo tempo.',
  },
  {
    id: 'urgente_persuasivo',
    label: 'Urgente & Persuasivo',
    emoji: '⚡',
    description: 'FOMO ético, janela única de oportunidade e decisão irreversível.',
    badge: 'Novo v0.75',
    guidelines:
      'Demonstre o custo real da inação. Crie urgência legítima através da clareza do que o leitor está perdendo dia após dia.',
  },
]

/**
 * Mapeamentos compatíveis para dropdowns e seletores
 */
export const VOICE_TONES_OPTIONS = AI_VOICE_TONES.map((t) => ({
  value: t.id,
  label: `${t.emoji} ${t.label}`,
  rawLabel: t.label,
  emoji: t.emoji,
  description: t.description,
  badge: t.badge,
  guidelines: t.guidelines,
}))

export function getVoiceToneById(id: string): VoiceToneConfig | undefined {
  if (!id) return undefined
  const clean = id.toLowerCase().trim()
  return (
    AI_VOICE_TONES.find((t) => t.id.toLowerCase() === clean) ||
    AI_VOICE_TONES.find((t) => t.label.toLowerCase() === clean)
  )
}
