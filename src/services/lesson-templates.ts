import type { SecondBrainModule, SecondBrainDocType } from './second-brain'

export type LessonTemplateCategory =
  | 'aula'
  | 'plano_aula'
  | 'laboratorio'
  | 'resumo'
  | 'estudo'
  | 'prompt'
  | 'plano_conteudo'
  | 'roteiro_conteudo'
  | 'checklist'
  | 'tutorial'
  | 'quiz'
  | 'video'
  | 'videoaula'

export interface LessonTemplate {
  id: string
  title: string
  subtitle: string
  category: LessonTemplateCategory
  badge: string
  suggestedDuration: string
  description: string
  docType?: SecondBrainDocType
  modules: SecondBrainModule[]
}
export const LESSON_TEMPLATES_DATA: LessonTemplate[] = [
  {
    id: 'plano-aula-completo',
    title: 'Plano de Aula Completo (Metodologia Ativa)',
    subtitle: 'Estrutura pedagógica completa: contextualização, conceitos, prática e síntese',
    category: 'aula',
    badge: 'Mais Utilizado',
    suggestedDuration: '50-60 min',
    description:
      'Template guiado para aulas expositivas e dinâmicas com verificação contínua de aprendizagem.',
    modules: [
      {
        id: 'mod-1',
        title: 'Módulo 1: Contextualização e Provocação Inicial',
        description: 'Desperte a atenção dos alunos com um problema real e objetivos claros.',
        blocks: [
          {
            id: 'blk-1-1',
            type: 'title',
            content: 'Tema da Aula e Impacto no Mundo Real',
            caption: 'Ex: Como a Inteligência Artificial Transforma a Gestão de Mídias',
          },
          {
            id: 'blk-1-2',
            type: 'paragraph',
            content:
              'Apresente o contexto: qual problema clássico resolveremos hoje e por que essa habilidade é essencial para o mercado atual.',
          },
          {
            id: 'blk-1-3',
            type: 'list',
            content:
              'Objetivos de Aprendizagem:\n[ ] Compreender os fundamentos essenciais\n[ ] Analisar um estudo de caso real\n[ ] Executar um exercício guiado em aula',
          },
        ],
      },
      {
        id: 'mod-2',
        title: 'Módulo 2: Núcleo Conceitual e Casos Práticos',
        description: 'Fundamentos teóricos explicados de forma direta com exemplos práticos.',
        blocks: [
          {
            id: 'blk-2-1',
            type: 'title',
            content: 'Fundamentos e Pilares Estratégicos',
          },
          {
            id: 'blk-2-2',
            type: 'paragraph',
            content:
              'Apresente o pilar central: definições simples, analogias didáticas e demonstração visual.',
          },
          {
            id: 'blk-2-3',
            type: 'code',
            content:
              '// Exemplo prático / Template conceitual\nconst resultado = executarMetodo({ foco: "clareza", impacto: 10 })',
          },
        ],
      },
      {
        id: 'mod-3',
        title: 'Módulo 3: Fixação e Verificação Imediata',
        description: 'Checagem de retenção para garantir que a turma absorveu o conteúdo.',
        blocks: [
          {
            id: 'blk-3-1',
            type: 'quiz',
            content:
              'Pergunta de Fixação:\nQual é o primeiro passo para aplicar o método com sucesso?\n(A) Pular o planejamento\n(B) Mapear o contexto e os objetivos claros\n(C) Delegar sem instrução\n* Resposta correta: B',
          },
          {
            id: 'blk-3-2',
            type: 'paragraph',
            content:
              'Síntese final: 3 principais lições para levar para o dia a dia e próximos passos da jornada.',
          },
        ],
      },
    ],
  },
  {
    id: 'aula-pratica-laboratorio',
    title: 'Aula Prática / Laboratório Hands-On',
    subtitle: 'Roteiro de bancada com objetivos, insumos, passo a passo e checklist de entrega',
    category: 'laboratorio',
    badge: 'Laboratório Interativo',
    suggestedDuration: '45-90 min',
    description:
      'Ideal para oficinas de código, experimentação com IA, montagem de criativos e laboratórios CTlabs.',
    modules: [
      {
        id: 'lab-mod-1',
        title: 'Preparação: Objetivos e Pré-requisitos',
        description: 'Tudo o que o aluno precisa ter em mãos antes de iniciar a prática.',
        blocks: [
          {
            id: 'lab-blk-1',
            type: 'title',
            content: 'Laboratório Prático: Desafio e Missão',
          },
          {
            id: 'lab-blk-2',
            type: 'paragraph',
            content:
              'Neste laboratório, cada participante construirá um artefato funcional do zero com validação em tempo real.',
          },
          {
            id: 'lab-blk-3',
            type: 'list',
            content:
              'Pré-requisitos da Bancada:\n[ ] Ambiente virtual ou IDE configurada\n[ ] Acesso à base de dados ou APIs de teste\n[ ] Terminal aberto e dependências instaladas',
          },
        ],
      },
      {
        id: 'lab-mod-2',
        title: 'Execução: Passo a Passo Guiado',
        description: 'Etapas ordenadas com critérios claros de sucesso em cada uma.',
        blocks: [
          {
            id: 'lab-blk-4',
            type: 'paragraph',
            content:
              'Passo 1: Configure as variáveis iniciais e selecione os dados oficiais do briefing.',
          },
          {
            id: 'lab-blk-5',
            type: 'code',
            content:
              'PASSO 2: Injetar prompt de comando pedagógico\nPROMPT: "Gere uma solução estruturada com foco em alta conversão e tom educacional."',
          },
          {
            id: 'lab-blk-6',
            type: 'paragraph',
            content:
              'Passo 3: Validação do artefato gerado na aba aula.html ou pré-visualização ao vivo.',
          },
        ],
      },
      {
        id: 'lab-mod-3',
        title: 'Conclusão e Critérios de Avaliação',
        description: 'Rubrica objetiva para aprovação e autoavaliação.',
        blocks: [
          {
            id: 'tut-blk-2',
            type: 'list',
            content:
              'Checklist do Passo 1:\n[ ] Verificação do ambiente\n[ ] Configuração do arquivo de entrada\n[ ] Validação inicial de rede',
          },
        ],
      },
    ],
  },
  {
    id: 'resumo-executivo-microlearning',
    title: 'Resumo Executivo / Microlearning (Flash Aula)',
    subtitle: 'Conteúdo direto ao ponto em 3 minutos para profissionais atarefados',
    category: 'resumo',
    badge: 'Microlearning',
    suggestedDuration: '10-15 min',
    description:
      'Condensado de alto impacto com destaques em bullet points, takeaways essenciais e ação imediata.',
    modules: [
      {
        id: 'res-mod-1',
        title: 'Módulo Único: Pílula de Conhecimento Rápida',
        description: 'Tudo o que você precisa saber resumido com precisão cirúrgica.',
        blocks: [
          {
            id: 'res-blk-1',
            type: 'title',
            content: 'Takeaway Central: O Que Mudou e Por Que Importa',
          },
          {
            id: 'res-blk-2',
            type: 'paragraph',
            content:
              'Em poucas palavras: a nova abordagem elimina 70% do retrabalho ao conectar diretamente os dados do Segundo Cérebro às gerações criativas.',
          },
          {
            id: 'vid-blk-2',
            type: 'list',
            content:
              'Checklist Técnico de Gravação:\n[ ] Microfone configurado e testado\n[ ] Iluminação de 3 pontos ajustada\n[ ] Roteiro no teleprompter ou guia de tópicos à mão',
          },
        ],
      },
    ],
  },
  {
    id: 'tutorial-passo-a-passo',
    title: 'Tutorial Passo a Passo (How-To Operacional)',
    subtitle: 'Roteiro de procedimentos para dominar uma ferramenta ou processo',
    category: 'tutorial',
    badge: 'Passo a Passo',
    suggestedDuration: '25-35 min',
    description:
      'Estrutura com capturas conceituais, dicas de armadilhas comuns e atalhos de produtividade.',
    modules: [
      {
        id: 'tut-mod-1',
        title: 'Etapa 1: Visão Geral e Setup',
        description: 'Configuração do ambiente e primeiros passos.',
        blocks: [
          {
            id: 'tut-blk-1',
            type: 'title',
            content: 'Como Executar o Fluxo Completo do Zero',
          },
          {
            id: 'tut-blk-2',
            type: 'paragraph',
            content:
              'Siga este tutorial passo a passo para obter resultados consistentes logo na primeira tentativa.',
          },
        ],
      },
      {
        id: 'tut-mod-2',
        title: 'Etapa 2: Ação e Dicas Práticas',
        description: 'Procedimento detalhado.',
        blocks: [
          {
            id: 'tut-blk-3',
            type: 'paragraph',
            content:
              'Dica de Ouro: Sempre valide os dados oficiais antes de disparar o prompt para economizar créditos e evitar alucinações.',
          },
          {
            id: 'tut-blk-4',
            type: 'code',
            content: '# Comando de checklist\nverificar_conectores --modo usuario --status ativo',
          },
        ],
      },
    ],
  },
  {
    id: 'quiz-fixacao-gamificado',
    title: 'Quiz de Fixação & Avaliação Diagnóstica',
    subtitle: 'Bateria de perguntas interativas com justificativas pedagógicas de resposta',
    category: 'quiz',
    badge: 'Gamificado',
    suggestedDuration: '15-20 min',
    description:
      'Perguntas de múltipla escolha com gabarito comentado para aferir domínio de conceitos-chave.',
    modules: [
      {
        id: 'quiz-mod-1',
        title: 'Rodada 1: Fundamentos e Cenários',
        description: 'Perguntas conceituais de aplicação imediata.',
        blocks: [
          {
            id: 'q-blk-1',
            type: 'title',
            content: 'Desafio de Conhecimento: Avaliação Diagnóstica',
          },
          {
            id: 'q-blk-2',
            type: 'quiz',
            content:
              'Questão 1:\nQual conector é ideal para importar briefings institucionais de equipes corporativas?\n(A) Apenas redes sociais\n(B) Outlook, OneDrive e SharePoint integrados\n(C) Nenhum, tudo manual\n* Resposta correta: B',
          },
          {
            id: 'q-blk-3',
            type: 'quiz',
            content:
              'Questão 2:\nQual o benefício de aplicar templates pedagógicos prontos?\n(A) Perda de flexibilidade\n(B) Padronização de alta qualidade e economia de tempo em 1 clique\n(C) Exclusividade para programadores\n* Resposta correta: B',
          },
        ],
      },
    ],
  },
  {
    id: 'roteiro-video-aula',
    title: 'Roteiro de Vídeo-Aula (Script para Câmera)',
    subtitle: 'Estrutura em 3 atos: Gancho (Hook), Conteúdo Central e Chamada para Ação',
    category: 'video',
    badge: 'Gravação / Roteiro',
    suggestedDuration: '5-12 min',
    description:
      'Perfeito para professores e criadores que gravam aulas em vídeo com teleprompter ou slides.',
    modules: [
      {
        id: 'vid-mod-1',
        title: 'Ato 1: Gancho Inicial (Primeiros 30 segundos)',
        description: 'Prenda a atenção da audiência antes que ela troque de aba.',
        blocks: [
          {
            id: 'vid-blk-1',
            type: 'title',
            content: '[CÂMERA ABERTA] Gancho de Abertura',
          },
          {
            id: 'vid-blk-2',
            type: 'paragraph',
            content:
              '"Se você perde horas organizando materiais de aula espalhados em dezenas de pastas, pare tudo agora. Hoje você vai ver como o Segundo Cérebro faz isso em segundos."',
          },
        ],
      },
      {
        id: 'vid-mod-2',
        title: 'Ato 2: Demonstração e Compartilhamento de Tela',
        description: 'Desenvolvimento do conteúdo principal com comandos claros.',
        blocks: [
          {
            id: 'vid-blk-3',
            type: 'paragraph',
            content:
              '[COMPARTILHAR TELA] Mostrar a importação dos e-mails e arquivos da nuvem e como a IA estrutura a aula automaticamente.',
          },
        ],
      },
      {
        id: 'vid-mod-3',
        title: 'Ato 3: Fechamento e CTA Poderoso',
        description: 'Encerramento que convida para a prática.',
        blocks: [
          {
            id: 'vid-blk-4',
            type: 'paragraph',
            content:
              '[CÂMERA FECHADA] "Abra o seu Segundo Cérebro agora mesmo, clique em Templates de Aula e escolha o seu modelo. Te vejo na próxima aula!"',
          },
        ],
      },
    ],
  },
  {
    id: 'nota-de-estudo',
    title: 'Nota de Estudo Estruturada',
    subtitle: 'Anotação de estudo com objetivos, conceitos-chave, dúvidas e revisão espaçada',
    category: 'estudo',
    badge: 'Nota de Estudo',
    suggestedDuration: '15-30 min',
    description:
      'Estrutura de anotação para registrar aprendizados com resumo, conexões e revisão posterior.',
    docType: 'nota_privada',
    modules: [
      {
        id: 'est-mod-1',
        title: 'Sessão de Estudo: Objetivos e Contexto',
        description: 'O que será estudado, por quê e com qual meta.',
        blocks: [
          {
            id: 'est-blk-1',
            type: 'title',
            content: 'Tema do Estudo e Meta da Sessão',
            caption: 'Ex: Fundamentos de métricas de engajamento',
          },
          {
            id: 'est-blk-2',
            type: 'list',
            content:
              'Objetivos da Sessão:\n[ ] Entender os conceitos centrais\n[ ] Relacionar com um caso prático\n[ ] Registrar 3 dúvidas para aprofundar',
          },
          {
            id: 'est-blk-3',
            type: 'paragraph',
            content:
              'Fonte do estudo: material, aula, artigo ou vídeo usado como base desta anotação.',
          },
        ],
      },
      {
        id: 'est-mod-2',
        title: 'Conceitos-Chave e Anotações',
        description: 'O essencial da sessão, com as suas palavras.',
        blocks: [
          {
            id: 'est-blk-4',
            type: 'paragraph',
            content:
              'Conceitos-chave: escreva cada conceito com as suas próprias palavras — reescrever fixa melhor do que copiar.',
          },
          {
            id: 'est-blk-5',
            type: 'list',
            content:
              'Dúvidas e Pontos a Revisar:\n[ ] Dúvida 1\n[ ] Dúvida 2\n[ ] Conceito que ainda precisa de exemplo',
          },
        ],
      },
      {
        id: 'est-mod-3',
        title: 'Revisão e Próximos Passos',
        description: 'Fechamento com síntese e agendamento da revisão.',
        blocks: [
          {
            id: 'est-blk-6',
            type: 'paragraph',
            content:
              'Síntese em 1 frase: resuma a lição mais importante da sessão — se não couber em uma frase, revise o conteúdo.',
          },
          {
            id: 'est-blk-7',
            type: 'quiz',
            content:
              'Autoverificação:\nConsegue explicar o conceito central sem consultar a fonte?\n(A) Sim, com segurança\n(B) Parcialmente\n(C) Ainda não\n* Se B ou C: agende a revisão em 48h (revisão espaçada).',
          },
        ],
      },
    ],
  },
  {
    id: 'prompt-estruturado',
    title: 'Prompt Estruturado (Biblioteca de Prompts)',
    subtitle: 'Prompt reutilizável com papel, contexto, tarefa, formato e restrições',
    category: 'prompt',
    badge: 'Biblioteca de Prompts',
    suggestedDuration: '5-10 min',
    description:
      'Template de prompt profissional para registrar e padronizar os prompts que a equipe mais usa.',
    docType: 'documento',
    modules: [
      {
        id: 'prm-mod-1',
        title: 'Estrutura do Prompt (R-C-T-F-R)',
        description: 'Os cinco componentes de um prompt consistente e reutilizável.',
        blocks: [
          {
            id: 'prm-blk-1',
            type: 'title',
            content: 'Nome do Prompt e Objetivo',
            caption: 'Ex: Gerador de legendas para posts de lançamento',
          },
          {
            id: 'prm-blk-2',
            type: 'paragraph',
            content:
              'Papel: "Aja como um especialista em [área] com experiência em [contexto do negócio]."',
          },
          {
            id: 'prm-blk-3',
            type: 'paragraph',
            content:
              'Contexto: descreva o cenário, o público e os dados que a IA precisa considerar antes de responder.',
          },
        ],
      },
      {
        id: 'prm-mod-2',
        title: 'Tarefa, Formato e Restrições',
        description: 'O que a IA deve entregar, em que forma e dentro de quais limites.',
        blocks: [
          {
            id: 'prm-blk-4',
            type: 'paragraph',
            content:
              'Tarefa: "Produza [entregável] focado em [resultado esperado], com tom [tom de voz]."',
          },
          {
            id: 'prm-blk-5',
            type: 'code',
            content:
              'FORMATO DA RESPOSTA:\n- Estrutura: título + 3 seções\n- Extensão: máx. 200 palavras\n- Restrições: sem jargões, sem promessas exageradas',
          },
        ],
      },
      {
        id: 'prm-mod-3',
        title: 'Exemplos e Registro de Uso',
        description: 'Variações testadas e onde o prompt funciona melhor.',
        blocks: [
          {
            id: 'prm-blk-6',
            type: 'list',
            content:
              'Exemplos de entrada/saída:\n[ ] Exemplo 1 (funcionou bem)\n[ ] Exemplo 2 (precisou de ajuste)\n[ ] O que mudar na próxima versão',
          },
        ],
      },
    ],
  },
  {
    id: 'plano-de-conteudo',
    title: 'Plano de Conteúdo (Semanal/Mensal)',
    subtitle: 'Calendário editorial com pilares, pautas, formatos e canais de publicação',
    category: 'plano_conteudo',
    badge: 'Planejamento',
    suggestedDuration: '30-60 min',
    description:
      'Organiza o que será publicado, onde e quando — com pilares temáticos e responsáveis.',
    docType: 'documento',
    modules: [
      {
        id: 'plc-mod-1',
        title: 'Pilares e Objetivos do Período',
        description: 'Os eixos temáticos que guiam toda a produção.',
        blocks: [
          {
            id: 'plc-blk-1',
            type: 'title',
            content: 'Plano de Conteúdo: Período e Objetivo Central',
            caption: 'Ex: Semana 12 — Lançamento do novo serviço',
          },
          {
            id: 'plc-blk-2',
            type: 'list',
            content:
              'Pilares de Conteúdo:\n[ ] Educação (autoridade)\n[ ] Bastidores (conexão)\n[ ] Prova social (conversão)\n[ ] Oferta (venda)',
          },
        ],
      },
      {
        id: 'plc-mod-2',
        title: 'Pauta por Canal e Formato',
        description: 'Distribuição do conteúdo entre redes e formatos.',
        blocks: [
          {
            id: 'plc-blk-3',
            type: 'list',
            content:
              'Grade de Publicação:\n[ ] Segunda — Feed (educativo)\n[ ] Quarta — Reels/Stories (bastidores)\n[ ] Sexta — Carrossel (prova social)',
          },
          {
            id: 'plc-blk-4',
            type: 'paragraph',
            content:
              'Para cada pauta: tema, formato, rede, referência visual e responsável pela produção.',
          },
        ],
      },
      {
        id: 'plc-mod-3',
        title: 'Acompanhamento e Ajustes',
        description: 'Métricas que definem se o plano está funcionando.',
        blocks: [
          {
            id: 'plc-blk-5',
            type: 'paragraph',
            content:
              'Ao fim do período: o que performou acima da média, o que ficou abaixo e o ajuste para o próximo ciclo.',
          },
        ],
      },
    ],
  },
  {
    id: 'resumo-de-estudo',
    title: 'Resumo de Estudo / Leitura',
    subtitle: 'Síntese de material de leitura com destaques, insights e aplicações práticas',
    category: 'resumo',
    badge: 'Resumo de Estudo',
    suggestedDuration: '10-20 min',
    description:
      'Transforma leituras longas em resumos acionáveis com citações, insights e plano de aplicação.',
    docType: 'nota_privada',
    modules: [
      {
        id: 'rst-mod-1',
        title: 'Ficha da Leitura',
        description: 'Identificação da fonte e do propósito do resumo.',
        blocks: [
          {
            id: 'rst-blk-1',
            type: 'title',
            content: 'Título da Obra/Material e Autor',
          },
          {
            id: 'rst-blk-2',
            type: 'paragraph',
            content:
              'Por que ler / assistir: qual problema prático este material promete resolver.',
          },
        ],
      },
      {
        id: 'rst-mod-2',
        title: 'Destaques e Insights',
        description: 'O que vale registrar — com as palavras do leitor.',
        blocks: [
          {
            id: 'rst-blk-3',
            type: 'list',
            content:
              'Destaques:\n[ ] Citação ou dado marcante\n[ ] Conceito que mudou a visão\n[ ] Contra-ponto (com o que discordar)',
          },
          {
            id: 'rst-blk-4',
            type: 'paragraph',
            content:
              'Insight principal: a ideia que, se aplicada, muda um resultado concreto do dia a dia.',
          },
        ],
      },
      {
        id: 'rst-mod-3',
        title: 'Aplicação Prática',
        description: 'Do resumo à ação.',
        blocks: [
          {
            id: 'rst-blk-5',
            type: 'list',
            content:
              'Plano de Aplicação:\n[ ] Ação imediata (esta semana)\n[ ] Experimento (este mês)\n[ ] O que compartilhar com a equipe',
          },
        ],
      },
    ],
  },
  {
    id: 'roteiro-de-conteudo',
    title: 'Roteiro de Conteúdo (Vídeo Curto/Reels)',
    subtitle: 'Script de vídeo curto com gancho, desenvolvimento e CTA em menos de 60 segundos',
    category: 'roteiro_conteudo',
    badge: 'Roteiro de Conteúdo',
    suggestedDuration: '3-8 min',
    description:
      'Estrutura de script para vídeos verticais de redes sociais, com marcações de cena e corte.',
    docType: 'documento',
    modules: [
      {
        id: 'rtc-mod-1',
        title: 'Gancho (0-3s)',
        description: 'Os 3 segundos que decidem se o vídeo é assistido.',
        blocks: [
          {
            id: 'rtc-blk-1',
            type: 'title',
            content: '[CENA 1] Gancho de Interrupção',
            caption: 'Fale a dor ou promessa principal na primeira frase',
          },
          {
            id: 'rtc-blk-2',
            type: 'paragraph',
            content:
              'Texto do gancho: "Se você [problema do público], esse vídeo é pra você." Alternativas: pergunta provocativa, dado impactante, erro comum.',
          },
        ],
      },
      {
        id: 'rtc-mod-2',
        title: 'Desenvolvimento (3-45s)',
        description: 'Entrega do valor em passos rápidos e visuais.',
        blocks: [
          {
            id: 'rtc-blk-3',
            type: 'list',
            content:
              'Beats do conteúdo:\n[ ] Beat 1: contexto mínimo (1 frase)\n[ ] Beat 2: passo principal demonstrado\n[ ] Beat 3: passo secundário ou prova',
          },
          {
            id: 'rtc-blk-4',
            type: 'paragraph',
            content:
              '[MARCAÇÃO DE CORTE] A cada beat, trocar ângulo/plano para manter retenção. Texto na tela: palavra-chave do beat.',
          },
        ],
      },
      {
        id: 'rtc-mod-3',
        title: 'CTA e Legenda',
        description: 'Fechamento com ação e legenda pronta para publicar.',
        blocks: [
          {
            id: 'rtc-blk-5',
            type: 'paragraph',
            content:
              '[CTA] "Comenta [palavra-chave] que eu te mando o material" ou "Salva esse vídeo pra não esquecer".',
          },
        ],
      },
    ],
  },
  {
    id: 'checklist-de-producao',
    title: 'Checklist de Produção de Conteúdo',
    subtitle: 'Checklist operacional do briefing à publicação, com responsáveis e prazos',
    category: 'checklist',
    badge: 'Checklist',
    suggestedDuration: '5-15 min',
    description:
      'Garante que nenhuma etapa da produção seja esquecida — do briefing à análise pós-publicação.',
    docType: 'documento',
    modules: [
      {
        id: 'chk-mod-1',
        title: 'Pré-Produção',
        description: 'Tudo o que precisa estar definido antes de produzir.',
        blocks: [
          {
            id: 'chk-blk-1',
            type: 'title',
            content: 'Checklist: [Nome da Peça/Campanha]',
          },
          {
            id: 'chk-blk-2',
            type: 'list',
            content:
              'Pré-Produção:\n[ ] Briefing aprovado pelo cliente\n[ ] Referências visuais selecionadas\n[ ] Copy revisada (tom de voz da marca)\n[ ] Prazo e responsável definidos',
          },
        ],
      },
      {
        id: 'chk-mod-2',
        title: 'Produção e Revisão',
        description: 'Execução, revisão cruzada e aprovação.',
        blocks: [
          {
            id: 'chk-blk-3',
            type: 'list',
            content:
              'Produção:\n[ ] Arte/mídia finalizada em todos os formatos\n[ ] Revisão ortográfica e de links\n[ ] Aprovação do cliente registrada',
          },
        ],
      },
      {
        id: 'chk-mod-3',
        title: 'Publicação e Pós',
        description: 'Publicar, monitorar e aprender.',
        blocks: [
          {
            id: 'chk-blk-4',
            type: 'list',
            content:
              'Publicação:\n[ ] Agendamento conferido (data/hora/rede)\n[ ] Primeiras respostas monitoradas em 1h\n[ ] Métricas registradas em 48h\n[ ] Lição registrada no Segundo Cérebro',
          },
        ],
      },
    ],
  },
]
