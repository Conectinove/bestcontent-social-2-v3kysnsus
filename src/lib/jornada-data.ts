import type { Mission, Achievement, RankingUser } from '@/types/gamification'

export const INITIAL_MISSIONS: Mission[] = [
  {
    id: 'm1',
    title: 'Agende 3 posts',
    description: 'Programe 3 posts no calendário editorial',
    xpReward: 30,
    current: 1,
    target: 3,
    type: 'weekly',
    link: '/app/calendar',
    completed: false,
  },
  {
    id: 'm2',
    title: 'Crie 5 posts',
    description: 'Crie 5 novos posts na plataforma',
    xpReward: 50,
    current: 3,
    target: 5,
    type: 'weekly',
    link: '/app/content/new',
    completed: false,
  },
  {
    id: 'm3',
    title: 'Salve 2 inspirações',
    description: 'Salve 2 trends da página Descobrir',
    xpReward: 15,
    current: 1,
    target: 2,
    type: 'weekly',
    link: '/app/discover',
    completed: false,
  },
  {
    id: 'm4',
    title: 'Crie um calendário editorial com IA',
    description: 'Use o assistente de IA para planejar seu mês',
    xpReward: 100,
    current: 0,
    target: 1,
    type: 'monthly',
    link: '/app/calendar',
    completed: false,
  },
  {
    id: 'm5',
    title: 'Indique 4 amigos',
    description: 'Convide 4 amigos para a plataforma',
    xpReward: 200,
    current: 1,
    target: 4,
    type: 'monthly',
    link: '/app/settings',
    completed: false,
  },
]

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'a1',
    title: 'Primeiro Post',
    description: 'Crie seu primeiro post',
    icon: '🎯',
    unlocked: true,
    date: '15/07/2026',
  },
  {
    id: 'a2',
    title: 'Em Chamas',
    description: 'Mantenha 7 dias de ofensiva',
    icon: '🔥',
    unlocked: false,
  },
  {
    id: 'a3',
    title: 'Criador de Conteúdo',
    description: 'Crie 50 posts',
    icon: '✨',
    unlocked: true,
    date: '28/07/2026',
  },
  {
    id: 'a4',
    title: 'Influenciador',
    description: 'Alcance o nível Intermediário',
    icon: '⭐',
    unlocked: false,
  },
  {
    id: 'a5',
    title: 'Mestre da IA',
    description: 'Use a IA 10 vezes',
    icon: '🤖',
    unlocked: true,
    date: '20/07/2026',
  },
  { id: 'a6', title: 'Connector', description: 'Indique 5 amigos', icon: '🤝', unlocked: false },
]

const FIRST_NAMES = [
  'Ana',
  'Bruno',
  'Carla',
  'Diego',
  'Eva',
  'Felipe',
  'Gabi',
  'Henrique',
  'Iris',
  'João',
  'Lara',
  'Marcos',
  'Nina',
  'Otávio',
  'Paula',
  'Rafael',
  'Sara',
  'Tiago',
  'Uma',
  'Vinícius',
]
const LAST_NAMES = [
  'Costa',
  'Lima',
  'Dias',
  'Souza',
  'Martins',
  'Alves',
  'Rocha',
  'Dias',
  'Castro',
  'Pedro',
  'Mendes',
  'Vieira',
  'Ribeiro',
  'Pinto',
  'Gomes',
  'Cardoso',
  'Nunes',
  'Barbosa',
  'Teixeira',
  'Cruz',
]

export function generateRanking(): RankingUser[] {
  const users: RankingUser[] = []
  const levels = ['Iniciante', 'Intermediário', 'Avançado', 'Expert']

  users.push({
    position: 1,
    name: 'Você',
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=me',
    xp: 65,
    level: 'Iniciante',
  })

  for (let i = 0; i < 99; i++) {
    const first = FIRST_NAMES[i % FIRST_NAMES.length]
    const last = LAST_NAMES[i % LAST_NAMES.length]
    const suffix = i >= FIRST_NAMES.length ? ` ${Math.floor(i / FIRST_NAMES.length) + 1}` : ''
    const name = `${first} ${last}${suffix}`
    const xp = Math.max(60 - i, 5)
    const levelIdx = Math.min(Math.floor(xp / 20), 3)
    const gender = i % 2 === 0 ? 'male' : 'female'

    users.push({
      position: i + 2,
      name,
      avatar: `https://img.usecurling.com/ppl/thumbnail?gender=${gender}&seed=${i + 10}`,
      xp,
      level: levels[levelIdx] || 'Iniciante',
    })
  }

  return users
}
