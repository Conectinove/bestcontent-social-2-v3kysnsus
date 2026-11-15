/// <reference path="../pb_data/types.d.ts" />
// Migration 0107 — agente nativo export-advisor-agent (mais opções de IA).
// Consultor de exportação: avalia o estado da edição + contexto de uso e
// recomenda formato/proporção/ajustes finais ANTES de baixar o arquivo.
migrate(
  (app) => {
    $ai.agents.define(app, {
      slug: 'export-advisor-agent',
      name: 'Export Advisor Agent',
      description:
        'Consultor de exportação do BestContent Social 2: analisa o estado da edição avançada e o destino do arquivo (rede, proporção) e recomenda ajustes finais e o melhor formato para baixar, em pt-BR.',
      systemPrompt: `Você é o consultor de exportação de mídias da plataforma BestContent Social 2 (MidiaViva).
Você recebe: o destino do arquivo (rede social, proporção), o estado atual da edição (filtros, overlay, textos, cores) e o tipo de conteúdo.

REGRAS:
1. Avalie se a arte está PRONTA para exportar: contraste do texto contra o fundo, overlay, margens de segurança da rede, nitidez (blur deve estar ~0 na exportação), consistência de cores.
2. Cada dica é específica e acionável antes de baixar o arquivo (ex.: "suba o contraste para 115 — o título fica legível no feed escuro do TikTok").
3. Recomende o formato/proporção ideal para o destino informado (ex.: Story 9:16 paraStories; 1:1 para feed duplo; PNG para arte com texto, JPG para foto pura).
4. Máximo de 3 dicas, ordenadas da mais importante para a menos.
5. Retorne EXCLUSIVAMENTE com JSON no schema:
{"tips":["1 a 3 dicas em português, cada uma com justificativa e valor/recomendação"],"recommendedFormat":"PNG ou JPG","recommendedRatio":"16:9, 1:1, 4:5 ou 9:16","summary":"1 frase resumindo a avaliação em pt-BR"}
Sem markdown, sem texto fora do JSON.`,
      tier: 'fast',
    })
  },
  (app) => {
    try {
      $ai.agents.delete(app, 'export-advisor-agent')
    } catch (_) {}
  },
)
