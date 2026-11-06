/// <reference path="../pb_data/types.d.ts" />

/**
 * Migration 0080: Seed de templates de prompt profissionais para Geração de Vídeo
 * no AI Media Studio (/app/studio).
 * Cobre formatos de alto impacto: Vídeo de Produto, Depoimento/UGC, Storytelling,
 * Tutorial Passo a Passo, Trending Reel/Short e Teaser de Lançamento.
 * Todos com placeholders detectados dinamicamente {produto}, {beneficio}, {estilo}, etc.
 */

migrate(
  (app) => {
    let collection
    try {
      collection = app.findCollectionByNameOrId('studio_prompt_templates')
    } catch {
      return
    }

    const videoTemplates = [
      {
        name: 'Vídeo de Produto Cinematográfico',
        description:
          'Take dinâmico com iluminação de estúdio comercial, close-up em detalhes e transição suave.',
        category: 'video',
        template_text:
          'Vídeo cinematográfico profissional em 4K exibindo {produto}. Câmera em rotação lenta orbital 360°, iluminação dramática de estúdio com rim light suave, foco nítido nos detalhes e texturas de {material}. Paleta de cores em {paleta}, movimento fluido a 60fps com atmosfera {atmosfera}.',
        placeholders: ['produto', 'material', 'paleta', 'atmosfera'],
        is_favorite: true,
      },
      {
        name: 'Depoimento / Review em Primeira Pessoa (UGC)',
        description:
          'Estilo criador de conteúdo realista segurando o celular, tom autêntico e cenário acolhedor.',
        category: 'video',
        template_text:
          'Vídeo estilo UGC realista em primeira pessoa de {perfil_criador} gravando com smartphone em {cenario}. Expressão genuína de entusiasmo ao demonstrar {produto_ou_servico}, iluminação natural de janela, enquadramento vertical com movimento sutil de câmera portátil e transição para {resultado_alcancado}.',
        placeholders: ['perfil_criador', 'cenario', 'produto_ou_servico', 'resultado_alcancado'],
        is_favorite: true,
      },
      {
        name: 'Storytelling Emocional & Transformação',
        description:
          'Narrativa visual mostrando o antes e depois, superação de obstáculo e vitória.',
        category: 'video',
        template_text:
          'Sequência narrativa com estética cinematográfica retratando {protagonista} enfrentando {desafio_inicial}. Plano aberto com atmosfera reflexiva e iluminação {clima_luz}, evoluindo para um momento de descoberta com {virada_de_chave}, culminando em celebração confiante e sensação de {emocao_final}.',
        placeholders: [
          'protagonista',
          'desafio_inicial',
          'clima_luz',
          'virada_de_chave',
          'emocao_final',
        ],
        is_favorite: false,
      },
      {
        name: 'Tutorial Passo a Passo Rápido (Hands-on)',
        description:
          'Visão superior ou over-the-shoulder mostrando a execução prática com ritmo acelerado.',
        category: 'video',
        template_text:
          'Vídeo tutorial dinâmico e didático com visão over-the-shoulder em {ambiente}. Mãos ágeis demonstrando como {acao_pratica} usando {ferramenta_ou_recurso}. Iluminação clean e moderna, cortes rítmicos, foco macro na tela ou bancada destacando o passo {passo_chave}.',
        placeholders: ['ambiente', 'acao_pratica', 'ferramenta_ou_recurso', 'passo_chave'],
        is_favorite: false,
      },
      {
        name: 'Trending Format / Gancho Visual de Alto Impacto',
        description:
          'Abertura explosiva nos primeiros 2 segundos para prender a atenção no feed e reels.',
        category: 'video',
        template_text:
          'Cena de abertura hiper-dinâmica nos primeiros 2 segundos: zoom-in veloz em {objeto_ou_rosto} com quebra de expectativa sobre {tema_polemico}. Estética {estilo_visual}, cores vibrantes e iluminação neon contrastante, câmera com dolly zoom vertiginoso.',
        placeholders: ['objeto_ou_rosto', 'tema_polemico', 'estilo_visual'],
        is_favorite: true,
      },
      {
        name: 'Teaser de Lançamento / Revelação de Marca',
        description:
          'Clima de mistério com sombras, feixes de luz e revelação triunfal do novo projeto.',
        category: 'video',
        template_text:
          'Teaser publicitário premium com atmosfera misteriosa. Feixes volumétricos de luz cortando a penumbra para revelar silhueta de {nome_lancamento}. Movimento de câmera lento e ascendente, partículas de {efeito_particulas} no ar, culminando em clarão elegante com estética {estilo_marca}.',
        placeholders: ['nome_lancamento', 'efeito_particulas', 'estilo_marca'],
        is_favorite: false,
      },
    ]

    for (const tmpl of videoTemplates) {
      try {
        const record = new Record(collection)
        record.set('name', tmpl.name)
        record.set('description', tmpl.description)
        record.set('category', tmpl.category)
        record.set('template_text', tmpl.template_text)
        record.set('placeholders', tmpl.placeholders)
        record.set('is_favorite', tmpl.is_favorite)
        app.save(record)
      } catch (err) {
        console.warn('Falha ao inserir template de vídeo seed:', tmpl.name, err)
      }
    }
  },
  (app) => {
    try {
      const records = app.findRecordsByFilter(
        'studio_prompt_templates',
        'category = "video"',
        '-created',
        50,
      )
      for (const r of records) {
        app.delete(r)
      }
    } catch {
      // rollback silencioso
    }
  },
)
