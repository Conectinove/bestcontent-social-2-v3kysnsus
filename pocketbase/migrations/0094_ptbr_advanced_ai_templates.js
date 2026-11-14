// Migration 0094: adiciona 8 templates avançados de IA em PT-BR à coleção post_templates.
// Idempotente: só insere templates cujo nome ainda não exista (dedup por nome).
// Restrições de enum respeitadas: type = 'feed'|'story'; network usa valores existentes;
// category usa 'engajamento' (não existe 'vendas'); todo record exige user.
migrate(
  (app) => {
    const templatesCol = app.findCollectionByNameOrId('post_templates')

    let defaultUserId = ''
    try {
      const existingUser = app.findFirstRecordByFilter('users', 'id != ""')
      if (existingUser) {
        defaultUserId = existingUser.id
      }
    } catch {
      // continua sem falhar
    }
    if (!defaultUserId) {
      // Sem usuários ainda, não há dono válido para o acervo compartilhado
      return
    }

    const newTemplates = [
      {
        name: 'Storytelling em 3 Atos (Narrativa Completa)',
        type: 'feed',
        network: 'instagram',
        category: 'storytelling',
        aspect_ratio: '4:5',
        dimensions: '1080x1350',
        is_shared: true,
        is_favorite: true,
        layout_data: {
          slidesCount: 6,
          headline: 'A História Que Ninguém Contou Até Hoje',
          hook: 'Ato 1: tudo parecia perdido. O Ato 3 mudou tudo — deslize até o fim.',
          structure: [
            'ATO 1 — A CENA: o problema no auge, com detalhe sensorial concreto',
            'ATO 1 — O CONFLITO: a dívida, a falha, o obstáculo que travava tudo',
            'ATO 2 — A VIRADA: a decisão, descoberta ou aliado que mudou a rota',
            'ATO 2 — A LUTA: tentativas, erros e o quase-desistno no meio do caminho',
            'ATO 3 — A RESOLUÇÃO: o resultado final medido em números',
            'ATO 3 — A LIÇÃO: a moral que o leitor leva para a própria vida',
          ],
          cta: '🎬 Comente "ATO 3" se você viveu uma virada parecida — e siga para mais histórias reais.',
        },
        style_settings: {
          theme: 'cinematic',
          accentColor: '#8B5CF6',
          fontFamily: 'Inter',
          cardBg: '#1E1B4B',
          textColor: '#FAFAFA',
        },
      },
      {
        name: 'Carrossel de Dados e Estatísticas',
        type: 'feed',
        network: 'linkedin',
        category: 'educativo',
        aspect_ratio: '1:1',
        dimensions: '1080x1080',
        is_shared: true,
        is_favorite: true,
        layout_data: {
          slidesCount: 7,
          headline: '7 Dados Sobre [Tema do Nicho] Que Vão Te Surpreender',
          hook: 'O dado do slide 4 contraria tudo que se repete por aí. Confira antes de repetir.',
          steps: [
            'Slide 1 (capa): o dado-título com número grande e fonte entre parênteses',
            'Slide 2: dado nº 1 com contexto em 1 linha ("o que isso significa")',
            'Slide 3: dado nº 2 com comparação visual (era X, virou Y)',
            'Slide 4: o dado contraintuitivo — destaque em cor diferente',
            'Slide 5: dado nº 4 aplicado à rotina do leitor',
            'Slide 6: dado nº 5 com projeção para os próximos 12 meses',
            'Slide 7 (fecho): resumo dos 5 dados + fonte completa',
          ],
          cta: '📊 Salve para citar esses dados na sua próxima reunião e compartilhe com quem precisa ver.',
        },
        style_settings: {
          theme: 'data-editorial',
          accentColor: '#3B82F6',
          fontFamily: 'Archivo Black',
          cardBg: '#0F172A',
          textColor: '#FFFFFF',
        },
      },
      {
        name: 'Jornada do Cliente (Do Problema ao Resultado)',
        type: 'feed',
        network: 'facebook',
        category: 'storytelling',
        aspect_ratio: '4:5',
        dimensions: '1080x1350',
        is_shared: true,
        is_favorite: false,
        layout_data: {
          slidesCount: 6,
          headline: 'A Jornada Completa de Um Cliente Nosso',
          hook: 'Ela chegou com [dor específica]. 90 dias depois, [resultado]. O caminho está aqui.',
          structure: [
            'ETAPA 1 — O ANTES: como era a rotina dela antes de te encontrar',
            'ETAPA 2 — O GATILHO: o momento exato que fez ela buscar ajuda',
            'ETAPA 3 — O DIAGNÓSTICO: o que você descobriu na primeira conversa',
            'ETAPA 4 — O PLANO: as 3 ações que estruturaram o caminho',
            'ETAPA 5 — OS TROPEÇOS: o que quase deu errado e como ajustou',
            'ETAPA 6 — O DEPOIS: resultado real + frase do próprio cliente',
          ],
          cta: '🧭 Se você está na ETAPA 1 hoje, chame na DM com a palavra JORNADA — eu te ajudo a mapear o caminho.',
        },
        style_settings: {
          theme: 'journey-path',
          accentColor: '#10B981',
          fontFamily: 'Inter',
          cardBg: '#022C22',
          textColor: '#ECFDF5',
        },
      },
      {
        name: 'Erro → Solução (Diagnóstico Rápido)',
        type: 'feed',
        network: 'all',
        category: 'educativo',
        aspect_ratio: '4:5',
        dimensions: '1080x1350',
        is_shared: true,
        is_favorite: false,
        layout_data: {
          slidesCount: 7,
          headline: 'Você Está Fazendo Errado. Corrija Assim:',
          hook: 'Cada erro abaixo custa tempo ou dinheiro. Ao lado, a correção em 1 passo.',
          pairs: [
            'ERRO 1: postar sem definir o objetivo da peça → SOLUÇÃO: 1 objetivo por post',
            'ERRO 2: legenda que repete a imagem → SOLUÇÃO: legenda que aprofunda a ideia',
            'ERRO 3: CTA genérico ("curtiu?") → SOLUÇÃO: CTA com ação e prazo claros',
            'ERRO 4: ignorar os horários do público → SOLUÇÃO: testar 3 janelas por 2 semanas',
            'ERRO 5: mudar de nicho a cada semana → SOLUÇÃO: 1 pilar de conteúdo por trimestre',
          ],
          cta: '🔧 Comente qual erro você vai corrigir primeiro — eu respondo com um passo prático.',
        },
        style_settings: {
          theme: 'fix-split',
          accentColor: '#EF4444',
          fontFamily: 'Archivo Black',
          cardBg: '#111827',
          textColor: '#FFFFFF',
        },
      },
      {
        name: 'Comparativo A vs B (Escolha Certa)',
        type: 'feed',
        network: 'tiktok',
        category: 'engajamento',
        aspect_ratio: '9:16',
        dimensions: '1080x1920',
        is_shared: true,
        is_favorite: true,
        layout_data: {
          headline: '[Opção A] ou [Opção B]? A Escolha Certa É…',
          hook: 'Todo mundo discute isso nos comentários. Aqui vai o comparativo honesto, sem achismo.',
          versus: [
            'CRITÉRIO 1 — Custo: A sai mais barato no início, B compensa no médio prazo',
            'CRITÉRIO 2 — Tempo até o resultado: A em 30 dias, B em 90 dias',
            'CRITÉRIO 3 — Esforço exigido: A pede rotina, B pede investimento inicial',
            'CRITÉRIO 4 — Para quem é cada um: perfil iniciante vs perfil avançado',
            'VEREDITO: na dúvida, comece por A e migre para B quando validar',
          ],
          cta: '⚖️ Comente "TEAM A" ou "TEAM B" com o seu motivo — o mais votado vira post da próxima semana.',
        },
        style_settings: {
          theme: 'versus-duotone',
          accentColor: '#EC4899',
          fontFamily: 'Inter',
          cardBg: '#0F172A',
          textColor: '#FFFFFF',
        },
      },
      {
        name: 'Bastidor de Processo (Passo a Passo Real)',
        type: 'story',
        network: 'instagram',
        category: 'storytelling',
        aspect_ratio: '9:16',
        dimensions: '1080x1920',
        is_shared: true,
        is_favorite: false,
        layout_data: {
          slidesCount: 5,
          headline: 'Bastidor: Do Briefing à Entrega em [X] Etapas',
          hook: 'Gravei o processo real — sem corte, sem maquiagem. Deslize para ver como funciona.',
          steps: [
            'ETAPA 1: o briefing chega (o que pergunto antes de qualquer coisa)',
            'ETAPA 2: pesquisa e referências — minhas 3 fontes fixas',
            'ETAPA 3: primeira versão — o rascunho feio que ninguém vê',
            'ETAPA 4: refinamento — o detalhe que separa o bom do memorável',
            'ETAPA 5: entrega + o que aprendi nesse projeto',
          ],
          cta: '👀 Quer ver mais bastidores como este? Responda esta story com "MAIS" e eu aviso do próximo.',
        },
        style_settings: {
          theme: 'authentic',
          accentColor: '#F59E0B',
          fontFamily: 'Inter',
          cardBg: '#18181B',
          textColor: '#FFFFFF',
        },
      },
      {
        name: 'Série Episódica (Especial Contínuo)',
        type: 'feed',
        network: 'youtube',
        category: 'storytelling',
        aspect_ratio: '16:9',
        dimensions: '1920x1080',
        is_shared: true,
        is_favorite: false,
        layout_data: {
          slidesCount: 5,
          headline: 'Série: [Nome da Série] — Episódio [Nº]',
          hook: 'Episódio [Nº] da série que está fazendo todo mundo voltar no perfil: o tema de hoje e o resumo do anterior.',
          structure: [
            'CAPA: número do episódio grande + título curto do tema',
            'RECAP: em 1 frase, onde a série parou no episódio anterior',
            'EPISÓDIO: o conteúdo de hoje dividido em 3 partes numeradas',
            'CLIFFHANGER: a pergunta que fica no ar para o próximo episódio',
            'ÍNDICE: lista dos episódios anteriores com número e tema',
          ],
          cta: '📺 Salve esta capa para acompanhar a série do início e ative o sininho para o próximo episódio.',
        },
        style_settings: {
          theme: 'series-poster',
          accentColor: '#6366F1',
          fontFamily: 'Archivo Black',
          cardBg: '#111827',
          textColor: '#FFFFFF',
        },
      },
      {
        name: 'Autoridade com Contraste (Amador vs Profissional)',
        type: 'feed',
        network: 'twitter',
        category: 'autoridade',
        aspect_ratio: '1:1',
        dimensions: '1080x1080',
        is_shared: true,
        is_favorite: true,
        layout_data: {
          headline: 'A Diferença Entre Quem Amador e Quem Profissional',
          hook: 'Amador tenta parecer grande. Profissional prova com detalhe. Veja as 4 diferenças.',
          contrast: [
            'AMADOR promete resultado em 1 semana → PROFISSIONAL mostra o cronograma real',
            'AMADOR fala de si mesmo o tempo todo → PROFISSIONAL fala do problema do cliente',
            'AMADOR esconde o processo → PROFISSIONAL documenta cada etapa',
            'AMADOR teme a concorrência → PROFISSIONal colabora e se posiciona pelo diferencial',
          ],
          proof: 'Prova: case real do próprio nicho com antes/depois na mesma régua de medida.',
          cta: '🧠 Salve este post como checklist de posicionamento e cite a diferença que mais te descreve hoje.',
        },
        style_settings: {
          theme: 'authority-editorial',
          accentColor: '#06B6D4',
          fontFamily: 'Inter',
          cardBg: '#083344',
          textColor: '#ECFEFF',
        },
      },
    ]

    let inserted = 0
    for (const tpl of newTemplates) {
      // Idempotência: ignora se já existir template com o mesmo nome
      let existing = null
      try {
        existing = app.findFirstRecordByFilter('post_templates', `name = "${tpl.name}"`)
      } catch {
        existing = null
      }
      if (existing) continue

      const record = new Record(templatesCol)
      record.set('user', defaultUserId)
      record.set('name', tpl.name)
      record.set('type', tpl.type)
      record.set('network', tpl.network)
      record.set('category', tpl.category)
      record.set('aspect_ratio', tpl.aspect_ratio)
      record.set('dimensions', tpl.dimensions)
      record.set('is_shared', tpl.is_shared)
      record.set('is_favorite', tpl.is_favorite)
      record.set('layout_data', tpl.layout_data)
      record.set('style_settings', tpl.style_settings)
      app.save(record)
      inserted++
    }
    console.log(`[0094] Templates avançados de IA adicionados: ${inserted}`)
  },
  (app) => {
    // Rollback: remove apenas os templates com os nomes desta migration
    const names = [
      'Storytelling em 3 Atos (Narrativa Completa)',
      'Carrossel de Dados e Estatísticas',
      'Jornada do Cliente (Do Problema ao Resultado)',
      'Erro → Solução (Diagnóstico Rápido)',
      'Comparativo A vs B (Escolha Certa)',
      'Bastidor de Processo (Passo a Passo Real)',
      'Série Episódica (Especial Contínuo)',
      'Autoridade com Contraste (Amador vs Profissional)',
    ]
    for (const n of names) {
      try {
        const rec = app.findFirstRecordByFilter('post_templates', `name = "${n}"`)
        if (rec) app.delete(rec)
      } catch {
        // já removido
      }
    }
  },
)
