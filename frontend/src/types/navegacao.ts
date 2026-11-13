export type Page = 'inicio' | 'desempenho' | 'plano' | 'meta'

export type StudyArea = {
  sigla: 'MT' | 'CN' | 'CH' | 'LC' | 'RED'
  name: string
  short: string
  goal: number
  color: string
  icon: string
}
