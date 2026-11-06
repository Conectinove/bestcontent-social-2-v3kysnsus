migrate(
  (app) => {
    // Migration 0083: Inserção forçada idempotente dos 5 modelos de post essenciais PT-BR em post_templates
    const tplCol = app.findCollectionByNameOrId('post_templates')
    if (!tplCol) return

    let ownerId = ''
    try {
      const users = app.findRecordsByFilter('users', 'id != ""', '-created', 1, 0)
      if (users && users.length > 0) ownerId = users[0].id
    } catch (_) {}
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
          rec.set('layout_data', item.layout_data)
          rec.set('style_settings', item.style_settings)
          rec.set('is_favorite', true)
          rec.set('is_shared', true)
          app.save(rec)
        }
      } catch (e) {
        console.warn('0083: erro ao criar template:', item.name, e)
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
