// Migration 00093: adiciona 9 novos templates de IA em PT-BR à coleção post_templates.
// Idempotente: só insere templates cujo nome ainda não exista (dedup por nome).
migrate(
  (app) => {
    const templatesCol = app.findCollectionByNameOrId('post_templates')

    // Campo user é required: copia o padrão da migration 00090
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
        name: 'Carrossel de Erros Comuns do Nicho',
        type: 'feed',
        network: 'instagram',
        category: 'educativo',
        aspect_ratio: '4:5',
        dimensions: '1080x1350',
        is_shared: true,
        is_favorite: false,
        layout_data: {
          slidesCount: 6,
          headline: '5 Erros Que Estão Sabotando Seus Resultados',
          hook: 'Se você comete o erro nº 3, está jogando dinheiro fora todos os dias — e nem percebeu.',
          steps: [
            'Erro 1: Publicar sem definir o público-alvo da peça',
            'Erro 2: Capa genérica que não gera curiosidade',
            'Erro 3: CTA ausente ou escondido no último slide',
            'Erro 4: Texto longo demais para leitura de 3 segundos',
            'Erro 5: Ignorar os comentários depois de publicar',
            'Bônus: Como corrigir cada erro na prática, ainda esta semana',
          ],
          cta: '📌 Salve para revisar antes do seu próximo post e comente qual erro você já cometeu!',
        },
        style_settings: {
          theme: 'high-contrast',
          accentColor: '#EF4444',
          fontFamily: 'Archivo Black',
          cardBg: '#111827',
          textColor: '#FFFFFF',
        },
      },
      {
        name: 'Bastidores do Processo (Story + Carrossel)',
        type: 'feed',
        network: 'instagram',
        category: 'storytelling',
        aspect_ratio: '4:5',
        dimensions: '1080x1350',
        is_shared: true,
        is_favorite: false,
        layout_data: {
          slidesCount: 5,
          headline: 'Bastidores: Como É Feito Por Dentro',
          hook: 'Ninguém mostra o processo real — hoje eu abro o caixinha para você.',
          steps: [
            'Slide 1: O pedido chegou (contexto e prazo real)',
            'Slide 2: Pesquisa e referências que uso antes de começar',
            'Slide 3: Primeira versão — onde quase tudo dá errado',
            'Slide 4: Ajustes finais e o detalhe que muda tudo',
            'Slide 5: Resultado final comparado ao rascunho inicial',
          ],
          cta: '👀 Siga para ver mais bastidores reais e comente qual etapa te surpreendeu.',
        },
        style_settings: {
          theme: 'authentic',
          accentColor: '#8B5CF6',
          fontFamily: 'Inter',
          cardBg: '#1E1B4B',
          textColor: '#FAFAFA',
        },
      },
      {
        name: 'Mito vs Verdade (Debate Rápido)',
        type: 'feed',
        network: 'all',
        category: 'engajamento',
        aspect_ratio: '1:1',
        dimensions: '1080x1080',
        is_shared: true,
        is_favorite: true,
        layout_data: {
          headline: 'Mito ou Verdade? [Tema do Nicho]',
          hook: '9 em cada 10 pessoas acreditam no mito da esquerda. Você acredita?',
          myth: 'MITO: "Preciso postar todos os dias para crescer"',
          truth: 'VERDADE: "Consistência estratégica 3x/semana supera volume sem direção"',
          proof:
            'Prova: análise de 30 dias de perfis reais com cadência menor e engajamento maior.',
          cta: '💬 Comente MITO ou VERDADE nos seus próprios casos — quero ouvir você!',
        },
        style_settings: {
          theme: 'split-duotone',
          accentColor: '#EC4899',
          fontFamily: 'Inter',
          cardBg: '#0F172A',
          textColor: '#FFFFFF',
        },
      },
      {
        name: 'Antes/Depois com Storytelling',
        type: 'feed',
        network: 'instagram',
        category: 'storytelling',
        aspect_ratio: '4:5',
        dimensions: '1080x1350',
        is_shared: true,
        is_favorite: false,
        layout_data: {
          headline: 'De Onde a Gente Partiu Para Onde Chegamos',
          hook: 'O "antes" era um caos medido no improviso. O "depois" virou processo.',
          beforeLabel: 'ANTES: [situação inicial com dor concreta e número real]',
          afterLabel: 'DEPOIS: [resultado alcançado com a mesma métrica comparada]',
          storyBeats: [
            'O diagnóstico honesto do cenário inicial',
            'A decisão que mudou a rota (e o risco dela)',
            'A execução semana a semana com ajustes',
            'O resultado medido na mesma régua do começo',
          ],
          cta: '🚀 Quer o mesmo salto? Chame na DM com a palavra PROCESSO.',
        },
        style_settings: {
          theme: 'transformation',
          accentColor: '#10B981',
          fontFamily: 'Archivo Black',
          cardBg: '#022C22',
          textColor: '#ECFDF5',
        },
      },
      {
        name: 'Desafio de X Dias (Engajamento Sequencial)',
        type: 'feed',
        network: 'tiktok',
        category: 'engajamento',
        aspect_ratio: '9:16',
        dimensions: '1080x1920',
        is_shared: true,
        is_favorite: false,
        layout_data: {
          headline: 'Desafio de 7 Dias: [Transformação do Nicho]',
          hook: 'Dia 1 de 7: aceito o desafio e você vem comigo — sem desistir no dia 3.',
          dayTemplate: 'Dia {N}/7: [micro-tarefa simples] + o que mudou desde ontem',
          milestones: [
            'Dia 1: o ponto de partida medido em números',
            'Dia 3: primeira dificuldade real e como contornei',
            'Dia 5: o primeiro resultado visível',
            'Dia 7: balanço final com antes/depois lado a lado',
          ],
          cta: '🔥 Comenta "EU TOPO" e marca alguém para fazer o desafio contigo!',
        },
        style_settings: {
          theme: 'energetic',
          accentColor: '#F59E0B',
          fontFamily: 'Inter',
          cardBg: '#18181B',
          textColor: '#FFFFFF',
        },
      },
      {
        name: 'Curiosidades Surpreendentes do Nicho',
        type: 'feed',
        network: 'linkedin',
        category: 'educativo',
        aspect_ratio: '1:1',
        dimensions: '1080x1080',
        is_shared: true,
        is_favorite: false,
        layout_data: {
          headline: '3 Curiosidades Que Quase Ninguém Sabe Sobre [Tema]',
          hook: 'A curiosidade nº 2 mudou a forma como eu trabalho — leia até o fim.',
          curiosities: [
            'Curiosidade 1: [dado histórico ou estatística do nicho]',
            'Curiosidade 2: [prática contraintuitiva que funciona]',
            'Curiosidade 3: [referência de mercado pouco conhecida]',
          ],
          cta: '📚 Salve para citar na próxima conversa e siga para mais conteúdo assim.',
        },
        style_settings: {
          theme: 'editorial',
          accentColor: '#3B82F6',
          fontFamily: 'Inter',
          cardBg: '#0F172A',
          textColor: '#FFFFFF',
        },
      },
      {
        name: 'Perguntas Frequentes de Clientes (FAQ)',
        type: 'feed',
        network: 'whatsapp',
        category: 'educativo',
        aspect_ratio: '4:5',
        dimensions: '1080x1350',
        is_shared: true,
        is_favorite: true,
        layout_data: {
          headline: 'As 4 Perguntas Que Todo Cliente Faz (Respondidas)',
          hook: 'Se você já travou antes de contratar por causa de uma dessas dúvidas, essa é para você.',
          faq: [
            'P: Quanto custa? — R: [faixa de preço e o que está incluso]',
            'P: Quanto tempo para ver resultado? — R: [prazo realista com etapa por etapa]',
            'P: E se não funcionar para mim? — R: [garantia ou plano B claro]',
            'P: Por que você e não o concorrente? — R: [diferencial concreto com prova]',
          ],
          cta: '💬 Ficou alguma dúvida de fora da lista? Responde aqui que eu respondo pessoalmente.',
        },
        style_settings: {
          theme: 'trust-clean',
          accentColor: '#10B981',
          fontFamily: 'Inter',
          cardBg: '#064E3B',
          textColor: '#ECFDF5',
        },
      },
      {
        name: 'Anúncio com Prova Social (Depoimento + Resultado)',
        type: 'feed',
        network: 'all',
        category: 'promo',
        aspect_ratio: '4:5',
        dimensions: '1080x1350',
        is_shared: true,
        is_favorite: false,
        layout_data: {
          headline: '[Resultado Real] em [Prazo Curto] — Sem [Objeção Principal]',
          hook: '"[Frase exata do cliente descrevendo a dor inicial]" — começo do depoimento que recebi ontem.',
          socialProof: 'Depoimento completo: [citação do cliente + nome + cargo/empresa]',
          metrics: [
            '✔ [número concreto atingido — ex.: 3x mais leads em 30 dias]',
            '✔ [segunda prova — ex.: 40% menos custo por conversa]',
            '✔ [terceira prova — ex.: 12 clientes já pelo mesmo método]',
          ],
          cta: '👉 Clique em "Saiba Mais" para ver como aplicar no seu caso hoje.',
        },
        style_settings: {
          theme: 'conversion-bold',
          accentColor: '#6366F1',
          fontFamily: 'Archivo Black',
          cardBg: '#111827',
          textColor: '#FFFFFF',
        },
      },
      {
        name: 'Conteúdo Sazonal / Datas Comemorativas',
        type: 'feed',
        network: 'all',
        category: 'engajamento',
        aspect_ratio: '1:1',
        dimensions: '1080x1080',
        is_shared: true,
        is_favorite: false,
        layout_data: {
          headline: '[Data Comemorativa] e o Que Ela Ensina Sobre o Nosso Nicho',
          hook: 'Hoje é [data] — e ela tem tudo a ver com o que você faz todos os dias.',
          structure: [
            'Abertura: o significado da data em uma frase humana',
            'Conexão: como o tema da data aparece na rotina do cliente',
            'Lição prática: 1 ação simples para aproveitar o momento',
            'Gancho futuro: convite para a próxima data do calendário do nicho',
          ],
          cta: '🎉 Marque alguém que precisa lembrar desta data hoje e salve para o ano que vem!',
        },
        style_settings: {
          theme: 'festive-warm',
          accentColor: '#F59E0B',
          fontFamily: 'Inter',
          cardBg: '#1F2937',
          textColor: '#FFFFFF',
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
    console.log(`[00093] Templates de IA adicionados: ${inserted}`)
  },
  (app) => {
    // Rollback: remove apenas os templates com os nomes desta migration
    const names = [
      'Carrossel de Erros Comuns do Nicho',
      'Bastidores do Processo (Story + Carrossel)',
      'Mito vs Verdade (Debate Rápido)',
      'Antes/Depois com Storytelling',
      'Desafio de X Dias (Engajamento Sequencial)',
      'Curiosidades Surpreendentes do Nicho',
      'Perguntas Frequentes de Clientes (FAQ)',
      'Anúncio com Prova Social (Depoimento + Resultado)',
      'Conteúdo Sazonal / Datas Comemorativas',
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
