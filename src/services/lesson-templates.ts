import type { SecondBrainModule, SecondBrainDocType } from './second-brain'

export type LessonTemplateCategory =
  | 'aula'
  | 'plano_aula'
  | 'laboratorio'
  | 'resumo'
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
]
