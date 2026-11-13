import type { Page, StudyArea } from '../types/navegacao'

export const navItems: { id: Page; label: string; icon: string }[] = [
  { id: 'inicio', label: 'Início', icon: 'grid' },
  { id: 'desempenho', label: 'Meu desempenho', icon: 'chart' },
  { id: 'plano', label: 'Plano de estudos', icon: 'book' },
  { id: 'meta', label: 'Minha meta', icon: 'target' },
]

export const areas: StudyArea[] = [
  { sigla: 'MT', name: 'Matemática', short: 'MAT', goal: 700, color: '#4568dc', icon: '∑' },
  { sigla: 'CN', name: 'Ciências da Natureza', short: 'NAT', goal: 680, color: '#18a886', icon: '⚛' },
  { sigla: 'CH', name: 'Ciências Humanas', short: 'HUM', goal: 670, color: '#e69b35', icon: '◈' },
  { sigla: 'LC', name: 'Linguagens', short: 'LIN', goal: 650, color: '#8b63cf', icon: 'Aa' },
  { sigla: 'RED', name: 'Redação', short: 'RED', goal: 800, color: '#e26d73', icon: '✎' },
]
