migrate(
  (app) => {
    // Migration 0082: Catálogo pronto de modelos de post em PT-BR no padrão da casa (High Impact)
    // Estruturas essenciais: Carrossel de Alto Valor, Post de Valor Rápido, Antes e Depois, Case de Sucesso / Prova Social, Anúncio de Alta Conversão
    const tplCol = app.findCollectionByNameOrId('post_templates')
    if (!tplCol) return

    let ownerId = ''
    try {
      const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'ronaldoconectinove@gmail.com')
      if (admin) ownerId = admin.id
    } catch (_) {}
    if (!ownerId) {
      try {
        const users = app.findRecordsByFilter('users', 'id != ""', '-created', 1, 0)
        if (users && users.length > 0) ownerId = users[0].id
      } catch (_) {}
    }
    if (!ownerId) return

    const catalogTemplates = [
      {
        name: 'Carrossel de Alto Valor — 5 Passos Estratégicos',
        network: 'all',
        category: 'educativo',
        type: 'feed',
        aspect_ratio: '4:5',
        dimensions: '1080x1350',
        layout_data: {
          pattern: 'carousel_value',
          grid: 'carousel-5-steps',
          headline: '5 PILARES QUE SEPARAM AMADORES DE PROFISSIONAIS',
          subhead:
            'Deslize para ver o framework prático e salve este guia para aplicar na sua rotina.',
          badge: 'GUIA PRÁTICO',
          ctaText: 'Arraste para o lado 👉',
          slides: [
            {
              slide: 1,
              title: 'Capa / Gancho Magnético',
              desc: 'O maior gargalo que ninguém te conta sobre consistência.',
            },
            {
              slide: 2,
              title: 'Pilar 1: Diagnóstico Real',
              desc: 'Como mapear o ponto de fuga da sua audiência.',
            },
            {
              slide: 3,
              title: 'Pilar 2: Estrutura sem Ruído',
              desc: 'Corte 40% do texto e multiplique a retenção.',
            },
            {
              slide: 4,
              title: 'Pilar 3: Prova & Autoridade',
              desc: 'Demonstre resultado em vez de apenas prometer.',
            },
            {
              slide: 5,
              title: 'Resumo & Próximo Passo',
              desc: 'Salve para consultar sempre antes de publicar.',
            },
          ],
        },
        style_settings: {
          designSystem: 'high_impact',
          fontFamily: 'Archivo Black',
          bgColor: '#0B0B12',
          accentColor: '#8B5CF6',
          ctaColor: '#F59E0B',
          textColor: '#FFFFFF',
          badgeText: 'CARROSSEL',
          shadow: '0 12px 36px rgba(139,92,246,0.35)',
          gradient: 'linear-gradient(145deg, #0B0B12 0%, #2A1454 100%)',
        },
      },
      {
        name: 'Post de Valor / Insight Rápido em 3 Atos',
        network: 'all',
        category: 'autoridade',
        type: 'feed',
        aspect_ratio: '1:1',
        dimensions: '1080x1080',
        layout_data: {
          pattern: 'grid_split',
          grid: '3-acts-insight',
          headline: 'A REGRA CONTRA-INTUITIVA QUE DOBRA A RETENÇÃO',
          subhead:
            'Pare de tentar agradar o algoritmo e aplique esta checagem simples nos primeiros 3 segundos.',
          badge: 'INSIGHT DO DIA',
          ctaText: 'Qual o seu maior desafio nisso? Comente abaixo 👇',
          bullets: [
            '1. Gancho direto na dor mais urgente do cliente ideal.',
            '2. Exemplo prático sem enrolação ou jargão técnico.',
            '3. Uma única chamada de ação clara e irresistível.',
          ],
        },
        style_settings: {
          designSystem: 'high_impact',
          fontFamily: 'Archivo Black',
          bgColor: '#0A0E1A',
          accentColor: '#3B82F6',
          ctaColor: '#10B981',
          textColor: '#FFFFFF',
          badgeText: 'AUTORIDADE',
          shadow: '0 12px 32px rgba(59,130,246,0.3)',
          gradient: 'linear-gradient(135deg, #0A0E1A 0%, #1E3A8A 100%)',
        },
      },
      {
        name: 'Antes & Depois — Comparativo de Transformação',
        network: 'instagram',
        category: 'storytelling',
        type: 'feed',
        aspect_ratio: '1:1',
        dimensions: '1080x1080',
        layout_data: {
          pattern: 'before_after',
          grid: 'split-2-columns',
          headline: 'A VIRADA DE CHAVE: ANTES vs DEPOIS',
          subhead: 'O mesmo esforço, mas com método validado. Veja o que mudou na entrega.',
          badge: 'TRANSFORMAÇÃO REAL',
          ctaText: 'Quer um diagnóstico gratuito? Mande um direct!',
          beforeLabel: '❌ ANTES: Improviso e Alcance Estagnado',
          afterLabel: '✅ DEPOIS: Processo Calibrado e +320% Conversão',
        },
        style_settings: {
          designSystem: 'high_impact',
          fontFamily: 'Archivo Black',
          bgColor: '#120D1D',
          accentColor: '#EC4899',
          ctaColor: '#8B5CF6',
          textColor: '#FFFFFF',
          badgeText: 'ANTES & DEPOIS',
          shadow: '0 12px 34px rgba(236,72,153,0.35)',
          gradient: 'linear-gradient(140deg, #120D1D 0%, #3B0764 100%)',
        },
      },
      {
        name: 'Case de Sucesso — Prova Social e Resultado Concreto',
        network: 'linkedin',
        category: 'autoridade',
        type: 'feed',
        aspect_ratio: '4:5',
        dimensions: '1080x1350',
        layout_data: {
          pattern: 'case_study',
          grid: 'case-metric-highlight',
          headline: 'COMO NOSSO CLIENTE ATINGIU +180% DE ROI EM 30 DIAS',
          subhead:
            'Estudo de caso real: o ponto de partida, o gargalo identificado e a alavanca aplicada.',
          badge: 'ESTUDO DE CASO',
          ctaText: 'Toque para ler os bastidores e replicar na sua operação',
          metricMain: '+180% ROI',
          metricContext: 'Em 30 dias de implementação estruturada',
        },
        style_settings: {
          designSystem: 'high_impact',
          fontFamily: 'Archivo Black',
          bgColor: '#0F172A',
          accentColor: '#10B981',
          ctaColor: '#3B82F6',
          textColor: '#FFFFFF',
          badgeText: 'CASE APROVADO',
          shadow: '0 12px 36px rgba(16,185,129,0.3)',
          gradient: 'linear-gradient(135deg, #0F172A 0%, #064E3B 100%)',
        },
      },
      {
        name: 'Anúncio de Impacto — Oferta Irresistível & Fim de Lote',
        network: 'all',
        category: 'promo',
        type: 'feed',
        aspect_ratio: '1:1',
        dimensions: '1080x1080',
        layout_data: {
          pattern: 'direct_response',
          grid: 'promo-direct-impact',
          headline: 'ÚLTIMAS VAGAS COM BÔNUS EXCLUSIVO',
          subhead:
            'Condição por tempo limitado. Garanta agora seu acesso antes que encerre o primeiro lote.',
          badge: 'OFERTA LIMITADA',
          ctaText: 'GARANTIR MINHA VAGA AGORA 🚀',
          urgencyNotice: '⏰ Válido apenas nas próximas 24 horas ou até acabarem as vagas.',
        },
        style_settings: {
          designSystem: 'high_impact',
          fontFamily: 'Archivo Black',
          bgColor: '#180B0B',
          accentColor: '#EF4444',
          ctaColor: '#F59E0B',
          textColor: '#FFFFFF',
          badgeText: 'PROMOÇÃO',
          shadow: '0 14px 40px rgba(239,68,68,0.4)',
          gradient: 'linear-gradient(145deg, #180B0B 0%, #450A0A 100%)',
        },
      },
    ]

    for (let i = 0; i < catalogTemplates.length; i++) {
      const item = catalogTemplates[i]
      try {
        const existing = app.findRecordsByFilter(
          'post_templates',
          `name = "${item.name.replace(/"/g, '\\"')}"`,
          '',
          1,
          0,
        )
        if (!existing || existing.length === 0) {
          const rec = new Record(tplCol)
          rec.set('user', ownerId)
          rec.set('name', item.name)
          rec.set('network', item.network)
          rec.set('category', item.category)
          rec.set('type', item.type)
          rec.set('aspect_ratio', item.aspect_ratio)
          rec.set('dimensions', item.dimensions)
          rec.set('layout_data', JSON.stringify(item.layout_data))
          rec.set('style_settings', JSON.stringify(item.style_settings))
          rec.set('is_favorite', true)
          rec.set('is_shared', true)
          app.save(rec)
        }
      } catch (e) {
        console.warn('0082: erro ao criar template:', item.name, e)
      }
    }
  },
  (app) => {
    const names = [
      'Carrossel de Alto Valor — 5 Passos Estratégicos',
      'Post de Valor / Insight Rápido em 3 Atos',
      'Antes & Depois — Comparativo de Transformação',
      'Case de Sucesso — Prova Social e Resultado Concreto',
      'Anúncio de Impacto — Oferta Irresistível & Fim de Lote',
    ]
    for (let i = 0; i < names.length; i++) {
      try {
        const records = app.findRecordsByFilter(
          'post_templates',
          `name = "${names[i].replace(/"/g, '\\"')}"`,
          '',
          1,
          0,
        )
        if (records && records.length > 0) {
          app.delete(records[0])
        }
      } catch (_) {}
    }
  },
)
