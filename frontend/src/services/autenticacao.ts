export type Student = {
  id: number
  nome: string
  email: string
  uf: string | null
  criado_em: string
}

export type AuthSession = {
  access_token: string
  token_type: 'bearer'
  expires_in: number
  estudante: Student
}

export type RegisterPayload = {
  nome: string
  email: string
  senha: string
  uf?: string
}

export type AreaCode = 'MT' | 'CN' | 'CH' | 'LC' | 'RED'

export type GoalArea = {
  sigla: AreaCode
  nome: string
  nota_alvo: number
  peso: number
}

export type Goal = {
  id: number
  curso: string
  nota_corte: number | null
  data_prova: string | null
  criado_em: string
  areas: GoalArea[]
}

export type GoalPayload = {
  curso: string
  nota_corte: number | null
  data_prova: string | null
  areas: { sigla: AreaCode; nota_alvo: number; peso: number }[]
}

export type Simulation = {
  id: number
  realizado_em: string
  descricao: string | null
  criado_em: string
  notas: Record<AreaCode, number>
}

export type SimulationPayload = {
  realizado_em: string
  descricao?: string | null
  notas: Record<AreaCode, number>
}

export type PerformanceArea = {
  sigla: AreaCode
  nome: string
  nota_atual: number | null
  nota_alvo: number | null
  peso: number | null
  media_referencia: number | null
  diferenca_referencia: number | null
  diferenca_meta: number | null
  ganho_necessario: number | null
  prioridade: number | null
}

export type StudentPerformance = {
  meta: Goal | null
  simulado_atual: {
    id: number
    realizado_em: string
    descricao: string | null
    criado_em: string
    nota_media: number | null
  } | null
  referencia: {
    disponivel: boolean
    ano: number | null
    uf: string | null
    abrangencia: 'estadual' | 'nacional' | null
    participantes: number | null
    mensagem: string | null
  }
  areas: PerformanceArea[]
  ranking_prioridades: {
    sigla: AreaCode
    nome: string
    prioridade: number
    nota_atual: number
    nota_alvo: number
    peso: number
    ganho_necessario: number
  }[]
}

export type WeekdayCode = 'SEG' | 'TER' | 'QUA' | 'QUI' | 'SEX' | 'SAB' | 'DOM'

export type WeeklyPlanPayload = {
  semana_inicio?: string
  horas_semanais: number
  dias_disponiveis: WeekdayCode[]
  horario_inicio: string
}

export type PlanContent = {
  id: string
  tipo: string | null
  titulo: string
  url: string | null
  fonte: string | null
  detalhe: string | null
}

export type PlanSession = {
  id: number
  data: string
  dia_semana: WeekdayCode
  horario_inicio: string
  horas: number
  area_sigla: AreaCode
  area_nome: string
  topico_id: number | null
  topico_nome: string | null
  prioridade: number
  conteudo: PlanContent | null
}

export type WeeklyPlan = {
  id: number
  semana_inicio: string
  semana_fim: string
  horas_semanais: number
  criado_em: string
  conteudos_disponiveis: boolean
  mensagem_conteudos: string | null
  sessoes: PlanSession[]
}

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

const STORAGE_KEY = 'rotaenem.auth-session'
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '')

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    })
  } catch {
    throw new Error('Não foi possível acessar a API. Confira se o Back-End está em execução.')
  }

  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const detail = typeof body === 'object' && body !== null && 'detail' in body
      ? body.detail
      : null

    if (response.status === 401) throw new ApiError('E-mail ou senha inválidos.', response.status)
    if (response.status === 409 && path === '/auth/register') throw new ApiError('Este e-mail já está cadastrado. Faça login.', response.status)
    if (response.status === 503) throw new ApiError('Serviço indisponível. Confira a conexão com o Back-End e o banco.', response.status)
    if (response.status >= 500 && path.startsWith('/planos/')) throw new ApiError('Não foi possível carregar o plano. Confira se a migration do plano semanal foi aplicada no PostgreSQL.', response.status)
    if (Array.isArray(detail)) throw new ApiError('Confira os campos informados e tente novamente.', response.status)
    if (typeof detail === 'string') throw new ApiError(detail, response.status)
    throw new ApiError('Não foi possível concluir a solicitação. Tente novamente.', response.status)
  }

  return body as T
}

export function registerStudent(payload: RegisterPayload): Promise<Student> {
  return request<Student>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function loginStudent(email: string, senha: string): Promise<AuthSession> {
  return request<AuthSession>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, senha }),
  })
}

export function getAuthenticatedStudent(token: string): Promise<Student> {
  return request<Student>('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function getCurrentGoal(token: string): Promise<Goal | null> {
  try {
    return await request<Goal>('/metas/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

export function saveCurrentGoal(token: string, payload: GoalPayload): Promise<Goal> {
  return request<Goal>('/metas/me', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
}

export function getSimulations(token: string): Promise<Simulation[]> {
  return request<Simulation[]>('/simulados?limit=100', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export function getStudentPerformance(token: string): Promise<StudentPerformance> {
  return request<StudentPerformance>('/desempenho/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function getWeeklyPlan(token: string, weekStart?: string): Promise<WeeklyPlan | null> {
  const query = weekStart ? `?semana_inicio=${encodeURIComponent(weekStart)}` : ''
  try {
    return await request<WeeklyPlan>(`/planos/me${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

export function generateWeeklyPlan(token: string, payload: WeeklyPlanPayload): Promise<WeeklyPlan> {
  return request<WeeklyPlan>('/planos/me/gerar', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
}

export function createSimulation(token: string, payload: SimulationPayload): Promise<Simulation> {
  return request<Simulation>('/simulados', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
}

export function readStoredSession(): AuthSession | null {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (
      typeof value === 'object' && value !== null &&
      'access_token' in value && typeof value.access_token === 'string' &&
      'estudante' in value && typeof value.estudante === 'object' && value.estudante !== null
    ) {
      return value as AuthSession
    }
  } catch {
    // Uma sessão local inválida é descartada e o usuário volta para o login.
  }
  return null
}

export function storeSession(session: AuthSession): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearStoredSession(): void {
  window.localStorage.removeItem(STORAGE_KEY)
}
