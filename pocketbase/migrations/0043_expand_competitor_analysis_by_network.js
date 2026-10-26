migrate(
  (app) => {
    // =========================================================================
    // Migration 0043: Expandir competitor_analysis com métricas por rede social
    // Adiciona campo 'posts_count' e semeia competidores nas 7 redes pedidas:
    // Instagram, Facebook, LinkedIn, TikTok, WhatsApp, YouTube, Twitter/X
    // =========================================================================
    const competitorCol = app.findCollectionByNameOrId('competitor_analysis')

    if (!competitorCol.fields.getByName('posts_count')) {
      competitorCol.fields.add(
        new NumberField({
          name: 'posts_count',
          required: false,
          min: 0,
        }),
      )
      app.save(competitorCol)
    }

    // Semear concorrentes para todas as redes sociais requeridas por marca
    try {
      const brandsList = app.findRecordsByFilter('brands', '', '-created', 100, 0)
      for (let b = 0; b < brandsList.length; b++) {
        const brandRec = brandsList[b]
        const brandId = brandRec.id
        const userId = brandRec.getString('user')

        // 7 redes sociais requeridas: instagram, facebook, linkedin, tiktok, whatsapp, youtube, twitter
        const networkSeeds = [
          // Instagram
          {
            name: 'TechWave Criativa',
            handle: '@techwave.criativa',
            network: 'instagram',
            followers: 28400,
            engagement: 4.8,
            frequency: '5 posts / semana',
            growth: 4.2,
            postsCount: 184,
            strengths: ['Vídeos curtos no Reels', 'Identidade visual consistente'],
            weaknesses: ['Pouco engajamento nos Stories', 'Respostas lentas na DM'],
            notes: 'Forte presença em Reels visuais, mas menor retenção em carrosséis técnicos.',
          },
          {
            name: 'Pulse Media Digital',
            handle: '@pulsemediabr',
            network: 'instagram',
            followers: 18900,
            engagement: 5.9,
            frequency: '3 posts / semana',
            growth: 6.8,
            postsCount: 142,
            strengths: ['Carrosséis educativos aprofundados', 'Comunidade ativa nos comentários'],
            weaknesses: ['Frequência irregular', 'Pouca produção de vídeo'],
            notes: 'Referência em carrosséis de autoridade, com público muito engajado.',
          },
          // Facebook
          {
            name: 'Social Boost Brasil',
            handle: 'fb.com/socialboostbr',
            network: 'facebook',
            followers: 22100,
            engagement: 3.4,
            frequency: '4 posts / semana',
            growth: 2.1,
            postsCount: 310,
            strengths: ['Grupos de discussão engajados', 'Lives mensais com especialistas'],
            weaknesses: ['Baixo alcance orgânico na página', 'Pouco tráfego jovem'],
            notes: 'Mantém comunidade ativa via grupos nichados no Facebook.',
          },
          {
            name: 'Conexão Digital Hub',
            handle: 'fb.com/conexaodigitalhub',
            network: 'facebook',
            followers: 15400,
            engagement: 3.8,
            frequency: '3 posts / semana',
            growth: 3.5,
            postsCount: 195,
            strengths: ['Compartilhamentos orgânicos altos', 'Artigos explicativos'],
            weaknesses: ['Design datado nos criativos', 'Respostas automáticas frias'],
            notes: 'Foco em conteúdo comunitário com alto volume de compartilhamentos.',
          },
          // LinkedIn
          {
            name: 'Vanguard Hub Corporativo',
            handle: 'vanguard-hub-brasil',
            network: 'linkedin',
            followers: 34500,
            engagement: 4.6,
            frequency: '4 posts / semana',
            growth: 5.1,
            postsCount: 220,
            strengths: ['Artigos longos e liderança de pensamento', 'C-levels engajando'],
            weaknesses: ['Linguagem formal excessiva', 'Pouca experimentação de formatos'],
            notes: 'Grande base B2B, porém taxa de cliques menor que a da sua marca.',
          },
          {
            name: 'B2B Growth Masters',
            handle: 'b2b-growth-masters',
            network: 'linkedin',
            followers: 21800,
            engagement: 5.2,
            frequency: '3 posts / semana',
            growth: 7.3,
            postsCount: 165,
            strengths: ['Infográficos e frameworks visuais', 'Cases de sucesso em carrossel'],
            weaknesses: ['Pouca consistência em vídeos', 'Menos artigos nativos'],
            notes: 'Benchmark em carrosséis corporativos com alto índice de reposts.',
          },
          // TikTok
          {
            name: 'Viralize Creators Lab',
            handle: '@viralize.lab',
            network: 'tiktok',
            followers: 47200,
            engagement: 7.4,
            frequency: '7 vídeos / semana',
            growth: 12.5,
            postsCount: 410,
            strengths: [
              'Alta retenção nos primeiros 3 segundos',
              'Uso inteligente de áudios em alta',
            ],
            weaknesses: ['Baixa conversão para vendas', 'Comunidade volátil'],
            notes: 'Foco massivo em visualizações virais, mas menor autoridade de produto.',
          },
          {
            name: 'Spark Trend Studio',
            handle: '@sparktrend.br',
            network: 'tiktok',
            followers: 32600,
            engagement: 6.8,
            frequency: '5 vídeos / semana',
            growth: 9.8,
            postsCount: 280,
            strengths: ['Narrativas dinâmicas com legendas rápidas', 'Edição ritmo acelerado'],
            weaknesses: ['Menor aprofundamento técnico', 'Duração curta dos conteúdos'],
            notes: 'Excelente tração com formato de dicas práticas de 20 segundos.',
          },
          // WhatsApp
          {
            name: 'Canal VIP Comunidade Pro',
            handle: 'chat.whatsapp.com/vip-pro',
            network: 'whatsapp',
            followers: 8600,
            engagement: 14.2,
            frequency: '2 avisos / dia',
            growth: 8.9,
            postsCount: 350,
            strengths: [
              'Abertura de mensagens acima de 70%',
              'Canal direto para ofertas relâmpago',
            ],
            weaknesses: ['Risco de ruído se enviar mensagens em excesso', 'Pouca viralidade'],
            notes: 'Canal de alta conversão direta e fidelização dos clientes mais fiéis.',
          },
          {
            name: 'Boletim Social Express',
            handle: 'chat.whatsapp.com/social-express',
            network: 'whatsapp',
            followers: 6400,
            engagement: 11.5,
            frequency: '1 áudio resumo / dia',
            growth: 6.2,
            postsCount: 210,
            strengths: ['Áudios curtos de bastidores', 'Links com alta taxa de clique'],
            weaknesses: ['Sem recursos de comentários públicos', 'Base limitada a opt-in'],
            notes: 'Forte presença matinal com resumo do dia e links úteis.',
          },
          // YouTube
          {
            name: 'Studio Mídia Play',
            handle: '@studiomidiaplay',
            network: 'youtube',
            followers: 26500,
            engagement: 5.8,
            frequency: '2 vídeos longos + 4 Shorts / semana',
            growth: 6.4,
            postsCount: 190,
            strengths: ['Thumbnails clicáveis de alto CTR', 'SEO impecável nas buscas'],
            weaknesses: ['Custo alto de produção', 'Retenção oscilante acima de 8 minutos'],
            notes: 'Canal com forte relevância de pesquisa a longo prazo no YouTube.',
          },
          {
            name: 'Canal Conteúdo Estratégico',
            handle: '@conteudoestrategicobr',
            network: 'youtube',
            followers: 17200,
            engagement: 6.1,
            frequency: '1 tutorial + 3 Shorts / semana',
            growth: 7.9,
            postsCount: 135,
            strengths: ['Tutoriais aprofundados passo a passo', 'Shorts com ganchos fortes'],
            weaknesses: ['Edições simples', 'Menor frequência de uploads'],
            notes: 'Excelente taxa de inscritos vindos de tutoriais de como fazer.',
          },
          // Twitter / X
          {
            name: 'Apex Growth & Strategy',
            handle: '@apex_growth_br',
            network: 'twitter',
            followers: 14200,
            engagement: 5.6,
            frequency: '2 threads / dia',
            growth: 8.3,
            postsCount: 620,
            strengths: ['Threads de alto impacto e debate', 'Engajamento em tempo real'],
            weaknesses: ['Poucos criativos visuais', 'Dependência de polêmicas'],
            notes: 'Muito ativo em discussões de nicho e comentários rápidos no X.',
          },
          {
            name: 'Radar Social X',
            handle: '@radarsocial_x',
            network: 'twitter',
            followers: 9800,
            engagement: 6.3,
            frequency: '3 posts / dia',
            growth: 10.1,
            postsCount: 480,
            strengths: ['Curadoria de notícias em tempo real', 'Fio com resumo semanal'],
            weaknesses: ['Muitos links externos com menor alcance', 'Pouca imagem original'],
            notes: 'Forte autoridade imediata sobre notícias de mercado e tendências.',
          },
        ]

        for (let c = 0; c < networkSeeds.length; c++) {
          const item = networkSeeds[c]
          let existingRec = null
          try {
            existingRec = app.findFirstRecordByFilter(
              'competitor_analysis',
              `brand = "${brandId}" && name = "${item.name}" && network = "${item.network}"`,
            )
          } catch (_) {
            existingRec = null
          }

          if (existingRec) {
            // Atualizar posts_count se ausente
            if (!existingRec.getInt('posts_count')) {
              existingRec.set('posts_count', item.postsCount)
              app.save(existingRec)
            }
          } else {
            const compRec = new Record(competitorCol)
            compRec.set('brand', brandId)
            if (userId) compRec.set('user', userId)
            compRec.set('name', item.name)
            compRec.set('handle', item.handle)
            compRec.set('network', item.network)
            compRec.set('estimated_followers', item.followers)
            compRec.set('estimated_engagement_rate', item.engagement)
            compRec.set('post_frequency', item.frequency)
            compRec.set('estimated_growth_rate', item.growth)
            compRec.set('posts_count', item.postsCount)
            compRec.set('strengths', JSON.stringify(item.strengths))
            compRec.set('weaknesses', JSON.stringify(item.weaknesses))
            compRec.set('notes', item.notes)
            compRec.set('is_simulated', true)
            app.save(compRec)
          }
        }
      }
    } catch (e) {
      console.log('Erro ao semear competitor_analysis:', e)
    }
  },
  (app) => {
    // Reversão limpa
  },
)
