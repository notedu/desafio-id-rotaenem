import type { Page, StudyArea } from '../tipos/navegacao'

export const navItems: { id: Page; label: string; icon: string }[] = [
  { id: 'inicio', label: 'Início', icon: 'grid' },
  { id: 'desempenho', label: 'Meu desempenho', icon: 'chart' },
  { id: 'plano', label: 'Plano de estudos', icon: 'book' },
  { id: 'meta', label: 'Minha meta', icon: 'target' },
]

export const areas: StudyArea[] = [
  { name: 'Matemática', short: 'MAT', score: 560, goal: 700, color: '#4568dc', icon: '∑' },
  { name: 'Ciências da Natureza', short: 'NAT', score: 590, goal: 680, color: '#18a886', icon: '⚛' },
  { name: 'Ciências Humanas', short: 'HUM', score: 640, goal: 670, color: '#e69b35', icon: '◈' },
  { name: 'Linguagens', short: 'LIN', score: 640, goal: 650, color: '#8b63cf', icon: 'Aa' },
  { name: 'Redação', short: 'RED', score: 780, goal: 800, color: '#e26d73', icon: '✎' },
]

export const studySessions = [
  { day: 'Segunda', time: '09:00', duration: '1h 30min', subject: 'Matemática', topic: 'Função quadrática', color: 'blue' },
  { day: 'Segunda', time: '14:00', duration: '1h 30min', subject: 'Ciências da Natureza', topic: 'Estequiometria', color: 'green' },
  { day: 'Terça', time: '10:00', duration: '1h', subject: 'Redação', topic: 'Competência 2: repertório sociocultural', color: 'coral' },
  { day: 'Quarta', time: '09:00', duration: '1h 30min', subject: 'Matemática', topic: 'Geometria plana', color: 'blue' },
  { day: 'Quinta', time: '14:00', duration: '1h 30min', subject: 'Ciências da Natureza', topic: 'Ecologia e impactos ambientais', color: 'green' },
  { day: 'Sexta', time: '10:00', duration: '1h', subject: 'Linguagens', topic: 'Interpretação de texto', color: 'purple' },
]
