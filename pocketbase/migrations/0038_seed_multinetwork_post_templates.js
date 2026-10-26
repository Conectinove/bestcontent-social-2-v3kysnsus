migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('post_templates')
    let admin = null
    try {
      admin = app.findAuthRecordByEmail('_pb_users_auth_', 'ronaldoconectinove@gmail.com')
    } catch (_) {}

    const adminId = admin ? admin.id : ''

    // Novos modelos solicitados para:
    // - LinkedIn (1200×627 / 1080×1350)
    // - Facebook (1080×1080 / 1080×1920)
    // - WhatsApp (1125×600 / 1080×1920)
    // - Instagram (1080×1350 / 1080×1920)
    // Categorias: promo, educativo, storytelling, autoridade, engajamento
    const templates = [
      // ==========================================
      // LINKEDIN (1200x627 & 1080x1350)
      // ==========================================
      {
        name: 'LinkedIn Carrossel Lição Aprendida',
        network: 'linkedin',
        category: 'storytelling',
        type: 'feed',
        aspect_ratio: '4:5',
        dimensions: '1080x1350',
        layout_data: {
          grid: 'linkedin-lesson',
          headline: '3 Lições Duras que Levei 10 Anos de Mercado para Aprender',
          subhead: 'O erro que quase quebrou minha primeira operação e a virada de chave',
          slideNumber: '1 de 5 · Lição Prática',
          ctaText: 'Deslize para ver os insights completos →',
        },
        style_settings: {
          bgColor: '#0A1628',
          accentColor: '#0A66C2',
          ctaColor: '#38BDF8',
          textColor: '#FFFFFF',
          badgeText: '⚡ TOP LIÇÃO APRENDIDA',
          cardBg: 'rgba(255, 255, 255, 0.06)',
          gradient: 'linear-gradient(135deg, #0A1628 0%, #1E293B 100%)',
        },
      },
      {
        name: 'LinkedIn Post de Contratação & Cultura',
        network: 'linkedin',
        category: 'promo',
        type: 'feed',
        aspect_ratio: '16:9',
        dimensions: '1200x627',
        layout_data: {
          grid: 'linkedin-culture',
          headline: 'ESTAMOS CONTRATANDO: CULTURA, AUTONOMIA & CRESCIMENTO',
          subhead: 'Buscamos talentos criativos para liderar a próxima fase de escala',
          ctaText: 'Candidate-se pelo link no post',
        },
        style_settings: {
          bgColor: '#0F172A',
          accentColor: '#0A66C2',
          ctaColor: '#60A5FA',
          textColor: '#F8FAFC',
          badgeText: '⚡ TOP VAGA & CULTURA',
          cardBg: 'rgba(255, 255, 255, 0.08)',
          gradient: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)',
        },
      },
      {
        name: 'LinkedIn Gráfico de Dados de Mercado',
        network: 'linkedin',
        category: 'autoridade',
        type: 'feed',
        aspect_ratio: '4:5',
        dimensions: '1080x1350',
        layout_data: {
          grid: 'linkedin-chart-data',
          headline: 'Dados do Mercado: O Retorno Real da Automação com IA em 2026',
          subhead: 'Análise de benchmark em 250 empresas de tecnologia e serviços',
          ctaText: 'Salve este infográfico para apresentar ao time',
        },
        style_settings: {
          bgColor: '#031726',
          accentColor: '#0077B5',
          ctaColor: '#10B981',
          textColor: '#FFFFFF',
          badgeText: '⚡ TOP DADOS DE MERCADO',
          cardBg: 'rgba(255, 255, 255, 0.07)',
          gradient: 'linear-gradient(135deg, #031726 0%, #0F2942 100%)',
        },
      },
      {
        name: 'LinkedIn Bastidor Corporativo Executivo',
        network: 'linkedin',
        category: 'engajamento',
        type: 'feed',
        aspect_ratio: '16:9',
        dimensions: '1200x627',
        layout_data: {
          grid: 'linkedin-backstage',
          headline: 'Por Trás da Tomada de Decisão que Dobrou Nossa Eficiência',
          subhead: 'Como reorganizamos os fluxos de trabalho sem contratar mais ferramentas',
          ctaText: 'Participe do debate nos comentários',
        },
        style_settings: {
          bgColor: '#111827',
          accentColor: '#6366F1',
          ctaColor: '#818CF8',
          textColor: '#F9FAFB',
          badgeText: '⚡ TOP BASTIDOR EXECUTIVO',
          cardBg: 'rgba(255, 255, 255, 0.05)',
          gradient: 'linear-gradient(135deg, #111827 0%, #1F2937 100%)',
        },
      },

      // ==========================================
      // FACEBOOK (1080x1080 & 1080x1920)
      // ==========================================
      {
        name: 'Facebook Post de Evento Local',
        network: 'facebook',
        category: 'promo',
        type: 'feed',
        aspect_ratio: '1:1',
        dimensions: '1080x1080',
        layout_data: {
          grid: 'fb-local-event',
          headline: 'ENCONTRO PRESENCIAL: NETWORKING & INOVAÇÃO',
          subhead: 'Sábado às 14h · Vagas limitadas para criadores e empresários',
          ctaText: 'Confirmar Presença no Evento',
        },
        style_settings: {
          bgColor: '#0A192F',
          accentColor: '#1877F2',
          ctaColor: '#38BDF8',
          textColor: '#FFFFFF',
          badgeText: '⚡ TOP EVENTO LOCAL',
          cardBg: 'rgba(255, 255, 255, 0.08)',
          gradient: 'linear-gradient(135deg, #0A192F 0%, #1E3A8A 100%)',
        },
      },
      {
        name: 'Facebook Enquete Envolvimento de Comunidade',
        network: 'facebook',
        category: 'engajamento',
        type: 'feed',
        aspect_ratio: '1:1',
        dimensions: '1080x1080',
        layout_data: {
          grid: 'fb-community-poll',
          headline: 'Qual conteúdo você mais quer ver por aqui este mês?',
          subhead: 'A) Bastidores & Rotina  B) Dicas Práticas  C) Ofertas Especiais',
          ctaText: 'Deixe sua letra nos comentários!',
        },
        style_settings: {
          bgColor: '#1E1B4B',
          accentColor: '#2563EB',
          ctaColor: '#60A5FA',
          textColor: '#FFFFFF',
          badgeText: '⚡ TOP ENQUETE COMUNIDADE',
          cardBg: 'rgba(255, 255, 255, 0.07)',
          gradient: 'linear-gradient(135deg, #1E1B4B 0%, #172554 100%)',
        },
      },
      {
        name: 'Facebook Oferta de Loja com Cupom',
        network: 'facebook',
        category: 'promo',
        type: 'feed',
        aspect_ratio: '1:1',
        dimensions: '1080x1080',
        layout_data: {
          grid: 'fb-coupon-offer',
          headline: 'CUPOM EXCLUSIVO PARA SEGUIDORES DA PÁGINA',
          subhead: 'Use o código SOCIALVIP e garanta 30% OFF na sua compra',
          ctaText: 'Resgatar Cupom de Desconto',
        },
        style_settings: {
          bgColor: '#180224',
          accentColor: '#E11D48',
          ctaColor: '#F43F5E',
          textColor: '#FFFFFF',
          badgeText: '⚡ TOP CUPOM EXCLUSIVO',
          cardBg: 'rgba(255, 255, 255, 0.08)',
          gradient: 'linear-gradient(135deg, #180224 0%, #4C0519 100%)',
        },
      },
      {
        name: 'Facebook Stories Aniversário da Empresa',
        network: 'facebook',
        category: 'storytelling',
        type: 'story',
        aspect_ratio: '9:16',
        dimensions: '1080x1920',
        layout_data: {
          grid: 'fb-anniversary-story',
          headline: 'HOJE É DIA DE FESTA: NOSSO ANIVERSÁRIO!',
          subhead: 'Mais de 3 anos transformando ideias em resultados com vocês',
          ctaText: 'Deixe sua mensagem de parabéns!',
        },
        style_settings: {
          bgColor: '#0F172A',
          accentColor: '#F59E0B',
          ctaColor: '#FBBF24',
          textColor: '#FFFFFF',
          badgeText: '⚡ TOP ANIVERSÁRIO DA MARCA',
          cardBg: 'rgba(255, 255, 255, 0.06)',
          gradient: 'linear-gradient(180deg, #0F172A 0%, #78350F 100%)',
        },
      },

      // ==========================================
      // WHATSAPP (1125x600 & 1080x1920)
      // ==========================================
      {
        name: 'WhatsApp Lista de Preços e Serviços',
        network: 'whatsapp',
        category: 'educativo',
        type: 'feed',
        aspect_ratio: '16:9',
        dimensions: '1125x600',
        layout_data: {
          grid: 'wa-price-list',
          headline: 'TABELA DE PREÇOS & SERVIÇOS ATUALIZADA',
          subhead: 'Pacotes promocionais válidos para novos atendimentos desta semana',
          ctaText: 'Toque para solicitar um orçamento',
        },
        style_settings: {
          bgColor: '#062B22',
          accentColor: '#25D366',
          ctaColor: '#10B981',
          textColor: '#FFFFFF',
          badgeText: '⚡ TOP TABELA DE SERVIÇOS',
          cardBg: 'rgba(255, 255, 255, 0.08)',
          gradient: 'linear-gradient(135deg, #062B22 0%, #064E3B 100%)',
        },
      },
      {
        name: 'WhatsApp Aviso de Horário Especial',
        network: 'whatsapp',
        category: 'educativo',
        type: 'story',
        aspect_ratio: '9:16',
        dimensions: '1080x1920',
        layout_data: {
          grid: 'wa-special-hours',
          headline: 'COMUNICADO: HORÁRIO ESPECIAL DE ATENDIMENTO',
          subhead: 'Confira as datas e canais de plantão urgente neste feriado prolongado',
          ctaText: 'Chamar no suporte via chat',
        },
        style_settings: {
          bgColor: '#022C22',
          accentColor: '#25D366',
          ctaColor: '#34D399',
          textColor: '#F0FDF4',
          badgeText: '⚡ TOP HORÁRIO ESPECIAL',
          cardBg: 'rgba(255, 255, 255, 0.07)',
          gradient: 'linear-gradient(180deg, #022C22 0%, #065F46 100%)',
        },
      },
      {
        name: 'WhatsApp Confirmação de Agendamento',
        network: 'whatsapp',
        category: 'autoridade',
        type: 'feed',
        aspect_ratio: '16:9',
        dimensions: '1125x600',
        layout_data: {
          grid: 'wa-booking-confirm',
          headline: 'AGENDAMENTO CONFIRMADO COM SUCESSO',
          subhead: 'Revise os dados de sua consulta ou reunião no card abaixo',
          ctaText: 'Salvar na agenda do WhatsApp',
        },
        style_settings: {
          bgColor: '#083344',
          accentColor: '#06B6D4',
          ctaColor: '#22D3EE',
          textColor: '#FFFFFF',
          badgeText: '⚡ TOP AGENDAMENTO CONFIRMADO',
          cardBg: 'rgba(255, 255, 255, 0.07)',
          gradient: 'linear-gradient(135deg, #083344 0%, #164E63 100%)',
        },
      },
      {
        name: 'WhatsApp Promoção de Gráfico VIP',
        network: 'whatsapp',
        category: 'promo',
        type: 'story',
        aspect_ratio: '9:16',
        dimensions: '1080x1920',
        layout_data: {
          grid: 'wa-vip-promo-card',
          headline: 'GRUPO VIP EXCLUSIVO: ACESSO ANTECIPADO',
          subhead: 'Link de compra liberado 2 horas antes do público geral com brinde',
          ctaText: 'Garantir minha vaga na lista VIP',
        },
        style_settings: {
          bgColor: '#14532D',
          accentColor: '#22C55E',
          ctaColor: '#4ADE80',
          textColor: '#F0FDF4',
          badgeText: '⚡ TOP PROMOÇÃO VIP',
          cardBg: 'rgba(255, 255, 255, 0.09)',
          gradient: 'linear-gradient(180deg, #14532D 0%, #052E16 100%)',
        },
      },

      // ==========================================
      // INSTAGRAM (1080x1350 & 1080x1920)
      // ==========================================
      {
        name: 'Instagram Carrossel Checklist Prático',
        network: 'instagram',
        category: 'educativo',
        type: 'feed',
        aspect_ratio: '4:5',
        dimensions: '1080x1350',
        layout_data: {
          grid: 'insta-checklist',
          headline: 'Checklist Diário: 5 Itens Antes de Publicar Qualquer Post',
          subhead: 'O passo a passo essencial para garantir retenção e alcance orgânico',
          slideNumber: '1 de 6 · Checklist Prático',
          ctaText: 'Arraste para salvar o checklist completo →',
        },
        style_settings: {
          bgColor: '#0F0B1E',
          accentColor: '#9333EA',
          ctaColor: '#C084FC',
          textColor: '#F8FAFC',
          badgeText: '⚡ TOP CHECKLIST PRÁTICO',
          cardBg: 'rgba(255, 255, 255, 0.06)',
          gradient: 'linear-gradient(135deg, #0F0B1E 0%, #3B0764 100%)',
        },
      },
      {
        name: 'Instagram Quote Card Inspirador',
        network: 'instagram',
        category: 'autoridade',
        type: 'feed',
        aspect_ratio: '4:5',
        dimensions: '1080x1350',
        layout_data: {
          grid: 'insta-quote-card',
          headline: '"A constância bate o talento quando o talento esquece de ser constante."',
          subhead: 'Construa sua autoridade digital um dia por vez com método e clareza',
          authorRole: 'Princípio de Marca & Crescimento',
          ctaText: 'Salve para ler nos dias difíceis',
        },
        style_settings: {
          bgColor: '#18181B',
          accentColor: '#EC4899',
          ctaColor: '#F472B6',
          textColor: '#FFFFFF',
          badgeText: '⚡ TOP QUOTE INSPIRADOR',
          cardBg: 'rgba(255, 255, 255, 0.05)',
          gradient: 'linear-gradient(135deg, #18181B 0%, #27272A 100%)',
        },
      },
      {
        name: 'Instagram Antes e Depois com CTA',
        network: 'instagram',
        category: 'storytelling',
        type: 'feed',
        aspect_ratio: '4:5',
        dimensions: '1080x1350',
        layout_data: {
          grid: 'insta-before-after',
          headline: 'Antes: 2h por post. Depois: 15 minutos com IA e Estratégia',
          subhead: 'Veja a transformação real no volume de conteúdos de nossos criadores',
          ctaText: 'Descubra como replicar no seu perfil',
        },
        style_settings: {
          bgColor: '#0B0F19',
          accentColor: '#8B5CF6',
          ctaColor: '#06B6D4',
          textColor: '#FFFFFF',
          badgeText: '⚡ TOP ANTES / DEPOIS',
          cardBg: 'rgba(255, 255, 255, 0.07)',
          gradient: 'linear-gradient(135deg, #0B0F19 0%, #1E1B4B 100%)',
        },
      },
      {
        name: 'Instagram Stories Enquete Interativa',
        network: 'instagram',
        category: 'engajamento',
        type: 'story',
        aspect_ratio: '9:16',
        dimensions: '1080x1920',
        layout_data: {
          grid: 'insta-story-poll',
          headline: 'VOCÊ PREFERE TRABALHAR 100% REMOTO OU HÍBRIDO?',
          subhead: 'Vote agora no sticker abaixo para vermos o resultado geral',
          ctaText: 'Toque para votar no Stories',
        },
        style_settings: {
          bgColor: '#180224',
          accentColor: '#D946EF',
          ctaColor: '#F0ABFC',
          textColor: '#FFFFFF',
          badgeText: '⚡ TOP STORIES ENQUETE',
          cardBg: 'rgba(255, 255, 255, 0.08)',
          gradient: 'linear-gradient(180deg, #180224 0%, #4A044E 100%)',
        },
      },
    ]

    for (let i = 0; i < templates.length; i++) {
      const item = templates[i]
      try {
        app.findFirstRecordByFilter('post_templates', `name = "${item.name}"`)
      } catch (_) {
        const record = new Record(col)
        if (adminId) record.set('user', adminId)
        record.set('name', item.name)
        record.set('network', item.network)
        record.set('category', item.category)
        record.set('type', item.type)
        record.set('aspect_ratio', item.aspect_ratio)
        record.set('dimensions', item.dimensions)
        record.set('layout_data', JSON.stringify(item.layout_data))
        record.set('style_settings', JSON.stringify(item.style_settings))
        record.set('is_shared', true)
        record.set('is_favorite', false)
        app.save(record)
      }
    }
  },
  (app) => {
    // Reverter templates específicos criados nesta migration
    try {
      const names = [
        'LinkedIn Carrossel Lição Aprendida',
        'LinkedIn Post de Contratação & Cultura',
        'LinkedIn Gráfico de Dados de Mercado',
        'LinkedIn Bastidor Corporativo Executivo',
        'Facebook Post de Evento Local',
        'Facebook Enquete Envolvimento de Comunidade',
        'Facebook Oferta de Loja com Cupom',
        'Facebook Stories Aniversário da Empresa',
        'WhatsApp Lista de Preços e Serviços',
        'WhatsApp Aviso de Horário Especial',
        'WhatsApp Confirmação de Agendamento',
        'WhatsApp Promoção de Gráfico VIP',
        'Instagram Carrossel Checklist Prático',
        'Instagram Quote Card Inspirador',
        'Instagram Antes e Depois com CTA',
        'Instagram Stories Enquete Interativa',
      ]
      for (let i = 0; i < names.length; i++) {
        try {
          const rec = app.findFirstRecordByFilter('post_templates', `name = "${names[i]}"`)
          app.delete(rec)
        } catch (_) {}
      }
    } catch (_) {}
  },
)
