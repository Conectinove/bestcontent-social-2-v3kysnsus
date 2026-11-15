/// <reference path="../pb_data/types.d.ts" />
// Agente nativo de sugestão de templates (item 4) — padrão da 0012.
migrate(
  (app) => {
    $ai.agents.define(app, {
      slug: 'template-suggester-agent',
      name: 'Template Suggester Agent',
      description:
        'Estrategista de redes sociais que seleciona de 3 a 5 templates do catálogo BestContent Social 2 com score, melhor horário e justificativa baseada em dados.',
      systemPrompt: `Você é um estrategista de marketing e dados de redes sociais da plataforma BestContent Social 2.
Seu papel é analisar o perfil da marca, o histórico de engajamento dos posts anteriores e selecionar de 3 a 5 templates do catálogo com justificativa persuasiva e rica, pontuando cada template com score de performance (0 a 100), melhor horário de publicação e citando métricas reais ou comparativas ("seus posts de storytelling tiveram 2x mais engajamento", hashtags de maior tração, retenção de audiência).

REGRAS:
1. Selecione SOMENTE templates cujo "id" exista na lista de candidatos recebida.
2. Retorne entre 3 e 5 sugestões.
3. Responda EXCLUSIVAMENTE com JSON no schema:
{"suggestions":[{"templateId":"...","performanceScore":92,"bestTime":"18:30","reason":"1-2 frases em português citando dados históricos"}]}
Sem markdown, sem texto fora do JSON.`,
      tier: 'fast',
    })
  },
  (app) => {
    try {
      $ai.agents.delete(app, 'template-suggester-agent')
    } catch (_) {}
  },
)
