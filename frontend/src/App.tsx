import { useEffect, useState } from 'react'
import './style-app.css'
import { AppShell } from './components/EstruturaAplicacao'
import { SimuladoModal } from './components/ModalSimulado'
import { Toast } from './components/Notificacao'
import { navItems } from './data/dadosEstudo'
import { AuthenticationPage, SessionLoading } from './pages/PaginaAutenticacao'
import { GoalPage } from './pages/PaginaMeta'
import { HomePage } from './pages/PaginaInicial'
import { PerformancePage } from './pages/PaginaDesempenho'
import { StudyPage } from './pages/PaginaPlanoEstudos'
import {
  clearStoredSession,
  createSimulation,
  getAuthenticatedStudent,
  getCurrentGoal,
  getSimulations,
  getStudentPerformance,
  getWeeklyPlan,
  generateWeeklyPlan,
  readStoredSession,
  saveCurrentGoal,
  storeSession,
  type AuthSession,
  type GoalPayload,
  type SimulationPayload,
  type StudentPerformance,
  type WeeklyPlan,
  type WeeklyPlanPayload,
  type WeekdayCode,
} from './services/autenticacao'
import type { Page } from './types/navegacao'

function App() {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [goal, setGoal] = useState<Awaited<ReturnType<typeof getCurrentGoal>>>(null)
  const [simulations, setSimulations] = useState<Awaited<ReturnType<typeof getSimulations>>>([])
  const [performance, setPerformance] = useState<StudentPerformance | null>(null)
  const [performanceError, setPerformanceError] = useState('')
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null)
  const [planLoading, setPlanLoading] = useState(false)
  const [planError, setPlanError] = useState('')
  const [studyDataLoading, setStudyDataLoading] = useState(false)
  const [studyDataError, setStudyDataError] = useState('')
  const [page, setPage] = useState<Page>('inicio')
  const [showSimulado, setShowSimulado] = useState(false)
  const [notice, setNotice] = useState('')
  const [studyDays, setStudyDays] = useState<WeekdayCode[]>(['SEG', 'TER', 'QUA', 'QUI', 'SEX'])
  const title = navItems.find((item) => item.id === page)?.label ?? 'Início'

  useEffect(() => {
    const storedSession = readStoredSession()
    if (!storedSession) {
      setCheckingSession(false)
      return
    }

    let active = true
    getAuthenticatedStudent(storedSession.access_token)
      .then((student) => {
        if (!active) return
        const refreshedSession = { ...storedSession, estudante: student }
        storeSession(refreshedSession)
        setSession(refreshedSession)
      })
      .catch(() => {
        if (!active) return
        clearStoredSession()
        setSession(null)
      })
      .finally(() => {
        if (active) setCheckingSession(false)
      })

    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!session) {
      setGoal(null)
      setSimulations([])
      setPerformance(null)
      setPerformanceError('')
      setWeeklyPlan(null)
      setPlanLoading(false)
      setPlanError('')
      setStudyDataLoading(false)
      setStudyDataError('')
      return
    }

    let active = true
    setStudyDataLoading(true)
    setStudyDataError('')
    setPlanLoading(true)
    setPlanError('')
    const performanceRequest = getStudentPerformance(session.access_token)
      .then((studentPerformance) => ({ data: studentPerformance, error: '' }))
      .catch((error: unknown) => ({
        data: null,
        error: error instanceof Error ? error.message : 'Não foi possível carregar seu desempenho.',
      }))
    const planRequest = getWeeklyPlan(session.access_token)
      .then((plan) => ({ data: plan, error: '' }))
      .catch((error: unknown) => ({
        data: null,
        error: error instanceof Error ? error.message : 'Não foi possível carregar seu plano semanal.',
      }))

    Promise.all([
      getCurrentGoal(session.access_token),
      getSimulations(session.access_token),
      performanceRequest,
      planRequest,
    ])
      .then(([currentGoal, currentSimulations, performanceResult, planResult]) => {
        if (!active) return
        setGoal(currentGoal)
        setSimulations(currentSimulations)
        setPerformance(performanceResult.data)
        setPerformanceError(performanceResult.error)
        setWeeklyPlan(planResult.data)
        setPlanError(planResult.error)
        if (planResult.data?.sessoes.length) {
          setStudyDays([...new Set(planResult.data.sessoes.map((item) => item.dia_semana))])
        }
      })
      .catch((error: unknown) => {
        if (!active) return
        setStudyDataError(error instanceof Error ? error.message : 'Não foi possível carregar seus dados.')
      })
      .finally(() => {
        if (active) setStudyDataLoading(false)
        if (active) setPlanLoading(false)
      })

    return () => { active = false }
  }, [session?.access_token])

  function handleAuthenticated(authSession: AuthSession) {
    storeSession(authSession)
    setSession(authSession)
  }

  function logout() {
    clearStoredSession()
    setSession(null)
    setWeeklyPlan(null)
    setPage('inicio')
    setNotice('')
  }

  function notify(message: string) {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 4000)
  }

  async function saveGoal(payload: GoalPayload) {
    if (!session) return
    const savedGoal = await saveCurrentGoal(session.access_token, payload)
    setGoal(savedGoal)
    setStudyDataError('')
    try {
      const updatedPerformance = await getStudentPerformance(session.access_token)
      setPerformance(updatedPerformance)
      setPerformanceError('')
    } catch (error) {
      setPerformanceError(error instanceof Error ? error.message : 'Não foi possível atualizar seu desempenho.')
    }
    notify('Sua meta foi salva.')
  }

  async function saveSimulado(payload: SimulationPayload) {
    if (!session) throw new Error('Entre novamente para registrar o simulado.')
    const savedSimulation = await createSimulation(session.access_token, payload)
    setSimulations((current) => [savedSimulation, ...current])
    setShowSimulado(false)
    try {
      const updatedPerformance = await getStudentPerformance(session.access_token)
      setPerformance(updatedPerformance)
      setPerformanceError('')
    } catch (error) {
      setPerformanceError(error instanceof Error ? error.message : 'Não foi possível atualizar seu desempenho.')
    }
    notify('Simulado salvo no seu histórico.')
  }

  async function createWeeklyPlan(payload: WeeklyPlanPayload) {
    if (!session) throw new Error('Entre novamente para gerar o plano semanal.')
    const savedPlan = await generateWeeklyPlan(session.access_token, payload)
    setWeeklyPlan(savedPlan)
    setPlanError('')
    setStudyDays(payload.dias_disponiveis)
    notify('Seu plano semanal foi gerado e salvo.')
  }

  if (checkingSession) return <SessionLoading />
  if (!session) return <AuthenticationPage onAuthenticated={handleAuthenticated} />

  return <>
    <AppShell
      page={page}
      title={title}
      studentName={session.estudante.nome}
      onNavigate={setPage}
      onLogout={logout}
    >
      {page === 'inicio' && <HomePage studentName={session.estudante.nome} goal={goal} simulations={simulations} performance={performance} weeklyPlan={weeklyPlan} loading={studyDataLoading || planLoading} error={performanceError || studyDataError} onNewSimulado={() => setShowSimulado(true)} onNavigate={setPage} />}
      {page === 'desempenho' && <PerformancePage goal={goal} simulations={simulations} performance={performance} loading={studyDataLoading} error={performanceError} onNewSimulado={() => setShowSimulado(true)} />}
      {page === 'plano' && <StudyPage plan={weeklyPlan} loading={planLoading} loadError={planError} studyDays={studyDays} setStudyDays={setStudyDays} onGenerate={createWeeklyPlan} />}
      {page === 'meta' && <GoalPage goal={goal} loading={studyDataLoading} loadError={studyDataError} onSave={saveGoal} />}
    </AppShell>
    <Toast message={notice} />
    {showSimulado && <SimuladoModal onClose={() => setShowSimulado(false)} onSubmit={saveSimulado} />}
  </>
}

export default App
