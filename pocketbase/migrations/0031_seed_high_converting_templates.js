migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('post_templates')
    const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'ronaldoconectinove@gmail.com')
    if (!admin) return

    // Catálogo aprofundado com novos modelos de alta conversão:
    // destaques/quotes, lançamentos, bastidores, prova social, urgência/escassez,
    // datas comemorativas, educacionais passo-a-passo, comparativos antes/depois.
    const curatedTemplates = [
      // 1. Instagram Comparativo Antes / Depois
      {
        name: 'Instagram Comparativo Antes e Depois',
        network: 'instagram',
        category: 'autoridade',
        type: 'feed',
        aspect_ratio: '4:5',
        dimensions: '1080x1350',
        layout_data: {
          grid: 'split-compare',
          headline: 'A Transformação Real da Marca em 60 Dias',
          subhead: 'Antes: Inconsistência e baixo alcance. Depois: +320% em conversão orgânica.',
          badge: 'TRANSFORMAÇÃO REAL',
          ctaText: 'Veja os detalhes na legenda',
        },
        style_settings: {
          bgColor: '#0A0E1A',
          accentColor: '#10B981',
          ctaColor: '#059669',
          textColor: '#FFFFFF',
          badgeText: 'ESTUDO DE CASO',
          cardBg: 'rgba(255, 255, 255, 0.06)',
          gradient: 'linear-gradient(135deg, #0A0E1A 0%, #064E3B 100%)',
        },
      },
      // 2. Instagram Urgência e Escassez (Últimas Vagas)
      {
        name: 'Instagram Urgência Últimas Vagas do Lote',
        network: 'instagram',
        category: 'promo',
        type: 'feed',
        aspect_ratio: '1:1',
        dimensions: '1080x1080',
        layout_data: {
          grid: 'scarcity-alert',
          headline: 'ÚLTIMAS 7 VAGAS COM VALOR PROMOCIONAL',
          subhead: 'O lote atual se encerra hoje às 23h59 ou até esgotarem as inscrições.',
          badge: '92% PREENCHIDO',
          ctaText: 'Garanta sua vaga pelo Link da Bio',
        },
        style_settings: {
          bgColor: '#1A0B10',
          accentColor: '#F43F5E',
          ctaColor: '#E11D48',
          textColor: '#FFFFFF',
          badgeText: 'ESCASSEZ REAL',
          cardBg: 'rgba(244, 63, 94, 0.1)',
          gradient: 'linear-gradient(135deg, #1A0B10 0%, #4C0519 100%)',
        },
      },
      // 3. Instagram Bastidores e Processo Criativo
      {
        name: 'Instagram Bastidores da Produção',
        network: 'instagram',
        category: 'storytelling',
        type: 'feed',
        aspect_ratio: '4:5',
        dimensions: '1080x1350',
        layout_data: {
          grid: 'behind-scenes',
          headline: 'Como Criamos 30 Posts em Menos de 40 Minutos',
          subhead: 'Um olhar sincero sobre nosso fluxo de ideação, design com IA e revisão.',
          ctaText: 'Comente "BASTIDORES" para o checklist',
        },
        style_settings: {
          bgColor: '#111827',
          accentColor: '#8B5CF6',
          ctaColor: '#A78BFA',
          textColor: '#F9FAFB',
          badgeText: 'BASTIDORES OFICIAIS',
          cardBg: 'rgba(255, 255, 255, 0.05)',
          gradient: 'linear-gradient(135deg, #111827 0%, #1E1B4B 100%)',
        },
      },
      // 4. Instagram Data Comemorativa / Celebração Estratégica
      {
        name: 'Instagram Celebração & Data Comemorativa',
        network: 'instagram',
        category: 'engajamento',
        type: 'feed',
        aspect_ratio: '1:1',
        dimensions: '1080x1080',
        layout_data: {
          grid: 'commemorative',
          headline: 'Hoje Celebramos Quem Faz a Diferença Todos os Dias',
          subhead:
            'Uma homenagem especial a todos os criadores, empreendedores e clientes parceiros.',
          badge: 'DATA ESPECIAL',
          ctaText: 'Marque alguém incrível nos comentários',
        },
        style_settings: {
          bgColor: '#1F142E',
          accentColor: '#D946EF',
          ctaColor: '#C026D3',
          textColor: '#FFFFFF',
          badgeText: 'COMEMORAÇÃO',
          cardBg: 'rgba(217, 70, 239, 0.08)',
          gradient: 'linear-gradient(135deg, #1F142E 0%, #3B0764 100%)',
        },
      },
      // 5. TikTok Destaque / Quote de Impacto Vertical
      {
        name: 'TikTok Frase de Impacto e Reflexão',
        network: 'tiktok',
        category: 'storytelling',
        type: 'story',
        aspect_ratio: '9:16',
        dimensions: '1080x1920',
        layout_data: {
          grid: 'tiktok-quote-impact',
          headline: '"Se você não cria o seu próprio plano, fará parte do plano de alguém."',
          subhead: 'Assista até o fim para entender por que 2026 exige presença intencional.',
          ctaText: 'Salva este vídeo para lembrar amanhã ⭐',
        },
        style_settings: {
          bgColor: '#000000',
          accentColor: '#00F2FE',
          ctaColor: '#FE2C55',
          textColor: '#FFFFFF',
          badgeText: 'REFLEXÃO DO DIA',
          cardBg: 'rgba(0, 0, 0, 0.7)',
          gradient: 'linear-gradient(180deg, #000000 0%, #170F2E 100%)',
        },
      },
      // 6. TikTok Prova Social / Depoimento em Vídeo
      {
        name: 'TikTok Prova Social & Avaliação 5 Estrelas',
        network: 'tiktok',
        category: 'autoridade',
        type: 'story',
        aspect_ratio: '9:16',
        dimensions: '1080x1920',
        layout_data: {
          grid: 'tiktok-review-5stars',
          headline: '"O MELHOR INVESTIMENTO QUE FIZ NO MEU NEGÓCIO"',
          subhead: 'Avaliação real recebida hoje pelo WhatsApp de uma cliente de agência.',
          ctaText: 'Clique no link da bio para testar grátis',
        },
        style_settings: {
          bgColor: '#0B0F19',
          accentColor: '#F59E0B',
          ctaColor: '#FBBF24',
          textColor: '#FFFFFF',
          badgeText: '⭐⭐⭐⭐⭐ NOTA MÁXIMA',
          cardBg: 'rgba(255, 255, 255, 0.08)',
          gradient: 'linear-gradient(180deg, #0B0F19 0%, #1E1B4B 100%)',
        },
      },
      // 7. LinkedIn Lançamento de Produto B2B
      {
        name: 'LinkedIn Anúncio de Lançamento de Produto',
        network: 'linkedin',
        category: 'promo',
        type: 'feed',
        aspect_ratio: '4:5',
        dimensions: '1080x1350',
        layout_data: {
          grid: 'b2b-launch',
          headline: 'Apresentamos a Nova Era da Gestão de Conteúdo com IA',
          subhead:
            'Automação ética, governança de marcas e métricas preditivas para equipes exigentes.',
          badge: 'LANÇAMENTO GLOBAL',
          ctaText: 'Agende uma demonstração executiva',
        },
        style_settings: {
          bgColor: '#061325',
          accentColor: '#0A66C2',
          ctaColor: '#38BDF8',
          textColor: '#FFFFFF',
          badgeText: 'NOVIDADE CORPORATIVA',
          cardBg: 'rgba(10, 102, 194, 0.09)',
          gradient: 'linear-gradient(135deg, #061325 0%, #0F2942 100%)',
        },
      },
      // 8. LinkedIn Educacional Passo a Passo Carrossel
      {
        name: 'LinkedIn Guia Prático em 4 Etapas',
        network: 'linkedin',
        category: 'educativo',
        type: 'feed',
        aspect_ratio: '1:1',
        dimensions: '1080x1080',
        layout_data: {
          grid: 'b2b-step-guide',
          headline: '4 Fases para Implementar IA no Marketing sem Erros',
          subhead: 'Diagnóstico, padronização de prompt, workflow de aprovação e governança.',
          badge: 'PLAYBOOK EXECUTIVO',
          ctaText: 'Salve este post para sua equipe',
        },
        style_settings: {
          bgColor: '#0F172A',
          accentColor: '#6366F1',
          ctaColor: '#818CF8',
          textColor: '#F8FAFC',
          badgeText: 'GUIA ESTRATÉGICO',
          cardBg: 'rgba(255, 255, 255, 0.06)',
          gradient: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        },
      },
      // 9. Facebook Prova Social / Depoimento Visual
      {
        name: 'Facebook Card Prova Social e Resultados',
        network: 'facebook',
        category: 'autoridade',
        type: 'feed',
        aspect_ratio: '1:1',
        dimensions: '1080x1080',
        layout_data: {
          grid: 'fb-social-proof',
          headline: 'Mais de 10.000 posts gerados e aprovados pelos nossos clientes',
          subhead:
            'Descubra por que empreendedores de todo o país confiam no BestContent Social 2.',
          badge: 'RESULTADO COMPROVADO',
          ctaText: 'Veja depoimentos completos nos comentários',
        },
        style_settings: {
          bgColor: '#0E172A',
          accentColor: '#1877F2',
          ctaColor: '#38BDF8',
          textColor: '#FFFFFF',
          badgeText: 'CASE DE SUCESSO',
          cardBg: 'rgba(24, 119, 242, 0.08)',
          gradient: 'linear-gradient(135deg, #0E172A 0%, #1E3A8A 100%)',
        },
      },
      // 10. WhatsApp Comunicado de Urgência / Plantão
      {
        name: 'WhatsApp Plantão de Dúvidas e Suporte VIP',
        network: 'whatsapp',
        category: 'engajamento',
        type: 'feed',
        aspect_ratio: '16:9',
        dimensions: '1125x600',
        layout_data: {
          grid: 'wa-support-live',
          headline: 'PLANTÃO VIP ABERTO: FALE DIRETO COM O CONSULTOR',
          subhead: 'Tire suas dúvidas em tempo real antes do encerramento das inscrições de hoje.',
          badge: 'SUPORTE AO VIVO',
          ctaText: 'Envie uma mensagem agora',
        },
        style_settings: {
          bgColor: '#04221A',
          accentColor: '#25D366',
          ctaColor: '#10B981',
          textColor: '#FFFFFF',
          badgeText: 'ATENDIMENTO PRIORITÁRIO',
          cardBg: 'rgba(37, 211, 102, 0.09)',
          gradient: 'linear-gradient(135deg, #04221A 0%, #064E3B 100%)',
        },
      },
      // 11. YouTube Lançamento de Série / Temporada
      {
        name: 'YouTube Lançamento de Nova Série no Canal',
        network: 'youtube',
        category: 'promo',
        type: 'feed',
        aspect_ratio: '16:9',
        dimensions: '1280x720',
        layout_data: {
          grid: 'yt-series-launch',
          headline: 'ESTREIA HOJE: SÉRIE ESCALA COM INTELIGÊNCIA ARTIFICIAL',
          subhead: 'Episódio 1 liberado às 19h no canal com material complementar exclusivo.',
          badge: 'NOVA TEMPORADA',
          ctaText: 'Ative o Sininho de Notificação',
        },
        style_settings: {
          bgColor: '#000000',
          accentColor: '#FF0000',
          ctaColor: '#DC2626',
          textColor: '#FFFFFF',
          badgeText: 'ESTREIA EXCLUSIVA',
          cardBg: 'rgba(255, 0, 0, 0.1)',
          gradient: 'linear-gradient(135deg, #000000 0%, #450A0A 100%)',
        },
      },
      // 12. Twitter / X Citação & Provocação Filosófica
      {
        name: 'X / Twitter Provocação & Insight de Negócios',
        network: 'twitter',
        category: 'storytelling',
        type: 'feed',
        aspect_ratio: '16:9',
        dimensions: '1200x675',
        layout_data: {
          grid: 'x-philosophical-quote',
          headline: '"A pressa sem estratégia constrói dívidas; a disciplina constrói legados."',
          subhead: 'Qual a prioridade que define suas decisões desta semana?',
          badge: 'PENSAMENTO DO DIA',
          ctaText: 'Deixe sua reflexão abaixo 💭',
        },
        style_settings: {
          bgColor: '#050505',
          accentColor: '#9333EA',
          ctaColor: '#A855F7',
          textColor: '#F8FAFC',
          badgeText: 'INSIGHT FILOSÓFICO',
          cardBg: 'rgba(255, 255, 255, 0.04)',
          gradient: 'linear-gradient(135deg, #050505 0%, #1E1B4B 100%)',
        },
      },
    ]

    for (let i = 0; i < curatedTemplates.length; i++) {
      const item = curatedTemplates[i]
      try {
        // Idempotência por nome e rede
        app.findFirstRecordByFilter(
          'post_templates',
          `name = "${item.name}" && network = "${item.network}"`,
        )
      } catch (_) {
        const record = new Record(col)
        record.set('user', admin.id)
        record.set('name', item.name)
        record.set('network', item.network)
        record.set('category', item.category)
        record.set('type', item.type)
        record.set('aspect_ratio', item.aspect_ratio)
        record.set('dimensions', item.dimensions)
        record.set('is_shared', true)
        record.set('is_favorite', false)
        record.set('layout_data', JSON.stringify(item.layout_data))
        record.set('style_settings', JSON.stringify(item.style_settings))
        app.save(record)
      }
    }
  },
  (app) => {
    // Revert opcional
  },
)
